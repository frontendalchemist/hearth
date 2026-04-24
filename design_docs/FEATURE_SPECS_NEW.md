# Hearth — Feature Specs: New Features
**Date:** April 21, 2026
**Status:** First draft — for product owner review

These four features were not in the original design set. They are specced here to inform scope decisions, data model planning, and sprint sequencing.

---

## Feature A: In-App Messaging / Messaging App Integration

### Problem Statement

Caregivers coordinate care across a fragmented communication landscape: group texts with siblings, email to doctors, phone calls to facilities. Hearth currently has no communication surface — every coordination action requires leaving the app. The "Remind Dorothy" button in the Documents module and the "Share shortlist with siblings" action in Care Finder both imply outbound communication, but there is no defined channel or infrastructure to support it.

Three specific pain points this addresses:
1. **Non-user contact:** Dorothy (an aging parent or family member) needs to upload a document but doesn't have a Hearth account. There's no way to reach her from within the app today.
2. **Family coordination:** Mark (a Coordinator in Chicago) and Amy (a Viewer in Seattle) need to discuss a care decision, but doing so in a group text loses the care-record context.
3. **External sharing:** A shortlist of care facilities needs to reach a sibling who is not a Hearth user. Email with a static snapshot is the current fallback.

The constraint is hard: **elderly care recipients must not be required to create a Hearth account to receive documents or messages.**

---

### Options Analysis

**Option 1: Native in-app messaging (build a messaging inbox)**
Build a threaded messaging system inside Hearth, scoped per care recipient. Messages can include attachments, link to documents, and be directed at specific members.

- Pros: Keeps care context with communication; full audit log; PHI-safe if scoped correctly
- Cons: Large scope (data model, real-time delivery, notifications, mobile push); requires all participants to have accounts; doesn't solve non-user (Dorothy) problem; typically takes 2–3 sprints to build properly
- Cost: Sendbird starts at $399/mo for 5,000 MAU; Stream Chat has a free tier up to 25 MAU (viable for beta); building from scratch is 3–4 weeks minimum

**Option 2: SMS/email outbound only, no in-app inbox**
All messaging is outbound from Hearth via email (Resend) or SMS (Twilio). No inbox. No replies handled in-app. Links in messages take recipients to unauthenticated share views.

- Pros: Minimal scope; no new data model; Twilio/Resend already planned; solves the Dorothy problem; available for beta
- Cons: No two-way communication; no coordination thread; family members cannot reply in-context; doesn't scale to coordination use case
- Cost: Resend already planned (~$0 in beta volume); Twilio SMS ~$0.0079/message (negligible at beta scale)

**Option 3: Deep integration with WhatsApp / iMessage / SMS**
Detect platform and hand off a pre-composed message to the native messaging app. Hearth generates the message content; the caregiver sends it via their existing app.

- Pros: No messaging infrastructure; works on mobile; familiar UX for elderly recipients; available immediately
- Cons: No record of whether message was sent or received; no reply in-app; Hearth has no visibility; share links still needed for content delivery
- Cost: Zero — uses native app intents

**Option 4: Hybrid — in-app for Hearth users + email/SMS for non-users (Recommended)**
Messages between Hearth users (family members with accounts) happen via a lightweight notification feed or care-record activity stream. Messages to non-users (Dorothy, external siblings, facility admins) go via email or SMS with a link to a share view.

- Pros: Solves the Dorothy problem without requiring her to create an account; in-app coordination for family members who have accounts; minimal infrastructure for beta; scales toward a full messaging system later
- Cons: Two-tier experience (in-app vs. email/SMS) requires clear UI signposting; reply handling from non-users is still not supported
- Cost: Resend + Twilio for non-user messages; lightweight activity feed for in-app (can be built without a third-party SDK for beta)

---

### Recommended Approach

**Phase 1 (beta):** Option 2 — email/SMS outbound only, no inbox.
- "Remind Dorothy" sends a pre-composed email via Resend with a one-time upload link (no Hearth account required)
- "Share shortlist" generates a static-snapshot share link delivered via email or user's native SMS app (Option 3 hand-off)
- No in-app inbox; no real-time messaging

**Phase 2:** Option 4 hybrid — add a lightweight notification feed for Hearth users.
- Activity feed per care recipient: "Amy uploaded a document," "Mark completed a task," "New care log entry by Sarah"
- Feed is read-only (no reply) — coordination replies happen via email threads outside the app
- Outbound to non-users remains email/SMS

**Phase 3:** Full in-app messaging thread per care recipient workspace, replacing the hybrid model. Evaluate Stream Chat or Sendbird at this point vs. custom build, based on user volume and cost.

**Why not build in-app messaging now:** The product's differentiation is care organization, not communication. Building messaging now competes with iMessage and WhatsApp on their home turf. Hearth wins by making the *content* (documents, emergency packets, care records) easy to share — not by replacing the messaging apps caregivers already use.

---

### User Stories

1. As a caregiver, I can send a reminder email to a non-user contact (e.g., Dorothy) asking them to upload a specific document, without Dorothy needing to create a Hearth account.
2. As a non-user recipient (Dorothy), I receive an email with a secure one-time link where I can upload a document directly to the care record.
3. As a caregiver, I can share a care facility shortlist via email to a sibling who is not a Hearth user, so they can review options without needing to log in.
4. As a caregiver, I can share an emergency packet link via my phone's native messaging app (iMessage, WhatsApp, SMS) directly from the share confirmation modal.
5. As a caregiver, I see an activity feed on the care record showing recent actions by family members (document uploaded, task completed, care log entry added) so I stay informed without polling each module.
6. As a family member (Coordinator), I see a notification when the primary caregiver assigns a task to me, so I know action is needed without logging in to check.
7. As a caregiver, I can configure whether I receive email digests (daily, weekly, or never) for activity on each care record.
8. As a caregiver, I can see whether my outbound reminder to Dorothy was sent and whether she has responded (uploaded the document), so I know whether to follow up.

---

### Technical Considerations

**For beta (email/SMS only):**
- **Email:** Resend (already planned). Pre-composed templates with dynamic fields (contact name, document type, caregiver name, upload link). No library needed beyond Resend SDK.
- **SMS:** Twilio SMS API. ~$0.0079/message. International rates vary. 10DLC registration required for A2P messaging in the US (the Phase 0 plan already flags this — submit immediately).
- **Upload link for non-users:** A time-limited (72-hour) signed URL that accepts a single file upload and writes it directly to the care recipient's document vault. Built as a Next.js Route Handler with a Upstash Redis TTL for the token.

**For Phase 2 (activity feed):**
- Activity feed can be implemented as a `WorkspaceActivity` database table (type, actor, resource, timestamp, careRecipientId) polled via React Query (no WebSocket needed for an activity feed vs. real-time chat).
- Push notifications: web-push via the Push API (built into browsers, no third-party needed for desktop). For mobile browser, iOS Safari supports web push as of iOS 16.4.

**For Phase 3 (in-app messaging):**
- **Stream Chat:** $0/mo up to 100 MAU; $299/mo at 5,000 MAU. HIPAA BAA available on Growth plan. Good Next.js SDK.
- **Sendbird:** $399/mo minimum. HIPAA BAA available. More enterprise-oriented.
- **Custom build:** Viable if all participants are already Hearth users (no need for guest access). Would use WebSockets or Ably/Pusher for real-time delivery.

---

### HIPAA Considerations

- **Email/SMS content:** Do not include PHI in email or SMS message bodies. Messages should say "You have a document request" — not "Dorothy, the healthcare proxy for Harold Smith has not been uploaded." PHI stays behind the authenticated link.
- **Upload links for non-users:** Use time-limited tokens (72 hours). Log the upload in the AuditLog. Confirm the upload was for the intended document type (validate in the Route Handler).
- **Activity feed:** Log only metadata (type of action, who, when) — not content. "Sarah uploaded a document" is fine; "Sarah uploaded 'Mom's Diagnosis Report'" is PHI exposure.
- **SMS via Twilio:** Twilio has a HIPAA BAA available on their HIPAA Eligible plan (~$150/mo minimum). For beta with no PHI in message bodies, the standard plan is acceptable. Upgrade before sending any PHI-containing messages.
- **In-app messaging (Phase 3):** Any messaging system that could carry clinical content (medications, diagnoses, document contents) must operate under a HIPAA BAA. Stream Chat and Sendbird both offer this on paid plans.

---

### What NOT to Build in MVP

- No in-app messaging inbox or threads
- No WhatsApp Business API integration (requires business account approval, Meta approval, ongoing management)
- No group chat features
- No push notification infrastructure (web push can wait until Phase 2)
- No read receipts or delivery confirmation for email (Resend provides open tracking, which is sufficient)
- No message history stored in the database (email is the record; the AuditLog records that a reminder was sent)

---

### Open Questions

1. **10DLC registration status:** Has the 10DLC SMS brand registration been submitted? This is a gating item for A2P SMS in the US. (See Phase 0 plan — it must be submitted in Month 1, carrier approval takes 4–8 weeks.)
2. **Upload link behavior:** When Dorothy uses the one-time upload link, does the uploaded document auto-categorize via AI? Or does the caregiver manually review it? Recommend: AI categorizes; caregiver reviews before it becomes "confirmed" in the vault.
3. **Non-user identity:** When Dorothy uploads, how is she identified in the "uploaded by" field? By the name the caregiver entered when creating the contact, not by an Auth0 account. Ensure the DocumentContact model supports this.
4. **Twilio vs. AWS SNS:** AWS SNS is cheaper for SMS at scale and the project is already using AWS for S3. At beta volumes, the difference is negligible. Twilio has a better developer experience. Decide before implementing SMS.

---

### Priority Recommendation

**Beta:** Email outbound (Remind Dorothy) — Must-have for the missing document flow. Native share hand-off (Option 3 hand-off to SMS app) — Should-have for emergency packet and shortlist sharing.

**Minimum viable version for beta:** A "Remind [contact]" email that sends a pre-composed message with a 72-hour upload link. No inbox. No real-time messaging. No SMS (unless 10DLC is already approved).

---

## Feature B: Internationalization (i18n)

### Why i18n Is Harder in a Health Product

Standard web app i18n means translating UI strings. In Hearth, the problem is significantly larger:

1. **Legal document templates:** Advance directives are state-specific (51 variants for US states + DC) and may need to be produced in Spanish for patients and families who read Spanish more fluently. A Spanish-language California advance directive is a different document from an English-language one — not just a translation, but a legally recognized form in some states.

2. **AI-generated responses:** If a caregiver asks the AI a question in Spanish, should the AI respond in Spanish? What if the underlying care record data (medication names, provider notes) is in English? Bilingual AI context requires careful handling to avoid incoherent mixed-language outputs.

3. **Clinical terminology:** Drug names, screening names, and clinical flags (Beers Criteria, USPSTF) exist in English-language authoritative sources. Translations must be medically accurate, not just grammatically correct. Machine translation of clinical terms is unsafe.

4. **Date and name formats:** Many cultures write names family-name-first. Date formats vary significantly (MM/DD/YYYY vs. DD/MM/YYYY vs. YYYY-MM-DD). A date like "4/5/2026" means April 5 in the US and May 4 in most of Europe. In a health context, a misread date is a serious error.

5. **Right-to-left languages:** Arabic, Hebrew, Farsi. RTL requires layout changes beyond string translation — entire flex direction, margin, and padding conventions reverse. Planning for RTL from the start is far cheaper than retrofitting.

6. **Regulatory language requirements:** Some states have laws about what language health information must be available in. California health facilities, for example, must offer certain communications in languages spoken by a threshold of their patient population.

---

### Design Decisions to Make NOW (Before Sprint 1)

These decisions cost almost nothing to make now and prevent expensive refactors later:

**1. Wrap all user-facing strings in a translation function from day one.**
Even if English is the only language shipping, use `t('key')` syntax throughout from Sprint 1. The cost is adding one import and one function call per string. The benefit is that adding a second language later requires zero code changes — only a new translation file.

```typescript
// Do this from Sprint 1:
import { useTranslations } from 'next-intl'
const t = useTranslations('documents')
return <h1>{t('title')}</h1>  // "Documents" in English

// Not this (will require code changes to translate):
return <h1>Documents</h1>
```

**2. Store all user-entered content as UTF-8 without length assumptions.**
Translated strings are often 30–40% longer than English. UI components must not truncate at fixed character counts. Database text fields must be `TEXT` (unlimited), not `VARCHAR(n)`. (Prisma's `String` type maps to `TEXT` in PostgreSQL by default — this is already correct. Do not use `@db.VarChar(n)` on any user-visible text field.)

**3. Use locale-aware date formatting from day one.**
Never format dates with hardcoded `MM/DD/YYYY`. Use the Intl API or a library:

```typescript
// Do this:
new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)

// Not this:
`${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
```

**4. Store the user's locale preference in the database.**
Add a `locale` field to the `User` model now (`locale String @default("en-US")`). Even if only `en-US` is supported in beta, the field's presence means locale is part of the user record and does not require a migration when a second language is added.

**5. Externalize all static content (stage descriptions, checklist items, guide content) into locale-aware data files.**
Stage Navigator content, document checklist items, and conversation guides are not UI strings — they're content blocks. Store them as locale-keyed JSON or MDX files, not hardcoded JSX. This makes translation as simple as adding a new locale file.

**6. Do not plan for RTL layout in Sprint 1, but do not use absolute CSS positioning.**
Use Flexbox with logical properties (`margin-inline-start` instead of `margin-left`, `padding-block` instead of `padding-top`/`padding-bottom`). This is a minor coding convention that costs nothing and makes RTL support trivially addable later. Do not invest in RTL layout testing until a RTL language is in the roadmap.

---

### Architecture Recommendation: next-intl

For Next.js App Router, **next-intl** is the clear recommendation over react-i18next or Lingui.

| Library | App Router support | Type safety | Server component support | Recommendation |
|---|---|---|---|---|
| **next-intl** | Native, first-class | Excellent (TypeScript) | Yes | **Use this** |
| react-i18next | Partial (client components only without extra setup) | Good | Limited | Avoid — server component friction |
| Lingui | Good but requires babel plugin | Good | Partial | Viable but more setup |
| next-i18next | Built for Pages Router | Good | No | Do not use — Pages Router library |

next-intl provides:
- Locale-aware routing (`/en/dashboard`, `/es/dashboard`) with middleware
- Server component translation (`getTranslations()`) and client component translation (`useTranslations()`)
- ICU message format for plurals and gender-aware strings
- TypeScript types auto-generated from translation files (catches missing keys at build time)

**Setup in Sprint 1 (5–10 minutes):**
```bash
pnpm add next-intl
```
Create `messages/en.json` with all English strings. Add next-intl middleware. Done. No second language needed yet — this is infrastructure, not features.

---

### Prioritized Language Roadmap

**Phase 1 (MVP):** English only. Infrastructure in place (next-intl, `t()` wrappers, locale field on User).

**Phase 2 priority 1 — Spanish (es-US):**
Spanish is the highest-value second language for US eldercare for three reasons:
1. 44 million Spanish-speaking people in the US, a disproportionate number of whom are involved in family eldercare
2. Spanish-speaking caregivers are underserved by eldercare technology — nearly all tools are English-only
3. US Spanish speakers are predominantly literate in Spanish and frequently prefer it for complex topics like health and legal documents

Effort to add Spanish once i18n infrastructure is in place: 2–3 weeks for a professional translator to translate all strings + 1 week for engineer to integrate and test. Total: 3–4 weeks.

**Phase 2 priority 2 — Tagalog (tl):**
Filipino/Tagalog caregivers are one of the largest professional and family caregiver groups in the US, particularly in California. Adding Tagalog after Spanish requires the same effort as Spanish with a smaller translator pool.

**Phase 3 — Mandarin/Simplified Chinese (zh-Hans):**
A significant eldercare demographic in West Coast US cities. More complex due to character rendering requirements and font loading. Add after Tagalog.

**Not in roadmap:** RTL languages (Arabic, Hebrew) — not a significant US eldercare demographic. Add only if the product expands internationally.

---

### AI Content i18n

When an AI assistant responds in a multilingual app, several problems arise:

1. **Language mismatch:** The user's Hearth locale is Spanish, but the care record data (provider notes, medication names) is in English. If the AI responds in Spanish but quotes English medication names, the output is jarring.
2. **Clinical accuracy:** Machine translation of clinical terms is unreliable. The AI should not translate medication names or clinical flags — it should use the standardized English name and explain in the user's language.
3. **System prompt language:** The system prompt that primes the AI with care context should be in English (the language of the data). The instruction to respond in the user's preferred language should be a separate instruction.

**Recommended approach:**
```typescript
// System prompt (always English — matches data):
// "You are a helpful eldercare assistant. The care recipient is Harold Smith, age 89..."

// Locale instruction (appended based on user locale):
// "Respond in Spanish (es-US). Use English for medication names, medical terms, and proper nouns."
```

This produces responses like: "Harold toma Lisinopril 10mg para la presión arterial alta..." — natural Spanish with English clinical terms, which matches how bilingual medical conversations actually work.

---

### Legal Document i18n

Advance directive templates are already complex (51 US state variants). Adding language variants multiplies the matrix: 51 states × N languages.

**Practical approach:**
- For the advance directive builder, offer English templates for all 3 launch states (CA, OR, WA)
- For Spanish, offer Spanish-language templates **only where they are officially recognized by the state** (California recognizes Spanish-language advance directives; check OR and WA)
- Do not machine-translate advance directive templates — use only attorney-reviewed state-specific forms
- Make the language selection part of the wizard ("Would you like this document in English or Spanish?") only when a Spanish template is available

This means the Spanish advance directive is a separate content item requiring attorney review — not just a translation job. Plan accordingly.

---

### What to Do in Sprint 1

**Do:**
- Install `next-intl` and configure middleware (30 minutes)
- Create `messages/en.json` — move all UI strings into it as you build each component
- Add `locale String @default("en-US")` to the `User` Prisma model
- Use `new Intl.DateTimeFormat(locale, ...)` for all date formatting
- Use `TEXT` (not `VARCHAR`) for all user-visible text fields

**Do not:**
- Build a language switcher UI
- Create translation files for any language other than English
- Translate any content
- Build RTL layout support
- Worry about AI multilingual responses

**Defer to Phase 2:**
- Spanish translation
- Language preference UI in settings
- Locale-aware routing (`/es/...` URL prefix)
- Clinical term handling in AI responses

---

### Cost and Effort Estimate

**Adding Spanish with i18n foundations in place (Sprint 1 approach):**
- Professional translation of ~2,000 UI strings: ~$800–1,200 (Smartling or professional translation service)
- Engineer integration and testing: ~1 week
- Spanish advance directive template (attorney review for CA): ~$500–1,500
- **Total: ~$1,300–2,700 + 1.5 weeks of engineer time**

**Adding Spanish WITHOUT i18n foundations (hardcoded strings):**
- Refactor all UI components to add `t()` wrappers: ~2–3 weeks
- Extract all hardcoded strings: ~1 week
- Translation: same as above
- Testing: longer due to regressions
- **Total: ~$1,300–2,700 + 4–5 weeks of engineer time**

The infrastructure investment in Sprint 1 (a few hours) saves 3+ weeks of work when the second language is added.

---

### Priority Recommendation

**Infrastructure is Must-have for Sprint 1** (next-intl setup, `t()` wrappers, locale field on User, Intl date formatting) — 3–4 hours of work.

**Spanish translation is Phase 2, not beta** — do not block beta on translation.

**Minimum viable version for beta:** English-only app with i18n infrastructure in place. A bilingual user would see English but the codebase is ready for translation without code changes.

---

## Feature C: Password & Fraud Management

### Threat Model

Hearth handles three categories of sensitive information: personal health data (PHI), legal documents (advance directives, POAs), and financial data (coverage, cost estimates). The realistic threat actors and attack vectors:

**Threat 1: Compromised caregiver account**
An attacker gains access to a caregiver's Auth0 credentials (via phishing, credential stuffing from a breached site, or a weak password). From there, they can access all documents, generate emergency packets, and view financial coverage data for the care recipient. This is the highest-probability threat.

**Threat 2: Unauthorized emergency packet access**
Share links are 48-hour links without authentication. A link shared via email or SMS can be forwarded. An attacker who intercepts or receives a forwarded link has unencumbered access to a care recipient's medical and legal documents for up to 48 hours.

**Threat 3: Elder financial abuse via admin access**
A family member with Admin access uses their position to download financial documents, identify assets, or modify coverage data in ways that benefit them at the elder's expense. This is a social attack, not a technical one, but the product's access control model either enables or constrains it.

**Threat 4: Account takeover of the aging parent (if they have an account)**
If a care recipient (aging parent) has their own Hearth login (Phase 2), they are a high-value target for social engineering. Attackers may impersonate Hearth support, a family member, or a caregiver to gain access.

**Threat 5: Malicious document upload**
A Coordinator-role user uploads a malicious file (executable disguised as a PDF). Hearth stores it in S3 and serves it to other family members. Less likely than credential attacks, but real.

---

### Auth0 Built-In Protections

**Auth0 already provides:**
- Brute force protection: rate-limits login attempts per IP
- Credential stuffing detection: compares credentials against known-breached databases (HaveIBeenPwned)
- Bot detection: CAPTCHA on suspicious login patterns
- MFA (TOTP): the plan already requires this for all users — the strongest available control
- Anomaly detection: flags logins from new devices or locations
- Breached password detection: rejects passwords found in breach databases

**What Auth0 does NOT cover:**
- What happens after a valid login (session hijacking, insider threats)
- Share link security (no auth layer — by design)
- Content of uploaded documents (malicious file detection)
- Per-resource access auditing visible to the caregiver
- Elder-specific fraud patterns (unusual access by a family member, bulk document downloads)

---

### Product-Level Fraud Controls

**Share link security:**
- 48-hour TTL enforced by both Redis expiry and DB `expiresAt` check (belt-and-suspenders)
- `accessCount` tracked on every share link — surfaced to the caregiver ("This link has been accessed 3 times")
- `lastAccessedAt` stored — surfaced in the share history
- Rate limit on share link generation per user per hour (prevent automated generation): 10 share links/user/hour via Upstash
- Consider adding a one-click "revoke link" button for caregivers — removes the Redis key immediately, making the link dead before its 48-hour expiry

**Session management:**
- Idle session timeout: 30 minutes of inactivity → require re-authentication (configurable in Auth0, or enforced client-side with a countdown)
- Auth0 access token TTL: 15 minutes (already planned in Phase 0)
- Refresh token rotation: already planned
- Concurrent session limit: Auth0 Enterprise supports this; at Stage 1 it is not enforced. Consider showing "You are currently logged in on 2 devices" in account settings.

**Audit log visibility for caregivers:**
This is an underutilized trust-building feature. Caregivers should be able to see a simplified activity log for their care records: who accessed what and when. This is not the raw AuditLog (which is for HIPAA compliance, not UX) — it's a human-readable activity feed.

Proposed: an "Activity" section in care record settings showing:
- "Amy (Viewer) viewed documents — 3 hours ago"
- "Emergency packet shared — 12 hours ago, accessed 2 times"
- "Mark uploaded LTC Insurance Policy.pdf — 2 days ago"

This both builds trust and serves as an early warning system for unusual access.

**Suspicious access detection (basic):**
For a solo developer, full anomaly detection is out of scope. Minimum viable controls:
- Alert caregiver when a new device logs in to their account (Auth0 anomaly detection handles this)
- Alert caregiver when an emergency share link is accessed more than 5 times (suggests forwarding beyond intended recipient)
- Alert caregiver when a Viewer-role member downloads more than 10 documents in a single session (possible bulk data exfiltration)

These rules can be implemented as simple thresholds checked in Route Handlers and surfaced as Alerts in the notification system.

---

### Caregiver Guidance Content

The product owner requested "guides for caregivers" as a near-term solution. Proposed content spec:

**Guide 1: Keeping your Hearth account secure**
- Use a strong, unique password (or use "Sign in with Google")
- Enable two-factor authentication (MFA is required, but explain why it matters)
- Never share your login credentials — use Hearth's invite feature to give family members their own access
- How to recognize phishing attempts impersonating Hearth
- What to do if you think your account has been compromised (change password, revoke all share links, contact Hearth support)

**Guide 2: Managing who has access to your care records**
- How roles work (Admin, Coordinator, Viewer)
- How to review who has access to each care record
- How to remove a family member's access
- Why emergency share links expire (and how to revoke one early)
- Checking the activity log to see who has accessed what

**Guide 3: Protecting your loved one's financial information**
- What financial data Hearth stores and what it doesn't
- Who can see coverage and cost information (Admin only by default)
- Signs of elder financial abuse to watch for
- What to do if you suspect a family member is misusing access

**Guide 4: What Hearth does NOT do (setting expectations)**
- Hearth is not a financial advisor
- Hearth is not a clinical decision support system
- AI responses are informational, not medical advice
- When to call a doctor vs. ask the AI

**Format:** Short articles (500–800 words), plain language (8th grade reading level), placed in a "Help & Safety" section in the app settings and linked from onboarding. Written by the product team, not generated by AI. Review annually.

**Where guides live in the app:**
- Accessible from the account settings menu ("Security & Privacy" section)
- Surfaced contextually: the first time a caregiver creates a share link, show a tooltip linking to Guide 2
- Included in onboarding email series (3 emails over first week: welcome, security guide, how to invite family)

---

### Elder-Specific Fraud Considerations

Elder financial abuse is the fastest-growing form of elder abuse in the US, frequently perpetrated by family members. Hearth's family collaboration model creates a surface for this if not carefully designed.

**Specific risks:**
- An ADMIN family member downloads financial POA documents and uses them outside the intended purpose
- An ADMIN family member edits coverage or financial data to obscure assets
- A family member adds themselves as ADMIN after the care recipient loses capacity to consent

**Controls:**
1. **ADMIN action audit trail visible to all Admins:** Every ADMIN action (downloading a document, changing a member's role, creating a share link) is visible in the care record activity log to all other ADMIN-role members. This creates peer oversight.
2. **Document download always requires a reason field (optional for now, but log it):** Even if the caregiver skips the reason, the system logs that a download occurred, by whom, and when. This is already in the AuditLog design.
3. **"Report a concern" in-app link:** A one-tap form that sends an email to Hearth's abuse report address. Does not require the reporter to have account access (they may have been removed). Simple to build (a public form at `/report`). This creates a paper trail.
4. **Do not auto-grant ADMIN on account creation without explicit consent:** When the first caregiver creates a care record, they are ADMIN. Any subsequent ADMIN must be explicitly promoted by an existing ADMIN. ADMINs should receive an email notification when another user is promoted to ADMIN.

---

### Incident Response

Minimum viable incident response for a solo developer:

**Step 1: Detection**
Alerts on: failed login spikes (Auth0), unusual S3 access (CloudTrail + GuardDuty in Stage 2), emergency packet accessed 10+ times in an hour, a user's account generating 50+ API calls per minute.

**Step 2: Containment**
- If a caregiver account is compromised: Auth0 block user (one API call), rotate all share links for that user (set `expiresAt = now()` on all their `ShareLink` rows)
- If a share link is compromised: delete the Redis key + set `expiresAt = now()` on the DB row
- If S3 data is exfiltrated: rotate IAM access keys, audit S3 access logs for affected objects

**Step 3: Notification**
- If PHI is involved: HIPAA breach notification is required within 60 days of discovery. Notify affected users within 60 days with: what happened, what data was involved, what you're doing about it, how they can protect themselves.
- Template: draft and have ready before beta. Do not write it post-incident.

**Step 4: Documentation**
- Log the incident: when detected, what was affected, what was done, when resolved
- Preserve logs: do not delete CloudTrail or AuditLog entries related to the incident
- If more than 500 individuals are affected: notify HHS within 60 days and notify prominent media in affected states

**Single-page runbook location:** `/docs/incident-response.md` in the repo (private). Reviewed and updated quarterly.

---

### Implementation Roadmap

**Beta (required before any real users):**
- Auth0 MFA enforced (already planned)
- Share link `accessCount` + `lastAccessedAt` tracked and surfaced to caregiver
- "Revoke link" button on active share links
- Audit log writing on all document access (already planned)
- Caregiver guides written and published (Help & Safety section)
- Incident response runbook written (even if never needed)
- ADMIN promotion notification email

**Post-beta (Phase 1):**
- Activity feed on care records (human-readable audit log for caregivers)
- Suspicious access alerts (share link accessed 5+ times, bulk download detection)
- "Report a concern" public form
- Idle session timeout (30 minutes)
- Account settings page showing active sessions

**Phase 2:**
- GuardDuty + CloudTrail on S3 (requires Stage 2 AWS setup)
- Concurrent session limits (requires Auth0 Enterprise or custom enforcement)
- Elder financial abuse pattern detection (requires ML-adjacent analysis or third-party service)
- SOC 2 Type I gap assessment

---

### Priority Recommendation

**Beta essentials:** Auth0 MFA (already planned), share link access tracking, revoke-link button, caregiver guides, incident response runbook. These are inexpensive to build and necessary before real users.

**Minimum viable version for beta:** Auth0 MFA enforced, share links show access count, caregiver can revoke a link, three written security guides in the Help section.

---

## Feature D: Alerts & Todos Module

### Problem Statement

Caregivers managing aging parents with complex care needs face cognitive overload: multiple care recipients, multiple modules (documents, health, coverage, care log, tasks), and multiple time horizons (expiring in 30 days, overdue now, action needed this week). Today this information is distributed across module pages — there is no single place to answer "what do I need to do for Harold and Ruth right now?"

The designs surface alerts in two places — the NEEDS ATTENTION section on care record pages, and alert counts on home dashboard cards — but there is no unified alerts/todos page, no way to act on alerts without navigating into specific modules, and no consistent priority model across alert types.

The product owner has explicitly stated the goal: one module for to-dos and alerts that spans all care recipients and all modules.

---

### Alert Taxonomy

A complete set of alert types the system can generate, grouped by source:

**Document alerts:**
| Type | Trigger | Example |
|---|---|---|
| `DOCUMENT_MISSING` | A required document for the care stage is not in the vault | "Healthcare Proxy not on file for Ruth" |
| `DOCUMENT_EXPIRING` | A document with an `expiresAt` is within 30 days of expiry | "LTC Insurance Policy expires in 18 days" |
| `DOCUMENT_NEEDS_SIGNATURE` | A document is uploaded but flagged as requiring signature | "Hospice enrollment form needs signatures" |
| `DOCUMENT_UPLOADED_BY_OTHER` | A Coordinator or non-user uploaded a document | "Dorothy uploaded a document to Ruth's vault" |

**Health alerts:**
| Type | Trigger | Example |
|---|---|---|
| `MEDICATION_LOW_REFILL` | `refillDate` is within 7 days | "Harold's Lisinopril refill date is in 5 days" |
| `SCREENING_OVERDUE` | A screening's `nextDueDate` is in the past | "Harold's colonoscopy is overdue" |
| `DRUG_INTERACTION` | A new interaction is detected after medication add/update | "Amlodipine and Sertraline may interact" |

**Care coordination alerts:**
| Type | Trigger | Example |
|---|---|---|
| `TASK_OVERDUE` | A task's `dueDate` is in the past and status is not `DONE` | "Schedule memory care tour — overdue by 3 days" |
| `FAMILY_MEETING_RECOMMENDED` | Rule: stage is 4 or 5 AND no care log entry in 14 days AND care log has 3+ participants | "Family meeting recommended for Ruth's care record" |
| `COLLABORATOR_JOINED` | A new `CareRecipientMembership` row is created | "Amy Chen joined Harold's care team as a Viewer" |

**Financial/coverage alerts:**
| Type | Trigger | Example |
|---|---|---|
| `COVERAGE_EXPIRING` | An insurance coverage item's expiry is within 60 days | "LTC Insurance for Ruth expires in 42 days" |
| `MEDICARE_OEP` | Calendar-based: October 1 each year | "Medicare Open Enrollment starts in 14 days (Oct 15)" |

**Stage-based alerts:**
| Type | Trigger | Example |
|---|---|---|
| `STAGE_CHANGE_SUGGESTED` | 3+ warning signs logged at "See doctor" or higher urgency in the past 30 days | "Multiple warning signs suggest Harold may be entering Stage 4" |

**System alerts:**
| Type | Trigger | Example |
|---|---|---|
| `SHARE_LINK_ACCESSED` | A share link `accessCount` increases | "Emergency packet for Ruth was accessed 2 hours ago" |

---

### Alert Priority Model

Four-tier priority model:

| Priority | Label | Meaning | Example |
|---|---|---|---|
| `URGENT` | Act now | Time-critical, health or safety implication | Drug interaction detected; POLST not on file for Stage 5 patient |
| `HIGH` | Today | Should be addressed today | Document expiring in 7 days; task overdue |
| `MEDIUM` | This week | Should be addressed within a few days | Screening overdue; Medicare OEP in 30 days |
| `INFO` | FYI | No action required, informational | Collaborator joined; document uploaded by team member |

**How priority is determined:**
- `URGENT`: Hard-coded rules for specific `alertType` + context combinations. Drug interaction is always URGENT. POLST missing for a Stage 5 care recipient is URGENT (it would be MEDIUM for Stage 2).
- `HIGH` and `MEDIUM`: Stage-weighted. A document expiring in 30 days is HIGH for a Stage 5 patient (documents are actively needed) and MEDIUM for a Stage 2 patient.
- `INFO`: Always INFO — no weighting needed.

**Can the caregiver override priority?**
Not for URGENT — those are system-determined safety signals. For HIGH and MEDIUM, the caregiver can "downgrade" by snoozing (effectively treating it as lower priority for a defined period). They cannot upgrade an INFO alert to HIGH.

---

### Alert Lifecycle

```
Created (by cron job or event) 
    ↓
Active (visible in inbox, NEEDS ATTENTION, home card)
    ↓ [3 actions available]
    ├── Acted on (caregiver navigates to the resource and resolves the underlying issue)
    │   → Alert auto-expires when the trigger condition is resolved (e.g., document uploaded)
    ├── Snoozed (caregiver defers: 1 day / 3 days / 1 week / custom)
    │   → Alert becomes Active again after snooze period
    └── Dismissed (caregiver explicitly closes the alert without resolving it)
        → Alert is soft-deleted from the inbox but retained in AuditLog
        → Does NOT re-fire unless the trigger re-occurs (e.g., a new document expires)
```

**Auto-resolution:** When the underlying condition resolves, the alert should auto-expire. Example: a `DOCUMENT_MISSING` alert for "Healthcare Proxy" expires when a document tagged as healthcare proxy is uploaded. This requires the alert to store `resourceType` and `resourceId` so the resolution check can be a targeted query. Implementation: a nightly cron job checks all active alerts for resolved conditions and sets `expiresAt = now()`.

**Dismissed alerts:** Kept in the database (for audit purposes) but hidden from the UI. A caregiver who dismissed "Colonoscopy overdue" and then 30 days later the screening is still overdue — does the alert re-fire? Recommended: yes, with a 30-day minimum between re-fires for the same alert type on the same resource.

---

### Unified Todos + Alerts Page

**URL:** `/alerts` (global, across all care recipients) and `/recipients/[id]/alerts` (per-recipient filtered view)

**Page layout:**

```
ALERTS & TO-DOS

[Filter bar]
All | Urgent | Documents | Health | Tasks | Ruth | Harold

────────────────────────────────────────────────────────────

URGENT (2)

⚠️ [red]  Drug interaction: Amlodipine + Sertraline          Harold
           Potentially serious interaction. Review with Dr. Park.
           [View in Health Hub]  [Snooze]  [Dismiss]

⚠️ [red]  POLST form not on file                             Ruth
           Critical for Stage 5 care. Upload or request now.
           [Upload]  [Remind Dorothy]  [Dismiss]

────────────────────────────────────────────────────────────

HIGH (3)

🔶 [orange]  LTC Insurance expiring in 18 days               Ruth
             [View Coverage]  [Snooze 7 days]  [Dismiss]

🔶 [orange]  Colonoscopy overdue                             Harold
             Last completed: 2025. Due annually.
             [Log screening]  [Snooze 14 days]  [Dismiss]

🔶 [orange]  Task overdue: Schedule memory care tour         Harold
             Due 3 days ago. Assigned to you.
             [Mark complete]  [Reassign]  [Snooze]

────────────────────────────────────────────────────────────

THIS WEEK (4)

...
```

**Filters:**
- By priority tier (URGENT, HIGH, MEDIUM, INFO)
- By care recipient (Harold, Ruth, or All)
- By type category (Documents, Health, Tasks, Coverage, System)
- By status (Active, Snoozed)

**Relationship to Family Workspace task board:**
The task board in Family Workspace shows tasks for one care recipient. The Alerts & Todos page is the superset: it includes tasks from all care recipients plus all non-task alerts. The task board is a filtered subset of the same data — tasks only, per recipient. They share the same `Task` and `Alert` database tables.

---

### Home Dashboard Integration

**On care recipient cards (home dashboard):**

Option A (current design): Show up to 3 alert items inline on the card. Problem: requires knowing alert text at card render time; creates visual inconsistency when alert counts are high.

Option B (product owner suggestion): Show a single summary banner. Recommended implementation:

```
┌─────────────────────────────────────────────────────────┐
│  Ruth · Mother-in-law · Age 97 · Stage 5: End of Life   │
│  ────────────────────────────────────────────────────── │
│  ⚠️ 3 urgent · 5 actions needed                [View →] │
│  ────────────────────────────────────────────────────── │
│  7 Docs   7 Meds   4 Providers                          │
│  [Open care record →]                                   │
└─────────────────────────────────────────────────────────┘
```

"View →" links to `/recipients/[id]/alerts` — the per-recipient filtered alerts page. This keeps the home dashboard card compact while making the alert count actionable.

**URGENT alerts break through to home dashboard:** If there is an URGENT alert for any care recipient, show a top-of-page banner on the home dashboard (not per-card): "⚠️ Ruth has 1 urgent alert requiring immediate attention. [View →]" This ensures URGENT alerts are impossible to miss even if the caregiver doesn't open the specific care record.

---

### Notification Delivery

Not all alerts warrant the same notification channel:

| Priority | In-app | Email | SMS | Push notification |
|---|---|---|---|---|
| URGENT | ✅ Always | ✅ Immediately | ✅ If opted in | ✅ If opted in |
| HIGH | ✅ Always | ✅ Daily digest | — | — |
| MEDIUM | ✅ Always | ✅ Weekly digest | — | — |
| INFO | ✅ Always | — | — | — |

**Email digests:** Daily digest (9am local time) summarizing HIGH and higher alerts. Weekly digest (Monday 9am) for MEDIUM. Implemented as a Netlify Scheduled Function (previously Vercel Cron) hitting `/api/jobs/alert-digest`.

**SMS for URGENT:** Optional opt-in during onboarding. "Would you like to receive a text message for urgent alerts? (e.g., critical missing documents, drug interactions)" Twilio SMS, requires 10DLC registration. Do not send PHI in the SMS body — send "You have an urgent alert in Hearth for Ruth's care record. [Open app]" with a link.

**Web push:** Web push API (built into browsers, no third-party SDK needed). Requires HTTPS (already required). Prompt for push permission after the user has used the app for 3+ days (not on first visit). This gives context for why the permission is being requested.

---

### Alert Generation Engine

Two complementary mechanisms are needed:

**Mechanism 1: Event-driven alerts (immediate)**
When a trigger event occurs, create the alert immediately.
- New medication added → re-check drug interactions → create `DRUG_INTERACTION` alert if found
- New `CareRecipientMembership` created → create `COLLABORATOR_JOINED` alert
- Share link accessed → create `SHARE_LINK_ACCESSED` alert

Implementation: In each Route Handler that creates/modifies data, call `createAlert()` after the primary write. The `createAlert()` function is idempotent — if an alert of the same type for the same resource already exists and is active, it does not create a duplicate.

**Mechanism 2: Scheduled scans (daily cron)**
Some alert conditions are state-based, not event-based.
- Document expiry: scan all Documents where `expiresAt` is within 30 days
- Medication refill dates: scan all active Medications where `refillDate` is within 7 days
- Missing documents: compare required checklist against uploaded documents per care stage
- Screening overdue: compare `nextDueDate` against today
- Medicare OEP: fire on October 1 each year (hardcoded)
- Task overdue: scan all Tasks where `dueDate` is past and status != `DONE`
- Stage change suggested: evaluate warning sign patterns from past 30 days

**Cron job:** `GET /api/jobs/alert-scan` — runs daily at 6am. Secured with `CRON_SECRET` header. Uses paginated queries (process 100 care recipients at a time) to stay within the 60-second Netlify function limit.

**Idempotency:** Before creating any alert, check whether a non-dismissed alert of the same type for the same resource already exists. If it does, update `updatedAt` (for freshness) but do not create a duplicate. This prevents the daily cron from flooding the inbox with repeat alerts.

---

### Data Model

```prisma
model Alert {
  id              String        @id @default(cuid())
  careRecipientId String?       // null for user-level alerts (e.g., MEDICARE_OEP)
  userId          String        // the user who should see this alert
  type            AlertType
  priority        AlertPriority
  title           String
  body            String?       // optional longer description
  actionUrl       String?       // deep link to the resource
  resourceType    String?       // "Document" | "Medication" | "Task" | "ShareLink"
  resourceId      String?       // ID of the triggering resource
  isRead          Boolean       @default(false)
  readAt          DateTime?
  isDismissed     Boolean       @default(false)
  dismissedAt     DateTime?
  snoozedUntil    DateTime?
  expiresAt       DateTime?     // auto-set when underlying condition resolves
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  careRecipient CareRecipient? @relation(fields: [careRecipientId], references: [id])

  @@index([userId, isDismissed, priority])       // My active inbox
  @@index([careRecipientId, isDismissed])         // All alerts for Ruth
  @@index([resourceType, resourceId])             // Find alerts for a specific resource
  @@index([expiresAt])                            // Cleanup scan
  @@index([type, resourceId, isDismissed])        // Idempotency check
}

// AlertRule is optional — only needed if alert generation logic 
// becomes complex enough to warrant a configuration layer.
// For MVP, alert rules are hardcoded in the scan job.
// Add AlertRule as a model in Phase 2 if caregivers need to customize alert thresholds.
```

---

### What Ships in Beta vs. Post-Beta

**Beta (Sprints 1–8) — document alerts only:**
- `DOCUMENT_MISSING` — checklist-based, available once document checklist is built (Sprint 5–6)
- `DOCUMENT_EXPIRING` — expiry date-based, available once Document model has `expiresAt` (Sprint 3–4)
- `SHARE_LINK_ACCESSED` — event-driven, available once share links are built (Sprint 5–6)
- `COLLABORATOR_JOINED` — event-driven, available once invitation flow is built

**Not in beta** (requires post-beta modules):
- Health alerts (require Health Hub — Sprint 9–10)
- `STAGE_CHANGE_SUGGESTED` (requires warning sign log — Sprint 12)
- Coverage alerts (require Money & Coverage — Phase 2)

**Home dashboard:** Show alert count ("3 urgent · 5 actions needed") with link to per-recipient alerts page. Build this summary in Sprint 7–8 (polish sprint).

**Full Alerts & Todos page:** Build in Sprint 7–8. Beta version shows only document alerts and task overdue alerts. Post-beta version adds health and coverage alerts as those modules ship.

**Notification delivery:** Email digest only for beta (Resend, already planned). Web push and SMS are post-beta.

---

### Priority Recommendation

**Alert taxonomy and data model:** Must be decided before Sprint 1 — the `Alert` table schema affects every module. Define it now even if only document alerts are generated in beta.

**Alert generation:** Event-driven for Sprint 3–4 (document upload/confirm route handlers create alerts). Daily cron scan for Sprint 5–6 (expiry scan). Full taxonomy after Health Hub ships.

**Minimum viable version for beta:** An `Alert` table with `DOCUMENT_MISSING`, `DOCUMENT_EXPIRING`, and `SHARE_LINK_ACCESSED` types. A per-recipient alerts page showing active alerts with dismiss/snooze. Alert count summary on home dashboard care recipient cards. Daily email digest for HIGH+ alerts.
