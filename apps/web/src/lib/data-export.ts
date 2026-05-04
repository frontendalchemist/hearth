import { db } from '@hearth/db'

// CCPA "right to know" payload. Bundles every row the requesting user has
// authored, owns, or has access to via membership. Soft-deleted rows are
// excluded — the soft-delete extension already filters them on every read,
// and they represent recovery state, not data the platform holds about
// the user. File contents are referenced by `s3Key` only; the user can
// download individual files through the existing presigned-URL endpoint.
export type UserDataExport = {
  exportedAt: string
  schemaVersion: 1
  user: Awaited<ReturnType<typeof loadUser>>
  memberships: Awaited<ReturnType<typeof loadMemberships>>
  careRecipients: Awaited<ReturnType<typeof loadCareRecipients>>
  agingPlan: Awaited<ReturnType<typeof loadAgingPlan>>
  consentRecords: Awaited<ReturnType<typeof loadConsentRecords>>
  alerts: Awaited<ReturnType<typeof loadAlerts>>
  aiConversations: Awaited<ReturnType<typeof loadAiConversations>>
  invitationsSent: Awaited<ReturnType<typeof loadInvitationsSent>>
  invitationsAccepted: Awaited<ReturnType<typeof loadInvitationsAccepted>>
  auditLog: Awaited<ReturnType<typeof loadAuditLog>>
}

export async function buildUserExport(
  userId: string,
): Promise<UserDataExport> {
  const memberships = await loadMemberships(userId)
  const careRecipientIds = memberships.map((m) => m.careRecipientId)

  // Parallel where it's safe — Postgres handles the fan-out fine and the
  // export endpoint is rare enough that we don't worry about connection
  // pressure. The caller awaits all of them.
  const [
    user,
    careRecipients,
    agingPlan,
    consentRecords,
    alerts,
    aiConversations,
    invitationsSent,
    invitationsAccepted,
    auditLog,
  ] = await Promise.all([
    loadUser(userId),
    loadCareRecipients(careRecipientIds),
    loadAgingPlan(userId),
    loadConsentRecords(userId),
    loadAlerts(userId),
    loadAiConversations(userId),
    loadInvitationsSent(userId),
    loadInvitationsAccepted(userId),
    loadAuditLog(userId),
  ])

  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 1,
    user,
    memberships,
    careRecipients,
    agingPlan,
    consentRecords,
    alerts,
    aiConversations,
    invitationsSent,
    invitationsAccepted,
    auditLog,
  }
}

function loadUser(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      auth0Sub: true,
      email: true,
      name: true,
      avatarUrl: true,
      locale: true,
      state: true,
      location: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

function loadMemberships(userId: string) {
  return db.careRecipientMembership.findMany({
    where: { userId },
    select: {
      id: true,
      careRecipientId: true,
      role: true,
      relationship: true,
      createdAt: true,
    },
  })
}

function loadCareRecipients(ids: string[]) {
  if (ids.length === 0) return Promise.resolve([])
  // The soft-delete extension auto-filters `deletedAt` on the top-level
  // CareRecipient, but does NOT cascade into included relations (Prisma
  // extension limitation per CLAUDE.md). Each soft-deletable include below
  // explicitly re-applies the filter.
  return db.careRecipient.findMany({
    where: { id: { in: ids } },
    include: {
      documents: { where: { deletedAt: null } },
      documentContacts: true,
      medications: { where: { deletedAt: null } },
      conditions: true,
      allergies: true,
      providers: { where: { deletedAt: null } },
      appointments: true,
      screenings: true,
      tasks: { where: { deletedAt: null } },
      careLogEntries: true,
      stageAssessments: true,
      warningSignLogs: true,
      agingPlans: true,
    },
  })
}

function loadAgingPlan(userId: string) {
  return db.agingPlan.findUnique({
    where: { userId },
    include: {
      sections: true,
      journalEntries: true,
      advDirective: true,
    },
  })
}

function loadConsentRecords(userId: string) {
  return db.consentRecord.findMany({ where: { userId } })
}

function loadAlerts(userId: string) {
  return db.alert.findMany({ where: { userId } })
}

function loadAiConversations(userId: string) {
  return db.aiConversation.findMany({
    where: { userId },
    include: { messages: true },
  })
}

function loadInvitationsSent(userId: string) {
  return db.invitation.findMany({ where: { invitedById: userId } })
}

function loadInvitationsAccepted(userId: string) {
  return db.invitation.findMany({ where: { acceptedById: userId } })
}

function loadAuditLog(userId: string) {
  return db.auditLog.findMany({ where: { userId } })
}

// Build the Content-Disposition filename. Strips characters that would
// break the header on safari/firefox (anything outside [A-Za-z0-9-_]).
export function exportFilename(userId: string, now: Date = new Date()): string {
  const safeId = userId.replace(/[^A-Za-z0-9_-]/g, '')
  const date = now.toISOString().slice(0, 10)
  return `hearth-export-${safeId}-${date}.json`
}
