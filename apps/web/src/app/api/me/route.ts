import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    return Response.json({ sub: user.sub, email: user.email, name: user.name })
  } catch (thrown) {
    if (thrown instanceof Response) return thrown
    throw thrown
  }
}
