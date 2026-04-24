import { NextResponse } from 'next/server'
import { auth0 } from './auth0'

export type AuthUser = {
  sub: string
  email: string
  name: string
  roles: string[]
}

const ROLES_CLAIM = 'https://hearth.app/roles'

/**
 * Call at the top of every Route Handler that requires authentication.
 *
 * Reads the encrypted httpOnly session cookie via `@auth0/nextjs-auth0` v4.
 * The SDK has already verified the cookie's signature and expiry by the time
 * `auth0.getSession()` returns a value — a `null` return means the cookie was
 * missing, tampered with, or expired. There is no Bearer-token/audience flow
 * in this app; see `design_docs/ARCHITECTURE_OVERVIEW.md` §2.
 *
 * `roles` is sourced from the namespaced claim `https://hearth.app/roles`.
 * No post-login Action writes it today — the field is currently always `[]`.
 * The reader is kept as the hook for a future platform-admin gate.
 *
 * @throws {Response} 401 if no session is present.
 */
export async function requireAuth(): Promise<AuthUser> {
  const session = await auth0.getSession()

  if (!session?.user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const claimValue = session.user[ROLES_CLAIM]
  const roles: string[] = Array.isArray(claimValue)
    ? claimValue.filter((r): r is string => typeof r === 'string')
    : []

  return {
    sub: session.user.sub as string,
    email: session.user.email as string,
    name: session.user.name as string,
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
