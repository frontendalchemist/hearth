# Rotating secrets

Manual quarterly rotation of all credentials used by Hearth. This runbook is the source of truth — when a secret rotates, follow the steps for that secret here. Until [HEA-123](https://linear.app/hearth-product) (auto-rotation pipeline) lands, this is the only rotation mechanism.

## When to rotate

- **Quarterly**, on a fixed cadence: Jan / Apr / Jul / Oct, first Monday of the month. The `/schedule` Linear reminder (HEA-123) is the trigger.
- **Immediately**, on any of these triggers:
  - A credential is logged, screenshot, pasted in chat, or otherwise leaks beyond its intended consumer.
  - A laptop with `.env.local` is lost or stolen.
  - A team member with access leaves.
  - A dependency advisory references a known compromise of one of these providers.
  - Gitleaks (CI) flags a commit containing one of these patterns.

## Where each secret lives

Every secret is set in **at least two places**: the local dev `.env.local` (per-developer) and Netlify production env. Some are also in GitHub Actions secrets (for CI). Rotation must update *every* location or the app breaks.

| Secret | `.env.local` | Netlify env | GitHub Actions secrets |
|---|---|---|---|
| `DATABASE_URL` (Neon) | ✅ | ✅ | ✅ (for `db:migrate:deploy` in CI) |
| `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID` | ✅ | ✅ | — |
| `AUTH0_CLIENT_SECRET` | ✅ | ✅ | — |
| `AUTH0_SECRET` (cookie encryption) | ✅ | ✅ | — |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | ✅ | ✅ | — |
| AWS access key (S3 presigning) | ✅ | ✅ | — |
| `CRON_SECRET` | ✅ | ✅ | ✅ (cron job tests) |
| `NEON_API_KEY`, `NEON_PROJECT_ID` | `.env.test.local` | — | ✅ (integration tests) |
| `CHROMATIC_PROJECT_TOKEN` | — | — | ✅ |
| `RESEND_API_KEY` *(when wired)* | ✅ | ✅ | — |
| `ANTHROPIC_API_KEY` *(when wired)* | ✅ | ✅ | — |

## Update locations — generic steps

These three commands cover most rotations:

```bash
# 1. Update Netlify env (production)
netlify env:set <KEY> <NEW_VALUE> --context production
netlify env:set <KEY> <NEW_VALUE> --context deploy-preview

# 2. Update GitHub Actions secret (only if listed in the table above)
gh secret set <KEY> --body "<NEW_VALUE>"

# 3. Update local .env.local manually
# (no command — open the file in an editor)
```

After rotating, **trigger a Netlify redeploy** (`netlify deploy --prod` or push an empty commit) so the running function picks up the new value. Functions read env vars at cold-start.

---

## Per-secret rotation steps

### `DATABASE_URL` (Neon)

1. Neon dashboard → Project → **Roles** → `neondb_owner` → **Reset password**
2. Copy the new connection string (it's URL-encoded, with the new password).
3. Update Netlify env (`production` + `deploy-preview` contexts), GitHub Actions secret, and local `.env.local`.
4. Verify locally: `pnpm db:generate && pnpm --filter @hearth/web build`
5. Trigger Netlify redeploy. Confirm `/api/health` returns 200 against prod.

### `AUTH0_CLIENT_SECRET`

1. Auth0 Dashboard → Applications → Hearth → **Settings** → scroll to bottom → **Rotate Secret**.
2. Copy the new secret. The old secret remains valid for ~1 hour during rotation.
3. Update Netlify env + local `.env.local`. (Not in GitHub Actions secrets.)
4. Trigger Netlify redeploy.
5. Verify: log in via `/auth/login` end-to-end.

### `AUTH0_SECRET` (cookie encryption key)

This one is special: rotating it **invalidates every active session** (every user is logged out). Schedule it for off-hours.

1. Generate a new value: `openssl rand -hex 32`
2. Update Netlify env + local `.env.local`.
3. Trigger Netlify redeploy.
4. Re-test login.

### `UPSTASH_REDIS_REST_TOKEN`

1. Upstash Console → your Redis database → **Details** → **Reset Token**.
2. Copy the new token. The URL doesn't change.
3. Update Netlify env + local `.env.local`.
4. Trigger Netlify redeploy. Confirm a request that hits the `user-synced:*` cache key works (any authenticated request after first login).

### AWS access key (S3 presigning)

This is the most rotation-prone secret in the inventory. Netlify doesn't support OIDC federation to AWS (no native issuer exists), so static IAM access keys are the production pattern. HEA-122 hardens the IAM user and policy; rotation cadence stays quarterly.

Steps:

1. AWS IAM → Users → the Hearth app user → **Security credentials** → **Create access key**. Pick "Application running outside AWS."
2. Copy `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`.
3. Update Netlify env (both keys, both contexts) + local `.env.local`.
4. Trigger Netlify redeploy. Test a presigned upload (visit a doc upload page, verify the PUT URL works).
5. **Only after verifying:** IAM → the user → Security credentials → mark the *old* key inactive. Wait 24h. Then delete it.

### `CRON_SECRET`

1. Generate: `openssl rand -hex 32`
2. Update Netlify env + GitHub Actions secret + local `.env.local`.
3. Trigger Netlify redeploy. Confirm cron jobs still authenticate (`netlify functions:invoke <fn>` or wait for the next scheduled run).

### `NEON_API_KEY`

1. Neon Console → Account Settings → **API Keys** → **Create new API key**. Name it `hearth-test-<date>`.
2. Copy the new value.
3. Update GitHub Actions secret + local `apps/web/.env.test.local`.
4. **Verify:** run `pnpm test:integration` locally.
5. Delete the old API key from the Neon console.

### `CHROMATIC_PROJECT_TOKEN`

1. Chromatic → Project → **Manage** → **Configure** → **Project token** → click rotate.
2. Update GitHub Actions secret only (not used elsewhere).
3. Re-run a Chromatic CI job to verify.

### `RESEND_API_KEY`, `ANTHROPIC_API_KEY` *(when these land)*

1. Provider dashboard → API keys → create new → copy.
2. Update Netlify env + local `.env.local`.
3. Trigger Netlify redeploy.
4. Verify: send a test email / make a test API call.
5. Delete the old key from the provider dashboard.

---

## After every rotation

Open a Linear comment on the rotation ticket with:

- Date and operator (you).
- Which secrets rotated.
- Anything that broke and how it was fixed.

This is the audit trail for HIPAA-adjacent compliance review later.

## Emergency / incident rotation

If a secret is **actively compromised** (not just at risk — actually leaked publicly, or a service confirms an attack):

1. **Rotate first, then communicate.** Don't wait for a ticket or approval.
2. If the compromise involves `DATABASE_URL`, also rotate `AUTH0_SECRET` defensively (since session cookies could have been read against a hijacked DB).
3. After rotation, file an incident ticket with: timeline, blast radius assessment, root cause, and follow-ups (e.g., add a CI rule to catch the leak pattern).
4. Check the audit log (`AuditLog` table) for any anomalous access during the exposure window.
