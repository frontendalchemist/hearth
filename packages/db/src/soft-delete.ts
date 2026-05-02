import { Prisma } from '@prisma/client'

export const SOFT_DELETE_MODELS = [
  'careRecipient',
  'document',
  'medication',
  'provider',
  'task',
] as const

type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number]

const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
])

const UPDATE_OPERATIONS = new Set(['update', 'updateMany', 'upsert'])

export function injectDeletedAtFilter<T extends Record<string, unknown> | undefined>(
  where: T,
): T | (T & { deletedAt: null }) {
  if (where && typeof where === 'object' && 'deletedAt' in where) {
    return where
  }
  return { ...(where ?? ({} as Record<string, unknown>)), deletedAt: null } as T & {
    deletedAt: null
  }
}

// Prisma's $allOperations callback type is a generic union over every model's
// arg shape — too wide to satisfy with a single hand-written signature. We
// type the handler loosely and rely on the unit tests for behavior coverage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const softDeleteQueryHandler = async ({ args, query, operation }: any): Promise<any> => {
  if (READ_OPERATIONS.has(operation) || UPDATE_OPERATIONS.has(operation)) {
    const next = { ...(args ?? {}) } as { where?: Record<string, unknown> }
    next.where = injectDeletedAtFilter(next.where)
    return query(next)
  }
  return query(args)
}

const allOps = { $allOperations: softDeleteQueryHandler }

function makeSoftDeleteMethods<TModel extends SoftDeleteModel>(modelName: TModel) {
  return {
    async softDelete(this: unknown, args: { where: Record<string, unknown> }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = Prisma.getExtensionContext(this) as any
      return ctx.update({ where: args.where, data: { deletedAt: new Date() } })
    },
    async softDeleteMany(this: unknown, args: { where: Record<string, unknown> }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ctx = Prisma.getExtensionContext(this) as any
      return ctx.updateMany({ where: args.where, data: { deletedAt: new Date() } })
    },
    _modelName: modelName,
  }
}

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    careRecipient: allOps,
    document: allOps,
    medication: allOps,
    provider: allOps,
    task: allOps,
  },
  model: {
    careRecipient: makeSoftDeleteMethods('careRecipient'),
    document: makeSoftDeleteMethods('document'),
    medication: makeSoftDeleteMethods('medication'),
    provider: makeSoftDeleteMethods('provider'),
    task: makeSoftDeleteMethods('task'),
  },
})

export type SoftDeletableModelName = SoftDeleteModel
