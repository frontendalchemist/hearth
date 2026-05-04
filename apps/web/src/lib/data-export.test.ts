import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hearth/db', () => ({
  db: {
    user: { findUniqueOrThrow: vi.fn() },
    careRecipientMembership: { findMany: vi.fn() },
    careRecipient: { findMany: vi.fn() },
    agingPlan: { findUnique: vi.fn() },
    consentRecord: { findMany: vi.fn() },
    alert: { findMany: vi.fn() },
    aiConversation: { findMany: vi.fn() },
    invitation: { findMany: vi.fn() },
    auditLog: { findMany: vi.fn() },
  },
}))

import { db } from '@hearth/db'
import { buildUserExport, exportFilename } from './data-export'

const mocks = {
  findUser: vi.mocked(db.user.findUniqueOrThrow),
  findMemberships: vi.mocked(db.careRecipientMembership.findMany),
  findRecipients: vi.mocked(db.careRecipient.findMany),
  findAgingPlan: vi.mocked(db.agingPlan.findUnique),
  findConsents: vi.mocked(db.consentRecord.findMany),
  findAlerts: vi.mocked(db.alert.findMany),
  findAi: vi.mocked(db.aiConversation.findMany),
  findInvites: vi.mocked(db.invitation.findMany),
  findAudit: vi.mocked(db.auditLog.findMany),
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset()
  // Sensible defaults so each test only has to override what it cares about.
  mocks.findUser.mockResolvedValue({ id: 'user-1' } as never)
  mocks.findMemberships.mockResolvedValue([] as never)
  mocks.findRecipients.mockResolvedValue([] as never)
  mocks.findAgingPlan.mockResolvedValue(null as never)
  mocks.findConsents.mockResolvedValue([] as never)
  mocks.findAlerts.mockResolvedValue([] as never)
  mocks.findAi.mockResolvedValue([] as never)
  mocks.findInvites.mockResolvedValue([] as never)
  mocks.findAudit.mockResolvedValue([] as never)
})

describe('buildUserExport', () => {
  it('returns a payload tagged with schemaVersion 1 and an ISO exportedAt', async () => {
    const out = await buildUserExport('user-1')
    expect(out.schemaVersion).toBe(1)
    expect(out.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('queries every per-user table scoped to the requesting userId', async () => {
    await buildUserExport('user-xyz')

    expect(mocks.findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-xyz' } }),
    )
    expect(mocks.findMemberships).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-xyz' } }),
    )
    expect(mocks.findAgingPlan).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-xyz' } }),
    )
    expect(mocks.findConsents).toHaveBeenCalledWith({
      where: { userId: 'user-xyz' },
    })
    expect(mocks.findAlerts).toHaveBeenCalledWith({
      where: { userId: 'user-xyz' },
    })
    expect(mocks.findAudit).toHaveBeenCalledWith({
      where: { userId: 'user-xyz' },
    })
  })

  it('queries both invitation FKs separately so sent and accepted are both captured', async () => {
    await buildUserExport('user-1')

    const calls = mocks.findInvites.mock.calls.map((c) => c[0]?.where)
    expect(calls).toContainEqual({ invitedById: 'user-1' })
    expect(calls).toContainEqual({ acceptedById: 'user-1' })
  })

  it('skips the recipient query entirely when the user has no memberships', async () => {
    mocks.findMemberships.mockResolvedValue([] as never)
    await buildUserExport('user-1')
    expect(mocks.findRecipients).not.toHaveBeenCalled()
  })

  it('passes the membership recipient IDs through to the recipient query', async () => {
    mocks.findMemberships.mockResolvedValue([
      { careRecipientId: 'cr-1' },
      { careRecipientId: 'cr-2' },
    ] as never)

    await buildUserExport('user-1')

    expect(mocks.findRecipients).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['cr-1', 'cr-2'] } },
      }),
    )
  })

  it('explicitly filters soft-deleted child rows on every soft-deletable include', async () => {
    mocks.findMemberships.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ] as never)

    await buildUserExport('user-1')

    const include = (
      mocks.findRecipients.mock.calls[0]?.[0] as { include?: Record<string, unknown> }
    )?.include
    // The soft-delete extension does NOT cascade into includes (CLAUDE.md
    // calls this out). Every soft-deletable model on the recipient must
    // re-apply the filter — pin it here so a future include addition that
    // forgets the filter fails this test.
    expect(include?.documents).toEqual({ where: { deletedAt: null } })
    expect(include?.medications).toEqual({ where: { deletedAt: null } })
    expect(include?.providers).toEqual({ where: { deletedAt: null } })
    expect(include?.tasks).toEqual({ where: { deletedAt: null } })
  })

  it('includes ai conversations with their messages eagerly loaded', async () => {
    mocks.findAi.mockResolvedValue([
      { id: 'c1', messages: [{ id: 'm1' }] },
    ] as never)

    const out = await buildUserExport('user-1')

    expect(mocks.findAi).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        include: { messages: true },
      }),
    )
    expect(out.aiConversations[0]?.messages).toHaveLength(1)
  })

  it('serializes to JSON without throwing (Date fields, etc.)', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'user-1',
      createdAt: new Date('2026-04-01T12:00:00Z'),
    } as never)

    const out = await buildUserExport('user-1')
    expect(() => JSON.stringify(out)).not.toThrow()
  })
})

describe('exportFilename', () => {
  it('builds a date-stamped filename with the user id', () => {
    const now = new Date('2026-05-03T14:00:00Z')
    expect(exportFilename('clxyz123', now)).toBe(
      'hearth-export-clxyz123-2026-05-03.json',
    )
  })

  it('strips characters that would break the Content-Disposition header', () => {
    const now = new Date('2026-05-03T14:00:00Z')
    expect(exportFilename('user/with"quotes;', now)).toBe(
      'hearth-export-userwithquotes-2026-05-03.json',
    )
  })
})
