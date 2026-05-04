import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hearth/db', () => ({
  db: {
    consentRecord: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}))

import { db } from '@hearth/db'
import {
  REQUIRED_CONSENTS,
  hasAcceptedAllRequired,
  readClientIp,
  recordRequiredConsents,
} from './consent'

const findMany = vi.mocked(db.consentRecord.findMany)
const createMany = vi.mocked(db.consentRecord.createMany)

beforeEach(() => {
  findMany.mockReset()
  createMany.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('hasAcceptedAllRequired', () => {
  it('returns true when every required (type, version) tuple has a row', async () => {
    findMany.mockResolvedValue(
      REQUIRED_CONSENTS.map(({ type, version }) => ({
        consentType: type,
        version,
      })) as never,
    )

    await expect(hasAcceptedAllRequired('user-1')).resolves.toBe(true)
  })

  it('returns false when even one required tuple is missing', async () => {
    findMany.mockResolvedValue(
      REQUIRED_CONSENTS.slice(1).map(({ type, version }) => ({
        consentType: type,
        version,
      })) as never,
    )

    await expect(hasAcceptedAllRequired('user-1')).resolves.toBe(false)
  })

  it('scopes the query to the userId and excludes revoked rows', async () => {
    findMany.mockResolvedValue([] as never)
    await hasAcceptedAllRequired('user-xyz')

    const call = findMany.mock.calls[0]?.[0] as
      | { where: Record<string, unknown> }
      | undefined
    expect(call?.where.userId).toBe('user-xyz')
    expect(call?.where.revokedAt).toBeNull()
  })

  it('returns true (no-op) when REQUIRED_CONSENTS is empty', async () => {
    // Sanity guard: if a future config zeros out the requirements, the gate
    // should pass without hitting the DB at all.
    if (REQUIRED_CONSENTS.length > 0) {
      findMany.mockResolvedValue([] as never)
      await expect(hasAcceptedAllRequired('u')).resolves.toBe(false)
      return
    }
    await expect(hasAcceptedAllRequired('u')).resolves.toBe(true)
    expect(findMany).not.toHaveBeenCalled()
  })
})

describe('recordRequiredConsents', () => {
  it('writes one row per required consent with the userId, version, and ip', async () => {
    createMany.mockResolvedValue({ count: REQUIRED_CONSENTS.length } as never)
    await recordRequiredConsents('user-1', '203.0.113.7')

    const arg = createMany.mock.calls[0]?.[0] as
      | { data: Array<Record<string, unknown>>; skipDuplicates?: boolean }
      | undefined
    expect(arg?.skipDuplicates).toBe(true)
    expect(arg?.data).toHaveLength(REQUIRED_CONSENTS.length)
    for (const expected of REQUIRED_CONSENTS) {
      expect(arg?.data).toContainEqual({
        userId: 'user-1',
        consentType: expected.type,
        version: expected.version,
        ipAddress: '203.0.113.7',
      })
    }
  })

  it('persists ipAddress as null when none is supplied', async () => {
    createMany.mockResolvedValue({ count: REQUIRED_CONSENTS.length } as never)
    await recordRequiredConsents('user-1', null)

    const data = (
      createMany.mock.calls[0]?.[0] as
        | { data: Array<{ ipAddress: string | null }> }
        | undefined
    )?.data
    for (const row of data ?? []) {
      expect(row.ipAddress).toBeNull()
    }
  })
})

describe('readClientIp', () => {
  it('takes the first entry from a comma-separated x-forwarded-for chain', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.7, 198.51.100.4, 10.0.0.1',
    })
    expect(readClientIp(headers)).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const headers = new Headers({ 'x-real-ip': '198.51.100.42' })
    expect(readClientIp(headers)).toBe('198.51.100.42')
  })

  it('returns null when neither header is present', () => {
    expect(readClientIp(new Headers())).toBeNull()
  })

  it('returns null on an empty/whitespace x-forwarded-for', () => {
    const headers = new Headers({ 'x-forwarded-for': '   ' })
    expect(readClientIp(headers)).toBeNull()
  })
})
