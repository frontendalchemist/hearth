import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@hearth/db', () => ({
  db: {
    careRecipientMembership: {
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@hearth/db'
import { careRecipientsResolver } from './schema'

const mockFindMany = vi.mocked(db.careRecipientMembership.findMany)

const mockUser = {
  id: 'user-cuid-1',
  sub: 'auth0|abc',
  email: 'caregiver@example.com',
  name: 'Caregiver',
  locale: 'en',
  roles: [],
}

beforeEach(() => {
  mockFindMany.mockReset()
})

describe('careRecipientsResolver', () => {
  it('throws UNAUTHORIZED when ctx.user is null', async () => {
    await expect(careRecipientsResolver({ user: null })).rejects.toMatchObject({
      message: 'Unauthorized',
      extensions: { code: 'UNAUTHORIZED' },
    })
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it("scopes the lookup to the caller's userId, ordered by createdAt", async () => {
    mockFindMany.mockResolvedValue([])

    await careRecipientsResolver({ user: mockUser })

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-cuid-1' },
      include: { careRecipient: true },
      orderBy: { createdAt: 'asc' },
    })
  })

  it('returns recipients with membership-scoped relationship', async () => {
    const dob = new Date('1948-06-15T00:00:00.000Z')
    mockFindMany.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-cuid-1',
        careRecipientId: 'cr-1',
        role: 'ADMIN',
        relationship: 'daughter',
        createdAt: new Date('2026-01-01'),
        careRecipient: {
          id: 'cr-1',
          firstName: 'Margaret',
          lastName: 'Lee',
          dateOfBirth: dob,
          photoUrl: 'https://example.com/m.png',
          careStage: 'STAGE_2_SOME_HELP',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          deletedAt: null,
        },
      },
    ] as never)

    const result = await careRecipientsResolver({ user: mockUser })

    expect(result).toEqual([
      {
        id: 'cr-1',
        firstName: 'Margaret',
        lastName: 'Lee',
        dateOfBirth: dob,
        careStage: 'STAGE_2_SOME_HELP',
        photoUrl: 'https://example.com/m.png',
        relationship: 'daughter',
      },
    ])
  })

  it('passes through null DOB and null relationship', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-cuid-1',
        careRecipientId: 'cr-1',
        role: 'COORDINATOR',
        relationship: null,
        createdAt: new Date(),
        careRecipient: {
          id: 'cr-1',
          firstName: 'Anonymous',
          lastName: 'Recipient',
          dateOfBirth: null,
          photoUrl: null,
          careStage: 'STAGE_1_INDEPENDENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      },
    ] as never)

    const [recipient] = await careRecipientsResolver({ user: mockUser })

    expect(recipient?.dateOfBirth).toBeNull()
    expect(recipient?.relationship).toBeNull()
  })

  it('excludes soft-deleted recipients (relation include is not auto-filtered)', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-cuid-1',
        careRecipientId: 'cr-tombstoned',
        role: 'ADMIN',
        relationship: 'daughter',
        createdAt: new Date(),
        careRecipient: {
          id: 'cr-tombstoned',
          firstName: 'Removed',
          lastName: 'Recipient',
          dateOfBirth: null,
          photoUrl: null,
          careStage: 'STAGE_1_INDEPENDENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: new Date('2026-01-01'),
        },
      },
      {
        id: 'mem-2',
        userId: 'user-cuid-1',
        careRecipientId: 'cr-live',
        role: 'COORDINATOR',
        relationship: 'son',
        createdAt: new Date(),
        careRecipient: {
          id: 'cr-live',
          firstName: 'Active',
          lastName: 'Recipient',
          dateOfBirth: null,
          photoUrl: null,
          careStage: 'STAGE_1_INDEPENDENT',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      },
    ] as never)

    const result = await careRecipientsResolver({ user: mockUser })

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('cr-live')
  })

  it('returns empty list when the caller has no memberships', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await careRecipientsResolver({ user: mockUser })

    expect(result).toEqual([])
  })
})
