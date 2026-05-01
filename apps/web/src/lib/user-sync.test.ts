import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SessionData } from '@auth0/nextjs-auth0/types'

vi.mock('@hearth/db', () => ({
  db: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

const redisGet = vi.fn()
const redisSet = vi.fn()
vi.mock('./redis', () => ({
  getRedis: () => ({ get: redisGet, set: redisSet }),
}))

import { db } from '@hearth/db'
import { syncUser, ensureUserSynced } from './user-sync'

const upsert = vi.mocked(db.user.upsert)

beforeEach(() => {
  upsert.mockReset()
  upsert.mockResolvedValue({} as never)
  redisGet.mockReset()
  redisSet.mockReset()
})

const mkSession = (user: Partial<SessionData['user']> & { sub: string }): SessionData =>
  ({ user: user as SessionData['user'] }) as SessionData

describe('syncUser', () => {
  it('upserts the User row keyed on auth0Sub with all claims on first login', async () => {
    const session = mkSession({
      sub: 'auth0|new-user',
      email: 'margaret@example.com',
      name: 'Margaret',
      picture: 'https://cdn.auth0.com/avatars/mar.png',
    })

    await syncUser(session)

    expect(upsert).toHaveBeenCalledWith({
      where: { auth0Sub: 'auth0|new-user' },
      create: {
        auth0Sub: 'auth0|new-user',
        email: 'margaret@example.com',
        name: 'Margaret',
        avatarUrl: 'https://cdn.auth0.com/avatars/mar.png',
      },
      update: {
        email: 'margaret@example.com',
        name: 'Margaret',
        avatarUrl: 'https://cdn.auth0.com/avatars/mar.png',
      },
    })
  })

  it('refreshes email/name/avatarUrl on subsequent logins (update side)', async () => {
    // Shape of the call is identical; DB resolves update vs create by the where-clause hit.
    // This test documents that we pass the same fresh values to `update`.
    const session = mkSession({
      sub: 'auth0|existing',
      email: 'new-email@example.com',
      name: 'New Name',
      picture: 'https://cdn.auth0.com/avatars/new.png',
    })

    await syncUser(session)

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          email: 'new-email@example.com',
          name: 'New Name',
          avatarUrl: 'https://cdn.auth0.com/avatars/new.png',
        },
      }),
    )
  })

  it('stores avatarUrl as null when the picture claim is absent', async () => {
    const session = mkSession({
      sub: 'auth0|no-pic',
      email: 'user@example.com',
      name: 'User',
    })

    await syncUser(session)

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ avatarUrl: null }),
        update: expect.objectContaining({ avatarUrl: null }),
      }),
    )
  })

  it('falls back to email for name when the name claim is missing', async () => {
    const session = mkSession({
      sub: 'auth0|nameless',
      email: 'fallback@example.com',
    })

    await syncUser(session)

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ name: 'fallback@example.com' }),
      }),
    )
  })

  it('throws when the email claim is missing so a misconfigured connection fails loudly', async () => {
    const session = mkSession({ sub: 'auth0|no-email', name: 'No Email' })

    await expect(syncUser(session)).rejects.toThrow(/missing required email claim/)
    expect(upsert).not.toHaveBeenCalled()
  })

  it('propagates DB errors so a failed sync fails the login', async () => {
    upsert.mockRejectedValue(new Error('connection reset'))
    const session = mkSession({ sub: 'auth0|x', email: 'x@y.z', name: 'X' })

    await expect(syncUser(session)).rejects.toThrow('connection reset')
  })
})

describe('ensureUserSynced', () => {
  const session = mkSession({
    sub: 'auth0|cache-test',
    email: 'm@example.com',
    name: 'M',
  })

  it('skips the upsert when the Redis TTL key is present', async () => {
    redisGet.mockResolvedValue('1')

    await ensureUserSynced(session)

    expect(redisGet).toHaveBeenCalledWith('user-synced:auth0|cache-test')
    expect(upsert).not.toHaveBeenCalled()
    expect(redisSet).not.toHaveBeenCalled()
  })

  it('runs the upsert and sets a 5-minute TTL when no key is present', async () => {
    redisGet.mockResolvedValue(null)
    redisSet.mockResolvedValue('OK')

    await ensureUserSynced(session)

    expect(upsert).toHaveBeenCalledOnce()
    expect(redisSet).toHaveBeenCalledWith('user-synced:auth0|cache-test', '1', { ex: 300 })
  })

  it('falls through to the upsert when Redis GET fails (best-effort cache)', async () => {
    redisGet.mockRejectedValue(new Error('upstash unreachable'))
    redisSet.mockResolvedValue('OK')

    await ensureUserSynced(session)

    expect(upsert).toHaveBeenCalledOnce()
  })

  it('does not throw when Redis SET fails after a successful upsert', async () => {
    redisGet.mockResolvedValue(null)
    redisSet.mockRejectedValue(new Error('upstash unreachable'))

    await expect(ensureUserSynced(session)).resolves.toBeUndefined()
    expect(upsert).toHaveBeenCalledOnce()
  })

  it('propagates DB errors from syncUser so a failed sync fails the login', async () => {
    redisGet.mockResolvedValue(null)
    upsert.mockRejectedValue(new Error('connection reset'))

    await expect(ensureUserSynced(session)).rejects.toThrow('connection reset')
  })
})
