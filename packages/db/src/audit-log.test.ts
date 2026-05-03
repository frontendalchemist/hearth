import { describe, expect, it, vi } from 'vitest'
import {
  actionFor,
  getAuditContext,
  makeAuditHandler,
  resourceIdFromResult,
  resourceTypeForModel,
  withAuditContext,
} from './audit-log'

import type { PrismaClient } from '@prisma/client'

describe('actionFor', () => {
  it('maps create / createMany to CREATE', () => {
    expect(actionFor('create', { data: {} })).toBe('CREATE')
    expect(actionFor('createMany', { data: [] })).toBe('CREATE')
  })

  it('maps update / updateMany / upsert to UPDATE by default', () => {
    expect(actionFor('update', { data: { name: 'x' } })).toBe('UPDATE')
    expect(actionFor('updateMany', { data: { name: 'x' } })).toBe('UPDATE')
    expect(actionFor('upsert', { create: {}, update: {} })).toBe('UPDATE')
  })

  it('reclassifies update-with-deletedAt as DELETE so audit reads naturally', () => {
    expect(actionFor('update', { data: { deletedAt: new Date() } })).toBe('DELETE')
    expect(actionFor('updateMany', { data: { deletedAt: '2026-05-02' } })).toBe('DELETE')
  })

  it('does not reclassify update with deletedAt: null (an undelete)', () => {
    expect(actionFor('update', { data: { deletedAt: null } })).toBe('UPDATE')
  })

  it('maps delete / deleteMany to DELETE', () => {
    expect(actionFor('delete', { where: { id: 'x' } })).toBe('DELETE')
    expect(actionFor('deleteMany', { where: {} })).toBe('DELETE')
  })

  it('returns null for read operations (not audited at the DB layer)', () => {
    expect(actionFor('findMany', { where: {} })).toBe(null)
    expect(actionFor('findUnique', { where: { id: 'x' } })).toBe(null)
    expect(actionFor('count', { where: {} })).toBe(null)
  })
})

describe('resourceTypeForModel', () => {
  it('upper-cases the first char to match Prisma model names', () => {
    expect(resourceTypeForModel('document')).toBe('Document')
    expect(resourceTypeForModel('shareLink')).toBe('ShareLink')
    expect(resourceTypeForModel('medication')).toBe('Medication')
  })
})

describe('resourceIdFromResult', () => {
  it('extracts row id from single-row mutation results', () => {
    expect(resourceIdFromResult('create', { id: 'abc', name: 'x' })).toEqual({
      id: 'abc',
    })
  })

  it('returns "*" with count for bulk-mutation { count } results', () => {
    expect(resourceIdFromResult('updateMany', { count: 7 })).toEqual({
      id: '*',
      count: 7,
    })
  })

  it('returns "*" without count when result has neither id nor count', () => {
    expect(resourceIdFromResult('update', null)).toEqual({ id: '*' })
    expect(resourceIdFromResult('update', undefined)).toEqual({ id: '*' })
  })
})

describe('withAuditContext', () => {
  it('exposes the context to nested async work', async () => {
    await withAuditContext(
      { userId: 'user-1', ipAddress: '10.0.0.1', userAgent: 'test' },
      async () => {
        await Promise.resolve()
        expect(getAuditContext()).toEqual({
          userId: 'user-1',
          ipAddress: '10.0.0.1',
          userAgent: 'test',
        })
      },
    )
  })

  it('returns undefined outside any context', () => {
    expect(getAuditContext()).toBeUndefined()
  })

  it('isolates parallel contexts', async () => {
    const seen: Array<string | null | undefined> = []
    await Promise.all([
      withAuditContext({ userId: 'a' }, async () => {
        await new Promise((r) => setTimeout(r, 5))
        seen.push(getAuditContext()?.userId)
      }),
      withAuditContext({ userId: 'b' }, async () => {
        await new Promise((r) => setTimeout(r, 1))
        seen.push(getAuditContext()?.userId)
      }),
    ])
    expect(seen.sort()).toEqual(['a', 'b'])
  })
})

describe('makeAuditHandler', () => {
  // Build a minimal fake of the surface the handler touches: a single
  // `auditLog.create` spy. The handler receives `query` (the original Prisma
  // mutation) and is responsible for writing the audit row after.
  function makeFakeBase() {
    const create = vi.fn(async (_args: unknown) => ({ id: 'log-1' }))
    const base = { auditLog: { create } } as unknown as PrismaClient
    return { base, create }
  }

  it('writes a CREATE audit row after a successful document.create', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'document')

    const query = vi.fn(async () => ({ id: 'doc-1', filename: 'x.pdf' }))
    const result = await withAuditContext(
      { userId: 'user-1', ipAddress: '127.0.0.1', userAgent: 'tests' },
      () =>
        handler({
          args: { data: { filename: 'x.pdf' } },
          query,
          operation: 'create',
        }),
    )

    expect(result).toEqual({ id: 'doc-1', filename: 'x.pdf' })
    expect(query).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'CREATE',
        resourceType: 'Document',
        resourceId: 'doc-1',
        ipAddress: '127.0.0.1',
        userAgent: 'tests',
        metadata: { operation: 'create' },
      },
    })
  })

  it('classifies update-with-deletedAt as DELETE in the audit row', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'medication')

    const query = vi.fn(async () => ({ id: 'med-1' }))
    await handler({
      args: { where: { id: 'med-1' }, data: { deletedAt: new Date() } },
      query,
      operation: 'update',
    })

    expect(create).toHaveBeenCalledOnce()
    const callArg = create.mock.calls[0]![0] as { data: { action: string } }
    expect(callArg.data.action).toBe('DELETE')
  })

  it('records bulk-mutation count in metadata when ids are unavailable', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'shareLink')

    const query = vi.fn(async () => ({ count: 3 }))
    await handler({
      args: { where: { expiresAt: { lt: new Date() } } },
      query,
      operation: 'deleteMany',
    })

    const callArg = create.mock.calls[0]![0] as {
      data: { resourceId: string; metadata: unknown; action: string }
    }
    expect(callArg.data.action).toBe('DELETE')
    expect(callArg.data.resourceId).toBe('*')
    expect(callArg.data.metadata).toEqual({ operation: 'deleteMany', count: 3 })
  })

  it('uses null userId when no context is set (e.g. cron / seed)', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'document')

    const query = vi.fn(async () => ({ id: 'doc-2' }))
    await handler({
      args: { data: { filename: 'y.pdf' } },
      query,
      operation: 'create',
    })

    const callArg = create.mock.calls[0]![0] as {
      data: { userId: string | null }
    }
    expect(callArg.data.userId).toBe(null)
  })

  it('does NOT write an audit row if the underlying mutation throws', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'document')

    const query = vi.fn(async () => {
      throw new Error('constraint violation')
    })

    await expect(
      handler({
        args: { data: {} },
        query,
        operation: 'create',
      }),
    ).rejects.toThrow('constraint violation')

    expect(create).not.toHaveBeenCalled()
  })

  it('passes through reads (findMany) without writing audit', async () => {
    const { base, create } = makeFakeBase()
    const handler = makeAuditHandler(base, 'document')

    const query = vi.fn(async () => [{ id: 'd1' }, { id: 'd2' }])
    const result = await handler({
      args: { where: {} },
      query,
      operation: 'findMany',
    })

    expect(result).toEqual([{ id: 'd1' }, { id: 'd2' }])
    expect(create).not.toHaveBeenCalled()
  })
})
