import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth0', () => ({
  auth0: {
    getSession: vi.fn(),
  },
}))

vi.mock('@hearth/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/user-sync', () => ({
  ensureUserSynced: vi.fn(),
}))

import { auth0 } from '@/lib/auth0'
import { db } from '@hearth/db'
import { ensureUserSynced } from '@/lib/user-sync'
import { GET } from './route'

const getSession = vi.mocked(auth0.getSession)
const findUnique = vi.mocked(db.user.findUnique)
const ensureSynced = vi.mocked(ensureUserSynced)

beforeEach(() => {
  getSession.mockReset()
  findUnique.mockReset()
  ensureSynced.mockReset()
  ensureSynced.mockResolvedValue(undefined)
})

describe('GET /api/me', () => {
  it('returns 401 when there is no session', async () => {
    getSession.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(ensureSynced).not.toHaveBeenCalled()
    expect(findUnique).not.toHaveBeenCalled()
  })

  it('returns 401 when the session has no sub', async () => {
    getSession.mockResolvedValue({ user: undefined } as never)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns 401 when no matching User row exists', async () => {
    getSession.mockResolvedValue({
      user: { sub: 'auth0|missing', email: 'm@e.com', name: 'M' },
    } as never)
    findUnique.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    expect(ensureSynced).toHaveBeenCalledOnce()
  })

  it('returns 200 with the caller claims when authenticated', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'session@example.com',
        name: 'Session Name',
      },
    } as never)
    findUnique.mockResolvedValue({
      id: 'clxyz123',
      email: 'db@example.com',
      name: 'DB Name',
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      sub: 'auth0|abc123',
      email: 'db@example.com',
      name: 'DB Name',
    })
  })

  it('rethrows non-Response errors so they surface as 500s', async () => {
    getSession.mockRejectedValue(new Error('upstream blew up'))

    await expect(GET()).rejects.toThrow('upstream blew up')
  })
})
