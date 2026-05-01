import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((_url: string) => {
    // Mirror the real Next.js behaviour: redirect throws to halt rendering.
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('./auth0', () => ({
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

vi.mock('./user-sync', () => ({
  ensureUserSynced: vi.fn(),
}))

import { redirect } from 'next/navigation'
import { auth0 } from './auth0'
import { db } from '@hearth/db'
import { ensureUserSynced } from './user-sync'
import { requireAuth, requireSession, hasRole, requireRole, type AuthUser } from './auth'

const getSession = vi.mocked(auth0.getSession)
const findUnique = vi.mocked(db.user.findUnique)
const ensureSynced = vi.mocked(ensureUserSynced)
const mockRedirect = vi.mocked(redirect)

const mockDbUser = (overrides?: Partial<{ id: string; email: string; name: string }>) => ({
  id: 'clxyz123',
  email: 'margaret@example.com',
  name: 'Margaret',
  ...overrides,
})

beforeEach(() => {
  getSession.mockReset()
  findUnique.mockReset()
  ensureSynced.mockReset()
  ensureSynced.mockResolvedValue(undefined)
  mockRedirect.mockClear()
})

describe('requireAuth', () => {
  it('throws a 401 Response when the SDK returns no session', async () => {
    getSession.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toSatisfy((thrown: unknown) => {
      return thrown instanceof Response && thrown.status === 401
    })
  })

  it('throws a 401 Response when the session has no user', async () => {
    getSession.mockResolvedValue({ user: undefined } as never)

    await expect(requireAuth()).rejects.toSatisfy((thrown: unknown) => {
      return thrown instanceof Response && thrown.status === 401
    })
  })

  it('throws a 401 Response when the DB has no matching User row', async () => {
    getSession.mockResolvedValue({
      user: { sub: 'auth0|abc123', email: 'm@e.com', name: 'M' },
    } as never)
    findUnique.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toSatisfy((thrown: unknown) => {
      return thrown instanceof Response && thrown.status === 401
    })
  })

  it('returns an AuthUser with id from DB and empty roles when the claim is absent', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'margaret@example.com',
        name: 'Margaret',
      },
    } as never)
    findUnique.mockResolvedValue(mockDbUser() as never)

    const user = await requireAuth()

    expect(user).toEqual<AuthUser>({
      id: 'clxyz123',
      sub: 'auth0|abc123',
      email: 'margaret@example.com',
      name: 'Margaret',
      roles: [],
    })
  })

  it('prefers DB email/name over session values (DB is the persisted truth)', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'stale-session@example.com',
        name: 'Stale Session Name',
      },
    } as never)
    findUnique.mockResolvedValue(
      mockDbUser({ email: 'fresh-db@example.com', name: 'Fresh DB Name' }) as never,
    )

    const user = await requireAuth()

    expect(user.email).toBe('fresh-db@example.com')
    expect(user.name).toBe('Fresh DB Name')
  })

  it('reads roles from the namespaced claim when present', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|admin1',
        email: 'staff@hearth.app',
        name: 'Staff',
        'https://hearth.app/roles': ['PLATFORM_ADMIN'],
      },
    } as never)
    findUnique.mockResolvedValue(mockDbUser() as never)

    const user = await requireAuth()

    expect(user.roles).toEqual(['PLATFORM_ADMIN'])
  })

  it('ignores a non-array roles claim (defensive against a malformed Action)', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'm@e.com',
        name: 'M',
        'https://hearth.app/roles': 'PLATFORM_ADMIN',
      },
    } as never)
    findUnique.mockResolvedValue(mockDbUser() as never)

    const user = await requireAuth()

    expect(user.roles).toEqual([])
  })

  it('queries the DB using the session sub', async () => {
    getSession.mockResolvedValue({
      user: { sub: 'auth0|lookup-key', email: 'm@e.com', name: 'M' },
    } as never)
    findUnique.mockResolvedValue(mockDbUser() as never)

    await requireAuth()

    expect(findUnique).toHaveBeenCalledWith({
      where: { auth0Sub: 'auth0|lookup-key' },
      select: { id: true, email: true, name: true },
    })
  })

  it('runs ensureUserSynced before reading the DB so first-login users resolve', async () => {
    const session = {
      user: { sub: 'auth0|first-login', email: 'm@e.com', name: 'M' },
    }
    getSession.mockResolvedValue(session as never)

    const callOrder: string[] = []
    ensureSynced.mockImplementation(async () => {
      callOrder.push('sync')
    })
    findUnique.mockImplementation((async () => {
      callOrder.push('find')
      return mockDbUser()
    }) as never)

    await requireAuth()

    expect(ensureSynced).toHaveBeenCalledWith(session)
    expect(callOrder).toEqual(['sync', 'find'])
  })

  it('does not call ensureUserSynced when there is no session (no DB write on anonymous traffic)', async () => {
    getSession.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toBeInstanceOf(Response)
    expect(ensureSynced).not.toHaveBeenCalled()
  })

  it('propagates ensureUserSynced errors so a failed sync fails the login', async () => {
    getSession.mockResolvedValue({
      user: { sub: 'auth0|sync-fail', email: 'm@e.com', name: 'M' },
    } as never)
    ensureSynced.mockRejectedValue(new Error('connection reset'))

    await expect(requireAuth()).rejects.toThrow('connection reset')
    expect(findUnique).not.toHaveBeenCalled()
  })
})

describe('requireSession', () => {
  it('redirects to /auth/login when there is no session (no DB write on anonymous traffic)', async () => {
    getSession.mockResolvedValue(null)

    await expect(requireSession()).rejects.toThrow('NEXT_REDIRECT')
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    expect(ensureSynced).not.toHaveBeenCalled()
  })

  it('runs ensureUserSynced after the session check and returns the session', async () => {
    const session = { user: { sub: 'auth0|server-component' } }
    getSession.mockResolvedValue(session as never)

    const callOrder: string[] = []
    ensureSynced.mockImplementation(async () => {
      callOrder.push('sync')
    })

    const returned = await requireSession()

    expect(callOrder).toEqual(['sync'])
    expect(ensureSynced).toHaveBeenCalledWith(session)
    expect(returned).toBe(session)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('propagates ensureUserSynced errors so a Server Component render fails loudly', async () => {
    getSession.mockResolvedValue({ user: { sub: 'auth0|sync-fail' } } as never)
    ensureSynced.mockRejectedValue(new Error('connection reset'))

    await expect(requireSession()).rejects.toThrow('connection reset')
  })
})

describe('hasRole / requireRole', () => {
  const baseUser: AuthUser = {
    id: 'clxyz',
    sub: 'auth0|x',
    email: 'x@y.z',
    name: 'X',
    roles: ['PLATFORM_ADMIN'],
  }

  it('hasRole returns true when the role is present', () => {
    expect(hasRole(baseUser, 'PLATFORM_ADMIN')).toBe(true)
  })

  it('hasRole returns false when the role is absent', () => {
    expect(hasRole(baseUser, 'SUPPORT')).toBe(false)
  })

  it('requireRole returns void when the role is present', () => {
    expect(() => requireRole(baseUser, 'PLATFORM_ADMIN')).not.toThrow()
  })

  it('requireRole throws a 403 Response when the role is missing', () => {
    let thrown: unknown
    try {
      requireRole(baseUser, 'SUPPORT')
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(Response)
    expect((thrown as Response).status).toBe(403)
  })
})
