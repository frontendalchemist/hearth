import { createYoga } from 'graphql-yoga'
import { db } from '@hearth/db'
import { auth0 } from '@/lib/auth0'
import { ensureUserSynced } from '@/lib/user-sync'
import type { AuthUser } from '@/lib/auth'
import { schema, type GraphQLContext } from '@/lib/graphql/schema'

const ROLES_CLAIM = 'https://hearth.app/roles'

// graphql-yoga handler mounted at /api/graphql. The context is intentionally
// permissive about missing sessions — the resolver is the gatekeeper, not the
// transport. That keeps the schema self-contained (any future client, or an
// integration test exercising the schema directly, gets identical auth
// semantics) and avoids two divergent 401 responses (Yoga's "no session" vs
// the resolver's "unauthorized").
const { handleRequest } = createYoga<
  { params: Promise<Record<string, never>> },
  GraphQLContext
>({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response, Request },
  context: async (): Promise<GraphQLContext> => {
    // Dev-only bypass — mirrors requireAuth() so the GraphQL endpoint honors
    // DEV_AUTH_BYPASS too. Without this the page shell loads (its layout uses
    // requireAuth) but every data fetch 401s, since this context builds its
    // own ctx.user from the session instead of going through requireAuth.
    // NODE_ENV guard keeps it dead in production.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_AUTH_BYPASS === 'true'
    ) {
      const devUser = await db.user.findUnique({
        where: { email: 'admin@hearth.dev' },
        select: { id: true, email: true, name: true, locale: true },
      })
      if (devUser) {
        return {
          user: { ...devUser, sub: 'auth0|seed-admin-001', roles: [] },
        }
      }
    }

    const session = await auth0.getSession()
    if (!session?.user?.sub) return { user: null }

    await ensureUserSynced(session)

    const dbUser = await db.user.findUnique({
      where: { auth0Sub: session.user.sub },
      select: { id: true, email: true, name: true, locale: true },
    })
    if (!dbUser) return { user: null }

    const claimValue = session.user[ROLES_CLAIM]
    const roles: string[] = Array.isArray(claimValue)
      ? claimValue.filter((r): r is string => typeof r === 'string')
      : []

    const user: AuthUser = {
      id: dbUser.id,
      sub: session.user.sub,
      email: dbUser.email,
      name: dbUser.name,
      locale: dbUser.locale,
      roles,
    }
    return { user }
  },
})

// Wrap handleRequest in explicit functions so TS doesn't try to expose
// yoga's internal `@whatwg-node/server` types in the route's emitted .d.ts
// (TS2742). The wrapper is identity — Next.js calls these per HTTP method.
type RouteContext = { params: Promise<Record<string, never>> }

export async function GET(request: Request, ctx: RouteContext) {
  return handleRequest(request, ctx)
}
export async function POST(request: Request, ctx: RouteContext) {
  return handleRequest(request, ctx)
}
export async function OPTIONS(request: Request, ctx: RouteContext) {
  return handleRequest(request, ctx)
}
