import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/data-erasure', () => ({ previewErasure: vi.fn() }))

import { requireAuth } from '@/lib/auth'
import { previewErasure } from '@/lib/data-erasure'
import { GET } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockPreview = vi.mocked(previewErasure)

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
  mockPreview.mockReset()
})

describe('GET /api/me/delete/preflight', () => {
  it('returns 401 when there is no session', async () => {
    mockRequireAuth.mockRejectedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
    )

    const res = await GET()

    expect(res.status).toBe(401)
    expect(mockPreview).not.toHaveBeenCalled()
  })

  it('returns the preview payload with no-store cache headers', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockPreview.mockResolvedValue({
      soleAdminWorkspaces: [
        {
          careRecipientId: 'cr-1',
          recipientName: 'Margaret Smith',
          members: [],
        },
      ],
    })

    const res = await GET()

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')

    const body = await res.json()
    expect(body.soleAdminWorkspaces).toHaveLength(1)
    expect(mockPreview).toHaveBeenCalledWith('u-1')
  })

  it('uses the session userId — never trusts a caller-supplied id', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockPreview.mockResolvedValue({ soleAdminWorkspaces: [] })

    await GET()

    expect(mockPreview).toHaveBeenCalledTimes(1)
    expect(mockPreview).toHaveBeenCalledWith('u-1')
  })

  it('propagates non-Response errors so 500s surface to Sentry', async () => {
    mockRequireAuth.mockResolvedValue(mockUser)
    mockPreview.mockRejectedValue(new Error('db down'))

    await expect(GET()).rejects.toThrow('db down')
  })
})
