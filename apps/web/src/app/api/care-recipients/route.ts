import { NextResponse, type NextRequest } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { createFirstCareRecipient } from '@/lib/onboarding'
import { wizardSchema } from '@/app/onboarding/schema'

/**
 * Creates a CareRecipient for the authenticated user, pinning them as
 * ADMIN of the new workspace, and updates their User.name in the same
 * transaction (the onboarding wizard sends both because step 1 lets the
 * caregiver confirm/edit the name Auth0 returned).
 *
 * Body matches the onboarding wizard schema verbatim — see
 * apps/web/src/app/onboarding/schema.ts. `role` is *not* read from the
 * body; the server always sets ADMIN.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    const body = await req.json().catch(() => null)
    const parsed = wizardSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    const { id } = await createFirstCareRecipient(user.id, parsed.data)
    return NextResponse.json({ id }, { status: 201 })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}
