import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hearth/db', () => {
  const tx = {
    user: { findUnique: vi.fn(), update: vi.fn() },
    careRecipientMembership: {
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    careRecipient: { findMany: vi.fn(), update: vi.fn() },
    aiConversation: { deleteMany: vi.fn() },
    alert: { deleteMany: vi.fn() },
    agingPlan: { deleteMany: vi.fn() },
    documentPermissionMember: { deleteMany: vi.fn() },
    auditLog: { create: vi.fn() },
  }
  return {
    db: {
      careRecipientMembership: { findMany: vi.fn() },
      careRecipient: { findMany: vi.fn() },
      $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
      __tx: tx,
    },
  }
})

import { db } from '@hearth/db'
import {
  ErasureValidationError,
  eraseUser,
  previewErasure,
  type Resolution,
} from './data-erasure'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tx = (db as any).__tx as {
  user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  careRecipientMembership: {
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
  careRecipient: {
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  aiConversation: { deleteMany: ReturnType<typeof vi.fn> }
  alert: { deleteMany: ReturnType<typeof vi.fn> }
  agingPlan: { deleteMany: ReturnType<typeof vi.fn> }
  documentPermissionMember: { deleteMany: ReturnType<typeof vi.fn> }
  auditLog: { create: ReturnType<typeof vi.fn> }
}

const findAdminMembershipsTop = vi.mocked(db.careRecipientMembership.findMany)
const findRecipientsTop = vi.mocked(db.careRecipient.findMany)

beforeEach(() => {
  vi.clearAllMocks()
  // Sensible defaults — tx mocks resolve to "nothing happened" unless
  // a specific test overrides them.
  tx.user.findUnique.mockResolvedValue({
    id: 'u-1',
    auth0Sub: 'auth0|abc',
    deletedAt: null,
  })
  tx.user.update.mockResolvedValue({})
  tx.careRecipientMembership.findMany.mockResolvedValue([])
  tx.careRecipient.findMany.mockResolvedValue([])
  tx.careRecipient.update.mockResolvedValue({})
  tx.careRecipientMembership.update.mockResolvedValue({})
  tx.careRecipientMembership.deleteMany.mockResolvedValue({ count: 0 })
  tx.aiConversation.deleteMany.mockResolvedValue({ count: 0 })
  tx.alert.deleteMany.mockResolvedValue({ count: 0 })
  tx.agingPlan.deleteMany.mockResolvedValue({ count: 0 })
  tx.documentPermissionMember.deleteMany.mockResolvedValue({ count: 0 })
  tx.auditLog.create.mockResolvedValue({})
})

describe('previewErasure', () => {
  it('returns no workspaces when the user has no Admin memberships', async () => {
    findAdminMembershipsTop.mockResolvedValue([])

    await expect(previewErasure('u-1')).resolves.toEqual({
      soleAdminWorkspaces: [],
    })
    expect(findRecipientsTop).not.toHaveBeenCalled()
  })

  it('skips workspaces where another Admin still exists', async () => {
    findAdminMembershipsTop.mockResolvedValue([{ careRecipientId: 'cr-1' }] as never)
    findRecipientsTop.mockResolvedValue([
      {
        id: 'cr-1',
        firstName: 'Margaret',
        lastName: 'Smith',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date('2026-01-01'), user: { name: 'Me' } },
          { id: 'm-2', userId: 'u-2', role: 'ADMIN', createdAt: new Date('2026-02-01'), user: { name: 'Sibling' } },
        ],
      },
    ] as never)

    const out = await previewErasure('u-1')
    expect(out.soleAdminWorkspaces).toEqual([])
  })

  it('flags sole-admin workspaces and suggests the longest-tenured Coordinator', async () => {
    findAdminMembershipsTop.mockResolvedValue([{ careRecipientId: 'cr-1' }] as never)
    findRecipientsTop.mockResolvedValue([
      {
        id: 'cr-1',
        firstName: 'Margaret',
        lastName: 'Smith',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date('2026-01-01'), user: { name: 'Me' } },
          { id: 'm-3', userId: 'u-3', role: 'VIEWER', createdAt: new Date('2026-02-01'), user: { name: 'Cousin' } },
          { id: 'm-2', userId: 'u-2', role: 'COORDINATOR', createdAt: new Date('2026-03-01'), user: { name: 'Sibling' } },
        ],
      },
    ] as never)

    const out = await previewErasure('u-1')
    expect(out.soleAdminWorkspaces).toHaveLength(1)
    const ws = out.soleAdminWorkspaces[0]!
    expect(ws.careRecipientId).toBe('cr-1')
    expect(ws.recipientName).toBe('Margaret Smith')

    const successor = ws.members.find((m) => m.suggestedSuccessor)
    expect(successor?.userId).toBe('u-2') // The Coordinator wins over the Viewer.

    expect(ws.members.map((m) => m.userId)).not.toContain('u-1')
  })

  it('falls back to the longest-tenured Viewer when no Coordinators remain', async () => {
    findAdminMembershipsTop.mockResolvedValue([{ careRecipientId: 'cr-1' }] as never)
    findRecipientsTop.mockResolvedValue([
      {
        id: 'cr-1',
        firstName: 'Dad',
        lastName: 'Jones',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date('2026-01-01'), user: { name: 'Me' } },
          { id: 'm-2', userId: 'u-2', role: 'VIEWER', createdAt: new Date('2026-02-15'), user: { name: 'Older' } },
          { id: 'm-3', userId: 'u-3', role: 'VIEWER', createdAt: new Date('2026-04-01'), user: { name: 'Newer' } },
        ],
      },
    ] as never)

    const out = await previewErasure('u-1')
    const successor = out.soleAdminWorkspaces[0]!.members.find((m) => m.suggestedSuccessor)
    expect(successor?.userId).toBe('u-2') // Older Viewer.
  })

  it('returns an empty members list when the user is the only person on the workspace', async () => {
    findAdminMembershipsTop.mockResolvedValue([{ careRecipientId: 'cr-1' }] as never)
    findRecipientsTop.mockResolvedValue([
      {
        id: 'cr-1',
        firstName: 'A',
        lastName: 'B',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date('2026-01-01'), user: { name: 'Me' } },
        ],
      },
    ] as never)

    const out = await previewErasure('u-1')
    expect(out.soleAdminWorkspaces[0]!.members).toEqual([])
  })
})

describe('eraseUser — validation', () => {
  it('throws ALREADY_ERASED when no User row matches the id', async () => {
    tx.user.findUnique.mockResolvedValue(null)
    await expect(eraseUser('missing', [])).rejects.toMatchObject({
      code: 'ALREADY_ERASED',
    })
  })

  it('is a no-op (no anonymize, no audit) when User.deletedAt is already set', async () => {
    tx.user.findUnique.mockResolvedValue({
      id: 'u-1',
      auth0Sub: 'auth0|abc',
      deletedAt: new Date(),
    })

    await expect(eraseUser('u-1', [])).resolves.toBeUndefined()
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.auditLog.create).not.toHaveBeenCalled()
  })

  it('throws MISSING_RESOLUTION when a sole-admin workspace has no resolution', async () => {
    tx.careRecipientMembership.findMany.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ])
    tx.careRecipient.findMany.mockResolvedValue([
      {
        id: 'cr-1',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date('2026-01-01') },
          { id: 'm-2', userId: 'u-2', role: 'COORDINATOR', createdAt: new Date('2026-02-01') },
        ],
      },
    ])

    await expect(eraseUser('u-1', [])).rejects.toMatchObject({
      code: 'MISSING_RESOLUTION',
    })
  })

  it('throws STALE_RESOLUTION when caller submits one for a workspace that is no longer sole-admin', async () => {
    tx.careRecipientMembership.findMany.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ])
    tx.careRecipient.findMany.mockResolvedValue([
      {
        id: 'cr-1',
        memberships: [
          // Two admins now — the user can leave without resolving.
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date() },
          { id: 'm-2', userId: 'u-2', role: 'ADMIN', createdAt: new Date() },
        ],
      },
    ])

    const resolutions: Resolution[] = [
      { careRecipientId: 'cr-1', action: 'close' },
    ]
    await expect(eraseUser('u-1', resolutions)).rejects.toMatchObject({
      code: 'STALE_RESOLUTION',
    })
  })

  it('throws INVALID_PROMOTED_MEMBER when the promoted member is no longer in the workspace', async () => {
    tx.careRecipientMembership.findMany.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ])
    tx.careRecipient.findMany.mockResolvedValue([
      {
        id: 'cr-1',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date() },
          { id: 'm-2', userId: 'u-2', role: 'COORDINATOR', createdAt: new Date() },
        ],
      },
    ])

    const resolutions: Resolution[] = [
      {
        careRecipientId: 'cr-1',
        action: 'promote',
        promotedMemberId: 'u-99', // Not a member.
      },
    ]
    await expect(eraseUser('u-1', resolutions)).rejects.toMatchObject({
      code: 'INVALID_PROMOTED_MEMBER',
    })
  })
})

describe('eraseUser — happy path', () => {
  beforeEach(() => {
    tx.careRecipientMembership.findMany.mockResolvedValue([])
    tx.careRecipient.findMany.mockResolvedValue([])
  })

  it('anonymizes the User row with stable email/auth0Sub markers and sets deletedAt', async () => {
    await eraseUser('u-1', [])

    const update = tx.user.update.mock.calls[0]?.[0] as
      | { where: { id: string }; data: Record<string, unknown> }
      | undefined
    expect(update?.where).toEqual({ id: 'u-1' })
    expect(update?.data.email).toBe('deleted-u-1@hearth-erased.local')
    expect(update?.data.name).toBe('Deleted user')
    expect(update?.data.avatarUrl).toBeNull()
    expect(update?.data.state).toBeNull()
    expect(update?.data.location).toBeNull()
    expect(update?.data.deletedAt).toBeInstanceOf(Date)
    expect(update?.data.auth0Sub).toMatch(/^deleted\|[0-9a-f]{16}$/)
  })

  it('clears memberships and document-permission rows for the user', async () => {
    await eraseUser('u-1', [])

    expect(tx.careRecipientMembership.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
    })
    expect(tx.documentPermissionMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
    })
  })

  it('hard-deletes user-personal rows (aiConversations, alerts, agingPlan)', async () => {
    await eraseUser('u-1', [])

    expect(tx.aiConversation.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
    })
    expect(tx.alert.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
    })
    expect(tx.agingPlan.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-1' },
    })
  })

  it('writes an AuditLog DELETE row tagged with CCPA_RIGHT_TO_ERASURE', async () => {
    await eraseUser('u-1', [])

    const create = tx.auditLog.create.mock.calls[0]?.[0] as
      | { data: Record<string, unknown> }
      | undefined
    expect(create?.data.userId).toBe('u-1')
    expect(create?.data.action).toBe('DELETE')
    expect(create?.data.resourceType).toBe('User')
    expect(create?.data.resourceId).toBe('u-1')
    expect(create?.data.metadata).toMatchObject({
      reason: 'CCPA_RIGHT_TO_ERASURE',
    })
  })

  it('promotes the chosen successor and skips the close branch', async () => {
    tx.careRecipientMembership.findMany.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ])
    tx.careRecipient.findMany.mockResolvedValue([
      {
        id: 'cr-1',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date() },
          { id: 'm-2', userId: 'u-2', role: 'COORDINATOR', createdAt: new Date() },
        ],
      },
    ])

    await eraseUser('u-1', [
      { careRecipientId: 'cr-1', action: 'promote', promotedMemberId: 'u-2' },
    ])

    expect(tx.careRecipientMembership.update).toHaveBeenCalledWith({
      where: { id: 'm-2' },
      data: { role: 'ADMIN' },
    })
    expect(tx.careRecipient.update).not.toHaveBeenCalled()
  })

  it('soft-deletes the workspace on the close action', async () => {
    tx.careRecipientMembership.findMany.mockResolvedValue([
      { careRecipientId: 'cr-1' },
    ])
    tx.careRecipient.findMany.mockResolvedValue([
      {
        id: 'cr-1',
        memberships: [
          { id: 'm-1', userId: 'u-1', role: 'ADMIN', createdAt: new Date() },
        ],
      },
    ])

    await eraseUser('u-1', [{ careRecipientId: 'cr-1', action: 'close' }])

    const update = tx.careRecipient.update.mock.calls[0]?.[0] as
      | { where: { id: string }; data: { deletedAt: Date } }
      | undefined
    expect(update?.where).toEqual({ id: 'cr-1' })
    expect(update?.data.deletedAt).toBeInstanceOf(Date)
    expect(tx.careRecipientMembership.update).not.toHaveBeenCalled()
  })
})

describe('ErasureValidationError', () => {
  it('exposes the failure code on the error instance', () => {
    const err = new ErasureValidationError('oops', 'MISSING_RESOLUTION')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe('MISSING_RESOLUTION')
  })
})
