import { requireAuth } from '@/lib/auth'
import { buildUserExport, exportFilename } from '@/lib/data-export'

// CCPA right-to-know — returns a JSON document of every row tied to the
// authenticated user. Strictly self-scoped: the userId comes from the
// session, never from a query param, so a user can only export their own
// data. Disposition forces a download instead of an in-browser render
// (which would cache the response, undesirable for personal data).
export async function GET() {
  try {
    const user = await requireAuth()
    const payload = await buildUserExport(user.id)
    const body = JSON.stringify(payload, null, 2)

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${exportFilename(user.id)}"`,
        // Personal data — never cache.
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}
