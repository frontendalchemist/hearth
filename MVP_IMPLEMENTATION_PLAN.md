# Hearth — MVP Implementation Plan

## Overview

This plan covers **Phase 1 (MVP)** sprints only: Sprints 1–12, roughly 24 weeks. It translates the feature spec and screenshots into concrete technical decisions, data models, component structure, and sprint-by-sprint tasks.

---

## Recommended Tech Stack

### Frontend
| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | SSR for SEO, built-in routing, server components reduce client bundle |
| Language | **TypeScript** | Required; strict mode on |
| Styling | **Tailwind CSS + shadcn/ui** | Rapid UI dev; shadcn/ui wraps Radix UI primitives (accessible, unstyled) |
| State (server) | **TanStack Query (React Query)** | Server state, cache, invalidation — keeps UI in sync with backend |
| State (client) | **Zustand** | Lightweight; for UI state (active profile, sidebar, modal stack) |
| Forms | **React Hook Form + Zod** | Validation + type inference from schemas shared with backend |
| File uploads | **Uppy** | Multi-file, progress, resumable, S3 direct upload support |
| PDF generation | **React PDF (@react-pdf/renderer)** | Emergency packet PDFs generated client-side or server-side |
| Charts | **Recharts** | Cost projection, health trends — small bundle, composable |
| Icons | **Lucide React** | Consistent icon set |

### API & Backend (Route Handlers inside Next.js)
There is no separate backend server. The API lives inside `apps/web/src/app/api/` as Next.js Route Handlers, deployed alongside the frontend on Vercel as serverless functions.

| Layer | Choice | Rationale |
|---|---|---|
| API style | **GraphQL (Pothos) + REST Route Handlers** | GraphQL for data queries/mutations; REST for file ops, AI streaming (SSE), cron jobs |
| ORM | **Prisma** | Type-safe DB queries; migration management; works identically in Route Handlers |
| Database | **PostgreSQL via Neon** (Stage 1) → **RDS** (Stage 3) | Neon is serverless-friendly; no cold-start connection issues |
| Cache / sessions | **Redis via Upstash** (Stage 1) → **ElastiCache** (Stage 3) | Upstash works over HTTPS from serverless; no VPC required |
| Auth | **Auth0 + Next.js SDK** | Handles MFA, RBAC, JWT; SDK manages cookies + session in Route Handlers |
| File storage | **AWS S3** | Presigned URLs for direct browser→S3 upload; never through Route Handlers |
| AI | **Anthropic Claude API (claude-sonnet-4-6)** | Streaming via SSE Route Handler |
| Email | **Resend** (Stage 1) → **AWS SES** (Stage 2) | Resend is easier to set up; SES has HIPAA BAA |
| Scheduled jobs | **Vercel Cron Jobs** | Defined in `vercel.json`; replace what would otherwise need a separate worker service |
| Validation | **Zod** | Schemas in `packages/shared` used by both Route Handlers and frontend forms |

### Monorepo Structure
```
hearth/
├── apps/
│   └── web/                  # Next.js app — frontend + API combined
│       └── src/app/
│           ├── api/          # All Route Handlers (your backend)
│           │   ├── graphql/route.ts
│           │   ├── upload/presign/route.ts
│           │   ├── upload/confirm/[id]/route.ts
│           │   ├── ai/chat/route.ts
│           │   ├── share/[token]/route.ts
│           │   └── jobs/     # Vercel Cron Job targets
│           │       ├── expiry-alerts/route.ts
│           │       └── ai-nudges/route.ts
│           └── (app)/        # UI pages
├── packages/
│   ├── db/                   # Prisma schema + migrations + generated client
│   └── shared/               # Zod schemas, TypeScript types, constants
├── package.json              # pnpm workspace root
└── turbo.json                # Turborepo for build orchestration
```

**Tooling**: pnpm workspaces + Turborepo, ESLint + Prettier, Vitest (unit), Playwright (e2e), GitHub Actions CI.

---

## Data Models (Prisma Schema)

```prisma
// packages/db/schema.prisma

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  auth0Id       String    @unique
  firstName     String
  lastName      String
  role          UserRole  @default(CAREGIVER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime? // soft delete

  careRecipients  CareRecipientMembership[]
  documents       Document[]
  careLogEntries  CareLogEntry[]
  taskAssignments Task[]
}

model CareRecipient {
  id          String    @id @default(cuid())
  firstName   String
  lastName    String
  dateOfBirth DateTime?
  stage       Int       @default(2) // 1–5
  zipCode     String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  members       CareRecipientMembership[]
  documents     Document[]
  medications   Medication[]
  conditions    Condition[]
  allergies     Allergy[]
  providers     Provider[]
  appointments  Appointment[]
  screenings    Screening[]
}

model CareRecipientMembership {
  id              String        @id @default(cuid())
  userId          String
  careRecipientId String
  role            MemberRole    @default(COORDINATOR)
  user            User          @relation(fields: [userId], references: [id])
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
  createdAt       DateTime      @default(now())

  @@unique([userId, careRecipientId])
}

// ─── VAULT ─────────────────────────────────────────────────

model Document {
  id              String           @id @default(cuid())
  careRecipientId String
  uploadedById    String
  fileName        String
  s3Key           String           @unique
  mimeType        String
  sizeBytes       Int
  category        DocumentCategory
  tags            String[]
  expiresAt       DateTime?
  aiCategorized   Boolean          @default(false)
  notes           String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?

  careRecipient   CareRecipient    @relation(fields: [careRecipientId], references: [id])
  uploadedBy      User             @relation(fields: [uploadedById], references: [id])
}

model ShareLink {
  id          String    @id @default(cuid())
  token       String    @unique @default(cuid())
  type        ShareType // EMERGENCY_PACKET | DOCUMENT | CARE_SUMMARY
  resourceId  String
  createdById String
  expiresAt   DateTime
  accessCount Int       @default(0)
  createdAt   DateTime  @default(now())
}

// ─── HEALTH HUB ────────────────────────────────────────────

model Medication {
  id              String        @id @default(cuid())
  careRecipientId String
  name            String
  dosage          String
  frequency       String
  timeOfDay       String[]      // ["AM", "PM"]
  purpose         String?
  prescriberId    String?
  isBeersCriteria Boolean       @default(false)
  refillDate      DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
  interactions    MedicationInteraction[] @relation("MedicationA")
  interactedBy    MedicationInteraction[] @relation("MedicationB")
}

model MedicationInteraction {
  id            String     @id @default(cuid())
  medicationAId String
  medicationBId String
  severity      Severity   // LOW | MODERATE | HIGH
  description   String
  medicationA   Medication @relation("MedicationA", fields: [medicationAId], references: [id])
  medicationB   Medication @relation("MedicationB", fields: [medicationBId], references: [id])
}

model Condition {
  id              String        @id @default(cuid())
  careRecipientId String
  name            String
  diagnosedAt     DateTime?
  notes           String?
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
}

model Allergy {
  id              String        @id @default(cuid())
  careRecipientId String
  allergen        String
  reaction        String?
  severity        Severity?
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
}

model Provider {
  id              String        @id @default(cuid())
  careRecipientId String
  name            String
  specialty       String
  phone           String?
  organization    String?
  notes           String?
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
}

model Appointment {
  id              String        @id @default(cuid())
  careRecipientId String
  providerId      String?
  title           String
  scheduledAt     DateTime
  notes           String?
  prepChecklist   Json?         // array of checklist items
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
}

model Screening {
  id              String        @id @default(cuid())
  careRecipientId String
  name            String        // "Colonoscopy", "Mammogram", etc.
  dueDate         DateTime?
  completedAt     DateTime?
  status          ScreeningStatus
  careRecipient   CareRecipient @relation(fields: [careRecipientId], references: [id])
}

// ─── FAMILY WORKSPACE ──────────────────────────────────────

model Task {
  id              String        @id @default(cuid())
  careRecipientId String
  assignedToId    String?
  createdById     String
  title           String
  priority        Priority      // HIGH | MED | LOW
  dueDate         DateTime?
  completedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  assignedTo      User?         @relation(fields: [assignedToId], references: [id])
}

model CareLogEntry {
  id              String        @id @default(cuid())
  careRecipientId String
  authorId        String
  content         String
  category        LogCategory?  // COGNITIVE | MEDICAL | NUTRITION | null
  createdAt       DateTime      @default(now())
  author          User          @relation(fields: [authorId], references: [id])
}

// ─── ENUMS ─────────────────────────────────────────────────

enum UserRole       { CAREGIVER CARE_RECIPIENT }
enum MemberRole     { ADMIN COORDINATOR VIEWER }
enum DocumentCategory { LEGAL MEDICAL FINANCIAL IDENTITY INSURANCE OTHER }
enum ShareType      { EMERGENCY_PACKET DOCUMENT CARE_SUMMARY }
enum Severity       { LOW MODERATE HIGH }
enum ScreeningStatus { OVERDUE DUE_THIS_YEAR UPCOMING COMPLETED }
enum Priority       { HIGH MED LOW }
enum LogCategory    { COGNITIVE MEDICAL NUTRITION PHYSICAL SOCIAL }
```

---

## API Design

### GraphQL Schema (key queries/mutations)

```graphql
# Care recipient context flows through all queries
type Query {
  me: User!
  careRecipient(id: ID!): CareRecipient!

  # Vault
  documents(careRecipientId: ID!, category: DocumentCategory, search: String): [Document!]!
  documentChecklistStatus(careRecipientId: ID!): ChecklistStatus!

  # Health Hub
  medications(careRecipientId: ID!): [Medication!]!
  drugInteractions(careRecipientId: ID!): [MedicationInteraction!]!
  screenings(careRecipientId: ID!): [Screening!]!

  # Stage Navigator
  stageContent(stage: Int!): StageContent!

  # Dashboard
  dashboardAlerts(careRecipientId: ID!): [Alert!]!

  # Family Workspace
  tasks(careRecipientId: ID!): [Task!]!
  careLog(careRecipientId: ID!, limit: Int): [CareLogEntry!]!
}

type Mutation {
  # Vault
  requestUploadUrl(input: UploadUrlInput!): UploadUrlPayload!  # REST preferred
  confirmUpload(documentId: ID!): Document!
  deleteDocument(id: ID!): Boolean!

  # Health Hub
  addMedication(input: MedicationInput!): Medication!
  updateMedication(id: ID!, input: MedicationInput!): Medication!
  deleteMedication(id: ID!): Boolean!
  addProvider(input: ProviderInput!): Provider!
  logAppointment(input: AppointmentInput!): Appointment!
  updateScreening(id: ID!, input: ScreeningInput!): Screening!

  # Share
  createShareLink(input: ShareLinkInput!): ShareLink!

  # Family Workspace
  createTask(input: TaskInput!): Task!
  completeTask(id: ID!): Task!
  addCareLogEntry(input: CareLogInput!): CareLogEntry!
  inviteFamilyMember(input: InviteInput!): Boolean!
}

// Note: AI streaming uses SSE via REST (POST /api/ai/chat), not GraphQL subscriptions
// Vercel Route Handlers support streaming responses natively
```

### REST Endpoints (file operations)
```
POST   /api/upload/presign          → { uploadUrl, documentId }
GET    /api/share/:token            → share link resolution
GET    /api/emergency-packet/:token → PDF download (presigned or generated)
GET    /api/documents/:id/download  → presigned S3 URL
```

---

## Frontend Architecture

### App Router Structure (Next.js)
```
apps/web/src/app/
├── api/                        # Backend — all Route Handlers
│   ├── graphql/route.ts        # Single GraphQL endpoint
│   ├── upload/
│   │   ├── presign/route.ts
│   │   └── confirm/[id]/route.ts
│   ├── ai/
│   │   └── chat/route.ts       # SSE streaming endpoint
│   ├── share/[token]/route.ts
│   └── jobs/                   # Vercel Cron Job targets (secured with CRON_SECRET)
│       ├── expiry-alerts/route.ts
│       └── ai-nudges/route.ts
├── (auth)/
│   ├── login/page.tsx
│   └── callback/page.tsx
├── (app)/
│   ├── layout.tsx              # Shell: sidebar nav + header
│   ├── dashboard/page.tsx
│   ├── vault/
│   │   ├── page.tsx            # Family Vault overview
│   │   └── [docId]/page.tsx
│   ├── health/
│   │   └── page.tsx            # Health Hub
│   ├── care-finder/
│   │   └── page.tsx
│   ├── money/
│   │   └── page.tsx
│   ├── stage-navigator/
│   │   └── page.tsx
│   ├── workspace/
│   │   └── page.tsx            # Family Workspace
│   ├── plan/
│   │   └── page.tsx
│   └── ai/
│       └── page.tsx
├── share/[token]/page.tsx      # Unauthenticated share link view
└── layout.tsx                  # Root layout
```

### Key Component Map (aligned to designs)

```
components/
├── layout/
│   ├── Sidebar.tsx             # Left nav with module links
│   ├── Header.tsx              # User switcher (Sarah/Dorothy), AI button
│   └── Shell.tsx
├── dashboard/
│   ├── QuickActions.tsx        # Emergency share, care summary, etc.
│   ├── AlertCard.tsx           # LTC expiry, missing docs, drug interactions
│   └── ModuleCard.tsx          # Jump-to cards at bottom
├── vault/
│   ├── DocumentUploader.tsx    # Uppy drag-drop with progress
│   ├── DocumentGrid.tsx        # Category sections + doc list
│   ├── CategoryCard.tsx        # Legal/Medical/etc with doc count
│   ├── ChecklistBanner.tsx     # Missing critical docs alert
│   ├── ExpiryBadge.tsx
│   └── EmergencyPacketButton.tsx
├── health/
│   ├── MedicationList.tsx
│   ├── MedicationCard.tsx      # With Beers Criteria / Interaction badges
│   ├── InteractionAlert.tsx    # Lisinopril + Amlodipine banner
│   ├── ScreeningSchedule.tsx
│   ├── ProviderList.tsx
│   └── AddMedicationForm.tsx
├── stage-navigator/
│   ├── StageProgressBar.tsx    # 1–5 stage indicator
│   ├── WarningSignsList.tsx
│   ├── ConversationGuideCard.tsx
│   └── NormalVsConcern.tsx
├── workspace/
│   ├── FamilyMemberList.tsx
│   ├── TaskBoard.tsx
│   ├── TaskCard.tsx
│   ├── CareLog.tsx
│   └── CareLogEntry.tsx
└── ai/
    ├── AiChat.tsx              # Full page chat interface
    ├── AiMessage.tsx           # Streaming message renderer
    ├── SuggestedQuestions.tsx
    ├── AiFab.tsx               # Floating "+ Ask AI" button
    └── ProactiveNudge.tsx
```

### State Management Pattern

```typescript
// Zustand: client UI state only
// stores/app.store.ts
interface AppStore {
  activeCareRecipientId: string | null
  setActiveCareRecipient: (id: string) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
}

// TanStack Query: all server state
// hooks/useDocuments.ts
export function useDocuments(careRecipientId: string, category?: DocumentCategory) {
  return useQuery({
    queryKey: ['documents', careRecipientId, category],
    queryFn: () => gqlClient.request(GET_DOCUMENTS, { careRecipientId, category })
  })
}

// hooks/useMutateDocument.ts — with optimistic updates + cache invalidation
```

---

## Sprint-by-Sprint Plan

### Sprint 1–2 (Weeks 1–4): Vault Foundation

**Goal**: Profile creation, file upload to S3, auto-categorization, metadata display.

**Route Handler tasks:**
- [ ] Auth0 Next.js SDK installed; JWT middleware utility in `src/lib/auth.ts` — called at the top of every Route Handler
- [ ] Prisma schema v1: User, CareRecipient, CareRecipientMembership, Document
- [ ] `POST /api/upload/presign` — validates auth, creates Document record (status: pending), returns S3 presigned POST URL
- [ ] `POST /api/upload/confirm/[id]` — triggered after S3 upload completes; queues categorization
- [ ] Auto-categorization: call Claude API with document name + first-page text → return category + suggested tags (target >80% accuracy); runs in the confirm Route Handler (well within 60s limit)
- [ ] GraphQL: `documents`, `careRecipient` queries; `deleteDocument` mutation

**UI tasks:**
- [ ] Next.js app scaffold with Tailwind, shadcn/ui, Auth0 SDK
- [ ] Auth flow: login → callback → redirect to `/dashboard`
- [ ] Profile creation wizard (care recipient name, DOB, zip)
- [ ] Family Vault page with category sections (matching design)
- [ ] Uppy uploader: drag-drop → presign → S3 upload → confirm → refetch documents
- [ ] Upload progress indicator
- [ ] Document card with category badge and AI tag indicator

**Key deliverables:** File upload with progress; auto-categorization; profile CRUD

---

### Sprint 3–4 (Weeks 5–8): Vault Features

**Goal**: Smart tagging UI, checklist, expiry alerts, vault sharing.

**Route Handler tasks:**
- [ ] Document checklist logic: define required docs per profile stage; compute missing docs
- [ ] Expiry alert: Vercel Cron Job (`/api/jobs/expiry-alerts`, daily at 9am) → find docs expiring within 30 days → send email via Resend
- [ ] `createShareLink` mutation — stores token + TTL in Redis (Upstash); resolves to emergency packet or document
- [ ] Basic permissions: ADMIN can share/delete; COORDINATOR can upload; VIEWER read-only
- [ ] `GET /api/share/[token]` Route Handler — validate TTL, return resource

**Frontend tasks:**
- [ ] ChecklistBanner component — "Missing: Healthcare Proxy" with Upload/Remind CTAs
- [ ] ExpiryBadge on document cards (e.g., "⚠ Expires Jun 30")
- [ ] Document category expand/collapse with doc list
- [ ] Tag editor (inline chip input on document card)
- [ ] Emergency packet button — calls `createShareLink`, copies link to clipboard
- [ ] Recent documents sidebar panel
- [ ] Stats row (14 Documents / 6 Categories / 2 Expiring / 68% complete)

**Key deliverables:** Checklist live; expiry email alerts; 2-person vault sharing

---

### Sprint 5–6 (Weeks 9–12): Health Hub Core

**Goal**: Medication tracker, provider directory, screening schedule, drug interaction flagging.

**Route Handler tasks:**
- [ ] Prisma: Medication, MedicationInteraction, Condition, Allergy, Provider, Appointment, Screening models
- [ ] Drug interaction check: on medication add/update, check against known interaction pairs (seed a static interaction table from FDA data for MVP — real API integration is post-MVP)
- [ ] Beers Criteria check: static list of flagged medications for age 65+
- [ ] Screening schedule engine: based on age/sex, compute due dates for standard screenings (colonoscopy, mammogram, DEXA, eye exam, HbA1c, BP)
- [ ] GraphQL mutations: addMedication, updateMedication, addProvider, logAppointment, updateScreening

**Frontend tasks:**
- [ ] Health Hub page layout (medications left, screening schedule right — matches design)
- [ ] MedicationCard with Beers Criteria badge (amber) and Interaction badge (red/orange)
- [ ] InteractionAlert banner (collapsible detail — "Combined use may cause...")
- [ ] Add Medication modal: name, dosage, frequency, time of day, purpose
- [ ] ScreeningSchedule list with status chips (Overdue/Due this year/Completed)
- [ ] ProviderList with specialty, org, phone
- [ ] "No geriatrician on file — Recommended for age 78+" prompt
- [ ] Stats row (6 Medications / 3 Screenings due / 4 Providers / 1 Interaction flagged)

**Key deliverables:** Medication tracker; provider list; screening calendar; drug interaction alerts

---

### Sprint 7–8 (Weeks 13–16): AI Assistant v1

**Goal**: Claude API integration with document Q&A, health Q&A, streaming UI, PII stripping.

**Route Handler tasks:**
- [ ] PII stripping pipeline in `src/lib/ai/pii.ts`: regex to strip SSNs, DOBs, account numbers before sending to Claude
- [ ] Document text extraction: PDF → text via `pdf-parse`; images → placeholder for now
- [ ] Context builder in `src/lib/ai/context.ts`: assemble care recipient profile into system prompt — strip all PII
- [ ] `POST /api/ai/chat` Route Handler → streams SSE to client using Vercel's streaming response support; exempt from 60s timeout
- [ ] Suggested questions: generate 4–5 context-aware questions from profile (cached in Upstash, refreshed on profile changes)
- [ ] Proactive nudge engine: rule-based for MVP (e.g., OEP 180 days away → generate nudge)
- [ ] Rate limiting: 20 AI queries/user/hour via Upstash Redis

**Frontend tasks:**
- [ ] AI Assistant full-page chat UI (matches design: suggested questions, message bubbles, streaming)
- [ ] AiFab: floating "+ Ask AI" button on all module pages
- [ ] Streaming message renderer: display text as it streams, show typing indicator
- [ ] Suggested questions as clickable chips
- [ ] ProactiveNudge banner at bottom of chat ("Medicare OEP in ~180 days...")
- [ ] Context from current page: if user is on Health Hub, AI has health context pre-loaded
- [ ] "Ask AI Assistant" quick action on Dashboard

**Key deliverables:** AI answers document/health questions; PII never in LLM logs; <4s P95 latency

---

### Sprint 9–10 (Weeks 17–20): Stage Navigator

**Goal**: 5-stage care model with content, warning signs, conversation guides.

**Route Handler tasks:**
- [ ] Seed stage content data: 5 stages × (description, warning signs, what's coming next, conversation guides, normal vs. concern pairs)
- [ ] GraphQL: `stageContent(stage: Int!)` query
- [ ] Stage update mutation: `updateCareRecipientStage(id, stage)` — triggers dashboard alert recalculation
- [ ] 12 conversation guides seeded with content (from feature spec)

**Frontend tasks:**
- [ ] Stage Navigator page (matches design)
- [ ] StageProgressBar: 5-step horizontal bar, current stage highlighted
- [ ] Stage description card
- [ ] Warning Signs list: each with category (Cognitive/Physical/Functional/Financial/Social) + urgency chip (Monitor/See Doctor/Act Now)
- [ ] "What's Coming in Stage 3" panel with decision checklist
- [ ] Conversation Guides cards with stage tag (Stage 2, Stage 2–3, Any stage)
- [ ] Normal vs. Concern two-column comparison grid
- [ ] Stage badge in header and dashboard

**Key deliverables:** All 5 stages with content; 12 conversation guides

---

### Sprint 11 (Weeks 21–22): Emergency Share + Family Workspace

**Goal**: One-tap emergency packet PDF; family workspace MVP.

**Route Handler tasks:**
- [ ] Emergency packet PDF: `@react-pdf/renderer` runs server-side in a Route Handler — include care recipient info, medications, allergies, providers, key documents list, emergency contacts. Target: <5s (well within 60s Vercel limit)
- [ ] Share link: 48-hour TTL stored in Upstash Redis; `GET /api/share/[token]` validates + returns resource
- [ ] Family workspace: Prisma CareLogEntry, Task models already exist — wire up GraphQL mutations
- [ ] `inviteFamilyMember` mutation: send invite email via Resend with Auth0 invite link

**Frontend tasks:**
- [ ] Emergency Share Packet button (prominent red CTA on Dashboard + Vault)
- [ ] Share link confirmation modal: shows link, copy button, TTL countdown
- [ ] Family Workspace page (matches design)
- [ ] FamilyMemberList with role chips and location badge (Long-distance)
- [ ] TaskBoard: High/Med/Low priority cards with assignee + due date
- [ ] Task completion checkbox with optimistic update
- [ ] SharedCareLog: reverse-chronological entries with category tags
- [ ] Add care log entry form (free text + optional category tag)
- [ ] "Generate family meeting agenda" CTA (AI-powered — calls AI assistant)

**Key deliverables:** Emergency packet in <5s; 48hr share link; family workspace with task board + care log

---

### Sprint 12 (Weeks 23–24): Dashboard + MVP Polish

**Goal**: Complete dashboard, accessibility pass, performance, bug bash.

**Route Handler tasks:**
- [ ] `dashboardAlerts` GraphQL query: aggregates alerts across all modules (expiring docs, missing docs, drug interactions, upcoming appointments, pending tasks)
- [ ] Alert priority ordering: P0 (missing critical docs, drug interactions) → P1 (expiring docs) → P2 (upcoming appointments) → P3 (task reminders)
- [ ] Stage 2 infra migration (do before beta launch): Neon → paid tier, Upstash → paid tier, AWS WAF via Vercel Firewall, AWS BAA signed

**Frontend tasks:**
- [ ] Dashboard page: Quick Actions, Reminders & Alerts, Jump to Module cards
- [ ] AlertCard: dynamic icon, description, and CTA button per alert type
- [ ] ModuleCard: icon, badge count (due items), description preview
- [ ] Plan for Yourself page: aging plan progress, advance directive wizard stub, wishes journal (text area)
- [ ] Care stage badge in header (persists across all pages)
- [ ] User profile switcher (Sarah / Dorothy in header)

**Accessibility & quality:**
- [ ] All interactive elements keyboard-accessible, focus rings visible
- [ ] All images have alt text; icons are aria-labeled
- [ ] Font sizes minimum 16px; line height 1.6 for body text (aging-friendly)
- [ ] Color contrast WCAG 2.2 AA minimum
- [ ] Lighthouse accessibility score target: >95
- [ ] LCP < 2.5s on 3G; bundle size audited

---

## Cross-Cutting Concerns

### Authentication & Authorization
```typescript
// Middleware on all API routes
// Auth0 JWT → decode userId → load user + active careRecipientId
// All queries scoped: WHERE careRecipientId IN (user's memberships)
// ADMIN role required for: delete document, create share link, invite members
```

### Error Handling Pattern
```typescript
// GraphQL errors: typed error codes (UNAUTHORIZED, NOT_FOUND, VALIDATION_ERROR)
// Frontend: React Error Boundary per module; toast notifications for mutations
// Upload errors: Uppy retry logic (3 attempts, exponential backoff)
```

### Audit Logging (HIPAA)
```typescript
// Every document access, download, share link creation → audit log
// audit_log table: userId, action, resourceType, resourceId, ipAddress, timestamp
// Retained 7 years per HIPAA
```

### Environment Variables
One `.env.local` file — no separate backend config. Set the same variables in the Vercel dashboard for deployed environments.

```
# apps/web/.env.local  (also set in Vercel dashboard for prod/preview)

# Database
DATABASE_URL=                      # Neon pooled connection string

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Auth0
AUTH0_SECRET=                      # Random 32-byte secret (next-auth session signing)
AUTH0_BASE_URL=                    # https://hearth.app (or localhost:3000)
AUTH0_ISSUER_BASE_URL=             # https://YOUR-TENANT.auth0.com
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=hearth-documents-prod

# AI
ANTHROPIC_API_KEY=

# Email
RESEND_API_KEY=

# Cron job security (Vercel passes this automatically; verify it in job Route Handlers)
CRON_SECRET=
```

---

## Testing, Launch & Documentation Strategy

### Testing Philosophy

Three layers — each has a different job:

| Layer | Tool | What it tests | When it runs |
|-------|------|--------------|-------------|
| Unit | Vitest + RTL | Individual Route Handlers, Prisma helpers, utility functions, isolated components | Every commit (< 30s) |
| Integration | Vitest + real Neon `test` branch | Route Handler → DB round trips, Prisma middleware (audit log, soft delete), auth middleware | Every PR |
| E2E | Playwright | Full user flows in a real browser against a preview deployment | Every PR + every staging promotion |
| Accessibility | axe-playwright | WCAG 2.1 AA violations on key pages | Every PR |
| Visual regression | Chromatic (Storybook) | UI component appearance regressions | Every PR |
| Performance | Lighthouse CI | LCP, CLS, TBT on core pages | Every PR |
| Security | `npm audit` + Snyk (free tier) | Known CVEs in dependencies | Weekly scheduled CI run |

**Guiding rules:**
- Route Handlers get unit tests first — they're pure request/response functions and easy to test.
- Don't mock the database for integration tests. Use a dedicated Neon `test` branch seeded with `pnpm db:seed`. Mocks let real schema bugs slip through.
- E2E tests cover the golden path only — don't write E2E for every edge case (that's what unit tests are for).
- Accessibility tests run automatically — no manual audits needed for every PR.

---

### Environment Pipeline

| Environment | Vercel | Git branch | Database | Who uses it |
|------------|--------|-----------|----------|-------------|
| Local | — | feature branch | Neon `dev` | You while coding |
| Preview | Vercel Preview | any PR | Neon `preview/pr-<n>` | You (QA) + future stakeholders |
| Staging | Vercel Preview (named env) | `staging` | Neon `staging` | Final smoke test before prod |
| Production | Vercel Production | `main` | Neon `main` | Real users |

**Promotion criteria — Production release gate (all must pass):**
- [ ] Playwright E2E smoke suite passes on staging URL
- [ ] Lighthouse CI: LCP < 2.5s, score ≥ 80 on `/`, `/vault`, `/health-hub`
- [ ] No open P0 or P1 Sentry issues
- [ ] PostHog: no spike in error events vs. 7-day baseline
- [ ] Manual review: click through new features on staging with real-looking seed data
- [ ] `CHANGELOG.md` updated with user-visible changes

**Neon branch automation (GitHub Actions):**
```yaml
# .github/workflows/preview-db.yml
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  create-preview-db:
    steps:
      - run: neon branches create --name preview/pr-${{ github.event.number }} --parent main
      - run: |
          URL=$(neon connection-string preview/pr-${{ github.event.number }})
          echo "DATABASE_URL=$URL" >> $GITHUB_ENV
      - run: pnpm db:migrate deploy
      - run: pnpm db:seed

  # On PR close: delete the branch
  on:
    pull_request:
      types: [closed]
  delete-preview-db:
    steps:
      - run: neon branches delete preview/pr-${{ github.event.number }}
```

---

### Per-Sprint Testing Checklist

Each sprint, before marking a feature "done," complete the checklist items for that sprint:

**Sprints 1–2 (Vault Foundation):**
- [ ] Unit: `POST /api/upload/presign` — returns 401 without JWT; returns 200 + signed URL with valid JWT
- [ ] Unit: `POST /api/upload/confirm/[id]` — writes audit log row on success
- [ ] Integration: Document soft delete — deleted record excluded from `documents` query
- [ ] E2E: Upload a PDF → see it appear in Vault with correct category (golden path)
- [ ] Accessibility: Vault file list passes axe scan (file cards, status badges)
- [ ] PostHog events: `document_uploaded`, `document_viewed` firing in staging

**Sprints 3–4 (Health Hub):**
- [ ] Unit: Medication reminder calculation (correct days-until-refill logic)
- [ ] Unit: Drug interaction flag — returns warning for known pair, clean for unknown
- [ ] E2E: Add a medication → reminder badge appears on dashboard
- [ ] E2E: Add a provider → provider card visible in Health Hub
- [ ] Accessibility: Medication list table passes axe scan
- [ ] PostHog events: `medication_added`, `screening_logged` firing

**Sprints 5–6 (AI Assistant):**
- [ ] Unit: PII stripper — names, DOBs, MRNs removed from test strings before Claude API call
- [ ] Unit: SSE Route Handler — streams chunks without dropping connection
- [ ] E2E: Send a question → receive streamed response; conversation persists on reload
- [ ] E2E: Offline/timeout — graceful error message shown, no crash
- [ ] PostHog events: `ai_chat_started`, `ai_message_sent` firing

**Sprints 7–8 (Stage Navigator + Family Workspace):**
- [ ] Unit: Stage recommendation logic — correct stage returned for each profile input combination
- [ ] Unit: Task assignment — only ADMIN can assign to other members
- [ ] E2E: Create task → assign → mark complete; appears in care log
- [ ] E2E: Stage Navigator — 5 stages navigable; current stage highlighted
- [ ] Accessibility: Care log table and task board pass axe scan
- [ ] PostHog events: `task_created`, `task_completed`, `care_log_entry_added`

**Sprints 9–10 (Polish + Performance):**
- [ ] Lighthouse CI: all core pages score ≥ 85 (not just ≥ 80)
- [ ] Visual regression: Chromatic baseline snapshots created for all major components
- [ ] Responsive: Playwright mobile-safari project passes smoke tests
- [ ] Load test: k6 script simulates 50 concurrent users hitting `/api/graphql` — p95 < 500ms (run against staging)

**Sprints 11–12 (Launch Prep):**
- [ ] Full E2E regression suite passes on staging (all sprints' golden paths)
- [ ] Security audit: `npm audit` returns no high/critical CVEs
- [ ] Penetration test: run OWASP ZAP against staging URL; resolve any HIGH findings before launch
- [ ] Auth: Playwright test verifies 401 returned for unauthenticated API calls
- [ ] Data isolation: Playwright test verifies user A cannot access user B's documents (multi-tenant check)

---

### Observability & Analytics

**Tools in use (Stage 1):**

| Tool | Purpose | HIPAA note |
|------|---------|------------|
| Sentry | Error tracking + performance tracing | Self-hosted or Business plan for BAA |
| PostHog | Product analytics + session replay | Configure masking (see below); BAA available |
| Vercel Analytics | Web vitals per page | No PHI exposure — aggregate metrics only |
| Neon query insights | Slow query detection | Internal only — no user data exported |

**PostHog PHI masking (enforce from day one):**
```typescript
// apps/web/src/lib/analytics.ts
posthog.init(key, {
  autocapture: false,           // Never auto-capture clicks/forms in a health app
  mask_all_text: true,          // Mask session replay text
  mask_all_element_attributes: true,
  capture_pageview: false,      // Manual pageview calls only (PHI can be in URL params)
})

// Safe event pattern — categories only, never names or clinical details
track('document_uploaded', { category: 'legal', file_type: 'pdf' })  // ✓
track('document_uploaded', { filename: 'Mom_diagnosis.pdf' })         // ✗ PHI
```

**Stage 2 upgrade:** Add FullStory (with BAA) for session replay when you have real support tickets to diagnose. PostHog stays for product analytics; FullStory adds the "watch what the user actually did" layer for support.

**Key dashboards to build in PostHog (before beta):**
- Daily/weekly active users by feature module
- Document upload success rate (catch S3 failures)
- AI chat engagement (sessions started, messages per session)
- Feature adoption funnel (sign up → add care recipient → upload document → invite family member)

---

### Documentation & Comms Plan

#### User-Facing Documentation (Mintlify)

**Setup:** `/docs` directory in monorepo → Mintlify GitHub integration → auto-deploys to `docs.hearth.app`.

**Launch content (must be live at beta launch):**
- Getting Started (account creation, adding a care recipient)
- Family Vault guide (uploading, organizing, sharing documents)
- Health Hub guide (medications, screenings, providers)
- AI Assistant guide (what it can and can't do; privacy notice)
- Stage Navigator guide (understanding the 5 stages)
- Family Workspace guide (tasks, care log, inviting family)
- FAQ (data security, HIPAA, sharing with doctors)

**Per-feature documentation rule (add to Definition of Done):**
> Before closing a sprint, add or update the relevant Mintlify page. If there's no page for a feature, create a stub. Docs ship with the feature, not after.

**In-app help:** Add `?` tooltip icons on complex forms (medication dosage fields, stage assessment) linking to the relevant Mintlify anchor. Build this in Sprint 10 as part of polish.

#### API Documentation

**GraphQL (internal → eventually external):**
- Export `schema.graphql` as part of every build: `graphql-codegen` writes to `packages/shared/schema.graphql`
- Host GraphQL Playground (Yoga/Apollo Sandbox) at `/api/graphql` on preview/staging only — never production (leaks schema)
- When you open a public API (Phase 2+): use Scalar to auto-generate a reference doc from the schema

**Future public REST API (Phase 2+):**
- Standard: OpenAPI 3.1 spec in `docs/api/openapi.yaml`
- Host via Scalar or Redoc embedded in Mintlify
- Rate limiting and API key issuance: add to architecture at that time

#### Changelog

**Stage 1:** `CHANGELOG.md` in repo root, [Keep a Changelog](https://keepachangelog.com) format. Update on every production release.

**Stage 2:** Add Headway or Beamer widget (~$29/mo) for in-app "What's new" notifications. Wire it to the changelog in Sprint 11.

**Communication cadence (once you have beta users):**
- **Each release:** Update changelog; send email via Resend to opted-in users (feature highlights only, no PHI)
- **Monthly:** Summarize top feature additions + any downtime/incidents
- **Incident comms:** Status page (Instatus free tier) at `status.hearth.app`; post within 30 min of any production incident

#### FullStory / Session Replay Integration (Stage 2)

When you upgrade to FullStory at Stage 2:
1. Enable FullStory in non-PHI pages only (marketing, onboarding flow, settings)
2. Exclude all pages with clinical content (`/vault`, `/health-hub`, `/ai-assistant`) using FullStory's page exclusion rules
3. Apply element masking to any form fields that could contain names or health data
4. Sign FullStory BAA before enabling on any user account
5. Document which pages are included/excluded in `docs/hipaa-controls.md`

---

## MVP Feature Scope Exclusions

The following appear in designs/specs but are **Phase 2** — do not build for MVP:
- Care Finder (facility search, shortlisting, tour checklist)
- Money & Coverage (Medicare guides, cost estimator, benefits finder)
- SMS/WhatsApp parent interface
- FHIR / EHR integration
- DocuSign integration
- Full Plan for Yourself (advance directive builder with all 50 states — stub only for MVP)
- Family Workspace messaging (care log + tasks are MVP; real-time messaging is not)

---

## Open Questions to Decide Before Sprint 1

1. **GraphQL client**: Apollo Client vs. TanStack Query + graphql-request + codegen? (Recommendation: TanStack Query + graphql-request + codegen — simpler than Apollo, no cache normalization needed for MVP)
2. **Auto-categorization**: Claude API only, or Textract for PDF OCR first? (Recommendation: Textract → Claude — more accurate on scanned docs, and Textract runs in AWS Lambda near S3 so latency is low)
3. **Vercel Cron Jobs vs. external scheduler**: Vercel Cron Jobs are free on Pro but have a 60s execution limit per run. For the expiry alert job this is fine (paginated queries). If a future job needs longer, use Trigger.dev or Inngest (both have free tiers).
4. **Mobile**: Web-only for MVP or React Native (Expo) from day 1? (Schedule says iOS + Android at MVP launch — if so, Route Handlers are already a proper API that a mobile app can call; no architectural change needed)
5. **Drug interaction data source**: Static FDA seed data for MVP, or subscribe to an API (DrFirst, Wolters Kluwer) from day 1?
