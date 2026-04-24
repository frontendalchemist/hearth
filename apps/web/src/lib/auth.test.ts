import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./auth0', () => ({
  auth0: {
    getSession: vi.fn(),
  },
}))

import { auth0 } from './auth0'
import { requireAuth, hasRole, requireRole, type AuthUser } from './auth'

const getSession = vi.mocked(auth0.getSession)

beforeEach(() => {
  getSession.mockReset()
})

describe('requireAuth', () => {
  it('throws a 401 Response when the SDK returns no session', async () => {
    getSession.mockResolvedValue(null)

    await expect(requireAuth()).rejects.toSatisfy((thrown: unknown) => {
      return thrown instanceof Response && thrown.status === 401
    })
  })

  it('throws a 401 Response when the session has no user', async () => {
    // Shape the SDK returns after a tampered cookie is rejected: session
    // object exists in some code paths but .user is undefined.
    getSession.mockResolvedValue({ user: undefined } as never)

    await expect(requireAuth()).rejects.toSatisfy((thrown: unknown) => {
      return thrown instanceof Response && thrown.status === 401
    })
  })

  it('returns an AuthUser with empty roles when the roles claim is absent', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'margaret@example.com',
        name: 'Margaret',
      },
    } as never)

    const user = await requireAuth()

    expect(user).toEqual<AuthUser>({
      sub: 'auth0|abc123',
      email: 'margaret@example.com',
      name: 'Margaret',
      roles: [],
    })
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

    const user = await requireAuth()

    expect(user.roles).toEqual(['PLATFORM_ADMIN'])
  })

  it('ignores a non-array roles claim (defensive against a malformed Action)', async () => {
    getSession.mockResolvedValue({
      user: {
        sub: 'auth0|abc123',
        email: 'margaret@example.com',
        name: 'Margaret',
        'https://hearth.app/roles': 'PLATFORM_ADMIN',
      },
    } as never)

    const user = await requireAuth()

    expect(user.roles).toEqual([])
  })
})

describe('hasRole / requireRole', () => {
  const baseUser: AuthUser = {
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
