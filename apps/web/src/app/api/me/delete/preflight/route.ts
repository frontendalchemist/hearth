import { requireAuth } from '@/lib/auth'
import { previewErasure } from '@/lib/data-erasure'

// CCPA right-to-erasure preflight. Returns the workspaces the user must
// resolve (pick a successor or close) before POST /api/me/delete will
// accept their deletion. Strictly self-scoped — userId comes from the
// session.
export async function GET() {
  try {
    const user = await requireAuth()
    const preview = await previewErasure(user.id)
    return Response.json(preview, {
      headers: {
        // Personal data, mutates with workspace state — never cache.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}
