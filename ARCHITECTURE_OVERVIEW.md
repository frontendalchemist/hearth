# Hearth — Architecture Overview

> Written for someone new to the codebase. Explains what every service is, why it exists,
> and how a request flows through the system from the user's browser to the database and back.

---

## 1. The 30-Second Map

Every request a user makes travels through this chain:

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                             │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL                                      │
│                                                                     │
│   ┌─────────────────────────────┐  ┌──────────────────────────┐    │
│   │     Next.js pages / UI      │  │   Next.js Route Handlers  │    │
│   │  React components, layouts  │  │   Your entire backend API  │    │
│   │  Rendered and served by CDN │  │   Auth, business logic,   │    │
│   └─────────────────────────────┘  │   DB queries, AI calls    │    │
│                                    └──────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌───────────────┐  ┌───────────────────────────────┐
│  PostgreSQL  │  │     Redis     │  │            AWS S3             │
│  (via Neon)  │  │  (via Upstash)│  │    Document file storage      │
│              │  │               │  │                               │
│ All app data │  │ Sessions,     │  │ PDFs, images, uploaded files  │
│ users, docs, │  │ rate limits,  │  │ Never stored in the database  │
│ medications, │  │ share link    │  │                               │
│ tasks, logs  │  │ TTLs, caching │  │                               │
└──────────────┘  └───────────────┘  └───────────────────────────────┘
```

**The key architectural decision:** There is no separate backend server. Your UI and your API both live inside the same Next.js application, deployed together on Vercel. The frontend pages and the backend Route Handlers are different folders in the same codebase.

**The golden rule:** The database stores *metadata about files*, not the files themselves. S3 stores the files. The database stores metadata about users, not their JWTs — Auth0 handles that.

---

## 2. Every Service Explained

### Vercel — Hosts Everything (see Section 3 for full details)

Vercel runs your entire Next.js application — both the UI and the API. When a user visits `hearth.app/dashboard`, Vercel renders the page. When the page calls `/api/medications`, Vercel runs that Route Handler as a serverless function. One deployment, one service, one place to manage environment variables.

### PostgreSQL (Neon → RDS) — Primary Database

Stores everything that needs to persist long-term: users, care recipients, document metadata, medications, providers, screenings, tasks, care log entries, audit logs.

Accessed exclusively through **Prisma**, a TypeScript ORM that gives you type-safe database queries. You never write raw SQL. Neon (Stage 1) and RDS (Stage 2) are both standard PostgreSQL — Prisma doesn't know or care which one it's talking to.

### Redis (Upstash → ElastiCache) — Fast Ephemeral Store

Redis is an in-memory key-value store. It's not for permanent data — it's for things that need to be fast or temporary:

| What's stored in Redis | Why not in PostgreSQL |
|---|---|
| JWT / session cache | Hit on every request; needs to be sub-millisecond |
| Rate limit counters (20 AI queries/hour) | Atomic increments need to be instant |
| Share link tokens + TTLs | Need to auto-expire after 48 hours |
| Auth0 public keys (JWKS cache) | Fetched once, cached 1 hour; saves an external API call per request |
| AI suggested questions cache | Expensive to regenerate; cache per care recipient |

If Redis goes down, nothing is permanently lost — sessions expire, users log back in, counters reset. It's a cache, not a source of truth.

### AWS S3 — Document File Storage

S3 is AWS's file storage service. Every document a user uploads (wills, insurance cards, medication lists) lives here as a binary blob. The database only stores the S3 key (a path like `documents/abc123/will-2023.pdf`) and metadata.

Files are **never routed through your API** — that would be slow and waste Vercel function execution time. Instead, the API generates a **presigned URL** (a temporary signed link directly to S3) and gives it to the browser. The browser uploads directly to S3. Explained in detail in Section 5b.

### Auth0 — Authentication & Identity

Auth0 is the "bouncer" — it handles everything about proving who a user is. Your app never stores passwords. The flow:
1. User clicks "Log in" → redirected to Auth0's login page
2. User enters credentials + MFA code on Auth0's servers (not yours)
3. Auth0 redirects back to your app with a **JWT (JSON Web Token)**
4. Your app attaches that JWT to every API call
5. Your Route Handlers verify the JWT's cryptographic signature — no round-trip to Auth0 needed

A JWT is a signed JSON object containing the user's ID, role, and expiry time. The signature is created by Auth0's private key. Your API verifies it using Auth0's *public* key (cached in Redis). If someone tampers with the payload, the signature breaks and the request is rejected.

---

## 3. Vercel — In Depth

### What it actually is

Vercel is the company that built Next.js, and their hosting platform is purpose-built for it. When you push to GitHub, Vercel:

1. Detects it's a Next.js app
2. Runs `next build`
3. Splits the output into three categories and deploys each optimally:

```
Your Next.js app after build
│
├── Static assets (JS bundles, fonts, images)
│   └── Uploaded to Vercel's global CDN — 100+ edge locations worldwide
│       Served in <50ms from anywhere. Free, no servers.
│
├── UI pages (React Server Components)
│   └── Rendered on demand as serverless functions
│       HTML generated fresh per request with real data
│
└── API Route Handlers  ← your entire backend lives here
    └── Each file in app/api/ becomes its own serverless function
        Invoked per request, scales to zero when idle
        This is where Prisma queries, S3 calls, Claude API calls happen
```

### Pricing

| Tier | Cost | Limits | When to use |
|---|---|---|---|
| **Hobby** | Free | Personal/non-commercial only; 10s function timeout; 100GB bandwidth | Local dev, demos, testing |
| **Pro** | $20/mo | Commercial use allowed; 60s timeout; 1TB bandwidth; password-protected previews | Any time you have paying users |
| **Enterprise** | Custom | SLAs, SSO, advanced security controls | Post-Series A |

**The Hobby → Pro trigger:** The moment you charge a user money, you need Pro. At $20/mo it's a non-issue — plan for it from day one so you don't scramble.

### The features you'll actually use

**Preview deployments** — every PR, even unmerged, gets a live URL:
```
main branch            → hearth.app          (production)
feature/vault-ui       → abc123.vercel.app           (live preview)
fix/drug-interactions  → def456.vercel.app           (live preview)
```
Test Auth0 callbacks, S3 uploads, and mobile layouts against a real deployed URL before merging. This is the feature that makes solo development significantly faster.

**Vercel Cron Jobs** — scheduled tasks defined in `vercel.json`, no separate worker service needed:
```json
{
  "crons": [
    { "path": "/api/jobs/expiry-alerts", "schedule": "0 9 * * *" },
    { "path": "/api/jobs/ai-nudges",     "schedule": "0 8 * * 1" }
  ]
}
```
This replaces what would otherwise require a separate background worker service.

**Streaming responses** — Vercel has first-class support for streaming, which is how the AI assistant works. Streaming is exempt from the normal function timeout — a response can stream for minutes without being cut off.

**Environment variables** — set per environment (Production / Preview / Development) in the Vercel dashboard. Your `ANTHROPIC_API_KEY` and `DATABASE_URL` live here, never in committed code.

**Automatic HTTPS** — every deployment gets a TLS certificate. No configuration.

**`next/image` optimization** — images are resized, converted to WebP, and cached automatically. Relevant for care facility photos in Care Finder (Phase 2).

### Pros

| Benefit | Detail |
|---|---|
| **Zero ops** | No servers to patch, restart, or monitor. Vercel handles uptime. |
| **One deployment** | Frontend and backend ship together. One `git push`, everything is live. |
| **No CORS** | Frontend and API are the same origin (`hearth.app`). An entire category of bugs doesn't exist. |
| **Instant rollback** | Every deploy is saved. One click to roll back to any previous version. |
| **Auto-scaling** | Serverless functions scale to zero (no idle cost) and handle traffic spikes automatically. |
| **Preview URLs** | Every PR is testable as a live deployment. |
| **Built for Next.js** | Vercel built Next.js. Features like React Server Components, streaming, and image optimization are optimized specifically for their platform. |
| **Free tier** | Genuinely useful for solo development — not a crippled trial. |

### Cons

| Limitation | Detail | Mitigation |
|---|---|---|
| **60-second function limit** | Route Handlers must respond within 60s (Pro). Streaming is exempt. | Almost never hit for this app. PDF generation is the only risk — test it. |
| **Cold starts** | Serverless functions that haven't been called recently take ~200–500ms to start. | Negligible for a web app. Users don't notice. Would matter for a low-latency trading app — not this. |
| **No WebSockets** | Vercel doesn't support persistent connections. | Not needed anywhere in the feature spec. If you ever need them (Phase 3 real-time family messaging), extract that specific feature to a separate service. |
| **Vendor lock-in** | Your API is written in Next.js conventions. Moving off Vercel requires some refactoring. | See the escape hatch below. |
| **Cost scales with usage** | Function invocations and bandwidth are billed on Pro. At very high scale (millions of users), self-hosting is cheaper. | This is a good problem to have. Cross that bridge at 100k+ users. |
| **No persistent processes** | Can't run a long-lived background worker (e.g., a queue consumer). | Use Vercel Cron Jobs for scheduled tasks. For a real queue, add a small separate worker service only when you need it. |

### The vendor lock-in escape hatch

If you ever need to move off Vercel, the migration path is clear. Your business logic doesn't change — only where it runs:

```
Next.js Route Handler (Vercel)     →    Extracted to standalone API
─────────────────────────────           ─────────────────────────────────
app/api/medications/route.ts            apps/api/src/routes/medications.ts
                                        (Fastify, Hono, or Express)
                                        Deployed to AWS App Runner or Fly.io
```

Because you're using Prisma for DB access and standard fetch/Redis for everything else, none of the business logic needs to change. The Route Handler body moves into a Fastify route handler almost line-for-line. The monorepo structure already supports this — you'd add `apps/api` when you're ready.

---

## 4. The Monorepo Structure

All code lives in one repository. There is no separate backend app — the API lives inside `apps/web`.

```
hearth/                     ← git repository root
│
├── apps/
│   └── web/                          ← Next.js app (deployed to Vercel)
│       ├── src/
│       │   ├── app/                  ← Next.js App Router
│       │   │   │
│       │   │   ├── api/              ← YOUR BACKEND — all Route Handlers live here
│       │   │   │   ├── graphql/
│       │   │   │   │   └── route.ts  ← entire GraphQL API at POST /api/graphql
│       │   │   │   ├── upload/
│       │   │   │   │   ├── presign/route.ts
│       │   │   │   │   └── confirm/[id]/route.ts
│       │   │   │   ├── ai/
│       │   │   │   │   └── chat/route.ts   ← streaming AI responses
│       │   │   │   ├── share/
│       │   │   │   │   └── [token]/route.ts
│       │   │   │   └── jobs/               ← Vercel Cron Job targets
│       │   │   │       ├── expiry-alerts/route.ts
│       │   │   │       └── ai-nudges/route.ts
│       │   │   │
│       │   │   ├── (auth)/           ← login/callback pages (no shell)
│       │   │   ├── (app)/            ← authenticated pages (with sidebar shell)
│       │   │   │   ├── dashboard/page.tsx
│       │   │   │   ├── vault/page.tsx
│       │   │   │   ├── health/page.tsx
│       │   │   │   ├── stage-navigator/page.tsx
│       │   │   │   ├── workspace/page.tsx
│       │   │   │   └── ai/page.tsx
│       │   │   └── share/[token]/page.tsx  ← public share link (no auth)
│       │   │
│       │   ├── components/           ← React UI components
│       │   ├── hooks/                ← TanStack Query data fetching hooks
│       │   ├── lib/                  ← shared utilities (auth helpers, S3 client, etc.)
│       │   └── middleware.ts         ← Next.js middleware (route protection)
│       │
│       ├── vercel.json               ← Cron job definitions
│       └── package.json
│
├── packages/
│   ├── db/                           ← Prisma — shared between web and any future api
│   │   ├── prisma/
│   │   │   ├── schema.prisma         ← single source of truth for all DB models
│   │   │   └── migrations/
│   │   └── src/
│   │       └── crypto.ts             ← PII encryption helpers
│   │
│   └── shared/                       ← TypeScript types + Zod schemas used in both
│       └── src/                         UI forms and Route Handler validation
│           ├── schemas/
│           └── types/
│
├── package.json                      ← pnpm workspace root
└── turbo.json                        ← Turborepo build orchestration
```

**Why a monorepo even without a separate backend?** The `packages/db` directory means your Prisma client and schema are in one place. When you eventually add `apps/api`, it imports from the same `packages/db` — no duplication, no schema drift between apps.

**Why `packages/shared`?** You define a Zod schema once — e.g., the shape of a medication — and use it for both form validation in the UI and request validation in the Route Handler. Same schema, zero duplication, TypeScript catches mismatches at compile time.

---

## 5. Request Flows — Step by Step

### 5a. A Normal Page Load (Authenticated User)

In the full-stack Next.js model, the page and the data fetching happen in the same process on Vercel:

```
Browser                         Vercel (Next.js)                    PostgreSQL
  │                                    │                                 │
  │── GET /dashboard ─────────────────▶│                                 │
  │                                    │ 1. Next.js middleware checks    │
  │                                    │    Auth0 session cookie.        │
  │                                    │    No cookie → redirect /login  │
  │                                    │                                 │
  │                                    │ 2. Server component runs:       │
  │                                    │    fetch('/api/graphql', {      │
  │                                    │      query: GET_ALERTS })       │
  │                                    │    (this is an internal call    │
  │                                    │     — no network hop)           │
  │                                    │                                 │
  │                                    │── SELECT alerts ───────────────▶│
  │                                    │   WHERE userId = ...            │
  │                                    │◀── alerts data ─────────────────│
  │                                    │                                 │
  │                                    │ 3. Render HTML with real data   │
  │◀── Full HTML page ────────────────│                                 │
  │    (no loading spinner,            │                                 │
  │     data is already in the HTML)   │                                 │
```

**Why no loading spinner on first load?** Server components run on Vercel before the HTML reaches the browser, so the data is already in the page. The browser receives finished HTML — not a shell that then makes API calls. This is a performance advantage of full-stack Next.js.

### 5b. Document Upload (Presigned URL Pattern)

Files never pass through your Route Handler — that would be slow and waste function memory.

```
Browser              Route Handler (/api/upload)    AWS S3        PostgreSQL
  │                          │                         │               │
  │ User selects file         │                         │               │
  │                          │                         │               │
  │── POST /api/upload/  ───▶│                         │               │
  │   presign                │ 1. Validate JWT         │               │
  │   { filename, mimeType,  │    Create Document      │               │
  │     careRecipientId }    │    record (pending)     │               │
  │                          │                         │── INSERT ─────▶│
  │                          │                         │◀── doc.id ─────│
  │                          │                         │               │
  │                          │ 2. Call S3 SDK to       │               │
  │                          │    generate a presigned │               │
  │                          │    upload URL           │               │
  │                          │──── createPresignedPost ▶│               │
  │                          │◀─── uploadUrl ──────────│               │
  │                          │     (valid 5 min only)  │               │
  │                          │                         │               │
  │◀── { uploadUrl, docId } ─│                         │               │
  │                          │                         │               │
  │ 3. Browser uploads       │                         │               │
  │    directly to S3        │                         │               │
  │    (Route Handler is     │                         │               │
  │     not involved)        │                         │               │
  │─────────── PUT file bytes ────────────────────────▶│               │
  │◀─────────── 200 OK ───────────────────────────────│               │
  │                          │                         │               │
  │── POST /api/upload/  ───▶│                         │               │
  │   confirm/:docId         │ 4. Mark doc uploaded;   │               │
  │                          │    queue AI categorize  │── UPDATE ─────▶│
  │                          │                         │◀── OK ─────────│
  │◀── { document } ─────────│                         │               │
```

### 5c. Authentication Flow (Login)

```
Browser                   Auth0                   Route Handler          PostgreSQL
  │                          │                          │                    │
  │ Click "Log in"           │                          │                    │
  │                          │                          │                    │
  │── Redirect ─────────────▶│                          │                    │
  │   auth0.com/login        │                          │                    │
  │                          │                          │                    │
  │   Enter email +          │                          │                    │
  │   password + MFA code    │                          │                    │
  │   (on Auth0's servers,   │                          │                    │
  │    never yours)          │                          │                    │
  │                          │                          │                    │
  │◀── Redirect ─────────────│                          │                    │
  │    /api/auth/callback    │                          │                    │
  │    ?code=xyz             │                          │                    │
  │                          │                          │                    │
  │    Auth0 Next.js SDK     │                          │                    │
  │    exchanges code for    │                          │                    │
  │    JWT automatically     │                          │                    │
  │──── POST /oauth/token ───▶                          │                    │
  │◀─── { access_token,  ────│                          │                    │
  │       refresh_token }    │                          │                    │
  │                          │                          │                    │
  │    JWT stored in         │                          │                    │
  │    httpOnly cookie       │                          │                    │
  │    (JS cannot read it)   │                          │                    │
  │                          │                          │                    │
  │    On first login, SDK   │                          │                    │
  │    calls your API to     │                          │                    │
  │    create/sync the user  │                          │                    │
  │────────────────────────────────────────────────────▶│                    │
  │                          │                          │── UPSERT user ────▶│
  │                          │                          │   WHERE auth0Id=.. │
  │                          │                          │◀── user record ────│
  │◀─────────────────────────────────────────────────── user data ───────────│

Every subsequent API call:
  │── Any request ───────────────────────────────────▶Route Handler          │
  │   Cookie: session=...    │                          │                    │
  │                          │                          │ Auth0 SDK extracts │
  │                          │                          │ + verifies JWT     │
  │                          │                          │ from cookie.       │
  │                          │                          │ No network call to │
  │                          │                          │ Auth0 needed —     │
  │                          │                          │ signature verified │
  │                          │                          │ locally using      │
  │                          │                          │ cached public key. │
```

### 5d. AI Assistant Query

```
Browser           Route Handler (/api/ai/chat)    Anthropic API      PostgreSQL
  │                        │                            │                  │
  │ "Is Sertraline safe     │                            │                  │
  │  for Mom?"             │                            │                  │
  │                        │                            │                  │
  │── POST /api/ai/chat ──▶│                            │                  │
  │   { query,             │ 1. Verify JWT              │                  │
  │     careRecipientId }  │    Check rate limit        │                  │
  │                        │    (Redis: 20/hr per user) │                  │
  │                        │                            │                  │
  │                        │ 2. Load care recipient     │                  │
  │                        │    profile from DB ────────────────────────▶  │
  │                        │    (meds, conditions,      │◀── profile ───── │
  │                        │     stage, providers)      │                  │
  │                        │                            │                  │
  │                        │ 3. Strip PII from query:   │                  │
  │                        │    remove SSNs, full names,│                  │
  │                        │    DOBs, account numbers   │                  │
  │                        │                            │                  │
  │                        │ 4. Build system prompt:    │                  │
  │                        │    "Patient is 82yo female │                  │
  │                        │     Stage 2, taking        │                  │
  │                        │     Lisinopril 10mg..."    │                  │
  │                        │    (no real name/DOB)      │                  │
  │                        │                            │                  │
  │                        │── stream request ─────────▶│                  │
  │                        │   model: claude-sonnet-4-6 │                  │
  │                        │   messages: [system, user] │                  │
  │                        │                            │                  │
  │◀── SSE stream ─────────│◀── token stream ───────────│                  │
  │  "Sertraline"          │                            │                  │
  │  " (Zoloft)"           │                            │                  │
  │  " is flagged..."      │                            │                  │
  │  [DONE]                │                            │                  │
  │                        │                            │                  │
  │                        │ 5. Write audit log         │                  │
  │                        │    action: "ai.query"      │                  │
  │                        │    NO query content logged ────────────────▶  │
```

**SSE (Server-Sent Events)** is a one-way stream from server to browser. As Claude generates each token, the Route Handler forwards it immediately. This is why text appears to "type itself."

**PII stripping** happens before the query reaches Anthropic. Claude sees "an 82-year-old female in Stage 2 with hypertension, taking Lisinopril 10mg and Sertraline 50mg" — never a real name or date of birth. The query text is never written to the audit log for the same reason.

---

## 6. The Data Layer in Detail

### What lives where

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                  │
│                                                                     │
│  Users, CareRecipients, Memberships                                 │
│  Documents (S3 key + metadata — no file bytes)                      │
│  Medications, Conditions, Allergies                                  │
│  Providers, Appointments, Screenings                                 │
│  Tasks, CareLogEntries                                              │
│  AuditLogs (insert-only, 7yr retention)                             │
│  ShareLinks (token + expiry)                                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                             Redis                                    │
│                                                                     │
│  session:{userId}       → JWT payload cache (5min TTL)              │
│  ratelimit:{userId}     → AI query counter (1hr rolling window)     │
│  share:{token}          → share link metadata + TTL (48hr)          │
│  jwks:auth0             → Auth0 public keys (1hr TTL)               │
│  suggest:{recipientId}  → AI suggested questions (24hr TTL)         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                            AWS S3                                    │
│                                                                     │
│  documents/{careRecipientId}/{documentId}/{filename}                │
│  emergency-packets/{shareToken}.pdf                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### How Prisma works

Prisma is the layer between your Route Handlers and PostgreSQL. You define models in `schema.prisma`, and Prisma generates a TypeScript client:

```typescript
// Instead of raw SQL like:
// SELECT * FROM medications WHERE care_recipient_id = $1 AND deleted_at IS NULL

// You write:
const medications = await prisma.medication.findMany({
  where: {
    careRecipientId: id,
    deletedAt: null,       // soft delete filter
  },
  include: {
    interactions: true,   // JOIN to related table, fully typed
  },
})
// TypeScript knows the exact shape of every object in `medications`
```

**Soft deletes** mean records are never removed from the database — `deletedAt` is set instead. Prisma middleware automatically appends `WHERE deletedAt IS NULL` to every query. Deleted records are invisible to the app but exist forever for audit purposes.

### The audit log

Every action involving PHI writes an insert-only record. It's the answer to "who accessed Dorothy's will on April 18th?" HIPAA requires this for 7 years:

```
AuditLog
──────────────────────────────────────────────────────
userId        → who did it
action        → "document.download" | "medication.add" | "ai.query" | ...
resourceType  → "Document" | "Medication" | "CareRecipient"
resourceId    → the specific record ID
ipAddress     → where the request originated
createdAt     → timestamp (never updated — insert only)
```

---

## 7. The API Layer

### GraphQL vs. REST — why both

```
GraphQL  → used for:  reading data, mutations (add medication, complete task, etc.)
           why:       frontend requests exactly the fields it needs — nothing more.
                      One endpoint. Strongly typed. Great tooling (codegen).

REST     → used for:  file upload presigning, file download, emergency packet PDF,
                      AI streaming (SSE), Cron Job endpoints
           why:       file ops and streaming don't map naturally to GraphQL
```

### How a GraphQL request works

```typescript
// Frontend sends this query — requests only the fields it needs:
query GetDashboardAlerts($careRecipientId: ID!) {
  dashboardAlerts(careRecipientId: $careRecipientId) {
    type
    message
    priority
    actionUrl
  }
}

// Route Handler at POST /api/graphql receives it
// Finds the resolver for `dashboardAlerts`
// Resolver runs:
//   - fetch expiring documents from Prisma
//   - fetch missing required documents
//   - fetch flagged drug interactions
//   - fetch upcoming appointments
//   - sort by priority, return
// Returns exactly what was asked for — nothing else
```

### Request middleware chain

Every Route Handler runs this chain before executing:

```
Incoming request to any /api/* route
      │
      ▼
Auth0 session check
(extract + verify JWT from cookie; reject 401 if invalid or expired)
      │
      ▼
Rate limiting
(Redis counter: has this user exceeded their limit?)
      │
      ▼
Permission check
(does this user's membership grant access to this careRecipientId?)
      │
      ▼
Route Handler / GraphQL resolver
(business logic runs here)
      │
      ▼
Audit log write
(if this request touched PHI, insert audit record)
      │
      ▼
Response sent
```

If any step fails, the chain stops. A request without a valid JWT never reaches your business logic.

---

## 8. The Frontend Data Flow

### Two kinds of state

```
┌──────────────────────────────────────────────────────────────────┐
│                    Zustand  (UI state)                            │
│                                                                  │
│  activeCareRecipientId  → which profile is selected              │
│  sidebarOpen            → is the nav collapsed?                  │
│  activeModal            → which modal is currently open?         │
│                                                                  │
│  Lives in memory only. Lost on refresh. Never hits the server.   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                TanStack Query  (server state)                     │
│                                                                  │
│  useDocuments(careRecipientId)    → fetches + caches API data    │
│  useMedications(careRecipientId)  → fetches + caches API data    │
│  useDashboardAlerts(...)          → fetches + caches API data    │
│                                                                  │
│  Fetches from /api/graphql, caches the result, automatically     │
│  refetches when cache expires or when a mutation invalidates it. │
└──────────────────────────────────────────────────────────────────┘
```

### How mutations keep the UI in sync

```
User clicks "Add medication"
      │
      ▼
useMutation hook fires
      │
      ├──▶ Optimistic update: medication added to local cache immediately
      │    UI shows the new entry instantly — no spinner
      │
      └──▶ POST /api/graphql (mutation runs in background)
                │
                ├── success → TanStack Query invalidates medications cache
                │             Refetches from server
                │             Server data replaces the optimistic entry
                │
                └── failure → Optimistic update rolled back
                              Error toast shown
                              UI returns to previous state
```

---

## 9. CI/CD — How Code Gets to Production

With full-stack Next.js, there is only **one deployment** — Vercel. No separate backend deploy step.

```
Your laptop
│
│  git push origin feature/add-medication-form
│
▼
GitHub
│
│  GitHub Actions triggers on push
│
▼
┌──────────────────────────────────────────┐
│         CI  (.github/workflows/ci.yml)   │
│                                          │
│  pnpm install --frozen-lockfile          │
│  pnpm typecheck   ← TypeScript errors?  │
│  pnpm lint        ← style issues?       │
│  pnpm test        ← unit tests pass?    │
│                                          │
│  Fail → PR blocked, email sent          │
└─────────────────┬────────────────────────┘
                  │ All checks pass
                  ▼
           Open Pull Request
           (review your own diff,
            check the preview URL,
            merge when satisfied)
                  │
                  ▼
            Merge to main
                  │
                  ▼
     Vercel detects push to main
     Builds Next.js app (next build)
     Runs DB migrations (prisma migrate deploy)
     Deploys to hearth.app
     ← ~60 seconds total

Every PR also gets automatically:
  └──▶ Vercel preview URL (live, shareable, has its own env vars)
       Auth0 callback URL must include this domain for it to work
       Add *.vercel.app to Auth0 allowed callback URLs
```

---

## 10. Stage 1 vs Stage 2 — The Migration

Only infrastructure changes between stages. Application code is identical.

```
STAGE 1  (~$20–30/mo)                   STAGE 2  (~$150–200/mo)
──────────────────────────────          ──────────────────────────────────────
Frontend + API:  Vercel      ─────────▶  Frontend + API:  Vercel (unchanged)
Database:        Neon        ─────────▶  Database:        AWS RDS PostgreSQL
Redis:           Upstash     ─────────▶  Redis:           AWS ElastiCache
Storage:         AWS S3      ─────────▶  Storage:         AWS S3 (unchanged)
Auth:            Auth0       ─────────▶  Auth:            Auth0 (unchanged)
Secrets:         Vercel env  ─────────▶  Secrets:         AWS Secrets Manager
                 vars
WAF:             None        ─────────▶  WAF:             AWS WAF
BAA:             Not signed  ─────────▶  BAA:             AWS BAA signed ←
                                                          required for real PHI
```

Migration is just connection string swaps. No code changes needed.

---

## 11. Scaling Beyond Vercel — When and How

Vercel handles the vast majority of what this app needs. Here's an honest picture of when you'd outgrow it and what to do.

### Trigger 1: You need WebSockets

**When:** Phase 3 real-time family messaging (not in MVP or Phase 2).

**What to do:** Add a single small service — just for WebSockets — alongside Vercel. Everything else stays. Good options: [Ably](https://ably.com) (managed, free tier), [Soketi](https://soketi.app) (self-hosted on Fly.io, ~$3/mo), or Cloudflare Durable Objects.

```
hearth.app  →  Vercel (everything except real-time)
ws.hearth.app  →  Ably / Soketi (WebSocket only)
```

### Trigger 2: You're hitting the 60-second function limit

**When:** A specific operation (e.g., bulk PDF generation) is consistently slow.

**What to do:** Move *only that operation* to a separate service. Everything else stays on Vercel.

```
POST /api/emergency-packet  →  still on Vercel
POST /api/jobs/bulk-export  →  extracted to Fly.io worker (~$3/mo)
```

### Trigger 3: You hire a dedicated backend engineer

**When:** Team is big enough that frontend/backend separation makes sense organizationally.

**What to do:** Extract `apps/web/src/app/api/` into a new `apps/api` directory (Fastify or Hono). The monorepo already supports this structure. Deploy `apps/api` to AWS App Runner or Fly.io. Point Vercel's frontend at the new API URL. Business logic doesn't change — just moves files.

```
Before:  apps/web/src/app/api/medications/route.ts
After:   apps/api/src/routes/medications.ts
         (same Prisma queries, same business logic)
```

### Trigger 4: Cost becomes significant at scale

**When:** 100k+ users, Vercel function invocations are adding up.

**What to do:** Migrate the API to AWS ECS Fargate (always-on container, not serverless). This is the full Stage 3 setup from the Phase 0 plan. At high volume, a persistent container is cheaper than millions of serverless invocations.

### Summary: the scaling ladder

```
Now                                 Later (event-triggered, not date-triggered)
────────────────────────────────    ──────────────────────────────────────────────
Vercel (full-stack Next.js)   ──▶  Vercel + dedicated WebSocket service
                              ──▶  Vercel + Fly.io worker (slow operations only)
                              ──▶  Vercel (UI) + separate API on App Runner
                              ──▶  CloudFront (UI) + ECS Fargate (API) [Stage 3]
```

Each step is incremental. You don't jump from Vercel to ECS — you add one service at a time as specific needs force it.

---

## 12. Security Model Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│  WHAT                    HOW IT'S PROTECTED                          │
├──────────────────────────────────────────────────────────────────────┤
│  Passwords               Never stored. Auth0 handles them.           │
│  JWTs                    httpOnly cookies — JS cannot read them.     │
│                          15-min expiry; refresh token rotates.       │
│  Document files          S3 private bucket. Only accessible via      │
│                          presigned URLs that expire in minutes.      │
│  Database data           Encryption at rest (Neon/RDS built-in).     │
│                          TLS required in transit (Prisma ssl:true).  │
│  Sensitive PII fields    App-layer AES-256 encryption (Stage 2+).    │
│  API endpoints           Every Route Handler checks JWT.             │
│                          All queries scoped to user's memberships.   │
│  Rate limiting           Redis counters. AI capped 20 queries/hr.    │
│  Secrets                 Vercel env vars (Stage 1).                  │
│                          AWS Secrets Manager (Stage 2+).             │
│  Audit trail             Insert-only log of every PHI access.        │
│                          7-year retention (HIPAA).                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Where to Find Things

| I want to... | Look in... |
|---|---|
| Add a new database model | `packages/db/prisma/schema.prisma` |
| Write a new API endpoint | `apps/web/src/app/api/your-route/route.ts` |
| Add a new GraphQL query or mutation | `apps/web/src/app/api/graphql/route.ts` |
| Add a new page | `apps/web/src/app/(app)/your-page/page.tsx` |
| Add a new UI component | `apps/web/src/components/` |
| Add a scheduled background job | `apps/web/src/app/api/jobs/` + `vercel.json` crons |
| Change what the AI knows about a user | `apps/web/src/lib/ai/context-builder.ts` |
| Change rate limits | `apps/web/src/lib/rate-limit.ts` |
| Add a new audit log event | `apps/web/src/lib/audit.ts` |
| Update the document checklist logic | `apps/web/src/lib/vault/checklist.ts` |
| Change design tokens (colors, fonts) | `apps/web/tailwind.config.ts` |
| Add environment variables | `.env.local` locally + Vercel dashboard for deployed |
