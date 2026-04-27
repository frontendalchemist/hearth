# HEA-115 — User-sync integration test harness

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real-Postgres integration test for the existing `syncUser` post-login hook, plus the minimum-viable test harness (Neon ephemeral branch + Vitest globalSetup + new CI job) needed to support it.

**Architecture:** Vitest runs a separate config (`vitest.integration.config.ts`) that creates a Neon branch from production's `main`, applies migrations, runs serial tests against it, then deletes the branch. The integration test imports the real Prisma client (no mocks) and verifies `syncUser` writes the row that `requireAuth` later reads. CI runs this as a separate job, PR-only.

**Tech Stack:** Vitest 2 + Prisma 5 + Neon (ephemeral branches via REST API) + Node 20 global `fetch`. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-04-26-hea-115-user-sync-integration-test-design.md`

**Linear:** [HEA-115](https://linear.app/hearth-product/issue/HEA-115/) — branch name `whitneysmithlee/hea-115-03-post-login-user-sync-upsert-user-row-keyed-by-auth0sub-on`

**Pre-flight (executor responsibility, before Task 1):**
- Set up an isolated workspace per `superpowers:using-git-worktrees` skill, branching from `hearth_app`'s default branch.
- Run `pnpm install` and `pnpm db:generate` from the repo root so Prisma types are current.
- Confirm `NEON_API_KEY` and `NEON_PROJECT_ID` are exported in your shell (needed for Task 4). Get these from Neon Account → API keys and the Neon project URL.

---

## Task 1: Build the Neon branch lifecycle helper

The helper that creates a branch, polls until ready, returns both pooled and direct connection strings, persists the branch ID to a cache file, and tears the branch down. Mocked-fetch unit tests verify call shape and cache-file roundtrip.

**Files:**
- Create: `apps/web/test-utils/neon-branch.ts`
- Create: `apps/web/test-utils/neon-branch.test.ts`
- Modify: `apps/web/vitest.config.ts` (widen `include` glob to pick up tests under `test-utils/`; exclude `*.integration.test.ts` so the file we add in Task 4 doesn't leak into `test:unit`)

- [ ] **Step 1.1: Widen the unit-test glob and exclude integration tests**

Update `apps/web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{src,test-utils}/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 1.2: Verify nothing existing broke**

Run: `pnpm --filter @hearth/web test:unit`
Expected: PASS — same set of tests as before. The widened include adds `test-utils/`, which currently has no files, and the exclude catches `*.integration.test.ts`, which doesn't exist yet.

- [ ] **Step 1.3: Write the failing tests for `neon-branch.ts`**

Create `apps/web/test-utils/neon-branch.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve(__dirname, '..', 'node_modules', '.cache', 'neon-test-branch.json')

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  process.env.NEON_API_KEY = 'fake-key'
  process.env.NEON_PROJECT_ID = 'fake-project'
  process.env.GITHUB_RUN_ID = '12345'
})

afterEach(async () => {
  vi.unstubAllGlobals()
  await fs.unlink(CACHE_FILE).catch(() => {})
})

const okJson = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)

const errResponse = (status: number, body = '') =>
  Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(body),
  } as Response)

describe('setupNeonBranch', () => {
  it('creates a branch from main and returns both pooled and direct URLs', async () => {
    fetchMock
      // GET /branches → list, find main
      .mockReturnValueOnce(okJson({ branches: [{ id: 'br-main', name: 'main' }] }))
      // POST /branches → create
      .mockReturnValueOnce(
        okJson({
          branch: { id: 'br-test', name: 'test-12345' },
          operations: [{ id: 'op-1', status: 'scheduled' }],
        }),
      )
      // GET /operations/op-1 → finished
      .mockReturnValueOnce(okJson({ operation: { id: 'op-1', status: 'finished' } }))
      // GET /connection_uri pooled
      .mockReturnValueOnce(okJson({ uri: 'postgres://u:p@host-pooler.neon.tech/neondb' }))
      // GET /connection_uri direct
      .mockReturnValueOnce(okJson({ uri: 'postgres://u:p@host.neon.tech/neondb' }))

    const { setupNeonBranch } = await import('./neon-branch')
    const { pooledUrl, directUrl } = await setupNeonBranch()

    expect(pooledUrl).toBe('postgres://u:p@host-pooler.neon.tech/neondb')
    expect(directUrl).toBe('postgres://u:p@host.neon.tech/neondb')

    // Verify the create call shape
    const createCall = fetchMock.mock.calls[1]
    expect(createCall[0]).toContain('/projects/fake-project/branches')
    const body = JSON.parse(createCall[1].body as string)
    expect(body.branch.name).toBe('test-12345')
    expect(body.branch.parent_id).toBe('br-main')
  })

  it('writes branchId to the cache file', async () => {
    fetchMock
      .mockReturnValueOnce(okJson({ branches: [{ id: 'br-main', name: 'main' }] }))
      .mockReturnValueOnce(
        okJson({
          branch: { id: 'br-cached', name: 'test-12345' },
          operations: [{ id: 'op-1', status: 'finished' }],
        }),
      )
      .mockReturnValueOnce(okJson({ operation: { id: 'op-1', status: 'finished' } }))
      .mockReturnValueOnce(okJson({ uri: 'postgres://pooled' }))
      .mockReturnValueOnce(okJson({ uri: 'postgres://direct' }))

    const { setupNeonBranch } = await import('./neon-branch')
    await setupNeonBranch()

    const written = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'))
    expect(written).toEqual({ branchId: 'br-cached' })
  })

  it('throws a descriptive error when NEON_API_KEY is missing', async () => {
    delete process.env.NEON_API_KEY
    const { setupNeonBranch } = await import('./neon-branch')
    await expect(setupNeonBranch()).rejects.toThrow(/NEON_API_KEY/)
  })

  it('throws when no main branch exists in the project', async () => {
    fetchMock.mockReturnValueOnce(okJson({ branches: [{ id: 'br-x', name: 'staging' }] }))
    const { setupNeonBranch } = await import('./neon-branch')
    await expect(setupNeonBranch()).rejects.toThrow(/main/i)
  })
})

describe('teardownNeonBranch', () => {
  it('reads the cache file and DELETEs the branch', async () => {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId: 'br-to-delete' }))
    fetchMock.mockReturnValueOnce(okJson({}))

    const { teardownNeonBranch } = await import('./neon-branch')
    await teardownNeonBranch()

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/projects/fake-project/branches/br-to-delete')
    expect(call[1].method).toBe('DELETE')
  })

  it('swallows 404 (branch already gone)', async () => {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId: 'br-gone' }))
    fetchMock.mockReturnValueOnce(errResponse(404, 'not found'))

    const { teardownNeonBranch } = await import('./neon-branch')
    await expect(teardownNeonBranch()).resolves.toBeUndefined()
  })

  it('is a no-op when the cache file is missing', async () => {
    const { teardownNeonBranch } = await import('./neon-branch')
    await expect(teardownNeonBranch()).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 1.4: Run tests, verify they fail with "module not found"**

Run: `pnpm --filter @hearth/web test:unit test-utils/neon-branch.test.ts`
Expected: FAIL — Vitest reports it cannot resolve `./neon-branch`.

- [ ] **Step 1.5: Implement `neon-branch.ts`**

Create `apps/web/test-utils/neon-branch.ts`:

```ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NEON_API = 'https://console.neon.tech/api/v2'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.resolve(__dirname, '..', 'node_modules', '.cache', 'neon-test-branch.json')

interface CreateBranchResponse {
  branch: { id: string; name: string }
  operations: Array<{ id: string; status: string }>
}

interface OperationResponse {
  operation: { id: string; status: string; error?: string }
}

interface BranchListResponse {
  branches: Array<{ id: string; name: string }>
}

interface ConnectionUriResponse {
  uri: string
}

function requiredEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`${name} environment variable is required`)
  return v
}

async function neonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = requiredEnv('NEON_API_KEY')
  const res = await fetch(`${NEON_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Neon API ${init?.method ?? 'GET'} ${path} failed: ${res.status} ${body}`)
  }
  return (await res.json()) as T
}

async function findMainBranchId(projectId: string): Promise<string> {
  const data = await neonFetch<BranchListResponse>(`/projects/${projectId}/branches`)
  const main = data.branches.find((b) => b.name === 'main')
  if (!main) throw new Error('No main branch found in Neon project')
  return main.id
}

async function waitForOperation(projectId: string, opId: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const { operation } = await neonFetch<OperationResponse>(
      `/projects/${projectId}/operations/${opId}`,
    )
    if (operation.status === 'finished') return
    if (operation.status === 'failed') {
      throw new Error(`Neon operation ${opId} failed: ${operation.error ?? 'unknown'}`)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Neon operation ${opId} did not complete within 30s`)
}

async function getConnectionUri(
  projectId: string,
  branchId: string,
  pooled: boolean,
): Promise<string> {
  const params = new URLSearchParams({
    branch_id: branchId,
    database_name: 'neondb',
    role_name: 'neondb_owner',
    pooled: String(pooled),
  })
  const data = await neonFetch<ConnectionUriResponse>(
    `/projects/${projectId}/connection_uri?${params}`,
  )
  return data.uri
}

async function persistBranchId(branchId: string): Promise<void> {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify({ branchId }))
}

async function readPersistedBranchId(): Promise<string | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const { branchId } = JSON.parse(raw) as { branchId: string }
    return branchId
  } catch {
    return null
  }
}

export async function setupNeonBranch(): Promise<{ pooledUrl: string; directUrl: string }> {
  const projectId = requiredEnv('NEON_PROJECT_ID')
  const parentId = await findMainBranchId(projectId)
  const name = `test-${process.env.GITHUB_RUN_ID ?? Date.now()}`

  const created = await neonFetch<CreateBranchResponse>(`/projects/${projectId}/branches`, {
    method: 'POST',
    body: JSON.stringify({
      branch: { name, parent_id: parentId },
      endpoints: [{ type: 'read_write' }],
    }),
  })

  for (const op of created.operations) {
    await waitForOperation(projectId, op.id)
  }

  const branchId = created.branch.id
  const [pooledUrl, directUrl] = await Promise.all([
    getConnectionUri(projectId, branchId, true),
    getConnectionUri(projectId, branchId, false),
  ])

  await persistBranchId(branchId)
  return { pooledUrl, directUrl }
}

export async function teardownNeonBranch(): Promise<void> {
  const projectId = process.env.NEON_PROJECT_ID
  if (!projectId) return
  const branchId = await readPersistedBranchId()
  if (!branchId) return

  try {
    await neonFetch(`/projects/${projectId}/branches/${branchId}`, { method: 'DELETE' })
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes('404')) throw e
  } finally {
    await fs.unlink(CACHE_FILE).catch(() => {})
  }
}
```

- [ ] **Step 1.6: Run tests, verify they pass**

Run: `pnpm --filter @hearth/web test:unit test-utils/neon-branch.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 1.7: Run the full unit suite to make sure nothing regressed**

Run: `pnpm --filter @hearth/web test:unit`
Expected: PASS — existing tests + 7 new neon-branch tests.

- [ ] **Step 1.8: Commit**

```bash
git add apps/web/test-utils/neon-branch.ts apps/web/test-utils/neon-branch.test.ts apps/web/vitest.config.ts
git commit -m "feat(test): add Neon branch lifecycle helper for integration tests"
```

---

## Task 2: Wire up the Vitest integration config and globalSetup

Plumbing only — no TDD ritual. The configuration is verified by the actual integration test in Task 4.

**Files:**
- Create: `apps/web/test-utils/global-setup.ts`
- Create: `apps/web/vitest.integration.config.ts`

- [ ] **Step 2.1: Create the globalSetup entry**

Create `apps/web/test-utils/global-setup.ts`:

```ts
import { execSync } from 'node:child_process'
import { setupNeonBranch, teardownNeonBranch } from './neon-branch'

export default async function globalSetup() {
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

Why two URLs: `prisma migrate deploy` opens multi-statement transactions that pgbouncer-style pooled connections will tear apart, so migrations must use the direct URL. Runtime test queries use the pooled URL to match production semantics. **This is the most likely-to-bite-future-us detail** — if migrations ever fail with cryptic `prepared statement does not exist` errors, this is the first thing to check.

- [ ] **Step 2.2: Create the integration Vitest config**

Create `apps/web/vitest.integration.config.ts`:

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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

The `singleFork: true` + `concurrent: false` combination forces tests to run serially in one worker. This is required because all tests share one Postgres branch and TRUNCATE-between-tests assumes no interleaving.

- [ ] **Step 2.3: Commit**

```bash
git add apps/web/test-utils/global-setup.ts apps/web/vitest.integration.config.ts
git commit -m "feat(test): add Vitest integration config and globalSetup"
```

---

## Task 3: Add the `test:integration` script

Wire `pnpm test:integration` through Turbo so it works from both the workspace and the repo root.

**Files:**
- Modify: `apps/web/package.json` (add script)
- Modify: `package.json` (root — add script)
- Modify: `turbo.json` (register task)

- [ ] **Step 3.1: Add the workspace script**

Edit `apps/web/package.json`. Inside `"scripts"`, add this line after `"test:unit:watch"`:

```json
"test:integration": "vitest run --config vitest.integration.config.ts"
```

- [ ] **Step 3.2: Add the root pass-through**

Edit `package.json` (root). Inside `"scripts"`, add this line after `"test:e2e"`:

```json
"test:integration": "turbo test:integration"
```

- [ ] **Step 3.3: Register the Turbo task**

Edit `turbo.json`. Inside `"tasks"`, add this entry after `"test:e2e"`:

```json
"test:integration": {
  "dependsOn": ["^build"],
  "cache": false
}
```

`cache: false` because the test outcome depends on the live Neon API and migration files — Turbo's hash inputs can't capture that.

- [ ] **Step 3.4: Verify the script resolves**

Run: `pnpm test:integration --help`
Expected: Vitest's help output (proves the script is wired and the config file is found). No tests run yet because none match the include glob.

- [ ] **Step 3.5: Commit**

```bash
git add apps/web/package.json package.json turbo.json
git commit -m "feat(test): add test:integration script"
```

---

## Task 4: Write the integration test (the deliverable)

This is the actual AC #5 test. Three cases — first login, subsequent login refresh, and the contract between `syncUser`'s write shape and `requireAuth`'s read shape.

**Files:**
- Create: `apps/web/src/lib/user-sync.integration.test.ts`

- [ ] **Step 4.1: Confirm Neon credentials are exported in your shell**

Run: `echo "key=${NEON_API_KEY:0:8}... project=$NEON_PROJECT_ID"`
Expected: Both values are non-empty (the key is truncated for safety; the project ID is short enough to print in full).

If empty, export them now. Get `NEON_API_KEY` from Neon Account → API keys; get `NEON_PROJECT_ID` from your Neon project URL.

- [ ] **Step 4.2: Write the integration test**

Create `apps/web/src/lib/user-sync.integration.test.ts`:

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
    await syncUser(
      session({
        sub: 'auth0|integration-1',
        email: 'm@example.com',
        name: 'Margaret',
        picture: 'https://cdn/m.png',
      }),
    )

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
    await syncUser(
      session({ sub: 'auth0|integration-2', email: 'old@example.com', name: 'Old' }),
    )
    const first = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    await syncUser(
      session({
        sub: 'auth0|integration-2',
        email: 'new@example.com',
        name: 'New',
        picture: 'https://cdn/new.png',
      }),
    )
    const second = await db.user.findUnique({ where: { auth0Sub: 'auth0|integration-2' } })

    expect(second?.id).toBe(first?.id)
    expect(second?.createdAt).toEqual(first?.createdAt)
    expect(second?.email).toBe('new@example.com')
    expect(second?.name).toBe('New')
    expect(second?.avatarUrl).toBe('https://cdn/new.png')
  })

  it('AC#5 — the row written by syncUser is the row requireAuth would resolve', async () => {
    await syncUser(
      session({ sub: 'auth0|integration-3', email: 'r@example.com', name: 'R' }),
    )

    const found = await db.user.findUnique({
      where: { auth0Sub: 'auth0|integration-3' },
      select: { id: true, email: true, name: true },
    })
    expect(found).not.toBeNull()
    expect(found?.email).toBe('r@example.com')
  })
})
```

- [ ] **Step 4.3: Run the integration suite, expect green**

Run: `pnpm --filter @hearth/web test:integration`
Expected: PASS — all 3 cases. The first run takes ~5-15s (Neon branch creation + migrations); subsequent runs are similar because the branch is created fresh each time.

If you see a `prepared statement does not exist` error, you're hitting the pooled-URL-for-migrations bug. Re-check `global-setup.ts:9` — `db:migrate:deploy` must receive `directUrl`, not `pooledUrl`.

- [ ] **Step 4.4: Regression check — verify the test catches breakage**

Temporarily break the implementation to prove the test isn't a no-op. In `apps/web/src/lib/user-sync.ts`, locate the `await db.user.upsert({ ... })` call inside `syncUser` and comment out the entire block (the call spans 5 lines: `await db.user.upsert({` through the closing `})`).

Run: `pnpm --filter @hearth/web test:integration`
Expected: FAIL — all 3 cases fail because no row was written. Cases AC#1 and AC#2 fail at the `findUnique`-returning-`null` assertion; AC#5 fails at `expect(found).not.toBeNull()`.

- [ ] **Step 4.5: Restore `user-sync.ts` and verify green again**

Un-comment the upsert block from Step 4.4. Verify the file is byte-identical to its state before Step 4.4 (e.g. `git diff apps/web/src/lib/user-sync.ts` should be empty). Then:

Run: `pnpm --filter @hearth/web test:integration`
Expected: PASS — confirms the test is sensitive to the production code's behavior.

- [ ] **Step 4.6: Run the full unit suite to make sure nothing regressed**

Run: `pnpm --filter @hearth/web test:unit`
Expected: PASS — the unit suite ignores the integration test file via the exclude glob added in Task 1.

- [ ] **Step 4.7: Commit**

```bash
git add apps/web/src/lib/user-sync.integration.test.ts
git commit -m "test(auth): add real-DB integration test for syncUser (HEA-115 AC#5)"
```

---

## Task 5: Wire up the GitHub Actions integration job

Adds a parallel job to the CI workflow that runs `pnpm test:integration` with Neon credentials. PR-only, with a shell-level cleanup safety net.

**Files:**
- Modify: `.github/workflows/ci.yml` (add the `integration` job)
- Manual (cannot be done from here): add `NEON_API_KEY` and `NEON_PROJECT_ID` as GitHub Actions secrets

- [ ] **Step 5.1: Add the integration job**

Edit `.github/workflows/ci.yml`. After the closing of the `ci` job (after line 62 of the current file), append this new job at the same indentation level as `ci:` and `secrets-scan:`:

```yaml
  integration:
    name: Integration tests (real DB)
    runs-on: ubuntu-latest
    needs: secrets-scan
    if: github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v5

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v5
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm db:generate

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

- [ ] **Step 5.2: Validate the YAML parses**

Run: `python3 -c 'import yaml,sys; yaml.safe_load(open(".github/workflows/ci.yml"))'`
Expected: no output (success). If you get a `ScannerError`, the indentation is off — check that `integration:` is at the same column as `ci:` and `secrets-scan:`.

- [ ] **Step 5.3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add integration test job (real Neon branch, PR-only)"
```

- [ ] **Step 5.4: Add the GitHub Actions secrets (manual, in the GitHub UI)**

This step cannot be automated from here. Open the repo's settings page in a browser:

1. Go to https://github.com/<your-org>/<repo>/settings/secrets/actions
2. Click "New repository secret"
3. Add `NEON_API_KEY` with your personal Neon API key value (Account → API keys in the Neon dashboard)
4. Add `NEON_PROJECT_ID` with your Neon project ID (the segment after `/projects/` in the dashboard URL, looks like `wandering-frost-12345678`)

If you skip this step, the integration job will fail on its first run with `NEON_API_KEY environment variable is required`. That's expected and not blocking — the job is PR-only, so you can fix it before opening the PR.

---

## Task 6: Document the local-dev environment requirement

A short note in CONTRIBUTING.md so that future contributors know what `pnpm test:integration` expects.

**Files:**
- Modify: `CONTRIBUTING.md` (add a section)

- [ ] **Step 6.1: Add the integration tests section**

Edit `CONTRIBUTING.md`. After the existing "Running tests" code block (which ends with the `pnpm test:e2e` line), append this section:

```markdown
### Integration tests

Requires `NEON_API_KEY` and `NEON_PROJECT_ID` exported in your shell — get them from the Neon dashboard (Account → API keys; project ID is in the project URL).

```bash
pnpm test:integration
```

Each run creates a Neon branch named `test-<timestamp>`, applies migrations, runs tests, then deletes the branch. If you Ctrl-C mid-run, check your Neon dashboard for stale `test-*` branches and delete them — the next CI run will not clean up your locally-leaked branches.
```

- [ ] **Step 6.2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: document NEON_API_KEY/NEON_PROJECT_ID requirement for test:integration"
```

---

## Task 7: Final end-to-end verification

A last sanity check before handoff.

- [ ] **Step 7.1: Full local test suite**

Run: `pnpm test:unit && pnpm test:integration`
Expected: PASS — both suites green.

- [ ] **Step 7.2: Lint and typecheck**

Run: `pnpm lint && pnpm typecheck`
Expected: PASS — no new lint or type errors. If `noUncheckedIndexedAccess` flags anything in `neon-branch.ts` (e.g. accessing `data.branches[0]`), tighten with `?.` or explicit null checks.

- [ ] **Step 7.3: Push the branch and verify CI**

Push your branch and open a PR (or push to a PR you've already opened). Confirm in the GitHub Actions tab:
- `secrets-scan` runs and passes
- `ci` runs and passes (lint, typecheck, unit)
- `integration` runs and passes (real DB)
- The "Clean up leaked Neon branch" step shows "no cache file" or a successful 200 from the curl

If `integration` fails with `NEON_API_KEY environment variable is required`, you skipped Step 5.4. Add the secrets and re-run the job.

- [ ] **Step 7.4: Confirm no leaked branches in the Neon dashboard**

Open the Neon dashboard's branches list. There should be no `test-*` branches present after the CI run completes. If there are, both teardown paths failed — this is the case the future cron prune (filed as a follow-up in the spec) is meant to catch.

---

## Acceptance criteria mapping

| AC | Verified by |
|---|---|
| #1 first login creates User row | Existing `user-sync.test.ts:26-50` (logic, mocked) + new `user-sync.integration.test.ts` AC#1 case (real DB shape) |
| #2 subsequent logins refresh mutable claims | Existing `user-sync.test.ts:52-90` + new integration AC#2 (real DB shape, `auth0Sub`/`createdAt` invariants) |
| #3 `requireAuth` returns DB id | Existing `auth.test.ts:64-83` (already complete, no change) |
| #4 unit test for no-DB-user → 401 | Existing `auth.test.ts:53-62` (already complete, no change) |
| #5 integration test against real DB | **NEW** `user-sync.integration.test.ts` (Task 4) |

## Out of scope (explicit)

- HTTP `/auth/callback` route testing
- Auth0 SDK middleware testing
- New npm dependencies
- Direct-push triggering of integration tests
- Daily branch-prune cron (file as follow-up after this lands)
- Per-test-file ephemeral schemas (file as follow-up if the suite grows past ~10 cases)
