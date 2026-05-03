import { PrismaClient } from '@prisma/client'
import { softDeleteExtension } from './soft-delete'
import { makeAuditLogExtension } from './audit-log'

// Singleton — prevents exhausting the connection pool in Next.js
// dev mode (which hot-reloads modules on every save).
const globalForPrisma = globalThis as unknown as { basePrisma: PrismaClient }

const basePrisma =
  globalForPrisma.basePrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.basePrisma = basePrisma
}

// Default client — applies soft-delete filtering on reads/updates, exposes
// `softDelete` / `softDeleteMany`, and auto-inserts AuditLog rows on
// document/medication/shareLink mutations. Use this everywhere unless you
// have a specific reason to bypass.
export const db = basePrisma
  .$extends(softDeleteExtension)
  .$extends(makeAuditLogExtension(basePrisma))

// Bypass — direct access to the unextended Prisma Client. Reaches past
// soft-delete filtering AND the audit-log extension. Use only for: audit
// log review, recovery / "undo delete" tooling, the `db:seed` and `db:reset`
// scripts, and integration tests that need to assert on tombstoned rows.
// Never reach for this from product code.
export const dbUnsafe = basePrisma

export { SOFT_DELETE_MODELS } from './soft-delete'
export type { SoftDeletableModelName } from './soft-delete'

export { withAuditContext, getAuditContext, AUDIT_MODELS } from './audit-log'
export type { AuditContext } from './audit-log'

export { encryptPii, decryptPii } from './crypto'

export * from '@prisma/client'
