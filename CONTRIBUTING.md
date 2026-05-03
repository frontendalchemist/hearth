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

| Branch    | Netlify env       | Neon DB branch                    |
|-----------|-------------------|-----------------------------------|
| feature/* | (no deploy)       | local `dev` (your `.env.local`)   |
| PR open   | Deploy preview    | `preview/pr-<n>` (auto-created)   |
| staging   | Branch deploy     | `staging`                         |
| main      | Production        | `main`                            |

### Preview DB branches (automatic)

`.github/workflows/preview-db.yml` runs on every PR and manages the per-PR
Neon branch lifecycle:

- **PR opened / pushed / reopened** — creates (or recreates) a Neon branch
  named `preview/pr-<number>` parented at `main`, runs migrations, runs the
  seed script, and posts a "🌿 Preview DB ready" comment on the PR.
- **PR closed** (merged or not) — deletes the branch and updates the comment.

Dependabot PRs are skipped to keep the free-tier branch quota free for
human work. If a workflow run fails partway, the next push will clean up
the stale branch before retrying.

To use a preview branch from your local machine:

```bash
# Get the connection string (needs NEON_API_KEY in your shell):
pnpm dlx neonctl connection-string preview/pr-42

# Use it for one-off commands:
DATABASE_URL=$(pnpm dlx neonctl connection-string preview/pr-42) \
  pnpm --filter @hearth/db exec prisma studio
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

## Storybook + Chromatic

```bash
pnpm storybook         # localhost:6006
pnpm build-storybook   # static build
pnpm chromatic         # publish snapshots (needs CHROMATIC_PROJECT_TOKEN)
pnpm a11y-audit        # axe-core / WCAG AA check on every story
```

Stories live alongside components in `__stories__/` directories.

The a11y audit runs Playwright + axe-core against a running Storybook. First-time setup needs Chromium installed once (`pnpm playwright:install`); after that, run `pnpm storybook` in one terminal and `pnpm a11y-audit` in another. Override the URL or axe tags with env vars: `STORYBOOK_URL=http://… AXE_TAGS=wcag2aa pnpm a11y-audit`. Default tag set is WCAG 2.0/2.1/2.2 AA. We chose this over `@storybook/test-runner` because the latter doesn't support Storybook 10 yet — the script is a stand-in until it does.

**One-time Chromatic setup** (do this once when wiring up the project):

1. Sign in to https://chromatic.com with the GitHub account that owns the repo and create a new project linked to `PlinytheYounger/hearth`. Copy the project token from the project's Manage page.
2. Add the token to repo secrets: GitHub → Settings → Secrets and variables → Actions → New repository secret → `CHROMATIC_PROJECT_TOKEN` = the value from step 1.
3. Enable the CI job: GitHub → Settings → Secrets and variables → Actions → Variables tab → New repository variable → `CHROMATIC_ENABLED` = `true`. (The `chromatic` job is gated on this variable so the workflow doesn't fail on forks or before the secret exists.)
4. Run `pnpm chromatic` locally once with the token in env to upload the baseline; subsequent PRs will diff against it.

## Prisma workflow

```bash
# After editing packages/db/prisma/schema.prisma:
pnpm db:migrate         # creates a new migration file and applies it
pnpm db:generate        # regenerates the TypeScript client + ERD
```

`pnpm db:generate` also regenerates `packages/db/prisma/ERD.md` (a Mermaid entity-relationship diagram). It's checked into the repo so PRs that change the schema show the diagram diff — please commit the regenerated file alongside your schema changes. GitHub renders Mermaid in markdown previews, so the file is viewable directly.

## GraphQL schema

The Pothos schema in `apps/web/src/lib/graphql/schema.ts` is the source
of truth for types; the generated SDL is committed at
`packages/shared/schema.graphql` so external consumers (mobile clients,
codegen tools) can pin against it without spinning up a server.

```bash
pnpm graphql:codegen   # regenerates packages/shared/schema.graphql
```

CI runs the same command and fails the build if the committed file is
out of sync — so any PR that edits the schema must commit the
regenerated SDL alongside it. The generator uses
`lexicographicSortSchema` so output ordering is stable across runs.

## Code style

- TypeScript strict mode throughout — no `any`
- No comments explaining what code does — only why (non-obvious constraints, workarounds)
- PHI rule: never pass names, DOBs, diagnoses, or document titles to analytics or logs

## Definition of Done

Before requesting review on a PR, confirm:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:unit` passes (and new logic has a test)
- [ ] If the PR touches a Route Handler / page that hits the DB, an
      integration test or `pnpm test:e2e` smoke run covers the path
- [ ] If `packages/db/prisma/schema.prisma` changed:
      `packages/db/prisma/ERD.md` is regenerated and committed, and a
      new migration file is included
- [ ] If the GraphQL schema changed: `pnpm graphql:codegen` was run and
      `packages/shared/schema.graphql` is committed
- [ ] PR description includes a Test plan checklist (use the template
      shown in `gh pr create` examples)
- [ ] No PHI in analytics events, logs, or error messages — only
      categories, types, and counts
- [ ] No new secrets in committed files — `.env.local`, credential
      JSONs, etc. stay gitignored
- [ ] Linear issue ID in the commit subject (`<type> (HEA-#): <action>`)
