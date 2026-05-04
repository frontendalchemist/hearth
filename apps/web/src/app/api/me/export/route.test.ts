import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/data-export', () => ({
  buildUserExport: vi.fn(),
  exportFilename: vi.fn(() => 'hearth-export-test.json'),
}))

import { requireAuth } from '@/lib/auth'
import { buildUserExport } from '@/lib/data-export'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockBuild = vi.mocked(buildUserExport)

const mockUser = {
  id: 'user-1',
  sub: 'auth0|x',
  email: 'm@e.com',
  name: 'M',
  locale: 'en',
  roles: [],
}

beforeEach(() => {
  mockRequireAuth.mockReset()
  mockBuild.mockReset()
})

describe('GET /api/me/export', () => {
  it('returns 401 when there is no session and never builds the payload', async () => {
    mockRequireAuth.mockRejectedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )

    const res = await GET()

    expect(res.status).toBe(401)
    expect(mockBuild).not.toHaveBeenCalled()
  })

  it('serves the export with download headers and a no-store cache policy', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockBuild.mockResolvedValue({
      exportedAt: '2026-05-03T14:00:00Z',
      schemaVersion: 1,
    } as never)

    const res = await GET()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/json')
    expect(res.headers.get('content-disposition')).toContain('attachment')
    expect(res.headers.get('content-disposition')).toContain(
      'hearth-export-test.json',
    )
    expect(res.headers.get('cache-control')).toBe('private, no-store')

    const body = await res.json()
    expect(body.schemaVersion).toBe(1)
  })

  it('builds the export scoped to the session user — never trusts a caller-supplied id', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockBuild.mockResolvedValue({} as never)

    await GET()

    expect(mockBuild).toHaveBeenCalledWith('user-1')
    // Sanity: the route handler takes no input, so there's no way for a
    // caller to ask for someone else's data. The auth result is the only
    // source of truth for the userId.
    expect(mockBuild).toHaveBeenCalledTimes(1)
  })

  it('propagates non-Response errors so 500s surface to Sentry', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockBuild.mockRejectedValue(new Error('db down'))

    await expect(GET()).rejects.toThrow('db down')
  })
})
