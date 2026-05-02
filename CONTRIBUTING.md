# Contributing

## Local setup

```bash
# Prerequisites: Node 20+, pnpm 9+

# 1. Install dependencies
pnpm install

# 2. Copy env template
cp .env.example apps/web/.env.local
# Fill in values — at minimum DATABASE_URL and AUTH0_* to run locally

# 3. Generate Prisma client
pnpm db:generate

# 4. Apply migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start the dev server
pnpm dev
# → http://localhost:3000
```

## Environment pipeline

| Branch | Vercel env | Neon DB branch |
|--------|-----------|---------------|
| feature/* | Preview | dev |
| PR open | Preview | preview/pr-\<n\> (auto-created) |
| staging | Preview (named) | staging |
| main | Production | main |

**Creating a preview DB branch manually:**
```bash
neon branches create --name preview/pr-42 --parent main
DATABASE_URL=$(neon connection-string preview/pr-42) pnpm db:migrate deploy
```

**Deleting a preview branch:**
```bash
neon branches delete preview/pr-42
```

## Running tests

```bash
pnpm test:unit          # Vitest (fast, no browser)
pnpm test:e2e           # Playwright (requires a running dev server or preview URL)
```

### Integration tests

Requires `NEON_API_KEY` and `NEON_PROJECT_ID`. The test harness reads them from `apps/web/.env.test.local` (gitignored) — fall back is `process.env`, so CI's GitHub Secrets path still works.

One-time setup:

```bash
cat > apps/web/.env.test.local <<EOF
NEON_API_KEY=<from Neon dashboard → Account → API keys>
NEON_PROJECT_ID=<from your Neon project URL>
EOF
```

Then:

```bash
pnpm test:integration
```

Each run creates a Neon branch named `test-<timestamp>` from the project's default branch, applies migrations, runs tests, then deletes the branch. If you Ctrl-C mid-run, check your Neon dashboard for stale `test-*` branches and delete them — the next CI run will not clean up your locally-leaked branches.

## Adding a shadcn/ui component

```bash
pnpm --filter @hearth/web dlx shadcn@latest add button
```

Components are installed to `apps/web/src/components/ui/`.

## Prisma workflow

```bash
# After editing packages/db/prisma/schema.prisma:
pnpm db:migrate         # creates a new migration file and applies it
pnpm db:generate        # regenerates the TypeScript client
```

## Code style

- TypeScript strict mode throughout — no `any`
- No comments explaining what code does — only why (non-obvious constraints, workarounds)
- PHI rule: never pass names, DOBs, diagnoses, or document titles to analytics or logs
