import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SessionData } from '@auth0/nextjs-auth0/types'

vi.mock('@hearth/db', () => ({
  db: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

import { db } from '@hearth/db'
import { syncUser } from './user-sync'

const upsert = vi.mocked(db.user.upsert)

beforeEach(() => {
  upsert.mockReset()
  upsert.mockResolvedValue({} as never)
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

  it('returns the session unchanged so the SDK persists it as-is', async () => {
    const session = mkSession({
      sub: 'auth0|abc',
      email: 'a@b.com',
      name: 'A',
    })

    const returned = await syncUser(session)

    expect(returned).toBe(session)
  })

  it('propagates DB errors so a failed sync fails the login', async () => {
    upsert.mockRejectedValue(new Error('connection reset'))
    const session = mkSession({ sub: 'auth0|x', email: 'x@y.z', name: 'X' })

    await expect(syncUser(session)).rejects.toThrow('connection reset')
  })
})
