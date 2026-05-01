import { describe, it, expect, beforeEach } from 'vitest'
import type { SessionData } from '@auth0/nextjs-auth0/types'
import { db } from '@hearth/db'
import { syncUser } from './user-sync'

const session = (overrides: Partial<SessionData['user']> & { sub: string }) =>
  ({ user: overrides as SessionData['user'] }) as SessionData

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE')
})

describe('syncUser (real DB)', () => {
  it('AC#1 — first login persists a User row keyed by auth0Sub', async () => {
    await syncUser(
      session({
        sub: 'auth0|integration-1',
        email: 'm@example.com',
        name: 'Margaret',
        picture: 'https://cdn/m.png',
      }),
    )

    const row = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-1' } })
    expect(row).toMatchObject({
      auth0Sub: 'auth0|integration-1',
      email: 'm@example.com',
      name: 'Margaret',
      avatarUrl: 'https://cdn/m.png',
    })
    expect(row?.id).toMatch(/^c[a-z0-9]+$/)
    expect(row?.createdAt).toBeInstanceOf(Date)
  })

  it('AC#2 — subsequent login refreshes mutable claims, leaves auth0Sub/createdAt intact', async () => {
    await syncUser(
      session({ sub: 'auth0|integration-2', email: 'old@example.com', name: 'Old' }),
    )
    const first = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    await syncUser(
      session({
        sub: 'auth0|integration-2',
        email: 'new@example.com',
        name: 'New',
        picture: 'https://cdn/new.png',
      }),
    )
    const second = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    expect(second?.id).toBe(first?.id)
    expect(second?.createdAt).toEqual(first?.createdAt)
    expect(second?.email).toBe('new@example.com')
    expect(second?.name).toBe('New')
    expect(second?.avatarUrl).toBe('https://cdn/new.png')
  })

  it('AC#5 — the row written by syncUser is the row requireAuth would resolve', async () => {
    await syncUser(
      session({ sub: 'auth0|integration-3', email: 'r@example.com', name: 'R' }),
    )

    const found = await db.user.findUnique({
      where: { auth0Sub: 'auth0|integration-3' },
      select: { id: true, email: true, name: true },
    })
    expect(found).not.toBeNull()
    expect(found?.email).toBe('r@example.com')
  })
})
