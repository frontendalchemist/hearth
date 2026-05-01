import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { Route } from 'next'
import type { SessionData } from '@auth0/nextjs-auth0/types'
import { db } from '@hearth/db'
import { auth0 } from './auth0'
import { ensureUserSynced } from './user-sync'

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
 * lazily syncs the corresponding `User` row via `ensureUserSynced` (gated by
 * a short Redis TTL so the upsert runs roughly once per session, not per
 * request), then loads the row from Postgres.
 *
 * The sync runs here — not in the SDK's `beforeSessionSaved` hook — because
 * that hook fires inside `auth0.middleware()`, which Next.js runs in the
 * Edge Runtime. Prisma needs a Node context, so the DB write must happen in
 * a Route Handler or Server Component, both of which call `requireAuth()`.
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

  await ensureUserSynced(session)

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

/**
 * Server Component / Server Page counterpart to `requireAuth()`. Use at the
 * top of any Server Component that requires authentication — typically the
 * `(dashboard)/layout.tsx` and any `page.tsx` rendered under it.
 *
 * Differs from `requireAuth()` in two ways:
 *   - On no session, calls `redirect('/auth/login')` (an HTTP 307 from the
 *     framework) instead of throwing a 401 Response. This is what users
 *     actually want from a page render — a 401 response in the body would
 *     just look broken.
 *   - Returns the raw `SessionData` rather than the loaded `AuthUser`, since
 *     layouts mostly need the cookie-side session shape and not the DB row.
 *     Callers that need the cuid should call `requireAuth()` instead.
 *
 * Always runs `ensureUserSynced` so any first-time login lands a `User` row
 * before downstream Server Components or Route Handlers read it.
 */
export async function requireSession(): Promise<SessionData> {
  const session = await auth0.getSession()
  if (!session) {
    redirect('/auth/login' as Route)
  }
  await ensureUserSynced(session)
  return session
}

export function hasRole(user: AuthUser, role: string): boolean {
  return user.roles.includes(role)
}

export function requireRole(user: AuthUser, role: string): void {
  if (!hasRole(user, role)) {
    throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
