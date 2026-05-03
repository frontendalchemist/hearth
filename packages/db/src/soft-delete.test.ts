import { describe, expect, it, vi } from 'vitest'
import { injectDeletedAtFilter, softDeleteQueryHandler } from './soft-delete'

describe('injectDeletedAtFilter', () => {
  it('adds deletedAt: null when where is undefined', () => {
    expect(injectDeletedAtFilter(undefined)).toEqual({ deletedAt: null })
  })

  it('adds deletedAt: null when where has other keys', () => {
    expect(injectDeletedAtFilter({ careRecipientId: 'abc' })).toEqual({
      careRecipientId: 'abc',
      deletedAt: null,
    })
  })

  it('preserves explicit deletedAt: null', () => {
    expect(injectDeletedAtFilter({ deletedAt: null })).toEqual({ deletedAt: null })
  })

  it('preserves explicit deletedAt set to a non-null value (escape hatch)', () => {
    const where = { deletedAt: { not: null } }
    expect(injectDeletedAtFilter(where)).toBe(where)
  })

  it('preserves explicit deletedAt that is a date filter', () => {
    const where = { deletedAt: { lt: new Date('2026-01-01') } }
    expect(injectDeletedAtFilter(where)).toBe(where)
  })
})

describe('softDeleteQueryHandler', () => {
  const makeQuery = () => {
    const fn = vi.fn(async (args: unknown) => ({ args }))
    return fn
  }

  describe('read operations', () => {
    const reads = [
      'findUnique',
      'findUniqueOrThrow',
      'findFirst',
      'findFirstOrThrow',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
    ]

    for (const operation of reads) {
      it(`${operation} injects deletedAt: null`, async () => {
        const query = makeQuery()
        await softDeleteQueryHandler({
          args: { where: { name: 'Doc 1' } },
          query,
          operation,
        })
        expect(query).toHaveBeenCalledWith({
          where: { name: 'Doc 1', deletedAt: null },
        })
      })

      it(`${operation} respects explicit deletedAt`, async () => {
        const query = makeQuery()
        await softDeleteQueryHandler({
          args: { where: { deletedAt: { not: null } } },
          query,
          operation,
        })
        expect(query).toHaveBeenCalledWith({
          where: { deletedAt: { not: null } },
        })
      })
    }

    it('findMany with no args still injects deletedAt: null', async () => {
      const query = makeQuery()
      await softDeleteQueryHandler({ args: undefined, query, operation: 'findMany' })
      expect(query).toHaveBeenCalledWith({ where: { deletedAt: null } })
    })
  })

  describe('update operations', () => {
    for (const operation of ['update', 'updateMany', 'upsert']) {
      it(`${operation} injects deletedAt: null so soft-deleted rows can't be updated`, async () => {
        const query = makeQuery()
        await softDeleteQueryHandler({
          args: { where: { id: 'abc' }, data: { name: 'new' } },
          query,
          operation,
        })
        expect(query).toHaveBeenCalledWith({
          where: { id: 'abc', deletedAt: null },
          data: { name: 'new' },
        })
      })
    }
  })

  describe('non-filtered operations', () => {
    for (const operation of ['create', 'createMany', 'delete', 'deleteMany']) {
      it(`${operation} passes args through unchanged`, async () => {
        const query = makeQuery()
        const args = { where: { id: 'abc' } }
        await softDeleteQueryHandler({ args, query, operation })
        expect(query).toHaveBeenCalledWith(args)
      })
    }
  })

  it('does not mutate the original args object', async () => {
    const query = makeQuery()
    const original = { where: { name: 'Doc 1' } }
    const beforeKeys = Object.keys(original.where)
    await softDeleteQueryHandler({ args: original, query, operation: 'findMany' })
    expect(Object.keys(original.where)).toEqual(beforeKeys)
    expect((original.where as Record<string, unknown>).deletedAt).toBeUndefined()
  })
})
