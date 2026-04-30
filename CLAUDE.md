# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Hearth is a HIPAA-adjacent family caregiving platform for coordinating care of aging parents. The git repo and dev commands live in `hearth_app/`; `../design_docs/` (one level up) holds the source-of-truth design docs (`ARCHITECTURE_OVERVIEW.md`, `DATABASE_DESIGN.md`, `IMPLEMENTATION_PLAN.md`, `FEATURE_SPECS_NEW.md`) — consult them before making non-trivial architectural changes.

## Commands

All commands run from `hearth_app/` and are orchestrated by Turbo over the pnpm workspace.

```bash
pnpm dev                 # Next.js dev server on :3000
pnpm build               # Turbo build of all workspaces
pnpm typecheck           # tsc --noEmit across all workspaces
pnpm lint                # ESLint
pnpm test:unit           # Vitest, no browser
pnpm test:e2e            # Playwright (requires running server)
pnpm format              # Prettier write

# Single test file / single test
pnpm --filter @hearth/web test:unit src/lib/auth.test.ts
pnpm --filter @hearth/web test:unit -- -t "requireAuth returns 401"

# Prisma — run after editing packages/db/prisma/schema.prisma
pnpm db:generate         # regenerate Prisma client
pnpm db:migrate          # create + apply a new migration (dev)
pnpm db:seed             # run packages/db/src/seed.ts
pnpm --filter @hearth/db db:migrate:deploy   # apply, no prompts (CI / preview branches)
pnpm --filter @hearth/db db:studio           # Prisma Studio
```

Env: copy `.env.example` to `apps/web/.env.local`. At minimum `DATABASE_URL` and the `AUTH0_*` group are required for the app to boot.

## Architecture

### Monorepo layout

- `apps/web` — the only deployable; Next.js 15 App Router, both UI and API live here
- `packages/db` — Prisma schema, generated client, seed script; exports `db` (singleton `PrismaClient`) and re-exports all `@prisma/client` types
- `packages/shared` — cross-package constants and types (e.g. `CARE_STAGE_LABELS`, `MAX_FILE_SIZE_BYTES`)

Always import the Prisma client through `apps/web/src/lib/db.ts` (a thin re-export of `@hearth/db`'s `db`) so request-scoped middleware can be added in one place later.

### Hosting and deployment

Hosting is **Netlify**, not Vercel — the switch was made on the `2dda574` commit. Several files still contain stale Vercel references (e.g. `apps/web/src/app/api/jobs/*/route.ts` comments mention `vercel.json`); treat those as docs drift and prefer Netlify Scheduled Functions (`netlify/functions/*`) when wiring new cron jobs. PR previews map to Neon DB branches per the table in `CONTRIBUTING.md`.

### Auth model (the easiest thing to get wrong)

Auth uses `@auth0/nextjs-auth0` **v4** with **encrypted httpOnly session cookies**. The app does **not** do manual Bearer-token JWT verification, does not request access tokens for an API audience, and does not cache JWKS in Redis — the SDK handles all of that.

- `apps/web/src/middleware.ts` calls `auth0.middleware(request)`, which auto-mounts `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile` and refreshes the session cookie on every request.
- `apps/web/src/lib/auth0.ts` constructs the `Auth0Client` and wires the `beforeSessionSaved` hook to `syncUser` (`apps/web/src/lib/user-sync.ts`), which **upserts** the `User` row keyed by `auth0Sub` on every login. Every other table joins to `User.id` (a cuid), so without this row `requireAuth()` returns 401.
- In Route Handlers and Server Components, call `requireAuth()` from `apps/web/src/lib/auth.ts`. It returns `{ id, sub, email, name, roles }` where `id` is the **DB cuid** (use this for FKs) and `sub` is the Auth0 subject. `roles` is sourced from the namespaced claim `https://hearth.app/roles` and is currently always `[]` — no post-login Action writes it. The reader is a hook for a future platform-admin gate, not the per-care-recipient RBAC.
- **Per-care-recipient RBAC** (Admin / Member / Viewer) lives in `CareRecipientMembership.role` on the database, not in the Auth0 token. Authorization checks read this table.

### Data model highlights

Schema is in `packages/db/prisma/schema.prisma`. Key invariants:

- Multi-tenancy is per `CareRecipient`. Almost every domain row carries `careRecipientId`; access is gated by the requesting user's `CareRecipientMembership` for that recipient.
- Soft-deletable models (`CareRecipient`, `Document`, `Medication`, `Provider`, `Task`) use a `deletedAt` column — filter it out in reads.
- `AuditLog` is **insert-only** (HIPAA, 7-year retention). Never write `update`/`delete` paths against it.
- Files (PDFs, images) live in **S3**, never in Postgres. The DB stores only `s3Key` + metadata. Uploads use presigned URLs so bytes never traverse the Next.js function.

### Cron-style endpoints

Route handlers under `apps/web/src/app/api/jobs/*` are protected by a shared bearer secret: they require `Authorization: Bearer ${CRON_SECRET}` and 401 otherwise. Keep this pattern when adding new scheduled endpoints.

### Analytics / PostHog (PHI rule)

`apps/web/src/lib/analytics.ts` initializes PostHog with `autocapture: false`, `mask_all_text: true`, `mask_all_element_attributes: true`, and reverse-proxies through `/ingest` (rewrites in `next.config.mjs`). Never pass names, DOBs, diagnoses, medication names, or document titles/filenames to `track()`, server logs, or any third-party service — pass categories, types, and counts only. Identify users only by internal cuid via `identifyUser(userId)`.

### Frontend conventions

- Next.js App Router with route groups: `(auth)` for unauthenticated pages, `(dashboard)` for the authenticated shell (its `layout.tsx` redirects to `/auth/login` when no session), and `api/` for Route Handlers.
- `experimental.typedRoutes` is on — `redirect('/auth/login' as Route)` and similar casts are deliberate, not lint noise.
- UI components: shadcn/ui (style `radix-nova`) installed into `apps/web/src/components/ui/` via `pnpm --filter @hearth/web dlx shadcn@latest add <name>`. Aliases: `@/components`, `@/lib`, `@/components/ui`, `@/hooks`. Icon library is lucide.
- Tailwind with CSS variables; Inter (sans) and Lora (serif) loaded as `--font-inter` / `--font-lora` in the root layout.

### TypeScript

`tsconfig.base.json` enables `strict` plus `noUncheckedIndexedAccess` and `noImplicitOverride`. No `any` (per `CONTRIBUTING.md`).

## House style (from CONTRIBUTING.md)

- TypeScript strict throughout — no `any`.
- Comments explain *why*, not *what*. Skip them unless a non-obvious constraint or workaround needs preserving.
- PHI rule (above) is non-negotiable — applies to logs and analytics, not just product UI.
