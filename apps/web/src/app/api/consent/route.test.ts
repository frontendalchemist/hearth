import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/consent', async () => {
  // Keep the real readClientIp implementation — it's a pure header parser
  // and we want to assert that the IP makes it from the request to the DB
  // call without re-stubbing parser logic.
  const actual = await vi.importActual<typeof import('@/lib/consent')>(
    '@/lib/consent',
  )
  return {
    ...actual,
    recordRequiredConsents: vi.fn(),
  }
})

import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { recordRequiredConsents } from '@/lib/consent'
import { POST } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockRecord = vi.mocked(recordRequiredConsents)

const mockUser = {
  id: 'user-cuid-1',
  sub: 'auth0|abc',
  email: 'm@example.com',
  name: 'M',
  locale: 'en',
  roles: [],
}

beforeEach(() => {
  mockRequireAuth.mockReset()
  mockRecord.mockReset()
})

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/consent', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/consent', () => {
  it('returns 401 when requireAuth throws (no session)', async () => {
    mockRequireAuth.mockRejectedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )

    const res = await POST(makeRequest())

    expect(res.status).toBe(401)
    expect(mockRecord).not.toHaveBeenCalled()
  })

  it('records consents for the authenticated user with x-forwarded-for IP', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockRecord.mockResolvedValue(undefined)

    const res = await POST(
      makeRequest({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }),
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ ok: true })
    expect(mockRecord).toHaveBeenCalledWith('user-cuid-1', '203.0.113.7')
  })

  it('passes null IP when no forwarding header is set', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockRecord.mockResolvedValue(undefined)

    await POST(makeRequest())

    expect(mockRecord).toHaveBeenCalledWith('user-cuid-1', null)
  })

  it('propagates non-Response errors so 500s surface to Sentry', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockRecord.mockRejectedValue(new Error('connection reset'))

    await expect(POST(makeRequest())).rejects.toThrow('connection reset')
  })
})
