# Hearth — UX Review

> A detailed evaluation of the April 2026 web and mobile wireframes against the product decisions captured in PM_PRODUCT_BREAKDOWN.md and the implementation plan.
> Perspective: UX designer focused on caregiver user — typically 45–65 years old, emotionally stretched, time-poor, often in crisis mode.
> Last updated: 2026-04-21

---

## How to Read This Document

Each section covers one view or module. Within each:
- **What's working** — patterns that serve the user well
- **Concerns** — things that risk confusing, overwhelming, or emotionally distressing the user
- **Suggestions** — concrete changes to evaluate
- **Open questions** — things the wireframes don't answer yet
- **Differentiator ideas** — longer-term ideas that could set Hearth apart

Priority markers: 🔴 High (fix before beta) · 🟡 Medium (address before v1.0) · 🟢 Low (nice to have / future)

---

## 0. Cross-Cutting Observations

### 0.1 Wireframe internal inconsistencies (🔴 High)

Several wireframes have placeholder name collisions — the breadcrumb says one person but the body references a different one. These suggest the wireframes were assembled from templates without a consistent test persona.

| Screen | Breadcrumb / Header | Body copy references | Issue |
|---|---|---|---|
| Stage Navigator | "Harold · Stage 4" | "Dorothy's current stage" — Stage 2 progress | Name AND stage mismatch |
| Care Finder | "Harold · Stage 4 care options" | "WHICH FITS DOROTHY'S STAGE 2?" + "Recommended now: In-home companion" | Stage 4 wouldn't recommend in-home companion |
| Money & Coverage | "Harold" | "COVERAGE OVERVIEW — DOROTHY" + "If Dorothy moves to assisted living..." | Dorothy vs. Harold |
| AI Assistant | (none) | "Plain-English answers, personalized to Dorothy's situation" | Inconsistent test persona |
| Mobile AI | "Harold" | "Contextual to Harold's profile" ✓ | This one is correct |

**Why this matters for UX**: If the final product ever displays these inconsistencies to real users, they'll immediately lose trust — "This app is confused about who my mother is." Before build, every screen needs a single canonical test persona with data that aligns to their stage.

**Suggestion**: Lock one persona per care recipient for the wireframes — e.g., Harold (Stage 4, Father-in-law) and Ruth (Stage 5, Mother-in-law). Everything in their views pulls from those profiles. Never introduce a third name ("Dorothy") unless you're showing a third-recipient scenario.

### 0.2 Outdated "AI auto-categorization" labels (🔴 High)

The Document Vault — both web (page 10) and mobile (page 4) — still labels the upload card as "Auto-categorized by AI" and shows "AI ✨" badges on two Recent Documents (Mom's Will, Medication List). This contradicts the Q&A decision to remove AI categorization entirely in favor of user-selected categories from a preset list.

**Why this matters**: If designers hand these off, engineers may build the AI pipeline that was explicitly cut. If users see the badge, they'll expect auto-categorization.

**Suggestion**: Replace "Auto-categorized by AI" copy with something like "Choose a category" or "Organized by you, shareable with everyone." Remove all AI ✨ badges from documents.

### 0.3 Stage progression bar on home cards (🟡 Medium)

Each care recipient card on the Home Hub shows a 5-segment progress bar — Harold at 4/5, Ruth at 5/5 filled (End of Life).

**Concern**: This visualization of someone's decline as a filling progress bar could feel deeply uncomfortable. Progress bars traditionally signal "achievement" or "completion." Here it signals "how far my mother is toward death." For a caregiver opening the app each morning, this framing may cause emotional discomfort.

**Suggestion**: Consider subtler alternatives:
- Replace the filled progression bar with a single-dot indicator on a stage spectrum (one dot showing "where they are now")
- Use softer, less saturated colors for later stages (instead of bright terracotta)
- Swap the "progress bar" metaphor for a "wayfinding" metaphor — e.g., a subtle breadcrumb: "Stage 4 of a 5-stage care journey"
- Let users toggle the stage indicator off for sensitivity

Also: is "Stage 5: End of Life" the label a caregiver wants to see repeatedly in a home dashboard? Consider softer alternatives like "Stage 5: Comfort Care" that were likely discussed in the staging design session.

### 0.4 Stage badge color coding (🟡 Medium)

The wireframes use terracotta/orange for stage badges across all stages. This is warm and brand-consistent but loses the signal that stage 1 and stage 5 are fundamentally different situations.

**Suggestion**: Consider graduated color — e.g., sage green for Stage 1 (Independent), warm amber for Stages 2–3, deeper earth tone for Stages 4–5. Not alarm-red; still brand-aligned. This also aids accessibility (color + text = redundant coding).

### 0.5 Quick Actions proliferation (🟡 Medium)

- **Home Hub** has 4 Quick Actions: Emergency share packet, Share care summary, Family meeting agenda, Ask AI Assistant
- **Per-recipient Care Record** has 3 Quick Actions: Emergency share packet, Share care summary, Ask AI about [Name]

**Concerns**:
- Why does "Family meeting agenda" appear only on Home Hub, not per-recipient? Family meetings are typically about one specific person.
- "Emergency share packet" and "Share care summary" feel conceptually similar — what's the difference from a user's perspective? The difference between "emergency" and "non-emergency" sharing isn't obvious.
- Across both views, the same action labels repeat — creates visual redundancy but ambiguity about whether they do the same thing.

**Suggestions**:
- Consolidate: Put all per-recipient Quick Actions on the Care Record (including Family meeting agenda scoped to that person).
- On Home Hub, show universal caregiver actions (My Aging Plan, Settings) rather than per-recipient shortcuts.
- Clarify the difference between Emergency Share Packet and Share Care Summary with subtitles: e.g., "Emergency share packet: critical info for ER/paramedics" vs. "Share care summary: full picture for a new family member"

### 0.6 "Act" button lacks differentiation (🟢 Low)

On the NEEDS ATTENTION section in the Care Record (web pages 5, 7) and on the Alerts & Tasks page (web page 9), every alert has an identical "Act →" button.

**Concern**: "Act" is generic. A document alert needs different action language than a medication reconciliation alert. "Act" is one click but users have to infer what they'll get.

**Suggestion**: Make button labels context-specific:
- Document missing → "Upload"
- Document expiring → "Review"
- Medication reconciliation → "Reconcile"
- Appointment scheduled → "View details"
- Coverage expiring → "Check policy"

This reduces click-cost (users know what will happen) and supports faster scanning.

---

## 1. Home Hub

### What's working
- **Warm greeting** with first name ("Good morning, Margaret") sets a human tone immediately
- **"Your family care hub — everyone in one place"** — clear subtitle that frames the product's purpose
- Clear two-card layout for multiple care recipients with consistent stats per card
- **"My Own Aging Plan" teaser card** at the bottom with 40% completion is a brilliant hook — converts caregivers into planners for themselves
- "Add a care recipient" as a dashed card pattern is discoverable without feeling like a hard CTA
- Stats grouped into meaningful trios: Medications / Docs on file / Providers — a fast triage glance

### Concerns

**🔴 The alert summary banner inside each care recipient card has two parallel indicators** — "2 urgent alerts" (red-bordered) + "3 actions needed" (yellow-bordered). Per decision, home dashboard shows a summary banner, not inline alert cards. The current design is halfway between:
- It's not the simple summary banner ("X urgent · Y actions needed" as one line)
- It's not full alert detail cards either
- It may confuse users: are these tappable? Do they navigate? Do they reveal detail?

**🟡 Age display**: "Father-in-law · Age 89" — showing age prominently every time may not be what users want. A caregiver doesn't forget their parent's age, but seeing it repeatedly next to their name might feel reductive.

**🟡 Emergency share packet as the single red/prominent Quick Action** — semantically, "emergency" should be a safety-net button, not the primary call to action. Users who open the app to "check on Mom" shouldn't feel they're in a 911 situation every time.

### Suggestions
- Collapse the two inline alert chips into a single summary banner per the decision: "⚠ 2 urgent · 3 actions needed →"
- Consider hiding age from the card by default, or showing it as a small chip (de-emphasized)
- Change Emergency Share Packet to neutral styling on Home Hub; reserve red/urgent styling for when there's a real emergency state
- Add a subtle "last updated X ago" per recipient card so users know data freshness at a glance

### Open questions
- What does this view look like with 0 care recipients? (Onboarding empty state)
- What about 5+ care recipients? Does it scroll? Switch to a denser list view?
- Does the "My Own Aging Plan" card also appear when the caregiver hasn't started a plan?
- If a caregiver IS the primary caregiver for someone with dementia, do they see Home Hub or a scoped view?

### Differentiator ideas
- 🟢 **Morning digest**: Replace the full dashboard with an optional "today's top 3" — surface what actually needs attention today rather than overall state
- 🟢 **Caregiver wellness check**: Quiet, opt-in prompt once a week — "How are YOU doing this week?" — routes to support resources if needed
- 🟢 **Context-aware greeting**: "It's been 5 days since you last logged anything for Harold — everything okay?" (gentle, not guilt-inducing)

---

## 2. Care Record (per-recipient)

### What's working
- **Breadcrumb header** (Hearth | Care Record — Harold | — Father-in-law · Age 89 · Stage 4) is extremely clear about where you are
- Care recipient profile summary (avatar + relationship + age + stage) matches the home card — consistent
- **NEEDS ATTENTION at the top** is the right priority — user opens the record, immediately sees what's pressing
- **Care Modules grid** is a visual dashboard — each tile shows live stats (11 docs on file, 9 medications, 3 members · 4 open tasks)

### Concerns

**🔴 Redundancy with Alerts & Tasks page**: The NEEDS ATTENTION section here shows the same alert types that appear on the dedicated Alerts & Tasks module. Users will wonder: is this a preview? A subset? Is it scoped to this care recipient only? What's the relationship between the two?

**🟡 No clear visual hierarchy between different alert severities**: Harold's care record shows 5 alerts in the NEEDS ATTENTION section — the first three have red-orange borders, the last two have yellow borders. It's subtle. On a glance, they all look equally important.

**🟡 Module tile stats read inconsistently**:
- "Document Vault: 11 docs on file" — positive framing
- "Stage Navigator: Stage 4: Advanced Care" — status label
- "Health Hub: 9 medications" — count only (no quality signal)
- "Care Finder: Stage 4 care options" — redundant with the profile header
- "Money & Coverage: Insurance & benefits" — generic description
- "Family Workspace: 3 members · 4 open tasks" — count with mild urgency

The stat chosen for each tile varies in type (count, status, label, description). A user can't compare across tiles at a glance.

**🟡 No indication of which modules have new activity**: If Sarah uploaded a document this morning, is there a badge on the Document Vault tile? The tiles look static.

### Suggestions
- **Clarify the relationship**: Add a small link at the bottom of NEEDS ATTENTION — "See all [N] alerts for Harold →" that routes to the scoped Alerts & Tasks page
- **Standardize tile stats**: Every tile shows one primary number + one qualifier:
  - Document Vault: "11 docs · 2 expiring"
  - Stage Navigator: "Stage 4 · 2 new warning signs"
  - Health Hub: "9 meds · 1 interaction flagged"
  - Care Finder: "3 facilities shortlisted"
  - Money & Coverage: "5 policies · LTC expires 40 days"
  - Family Workspace: "3 members · 4 open tasks"
- **Add a "new activity" dot** to module tiles when there's been a change in the last 24 hours
- **Stronger visual severity ramp**: Urgent alerts use a filled red badge icon, Actions Needed use an outlined yellow/amber badge

### Open questions
- Is the profile avatar (emoji face 🧓) the only option? Can family upload a real photo? (Per DB, photoUrl is supported)
- What happens on this page when care recipient has `deletedAt` set? Archive view?
- Does the care record scroll — or do modules sometimes land below the fold on desktop?

### Differentiator ideas
- 🟡 **Care recipient's voice surface**: If the recipient has contributed anything (a wish, a preference, a photo), bubble it up as a subtle "From Harold himself" section. Powerful for emotional continuity.
- 🟢 **Timeline view toggle**: Let users switch from "modules" to "chronological timeline" — every event (doc upload, appointment, stage change, task completed) as a single ordered stream. Good for visitors joining mid-journey.

---

## 3. Alerts & Tasks

### What's working
- **Unified page matches the product decision**: all alert types in one place, categorizable
- **Clear two-section layout**: URGENT (5 items) vs. ACTIONS NEEDED (2 items) — semantic priority
- **Filter tabs** (All · Document · Medical · Coverage · Appointment · General) — right level of categorization
- **Act / Snooze / Dismiss** button triad is self-documenting
- **Care recipient name inline** ("LTC insurance expires in 40 days — Harold") is essential when caregiver manages multiple people

### Concerns

**🔴 No "Snoozed" or "Dismissed" filters visible**: Once a user snoozes an alert, where does it go? The decision says snoozed/dismissed items should be filterable, but the current filter tabs only show categories. If a user accidentally dismisses something, recovery isn't obvious.

**🟡 All three action buttons per row = 3 × 7 alerts = 21 buttons on screen**: Visual density is high. For a caregiver already feeling overwhelmed, seeing 21 clickable buttons on one page is its own form of decision fatigue.

**🟡 "Act" button is the widest / most prominent element in each row**: This works if every alert needs immediate action, but many don't — a "Family meeting recommended" alert doesn't have the same urgency as "Hospice enrollment docs need signatures."

**🟡 No grouping by care recipient**: All 7 items intermix Harold's and Ruth's alerts. Sorted by urgency is correct for "what's most urgent" but caregivers sometimes want "show me only Ruth's stuff right now."

### Suggestions
- **Add status filter**: Alongside the category tabs, add a status selector: Active | Snoozed | Dismissed | All
- **Compress the button triad**: Act as the primary button, Snooze/Dismiss as a small ⋯ menu → reduces visual clutter 2/3
- **Add secondary filter by care recipient**: Dropdown or chip set next to filter tabs — "Ruth · Harold · All"
- **Contextualize "Act" button labels** per alert type (see cross-cutting 0.6)
- **Empty state copy**: "You're all caught up 🌿" or similar — rewarding when list is clear
- **Bulk actions**: Checkbox select + "Snooze all for 1 week" / "Dismiss all document alerts" — power-user feature for when caregivers do a weekly triage

### Open questions
- Can a caregiver see alerts that OTHER family members have acted on? (Collaborator visibility)
- When an alert is snoozed for 1 week, does it auto-reappear? What if the underlying issue was resolved in the meantime (e.g., the missing doc was uploaded)?
- What's the maximum number of alerts shown before pagination kicks in?
- Can users set "priority rules" — e.g., "always show medication alerts first"?

### Differentiator ideas
- 🟡 **"Delegate alert"**: A caregiver who's traveling can reassign an alert to their sibling — "Can you handle this one?" with a note attached
- 🟡 **"This isn't urgent" feedback loop**: Long-press or right-click lets user tell the system "this shouldn't be urgent for me" — trains future prioritization
- 🟢 **Morning / evening alert digest emails**: Instead of real-time notifications for non-critical items, batch them

---

## 4. Document Vault

### What's working
- **Stats row** (14 Documents · 6 Categories · 2 Expiring · 68% Checklist) — glanceable numeric dashboard
- **Missing document banner at the top** with Upload now + Remind Dorothy — critical-first hierarchy
- **Document Categories sidebar** is intuitive and mirrors how caregivers mentally group papers (Legal, Medical, Financial, Insurance, Identity, Care Plans)
- **Recent Documents panel** shows uploader name — important for family accountability
- **Checklist with orange for completed / outlined for missing items** is clear
- **Emergency Packet CTA** prominent as a card alongside Upload

### Concerns

**🔴 "Auto-categorized by AI" copy and "AI ✨" badges** — both contradict the product decision to use user-selected categories only. Must be removed.

**🟡 The missing-doc banner "Missing: Healthcare Proxy for Dorothy"** — name inconsistency again. Also, "This is a critical document. Add it now or invite Dorothy to upload it." — but Dorothy is the care recipient, not the caregiver. Inviting the care recipient to upload their own healthcare proxy might be appropriate in some cases but awkward in others (e.g., if Dorothy has dementia). The "invite to upload" flow needs clarification about who the target is.

**🟡 No visibility indicator on Recent Documents**: Documents have visibility (ALL_MEMBERS / ADMIN_ONLY / SPECIFIC_MEMBERS) but that's invisible in the list. Can a Coordinator tell at a glance which documents they can see that a Viewer can't?

**🟡 Category counts on sidebar**: "Legal · 3 docs" shows category detail as a comma-separated string ("Will (2023) · Financial POA · Living Will"). On a small column, this truncates unpredictably. Feels text-heavy.

**🟡 Document checklist is 7 items but the stats row says "68% complete"** — 5 of 7 = 71%, not 68%. Math aside (may be rounding), seeing a specific percentage on something so consequential makes users fixate on "getting to 100%." That's good motivation but can also cause anxiety — "Is my mom's end-of-life preparedness really 68% complete?"

**🟡 No preview / inline view for documents**: "Mom's Will (2023).pdf" in the Recent panel — clicking what? Opens a PDF viewer? Downloads? Goes to a detail page? Not indicated.

### Suggestions
- Replace "Auto-categorized by AI" with "Choose a category"
- Remove all AI ✨ badges
- Add a visibility icon next to each document (eye for All, lock for Admin only, key for Specific)
- Provide a hover/long-press tooltip on checklist items: "Will or Trust ✓ — Uploaded by Sarah on Apr 16 · Shared with all members"
- Show who can see each document in the card detail view
- Replace "%" on checklist with a fraction: "5 of 7 essential documents on file" — less gamified, more factual
- Clarify click behavior on document filename — either open inline preview or route to a detail page; be consistent

### Open questions
- What's the upload flow? Drag and drop onto the page? File picker modal?
- How does the user mark a checklist item as "not applicable" (e.g., person has no will because of trust-only estate)?
- Can documents be linked across care recipients (e.g., a power of attorney document that covers multiple family members)?
- What happens when a document expires — does it stay in the vault or archive?
- Where is the "See all documents" view accessed? (Implementation plan mentions it for Sprint 3 but doesn't surface in these wireframes)

### Differentiator ideas
- 🟡 **Smart expiration suggestions**: "Most Illinois driver's licenses are valid 4 years — should we set an expiration of [date]?" — proactive help without requiring AI categorization
- 🟡 **Document request templates**: "Remind Dorothy" has pre-written templates for common requests: "Healthcare Proxy," "Insurance cards (front + back)," "Medication list update" — reduces friction for the caregiver
- 🟡 **Family photo + doc merge**: Attach a photo of a signed document + a scan — useful for family members who snap a phone photo of mom's POA sitting on the kitchen counter
- 🟢 **Expiry calendar view**: A visual calendar showing all expirations — insurance, POA, state forms — for the year ahead

---

## 5. Stage Navigator

### What's working
- **5-stage progress bar** at the top is clear and navigable
- **Warning signs grouped by domain** (Cognitive, Physical, Functional, Financial, Social) — matches mental models
- **Urgency chips (Monitor / See doctor / Act now)** are system-defined per decision — good
- **Conversation Guides** with stage tags help users find the right guide for their moment
- **"What's Coming in Stage 3"** section is forward-looking and prepares families emotionally
- **"Normal aging vs. Concern" comparison grid** is educational and reassuring for caregivers who are anxious about every sign

### Concerns

**🔴 Name/stage mismatch**: Breadcrumb shows Harold Stage 4, body shows "Dorothy's current stage" highlighted at Stage 2. These must sync in the final design.

**🟡 Warning signs section is ambiguous**: Are these:
- (a) Standard warning signs for Stage 2 that caregivers should *watch for*, or
- (b) Signs the caregiver has *actually observed and logged*?

The urgency chips suggest (b) because "Act now" on "Unpaid bills piling up" is a specific, concrete call to action. But it's labeled "WHAT TO WATCH FOR" which suggests (a). This ambiguity is severe — confusing observation (b) with reference material (a) is a clinical safety issue.

**🟡 No way to log an observation from this page**: If this is meant to be a reference list, where does the caregiver log "I actually noticed Dad forgetting recent conversations"? There's no add-observation CTA.

**🟡 Stage bar orientation**: Labels "1. Independent / 2. Early Assistance / 3. Moderate Care / 4. Advanced Care / 5. End of Life" — stage 5 is brutally named for a navigation element. Consider softer terminology aligned with design partner feedback.

**🟡 Progress bar filled vs. unfilled**: Stages 1 and 2 are filled (terracotta), Stages 3-5 are unfilled (gray). The visual rhetoric is "stages you've passed are complete." But aging isn't a completion — it's a present reality. A family at Stage 4 hasn't "completed" stages 1-3; the person has simply progressed. This framing subtly reinforces the "progress toward death" metaphor from Home Hub.

### Suggestions
- **Clarify the warning signs section**: Two distinct panels:
  - "What to watch for at this stage" (standard reference list — no urgency chips, no "Act now" buttons)
  - "Signs you've observed" (caregiver's actual log — with urgency chips that escalate to alerts)
- Allow direct observation logging from the reference list: "I've noticed this →" opens an observation form
- Consider using a timeline ("← past · now · future →") instead of a progress bar — less "completion-themed"
- Consider softer stage names in collaboration with the two-track staging design session; "End of Life" could be "Comfort & Closure" or similar (only the design partner can truly judge which language lands)

### Open questions
- How do users update the stage? From the care record header (mentioned in implementation plan but not shown in wireframes)?
- If I logged "Unpaid bills piling up" last week and my brother logged the same thing this week, do I see two entries? One?
- Who sees the "Normal aging vs. Concern" content — every role? Or just Admin?
- Do "Conversation Guides" have a return-to / bookmarking mechanism for users who open and close them multiple times?

### Differentiator ideas
- 🟡 **Stage change announcement**: When a caregiver changes someone's stage, prompt: "Would you like to notify [family members]? Shall I generate a 'state of care' update for the family?" — automates the hardest family communication moment
- 🟡 **Stage-specific reading library**: Per stage, curated short-read articles (3–5 min read time) — not just conversation guides but emotional support, medical overviews, practical how-to
- 🟡 **Decision journal integration**: Each stage transition prompts the caregiver: "What made you decide it was time to move to [next stage]?" — builds a personal narrative useful later (for siblings who disagree, for future similar decisions)
- 🟢 **Peer community at this stage**: Opt-in forum — "Other caregivers currently at Stage 4" — moderated peer support (Phase 3 consideration)

---

## 6. Health Hub

### What's working
- **Stats row (6 Medications · 3 Screenings due · 4 Providers · 1 Interaction flagged)** is an excellent triage snapshot
- **Low refill / Beers Criteria / Interaction badges** on medication cards are exactly the kind of clinical surfacing caregivers need
- **Screening schedule with colored status dots + labels (Overdue / Due this year / Completed)** — intuitive
- **"No geriatrician on file — Recommended for age 78+"** with an Add button is a thoughtful nudge
- **Upcoming Appointments with days-until chip** — good at-a-glance

### Concerns

**🟡 Medication card dropdown affordance**: The Beers Criteria and Interaction badges have "▼" indicating they expand. Good pattern, but user has to guess — the chip doesn't look affordance-heavy. Also, if multiple medications have flags, does each expand independently? (Yes, I think so, but unclear from wireframe.)

**🟡 "1 Interaction flagged"** — the single stat feels clinically under-weighted. A drug interaction could be life-threatening. Displaying it as parallel with "4 Providers" stat doesn't carry the right gravity.

**🟡 Nothing in the Health Hub wireframes addresses allergies** — despite the Allergy table being in the DB schema. Are allergies on a separate page? Integrated with medications? Critical for emergency packet.

**🟡 No prescribing doctor shown in medication cards**: Beta spec includes `prescribedBy` field. Useful for caregivers who need to call "whoever prescribed this."

**🟡 Screening schedule assumes standard screenings apply**: Mammogram, DEXA scan — these are sex-specific. If the UI shows them for a male care recipient, it's problematic. Need to confirm age/sex-based filtering logic is applied.

### Suggestions
- Make the dropdown affordance more explicit — e.g., the whole badge tappable with a clear visual change on hover, or an inline-expanded section below the card
- Elevate interactions: If there are any, show a prominent warning banner at the top of Health Hub ("⚠ 1 drug interaction flagged — review before next dose")
- Add an Allergies section in Health Hub (or make it a sub-tab)
- Show prescribing doctor on medication card: "Lisinopril 10mg · Rx: Dr. Park · Daily · AM · Blood pressure"
- Add "Add allergy" CTA
- Clearly filter screening schedule by age/sex (driven by DB data)
- Consider a "medication reconciliation" flow specifically — "Just got home from hospital? Let's reconcile your medication list" — high-value workflow

### Open questions
- Is there a way to export the medication list as a PDF for doctor visits?
- Do medication changes generate alerts / audit entries?
- Can caregivers add notes like "She forgot to take this on Tuesday"?
- How are medication interactions displayed in the inline expansion — severity explanation? Source citation?
- What's the Add Medication flow? RxNorm autocomplete (per plan) but where does the user interact?

### Differentiator ideas
- 🟡 **Pill appearance photos**: Show a tiny picture of the actual pill (from FDA database) — helps caregivers verify the right medicine, especially when pills get mixed up
- 🟡 **Refill coordination**: "Lisinopril refill due May 3. Your pharmacy is Walgreens on Belmont. Tap to call." — reduces friction at the exact moment it's useful
- 🟡 **Appointment prep checklist**: Each upcoming appointment has a dynamic prep list — "Bring medication list (tap to print), list of questions, insurance cards" — generated from the care record
- 🟡 **Symptom log integration**: "Notice something between appointments? Log it here." — feeds into pre-appointment summary for the doctor
- 🟢 **Medication voice reminders for care recipient**: If the care recipient has their own account (Phase 2), gentle voice reminders at dosing times

---

## 7. Care Finder

### What's working
- **Care type spectrum as a visual row**: In-home → Adult day → Assisted living → Memory care → Skilled nursing — helps caregivers understand the continuum of care
- **Price ranges per type** are concrete and realistic
- **"Recommended now" badge** on the stage-appropriate option is good guidance
- **Facility cards** show essential comparison: name, type, distance, rating, price
- **Shortlist with "Compare side by side"** matches how shopping decisions actually get made
- **40-question tour checklist** is huge value — caregivers touring facilities often don't know what to ask
- **Transition planning guide** is also valuable

### Concerns

**🔴 Stage/recommendation mismatch**: Breadcrumb says Harold Stage 4 but "WHICH FITS DOROTHY'S STAGE 2?" is highlighted and recommends In-home companion. Stage 4 = Advanced Care typically means memory care or skilled nursing, not in-home.

**🟡 Price ranges are wide**: "$3.5–7K/mo" for Assisted Living — without regional context, these are directionally right but not decision-grade. A Chicago family and a Des Moines family see very different numbers.

**🟡 CMS ratings shown (★★★★☆) for all facilities**: CMS Care Compare ratings are only robust for skilled nursing. For assisted living, ratings may come from Yelp, Google, or other sources — attribution matters for trust.

**🟡 Shortlist sharing says "Share shortlist with siblings →"**: "Siblings" is specific — might not apply (child caring for in-laws, spouse caring for spouse, etc.). Generic "family members" is safer.

**🟡 40-question tour checklist as a dashed/secondary card** deserves more prominence given its value.

**🟡 Search says "Search facilities near 60614"** — good that it uses zip code, but no radius selector visible. Mobile version shows radius filter, web should match.

### Suggestions
- Sync recommendations to actual care stage (fix wireframe consistency)
- Show regional price adjustment: "$3.5–7K/mo *nationally averaged* · Chicago-area: $4.2–8.5K/mo"
- Clarify rating sources: "CMS rating" for skilled nursing, "Aggregated rating" or "State inspection rating" for assisted living
- Change "siblings" → "family" in sharing prompt
- Elevate the tour checklist to a primary CTA (equal prominence to Shortlist)
- Add distance radius selector to web search bar

### Open questions
- How do caregivers get added to a tour (booking flow)?
- After a tour, can they jot notes that land in the facility's card — "Loved the garden, staff were kind, but felt understaffed at lunch"?
- Is there a way to compare more than 2 facilities at once? (Side-by-side typically implies 2)
- How are Medicaid-accepting filters determined? Facility self-reporting? State lists?

### Differentiator ideas
- 🟡 **Facility inspection history display**: For skilled nursing, show the last inspection findings (from CMS data) in plain language — "Last state inspection: 2024 · 2 minor deficiencies (resolved) · No critical findings"
- 🟡 **"Ask the community"**: Link to a forum where family of current residents can answer questions about the facility — peer input
- 🟡 **Virtual tour support**: Some facilities offer virtual tours — surface these when available so caregivers can pre-screen without traveling
- 🟡 **Medicaid application helper**: When a caregiver shortlists a facility and budget estimator shows private-pay runway ending, proactively suggest Medicaid spend-down planning
- 🟢 **Move-in logistics kit**: After a caregiver selects a facility, unlock a move-in kit: what to label, medication transfer protocol, first-week visit schedule, how to talk to staff

---

## 8. Money & Coverage

### What's working
- **Coverage overview as a vertical list with Active / Review / Expires badges** — scannable at a glance
- **Medicare Open Enrollment banner** with specific dates is the kind of proactive reminder most caregivers miss
- **Cost estimator with concrete numbers** — "4.2 yrs private pay runway · $58K/yr" — decision-grade
- **Benefits Finder** surfaces things families don't know to look for (VA Aid & Attendance, Extra Help, PACE)
- **Quick Guides** (Medicare, LTC, Caregiver tax, Medicaid navigator) is a helpful library

### Concerns

**🔴 Name inconsistency**: "Coverage Overview — Dorothy" on Harold's page

**🟡 "Likely eligible" / "Check eligibility" / "Explore" badges on benefits** use different language for similar concepts:
- "Likely eligible" — system believes user qualifies
- "Check eligibility" — need to run a screener
- "Explore" — info / no clear eligibility signal

Users can't instantly tell which means "take action" vs "just browse."

**🟡 Cost projection chart is a placeholder** ("Cost projection chart (private pay runway)") — what will this actually show? Users might expect a line chart over years, a pie chart of expense categories, or a bar comparison. Without mockup, it's hard to evaluate if the chart adds clarity or just complexity.

**🟡 "If Dorothy moves to assisted living…"** is a scenario but there's no scenario selector visible. Can users pick different scenarios (memory care, skilled nursing, in-home)? Or is assisted living the only one calculated?

**🟡 No "This is not financial advice" disclaimer visible**: Given this module includes dollar amounts and runway calculations, the compliance warning needs to be prominent on-page, not buried in fine print.

**🟡 LTC insurance "Expires Jun 30, 2026"** — if today is April 21, 2026, that's 70 days. But there's no countdown urgency — just a yellow "Review" chip. This is the highest-stakes financial alert in the product (per the breakdown doc). Should be visually louder.

### Suggestions
- Standardize benefit eligibility badges: 
  - ✅ Likely eligible — actionable
  - ⚙️ Check eligibility — screener available
  - 📖 Learn more — info only
- Mock up the cost projection chart before build — decide whether a chart adds value vs. just a "N years of runway at $X/month" text
- Add a scenario selector: "If [Harold] moves to [Assisted living ▼]..." — dropdown to change the scenario
- Add a prominent disclaimer near the Cost Estimator: "Estimates only — not financial advice. Consult a financial advisor for decisions."
- Escalate the LTC warning: Full-width banner at top of Money & Coverage when expiry is within 90 days: "⚠ LTC Insurance expires in 70 days — review renewal options"

### Open questions
- How does the user add a new coverage type (e.g., a new Medigap plan change)?
- Is the LTC benefit amount ($58K/yr cost vs. what the LTC covers) calculated from the policy document? From user input?
- Who sees Money & Coverage — all roles? Just Admin?
- What's the PACE eligibility screener — how many questions?

### Differentiator ideas
- 🟡 **Benefit auto-enrollment reminders**: "You qualify for Medicare Extra Help — the enrollment window is [dates]. Want a reminder to apply?" — drives users to actually get benefits they qualify for
- 🟡 **Joint-finances view for couples**: When care recipient has a spouse, show combined assets/runway (if they've linked accounts)
- 🟡 **Medicaid 5-year lookback calculator**: If a family is considering spend-down for Medicaid, helper showing what counts as a disqualifying transfer and when the lookback clock started
- 🟡 **"What if..." scenarios**: A sandbox where users can play with scenarios: "What if Mom lives another 5 years in assisted living?" "What if we bring her home?" — plan comparison
- 🟢 **Integration with financial planners**: Export a summary for the family's financial advisor; one-click secure share

---

## 9. My Aging Plan (Caregiver's own)

### What's working
- **"Plan for Yourself"** positioning is excellent — frames this as self-care, not morbid
- **"Build your own aging plan before someone else has to do it for you"** copy is direct and motivating
- **Clear progress indicator** for each plan section
- **Advance Directive Builder with state-specific template** is concrete value
- **Wishes Journal section** for non-clinical preferences (music, food, routines) is emotionally meaningful
- **"Talk to your family now" conversation guide** panel — nudges the hardest action

### Concerns

**🟡 "Your aging plan is 40% complete" as a progress bar**: Same concern as Home Hub progress bar — progress to 100% implies completion, but a "done" end-of-life plan is still a plan about death. The framing may feel off. Compare with how some peer tools frame it ("Your plan is getting stronger" or "You've addressed the essentials").

**🟡 Progress calculation is opaque**: 40% for what? A mandatory-section completion? An average across all sections? If a user finishes the Legal section fully (100%), does overall jump to 20%? Transparency matters because users will dispute the number.

**🟡 Advance Directive Builder state**: "Illinois template" is pre-selected — but how did the system determine Illinois? User profile? And what if they moved? No state selector visible.

**🟡 Wishes Journal says "Journal entry area"** as a placeholder — what prompts does the user get? A blank textarea is intimidating for this type of content. Good journaling prompts are a huge value-add.

**🟡 Section completions vary wildly** (Legal 60%, Care 80%, Financial 20%, Conversation 0%, Wishes 50%) — but there's no indicator of which sections the user should do next. "Continue building my plan →" is generic; a "Next: start a conversation" would be directive.

### Suggestions
- Reframe progress: "Your plan has 12 of 20 essentials covered" (fraction) or "Your plan is strong in Legal and Care; starting on Financial next is a natural step" (narrative)
- Explain progress calculation on hover: "Progress weighted by section: Legal 30%, Care 25%, Financial 20%, Conversation 15%, Wishes 10%"
- State selector for Advance Directive: default to user profile state but allow override
- Provide journaling prompts — rotating on each visit — "What's a song you'd want playing in your final days?" or "Describe a perfect Sunday morning"
- Suggest next best action: "Your next step: spend 10 minutes on Conversation Guide" (contextual)

### Open questions
- What happens after the plan is "100%"? Does the app keep nudging updates (life events — marriage, new child, move)?
- Is the plan shareable with family? Fully private by default (per DB design) — but can users opt-in to share specific sections?
- When caregiver becomes care-recipient (they develop a condition), does the plan migrate? (Per Phase 2 two-record model)
- Does the Wishes Journal allow photos, voice memos?

### Differentiator ideas
- 🟡 **Partner / couple mode**: Invite spouse to build plans together — compare answers, discuss differences
- 🟡 **Plan anniversary ritual**: Once a year, "Let's review your plan together" — prompts to update for life changes
- 🟡 **"Plans I've started for my parents" mirror**: Show plans the user has started for parents alongside their own — reinforces "do for yourself what you're doing for them"
- 🟡 **Voice journaling**: Record a 1-minute voice memo about a wish or preference — preserves the person's actual voice for family later (emotionally powerful)
- 🟡 **Legacy letters templates**: "Letter to my grandchildren" / "Letter to my spouse on my death" — guided, optional writing prompts that become part of the plan
- 🟢 **Plan partial-handoff on death**: If something happens to the user, their family gets a guided walkthrough of the plan — "Margaret wanted you to know..."

---

## 10. Family Workspace

### What's working
- **Stats row** (3 Members · 4 Open tasks · 28 Care log entries last 30 days) — snapshot of collaboration health
- **Family Members list with role badges + location** — quick context for who does what
- **"+ Invite family member"** as a dotted bordered CTA
- **Permission Levels table** is transparent about what each role can do
- **Shared Care Log with author + category tags** — great family communication thread
- **Task Board with assignee + due date + priority** — practical
- **"Generate family meeting agenda"** CTA — high-value AI workflow

### Concerns

**🟡 Permission Levels table is helpful but heavy**: For a new user, it's a 7-row matrix of check marks. It's the right information but wrong placement — users see it every time they visit Family Workspace. Better as a modal/expandable.

**🟡 Care log entries show author but not visibility**: Same concern as Document Vault — who sees what isn't obvious. Can a Viewer see a care log entry about a family argument that Sarah wanted kept private?

**🟡 Care log entries are tagged but tags are applied inconsistently**: "Cognitive," "Nutrition," "Medical" — but per decision, the full taxonomy is 8 categories (Cognitive, Medical, Physical, Nutritional, Social, Financial, Behavioral, Legal/Administrative). Wireframes show fewer.

**🟡 Task Board is flat list (no columns)**: Decision mentions "task board" which implies Kanban, but wireframe shows list view. Either is valid but should be intentional.

**🟡 "28 Care log entries last 30 days"** — active, good. But what about 3-month or 6-month views for longer-term patterns?

**🟡 No indicator of task overdue state**: Apr 22 due date on a task created Apr 18 — today is Apr 22. But no "Due today" or "Overdue" indicator in the wireframe.

**🟡 "→ Mark" assignee on tasks** — the arrow prefix is informal. "Assigned to Mark" or just "Mark" is clearer.

### Suggestions
- Collapse Permission Levels table into an info button or modal: "ℹ️ What can each role do?" — keep the detail, remove the visual weight
- Add visibility selector on care log entries — "Visible to: All members | Admins only"
- Show the full 8-category taxonomy in the care log add-entry flow; surface all 8 in filter chips
- Add task board view toggle: List | Columns (Kanban: To Do / In Progress / Done)
- Add time-range filter to care log: 7 days | 30 days | 3 months | All
- Highlight overdue tasks (red border) and today-due tasks (yellow border)
- Replace "→ Mark" with just "Mark" or "Assigned to Mark"

### Open questions
- Can users tag other family members in care log entries? (@Amy — "Did you see this?")
- Can care log entries be edited after creation? (For typos vs. audit integrity)
- How are care log entries notified — email? Push? Nothing?
- Can tasks be recurring ("Call cardiologist every 3 months")?
- When a care recipient has a hospitalization, is there a "hospital mode" — a focused view during a stressful period?

### Differentiator ideas
- 🟡 **Shift handoff view**: Two adult siblings sharing care can do "handoff notes" — "Here's what happened yesterday, here's what's pending today" — like a nursing shift change
- 🟡 **Family agreement doc**: An artifact built collaboratively — "How we're splitting care responsibilities this year" — reduces family conflict
- 🟡 **Sentiment-aware care log**: Gentle tag suggestions based on entry content: "This entry sounds tough — would you like to talk to someone?" — routes to caregiver support
- 🟢 **Video + voice care log entries**: Not just text — capture a 30-second video of dad on a good day
- 🟢 **Auto-agenda generator**: Beyond "family meeting agenda" — generate pre-read briefs from recent care log entries before big decisions (moving to memory care, hospice, etc.)

---

## 11. AI Assistant

### What's working
- **Contextual introduction** — "Plain-English answers, personalized to [Name]'s situation" sets appropriate expectations
- **Suggested question chips** are specific and feel curated from the care record context
- **Response quality in example** is excellent — references uploaded documents by name/date, gives nuanced answers (Sertraline flagged but "doesn't mean she should stop"), recommends concrete next steps (ask Dr. Park)
- **Proactive nudge** ("Medicare OEP in 180 days...") is the dream experience — system anticipates user needs
- **"Yes, prep it"** inline confirmation keeps the nudge lightweight

### Concerns

**🔴 Name inconsistency** — "personalized to Dorothy's situation"

**🟡 AI answer about POA says "This POA is durable, meaning it remains in effect if Dorothy becomes incapacitated"** — this is a legal interpretation. AI should NEVER make binding legal interpretations. The response should be framed: "Based on the POA document, it appears to be durable (it has language indicating it remains effective if Dorothy becomes incapacitated). To confirm this legally, review with an attorney."

**🟡 "You should ask your attorney: whether this POA covers digital accounts"** — follow-up question is good, but framed as AI instruction to user. Softer: "One thing worth confirming with an attorney: whether this POA covers digital accounts."

**🟡 Proactive nudges could become noise**: One proactive nudge per session is tolerable. 3-5 per session is spam. Need rate limiting on nudges.

**🟡 No indication of AI limitations upfront**: First-time users won't know the AI can't (a) give legal advice, (b) give medical diagnoses, (c) access things NOT uploaded. A single-sentence ground rule at the top of the AI page would help: "I work from documents and data you've shared — I'm not a lawyer or doctor."

**🟡 No way to flag a bad response**: Users will sometimes get unhelpful or wrong answers. Feedback mechanism ("Was this helpful? 👍 👎") enables learning and quality control.

**🟡 Chat history disappears off-screen on mobile**: No obvious way to scroll back to a previous answer or reopen a prior conversation thread.

### Suggestions
- Add a compact "AI ground rules" line at the top: "I work from what you've shared. I'm not a lawyer, doctor, or financial advisor — always double-check big decisions with a professional."
- Soften legal/medical language to "It appears..." / "Based on the document..." — never "It is..."
- Rate-limit proactive nudges (max 1 per session, max 3 per week)
- Add thumbs up / thumbs down on each AI response
- Persist conversation history — left rail on web, pull-up drawer on mobile
- Add "Export this conversation" as a PDF — useful for taking to a doctor visit

### Open questions
- Does the AI always stay in one conversation, or can users create named conversations ("Thread: Planning the move to memory care")?
- How is follow-up context handled — if I ask "tell me more about hospice," does it know I meant "for Ruth"?
- When documents change (new upload, revision), does the AI's answer become stale? Does it re-check?
- Does the AI respond to care log entries — e.g., if a caregiver logs "Harold fell this morning," does the AI proactively surface fall-prevention resources?

### Differentiator ideas
- 🟡 **"Prep me for X" workflows**: Not just ask-a-question but structured workflows:
  - "Prep me for Harold's cardiology appointment"
  - "Prep me for the Medicare enrollment call"
  - "Prep me for the conversation with Mom about driving"
  Each one surfaces relevant context + suggests questions to ask
- 🟡 **AI-generated care summary for new family members**: "My sister just joined — can you generate a 3-paragraph summary of where things are?"
- 🟡 **Document Q&A directly from uploads**: "What does page 3 of the POA say about selling the house?" — semantic search over the user's own documents
- 🟡 **Red flag monitoring**: AI flags concerning patterns without being asked — "Mom's care log has 4 mentions of confusion in the last 2 weeks, up from 1 the month before. Worth talking to Dr. Chen?"
- 🟢 **Voice input for mobile AI**: Caregiver driving to mom's house, speaks question; AI reads answer back

---

## 12. Mobile — General Observations

### What's working
- **Consistent branding** — same warm cream, terracotta accent, serif headings
- **Clean stacking of stats + sections** — good use of mobile vertical space
- **Hamburger menu drawer** correctly shows "VIEWING CARE RECORD FOR [Name]" with Switch option + full nav — excellent information architecture
- **Back to Home** at the bottom of the drawer — always-available escape
- **Bottom safe area indicator** shown on iOS patterns

### Concerns

**🔴 Mobile Alerts & Tasks only shows Act + Snooze, NOT Dismiss** (web page 9 vs. mobile page 3). Parity gap.

**🟡 Mobile Care Record NEEDS ATTENTION rows have no visible Act button** — unclear if row is tappable to act, or if actions are behind a long-press. Should show Act button inline on mobile too.

**🟡 Mobile Document Vault shows no upload progress / recent uploads panel** — on web, Recent Documents is a key surface. Mobile omits it.

**🟡 Mobile Stage Navigator omits "What's Coming in Stage N"** — important forward-looking info missing on mobile.

**🟡 Mobile Care Finder has no filter UI at all** — just "Search more facilities." On mobile, filters are MORE important because screen real estate is tight; users need to narrow fast.

**🟡 Mobile Quick Actions on Home** (Emergency, Share, Ask AI) — three prominent buttons. Emergency is still prominent red.

**🟡 Mobile Family Workspace** stats compress to "Members · Tasks · Log entries" dropping "last 30 days" context.

### Suggestions
- Add Dismiss to mobile Alerts UI
- Show Act button on care record alert rows (even if small)
- Include Recent Documents on mobile Document Vault (can be collapsed by default)
- Show "What's Coming" on mobile Stage Navigator (in a collapsed card)
- Add filter button to mobile Care Finder
- Consider turning Emergency Share into an icon + label (de-emphasize color until actual emergency)
- Keep "last 30 days" context on all stats rows — needed for meaning

### Open questions
- Is there a bottom nav bar on mobile (not shown in wireframes)? Or only hamburger? Bottom tab bar for top-level nav is usually more thumb-friendly on mobile.
- How does mobile handle landscape orientation?
- Are the wireframes sized for a specific device? iPhone 14 Pro? Need to confirm safe areas match.
- What about tablet — does the product work on iPad? (Responsive between mobile and desktop?)

### Differentiator ideas
- 🟡 **Apple Watch / widgets**: Surface today's top alert on watch face — quick glance, zero-friction
- 🟡 **Siri shortcuts**: "Hey Siri, add a care log entry" — voice-first quick capture
- 🟡 **Family member presence indicator**: "Sarah is viewing Harold's record right now" — subtle collaborative awareness (LinkedIn-style)
- 🟢 **Mobile-only "photo capture → document" flow**: Point phone at a paper document, OCR suggests a category, upload in one tap

---

## 13. Cross-Cutting Content & Copy

### Concerns
- Throughout, copy oscillates between formal ("Build your own aging plan before someone else has to do it for you") and casual ("You're all caught up" implied but not shown). Establish a single voice.
- Emojis are used inconsistently — some section labels have them (🎯Care Plans), some don't. Make it deliberate (either all primary module headers have emojis, or none do).
- "You" vs. "[Name]" ambiguity — some screens say "your care record" (speaks to caregiver as the subject), others say "Harold's Care Record" (care recipient as subject). Pick one voice and commit.

### Suggestions
- Develop a voice and tone guide. Hearth's voice should probably be: warm, direct, not patronizing, emotionally aware, never clinical. "Don't sugar-coat death. Don't be clinical about love."
- Standardize on "[Name]'s Care Record" framing — third-person keeps distance where appropriate and maps to the "one family member managing multiple care recipients" model

---

## 14. Accessibility

### Concerns
- **Warm cream background with terracotta text** — need to confirm WCAG AA contrast. Some of the lighter text on cream might fail.
- **Emoji-first section headers** may not have meaningful alt text for screen readers. "🎯Plan for Yourself" read as "dart emoji Plan for Yourself" is awkward.
- **No visible focus states** in the wireframes — important for keyboard navigation.
- **Small chip text** (e.g., "Stage 2-3" tags) may be below accessible minimum size.
- **Color as primary signal** for urgency (red border for urgent, yellow for actions) — need text-based backup for colorblind users.

### Suggestions
- Run every screen through axe DevTools / WAVE during design handoff
- Use icon + color + text for severity (e.g., ⚠ + red + "Urgent" text)
- Provide meaningful alt text for module icons (skip emojis in screen-reader output)
- Confirm minimum touch target of 44×44pt on mobile (some icon buttons may be smaller)
- Design focus states before build, not after

---

## 15. Differentiator / Future Features Portfolio

Consolidated list of ideas that could meaningfully differentiate Hearth from competitors. Ranked by impact × feasibility.

### High-impact / reasonable feasibility
1. **"Prep me for X" workflows in AI Assistant** — Structured prep for appointments, calls, conversations. Huge caregiver value, natural AI use case.
2. **Pill appearance photos in Health Hub** — Prevents dangerous mix-ups. Data from FDA.
3. **Sibling/partner collaboration features** — Handoff notes, family agreement doc, shift changes. No competitor does this well.
4. **Voice journaling in Wishes Journal** — Preserves actual voice for posterity. Emotionally powerful. Uses device mic.
5. **Stage change announcement generator** — Automates the hardest family communication. Huge relief when stage transitions happen.
6. **Caregiver wellness check** — Weekly opt-in self-reflection. Underserved category. Routes to support resources.
7. **Event-triggered insights** — "Just got home from hospital? Let's reconcile medications" — meets users at key moments.

### Medium-impact / medium feasibility
8. **Decision journal** — Log rationale for tough decisions. Useful for sibling disagreements, future decisions.
9. **Legacy letters templates** — Guided writing prompts. Strong engagement driver.
10. **Facility peer Q&A** — Ask questions of current residents' families. Network effect.
11. **Anniversary / memorial awareness** — Honor important dates in-app. Emotional continuity.
12. **Smart expiration suggestions** — Non-AI rules for common document lifespans.
13. **Plan anniversary ritual** — Annual review prompts for own plan.
14. **Document request templates** — Pre-written remind-Dorothy emails for common docs.
15. **Symptom log → appointment prep** — Capture between visits, surface to doctor.

### Long-term / higher effort
16. **Peer community at-stage** — Moderated forum of similarly-staged caregivers. Phase 3.
17. **Voice mode for older users** — For care recipients' eventual use.
18. **Apple Watch / widgets** — Quick alert glance.
19. **Siri shortcuts** — Voice-first quick capture.
20. **Virtual tour support for facilities** — Link to facility video tours.
21. **Medicaid 5-year lookback calculator** — Huge niche value for families heading to spend-down.
22. **Partner/couple mode for aging plan** — Shared spouse planning.
23. **Red flag monitoring via AI** — Pattern detection across care log entries.
24. **Integration with financial planners** — Secure export for family's advisor.

---

## 16. Priority Recommendations — Fix Before Beta

1. 🔴 **Remove all "Auto-categorized by AI" copy and AI ✨ badges** from Document Vault (web and mobile).
2. 🔴 **Resolve name inconsistencies**: Lock one canonical test persona per wireframe; every reference (breadcrumb, body copy, scenarios) must match.
3. 🔴 **Clarify Warning Signs section on Stage Navigator**: Reference list vs. observed log must be visually distinct.
4. 🔴 **Fix the Alerts & Tasks parity gap on mobile** — add Dismiss button.
5. 🔴 **Align Care Finder recommendations to actual care stage** — Stage 4 doesn't recommend in-home companion.
6. 🟡 **Revisit the stage progression bar** on home cards for emotional sensitivity.
7. 🟡 **Clarify relationship between Care Record "Needs Attention" and Alerts & Tasks module** — link between them.
8. 🟡 **Define AI ground rules** — single-sentence disclaimer on AI Assistant page.
9. 🟡 **Standardize module tile stats** — one number + one qualifier per tile.
10. 🟡 **Add visibility indicator** on documents and care log entries.

---

## 17. Longer-Term Watchlist

- Design partner feedback will surface things this review can't (emotional reactions, language that doesn't translate across demographics, workflows that look logical but don't fit real lives).
- Stress-test with a real caregiver who has recently lost a parent — they'll name pain points this review misses.
- Revisit every "percentage complete" metric — they may all need reframing.
- Explore tablet / iPad as a first-class form factor (many caregivers would use iPad at kitchen table).
- Consider dark mode early — caregivers often use the app late at night.

---

## Appendix — Reviewer Notes

This review is a first pass based on wireframes only. Several areas can't be evaluated without mockups (mid-fidelity) or prototypes (interactions):
- Actual information density at real data volumes (20+ care recipients, 100+ documents)
- Scroll/pagination behavior
- Interactive states (hover, active, loading, error, empty)
- Animations and micro-interactions
- Actual typography rendering at target sizes
- Color accessibility at final implementation

Many concerns raised here should be revisited after the first prototype is clickable.
