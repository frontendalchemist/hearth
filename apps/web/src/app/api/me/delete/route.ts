import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth'
import {
  ErasureValidationError,
  eraseUser,
  type Resolution,
} from '@/lib/data-erasure'

const ResolutionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('promote'),
    careRecipientId: z.string().min(1),
    promotedMemberId: z.string().min(1),
  }),
  z.object({
    action: z.literal('close'),
    careRecipientId: z.string().min(1),
  }),
])

const BodySchema = z.object({
  resolutions: z.array(ResolutionSchema).default([]),
})

// CCPA right-to-erasure — anonymizes the requesting user. Strictly
// self-scoped: the userId comes from the session, never the body. The
// caller supplies `resolutions` describing what to do with each workspace
// where they're the sole Admin (promote a successor or close the
// workspace); the helper rejects the call if any sole-admin workspace is
// unresolved or if a resolution is stale relative to current state.
//
// Response: 200 with `{ ok: true, logoutUrl }` on success — the client
// should navigate to logoutUrl to clear the Auth0 session cookie. The
// session won't survive once the user's auth0Sub is rewritten anyway,
// but explicit logout avoids a confusing in-between state.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()

    const parsed = BodySchema.safeParse(await readJson(req))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', issues: parsed.error.issues },
        { status: 400 },
      )
    }

    try {
      await eraseUser(user.id, parsed.data.resolutions as Resolution[])
    } catch (err) {
      if (err instanceof ErasureValidationError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 409 },
        )
      }
      throw err
    }

    return NextResponse.json({ ok: true, logoutUrl: '/auth/logout' })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    // Empty / non-JSON body — let zod's default `resolutions: []` handle
    // the no-resolution case so a UI without sole-admin workspaces can
    // POST an empty body.
    return {}
  }
}
