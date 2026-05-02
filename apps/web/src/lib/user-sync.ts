import type { SessionData } from '@auth0/nextjs-auth0/types'
import { db } from '@hearth/db'
import { getRedis } from './redis'

const SYNC_TTL_SECONDS = 5 * 60

/**
 * Upserts the `User` row keyed by `auth0Sub`. Idempotent — refreshes
 * `email`/`name`/`avatarUrl` on every call so an IdP-side profile change
 * propagates on the next sync.
 *
 * Throws on missing email claim (failing closed beats writing a row with a
 * blank email that would collide on the next login) or any DB error.
 */
export async function syncUser(session: SessionData): Promise<void> {
  const { sub, email, name, picture } = session.user

  if (!email) {
    throw new Error(`Auth0 session for sub=${sub} is missing required email claim`)
  }

  const data = {
    email,
    name: name ?? email,
    avatarUrl: typeof picture === 'string' ? picture : null,
  }

  await db.user.upsert({
    where: { auth0Sub: sub },
    create: { auth0Sub: sub, ...data },
    update: data,
  })
}

/**
 * Redis-gated wrapper around `syncUser`. Skips the upsert when a TTL key for
 * this `sub` is already in Redis, so the bulk of authenticated requests pay
 * one Redis GET instead of a Postgres write.
 *
 * Why not run this from the Auth0 `beforeSessionSaved` hook: that hook fires
 * inside `auth0.middleware()`, which Next.js runs in the Edge Runtime. Prisma
 * cannot run on Edge without a driver adapter, so the DB write must happen in
 * a Node context. `requireAuth()` (the only caller) runs in Route Handlers
 * and Server Components, both of which are Node.
 *
 * Redis errors are non-fatal: a failed GET falls through to the upsert, and a
 * failed SET just means we re-sync on the next request.
 */
export async function ensureUserSynced(session: SessionData): Promise<void> {
  const sub = session.user.sub
  const key = `user-synced:${sub}`

  try {
    if ((await getRedis().get(key)) !== null) return
  } catch {
    // Redis is best-effort; fall through to the upsert.
  }

  await syncUser(session)

  try {
    await getRedis().set(key, '1', { ex: SYNC_TTL_SECONDS })
  } catch {
    // Failing to set the TTL just means we'll resync on the next request.
  }
}
