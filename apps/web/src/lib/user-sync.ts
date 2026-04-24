import type { SessionData } from '@auth0/nextjs-auth0/types'
import { db } from '@hearth/db'

/**
 * `beforeSessionSaved` hook for the Auth0 v4 SDK. Runs on every callback and
 * token refresh, right before the encrypted session cookie is written.
 *
 * Upserts a `User` row keyed by `auth0Sub` so every authenticated request has
 * a DB record to join against (memberships, audit logs, uploaded documents,
 * etc.). Idempotent — on subsequent logins it refreshes `email`/`name`/
 * `avatarUrl` in case the user updated them at the IdP.
 *
 * Errors are intentionally not caught. If the DB is unreachable at login
 * time, the login fails — this matches how every other Postgres-backed path
 * in the app behaves and avoids leaving the session cookie in a state where
 * `requireAuth()` would immediately 401 on the next request.
 */
export async function syncUser(session: SessionData): Promise<SessionData> {
  const { sub, email, name, picture } = session.user

  if (!email) {
    // Auth0 scope `openid profile email` is the SDK default; a missing claim
    // means the connection is misconfigured. Failing closed is safer than
    // writing a row with a blank email that would collide on the next login.
    throw new Error(`Auth0 session for sub=${sub} is missing required email claim`)
  }

  const data = {
    email,
    name: name ?? email,
    avatarUrl: typeof picture === 'string' ? picture : null,
  }

  // Runs on every login and every silent refresh. If Neon write QPS becomes
  // a concern, gate with a short-TTL Redis key (e.g. `user-synced:{sub}`,
  // 5-min TTL) and skip the upsert when the key is present.
  await db.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub, ...data },
    update: data,
  })

  return session
}
