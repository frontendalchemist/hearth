# Hearth — Implementation Plan

> Supersedes PHASE0_IMPLEMENTATION_PLAN.md and MVP_IMPLEMENTATION_PLAN.md.
> Based on updated wireframes (April 2026) and decisions recorded in PM_PRODUCT_BREAKDOWN.md.
> Last updated: 2026-04-21

---

## Overview

| Phase                 | Scope                                                                   | Timeline    | Target              |
| --------------------- | ----------------------------------------------------------------------- | ----------- | ------------------- |
| **Phase 0**           | Foundation: infra, auth, CI, design system                              | Weeks 1–6   | Pre-build complete  |
| **Phase 1 Beta**      | Sprints 1–8: core loop (auth → home → vault → packet → alerts → family) | Weeks 7–22  | Design partner beta |
| **Phase 1 Post-Beta** | Sprints 9–14: Health Hub, Stage Navigator, My Aging Plan, AI            | Weeks 23–34 | Public v1.0         |
| **Phase 2**           | Care Finder, Money & Coverage, care recipient login, i18n, messaging    | Post v1.0   | Growth              |
| **Phase 3**           | Full in-app messaging, Tagalog/Mandarin, pharmacy integration           | Future      | Scale               |

**Beta constraint (Phase 1 Beta):** All actions are performed by caregiver-role users only. Care recipients have no login. Any feature that implies a care recipient as an actor is caregiver-proxied.

---

## Tech Stack

### Frontend

| Layer          | Choice                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| Framework      | Next.js 14+ (App Router)                                                      |
| Language       | TypeScript (strict mode)                                                      |
| Styling        | Tailwind CSS + shadcn/ui (Radix UI primitives)                                |
| i18n           | **next-intl** — installed Sprint 1; all strings wrapped in `t()` from day one |
| Server state   | TanStack Query (React Query)                                                  |
| Client state   | Zustand                                                                       |
| Forms          | React Hook Form + Zod                                                         |
| File uploads   | Uppy (multi-file, resumable, S3 direct upload)                                |
| PDF generation | @react-pdf/renderer                                                           |
| Icons          | Lucide React                                                                  |

### API & Backend (Route Handlers inside Next.js)

| Layer        | Choice                                                      |
| ------------ | ----------------------------------------------------------- |
| ORM          | Prisma                                                      |
| Database     | PostgreSQL via Neon (Stage 1) → RDS (Stage 3)               |
| Cache        | Redis via Upstash (Stage 1) → ElastiCache (Stage 3)         |
| Auth         | Auth0 + Next.js SDK                                         |
| File storage | AWS S3 (presigned URLs — browser uploads direct)            |
| Email        | Resend (Stage 1) → AWS SES with BAA (Stage 2)               |
| AI           | Anthropic Claude API (claude-sonnet-4-6), streaming via SSE |
| Cron jobs    | Netlify Scheduled Functions                                 |
| Validation   | Zod (schemas shared between Route Handlers and frontend)    |

### Infrastructure

| Stage                   | When             | Cost         | Notes                                 |
| ----------------------- | ---------------- | ------------ | ------------------------------------- |
| Stage 1: Solo Build     | Now → ~500 users | ~$20–50/mo   | Neon free, Upstash free, Netlify free |
| Stage 2: Early Traction | 500–5K users     | ~$150–300/mo | Neon paid, AWS SES + BAA              |
| Stage 3: Team Scale     | 5K+ users        | $500+/mo     | RDS + ElastiCache, possible ECS       |

### Monorepo Structure

```
hearth/
├── apps/
│   └── web/                  # Next.js app — frontend + API combined
│       └── src/app/
│           ├── api/          # Route Handlers
│           │   ├── upload/presign/route.ts
│           │   ├── share/[token]/route.ts
│           │   ├── alerts/route.ts
│           │   ├── ai/chat/route.ts
│           │   └── jobs/     # Netlify Scheduled Function targets
│           │       ├── alert-scan/route.ts
│           │       └── expiry-check/route.ts
│           ├── messages/     # next-intl locale files
│           │   └── en.json
│           └── (app)/        # UI pages
├── packages/
│   ├── db/                   # Prisma schema + migrations + client
│   └── shared/               # Zod schemas, TypeScript types, constants
├── package.json
└── turbo.json
```

---

## Navigation

**Per-recipient sidebar (locked in before Sprint 1):**

> Overview → Alerts & Tasks → Document Vault → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant

_Note: "Alerts & Tasks" sits second in the sidebar (per updated wireframes), immediately after Overview, as a scoped view of alerts for the current care recipient. The global Alerts page (all recipients) is accessible from the home dashboard banner._

**Mobile nav:** Hamburger menu opens a drawer showing current care recipient context (name + stage chip) with a "Switch" option, then the full per-recipient nav items, then "← Back to Home."

---

## Phase 0 — Foundation

_Weeks 1–6. Run before Sprint 1._

### Milestone 0.1 — Project Setup (Week 1)

- [x] GitHub private repo, branch protection on `main`
- [x] Gitleaks secret scanning in CI
- [x] GitHub Actions CI pipeline
- [x] 1Password for credentials
- [x] Linear project seeded with Phase 0 milestones
- [x] Design partner: confirm participation, schedule sessions (end of Sprint 2, 4, 6)

### Milestone 0.2 — Infrastructure (Weeks 1–2)

- [x] Netlify project created (Netlify, not Vercel — confirmed by commit 2dda574)
- [x] Neon project + `hearth_dev` database + `hearth_shadow` for migrations
- [x] AWS account + S3 bucket (`hearth-documents-dev`) + IAM user with least-privilege policy
- [x] Upstash Redis instance
- [x] `.env.local` template documented; `.env.example` committed (no secrets)
- [ ] Environment variables set in Netlify UI: `DATABASE_URL`, `UPSTASH_REDIS_REST_URL`, `AWS_*`, `AUTH0_*`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`

### Milestone 0.3 — Auth0 Setup (Weeks 2–3)

- [x] Auth0 tenant created (dev tenant; domain stored in `AUTH0_DOMAIN`)
- [ ] Next.js SDK v4 configured (`AUTH0_SECRET`, `APP_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`)
- [ ] SDK middleware mounted at `apps/web/src/middleware.ts` — auto-mounts `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/profile` and maintains the httpOnly session cookie on every request
- [ ] MFA (TOTP) enabled tenant-wide; policy set to Always
- [ ] RBAC: per-care-recipient roles (Admin/Coordinator/Viewer) live in DB on `CareRecipientMembership.role` — never in the Auth0 token. The web app uses session cookies (the SDK verifies tokens internally against Auth0's JWKS); there is no Bearer-token/audience flow unless a separate API or non-browser client is added. If a platform-admin concept (Hearth staff, support) is introduced later, it would be written by a post-login Action as a namespaced claim (`https://hearth.app/roles`) and enforced via `requireRole()`.
- [ ] Auth0 plan: Developer (free) for beta; evaluate Business plan ($800+/mo with BAA) before real PHI

### Milestone 0.4 — Design System (Weeks 2–4)

Based on wireframe visual language (warm cream background, terracotta/orange accent #C4622D, dark brown header text, soft card shadows):

- [ ] Tailwind config: custom color tokens (`hearth-cream`, `hearth-orange`, `hearth-brown`, `hearth-muted`)
- [ ] Typography: serif for headings (Playfair Display or similar), sans-serif for body
- [ ] shadcn/ui installed; component variants configured
- [ ] Base layout components: `AppShell`, `Sidebar`, `MobileNav`, `Breadcrumb`
- [ ] Card component variants: `CareRecipientCard`, `ModuleTile`, `AlertItem`, `DocumentCard`
- [ ] Design tokens synced with wireframe color palette

### Milestone 0.5 — CI/CD (Weeks 1–2)

- [x] ESLint flat config (v9)
- [x] TypeScript typecheck in CI
- [ ] Vitest for unit tests
- [ ] Playwright for e2e (skeleton; no tests yet)
- [ ] Netlify preview deploys on PRs
- [ ] `staging` branch deploys to `staging.hearth.app`
- [ ] `main` branch deploys to `hearth.app` (manual promote for now)

### Milestone 0.6 — Database Schema Migration (Weeks 3–4)

Run all migrations from DATABASE_DESIGN.md before Sprint 1:

```
Migration 001: base schema (User, CareRecipient, CareRecipientMembership, Document, ShareLink)
Migration 002: health hub tables (Medication, Provider, Screening, Condition, Allergy, Appointment, MedicationInteraction)
Migration 003: stage navigator (StageAssessment, WarningSignLog)
Migration 004: family workspace (Task, CareLogEntry)
Migration 005: alerts (Alert)
Migration 006: document contact + reminders (DocumentContact, DocumentReminder)
Migration 007: aging plan (AgingPlan, AgingPlanSection, AdvanceDirective, WishesJournalEntry)
Migration 008: ai (AiConversation, AiMessage)
Migration 009: compliance (AuditLog, ConsentRecord)
```

_Run them all upfront to avoid mid-sprint schema migrations breaking in-flight features._

### Milestone 0.7 — Security & Legal (Weeks 4–6)

- [ ] HIPAA risk assessment documented
- [ ] Business Associate Agreement: AWS (for S3 — signed before real PHI enters production)
- [ ] Auth0 BAA: evaluate timing (Developer plan has no BAA; required before PHI in production)
- [ ] Privacy policy + Terms of Service (lawyer review before beta launch)
- [ ] Cookie consent banner
- [ ] HIPAA Notice of Privacy Practices page
- [ ] Consent flow in onboarding (ToS, HIPAA NPP)

### Milestone 0.8 — i18n Foundations (Week 5)

Install before any UI strings are written:

- [ ] `npm install next-intl`
- [ ] Configure `next.config.js` with `createNextIntlPlugin`
- [ ] `messages/en.json` locale file created
- [ ] All UI strings wrapped in `t()` from Sprint 1 forward
- [ ] `locale` field added to `User` model (defaults to `'en'`)
- [ ] `Intl.DateTimeFormat` used everywhere dates are displayed (never raw `Date.toLocaleString()`)
- [ ] Slack workspace (`#deploys`, `#alerts` channels)

---

## Phase 1 Beta — Sprints 1–8

_Weeks 7–22. Goal: working beta for one design partner._

### Sprint 1 — Auth + Shell + Onboarding (Weeks 7–8)

**Ships:**

- Login / logout flow (Auth0)
- Consent flow (ToS + HIPAA NPP acceptance, written to `ConsentRecord`)
- Onboarding wizard: create first care recipient (name, DOB, relationship, care stage)
- App shell: top nav (`Hearth` wordmark + user avatar + logout), global sidebar (home state — no recipient selected), responsive layout
- Care recipient creation stores to DB; user auto-enrolled as Admin
- Empty home dashboard (0 care recipients state)
- All strings use `t()` from next-intl; `en.json` seeded

**Technical tasks:**

- Auth0 SDK middleware protecting all `/app` routes
- `User` upsert on first login (Auth0 `sub` → DB)
- Zod schema for care recipient creation
- AuditLog write on care recipient creation
- ConsentRecord write on ToS accept

**Pre-conditions:** Milestones 0.1–0.8 complete

---

### Sprint 2 — Home Hub + Care Record Shell (Weeks 9–10)

**Ships:**

- Home Hub: care recipient cards (name, age, stage badge, alert summary banner "X urgent · Y actions needed", stats: Medications / Docs on file / Providers), "Add a care recipient" dashed card, My Own Aging Plan teaser (read-only, 40% complete display)
- Alert summary banner links to full Alerts & Tasks page (stub — no alerts yet, page shows empty state)
- Care record: header (name, relationship, age, stage badge with caregiving-language tooltip), NEEDS ATTENTION section (empty state), CARE MODULES grid (6 tiles: Document Vault active, others show "—" stats + locked treatment)
- Add care recipient: Fresh add flow + Re-link flow (email lookup → new invite)
- Edit care recipient: full profile edit including stage
- Responsive grid: 3-col desktop, 2-col tablet, 1-col mobile; vertical scroll; cards wrap

**Technical tasks:**

- `GET /api/care-recipients` — list user's care recipients with stats rollup
- Stage badge component with tooltip: "Hearth stages are caregiving language, not a clinical diagnosis."
- Care record layout with sidebar showing per-recipient nav (all items visible, non-active items disabled/locked)
- Re-link flow: `POST /api/care-recipients/link` — email lookup, sends invite email via Resend

**Design partner session:** End of Sprint 2 — review home hub and care record shell

---

### Sprint 3 — Document Vault Core (Weeks 11–12)

**Ships:**

- Document Vault page: stats row (docs, categories, expiring, checklist %), document categories sidebar (Legal, Medical, Financial, Insurance, Identity, Care Plans), recent documents panel, Upload + Emergency packet CTAs
- Upload flow: drag-drop or file picker → presigned S3 URL → upload → drawer with category picker (preset list + "Add custom") + permissions (All members / Admin only / Specific members) → confirm → document appears in vault
- Document card: filename, uploader, date, category chip, expiry badge (⚠ Expires Jun 30)
- See all documents page: filter by category/date/uploader/status, sort options, breadcrumb (Home → [Name] → Document Vault → All Documents)
- Document categories per wireframe: Legal, Medical, Financial, Insurance, Identity, Care Plans
- Coordinator can delete own uploads; Admin can delete any

**Technical tasks:**

- `POST /api/upload/presign` — S3 presigned URL generation
- `POST /api/upload/confirm/[id]` — mark upload complete, create Document row
- `GET /api/documents` — list with filters
- `DELETE /api/documents/[id]` — permission-checked deletion (soft delete)
- `DocumentVisibility` enum: `ALL_MEMBERS | ADMIN_ONLY | SPECIFIC_MEMBERS`
- AuditLog writes on upload, view, delete
- No AI categorization — user-selected category is canonical

---

### Sprint 4 — Document Vault: Checklist + Remind (Weeks 13–14)

**Ships:**

- Document checklist: 7 items (Will or Trust, Healthcare Proxy/POA, Financial POA, Advance Directive/Living Will, Insurance cards, Medication list, Emergency contacts list), check/uncheck per item, checklist progress % in stats
- Missing document banner: consolidated single banner per care recipient showing all missing docs, each with "Upload now" + "Remind [name]" actions, dismiss per item
- "Remind [name]" email flow: select contact from DocumentContacts list (or add new), pre-filled email sent via Resend, no Hearth account required for recipient
- DocumentContact CRUD: add/edit/delete contacts (name, email, phone, relationship), shown in "Remind" picker
- DocumentReminder tracking: reminder sent, channel, respondedAt

**Technical tasks:**

- `POST /api/contacts` — create DocumentContact
- `POST /api/contacts/[id]/remind` — send email via Resend, create DocumentReminder row
- Missing doc detection: compare checklist items against documents in vault per care recipient
- AuditLog write on reminder sent

---

### Sprint 5 — Emergency Share Packet (Weeks 15–16)

**Ships:**

- Emergency Share Packet: generates PDF with 8 sections (Cover, Emergency Contacts, Medical Summary, Providers, Insurance, Key Documents, Legal, Care Preferences)
- Empty field handling: Key Documents + Care Preferences hidden if no data; all other sections show "No data entered"
- **Download mode:** one-tap PDF download, saved locally
- **Share Link mode:** generates URL + PIN (6 digits), configurable TTL (24h / 48h / 72h / 1 week), optional view count limit
- Share link confirmation modal: shows "Link expires on [date]" + PIN + copy button + native SMS hand-off
- Unauthenticated view: PIN entry screen → packet view (read-only)
- Share link access log: caregiver sees each access (timestamp, approximate location), visible in care record
- Revoke button: one-tap revoke from care record or access log
- "Data as of [date of most recent record change]" shown on packet

**Technical tasks:**

- `POST /api/share-links` — create ShareLink (polymorphic, EMERGENCY_PACKET type), generate PIN, store in DB + Redis
- `GET /api/share/[token]` — unauthenticated route, validates PIN, resolves ShareLink, returns packet data
- PDF generation via @react-pdf/renderer (server component or API route)
- Redis: `share:{token}` → TTL matching `expiresAt`; `sharepin:{token}` → hashed PIN
- AuditLog write on packet view (unauthenticated access logged with IP)
- `PATCH /api/share-links/[id]/revoke` — deletes Redis key, sets `expiresAt` to now in DB

---

### Sprint 6 — Alerts & Tasks Module (Weeks 17–18)

**Ships:**

- Unified Alerts & Tasks page: filter tabs (All, Document, Medical, Coverage, Appointment, General), URGENT section, ACTIONS NEEDED section
- Each alert: title, care recipient name, category, Act / Snooze / Dismiss buttons
- Act → deep-links to relevant resource
- Snooze → 1 week, auto-reappears; alert stays in Alerts page visible with "Snoozed" filter
- Dismiss → silent (no care log entry); hidden from home dashboard banner + care record NEEDS ATTENTION; visible in Alerts page with "Dismissed" filter
- Home dashboard summary banner: "X urgent · Y actions needed" per care recipient card
- Care record NEEDS ATTENTION: reads from Alert table for current care recipient
- **Beta alert types auto-generated:**
  - `DOCUMENT_MISSING` — from checklist check, generated on document vault load
  - `DOCUMENT_EXPIRING` — documents with `expiresAt` within 30 days
  - `TASK_OVERDUE` — tasks with `dueDate` in the past + status TODO/IN_PROGRESS
  - `COVERAGE_EXPIRING` — (stub for now, no data yet)
- Netlify Scheduled Function: `alert-scan` runs daily, idempotent (upsert with unique constraint)

**Technical tasks:**

- `GET /api/alerts` — list with filters (type, status, careRecipientId)
- `PATCH /api/alerts/[id]` — snooze, dismiss, mark read
- Alert generation logic in `src/lib/alerts/generate.ts`
- Idempotency: `@@unique([userId, type, resourceType, resourceId])` on Alert
- AuditLog write on alert dismissal

---

### Sprint 7 — Family Workspace (Weeks 19–20)

**Ships:**

- Family Workspace page: stats (members, open tasks, care log entries last 30 days), family members list (name, role badge, location), permission levels table, care log, task board, "+ Invite family member" button
- Invitation flow: Admin enters email + selects role (Admin/Coordinator/Viewer) → invitation email sent via Resend → new user signs up → auto-enrolled with selected role
- Role enforcement: all Route Handlers check `CareRecipientMembership.role` before mutations
- Care log: add entries (Coordinators + Admins), view, filter by category (initial taxonomy: Cognitive, Medical, Physical, Nutritional, Financial, Social, Behavioral, Legal/Administrative), custom categories allowed
- Task board: create tasks (Coordinators + Admins), assign to member, set due date, set priority (High/Med/Low), mark complete. Tasks are separate from care log (no auto-population on completion)
- Share link access log: visible to all Admins on care record
- Caregiver security guides: 4 static content pages (strong passwords, share link hygiene, phishing, financial abuse warning signs)

**Technical tasks:**

- `POST /api/invitations` — create invitation, send email via Resend
- `GET /api/invitations/[token]` — accept invitation, create CareRecipientMembership
- `GET/POST /api/care-log` — care log CRUD
- `GET/POST/PATCH /api/tasks` — task board CRUD
- Permission middleware: `requireRole(role)` helper for Route Handlers
- Invitation email template (content + design pass required pre-sprint)

**Design partner session:** End of Sprint 7 — review Family Workspace, Document Vault full flow, Emergency Packet

---

### Sprint 8 — Polish + Design Partner Feedback (Weeks 21–22)

**Ships:**

- All empty states: home (0 recipients), vault (0 docs), category (0 docs in category), alerts (0 alerts), care log (0 entries), task board (0 tasks)
- All error states: upload failed, invite failed, share link expired/invalid PIN, network error
- All loading states: skeleton loaders on care recipient cards, document list, alerts
- Mobile responsiveness: full pass on all Sprint 1–7 screens at 375px, 768px, 1280px
- Accessibility: keyboard navigation, ARIA labels, focus management on modals/drawers
- Performance: LCP < 2.5s on home dashboard, document vault load
- Design partner feedback incorporated from sessions at end of S2, S7

**Technical tasks:**

- Playwright e2e tests: login → add care recipient → upload document → generate packet → share link → dismiss alert
- Vitest unit tests: alert generation logic, permission checks, PDF generation
- Security: rate limiting on share link PIN attempts (5 tries → 1 hr lockout via Redis)
- Audit: verify AuditLog writes on all PHI access paths

**Beta launch gate checklist:**

- [ ] Auth0 BAA evaluated (required before real PHI)
- [ ] AWS S3 BAA signed
- [ ] Privacy policy + ToS lawyer-reviewed
- [ ] AuditLog verified insert-only
- [ ] Share link PIN brute-force protection tested

---

## Phase 1 Post-Beta — Sprints 9–14

_Weeks 23–34. Goal: public v1.0._

### Sprint 9 — Stage Navigator (Weeks 23–24)

**Pre-condition:** Dedicated design session for two-track staging model (physical: Katz ADL/Lawton IADL; cognitive: CDR mapping). Session output is a stage definition spec before this sprint starts.

**Ships:**

- Stage Navigator page: stage progress bar (5 stages, current highlighted), stage description with clinical scale references, "What's coming in next stage" section
- Warning signs log: caregivers + coordinators can log observations; domains (Cognitive, Physical, Functional, Financial, Social); timestamp + notes per entry; urgency badges (Monitor / See doctor / Act now) are system-defined per observation type (not user-entered)
- Conversation guides: article format, tagged by stage, 4 guides visible in wireframe (Talking about driving, Discussing finances, Moving out of the home, End-of-life wishes)
- Normal aging vs. Concern grid (static content, 2-column)
- Stage setting from care record header: click stage badge → modal to update stage
- Stage Navigator tile on care record shows current stage name

**Technical tasks:**

- `WarningSignLog` model: remove user-set urgency, add system-defined urgency rule per `observation` type
- Conversation guide content model: structured JSON or MDX
- Stage history via `StageAssessment`: new row on every stage change

---

### Sprint 10 — Health Hub Part 1: Medications (Weeks 25–26)

**Pre-condition:** Open-source clinical data source confirmed (OpenFDA + RxNorm). Data fetching strategy documented.

**Ships:**

- Health Hub page: stats (medications, screenings due, providers, interactions flagged)
- Medication list: RxNorm drug name autocomplete, structured fields (name, dosage, frequency, prescribing doctor, pharmacy), free-text notes, Low refill badge
- Beers Criteria flag: static seed from 2023 AGS Beers Criteria list; `isBeersCriteria` Boolean on Medication; badge on card
- Drug interactions: check against OpenFDA API or static seed; `MedicationInteraction` table; inline expansion below card (not modal)
- "+ Add medication" flow with RxNorm autocomplete

**Technical tasks:**

- RxNorm API integration for drug name autocomplete
- OpenFDA interaction check: `POST /api/health/interactions/check`
- Beers Criteria seed script: `pnpm seed:beers`
- Medication CRUD with AuditLog

---

### Sprint 11 — Health Hub Part 2: Screenings + Providers (Weeks 27–28)

**Ships:**

- Screening schedule: static USPSTF-based list per age/sex bracket; statuses (Overdue, Due this year, Completed); source attributed ("Recommended by USPSTF")
- Provider directory: name, specialty, phone, organization, "Recommended for age 78+" alerts for missing specialist types (geriatrician recommended for age 78+ shown in wireframe)
- Upcoming appointments: linked to providers, date/time, notes
- Health Hub tile on care record shows live medication count

---

### Sprint 12 — My Aging Plan (Weeks 29–30)

**Pre-condition:** Healthcare attorney review of advance directive templates (CA, OR, WA). Legal review complete before wizard ships.

**Ships:**

- My Aging Plan page: completion % progress bar, plan sections (Legal documents 60%, Care preferences 80%, Financial readiness 20%, Conversation guide 0%, Wishes journal 50%)
- Each plan section: guided prompts, completion % tracked (responses entered / total prompts)
- Advance directive builder: state dropdown (pre-filled from user profile, overridable), wizard steps (Healthcare proxy, Life-sustaining treatment, Artificial nutrition, Pain management), PDF output with mandatory completion instructions page + legal validity notice
- Wishes journal: prompted responses ("What music matters to you?", "What routines are important?"), add memory or preference
- Conversation guide section: 0% = no responses entered; prompted template
- Documents in aging plan: live in caregiver's self-owned care recipient record; optional share to other care recipient vaults at upload time
- My Aging Plan teaser on home dashboard now links to full plan

**Technical tasks:**

- `AgingPlan` linked to `User` (as currently designed); `careRecipientId` nullable FK added for Phase 2 two-record pattern
- Advance directive PDF: state-specific template rendering via @react-pdf/renderer
- Completion % calculation: `AgingPlanSection.completionPct` = filled prompts / total prompts per section

---

### Sprint 13 — AI Assistant (Weeks 31–32)

**Pre-condition:** AI scope and safety guardrails policy document signed off (what data it can access, what it cannot say, hallucination handling, feedback mechanism).

**Ships:**

- AI Assistant page: contextual to current care recipient, suggested question chips (from care record context: "What does Mom's POA allow me to do?", "Is Sertraline safe for an 78-year-old?")
- Chat interface: user message → Claude API (streaming SSE) → response
- Proactive nudge: "Medicare Open Enrollment starts in ~180 days. Want me to prepare a checklist?" (triggered by alert or calendar rule)
- PHI stripping: `src/lib/ai/pii.ts` strips identifiers before Claude API call and DB write
- Context scoping: AI has access to care recipient profile, documents list (not file contents), medication list, stage; NOT financial raw data

**Technical tasks:**

- `POST /api/ai/chat` — streaming SSE Route Handler
- Rate limiting: `ratelimit:{userId}` in Redis (N queries/hour)
- PHI stripping pipeline with CI test verifying it runs
- AuditLog write on every AI query (action only — no query content)
- `suggest:{recipientId}` in Redis (24hr TTL) for suggested question generation

---

### Sprint 14 — v1.0 Polish + Pre-Phase 2 Prep (Weeks 33–34)

**Ships:**

- Performance pass: LCP, CLS, INP targets on all pages
- Security audit: OWASP top 10 check, share link attack surface, rate limiting verification
- HIPAA audit: AuditLog completeness, data retention check, access termination procedure for removed members
- Stage 2 infrastructure planning: RDS migration runbook, ElastiCache migration runbook
- Event model design session (for Phase 2 event-triggered enrollment windows — output feeds Phase 2 Money & Coverage)
- Two-track staging model design session (if not completed pre-Sprint 9)

---

## Phase 2 — Post-MVP

_Start after v1.0 launch. Exact sequencing depends on user feedback._

### Phase 2A — Care Finder

**Pre-conditions:** Facility data source research complete (Seniorly API vs. Eldercare Locator). Stage-based recommendation lookup table defined.

**Ships:**

- Care Finder page: care type spectrum (In-home companion → Adult day → Assisted living → Memory care → Skilled nursing) with price ranges, "Recommended now" badge (stage-based lookup)
- Facility search: by zip, distance filter, Medicaid filter
- Shortlist: save facilities, share shortlist via email (native SMS hand-off on mobile)
- Facility detail: rating (CMS), inspection history (CMS Care Compare for skilled nursing; partial for assisted living — UI notes data availability)
- Facility tour checklist: 40-question guide
- Transition planning guide link
- Simplified cost range per care type (reads from Money & Coverage coverage data)

---

### Phase 2B — Money & Coverage

**Pre-conditions:** Financial regulatory attorney review. Benefits database source research (BenefitsCheckUp, VA.gov API).

**Ships:**

- Coverage overview: Medicare A/B (pre-populated as "assumed enrolled" for 65+, confirmation prompt), Medigap, LTC insurance (with expiry warning), Medicare Part D
- Cost estimator: deterministic formula, inputs (monthly private-pay budget, LTC benefit amount), output (private pay runway in years, est. cost/year). "This is not financial advice" disclaimer prominent.
- Medicare OEP alert: hardcoded annual calendar alert (Oct 15 – Dec 7)
- Benefits finder: VA Aid & Attendance, Medicare Extra Help (LIS), PACE (from BenefitsCheckUp/VA.gov APIs)
- Quick guides: Medicare plain-English, LTC insurance, Caregiver tax guide, Medicaid navigator (static content)

---

### Phase 2C — Care Recipient Login + Two-Record Model

**Pre-condition:** Two-record model designed (self-managed aging plan vs. family-managed care record).

**Ships:**

- Care recipient can create a Hearth account and access their own aging plan (self-owned record)
- Care recipient view scoped to personal space only: their documents, preferences, wishes — NOT the care log or warning signs their family has entered
- Re-link flow: caregiver adds care recipient's email → new invite → care recipient accepts → accounts linked
- Family-managed care record remains separate from self-managed aging plan

---

### Phase 2D — Activity Feed + Guest Upload

**Ships:**

- Activity feed per care recipient: read-only feed of recent actions by family members ("Amy uploaded a document", "Mark completed a task")
- Guest upload link: signed token scoped to specific document slot, time-limited, sent via Remind email. Dorothy clicks → minimal upload page → document lands in vault. No Hearth account required.

---

### Phase 2E — Spanish i18n

**Pre-condition:** next-intl foundations from Sprint 1.

**Ships:**

- `messages/es.json` translation file (all strings already wrapped in `t()`)
- Language switcher in user profile settings
- `locale` field on User set to `'es'`
- ~3–4 weeks of translation + QA (vs. 4–5 weeks without next-intl foundations)
- Date/number formatting already uses `Intl.DateTimeFormat` — locale-aware automatically

---

### Phase 2F — Per-Module Permission Wizard

**Ships:**

- Invitation flow: Admin picks base role → per-module permission checklist (Viewer: toggle module visibility; Coordinator: toggle create/edit/delete per module)
- Permissions stored as per-member, per-module flags (not just role enum)
- Role enum becomes a template for default flag values

---

## Phase 3 — Future

| Feature                                | Notes                                                                                                                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full in-app messaging                  | Threaded per care recipient workspace. Evaluate Stream Chat vs. Sendbird vs. custom build based on user volume + cost.                                                            |
| Tagalog + Mandarin i18n                | Second and third languages after Spanish (US eldercare demographic targets)                                                                                                       |
| Pharmacy integration                   | Replace RxNorm autocomplete with direct pharmacy data pull                                                                                                                        |
| Licensed clinical data source          | DrFirst / Wolters Kluwer / FDB when revenue supports it                                                                                                                           |
| Budget + ADL modifiers for Care Finder | Enhanced recommendation matching                                                                                                                                                  |
| Branching conversation guides          | High-stakes topics: driving, memory care transition, end-of-life planning                                                                                                         |
| App-suggested stage reassessment       | Based on warning signs logged; periodic reassessment prompt                                                                                                                       |
| GraphQL API layer                      | Revisit if/when native mobile app ships or 3+ clients have divergent data needs. REST Route Handlers are the MVP API layer; GraphQL would sit on top of the same Prisma services. |

---

## Pre-Build Design Sessions (Required Before Specific Sprints)

| Session                                              | Required before | Output                                                |
| ---------------------------------------------------- | --------------- | ----------------------------------------------------- |
| Two-track staging model (physical + cognitive)       | Sprint 9        | Stage definition spec with Katz ADL/CDR mapping       |
| AI scope + safety guardrails policy                  | Sprint 13       | Policy document signed off                            |
| Advance directive attorney review (CA, OR, WA)       | Sprint 12       | Reviewed templates + completion instructions          |
| Facility data source research                        | Phase 2A        | Data source selected (Seniorly vs. Eldercare Locator) |
| Event model design (enrollment windows)              | Phase 2B        | Event model schema in DATABASE_DESIGN.md              |
| Benefits database research                           | Phase 2B        | Source selected (BenefitsCheckUp + VA.gov)            |
| Two-record model design (aging plan vs. care record) | Phase 2C        | Permission model + data model spec                    |
| Invitation email content + design                    | Before Sprint 7 | Email template approved                               |

---

## Key Technical Pre-Conditions Locked Before Sprint 1

1. **Navigation order:** Overview → Alerts & Tasks → Document Vault → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant
2. **Alert architecture:** Single `Alert` entity; all epics write to it; idempotency via unique constraint
3. **Role enum:** `ADMIN`, `COORDINATOR`, `VIEWER` (rename `MEMBER` → `COORDINATOR` in migration)
4. **Document category enum:** LEGAL, MEDICAL, FINANCIAL, INSURANCE, IDENTITY, CARE_PLANS, OTHER
5. **i18n installed:** next-intl, all strings in `t()`, `locale` field on User
6. **Netlify:** Cron jobs via Netlify Scheduled Functions (not Vercel)
7. **ShareLink:** polymorphic `(type, resourceId)` model; URL + PIN model for Emergency Packet
8. **No AI categorization:** user picks category from preset list; `aiCategorized` removed from Document model
