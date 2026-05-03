import { AsyncLocalStorage } from 'node:async_hooks'
import { Prisma, type PrismaClient, type AuditAction } from '@prisma/client'

// Models whose mutations are auto-audited at the DB layer. View/download
// events are not Prisma mutations and must be logged explicitly from the
// Route Handler that handles them (DATABASE_DESIGN.md §3h).
export const AUDIT_MODELS = ['document', 'medication', 'shareLink'] as const
const AUDIT_MODEL_SET: ReadonlySet<string> = new Set(AUDIT_MODELS)

export type AuditContext = {
  userId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}

const auditStorage = new AsyncLocalStorage<AuditContext>()

// Wrap a request handler so audit-log writes during `fn` carry the caller's
// identity. Without this, mutations from background jobs / seeds / scripts
// still audit, just with userId = null.
export function withAuditContext<T>(ctx: AuditContext, fn: () => Promise<T>): Promise<T> {
  return auditStorage.run(ctx, fn)
}

export function getAuditContext(): AuditContext | undefined {
  return auditStorage.getStore()
}

export function actionFor(operation: string, args: unknown): AuditAction | null {
  switch (operation) {
    case 'create':
    case 'createMany':
      return 'CREATE'
    case 'update':
    case 'updateMany':
    case 'upsert': {
      // Treat soft-delete (deletedAt set on a soft-deletable model) as DELETE
      // so the audit ledger reads naturally instead of as "mystery update".
      const data = (args as { data?: Record<string, unknown> } | undefined)?.data
      if (data && 'deletedAt' in data) {
        const v = data.deletedAt
        if (v instanceof Date || typeof v === 'string') return 'DELETE'
      }
      return 'UPDATE'
    }
    case 'delete':
    case 'deleteMany':
      return 'DELETE'
    default:
      return null
  }
}

export function resourceTypeForModel(model: string): string {
  return model[0]!.toUpperCase() + model.slice(1)
}

export function resourceIdFromResult(
  _operation: string,
  result: unknown,
): { id: string; count?: number } {
  // Single-row mutations (create / update / upsert / delete) return the row.
  if (
    result &&
    typeof result === 'object' &&
    'id' in (result as Record<string, unknown>) &&
    typeof (result as { id: unknown }).id === 'string'
  ) {
    return { id: (result as { id: string }).id }
  }
  // Bulk mutations return { count: N } and don't expose individual ids.
  if (
    result &&
    typeof result === 'object' &&
    'count' in (result as Record<string, unknown>) &&
    typeof (result as { count: unknown }).count === 'number'
  ) {
    return { id: '*', count: (result as { count: number }).count }
  }
  return { id: '*' }
}

// Per-model handler factory — Prisma's per-model query types don't unify
// across models, so we type loosely here and cover behavior with tests.
export function makeAuditHandler(basePrisma: PrismaClient, modelKey: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ args, query, operation }: any): Promise<any> => {
    const result = await query(args)

    const action = actionFor(operation, args)
    if (!action) return result

    const ctx = getAuditContext() ?? {}
    const resource = resourceIdFromResult(operation, result)
    const { id, count } = resource

    // Fire the audit insert through the unextended client so we (a) bypass
    // any chained extensions on `db` and (b) cannot recurse into this same
    // handler — auditLog is not in AUDIT_MODELS.
    await basePrisma.auditLog.create({
      data: {
        userId: ctx.userId ?? null,
        action,
        resourceType: resourceTypeForModel(modelKey),
        resourceId: id,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: count !== undefined ? { operation, count } : { operation },
      },
    })

    return result
  }
}

export function makeAuditLogExtension(basePrisma: PrismaClient) {
  const allOps = (modelKey: string) => ({
    $allOperations: makeAuditHandler(basePrisma, modelKey),
  })
  return Prisma.defineExtension({
    name: 'auditLog',
    query: {
      document: allOps('document'),
      medication: allOps('medication'),
      shareLink: allOps('shareLink'),
    },
  })
}

export { AUDIT_MODEL_SET }
