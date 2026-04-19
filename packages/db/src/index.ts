import { PrismaClient } from '@prisma/client'

// Singleton pattern — prevents exhausting the connection pool in Next.js
// dev mode (which hot-reloads modules on every save).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

export * from '@prisma/client'
