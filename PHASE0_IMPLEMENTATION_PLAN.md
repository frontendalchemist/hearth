# Hearth — Phase 0 Implementation Plan

## Overview

Phase 0 is the pre-build foundation: infrastructure, auth, design system, security, compliance, and data architecture. It runs **Months 1–3** before Sprint 1 begins.

### Solo developer reality

This plan is written for a **solo developer** starting from scratch. The original team-sized setup (multi-account AWS org, ECS Fargate, Aurora, ArgoCD, Datadog) is the eventual target — but starting there would cost $500–800/month before a single user signs up and take weeks to configure. Instead, infrastructure is organized into three stages that you migrate through as the product grows:

| Stage | When | Target cost | Who's building |
|---|---|---|---|
| **Stage 1: Solo Build** | Now → ~500 users | ~$20–50/mo | Just you |
| **Stage 2: Early Traction** | 500–5,000 users | ~$150–300/mo | You + maybe 1–2 people |
| **Stage 3: Team Scale** | 5,000+ users, hiring | $500+/mo | Full engineering team |

The critical design constraint: **your application code should not need to change between stages** — only where it's deployed changes. All service choices below respect this.

Milestones run largely in parallel:
- **Track A (Infra + Security):** 0.2 → 0.5 → 0.7
- **Track B (Product + Compliance):** 0.1 → 0.4 → 0.3 → 0.6

---

## Milestone 0.1 — Project Setup *(Week 1)*

### GitHub Setup

For a solo developer, you don't need a GitHub Organization yet — a personal account with a private repo is fine and free. Create the org when you hire your first engineer.

**Solo setup (do now):**
- [ ] Create a private GitHub repo: `hearth` under your personal account
- [ ] Enable branch protection on `main`: require PR + passing CI before merge (even solo, this prevents accidental force-pushes)
- [ ] Enable **Dependabot alerts** and **secret scanning** (both free on private repos)
- [ ] Enable **GitHub Actions** — free tier gives 2,000 minutes/month on private repos

**When you hire your first engineer, upgrade to a GitHub Organization:**

Create the org, then configure Auth0 as a SAML IdP for SSO. Org name must be decided upfront — it's baked into the SAML audience URL and is painful to change.

In Auth0:
1. **Applications** → **Create Application** → **Regular Web App** → name it "GitHub SSO"
2. **Addons** tab → enable **SAML2 Web App** with this config:
```json
{
  "audience": "https://github.com/orgs/YOUR-ORG-NAME",
  "mappings": {
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    "name":  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
  },
  "nameIdentifierFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "nameIdentifierProbes": [
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  ]
}
```
3. Copy the **Identity Provider Login URL** and **Certificate** from the Usage tab

In GitHub:
1. Org settings → **Security** → **Authentication security** → Enable SAML
2. Paste Auth0's Login URL, issuer (`https://YOUR-TENANT.auth0.com/`), and certificate
3. Click **Test SAML configuration** — fix any errors before saving
4. **Do not** check "Require SAML" yet — each member must link their account first at `https://github.com/orgs/YOUR-ORG/sso`, then you enforce it

Org hardening settings (set these when creating the org):
```
Base permissions:        None
Repository creation:     Disabled
Require 2FA:             Enabled
Dependabot alerts:       Enabled
Secret scanning:         Enabled
```

### Other Day-1 Tasks
- [ ] **1Password** (personal plan, $3/mo) — store all credentials here from day one; never in notes or `.env` files committed to git
- [ ] **Slack** — set up free workspace; create `#deploys` and `#alerts` channels for CI/CD notifications
- [ ] **Linear** — free tier; create a project, seed Phase 0 epics

**Key deliverable:** Repo created; branch protection on; secret scanning enabled; credentials in 1Password

---

## Milestone 0.2 — Infrastructure Setup

### How the pieces fit together

There is no separate backend server. Your frontend and API are one Next.js app, deployed together on Vercel:

```
User's browser
    │
    ▼ HTTPS
Vercel
  ├─ Next.js pages (React UI)       — served from global CDN
  └─ Next.js Route Handlers (API)   — run as serverless functions
       │
       ├──▶ PostgreSQL (Neon → paid Neon)    persistent data
       ├──▶ Redis      (Upstash)              sessions, rate limits, share link TTLs
       └──▶ AWS S3     (all stages)           document files — never changes
```

S3 is the one AWS service you use from day one — there's no good substitute for HIPAA-compliant file storage. Everything else is a managed SaaS service accessible over HTTPS, which is exactly what Vercel's serverless functions need (they can't connect to a private VPC without Vercel Enterprise).

**Stage 3 note:** If you later extract a dedicated backend (triggered by mobile app, WebSockets, or hiring a backend engineer), that backend gets its own AWS VPC with RDS and ElastiCache inside it. Until then, Neon and Upstash work perfectly from Vercel's serverless environment.

---

### Stage 1: Solo Build — ~$20–50/mo *(Start here)*

| Service | What it does | Cost |
|---|---|---|
| **Vercel** | Hosts your entire Next.js app — frontend pages + API Route Handlers; auto-deploys on push; global CDN; preview URLs per PR | Free (Hobby) → $20/mo (Pro, required once you charge users) |
| **Neon** | Serverless PostgreSQL; scales to zero when idle; works over HTTPS from Vercel serverless | Free (0.5GB) |
| **Upstash** | Serverless Redis over HTTPS — compatible with Vercel serverless (no VPC needed) | Free (10k cmds/day) |
| **AWS S3** | Document file storage — the one AWS service you need immediately | ~$1–3/mo |
| **Auth0** | User authentication + MFA | Free (7,500 MAU) |
| **Resend** | Transactional email (expiry alerts, invites) | Free (3,000/mo) |
| **Sentry** | Error tracking | Free tier |
| **GitHub Actions** | CI — runs tests on every push | Free (2,000 min/mo) |

**Total: ~$5–25/month** (just S3 + small Neon overages until you upgrade to Vercel Pro)

#### Setting up AWS S3 (the only AWS you need now)

1. **Create an AWS account** at aws.amazon.com — use your real email; enable MFA on the root account immediately
2. **Never use root credentials in code.** After creating the account:
   - Go to IAM → Users → Create user: `hearth-app`
   - Attach policy: `AmazonS3FullAccess` (you'll tighten this in Stage 2)
   - Create access keys → save to 1Password
3. **Create the S3 bucket:**
   - Bucket name: `hearth-documents-prod` (names are global and permanent)
   - Region: `us-east-1` (or your preferred US region — keep consistent)
   - Block all public access: ✅ on
   - Encryption: SSE-S3 for now (upgrade to SSE-KMS in Stage 2 for HIPAA)
   - Versioning: ✅ on (protects against accidental deletes)
4. **Bucket policy** — allow only your IAM user, deny non-HTTPS:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonSSL",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": ["arn:aws:s3:::hearth-documents-prod/*"],
      "Condition": { "Bool": { "aws:SecureTransport": "false" } }
    }
  ]
}
```

#### Setting up Neon (database)
1. Sign up at neon.tech → create project → copy connection string
2. Add to your `.env`: `DATABASE_URL="postgresql://..."`
3. Run `pnpm prisma migrate deploy` — your schema is live
4. The free tier suspends the DB after 5 minutes of inactivity (fine for dev; upgrade to paid ~$19/mo for production)

#### Setting up Upstash (Redis)
1. Sign up at upstash.com → create Redis database → US region
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to your `.env`
3. Free tier: 10,000 commands/day — covers development and early users easily

#### Setting up Vercel (frontend + API)
1. Sign up at vercel.com → Add New Project → import your GitHub repo
2. Vercel detects Next.js automatically; set the root directory to `apps/web`
3. Add all environment variables in the Vercel dashboard (DATABASE_URL, UPSTASH keys, Auth0 keys, AWS keys, ANTHROPIC_API_KEY, RESEND_API_KEY)
4. Every push to `main` deploys automatically; every PR gets a live preview URL with its own environment
5. Add Cron Jobs in `apps/web/vercel.json`:
```json
{
  "crons": [
    { "path": "/api/jobs/expiry-alerts", "schedule": "0 9 * * *" },
    { "path": "/api/jobs/ai-nudges",     "schedule": "0 8 * * 1" }
  ]
}
```
6. Add `CRON_SECRET` env var in Vercel dashboard; verify it in each job Route Handler to prevent unauthorized calls

#### CI pipeline (Stage 1)
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      # Vercel deploys automatically via its GitHub integration
      # No explicit deploy step needed — Vercel handles both frontend and API
```

**Stage 1 tasks:**
- [ ] AWS account created; root MFA enabled
- [ ] IAM user `hearth-app` created; access keys in 1Password
- [ ] S3 bucket created with versioning, block public access, SSE-S3
- [ ] Neon database created; Prisma migrations applied
- [ ] Upstash Redis created; connection verified
- [ ] Auth0 configured (see Milestone 0.3)
- [ ] Vercel project deployed; frontend loads and `/api/health` Route Handler returns 200
- [ ] Vercel Cron Jobs defined in `vercel.json`; `CRON_SECRET` set
- [ ] GitHub Actions CI passing on main
- [ ] Sentry project created; errors from both UI and Route Handlers appearing in dashboard

---

### Stage 2: Early Traction — ~$80–150/mo *(trigger: approaching free tier limits, or first revenue)*

With full-stack Next.js on Vercel, Stage 2 is mostly about upgrading to paid tiers and adding compliance controls — not migrating hosting providers. Vercel stays as your host throughout.

| What changes | From | To | Cost | Why |
|---|---|---|---|---|
| **Vercel plan** | Hobby (free) | Pro ($20/mo) | $20/mo | Required for commercial use; unlocks 60s function timeout |
| **Neon plan** | Free (0.5GB, suspends) | Launch ($19/mo) | $19/mo | No suspension; 10GB storage; needed before onboarding real users |
| **Upstash plan** | Free (10k cmds/day) | Pay-as-you-go | ~$5–15/mo | Free tier exhausted at ~500 active users |
| **Email** | Resend free | AWS SES | ~$1–5/mo | HIPAA BAA available; cheaper at volume |
| **WAF** | None | Vercel Firewall (Pro feature) | Included in Pro | Block SQLi, XSS, known bad IPs — one toggle in Vercel dashboard |
| **S3 encryption** | SSE-S3 | SSE-KMS (customer-managed key) | ~$1/mo | Required for HIPAA audit trail on key access |
| **AWS BAA** | Not signed | Signed | Free | Must be signed before storing any real PHI — do this in AWS Account Settings → AWS Artifact |
| **Auth0 BAA** | Not signed | Signed (requires Enterprise plan) | ~$800+/mo | Required for HIPAA if Auth0 stores PHI; see Open Questions |
| **Custom domain** | vercel.app URL | hearth.app | ~$15/yr | Route 53 or any registrar → CNAME to Vercel |

**What does NOT change:**
- Vercel still hosts everything (no migration to App Runner or ECS)
- Neon is still your database (serverless Postgres, works great with Vercel long-term)
- Upstash is still your Redis (HTTPS-accessible from serverless — no VPC needed)
- Application code is identical — only configs and env vars change

**Stage 2 migration order:**
1. Upgrade Vercel to Pro; enable Vercel Firewall in dashboard
2. Upgrade Neon to Launch plan → verify no more suspension
3. Upgrade Upstash to pay-as-you-go
4. Upgrade S3 to SSE-KMS → create CMK in AWS KMS → update bucket encryption setting
5. Sign AWS BAA (AWS Account Settings → Artifact → Agreements)
6. Point custom domain to Vercel → update Auth0 callback URLs
7. Migrate from Resend to AWS SES → verify domain in SES → update `RESEND_API_KEY` → `SES_FROM_ADDRESS`

**Stage 2 tasks:**
- [ ] Vercel Pro activated; Vercel Firewall enabled with OWASP managed rules
- [ ] Neon Launch plan; DB no longer suspends
- [ ] Upstash on pay-as-you-go; rate limits re-verified
- [ ] S3 SSE-KMS with customer-managed key; key policy locked to app IAM user only
- [ ] AWS BAA signed
- [ ] Custom domain resolving to Vercel; HTTPS certificate auto-provisioned
- [ ] AWS SES configured; sending domain verified; Resend replaced
- [ ] CloudWatch alarms on S3 (unusual access patterns) and RDS (if added later)

---

### Stage 3: Team Scale — $500+/mo *(migrate when hiring engineers)*

This is the full setup from the original plan. Add it when you have a team that needs it.

| Addition | Why it's needed then and not now |
|---|---|
| **Dedicated backend** (`apps/api` with Fastify/Hono) | Mobile app needs a proper API; WebSockets needed; backend engineer joined; or hitting 60s Vercel limit on specific operations |
| **AWS App Runner / ECS Fargate** | Container hosting for the extracted backend; more control than Vercel for long-running processes |
| **AWS VPC + RDS + ElastiCache** | Now that your backend lives inside AWS, DB and Redis can live in the same private network — lower latency, no public internet exposure |
| **Multi-account AWS org** (dev/staging/prod) | Team of engineers; blast radius isolation; compliance; no one accidentally touches prod |
| **Terraform + Terragrunt IaC** | Team needs reproducible, code-reviewed infrastructure changes |
| **Aurora Serverless v2** (replacing RDS) | Auto-scales read capacity for traffic spikes |
| **ArgoCD** (GitOps deploys) | Multiple engineers deploying simultaneously; rollback; audit trail |
| **Datadog** | APM, distributed tracing — worth the cost with a team that needs observability |

The Stage 3 Terraform module structure to build toward:
```
infra/
├── modules/
│   ├── vpc/
│   ├── rds-aurora/
│   ├── elasticache/
│   ├── s3-vault/
│   ├── ecs-cluster/
│   ├── ecs-service/
│   ├── alb/
│   ├── cloudfront/
│   └── waf/
└── environments/
    ├── dev/
    ├── staging/
    └── prod/
```

**Key deliverable for 0.2:** Stage 1 fully operational; application deployed end-to-end; clear path documented for Stage 2 migration

---

## Milestone 0.3 — Auth & Identity Foundation *(Week 1–2)*

Auth0 is used from day one across all stages — it doesn't change, only the number of tenants grows.

### Stage 1: Single tenant setup

For solo development, one Auth0 tenant handles both local dev and production. Separate tenants (dev/staging/prod) are a Stage 2 concern when you need environment isolation for a team.

1. Sign up at auth0.com → create a tenant: `hearth` (US region)
2. **Applications** → **Create Application**:
   - Name: "Hearth Web"
   - Type: **Single Page Application**
   - Allowed callback URLs: `http://localhost:3000/api/auth/callback, https://your-vercel-url.vercel.app/api/auth/callback`
   - Allowed logout URLs: `http://localhost:3000, https://your-vercel-url.vercel.app`
3. **APIs** → **Create API**:
   - Name: "Hearth API"
   - Identifier (audience): `https://api.hearth.app`
4. Enable MFA: **Security** → **Multi-factor Auth** → enable TOTP; set policy to **Always** (required for HIPAA)

### RBAC setup

```typescript
// Roles (set as Auth0 custom claims in JWT via an Auth0 Action)
type Role = 'ADMIN' | 'COORDINATOR' | 'VIEWER' | 'CARE_RECIPIENT'

const permissions = {
  ADMIN:          ['vault:read', 'vault:write', 'vault:delete', 'vault:share',
                   'health:read', 'health:write', 'workspace:admin', 'ai:query'],
  COORDINATOR:    ['vault:read', 'vault:write', 'health:read', 'health:write',
                   'workspace:read', 'workspace:write', 'ai:query'],
  VIEWER:         ['vault:read', 'health:read', 'workspace:read', 'ai:query'],
  CARE_RECIPIENT: ['vault:read', 'health:read', 'plan:write', 'ai:query'],
}
```

Create an **Auth0 Action** (post-login trigger) to inject the user's role into the JWT:
```javascript
// Auth0 Action: "Add role to token"
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://hearth.app'
  const role = event.user.app_metadata?.role ?? 'COORDINATOR'
  api.accessToken.setCustomClaim(`${namespace}/role`, role)
  api.idToken.setCustomClaim(`${namespace}/role`, role)
}
```

### Session management
- Access token TTL: **15 minutes** (short for HIPAA)
- Refresh token: **30 days**, rotation on each use
- Refresh tokens stored in httpOnly cookies (not localStorage — never accessible to JavaScript)
- Logout: revoke refresh token at Auth0 + clear cookie

### Route Handler auth utility
```typescript
// apps/web/src/lib/auth.ts
// Called at the top of every Route Handler that requires authentication:
//   const user = await requireAuth(request)  // throws 401 if invalid
//
// Internally:
// 1. Extract session from Auth0 Next.js SDK (reads httpOnly cookie)
// 2. Verify JWT signature against Auth0 JWKS endpoint (cache public key 1hr in Upstash)
// 3. Check token expiry + audience matches your API identifier
// 4. Load user from DB by auth0Id; return user record
// 5. Throw 401 Response if any check fails
```

### Stage 2: Add separate tenants
When you have multiple environments and engineers, create `hearth-dev` and `hearth-staging` tenants alongside the existing production tenant. Update CI/CD to inject the correct `AUTH0_DOMAIN` per environment.

### Key Tasks
- [ ] Auth0 tenant created; SPA application configured
- [ ] API identifier created; JWT audience set
- [ ] MFA enabled and set to Always
- [ ] RBAC roles created (ADMIN, COORDINATOR, VIEWER, CARE_RECIPIENT)
- [ ] Auth0 Action injecting role into JWT
- [ ] Auth0 Next.js SDK wired up: login, logout, session, middleware route protection
- [ ] API JWT middleware implemented; tested with valid/expired/wrong-audience tokens
- [ ] Test user created with ADMIN role; can log in with MFA

**Key deliverable:** Login/logout/MFA working end-to-end; all API routes reject unauthenticated requests

---

## Milestone 0.4 — Design System *(Weeks 1–3)*

This milestone is the same regardless of team size — it's all local code work.

### Tool choices
| Layer | Choice | Rationale |
|---|---|---|
| Component base | **shadcn/ui** | Radix UI primitives + Tailwind — accessible, fully owned, not a package dependency |
| Styling | **Tailwind CSS** | Utility-first; design tokens in config; no CSS files to maintain |
| Icons | **Lucide React** | Consistent, tree-shakeable |
| Typography | **Inter** (via `next/font`) | Readable at aging-friendly sizes; zero layout shift |
| Storybook | **Storybook 7** | Component docs + visual testing — Chromatic free tier for solo devs |

### Design token system

```typescript
// apps/web/tailwind.config.ts — derived from the design screenshots
export default {
  theme: {
    extend: {
      colors: {
        sage:   { 50: '#f4f7f4', 100: '#e3ebe3', 500: '#5a7a5a', 700: '#3d5c3d', 900: '#1e2e1e' },
        cream:  '#f5f0e8',   // page background
        walnut: '#6b3a2a',   // dark red CTA (Emergency share button)
        alert: {
          warning: '#f59e0b',
          error:   '#ef4444',
          info:    '#3b82f6',
          success: '#22c55e',
        },
      },
      fontSize: {
        // Aging-friendly: 18px default body, generous line heights
        'body':    ['1rem',     { lineHeight: '1.625' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],  // default for body copy
        'label':   ['0.875rem', { lineHeight: '1.5' }],
        'h1':      ['1.875rem', { lineHeight: '1.25' }],
        'h2':      ['1.5rem',   { lineHeight: '1.3' }],
        'h3':      ['1.25rem',  { lineHeight: '1.4' }],
      },
    },
  },
}
```

### Component inventory (build before Sprint 1)

```
apps/web/src/components/
├── ui/                         # shadcn/ui generated components (via CLI)
│   ├── button.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── tooltip.tsx
│   └── skeleton.tsx
└── shared/                     # Custom app-level components
    ├── PageHeader.tsx           # Title + subtitle; used on every module page
    ├── StatsRow.tsx             # "14 Documents · 6 Categories · 2 Expiring" row
    ├── SectionLabel.tsx         # "QUICK ACTIONS", "REMINDERS & ALERTS" uppercase labels
    ├── AlertBanner.tsx          # Warning/error banners with CTA (missing doc, drug interaction)
    ├── EmptyState.tsx           # Icon + message + optional CTA
    └── Shell.tsx                # Sidebar + header layout wrapper
```

**Accessibility requirements on every component:**
- All interactive elements have `aria-label` or visible label
- Focus ring: `ring-2 ring-sage-500 ring-offset-2` (visible on all backgrounds)
- Color is never the only indicator — always paired with icon or text
- Touch targets minimum 44×44px

### Key Tasks
- [ ] `tailwind.config.ts` with full token set (colors, font sizes above)
- [ ] `pnpm dlx shadcn@latest init` — initialize shadcn/ui in `apps/web`
- [ ] Add all primitive components listed above via shadcn CLI
- [ ] Build `PageHeader`, `StatsRow`, `SectionLabel`, `AlertBanner`, `EmptyState`, `Shell`
- [ ] Storybook set up; stories for each custom component (default + loading + error states)
- [ ] Chromatic connected to GitHub repo (free visual regression on PRs)
- [ ] WCAG contrast check: run axe DevTools on each component in browser

**Key deliverable:** Shell layout renders; all primitive components usable in Sprint 1

---

## Milestone 0.5 — Security Baseline

Security is also tiered — the controls you need at 0 users differ from those at 5,000.

### Stage 1 security (do now)

These are non-negotiable even as a solo developer:

- **MFA on Auth0**: Already covered in 0.3 — all users require TOTP
- **MFA on AWS root account**: Enable immediately when creating the AWS account
- **S3 bucket**: Block all public access ✅; deny non-HTTPS in bucket policy (see 0.2)
- **No secrets in code**: All secrets in `.env` (gitignored) locally, and in Vercel/Railway dashboards for deployed environments. Never commit secrets. GitHub secret scanning will block you if you try.
- **HTTPS everywhere**: Vercel and Railway both provide HTTPS automatically — no config needed
- **Dependency scanning**: Dependabot on GitHub (free) — auto-PRs for vulnerable packages
- **Auth0 anomaly detection**: Enable in Auth0 dashboard → Security → Bot Detection + Brute Force Protection (free, one checkbox)

**Stage 1 tasks:**
- [ ] AWS root account MFA enabled
- [ ] S3 bucket public access blocked; HTTPS-only bucket policy applied
- [ ] `.env` in `.gitignore`; GitHub secret scanning confirmed active
- [ ] Dependabot enabled on repo
- [ ] Auth0 Bot Detection + Brute Force Protection enabled

### Stage 2 security (with real users, still on Vercel)

- **Vercel Firewall**: Enabled in the Vercel dashboard (Pro plan) — managed rules block SQLi, XSS, known bad IPs. No AWS WAF needed while your API lives on Vercel.
- **SSE-KMS on S3**: Upgrade from SSE-S3 to a customer-managed KMS key. Required for HIPAA audit trail (who accessed the key, when).
- **CloudTrail**: Enable in your AWS account — logs every S3 and KMS API call. Free tier covers most usage. Store logs in S3 with a 7-year lifecycle (HIPAA requirement).
- **AWS BAA**: Sign in AWS Account Settings → AWS Artifact → Agreements. Free, required before storing real PHI.
- **GuardDuty**: Enable on your AWS account (~$4/mo for low volume) — detects unusual S3 access, credential exposure, etc.
- **Vercel env vars remain appropriate**: Vercel encrypts env vars at rest. AWS Secrets Manager becomes relevant in Stage 3 when you have a backend server that can connect to it via IAM.

**Stage 2 tasks:**
- [ ] Vercel Firewall enabled; OWASP managed ruleset active
- [ ] S3 encryption upgraded to SSE-KMS with customer-managed key
- [ ] CloudTrail enabled; logs stored in S3 with 7-year retention
- [ ] AWS BAA signed
- [ ] GuardDuty enabled; findings alert to Slack `#alerts`

### Stage 3 security (with team)

- Full HIPAA gap assessment with legal counsel
- VPC network segmentation (already in place from Stage 2 VPC)
- SOC 2 Type I gap assessment
- Penetration test before public launch
- Incident response runbook (who to call, what to do for breach/downtime/data loss)
- Security Hub + CIS AWS Foundations benchmark

**Key deliverable for 0.5:** Stage 1 baseline active from day one; Stage 2 migration checklist documented and ready

---

## Milestone 0.6 — Legal & Compliance *(Months 1–2)*

This is primarily a legal workstream. Most of it doesn't scale with team size — the same work is needed whether you're solo or not.

**Documents to produce (with legal counsel):**
- [ ] Privacy Policy — include HIPAA Notice of Privacy Practices + CCPA disclosures
- [ ] Terms of Service
- [ ] Cookie consent banner — minimal cookies for MVP (auth session + analytics only)
- [ ] User consent to PHI processing — displayed at signup; you must store the timestamp

**Engineering tasks (required before accepting real users):**
- [ ] Consent capture at signup: store `{ userId, consentVersion, consentedAt, ipAddress }` in DB
- [ ] Cookie consent banner component — blocks analytics until accepted; choice persisted in localStorage
- [ ] Data deletion endpoint: `DELETE /api/users/me` — CCPA right-to-erasure; hard delete PII, soft delete audit logs
- [ ] Data export endpoint: `GET /api/users/me/export` — CCPA right-to-know; returns JSON of all user data

**Start now even though it's Phase 2:**
- [ ] **10DLC SMS brand registration** (Twilio) — carrier approval takes 4–8 weeks and you can't control the timeline. Submit in Month 1 even if SMS is a Phase 2 feature, or you'll be blocked when you get there.

**BAA note:** The AWS BAA (covered in 0.5) is what makes AWS HIPAA-eligible. You also need a BAA with Auth0 — this requires Auth0's **Enterprise plan** (~$800+/mo). For Stage 1 pre-PHI development, their standard plan is fine. Get the Auth0 BAA before you onboard real patients' data.

**Key deliverable:** Privacy policy + ToS drafted; consent capture in DB schema; 10DLC submitted

---

## Milestone 0.7 — Data Architecture *(Months 2–3)*

### Design principles (all stages)

- **Soft deletes everywhere**: `deletedAt DateTime?` on every model; Prisma middleware filters deleted records automatically
- **Audit log on all PHI access and mutations**: Insert-only table; retained 7 years
- **FHIR-ready columns**: Add `externalId`, `source`, `fhirJson`, `lastSyncedAt` to health entities now — costs nothing and means Phase 2 FHIR import won't require schema migrations

### Encryption approach by stage

**Stage 1:** Rely on S3 SSE-S3 for documents and Neon's built-in encryption at rest for database. This is adequate for development and testing. No PHI from real users yet.

**Stage 2:** Before accepting real PHI:
- Upgrade S3 to SSE-KMS (covered in 0.5)
- Add application-layer encryption for sensitive PII fields using AWS KMS + AES-256-GCM:

```typescript
// packages/db/src/crypto.ts
// Uses AWS KMS GenerateDataKey for envelope encryption
// Generates a data key, encrypts the plaintext with AES-256-GCM,
// stores both the encrypted data key + ciphertext.
// Data key cached in memory (5 min TTL) to reduce KMS API calls.

export async function encryptPii(plaintext: string): Promise<string>
export async function decryptPii(ciphertext: string): Promise<string>

// Fields to encrypt before writing to DB:
// CareRecipient.dateOfBirth
// CareRecipient.ssn (if collected — Phase 2)
// User.email → store as both encrypted value + SHA-256 hash (hash is used for lookups)
```

### Audit log schema

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String
  action       String   // "document.view" | "document.download" | "medication.add" | etc.
  resourceType String   // "Document" | "Medication" | "CareRecipient"
  resourceId   String
  ipAddress    String?
  userAgent    String?
  metadata     Json?    // e.g., { shareToken, expiresAt }
  createdAt    DateTime @default(now())

  @@index([userId, createdAt])
  @@index([resourceType, resourceId])
}
```

Audit log is **insert-only** — never update or delete entries. Events to log:
- `document.upload`, `document.view`, `document.download`, `document.delete`, `document.share`
- `medication.add`, `medication.update`, `medication.delete`
- `user.login`, `user.logout`, `user.invite`
- `shareLink.create`, `shareLink.access`, `shareLink.expire`
- `ai.query` — log that a query happened and which care recipient it was for; **never log the query text** (may contain PII)

### Connection pooling

**Stage 1 (Neon):** Neon has a built-in connection pooler — use the pooled connection string (ends in `-pooler.neon.tech`). No extra setup.

**Stage 2 (RDS):** RDS doesn't have built-in pooling. Add **PgBouncer** as a sidecar container in App Runner, or use **RDS Proxy** (managed by AWS, ~$15/mo extra, zero ops). For a solo developer, RDS Proxy is worth the cost.

### Migration strategy
- Prisma Migrate for all schema changes; migration files committed to git
- Run `prisma migrate deploy` as part of the CI/CD pipeline before the app starts — never run migrations manually
- Only backward-compatible migrations: add nullable columns, never drop columns in the same deploy as code removal
- Keep a staging database snapshot for testing migrations before they hit prod

### Key Tasks
- [ ] Prisma schema v1 finalized: all models from MVP plan + `AuditLog` + FHIR partition columns
- [ ] Prisma middleware for soft deletes: filter `deletedAt: null` on all queries automatically
- [ ] Prisma middleware for audit log: auto-insert on document, medication, shareLink mutations
- [ ] Baseline migration applied to Neon (dev)
- [ ] `pnpm db:seed` script with realistic fake data (use `@faker-js/faker`)
- [ ] `pnpm db:reset` script: drop + recreate + migrate + seed (local dev convenience)
- [ ] ERD generated from Prisma schema (`prisma-erd-generator` — good for documentation)
- [ ] Stage 2 prep: `encryptPii` / `decryptPii` functions stubbed (return plaintext in Stage 1, swap in real KMS implementation in Stage 2 without changing call sites)

**Key deliverable:** Schema live on Neon; audit log writing on mutations; seed data available; encryption functions stubbed and ready to activate

---

## Milestone 0.8 — Testing, Launch & Observability Foundation

**Outcome:** Testing frameworks installed; environment pipeline (local → preview → staging → prod) verified; observability tools wired up; documentation scaffolding in place before any feature sprints begin.

**Estimated time:** 2–3 days (runs in parallel with Milestones 0.3–0.7)

### Testing Framework Setup

> **Solo dev note:** Don't set all of this up on day one. The table below shows the full eventual picture, but install in tiers:
> - **Day one (Phase 0):** Vitest + React Testing Library — 15 minutes, gives you the test runner foundation.
> - **Before beta launch:** Playwright — write 5–10 tests covering login, upload, and your key flows.
> - **When it's annoying not to have it:** MSW (once DB round-trips slow down component tests), Lighthouse CI (once performance matters), axe-playwright (two extra lines in an existing Playwright test — worth adding early if accessibility is a priority).
> - **When you have a second engineer:** Chromatic — visual regression isn't worth the overhead solo; you'll see broken UI when you look at the screen.

| Tool | Purpose | Install |
|------|---------|---------|
| Vitest | Unit + integration tests (Route Handlers, utilities, Prisma helpers) | `pnpm add -D vitest @vitejs/plugin-react` |
| React Testing Library | Component unit tests | `pnpm add -D @testing-library/react @testing-library/user-event` |
| Playwright | E2E browser tests | `pnpm add -D @playwright/test` |
| axe-playwright | Accessibility (WCAG 2.1 AA scans inside Playwright tests) | `pnpm add -D @axe-core/playwright` |
| Lighthouse CI | Performance budgets in CI (LCP, CLS, TBT) | `pnpm add -D @lhci/cli` |
| Chromatic | Visual regression via Storybook snapshots — add when second engineer joins | Free tier via `chromatic` CLI |
| MSW | Mock Route Handlers in component tests without hitting real DB | `pnpm add -D msw` |

**Vitest config (`vitest.config.ts` at monorepo root):**
```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
})
```

**Playwright config (`playwright.config.ts`):**
```typescript
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
})
```

**Coverage aspirations (not hard gates in Stage 1):**
- Route Handlers: 80% line coverage
- Prisma query helpers in `packages/db`: 90% line coverage
- React components: 60% line coverage (rely on Playwright for behavioral coverage)

---

### Environment Pipeline

Vercel maps three environments to three Git branches. Use Neon's branching for isolated test databases — no shared state between PRs.

| Environment | Vercel Env | Git Branch | Database | Purpose |
|------------|-----------|-----------|----------|---------|
| Local | — | any feature branch | Neon `dev` branch | Daily coding |
| Preview | Preview | any PR | Neon `preview/pr-<n>` branch | PR review + QA |
| Staging | Preview (named) | `staging` | Neon `staging` branch | Pre-release smoke test |
| Production | Production | `main` | Neon `main` branch | Real users |

**Neon branch workflow (automate via GitHub Actions):**
```bash
# On PR open: create an isolated DB branch and run migrations
neon branches create --name preview/pr-42 --parent main
DATABASE_URL=$(neon connection-string preview/pr-42) pnpm db:migrate deploy

# On PR merge: tear down
neon branches delete preview/pr-42
```

**Promotion criteria (Stage 1 — solo dev):**
- **Preview → Staging:** Playwright smoke tests pass; no new Sentry errors in last 24 h on the preview deployment
- **Staging → Production:** Manual review on staging; Lighthouse CI score ≥ 80 on `/` and `/vault`; no open P0/P1 Sentry issues

**GitHub Actions CI (`.github/workflows/ci.yml`):**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:generate
      - run: pnpm test:unit            # Vitest
      - run: pnpm test:e2e             # Playwright against preview URL
      - run: pnpm lhci autorun         # Lighthouse CI
      - run: pnpm chromatic            # Visual regression (Storybook)
```

---

### Observability Stack

**Analytics & session replay options:**

| Tool | HIPAA BAA | Cost | Stage |
|------|-----------|------|-------|
| PostHog (cloud) | Available | Free < 1M events/mo | Stage 1 from day one |
| FullStory | Available | ~$199+/mo | Stage 2 — once you have real users and need session replay for support |
| Mixpanel | No BAA | Free tier | Avoid — no HIPAA path |

**Stage 1: PostHog setup with PHI masking:**
```typescript
// apps/web/src/lib/analytics.ts
import posthog from 'posthog-js'

export function initAnalytics() {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: '/ingest',              // proxy through your domain (avoids ad blockers)
    capture_pageview: false,          // manual control — PHI can appear in URLs
    autocapture: false,               // CRITICAL: disable in a HIPAA app
    mask_all_text: true,              // mask text content in session replay
    mask_all_element_attributes: true,
  })
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog.capture(event, properties)
  // Rule: never include names, DOBs, diagnoses, med names, document titles, or anything
  // that identifies a care recipient. Log feature usage patterns only.
}
```

**PHI masking rule (standing policy):** Never pass names, dates of birth, diagnoses, medication names, document titles, or care recipient identifiers to any third-party analytics tool. Log actions and categories only (e.g., `document_uploaded`, `{ category: 'legal' }` — not the filename).

**Error tracking (Sentry — already planned in Milestone 0.2):**
- Add `@sentry/nextjs` wizard setup
- Configure source maps upload in `next.config.ts`
- Set `tracesSampleRate: 0.1` in production

**Baseline events to instrument starting Sprint 1:**
- `user_signed_up`, `user_logged_in`
- `document_uploaded { category }`, `document_viewed`, `document_downloaded`, `document_deleted`
- `care_recipient_created`
- `ai_chat_started`, `ai_message_sent`

---

### Documentation Tooling

**User-facing docs (external product help):**
- **Tool:** Mintlify — free tier, MDX-based, connects to your GitHub repo
- **Setup:** `/docs` directory in monorepo → GitHub integration auto-deploys to `docs.hearth.app`
- **Launch content:** Getting Started guide, Family Vault walkthrough, FAQ
- **Update rule:** Add or update a docs page for every user-visible feature shipped (include this in sprint Definition of Done)

**API docs:**
- GraphQL: Enable introspection in development; export `schema.graphql` with `graphql-codegen`; host GraphQL Playground at `/api/graphql` in non-production only
- Future public REST API: Add Scalar or Redoc when you expose integrations (Phase 2+)
- Commit `schema.graphql` to the repo root and regenerate on every schema change

**Changelog:**
- **Stage 1:** Simple `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com) format
- **Stage 2:** Headway or Beamer (in-app "What's new" widget) — adds ~$29/mo but drives feature discovery
- Publish a release note for every production deployment that adds user-visible changes

---

### Milestone 0.8 Tasks

- [ ] Vitest + React Testing Library installed; `src/lib/auth.test.ts` with one passing test
- [ ] Playwright installed; E2E smoke test (`/` loads, login button visible) passing in CI
- [ ] Lighthouse CI configured; baseline performance score recorded (don't gate on it yet)
- [ ] Chromatic connected to Storybook; one Button story snapshotted
- [ ] GitHub Actions CI running all of the above on every PR
- [ ] Neon branch creation/deletion automated via GitHub Actions (or documented as a manual step until it's needed)
- [ ] PostHog account created; `NEXT_PUBLIC_POSTHOG_KEY` added to Vercel env vars; `track()` utility in `src/lib/analytics.ts`
- [ ] PostHog PHI masking settings verified (`autocapture: false`, `mask_all_text: true`)
- [ ] Sentry source maps uploading in CI; one test error captured successfully
- [ ] Mintlify project initialized at `/docs` with Getting Started page placeholder live
- [ ] `schema.graphql` generation script added to `package.json`; file committed
- [ ] `CONTRIBUTING.md` has one-page note on Neon branch workflow and environment pipeline

**Key deliverable:** Green CI pipeline; PostHog receiving events from local dev; Mintlify site live with placeholder content; Playwright smoke test + Lighthouse CI running on every PR

---

## Phase 0 → Sprint 1 Handoff Checklist

Before writing any feature code, confirm all of the following. This is the Stage 1 bar — not the full enterprise setup.

**Infrastructure:**
- [ ] App loads at Vercel URL (or localhost:3000)
- [ ] `/api/health` Route Handler returns 200 (same deployment — no separate service)
- [ ] S3 bucket exists; can upload and download a test file via presigned URL from a Route Handler
- [ ] Neon database accessible; Prisma migrations applied

**Auth:**
- [ ] Can log in and out via Auth0
- [ ] MFA prompt appears on login
- [ ] API rejects requests without a valid JWT (returns 401)
- [ ] Test user exists with ADMIN role

**Design:**
- [ ] `tailwind.config.ts` has brand color tokens (sage, cream, walnut)
- [ ] shadcn/ui initialized; Button, Card, Badge, Input working
- [ ] Sidebar shell renders; can navigate between placeholder module pages

**Security:**
- [ ] `.env` gitignored; no secrets in any committed file
- [ ] GitHub secret scanning active
- [ ] AWS root account has MFA
- [ ] S3 bucket: public access blocked, HTTPS-only

**Data:**
- [ ] `pnpm db:seed` populates realistic test data
- [ ] Audit log writes on every document mutation (verify in DB)
- [ ] Soft delete filter active (deleted records don't appear in queries)

**Compliance:**
- [ ] Privacy policy and ToS drafted (can be in review)
- [ ] Consent model exists in Prisma schema
- [ ] 10DLC SMS registration submitted

---

## Open Questions for Phase 0

1. **Auth0 BAA timing**: Auth0's Enterprise plan (required for HIPAA BAA) is expensive (~$800+/mo). Consider launching with a closed beta of trusted users before signing the BAA, which buys time before that cost kicks in. Needs a legal opinion on whether beta users constitute "patients" under HIPAA.
2. **Neon free tier limits**: The free tier suspends after 5 min idle and has 0.5GB storage. Fine for building, but upgrade to Neon's Launch plan (~$19/mo) before onboarding any real users — you don't want the DB cold-starting during a demo.
3. **Neon long-term**: Neon works well with Vercel serverless throughout Stages 1 and 2. Only migrate to RDS when you extract a dedicated backend in Stage 3 — at that point RDS Proxy (~$15/mo) is the zero-ops pooling choice over PgBouncer.
4. **10DLC timeline**: AT&T brand approval takes 4–8 weeks with no way to expedite. Submit in Month 1 even though SMS is Phase 2 — missing this blocks an entire milestone.
5. **Storybook hosting**: Chromatic (Storybook's cloud) is free for small teams and gives visual regression diffs on every PR. Worth setting up from day one even solo.
