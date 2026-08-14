import { db } from '@hearth/db'
import { CareStage, Role } from '@hearth/db'

export type CreateFirstCareRecipientInput = {
  // Caregiver name update — pre-filled from Auth0 in the wizard, often
  // edited before submit. Idempotent server-side: if the user didn't change
  // it, the row revision is a cheap no-op.
  name: string

  firstName: string
  lastName: string
  relationship: string
  dateOfBirth: Date
  zipCode: string
  careStage: CareStage
}

/**
 * True iff the user has at least one CareRecipientMembership. Drives the
 * onboarding gate in (dashboard)/layout.tsx — a user who soft-deleted their
 * only recipient should re-onboard, which the soft-delete extension on the
 * read here gives us automatically.
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const checkOnboard = await db.careRecipientMembership.findFirst({
    where: { userId },
    select: { id: true },
  })

  return checkOnboard?.id ? true : false
}

/**
 * Atomic onboarding write: updates the caregiver's name, creates the
 * CareRecipient row, creates the CareRecipientMembership pinning the
 * caregiver as ADMIN, and writes the HIPAA audit log row — all in one
 * transaction so a partial failure leaves nothing committed.
 *
 * `role: ADMIN` is hardcoded here on purpose — never read from the input.
 * Client-supplied roles are how privilege-escalation bugs are born.
 */
export async function createFirstCareRecipient(
  userId: string,
  input: CreateFirstCareRecipientInput,
): Promise<{ id: string }> {
  return db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { name: input.name },
    })

    const recipient = await tx.careRecipient.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        zipCode: input.zipCode,
        careStage: input.careStage,
      },
      select: { id: true },
    })

    await tx.careRecipientMembership.create({
      data: {
        userId,
        careRecipientId: recipient.id,
        role: Role.ADMIN,
        relationship: input.relationship,
      },
    })

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        resourceType: 'CareRecipient',
        resourceId: recipient.id,
      },
    })

    return { id: recipient.id }
  })
}
