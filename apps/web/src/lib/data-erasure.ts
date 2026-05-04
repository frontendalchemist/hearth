import { createHash } from 'node:crypto'
import { db } from '@hearth/db'

// CCPA right-to-erasure for the requesting user. Strategy: anonymize-in-place.
// The User row stays (so FK references from third-party data — uploaded
// documents, audit-log rows, etc. — remain valid; HIPAA mandates audit
// continuity), but every PII field is scrambled and `deletedAt` is set.
//
// Workspaces (CareRecipient) where the deleting user is the *sole* Admin
// don't auto-resolve — the user picks a successor or closes the workspace
// via the preflight + resolutions flow. This avoids silent ownership
// handoffs that family members didn't consent to.

export type SoleAdminWorkspace = {
  careRecipientId: string
  recipientName: string
  members: Array<{
    membershipId: string
    userId: string
    name: string
    currentRole: 'ADMIN' | 'COORDINATOR' | 'VIEWER'
    suggestedSuccessor: boolean
  }>
}

export type ErasurePreview = {
  soleAdminWorkspaces: SoleAdminWorkspace[]
}

export type Resolution =
  | {
      careRecipientId: string
      action: 'promote'
      promotedMemberId: string
    }
  | {
      careRecipientId: string
      action: 'close'
    }

/**
 * Returns the workspaces the deleting user must resolve before erasure can
 * proceed. A workspace appears here iff the user is its *only* Admin.
 * If `soleAdminWorkspaces` is empty the UI can proceed straight to a
 * confirm dialog and POST `/api/me/delete` with `resolutions: []`.
 */
export async function previewErasure(userId: string): Promise<ErasurePreview> {
  // Pull every recipient where this user holds the Admin role.
  const adminMemberships = await db.careRecipientMembership.findMany({
    where: { userId, role: 'ADMIN' },
    select: { careRecipientId: true },
  })

  if (adminMemberships.length === 0) {
    return { soleAdminWorkspaces: [] }
  }

  const recipientIds = adminMemberships.map((m) => m.careRecipientId)

  // For each candidate workspace, load every membership (including this user
  // and other admins). We need the full set so we can:
  //   1. Filter out workspaces with another Admin (not sole-admin).
  //   2. Compute the suggested successor from the remaining members.
  const recipients = await db.careRecipient.findMany({
    where: { id: { in: recipientIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      memberships: {
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const soleAdminWorkspaces: SoleAdminWorkspace[] = []

  for (const recipient of recipients) {
    const adminCount = recipient.memberships.filter(
      (m) => m.role === 'ADMIN',
    ).length
    // Sole-admin gate: more than one Admin means the user can leave without
    // action — the workspace continues with the remaining Admin(s).
    if (adminCount > 1) continue

    const otherMembers = recipient.memberships.filter(
      (m) => m.userId !== userId,
    )
    const successorId = pickSuccessor(otherMembers)

    soleAdminWorkspaces.push({
      careRecipientId: recipient.id,
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      members: otherMembers.map((m) => ({
        membershipId: m.id,
        userId: m.userId,
        name: m.user.name,
        currentRole: m.role,
        suggestedSuccessor: m.id === successorId,
      })),
    })
  }

  return { soleAdminWorkspaces }
}

// Successor pick rule: a Coordinator (write access) is preferred over a
// Viewer (read-only) — minimizes role escalation. Within a tier, the
// longest-tenured member wins (presumably the most invested). Returns
// the membership id, or null if there are no other members at all.
function pickSuccessor(
  members: Array<{
    id: string
    role: 'ADMIN' | 'COORDINATOR' | 'VIEWER'
    createdAt: Date
  }>,
): string | null {
  if (members.length === 0) return null
  const coordinators = members.filter((m) => m.role === 'COORDINATOR')
  if (coordinators.length > 0) return coordinators[0]!.id
  // No coordinators left — fall through to the longest-tenured remaining
  // member regardless of role. (Members are pre-sorted by createdAt asc.)
  return members[0]!.id
}

export class ErasureValidationError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'MISSING_RESOLUTION'
      | 'STALE_RESOLUTION'
      | 'INVALID_PROMOTED_MEMBER'
      | 'ALREADY_ERASED',
  ) {
    super(message)
    this.name = 'ErasureValidationError'
  }
}

/**
 * Anonymizes the requesting user and applies the workspace resolutions in a
 * single transaction. Throws `ErasureValidationError` if the resolutions
 * don't cover every sole-admin workspace, or if a `promote` target is no
 * longer a valid member.
 *
 * Idempotent: a second call against an already-anonymized User returns
 * without changes (the underlying transaction short-circuits).
 */
export async function eraseUser(
  userId: string,
  resolutions: Resolution[],
): Promise<void> {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new ErasureValidationError('User not found', 'ALREADY_ERASED')
    }
    if (user.deletedAt) {
      // Idempotent — nothing else to do.
      return
    }

    // Re-derive sole-admin workspaces inside the transaction. Doing this
    // here (not trusting the caller's preflight result) closes the race
    // where a member was added/removed between preflight and submit.
    const adminMemberships = await tx.careRecipientMembership.findMany({
      where: { userId, role: 'ADMIN' },
      select: { careRecipientId: true },
    })

    const recipients = await tx.careRecipient.findMany({
      where: { id: { in: adminMemberships.map((m) => m.careRecipientId) } },
      select: {
        id: true,
        memberships: {
          select: { id: true, userId: true, role: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const soleAdminIds = new Set(
      recipients
        .filter(
          (r) => r.memberships.filter((m) => m.role === 'ADMIN').length === 1,
        )
        .map((r) => r.id),
    )

    const resolutionsByRecipient = new Map(
      resolutions.map((r) => [r.careRecipientId, r]),
    )

    // Every sole-admin workspace must have a resolution.
    for (const id of soleAdminIds) {
      if (!resolutionsByRecipient.has(id)) {
        throw new ErasureValidationError(
          `Missing resolution for sole-admin workspace ${id}`,
          'MISSING_RESOLUTION',
        )
      }
    }

    // Reject resolutions for workspaces that aren't actually sole-admin
    // (likely stale preflight — make the caller refetch).
    for (const r of resolutions) {
      if (!soleAdminIds.has(r.careRecipientId)) {
        throw new ErasureValidationError(
          `Workspace ${r.careRecipientId} is no longer sole-admin`,
          'STALE_RESOLUTION',
        )
      }
    }

    // Apply each resolution.
    for (const r of resolutions) {
      const recipient = recipients.find((x) => x.id === r.careRecipientId)!
      if (r.action === 'promote') {
        const target = recipient.memberships.find(
          (m) => m.userId === r.promotedMemberId && m.userId !== userId,
        )
        if (!target) {
          throw new ErasureValidationError(
            `Promoted member ${r.promotedMemberId} is not a member of workspace ${r.careRecipientId}`,
            'INVALID_PROMOTED_MEMBER',
          )
        }
        await tx.careRecipientMembership.update({
          where: { id: target.id },
          data: { role: 'ADMIN' },
        })
      } else {
        // Close the workspace (soft-delete). Other members lose access on
        // the next request — the soft-delete extension auto-filters reads.
        await tx.careRecipient.update({
          where: { id: r.careRecipientId },
          data: { deletedAt: new Date() },
        })
      }
    }

    // Hard-delete user-personal rows. Each of these tables is scoped to a
    // single user (no shared family workspace), so dropping them on erasure
    // is the right move.
    //   AiMessage cascades from AiConversation via schema (onDelete: Cascade).
    //   AgingPlanSection / WishesJournalEntry cascade from AgingPlan.
    //   AdvanceDirective: 1:1 with AgingPlan; cascades by FK.
    await tx.aiConversation.deleteMany({ where: { userId } })
    await tx.alert.deleteMany({ where: { userId } })
    await tx.agingPlan.deleteMany({ where: { userId } })

    // Drop memberships + document-permission rows. Schema has
    // onDelete: Cascade for both, but those fire only on a User delete; we
    // anonymize-in-place, so the cascade never triggers — clean them up
    // explicitly.
    await tx.careRecipientMembership.deleteMany({ where: { userId } })
    await tx.documentPermissionMember.deleteMany({ where: { userId } })

    // Anonymize the User row itself. PII fields get unique-but-meaningless
    // values so the unique constraints on email/auth0Sub still hold and a
    // future user signing up with the original email/sub doesn't collide.
    const subHash = createHash('sha256')
      .update(user.auth0Sub)
      .digest('hex')
      .slice(0, 16)
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@hearth-erased.local`,
        name: 'Deleted user',
        avatarUrl: null,
        auth0Sub: `deleted|${subHash}`,
        state: null,
        location: null,
        deletedAt: new Date(),
      },
    })

    // AuditLog explicitly: this is the legal record that the erasure
    // happened. AuditLog.userId is a soft pointer — keeping the original
    // userId here is correct (the row in User still exists, just anonymized).
    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        resourceType: 'User',
        resourceId: userId,
        metadata: {
          reason: 'CCPA_RIGHT_TO_ERASURE',
          resolutions: resolutions.map((r) =>
            r.action === 'promote'
              ? {
                  careRecipientId: r.careRecipientId,
                  action: 'promote',
                  promotedMemberId: r.promotedMemberId,
                }
              : { careRecipientId: r.careRecipientId, action: 'close' },
          ),
        },
      },
    })
  })
}
