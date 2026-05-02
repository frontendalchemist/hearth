import { Auth0Client } from '@auth0/nextjs-auth0/server'

// No `beforeSessionSaved` hook here — the SDK runs that hook inside
// `auth0.middleware()`, which Next.js executes in the Edge Runtime, where
// Prisma cannot run. User-row sync happens lazily from `requireAuth()` via
// `ensureUserSynced` (see `./user-sync.ts`).
export const auth0 = new Auth0Client()
