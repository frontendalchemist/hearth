# Changelog

This file tracks notable changes per milestone during Phase 0. Once we
ship to real users, format flips to per-release ([Keep a Changelog]
style) and these entries get migrated into the in-product docs.

[Keep a Changelog]: https://keepachangelog.com/en/1.1.0/

---

## Milestone 0.8 — Testing, Launch & Observability — 2026-05-03

Closes out the testing harness, error tracking, perf budget, public
docs, and PR-isolated database story before Sprint 1 starts shipping
features.

### Testing harness

- **Vitest + React Testing Library** wired into the unit-test runner
  with happy-dom + jest-dom matchers. Component tests opt into a DOM
  via `// @vitest-environment happy-dom`; the default is still `node`
  so the existing 41 server-side tests don't pay a DOM cost. First
  RTL test exercises `<PageHeader>`. (HEA-43, PR #32)
- **Playwright** smoke test runs on every PR — visits `/login`,
  asserts brand mark, tagline, and Sign-In CTA. New `e2e` job in
  `ci.yml` boots a dev server with placeholder env vars, caches
  Chromium, uploads the HTML report on failure. `/login` and
  `/api/health` were excluded from the Auth0 middleware matcher to
  let the smoke run without a real Auth0 tenant in CI.
  (HEA-44, PR #32)
- **Lighthouse CI** records a perf baseline on every PR — three
  audits of `/login` against a production build. Accessibility is
  gated at ≥0.9 (non-negotiable for the older-adult userbase);
  performance / best-practices / SEO are warnings only until a noise
  floor is established. Reports upload as a 14-day workflow artifact.
  (HEA-45, PR #36)

### Observability

- **Sentry** wired across all three Next runtimes (Node / Edge /
  browser) with HIPAA-safe defaults pinned by unit tests:
  `sendDefaultPii: false`, no session replay, `beforeSend` strips
  query strings + cookies + request bodies, `beforeBreadcrumb` drops
  `ui.input` events. SDK is opt-in via `NEXT_PUBLIC_SENTRY_DSN` —
  unset means a no-op, so dev clones without a Sentry account still
  boot. `withSentryConfig` only wraps `next.config.mjs` when
  `SENTRY_AUTH_TOKEN` is set. (HEA-14, PR #37)
- **PostHog PHI-masking flags pinned by guard tests** so a future
  toggle of `autocapture` / `mask_all_text` / `mask_all_element_attributes`
  / `capture_pageview` fails CI before it can ship. Removed unused
  `NEXT_PUBLIC_POSTHOG_HOST` env var; the browser SDK reverse-proxies
  through `/ingest` instead. (HEA-46, PR #33)

### PR workflow

- **Per-PR Neon preview DB branches** via `.github/workflows/preview-db.yml`.
  Each PR opens a `preview/pr-<n>` branch parented at `main`, runs
  migrations, runs the seed script, and posts a "🌿 Preview DB ready"
  comment. The branch is deleted on PR close (merged or not).
  Dependabot PRs are skipped to keep the free-tier branch quota free
  for human work. (HEA-47, PR #34)
- **GraphQL SDL codegen.** `apps/web/src/lib/graphql/schema.ts` is now
  the source of truth for types; the printed SDL lives at
  `packages/shared/schema.graphql` and is regenerated via
  `pnpm graphql:codegen`. CI fails the build if the committed file is
  out of sync. Schema is one placeholder query for now — Sprint 1
  adds real fields. (HEA-49, PR #35)

### Documentation

- **Mintlify docs scaffolding** — six placeholder pages (Family
  Vault, Family Workspace, Stage Navigator, Health Hub, AI Assistant,
  FAQ) added alongside the existing Getting Started, with `mint.json`
  navigation grouped under Caregiving / AI / Help. Each placeholder
  carries an explicit "Coming in Sprint X" callout. (HEA-48, PR #38)
- **CONTRIBUTING.md** rewritten across multiple PRs:
  - Vercel → Netlify in the env-pipeline table
  - New sections for Mintlify docs, GraphQL codegen, Sentry setup,
    automatic preview DB branches
  - **Definition of Done** checklist now requires: typecheck / lint /
    unit tests, integration or e2e for DB-touching code, ERD
    regeneration on schema changes, `schema.graphql` regeneration on
    schema changes, docs page added or updated for any user-visible
    change, no PHI in analytics or logs, no new secrets in committed
    files, HEA-# in commit subjects.

### Configuration required (one-time, per-engineer)

| What                      | Where                                | Why                                      |
| ------------------------- | ------------------------------------ | ---------------------------------------- |
| Sentry project + DSN      | https://sentry.io                    | Error tracking — opt-in per engineer     |
| Mintlify GitHub App       | https://github.com/settings/installations | Connect docs auto-deploy            |
| Mintlify deployment       | https://mintlify.com dashboard       | Point at `PlinytheYounger/hearth`, `/docs` |
| `docs.hearth.app` CNAME   | DNS host for `hearth.app` zone       | Custom domain for docs site              |

### Out-of-scope deferrals

- **HEA-5 (Slack workspace)** — moved to Phase 1 Sprint 9–10. Solo
  dev for Phase 0 doesn't need a `#deploys` channel yet.
- **Lighthouse `/vault` audit** (from HEA-45 spec) — `/vault` is
  auth-gated; auditing without a real session would just measure the
  redirect to `/login`. Add when a CI session-stub mechanism exists.
- **Netlify deploy-preview env wiring of preview DB branches** (from
  HEA-47 spec) — the branches exist and migrate cleanly, but
  injecting the connection string into Netlify's deploy preview env
  is a separate ticket.

### Test count delta

|             | Before milestone | After milestone |
| ----------- | ---------------- | --------------- |
| `@hearth/db`  | 52               | 52              |
| `@hearth/web` | 41               | 67              |
| **Total**     | **93**           | **119**         |
