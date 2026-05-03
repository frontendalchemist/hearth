import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/data-erasure', async () => {
  const actual = await vi.importActual<typeof import('@/lib/data-erasure')>(
    '@/lib/data-erasure',
  )
  return {
    ...actual,
    eraseUser: vi.fn(),
  }
})

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { ErasureValidationError, eraseUser } from '@/lib/data-erasure'
import { POST } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockErase = vi.mocked(eraseUser)

const mockUser = {
  id: 'u-1',
  sub: 'auth0|x',
  email: 'm@e.com',
  name: 'M',
  locale: 'en',
  roles: [],
}

beforeEach(() => {
  mockRequireAuth.mockReset()
  mockErase.mockReset()
})

function makeRequest(body?: unknown) {
  return new NextRequest('http://localhost/api/me/delete', {
    method: 'POST',
    body: body === undefined ? null : JSON.stringify(body),
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/me/delete', () => {
  it('returns 401 when there is no session and never calls eraseUser', async () => {
    mockRequireAuth.mockRejectedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )

    const res = await POST(makeRequest({ resolutions: [] }))

    expect(res.status).toBe(401)
    expect(mockErase).not.toHaveBeenCalled()
  })

  it('accepts an empty body and treats resolutions as []', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockErase.mockResolvedValue(undefined)

    const res = await POST(makeRequest())

    expect(res.status).toBe(200)
    expect(mockErase).toHaveBeenCalledWith('u-1', [])
  })

  it('forwards parsed resolutions verbatim, scoped to the session userId', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockErase.mockResolvedValue(undefined)

    const resolutions = [
      {
        action: 'promote' as const,
        careRecipientId: 'cr-1',
        promotedMemberId: 'u-2',
      },
      { action: 'close' as const, careRecipientId: 'cr-2' },
    ]
    const res = await POST(makeRequest({ resolutions }))

    expect(res.status).toBe(200)
    expect(mockErase).toHaveBeenCalledWith('u-1', resolutions)
    await expect(res.json()).resolves.toEqual({
      ok: true,
      logoutUrl: '/auth/logout',
    })
  })

  it('returns 400 with zod issues when the body shape is wrong', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)

    const res = await POST(
      makeRequest({
        resolutions: [
          { action: 'promote', careRecipientId: 'cr-1' /* missing promotedMemberId */ },
        ],
      }),
    )

    expect(res.status).toBe(400)
    expect(mockErase).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.error).toBe('Invalid request body')
    expect(Array.isArray(body.issues)).toBe(true)
  })

  it('returns 409 with the validation code when eraseUser flags a mismatch', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockErase.mockRejectedValue(
      new ErasureValidationError(
        'Missing resolution for sole-admin workspace cr-1',
        'MISSING_RESOLUTION',
      ),
    )

    const res = await POST(makeRequest({ resolutions: [] }))

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe('MISSING_RESOLUTION')
  })

  it('propagates non-validation errors so 500s surface to Sentry', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockErase.mockRejectedValue(new Error('connection reset'))

    await expect(POST(makeRequest({ resolutions: [] }))).rejects.toThrow(
      'connection reset',
    )
  })
})
