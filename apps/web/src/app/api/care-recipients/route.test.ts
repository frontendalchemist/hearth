import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse, type NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/onboarding', () => ({
  createFirstCareRecipient: vi.fn(),
}))

import { requireAuth } from '@/lib/auth'
import { createFirstCareRecipient } from '@/lib/onboarding'
import { POST } from './route'

const mockRequireAuth = vi.mocked(requireAuth)
const mockCreate = vi.mocked(createFirstCareRecipient)

const authedUser = {
  id: 'user_1',
  sub: 'auth0|abc',
  email: 'm@e.com',
  name: 'Margaret',
  locale: 'en',
  roles: [],
}

const validBody = {
  name: 'Margaret Smith',
  firstName: 'Eleanor',
  lastName: 'Smith',
  relationship: 'Mother',
  // ISO string — z.coerce.date() handles the parse on the server.
  dateOfBirth: '1945-06-15T00:00:00.000Z',
  zipCode: '94110',
  careStage: 'STAGE_2_SOME_HELP',
}

const buildRequest = (body: unknown): NextRequest =>
  new Request('http://localhost/api/care-recipients', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }) as unknown as NextRequest

beforeEach(() => {
  mockRequireAuth.mockReset()
  mockCreate.mockReset()
})

describe('POST /api/care-recipients', () => {
  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockRejectedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )

    const res = await POST(buildRequest(validBody))

    expect(res.status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when the body is not valid JSON', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)

    const res = await POST(buildRequest('not-json{'))

    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when the body fails schema validation', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)

    const res = await POST(
      buildRequest({ ...validBody, zipCode: 'not-a-zip' }),
    )

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid input')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 201 with the new recipient id on success', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)
    mockCreate.mockResolvedValue({ id: 'recipient_1' })

    const res = await POST(buildRequest(validBody))

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toEqual({ id: 'recipient_1' })
    expect(mockCreate).toHaveBeenCalledWith(
      'user_1',
      expect.objectContaining({
        name: 'Margaret Smith',
        firstName: 'Eleanor',
        lastName: 'Smith',
        relationship: 'Mother',
        zipCode: '94110',
        careStage: 'STAGE_2_SOME_HELP',
      }),
    )
  })

  it('coerces dateOfBirth from ISO string into a Date before calling the lib', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)
    mockCreate.mockResolvedValue({ id: 'recipient_1' })

    await POST(buildRequest(validBody))

    const [, input] = mockCreate.mock.calls[0]!
    expect(input.dateOfBirth).toBeInstanceOf(Date)
    expect(input.dateOfBirth.toISOString()).toBe('1945-06-15T00:00:00.000Z')
  })

  it('strips client-supplied role — it is never forwarded to the lib', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)
    mockCreate.mockResolvedValue({ id: 'recipient_1' })

    const malicious = { ...validBody, role: 'ADMIN' }
    const res = await POST(buildRequest(malicious))

    expect(res.status).toBe(201)
    const [, input] = mockCreate.mock.calls[0]!
    expect(input).not.toHaveProperty('role')
  })

  it('rethrows non-Response errors so they surface as 500s', async () => {
    mockRequireAuth.mockResolvedValue(authedUser)
    mockCreate.mockRejectedValue(new Error('db down'))

    await expect(POST(buildRequest(validBody))).rejects.toThrow('db down')
  })
})
