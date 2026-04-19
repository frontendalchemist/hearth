import { db } from '@hearth/db'

// Re-export the shared Prisma client singleton.
// Import from here (not directly from @hearth/db) in Route Handlers
// so we have one place to add request-scoped middleware later.
export { db }
