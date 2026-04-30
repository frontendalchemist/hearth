import { NextResponse } from 'next/server'
import { db } from '@hearth/db'
import { auth0 } from './auth0'

export type AuthUser = {
  /** DB cuid — use for all foreign keys (userId, uploadedById, etc.) */
  id: string
  /** Auth0 subject (e.g. `auth0|abc123`) — stable across logins */
  sub: string
  email: string
  name: string
  roles: string[]
}

const ROLES_CLAIM = 'https://hearth.app/roles'

/**
 * Call at the top of every Route Handler that requires authentication.
 *
 * Reads the encrypted httpOnly session cookie via `@auth0/nextjs-auth0` v4,
 * then loads the corresponding `User` row from Postgres. The DB row is
 * populated by the `beforeSessionSaved` hook in `./user-sync.ts` on every
 * login — a missing row here means the sync failed or the cookie was issued
 * by a different deployment, and either way the safe response is 401.
 *
 * `roles` is sourced from the namespaced claim `https://hearth.app/roles`.
 * No post-login Action writes it today — the field is currently always `[]`.
 * The reader is kept as the hook for a future platform-admin gate.
 *
 * @throws {Response} 401 if no session, or no matching User row.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth0.getSession()

  if (!session?.user?.sub) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { auth0Sub: session.user.sub },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const claimValue = session.user[ROLES_CLAIM]
  const roles: string[] = Array.isArray(claimValue)
    ? claimValue.filter((r): r is string => typeof r === 'string')
    : []

  return {
    id: user.id,
    sub: session.user.sub,
    email: user.email,
    name: user.name,
    roles,
  }
}

export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role)
}

export function requireRole(user: AuthUser, role: string): void {
  if (!hasRole(user, role)) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
