# HEA-115 — Real-DB integration test for post-login user sync

**Linear:** [HEA-115](https://linear.app/hearth-product/issue/HEA-115/03-post-login-user-sync-upsert-user-row-keyed-by-auth0sub-on-first)
**Date:** 2026-04-26
**Author:** Whitney Smith (with Claude)

## Motivation

HEA-115's scope items #1–#4 (the `beforeSessionSaved` hook and `requireAuth` updates) are already implemented in the working tree:

- `apps/web/src/lib/user-sync.ts` — `syncUser` upserts `User` keyed by `auth0Sub`
- `apps/web/src/lib/auth0.ts:4-6` — `Auth0Client` is wired with `{ beforeSessionSaved: syncUser }`
- `apps/web/src/lib/auth.ts:32-60` — `requireAuth` loads the row and returns `id` alongside session claims
- `apps/web/src/lib/user-sync.test.ts` and `auth.test.ts` — unit coverage for AC #1–#4

The only outstanding acceptance criterion is **AC #5**:

> Integration test (can live in the same file) hits the callback endpoint with a mocked Auth0 session and verifies the DB row exists.

The existing test suite is 100% mocked — every `vi.mock('@hearth/db', …)`. No test exercises the real Prisma client or a real database, so a refactor that, e.g., changed `auth0Sub` to `authSub` in the schema but not in `requireAuth`'s `where` clause would pass all current tests and break in production.

## Goal

Add one integration test that calls `syncUser` against a real Neon Postgres branch and verifies the data round-trips through the same shape `requireAuth` queries. Build a minimum-viable harness so the next integration-shaped ticket (HEA-22, MFA login end-to-end) can extend it without redesigning.

## Non-goals

- Testing the HTTP `/auth/callback` route or the `@auth0/nextjs-auth0` SDK middleware itself. The SDK is third-party code; mocking it accurately is more brittle than the bug it would catch.
- Testing `requireAuth()` end-to-end with a real session. The unit tests already cover `requireAuth`'s logic exhaustively.
- Replacing or duplicating the existing mocked unit tests. Logic coverage stays in unit; the integration suite earns its keep on **shape**.
- Running integration on direct pushes to `main`/`staging`. PR-only.
- Adding any new npm dependency.

## Architecture

```
apps/web/
├── vitest.config.ts                         (existing — unchanged)
├── vitest.integration.config.ts             (NEW)
├── src/lib/
│   ├── user-sync.test.ts                    (existing — mocked DB)
│   └── user-sync.integration.test.ts        (NEW — real DB)
└── test-utils/                              (NEW dir)
    ├── neon-branch.ts                       (NEW — branch lifecycle helper)
    └── global-setup.ts                      (NEW — Vitest globalSetup entry)

.github/workflows/ci.yml                     (MODIFIED — add integration job)
package.json (root, web)                     (MODIFIED — add test:integration scripts)
turbo.json                                   (MODIFIED — register test:integration task)
CONTRIBUTING.md                              (MODIFIED — local-dev env requirements)
```

### Lifecycle of one `pnpm test:integration` run

1. **Vitest `globalSetup`** (once before any test):
   1. POST to Neon API to create a branch from `main` named `test-${GITHUB_RUN_ID ?? Date.now()}`.
   2. Poll the branch's compute endpoint until status is `ready` (typical: <2s; cap: 30s).
   3. Capture both pooled and direct connection strings.
   4. Run `pnpm --filter @hearth/db db:migrate:deploy` against the **direct** URL (migrations need transactions; pooled mode breaks them).
   5. Export the **pooled** URL as `process.env.DATABASE_URL` for the test process.
   6. Write `{ branchId }` to `apps/web/node_modules/.cache/neon-test-branch.json` so the CI shell-level cleanup can find it.
2. **Per test**: `beforeEach` runs `TRUNCATE TABLE "User" RESTART IDENTITY CASCADE` to ensure isolation.
3. **Test body**: imports the real `db` from `@hearth/db` (no `vi.mock`), calls `syncUser`, asserts on `db.user.findUnique`.
4. **`globalTeardown`** (returned by globalSetup, runs even on failure): DELETE the branch via Neon API. Idempotent (404 swallowed).

### Branch parent: Neon's `main`

The parent here is Neon's `main` branch (the production database — distinct from git's `main` branch, though they share a name). Branching from it means the test branch starts with the production schema, then `prisma migrate deploy` applies any *new* migrations in the working tree. This catches migration bugs as a side-effect — a PR that adds a broken migration fails integration.

### Why `singleFork` + serial tests

`vitest.integration.config.ts` sets `pool: 'forks'`, `poolOptions.forks.singleFork: true`, and `sequence.concurrent: false`. TRUNCATE-between-tests only works if tests do not interleave. Today's suite has 3 cases — irrelevant. As the suite grows past ~10 cases this becomes a soft bottleneck and we revisit by either (a) scoping TRUNCATE per test file or (b) running each integration test file in its own ephemeral schema. Not in scope today.

## File-level details

### `apps/web/test-utils/neon-branch.ts`

Approximately 80 lines. No new dependency — uses global `fetch`.

Public surface:

```ts
export async function setupNeonBranch(): Promise<{ pooledUrl: string; directUrl: string }>
export async function teardownNeonBranch(): Promise<void>
```

Internals:

- Reads `NEON_API_KEY` and `NEON_PROJECT_ID` from env. Throws clear errors if absent.
- Branch name: `test-${process.env.GITHUB_RUN_ID ?? Date.now()}`.
- POSTs to `https://console.neon.tech/api/v2/projects/{NEON_PROJECT_ID}/branches` with parent set to the `main` branch's id (looked up once per run via GET `/branches`).
- Polls compute readiness with linear backoff, 1s × 30 attempts.
- Persists the created `branchId` to `node_modules/.cache/neon-test-branch.json` (atomic via temp-file rename).
- `teardownNeonBranch()` reads the cache file, DELETEs the branch, swallows 404, removes the cache file. Idempotent.

### `apps/web/test-utils/global-setup.ts`

```ts
import { setupNeonBranch, teardownNeonBranch } from './neon-branch'
import { execSync } from 'node:child_process'

export default async function () {
  const { pooledUrl, directUrl } = await setupNeonBranch()
  process.env.DATABASE_URL = pooledUrl

  execSync('pnpm --filter @hearth/db db:migrate:deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: directUrl },
  })

  return async () => {
    await teardownNeonBranch()
  }
}
```

### `apps/web/vitest.integration.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    globalSetup: './test-utils/global-setup.ts',
    hookTimeout: 60_000,
    testTimeout: 30_000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    sequence: { concurrent: false },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
```

### `apps/web/src/lib/user-sync.integration.test.ts`

Three cases, one per acceptance criterion. The third case verifies the contract between `syncUser`'s write shape and `requireAuth`'s read shape — the bug surface that mocked tests can't catch.

```ts
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
    await syncUser(session({
      sub: 'auth0|integration-1',
      email: 'm@example.com',
      name: 'Margaret',
      picture: 'https://cdn/m.png',
    }))

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
    await syncUser(session({ sub: 'auth0|integration-2', email: 'old@e.com', name: 'Old' }))
    const first = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    await syncUser(session({
      sub: 'auth0|integration-2',
      email: 'new@e.com',
      name: 'New',
      picture: 'https://cdn/new.png',
    }))
    const second = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    expect(second?.id).toBe(first?.id)
    expect(second?.createdAt).toEqual(first?.createdAt)
    expect(second?.email).toBe('new@e.com')
    expect(second?.name).toBe('New')
    expect(second?.avatarUrl).toBe('https://cdn/new.png')
  })

  it('AC#5 — the row written by syncUser is the row requireAuth would resolve', async () => {
    await syncUser(session({ sub: 'auth0|integration-3', email: 'r@e.com', name: 'R' }))

    const found = await db.user.findUnique({
      where: { auth0Sub: 'auth0|integration-3' },
      select: { id: true, email: true, name: true },
    })
    expect(found).not.toBeNull()
    expect(found?.email).toBe('r@e.com')
  })
})
```

### `apps/web/package.json` — add

```json
"test:integration": "vitest run --config vitest.integration.config.ts"
```

### Root `package.json` — add

```json
"test:integration": "turbo test:integration"
```

### `turbo.json` — add

```json
"test:integration": {
  "dependsOn": ["^build"],
  "cache": false
}
```

`cache: false` because the test outcome depends on the live Neon API and migration files.

## CI changes

New `integration` job in `.github/workflows/ci.yml`, parallel to `ci`, both depending on `secrets-scan`. PR-only via `if: github.event_name == 'pull_request'`.

```yaml
integration:
  name: Integration tests (real DB)
  runs-on: ubuntu-latest
  needs: secrets-scan
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v5
    - uses: pnpm/action-setup@v3
      with: { version: 9 }
    - uses: actions/setup-node@v5
      with: { node-version: 20, cache: pnpm }
    - run: pnpm install --frozen-lockfile
    - run: pnpm db:generate
    - name: Run integration tests
      run: pnpm test:integration
      env:
        NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
        NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
    - name: Clean up leaked Neon branch (safety net)
      if: always()
      env:
        NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
        NEON_PROJECT_ID: ${{ secrets.NEON_PROJECT_ID }}
      run: |
        F=apps/web/node_modules/.cache/neon-test-branch.json
        [ -f "$F" ] || exit 0
        BRANCH_ID=$(jq -r .branchId "$F")
        curl -fsS -X DELETE -H "Authorization: Bearer $NEON_API_KEY" \
          "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID" || true
```

Two cleanup paths protect against branch leaks:
- Vitest `globalTeardown` handles all in-process exits (success, test failure, assertion errors).
- The shell-level `if: always()` step handles the case where Vitest itself crashed (OOM, SIGKILL, runner timeout).
Both are idempotent. Both read the same cache file written during setup.

A failed `integration` job blocks PR merge — same severity as the existing `ci` job. We can downgrade to `continue-on-error: true` if early flake rates warrant, but the default is "block."

### Required GitHub secrets (manual one-time setup)

- `NEON_API_KEY` — personal Neon API key from Account → API keys.
- `NEON_PROJECT_ID` — copy from the Neon dashboard URL.

## Cross-cutting concerns

### Pooled vs. direct connection strings

Neon returns both. They are not interchangeable.

- `prisma migrate deploy` requires the **direct** URL — migrations open multi-statement transactions that pgbouncer-style pooled connections will tear apart.
- Runtime test queries use the **pooled** URL — same connection semantics as production code.

`global-setup.ts` enforces this distinction; mixing them will manifest as opaque "prepared statement does not exist" errors during migration.

### Test data conventions

- Auth0 subjects: `auth0|integration-{n}` (grep-able; can't collide with real Auth0 IDs).
- Emails: `*@example.com` (RFC 2606 reserved domain).
- Names: short literals. Even though tests don't touch analytics, the PHI rule in CLAUDE.md is a reflex worth keeping. No DOBs, no diagnoses, ever.

### Connection cleanup

Prisma's singleton pool stays open for the worker's lifetime. In `singleFork` mode the worker exits cleanly between Vitest and `globalTeardown`. If we ever see "branch deletion blocked: active connections," the fix is to call the Neon `/branches/{id}/suspend` endpoint before delete. Not adding today.

### Branch leak failure modes

Two protected paths (Vitest `globalTeardown` + CI `if: always()` shell step). One unprotected path: a developer who Ctrl-C's `pnpm test:integration` locally during the ~2s `globalSetup` window. Mitigation today: documented in CONTRIBUTING.md as "if a `test-*` branch shows up in your Neon dashboard, delete it." Future: a daily GitHub Actions cron that prunes `test-*` branches older than 24h. **Filed as follow-up, not in this ticket.**

### Local dev

Add a section to CONTRIBUTING.md under "Running tests":

```markdown
### Integration tests

Requires `NEON_API_KEY` (Account → API keys in Neon) and `NEON_PROJECT_ID` exported in your shell env. Each `pnpm test:integration` run creates a Neon branch named `test-<timestamp>`, applies migrations, runs tests, then deletes the branch. If you Ctrl-C mid-run, check your Neon dashboard for stale `test-*` branches and delete them manually.
```

Do **not** add to `.env.example` — that file is for the application's runtime env. Conflating runtime and test-infra env makes onboarding noisier.

## Acceptance criteria mapping

| AC | Where verified |
|---|---|
| #1 first login creates User row | Existing `user-sync.test.ts:26-50` (logic) + new `user-sync.integration.test.ts` AC#1 case (real DB shape) |
| #2 subsequent logins refresh mutable claims | Existing `user-sync.test.ts:52-90` (logic) + new integration AC#2 case (real DB shape, `auth0Sub`/`createdAt` invariants) |
| #3 `requireAuth` returns DB id | Existing `auth.test.ts:64-83` (already complete) |
| #4 unit test for no-DB-user → 401 | Existing `auth.test.ts:53-62` (already complete) |
| #5 integration test against real DB | **NEW** `user-sync.integration.test.ts` (this spec) |

## Out of scope (explicit, repeating non-goals for grep)

- HTTP `/auth/callback` testing
- Auth0 SDK middleware testing
- New npm dependencies
- Direct-push triggering of integration tests
- Daily branch-prune cron (filed as follow-up)
- Per-test-file ephemeral schemas (filed as follow-up if suite grows past ~10 cases)
- User deactivation/Auth0 lifecycle (HEA-34)
- Caching upserts to skip on token refresh (HEA-118)

## Follow-ups to file after this ships

1. **Daily branch-prune cron.** `.github/workflows/cleanup-test-branches.yml` running once a day, listing `test-*` branches older than 24h via Neon API, deleting them.
2. **Concurrency strategy.** When the integration suite grows past ~10 cases, `singleFork` becomes a bottleneck — revisit per-file ephemeral schemas.
