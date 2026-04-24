# Hearth — PM Product Breakdown from Design

**Date:** April 20, 2026
**Source:** Design screenshots 1–10 (home dashboard, two care records, family vault + full module interiors: Health Hub, Stage Navigator, Care Finder, Money & Coverage, My Aging Plan, Family Workspace collaboration)
**Framing:** How a PM would break down the work upon receiving these designs, working backward from what the screens show.
**Update note (April 20, second review):** Six additional screenshots showing full module interiors were reviewed and incorporated. Epics 6, 7, 9, 10, 11, and 12 have been substantially updated based on what is now visible.

---

## Reading the Designs: What's the Core Job?

The four screens tell a clear story before you read a single spec doc.

**Primary user:** Margaret. Adult daughter-in-law, 65, managing two aging in-laws simultaneously — Harold (Father-in-law, 89, Stage 4: Advanced Care) and Ruth (Mother-in-law, 97, Stage 5: End of Life). She is not a healthcare professional. She is a family member doing this alongside the rest of her life.

**Her core job-to-be-done:** "Don't let anything fall through the cracks when my in-laws' situation is complex and moving fast."

The designs reveal three layers of that job:

1. **Status at a glance** — "What needs my attention right now, for whom?"
2. **Documents in order** — "When something happens, I can find what I need immediately."
3. **Ready for the unexpected** — "When there's a crisis, I can get the right information to the right people instantly."

Everything else in the designs (Health Hub, Stage Navigator, AI, Care Finder, My Aging Plan) is secondary to these three. A PM should prioritize around them accordingly.

---

## Epics and Feature Breakdown

### Epic 1: Shell & Navigation

The navigation has a subtle but important behavior visible across screenshots: it is **context-sensitive**.

- **Global state** (Home dashboard, Screenshot 1): 3-item sidebar — Home, Family Workspace, AI Assistant. Simple. Not care-recipient-specific.
- **Per-recipient state** (Care record pages, Screenshots 2–3): 7-item sidebar — Overview, Family Vault, Health Hub, Care Finder, Money & Coverage, Stage Navigator, Family Workspace, AI Assistant — plus the care recipient's name and stage pinned at the bottom.

This is the app's core mental model: you have a global space (manage your household of people you're caring for) and a per-recipient space (manage one person's care in depth). The navigation communicates which mode you're in.

**User stories:**

- As a caregiver, I see a simple navigation when I'm on the home dashboard so the app doesn't feel overwhelming when I just want an overview.
- As a caregiver, when I open a care record, the navigation expands to show all modules available for that person so I can quickly jump between their care areas.
- As a caregiver, I see who I'm currently viewing (name + care stage) pinned in the sidebar so I never lose track of which person's data I'm looking at.
- As a caregiver on mobile, I can navigate the app from a bottom tab bar or hamburger menu so the sidebar doesn't consume my screen space.

**What the design implies but doesn't show:**

- How do you switch between care recipients without going back to Home? (The sidebar shows Harold/Ruth pinned at the bottom — presumably tapping it shows a switcher) --> DESIGN NOTE: Clicking the profile on the sidebar to show a switcher / dropdown
- What happens to the sidebar state when you navigate from Harold's record to Ruth's record directly? --> DESIGN NOTE: The state of the sidebar should just reflect the role / permissions the user has for the elder. So if they don't have access to the money module, they shouldn't see it. The content of the modules should change to Ruth in this case.

**Priority: Must-have.** The entire app information architecture rests on this. Sprint 1 cannot ship without it.

---

### Epic 2: Home Dashboard

Screenshot 1 is the landing page after login. It has three distinct sections:

**2a. Quick Actions row**
Four CTAs: Emergency share packet (red/prominent), Share care summary, Family meeting agenda, Ask AI Assistant.

- As a caregiver, I can generate an emergency share packet from the home screen so I can act immediately in a crisis without navigating into a specific care record.
- As a caregiver, I can share a care summary for any care recipient so I can brief a doctor, family member, or care facility quickly.
- As a caregiver, I can generate a family meeting agenda so I can structure a call with siblings or other family members involved in care.
- As a caregiver, I can open the AI assistant from the home screen so I don't have to navigate to a specific person's record first.

**What the design implies but doesn't show:**

- "Emergency share packet" from the home level — when there are two care recipients, which one does it generate for? Does it prompt you to choose? --> DESIGN NOTE: Yes, click and it's a dropdown with either checkboxes to click multiple, and maybe an "all" option. Then options for how to share (email, SMS, download)
- "Share care summary" and "Family meeting agenda" — are these AI-generated, pre-templated, or dynamic? None of the designs show the output. --> DESIGN NOTE: share care summary should be template w/dynamic data

**2b. "People I'm Caring For" cards**

Each card shows: avatar/emoji, name, relationship, age, care stage badge, up to 3 alert items, stats row (Medications / Docs on file / Providers), and "Open care record →" link.

- As a caregiver, I see all the people I'm caring for on one screen so I can get a status snapshot without opening individual records.
- As a caregiver, I see the most urgent alerts for each person on their card so I know immediately who needs attention.
- As a caregiver, I see key stats (medications, docs, providers) on each card so I can assess completeness at a glance.
- As a caregiver, I can click through to a person's full care record from their card.
- As a caregiver, I can add a new care recipient from the home dashboard so I can start tracking someone new.

**What the design implies but doesn't show:**

- What does the home screen look like with zero care recipients? (Empty state + CTA to add first person) --> DESIGN NOTE: button/widget in center called "add new care recipient" or "import new care recipient" (for this - if the care recipient already created a profile and filled out their "aging plan", want to make sure the caregiver can add them even if a link or invite expired, alternatively, could show invites there as well)
- What does it look like with one? With five? --> DESIGN NOTE: Shows max 3 across, on mobile would just show 1 and can vertically scroll.
- How are the "up to 3 alerts" selected — most recent? Most critical? This determines the alert prioritization logic. --> DESIGN NOTE: Mark this as NEEDS DECISION, we need to determine how we attribute criticality. I think this also raises the question of having a separate alerts page - I think ultimately we need 1 module that is just to-dos and alerts. Maybe instead we can show banner with "10 alerts for Ruth or 10 actions needed for Ruth" and they can click to go to alerts page, with it filtered by Ruth's specific alerts. Same for Harold. Give me some ideas, but more brainstorming and mocks probably needed for this.
- The stats row shows "Medications / Docs on file / Providers" — in beta, without Health Hub, the medication and provider counts will be 0 or hidden. What's the empty state for a stats row with no data? --> DESIGN NOTE: If it's not available at all, we should hide. If it's available with limited features, we should show a little beta / new tag.

**2c. "My Own Aging Plan" section**

Shows Margaret's own planning checklist — advance directive, Financial POA, Healthcare proxy, Wishes journal — with checkboxes indicating completion.

- As a caregiver, I see a prompt to work on my own aging plan so the app reminds me that I have my own planning to do, not just my parents'.
- As a caregiver, I can see which items in my own plan I've completed so I know what's still outstanding.

**What the design implies but doesn't show:**

- What happens when you click "Continue building my plan →"? Wizard? Full-page editor?
- Who stores the plan documents — in the same vault as the care recipients, or in a separate personal vault?

**Priority: 2a (Emergency share packet stub) and 2b are Must-have for beta. 2c is a teaser/locked state for beta.**

---

### Epic 3: Care Record (Per-Recipient Hub)

Screenshots 2 and 3 show the individual care record for Harold and Ruth. This is the central hub for a single care recipient — everything about that person lives here.

**3a. Care record header**
Name, relationship, age, care stage badge visible in breadcrumb and in the page header.

- As a caregiver, I see the care recipient's name, relationship to me, age, and current care stage at the top of every care record page so I'm always oriented.
- As a caregiver, the care stage badge is color-coded and descriptive (not just "Stage 4" but "Stage 4: Advanced Care") so I know what that means at a glance.

**3b. NEEDS ATTENTION section**
Three alert cards, each with an icon and a short action description. Cards appear to be prioritized (most urgent first). Each has a distinct icon category — medical (pill), document (paper), calendar (appointment).

- As a caregiver, I see the most urgent items for this person in one section so I know exactly what to do next for them.
- As a caregiver, each alert tells me what type of issue it is (medical, document, appointment) via an icon so I can quickly assess the nature of the problem.
- As a caregiver, I can tap an alert to navigate directly to the relevant module or action so I don't have to hunt for where to address it.

**What the design implies but doesn't show:**

- How many alerts can appear? Is there a "Show more" at 3+? --> DESIGN NOTE: Show top 3, with 'View more' doing a dropdown or taking you to alerts page (see notes on alerts page above)
- What generates each alert? (Document-based: "POLST form not on file" — checklist logic. Medication-based: "2 medications need reconciliation" — Health Hub logic. Appointment-based: "Memory care tour scheduled May 2" — appointment model. Family-based: "Family meeting recommended" — what rule triggers this?) --> DESIGN NOTE: Needs decision / design
- Can the caregiver dismiss/snooze an alert? No dismiss action is visible in the design. --> DESIGN NOTE: caregiver can act, dismiss or snooze an alert

**3c. Quick Actions row**
Emergency share packet (red), Share care summary, Ask AI about [name]. These are the same as home-level CTAs but scoped to the specific person.

- As a caregiver, I can generate an emergency share packet for this specific person with one tap.
- As a caregiver, I can ask the AI specifically about this person from their care record.

**3d. Care Modules grid**
Five tiles: Family Vault, Health Hub, Care Finder, Money & Coverage, Stage Navigator. Each shows a contextual subtitle (e.g., "11 docs on file," "Stage 4 care options," "Insurance & benefits").

- As a caregiver, I can navigate to any care module for this person from their care record hub.
- As a caregiver, each module tile shows a summary stat or status so I can assess the state of each area without entering it.
- As a caregiver, modules that aren't yet available show a locked/coming-soon state so I understand the app's scope without confusion.

**What the design implies but doesn't show:**

- The "coming soon" state for Care Finder and Money & Coverage in beta — the design shows them as live tiles. A beta variant needs to be designed. --> DESIGN NOTE: Yes, "beta" or "new" and "coming soon" tags should be avaialble
- How many modules can there be? Are these five fixed, or can new ones appear? --> DESIGN NOTE: Always matches navigation and fixed for now - we want to make these kind of widgets though, so caregivers will be able to eventually maybe pull in their own modules (down the road wishlist item)

**Priority: 3a (header), 3c (quick actions), 3d (module grid with locked states) are Must-have for beta. 3b (alerts) is partially buildable in beta — document alerts only.**

---

### Epic 4: Family Vault --> DESIGN NOTE: I hate the name "Family Vault" - let's just call it "Documents"

Screenshot 4 is the most detailed design view. This is the richest feature set in the beta.

**4a. Stats row**
"14 Documents · 6 Categories · 2 Expiring soon within 30 days"

- As a caregiver, I see a document count, category count, and expiring-soon count at the top of the vault so I can assess the completeness and urgency of the document collection at a glance.

**4b. Missing document alert banner**
"Missing: Healthcare Proxy for Dorothy — This is a critical document. Add it now or invite Dorothy to upload it."
Two CTAs: "Upload now" and "Remind Dorothy."

- As a caregiver, I see a banner when a critical document is missing so I'm prompted to fill the gap before a crisis.
- As a caregiver, I can upload the missing document directly from the banner so I can resolve the gap immediately.
- As a caregiver, I can send a reminder to a specific person (Dorothy) to upload the document themselves so I can delegate the task when I don't have the document.
- As a caregiver, the banner tells me specifically which document is missing and who it concerns so I'm not left guessing what to do.

**What the design implies but doesn't show:**

- How does Dorothy get specified? Did the caregiver previously designate Dorothy as the person responsible for this document? Or is Dorothy a stored contact? --> DESIGN NOTE: The profile should designate Dorothy as the aging parent (need a better word for this). There should be a list of "recommended documents" that we can check against to see if they are uploaded.
- What does "Remind Dorothy" actually send? An email? An SMS? Does Dorothy need a Hearth account to respond? --> DESIGN NOTE: This needs more thought, I think the app needs a messaging system (no design for this yet, so add some ideas at the bottom for this type of feature) - but also, I think the option to send and email or SMS. But I don't want to force an elderly person to make a profile to access this information.
- Can the banner be dismissed? What happens if the caregiver doesn't have the document and can't contact Dorothy? --> DESIGN NOTE: Options to dismiss/snooze alert or remove as necessary doc
- Can there be more than one missing-document banner at a time? Or does it show one at a time (highest priority)? --> DESIGN NOTE: Maybe instead of multiple of these types of banners, we have 1 banner for "missing docs" with a list of the documents. User can click on "dismiss" "upload" or "notify aging parent"

**4c. Document categories**
Six named categories: Legal, Medical, Financial, Identity, Insurance, Care Plans. Each shows a doc count and a subtitle listing specific documents inside (e.g., "Will 2023 · Financial POA · Living Will").

- As a caregiver, my documents are organized into named categories so I can find what I need without searching.
- As a caregiver, I can see at a glance how many documents are in each category.
- As a caregiver, I can expand a category to see the individual document cards inside.
- As a caregiver, the Insurance category shows a warning indicator (⚠) when a document is expiring soon so I notice it without having to open the category.

**What the design implies but doesn't show:**

- Are categories collapsible (Screenshot 4 shows them all collapsed)? What does an expanded category look like? --> DESIGN NOTE: yea collapsible and expandable. When expanded shows all docs in that category.
- Can the caregiver add a document directly to a category (the "Care Plans" row shows "+ Add" inline)? --> DESIGN NOTE: yes, in the design it just shows # of docs after they have been added, but we want to keep the "add" button as well. Overall "Upload" document should pop out a drawer or something that has a form for things like "permissions" and "category" that they have to fill before uploading a document.
- Can the caregiver create a custom category, or are the six fixed? --> DESIGN NOTE: Start w/fixed and allow to create custom as a later development

**4d. Right panel — Upload area**
"Upload document — Auto-categorized by AI"

- As a caregiver, I can upload a document from the vault page directly.
- As a caregiver, I see that documents are auto-categorized by AI so I trust the system to sort my uploads correctly.
- As a caregiver, I can drag and drop documents on desktop or tap to pick on mobile.

**4e. Right panel — Recent Documents**
List: Mom's Will 2023.pdf, LTC Insurance Policy.pdf (⚠ Expires Jun 30), Medication List Apr 2026.pdf, Financial POA.pdf. Each shows who uploaded it (Sarah, You, Dorothy) and when.

- As a caregiver, I see recent uploads in a sidebar panel so I can track what's been added lately and by whom.
- As a caregiver, I see expiry warnings directly on document items in the recent list so I notice time-sensitive items immediately.
- As a caregiver, I see who uploaded each document so I know whether it was me, another family member, or an external contact.

**What the design implies but doesn't show:**

- "Sarah" and "Dorothy" uploaded documents — implying multi-user collaboration is working. These are non-owner uploaders. How did they get access? (Invite flow — implied but not shown in any screenshot.) --> DESIGN NOTES: invite to account, and if you're the admin, you can pick permissions / role. There is a question of who can delete documents, the aging parent maybe shouldn't be able to because they could accidentally delete something important. Maybe only the admin can delete.
- How many items appear in "Recent Documents"? Is it a fixed 5? Is there a "See all" link? --> DESIGN NOTE: Yes, should be able to see all documents in one place, maybe a new page with a filtering system and breadcrumb nav back to the documents module.

**4f. Right panel — Document Checklist Progress**
A checklist section visible at the bottom of Screenshot 4 (partially visible): "Will or Trust ✓" appears with more items below the fold.

- As a caregiver, I see a checklist of critical documents and which ones I've completed so I know the overall completeness of the vault.
- As a caregiver, completed checklist items are visually checked off so I get a sense of progress.
- As a caregiver, the checklist is contextual to the care recipient's stage so it shows the most relevant documents for their situation (a Stage 5 patient needs a POLST; a Stage 2 patient needs a Will and POA).

**Priority: All of 4a–4f are Must-have for beta. The checklist (4f) and expiry warnings (4c, 4e) are the smart features that differentiate Hearth from a plain file storage tool.**

---

### Epic 5: Emergency Share Packet

The most prominent single action in the entire design — a red button that appears in at least three places (home dashboard, care record, and implicitly inside the vault).

- As a caregiver, I can generate an emergency share packet for a care recipient with one tap so that in a crisis I can get critical information to a doctor, ER, or family member immediately.
- As a caregiver, the packet is available via a link that doesn't require the recipient to create an account so I can share it with anyone — a nurse, a sibling, an ER doctor.
- As a caregiver, the share link expires after 48 hours so sensitive health information isn't accessible indefinitely.
- As a caregiver, I see a confirmation modal with the link and a copy button so I can share it via text, email, or any channel I choose.
- As a caregiver, the unauthenticated recipient can view or download the packet without logging in.

**What the design implies but doesn't show:**

- What is in the packet? The design doesn't show the generated PDF. Implied contents based on what the vault and health hub track: care recipient name and info, key documents (Healthcare Proxy, POLST, Will, insurance), medications, allergies, emergency contacts, providers. This needs a content spec. --> DESIGN NOTE: Needs more design
- When there are two care recipients (Harold and Ruth), does the home-level Emergency Share Packet button ask which person it's for? --> DESIGN NOTE: Yes, dropdown w/checkboxes, same as the overview page
- Is there a "last generated" timestamp so the caregiver knows when it was last updated? --> DESIGN NOTE: last updated?

**Priority: Must-have for beta. This is the feature most likely to convince a first user that Hearth is worth adopting.**

---

### Epic 6: Health Hub

**[Updated after second screenshot review — full module interior now visible]**

The Health Hub interior shows a densely information-rich screen with four distinct subsections and clinical-grade logic that a PM must not underestimate.

**6a. Stats row**
"6 Medications · 3 Screenings due · 4 Providers · 1 Interaction flagged"

The interaction-flagged count is the most important number here. It is red and separated from the others. This is the stat the caregiver looks at first.

- As a caregiver, I see a top-line count of medications, screenings due, providers, and flagged interactions so I can assess health management status at a glance.
- As a caregiver, the interaction flag count is visually prominent so I cannot miss it when there's a drug interaction to address.

**6b. Medications list**
Visible medications: Lisinopril 10mg ("low refill" badge), Metformin 500mg, Atorvastatin 20mg, Sertraline 50mg ("Beers Criteria" badge), Amlodipine 5mg ("Interaction" badge), Vitamin D.

Two distinct clinical flags visible: **Beers Criteria** (medications identified as potentially inappropriate for older adults) and **Drug Interaction** (a specific pair flagged between medications). The "low refill" badge is a logistical alert, not a clinical one — a separate category of urgency.

- As a caregiver, I see all current medications in a single list so I can bring an accurate medication list to any appointment.
- As a caregiver, I see a "low refill" badge on medications running low so I know when to request a refill before we run out.
- As a caregiver, I see a Beers Criteria badge on medications flagged as potentially inappropriate for older adults so I know to raise them with the prescriber.
- As a caregiver, I see a Drug Interaction badge on medications with a known interaction so I can ask a pharmacist or doctor about it.
- As a caregiver, I can add, edit, or remove medications so the list stays current.

**What the design implies but doesn't show:**

- Tapping "Interaction" badge — does it expand to show which two drugs interact and why? Or link to a reference? The clinical explanation is likely required to be useful. --> DESIGN NOTE: I think it should say Interaction with an arrow (implying a click) and navigate below to the full explanation. OR it opens a modal or something with the explanation.
- Tapping "Beers Criteria" badge — same question. The flag is visible but the education content (why is this drug on the list, what are the risks for elderly patients) is invisible. --> DESIGN NOTE: Same thing as above
- Who is the data source for Beers Criteria and drug interaction detection? Is this a static database lookup or a third-party API? This is a significant technical decision with potential regulatory implications. --> DESIGN NOTE: Needs to be decided
- Can the caregiver add a note to a medication ("ask Dr. Park at June visit") or is the list purely data? --> DESIGN NOTE: Yes, caregiver should be able to add notes to a medication or maybe "add it to upcoming doctor visit list". This needs more thought / brainstorming. Should be able to delete or edit a medication as well. Is there an easier way to get medication info?
- What happens when a new medication is added — does the system automatically re-check interactions? Does it notify the caregiver? --> DESIGN NOTE: Yes, triggers recheck

**6c. Drug Interaction Alert**
A distinct alert card is visible below the medications list, calling out the specific interaction (Amlodipine + one other). This is separate from the badge on the medication row — it's a standalone warning.

- As a caregiver, I see a dedicated drug interaction alert with an explanation so I understand the nature of the concern, not just that a concern exists.
- As a caregiver, I can see which two drugs are interacting so I know exactly what to discuss with the prescriber.

**6d. Screening Schedule**
Visible screenings with status:

- Colonoscopy — Overdue (last done 2025, per the screenshot)
- DEXA scan — Due this year
- Mammogram — Due this year
- Eye exam — Due this year
- Blood pressure — Due this year
- HbA1c — Due this year

The "Overdue" status on the colonoscopy is the most urgent item in this section. The design is making a clinically-informed judgment that a colonoscopy overdue by a year is the most pressing screening gap.

- As a caregiver, I see all recommended screenings for my loved one in one list so I can plan medical appointments efficiently.
- As a caregiver, I see which screenings are overdue vs. due soon vs. current so I know where to focus first.
- As a caregiver, I can mark a screening as completed (with a date) so the list stays accurate after appointments.

**What the design implies but doesn't show:**

- What determines which screenings appear? Is this based on age and sex from the care recipient profile? Or does the caregiver manually add screenings? --> DESIGN NOTE: need to check
- The colonoscopy is marked "Overdue" with "last done 2025" — where does this last-done date come from? Manual entry? If so, when did the caregiver enter it? --> DESIGN NOTE: I think for now it would be manual input, but if there's a way to pull medical data like that into the app, that would be easier. However, we might run into issues with that.
- Are screening recommendations sourced from USPSTF guidelines or another body? This is important for accuracy and trust. --> DESIGN NOTE: need to check

**6e. Provider Directory**
Two providers visible: Dr. Carol Park, Dr. Lin Chen.

- As a caregiver, I can store my loved one's medical providers with contact information so I always know who to call and what they treat.
- As a caregiver, I can see providers organized by specialty so I can quickly find the right doctor for a specific concern.

**What the design implies but doesn't show:**

- The full card for each provider (specialty, phone number, practice name, last visit date, notes) is not visible. --> DESIGN NOTE: click to go to care card w/breadcrumbs OR alternatively make it expand with more information
- Is there a direct "call" or "message" action on the provider card? --> Should be, but not necessary - that's implying either we integrate w/the medical messaging system or they use our system. Or something else - design ideas?

**PM flag — clinical accuracy and liability:**
The Health Hub is the most liability-sensitive module in the product. Beers Criteria flags and drug interaction detection are clinically meaningful. If the data is wrong, stale, or misapplied, the consequences to a patient's health can be serious. Before building this module, the product needs:

1. A named, versioned clinical data source for both Beers Criteria and drug interactions.
2. A clear disclaimer that Hearth is an organizational tool, not a clinical decision support system.
3. A decision about whether this module requires a healthcare attorney review before launch.

**Priority: Post-beta, but the medication list (without clinical flags) should be considered for beta extension if Health Hub is unlocked in Sprint 9 as planned. The clinical flag logic (Beers, interactions) should only ship with proper data sourcing in place.**

---

### Epic 7: Stage Navigator --> DESIGN NOTE: I think this should be below "Documents". The Modules should be general to specific in their ordering

**[Updated after second screenshot review — full module interior now visible]**

The Stage Navigator interior is one of the most conceptually sophisticated screens in the product. It combines a clinical staging model with behavioral warning signs, conversation scaffolding, and anticipatory guidance — all in one module. This is also the screen most likely to make a caregiver feel seen and understood.

**7a. Stage Progress Bar**
A horizontal 5-stage progress bar across the top of the screen. Stage 2 is highlighted: **"Needs help with IADLs"** (Instrumental Activities of Daily Living). The other stages are visible but grayed.

The naming convention implies the 5 stages are:

- Stage 1: Independent Living
- Stage 2: Needs help with IADLs (cooking, cleaning, managing medications)
- Stage 3: [likely] Needs help with ADLs (bathing, dressing, mobility)
- Stage 4: Advanced Care
- Stage 5: End of Life

- As a caregiver, I can see which stage my loved one is in on a clear visual scale so I understand where they are in the overall care journey.
- As a caregiver, I can update the care stage when my loved one's condition changes so the app's guidance stays relevant.

**What the design implies but doesn't show:**

- Is stage set manually or recommended by the app? If the app infers it from warning signs (e.g., two recent falls → Stage 2 Physical indicator), it needs a recommendation engine. --> DESIGN NOTE: need to brainstorm more
- Can stage move backward? (A hospital stay recovery, for example.) The design implies forward progression only. --> DESIGN NOTE: not designed for small ups/downs but instead big life decisions.

**7b. Warning Signs panel**
Five warning sign categories with individual observations and a three-tier urgency rating (Monitor / See doctor / Act now):

| Domain      | Observation              | Urgency    |
| ----------- | ------------------------ | ---------- |
| Cognitive   | Forgetting conversations | Monitor    |
| Physical    | Two falls                | See doctor |
| Nutritional | Skipping meals           | Monitor    |
| Financial   | Unpaid bills             | Act now    |
| Social      | Withdrawing              | Monitor    |

The three-tier urgency system ("Monitor / See doctor / Act now") is a significant clinical design decision. "Act now" on an unpaid bills observation is an aggressive escalation. The design is making a judgment that financial warning signs are underweighted in caregiver awareness.

- As a caregiver, I can log warning signs I've observed in my loved one so I have a record to share with doctors.
- As a caregiver, each warning sign has a suggested urgency level so I know whether to monitor it, schedule an appointment, or take action immediately.
- As a caregiver, I can see warning signs across cognitive, physical, nutritional, financial, and social domains so I don't overlook non-medical changes.
- As a caregiver, warning signs I've logged appear in an organized list so I can track patterns over time.

**What the design implies but doesn't show:** --> DESIGN NOTE: This is all still in brainstorming phase. If you have recommendations on the design, please give them.

- Who enters warning signs — the caregiver manually? Or are some auto-generated from Health Hub data (two falls logged in Health Hub → "Two falls" appears in Stage Navigator)?
- How does the urgency recommendation work? Is it a static rule per observation type, or does it take the recipient's current stage into account?
- Is there a date/timestamp on each observation? The log aspect implies it, but it's not visible.
- Can the caregiver add a note to a warning sign observation?

**7c. Conversation Guides**
Four guides visible, each tagged with applicable stages:

- "Talking about driving" (Stage 2–3)
- "Discussing finances" (Stage 2)
- "Moving out of the home" (no stage tag visible)
- "End of life wishes" (no stage tag visible)

The stage tags are critical. They tell the caregiver that this content is relevant now, not just someday. "Talking about driving" at Stage 2 is timely — at Stage 4 it's too late.

- As a caregiver, I see conversation guides relevant to my loved one's current stage so I know which hard conversations to have now, before they become urgent.
- As a caregiver, each guide is tagged with the stage where it applies so I understand the window of opportunity.
- As a caregiver, I can click into a guide to get scripts, tips, and framing for the conversation so I feel prepared rather than dreading it.

**What the design implies but doesn't show:**

- The interior of any conversation guide — is it a short article? A branching script? A downloadable PDF? --> DESIGN NOTE: need to decide
- Are there more guides below the fold? The four visible may be the most stage-relevant, with others accessible via "View all." --> DESIGN NOTE: "View all" -> show full page ordered by stage and filterable.

**7d. "What's Coming in Stage 3" section**
A preview of what the next stage typically involves — anticipatory guidance for decisions the caregiver will face soon.

- As a caregiver, I can see what decisions and changes are typically associated with the next stage so I can start preparing before the transition happens.
- As a caregiver, anticipatory guidance reduces crisis decision-making by surfacing discussions I need to have now.

**7e. Normal vs. Concern grid**
A reference table distinguishing normal aging behaviors from concerning changes that warrant action.

- As a caregiver, I can reference a normal-vs-concern grid so I don't over-pathologize normal aging or miss genuinely concerning changes.
- As a caregiver, the grid is organized by domain (cognitive, physical, etc.) so I can quickly look up a specific type of observation.

**PM flag — content is the product here:**
The Stage Navigator is primarily a content product, not a software product. The conversation guides, warning sign definitions, stage descriptions, and normal-vs-concern grids are the feature. The engineering to display them is relatively simple. The PM must plan a content production track separate from engineering: who writes these guides, what clinical review process exists, and how do they stay current?

**PM flag — stage model accuracy:**
The 5-stage model is Hearth's own framework. If it doesn't map cleanly to frameworks caregivers and clinicians already know (FAST scale, CDR scale), it will create confusion in conversations between caregivers and medical providers. Consider whether to align Hearth stages to an established clinical scale or explicitly position the stage model as a caregiving language, not a medical diagnosis.

**Priority: The stage badge (name + color) is Must-have for beta. The Stage Navigator module interior — warning signs logging, conversation guides — is high-value post-beta and should be Sprint 12's collaboration priority.**

---

### Epic 8: AI Assistant --> DESIGN NOTE: This also needs more brainstorming / research

Appears in multiple contexts:

- Global "Ask AI" floating button (bottom-right, Screenshots 1 and 4)
- "Ask AI Assistant" in the home Quick Actions row
- "Ask AI about Harold / Ruth" in the care record Quick Actions
- "AI Assistant" in the global sidebar nav

This suggests the AI operates at two levels: a general assistant and a care-recipient-scoped assistant ("Ask AI about Harold" presumably has Harold's context loaded).

**User stories (inferred from placement):**

- As a caregiver, I can ask the AI a question from anywhere in the app using the floating button so I don't have to navigate to a specific page to get help.
- As a caregiver, when I ask the AI from a care record page, it already knows who I'm asking about so I don't have to repeat context.
- As a caregiver, I can ask the AI about documents in the vault (e.g., "What does this insurance policy cover?") so I can get answers without reading the full document.
- As a caregiver, I can ask the AI general caregiving questions so I can get guidance without searching the internet.

**What the design implies:**

- The AI FAB appears on the vault page (Screenshot 4) — suggesting document Q&A is a primary AI use case.
- "Ask AI about Harold" is a distinct entry point from generic AI, implying the UI has a way to scope the conversation to one person.

**Priority: Post-beta for the full interface. The FAB can be stubbed as "Coming soon" in beta — the icon should be present so the design partner sees the concept, but it doesn't need to work.**

---

### Epic 9: Care Finder

**[Updated after second screenshot review — full module interior now visible]**

The Care Finder interior is more useful than a simple facility directory. It is structured as a decision-support tool for the hardest practical question in eldercare: "What kind of care does my loved one need now, and what can we afford?"

**9a. Care Type Spectrum**
A horizontal spectrum showing five care settings with pricing ranges:

| Setting           | Price Range       | Status                      |
| ----------------- | ----------------- | --------------------------- |
| In-home companion | $1,500–$4,000/mo  | Recommended (badge visible) |
| Adult day program | $800–$2,000/mo    |                             |
| Assisted living   | $3,500–$7,000/mo  |                             |
| Memory care       | $5,000–$9,000/mo  |                             |
| Skilled nursing   | $7,000–$12,000/mo |                             |

The "Recommended" badge on in-home companion is the most significant design decision in this module. The app is making a recommendation based on care stage. For a Stage 2 ("Needs help with IADLs") recipient, an in-home companion is the appropriate starting point. This implies a recommendation engine, not just a display.

- As a caregiver, I see all care setting options on a spectrum from least to most intensive so I understand the full range of options.
- As a caregiver, I see price ranges for each setting so I can immediately sense whether a setting is financially feasible.
- As a caregiver, I see which care setting is recommended for my loved one's current stage so I have a starting point for research.

**What the design implies but doesn't show:**

- What determines the "Recommended" badge? Is it purely stage-based, or does it also factor in care recipient ADL status, proximity to family, or budget input? --> DESIGN NOTE: Need to decide
- The pricing ranges are national averages, presumably. Are they localized by geography? Eldercare costs vary enormously by metro area. --> DESIGN NOTE: localize by location / zip code
- Clicking on a care type — does it expand to explain what that care setting involves, what questions to ask, how to evaluate options? --> DESIGN NOTE: Yes, maybe open new page or pop out with more information

**9b. Facility Search**
A search/filter panel showing facilities within 10 miles. The UI suggests filtered results (location radius as the key filter parameter).

- As a caregiver, I can search for care facilities by proximity to my loved one's current address so I don't have to do a separate Google search.
- As a caregiver, I can filter by care type so I only see facilities appropriate to my loved one's needs.

**What the design implies but doesn't show:**

- What is the underlying data source for facilities? This is a significant data infrastructure decision — options include Google Places API, a licensed eldercare database (A Place for Mom, etc.), or manual curation. The data source determines quality, cost, and accuracy. --> DESIGN NOTE: Need to brainstorm / research. If you have ideas, let me know.
- Do facility listings show ratings, inspection history, or licensing status? Or just name and address? --> yes
- Is the 10-mile radius configurable? --> yes, by filter

**9c. Shortlist**
Two saved facilities visible:

- Sunrise Senior Living — $4,800/mo — "Saved"
- Oak Park Memory Care — $6,200/mo — "Medicaid accepted" badge — "Saved"

The "Medicaid accepted" badge is a high-signal data point. For many families, Medicaid eligibility is the determining factor in care setting. Displaying this prominently in the shortlist means the product understands cost reality in eldercare.

- As a caregiver, I can save facilities to a shortlist so I can track options I want to revisit.
- As a caregiver, I see the monthly cost on each shortlisted facility so I can compare affordability at a glance.
- As a caregiver, I see whether a facility accepts Medicaid so I know whether it's a viable option if private pay runs out.
- As a caregiver, I can compare shortlisted facilities against each other so I can make a more informed recommendation to family.

**What the design implies but doesn't show:**

- The compare flow — a "Compare" CTA is implied but the comparison view is not shown. Does comparison show a side-by-side table? Which attributes are compared? --> DESIGN NOTE: yes, shows side-by-side table. As many attributes as possible
- Is the shortlist per care recipient? If Sarah Johnson is managing Dorothy, her shortlist belongs to Dorothy's record, not her own account. --> DESIGN NOTE: correct

**9d. Share shortlist with siblings**
A CTA visible at the bottom of the screen: "Share shortlist with siblings."

- As a caregiver, I can share my facility shortlist with other family members so we can discuss options together.
- As a caregiver, the shared shortlist is viewable by family members without them needing to create an account, so I can include family members who aren't on Hearth.

**What the design implies but doesn't show:**

- How does sharing work mechanically? Link? Email? Is this the same share-link infrastructure as the Emergency Share Packet? --> DESIGN NOTE: email, text or in-app messaging?
- Do family members receive a static snapshot or a live view that updates as the caregiver adds/removes from the shortlist? --> DESIGN NOTE: If it's shared, it's a static snapshot, but if the others go into the app to view, they would see live or at least ~2 minutes updates

**PM flag — data sourcing is the product:**
The Care Finder is only as good as its facility data. A list of facilities with stale information, missing Medicaid status, or wrong contact info actively harms caregivers who rely on it to make real decisions. Before building this module, the PM must decide:

1. What is the facility data source and how often is it updated?
2. What is the licensing cost for that data?
3. What is the legal exposure if a facility listing is inaccurate?

**Priority: Phase 2. The tile should appear as locked with "Coming soon" in beta. Do not build until data sourcing is resolved.**

---

### Epic 10: Money & Coverage

**[Updated after second screenshot review — full module interior now visible]**

The Money & Coverage interior is the most practically powerful module in the product for families navigating eldercare financing. It combines three things caregivers desperately need: a coverage inventory, a financial runway calculator, and a benefits finder. No individual tool on the market does all three for an aging care recipient.

**10a. Coverage Overview**
A list of active insurance/coverage items:

- Medicare Part A
- Medicare Part B
- Medigap Plan G
- LTC (Long-Term Care) Insurance — ⚠ **Expires Jun 30** badge visible
- Medicare Part D

The LTC insurance expiry badge is the highest-urgency item in this section and possibly the highest-urgency alert in the entire product. LTC insurance lapsing without renewal or replacement can have six-figure financial consequences for a family.

- As a caregiver, I see all of my loved one's active coverage in one place so I have a complete picture of what's paid for.
- As a caregiver, I see expiry warnings on coverage items so I know when renewals are due before a lapse occurs.
- As a caregiver, I can add new coverage items and enter policy details so the inventory stays current.

**What the design implies but doesn't show:**

- Can the caregiver attach a policy document to a coverage item? (Linking to the Family Workspace vault would be the natural implementation.) --> DESIGN NOTE: yes
- What happens when coverage expires — does it become a "NEEDS ATTENTION" alert on the care record? --> DESIGN NOTE: yes, give options for what to do next
- How are Medicare Part A/B tracked — as informational entries (always-on federal coverage) or as items the caregiver actively manages? --> DESIGN NOTE: needs to be decided. Probably added by caregiver

**10b. Cost Estimator**
A highly specific calculation visible: **"If Dorothy moves to assisted living: 4.2 years private pay runway, $58,000/year."**

This is the most emotionally loaded feature in the entire product. It answers the question every caregiver is afraid to ask directly: "How long can we afford this?"

- As a caregiver, I can run a cost estimate for a specific care setting so I understand the financial timeline before committing to a decision.
- As a caregiver, I see the result as both a time runway and an annual cost so I can reason about it concretely.
- As a caregiver, I can change the care setting assumption and see how the runway changes so I can compare options.

**What the design implies but doesn't show:**

- What inputs drive the cost estimator? At minimum it needs: assets/savings (entered by caregiver), monthly income, LTC insurance benefit amount, and the care setting cost. None of the input screens are shown. --> DESIGN NOTE: need to decide, but those are good places to start
- Is this calculation done in-app (deterministic formula) or AI-generated? The result is very specific ($58K/yr, 4.2 years), suggesting a real calculation — not an AI estimate. --> DESIGN NOTE: need to decide / research
- Does the calculation account for LTC insurance coverage — i.e., LTC pays X per day, private pay covers the rest? --> DESIGN NOTE: need to decide
- What is the legal disclaimer on this estimate? "This is not financial advice" language is clearly required. --> DESIGN NOTE: will need something, probably consult legal rep when we get to this point
- Is the input data stored or ephemeral? If stored, the caregiver's financial data is in the product — significant privacy implications. --> DESIGN NOTE: need to consider

OVERALL DESIGN NOTE: For the cost calculator, I'm wondering if it would be better to add finances in the money modules, but show the cost calculator in the care finder page, and the person can click on the different options to see how the calculation changes?

**10c. Medicare OEP Alert**
A calendar alert visible for the Medicare Open Enrollment Period: **October 15 – December 7, 2026.**

- As a caregiver, I see a reminder when Medicare Open Enrollment is approaching so I don't miss the window to change plans.
- As a caregiver, the OEP reminder tells me exactly what the enrollment window is so I can plan accordingly.

**What the design implies but doesn't show:**

- Are these alerts hardcoded (Medicare OEP is always the same window each year) or configurable? --> DESIGN NOTE: hardcoded
- Are there other benefit enrollment windows that should appear? (Medigap enrollment windows, LTC renewal windows, etc.) --> DESIGN NOTE: yes

**10d. Benefits Finder**
One benefit visible in the screenshot: **VA Aid & Attendance** — a VA program that provides cash benefits to veterans or their surviving spouses who need help with daily activities.

- As a caregiver, I can see benefit programs my loved one may be eligible for so I can access financial support I didn't know existed.
- As a caregiver, I can see at a glance whether a benefit applies to my loved one's situation.
- As a caregiver, I can get guidance on how to apply for a benefit from within the app.

**What the design implies but doesn't show:**

- How is eligibility determined? VA Aid & Attendance eligibility requires military service, care need, and financial qualification — does the app screen for these, or does it show all potentially applicable benefits and let the caregiver self-identify? --> DESIGN NOTE: 2nd one, or use AI suggestions
- What other benefits would appear? (Medicaid waiver programs, PACE, state-specific caregiver support programs, SHIP counseling) --> DESIGN NOTE: any that would benefit
- Is the benefits database maintained by Hearth or sourced from an external API (Benefits.gov, etc.)? --> DESIGN NOTE: needs to be decided

**PM flag — financial data requires extraordinary care:**
The Money & Coverage module handles two categories of sensitive data: insurance policy information (PII + financial) and asset/savings figures for the cost estimator. This creates:

1. **Privacy exposure** — if there's a breach, financial account data is involved.
2. **Regulatory questions** — depending on how the cost estimator is framed, it may constitute financial advice. Consult an attorney before shipping cost estimator features.
3. **Trust requirements** — users will only enter this data if they believe Hearth is secure. The UI must communicate data security explicitly on the input screens.

**PM flag — LTC insurance expiry is a killer feature:**
The LTC insurance expiry alert (10a) may be the single most concrete value proposition in this module. Families regularly let LTC policies lapse due to inattention, and the financial consequences are severe. If Hearth can credibly position itself as "the thing that reminded us to renew the LTC policy," that is a powerful retention and word-of-mouth story.

**Priority: Phase 2. The tile should appear as locked with "Coming soon" in beta. The cost estimator and benefits finder require significant product design and legal review before building.**

---

### Epic 11: My Own Aging Plan (Caregiver Self-Planning) --> DESIGN NOTE: should be able to share docs w/caregivers / family members. It's interesting because we essentially have 2 overall roles (caregiver, patient) and then permissions within the caregiver role (admin, coordinator, viewer). If a person is making their own aging plan, their permissions to their plan are that of patient. Whereas they still may have other permissions for accessing their parents aging plans. Need to carefully design permissioning

**[Updated after second screenshot review — full module interior now visible]**

The full "Plan for Yourself" interior reveals a significantly more substantial feature than the home dashboard teaser implied. This is not a simple document checklist — it is a guided planning wizard with multiple structured sections, a state-specific legal document builder, and a journaling feature.

**Overall completion UI:** "40% complete" shown at the top of the page with a progress indicator.

**11a. Plan Sections**
Five named sections, each with a completion percentage:

| Section             | Completion                  |
| ------------------- | --------------------------- |
| Legal               | 60%                         |
| Care preferences    | 80%                         |
| Financial readiness | 20%                         |
| Conversation guide  | 0%                          |
| Wishes journal      | (separate treatment, below) |

The completion percentages at the section level (not just a binary check/uncheck) imply a multi-step structure within each section. "Legal at 60%" means some legal documents are done and others aren't — it's tracking completeness across a set of required items.

- As a caregiver, I see my own plan organized into named sections so I can focus on one area at a time rather than feeling overwhelmed by the full scope.
- As a caregiver, I see a completion percentage for each section so I know how much work remains in each area.
- As a caregiver, I can click into any section to continue working on it so I can make progress in focused sessions.

**What the design implies but doesn't show:**

- What specific items constitute each section? "Legal at 60%" — presumably Will ✓, Healthcare proxy ✓, Financial POA ✗, POLST ✗ or similar. The sub-items within each section are not visible. --> DESIGN NOTE: it does show?
- Who validates the completion percentages? Is it automated (document uploaded = item complete) or self-reported (checkbox the caregiver checks manually)? --> DESIGN NOTE: automated
- Does "Conversation guide at 0%" mean the caregiver hasn't had any conversations yet, or hasn't filled out the conversation guide template? --> DESIGN NOTE: need to decide
- Is this plan stored separately from the care recipient workspace, or does it function as a care recipient profile for the caregiver themselves? This is an important data model question. --> DESIGN NOTE: 2nd option

**11b. Advance Directive Builder**
A dedicated subsection with three visible elements:

- **State-specific wizard** — the builder adapts to the user's state (Illinois template visible)
- **Illinois template** — a specific legal document template pre-populated
- **Downloadable PDF** — the output of the wizard

This is the highest-effort feature in the My Aging Plan module. A state-specific advance directive wizard that produces a legally valid document (or near-valid — see flag below) is a significant scope commitment.

- As a caregiver, I can use a wizard to build my advance directive guided step-by-step so I don't have to figure out a blank legal form.
- As a caregiver, the wizard knows my state and uses the correct template so the document is appropriate for where I live.
- As a caregiver, I can download the completed advance directive as a PDF so I can print, sign, and share it.

**What the design implies but doesn't show:**

- The actual wizard screens — what questions does it ask? What language does it use for proxy designation, treatment preferences, organ donation? --> DESIGN NOTE: need to decide
- How are states determined — from user profile (state entered at signup) or a dropdown at the start of the wizard? --> DESIGN NOTE: dropdown
- How many state templates does the product ship with? All 50? A subset? --> DESIGN NOTE: Start w/ CA, Oregon, Washington
- Is the resulting document legally valid without attorney review, or is there a disclaimer? This is a significant legal question. State advance directive forms have specific witness/notary requirements that the wizard cannot fulfill on its own. --> include any legalities as next steps / to-do items

**11c. Wishes Journal**
A journaling feature for the caregiver to record personal wishes, values, and preferences separate from formal legal documents.

- As a caregiver, I can write down my wishes and values in a personal journal so my family knows what matters to me even if it's not in a legal document.
- As a caregiver, the wishes journal is a private, informal space — different in tone from the legal document builder.

**What the design implies but doesn't show:**

- Is the journal free-form text, or is it prompted (e.g., "What do you value most about quality of life?" as a journaling prompt)? --> DESIGN NOTE: both
- Who can see the wishes journal? Is it private to the caregiver, or can they share it with family? --> DESIGN NOTE: private, option to share entries
- Is the journal content included in any generated documents? --> DESIGN NOTE: maybe? maybe can use AI to generate summarized info

**PM flag — legal document generation requires attorney review:**
The advance directive builder produces a legal document. Before shipping:

1. An attorney must review the output of every state template for legal validity.
2. A disclaimer must be present: "This document is a starting point. Hearth recommends having it reviewed by an attorney and properly witnessed/notarized before use."
3. The product must have a process for updating templates when state laws change.

**PM flag — this feature is the product for a different segment:**
My Aging Plan is designed for a caregiver who is also aging — someone in their 50s–60s who is simultaneously managing a parent's care and starting to think about their own future. This is an emotionally distinct use case from the core caregiver-for-parent use case. The question for the PM: is this feature a complement to the main product (it keeps the primary user engaged after their care recipient passes) or a distraction from the core caregiver job-to-be-done? It should be validated with design partners specifically.

**Priority: The home dashboard teaser (read-only checklist) is Should-have for beta. The full Plan for Yourself module — wizard, advance directive builder, wishes journal — is post-beta, likely Sprint 11 per the implementation plan. Do not underestimate the content and legal review scope of the advance directive builder.**

---

### Epic 12: Family Workspace Collaboration (Tasks, Care Log, Members)

**[Substantially updated after second screenshot review — full collaboration interior now visible]**

A dedicated Family Workspace collaboration view is now visible as a full module interior. This is a more complete feature than the invitation model implied by the vault alone. It covers three distinct collaboration surfaces: team composition, a shared care log, and a task board.

The screen header shows: **3 Members · 4 Open tasks · 28 Care log entries.**

**12a. Family Members panel**
Three members listed with role and location context:

- **Sarah Johnson** — Primary caregiver (the primary user, presumably Margaret's equivalent here)
- **Mark Johnson** — Coordinator — Chicago
- **Amy Chen** — Viewer — Long-distance, Seattle

The role + location information is significant. "Coordinator" implies someone with editing access who is not the primary decision-maker. "Viewer" is read-only, but the "Long-distance" label acknowledges the most common family dynamics scenario — a distant sibling who wants to stay informed but isn't doing day-to-day work.

- As a caregiver (ADMIN), I can invite family members to a care recipient's workspace with a specific role (Admin, Coordinator, Viewer) so that each person has access appropriate to their involvement.
- As a caregiver, I see each collaborator's role and location so I have a quick sense of who does what and who might need to be kept in the loop differently.
- As a caregiver, I can remove a collaborator or change their role so I can manage access as family circumstances change.
- As an invited Viewer, I can see updates to the care workspace without being able to edit documents or log entries so I can stay informed from a distance.

**What the design implies but doesn't show:**

- The invitation flow — how does the ADMIN invite a family member? Email invitation? In-app link? What does the invitation email look like? --> DESIGN NOTE: email, tbd on look
- The role permissions table is critical to spec before building: what can a Coordinator do that a Viewer cannot? Can a Coordinator upload documents? Log care entries? Assign tasks? --> DESIGN NOTE: Admin can do everything & manage members, Coordinator can upload / add entries, but can't touch money info or health info. Viewer - can't edit anything
- What happens when a Viewer tries to take an action outside their permissions — is it hidden from the UI or shown but blocked? --> DESING NOTE: hidden
- Is the member list per care recipient, or per workspace? (If Harold and Ruth both have care records, does Sarah appear in both independently with potentially different roles?) --> DESIGN NOTE: per care recipient

**12b. Shared Care Log**
28 entries visible with categorization. Two visible category types: Cognitive and Medical. Each log entry presumably has: date, category, logged-by, and content.

The care log is the most important coordination tool when multiple family members are involved. Without a shared log, family members repeat the same conversations with doctors and no one knows what others observed.

- As a caregiver, I can log care observations (doctor visits, behavioral changes, incidents) so family members have a shared record of what's happened.
- As a caregiver, each log entry is categorized (Cognitive, Medical, Physical, Financial, etc.) so the log is filterable and not just a chronological wall of text.
- As a caregiver, I see who logged each entry so I can follow up with that family member if I have questions.
- As a family member (Coordinator/Viewer), I can read the care log to stay up to date on observations without being present.
- As a caregiver, I can filter the care log by category so I can see all Cognitive entries together when preparing for a neurology appointment.

**What the design implies but doesn't show:**

- Can any role write care log entries, or only Admin and Coordinator? --> DESIGN NOTE: only admin & coord
- Is there a comment thread on individual log entries? --> DESIGN NOTE: yes, but secondary feature
- What's the export story? A doctor might want a printed care log summary for a clinical visit. --> DESIGN NOTE: AI summary
- How many categories exist and are they fixed or customizable? --> DESIGN NOTE: customizable w/inital suggestions?

**12c. Task Board**
4 open tasks visible with High priority designation.

- As a caregiver (ADMIN), I can create tasks and assign them to family members so care responsibilities are clearly distributed.
- As a caregiver, I can set a priority on a task so the most urgent items are visible.
- As a caregiver, I can see all open tasks in one view so I know what's pending across the family.
- As a family member assigned a task, I can mark my task complete so the primary caregiver knows it's been handled.

**What the design implies but doesn't show:**

- Are tasks due-date-based or just open/closed? --> DESIGN NOTE: due date, integration w/task apps?
- Is the task board per care recipient or does the ADMIN have a global task view across all recipients? --> option to view all tasks (see my notes on an alerts page, I think these should be the same i.e. todos and alerts module)
- Are task completions surfaced in the care log automatically? --> DESIGN NOTE: yes, decide how that will work.

**Relationship to Epic 4 (Family Workspace — Documents):**
The collaboration view is the second surface within the Family Workspace, not a separate module. Documents and collaboration together form the complete Family Workspace. The original invitation/document collaboration points remain: "Remind [person]" email stub for non-user document requests, multi-uploader audit trail on document cards.

**Priority assessment by subfeature:**

- Member list (view only) + basic invitation flow: Must-have for beta — multi-user collaboration needs at least two people working.
- Care log (add entry, view entries, basic categories): Should-have for beta — the design partner needs to see family coordination working.
- Task board: Nice-to-have for beta — useful but less critical than the care log in a single design-partner beta.
- Full role permissions enforcement: Post-beta — validate the role model before building the full permission matrix.

---

## Prioritized Feature Map

Based on the designs and decisions recorded in the Decisions Log above. Updated 2026-04-21 to reflect Q&A decisions and four new feature specs (Messaging, i18n, Fraud/Password, Alerts).

_Beta constraint: All actions are performed by caregiver-role users only. Care recipients have no login in beta._

### Tier 1: Must-Have for Beta (Core value prop)

These are the screens the design partner must be able to use end-to-end.

| Feature                                              | What ships                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Shell & navigation (dual-state sidebar, mobile)      | Both nav states working; order: Overview → Alerts & Tasks → Document Vault → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant |
| Home dashboard — Care recipient cards                | Name, age, stage, summary alert banner ("X urgent · Y actions needed"), stats, CTA |
| Unified Alert system + Alerts page                   | Single Alert entity; all epics write to it; filterable Alerts page     |
| Care record — Header + module tile grid              | Header + tiles (active + locked per role)                              |
| Care record — NEEDS ATTENTION                        | Document-only alerts for beta (missing docs, expiry)                   |
| Document Vault — Upload, categories, doc cards       | Full upload flow; user-picks category; permissions (All/Admin/Specific) |
| Document Vault — Expiry warnings                     | Badge on cards + stats row count                                       |
| Document Vault — Document checklist                  | Missing-doc checklist per care stage                                   |
| Emergency Share Packet — Download mode               | PDF generation, saved locally                                          |
| Emergency Share Packet — Share Link mode             | URL + PIN, configurable TTL, access log, revocable                     |
| Share link unauthenticated view                      | View/download without account (PIN required)                           |
| Care stage badge + stage model                       | 5-stage placeholder, correct names, badge everywhere, caregiving language tooltip |
| Auth + onboarding                                    | Login, onboarding wizard, consent                                      |
| Document Vault — Member list + invitation            | At least 2 users collaborating; fixed roles (Admin/Coordinator/Viewer) |
| i18n foundations                                     | next-intl installed; all strings wrapped in t(); locale field on User; Intl.DateTimeFormat for dates |

### Tier 2: Should-Have for Beta (Differentiates from a file cabinet)

These features would be noticed as absent by the design partner.

| Feature                                          | What ships                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Missing document alert banner                    | Consolidated banner, filtered view of alert system; "Remind [name]" email stub |
| "Remind [name]" email flow                       | Pre-filled email to contact's email on file; no account required    |
| Home Quick Actions — Emergency share packet      | Works (delegates to Tier 1 feature)                                 |
| Home Quick Actions — Share care summary          | Stubbed, clearly labeled "in progress"                              |
| My Own Aging Plan teaser                         | Read-only section on home, no editor yet                            |
| Recent Documents panel                           | Last 5 uploads with uploader name and date                          |
| Document checklist progress panel                | Checklist items with check/uncheck                                  |
| Care record Quick Actions                        | Emergency packet + stubbed care summary                             |
| Add/edit care recipient — Fresh add flow         | Full profile creation                                               |
| Add/edit care recipient — Re-link flow           | Email lookup → new invite to existing profile                       |
| Document Vault — Care log (add + view entries)   | Basic care log with initial category taxonomy                       |
| Share link access log + revoke button            | Caregiver sees access timestamps; can revoke at any time            |
| Caregiver security guides                        | 4 guide topics: strong passwords, share link hygiene, phishing, financial abuse warning signs |

### Tier 3: Nice-to-Have for Beta (Improves polish, not core loop)

| Feature                                  | What ships                                                  |
| ---------------------------------------- | ----------------------------------------------------------- |
| Document tag editing                     | Inline chip editor on document card                         |
| AI FAB (stubbed)                         | Button present, "Coming soon" or disabled                   |
| Care record module tiles with live stats | Locked tiles show "--" not live counts in beta              |
| Share link confirmation modal            | "Link expires on [date]", copy button, native SMS hand-off  |
| Document Vault — Task board              | Basic task creation, assignment, completion, due dates      |
| See all documents page                   | Filter by category/date/uploader/status; breadcrumb nav     |

### Tier 4: Post-Beta MVP (Design shows it; build after beta validates core)

| Feature                                         | Notes                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Health Hub — Medication list (basic)            | RxNorm autocomplete; structured fields (dosage, frequency, prescribing doctor, pharmacy) + notes |
| Health Hub — Beers Criteria + drug interactions | Requires open-source data source (OpenFDA/RxNorm); inline expansion UX      |
| Health Hub — Screening schedule                 | Static USPSTF list per age/sex bracket, source attributed                   |
| Health Hub — Provider directory                 | Relatively straightforward once Health Hub ships                            |
| AI Assistant (chat interface)                   | Requires AI policy document pre-condition                                   |
| Stage Navigator — Warning signs log             | Caregivers + coordinators; timestamps + notes; no urgency field             |
| Stage Navigator — Conversation guides           | Long-form articles tagged by stage; content production track required       |
| Stage Navigator — Normal vs. Concern grid       | Content production track required                                           |
| Stage Navigator — Two-track staging model       | Dedicated design session required pre-build (physical: Katz/Lawton; cognitive: CDR) |
| My Own Aging Plan — Full wizard                 | All 5 plan sections; self-owned care recipient record model                 |
| My Own Aging Plan — Advance directive builder   | State templates (CA, OR, WA); attorney review required pre-launch           |
| My Own Aging Plan — Wishes journal              | Guided prompted responses; completion % tracked                             |
| Family Workspace — Full role permissions        | Coordinator vs. Viewer enforcement per role matrix                          |
| Care record — Medication/appointment alerts     | Requires Health Hub data                                                    |
| "Share care summary"                            | Needs content spec before building                                          |
| Post-login fraud controls                       | Suspicious action audit visibility to Admins; ADMIN promotion notification  |
| Event-triggered enrollment windows              | Medigap guaranteed issue; requires event model (design in DB session first) |

### Phase 2 (Post-MVP)

| Feature                                          | Notes                                                                        |
| ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Care Finder                                      | Facility data sourcing decision required; stage-based recommendation lookup  |
| Money & Coverage — Coverage inventory            | Financial PII handling + security review; Medicare A/B pre-populated for 65+ |
| Money & Coverage — Cost estimator                | Deterministic formula; attorney review required; "not financial advice" disclaimer |
| Money & Coverage — Benefits finder               | BenefitsCheckUp + VA.gov API sourcing decision required                      |
| Activity feed for Hearth users                   | Read-only per-care-recipient feed (messaging Phase 2)                        |
| Guest upload link for non-user contacts          | Signed token, scoped to document slot, time-limited (Dorothy upload flow)    |
| Per-module permission wizard (invitation flow)   | Admin customizes Coordinator/Viewer access per module at invite time         |
| Care recipient login (Phase 2 entry)             | Two-record model: self-managed aging plan vs. family-managed care record     |
| Spanish translation (i18n)                       | First language after English; ~3–4 weeks with next-intl foundations in place |
| Branching conversation guides                    | High-stakes topics: driving, memory care transition, end-of-life             |
| App-suggested stage reassessment                 | Based on warning signs logged; periodic reassessment prompt                  |
| External task app integration                    | Todoist, Things; deferred from beta task board                               |

### Phase 3 (Future)

| Feature                                 | Notes                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Full in-app messaging                   | Threaded per care recipient workspace; evaluate Stream Chat vs. Sendbird |
| Tagalog + Mandarin i18n                 | Second and third languages after Spanish                                 |
| Pharmacy integration                    | Replace RxNorm autocomplete with direct pharmacy data pull               |
| Licensed clinical data source           | DrFirst/Wolters Kluwer/FDB when revenue supports it                      |
| Budget + ADL modifiers for Care Finder  | Enhanced recommendation matching beyond stage-based lookup               |

### Wishlist (No committed timeline)

| Feature                        | Notes                                          |
| ------------------------------ | ---------------------------------------------- |
| Family meeting agenda          | Removed from beta and Phase 2; may revisit     |
| AI summarization of wishes journal | Guided prompts reduce need; opt-in if added |
| Caregiver-customizable modules | Widget-style home dashboard (far future)       |

---

## Implied Flows the Designs Don't Show (but a PM must spec)

These are required to make the beta work but have no design coverage. Items 1–10 were identified in the first review; 11–18 are newly identified from the second round of screenshots.

1. **Empty states** — Home with 0 care recipients; Workspace with 0 documents; category with 0 docs; NEEDS ATTENTION with no alerts; care log with 0 entries; task board with 0 tasks.

2. **Add care recipient flow** — The designs show existing care recipients. The "add your first care recipient" onboarding wizard and the "add another person" flow on the home screen are not shown.

3. **Upload flow end-to-end** — The workspace shows an upload area and a document list. The in-progress upload state, the AI categorization confirmation/correction step, and the upload error state are all missing.

4. **Emergency packet contents** — The generated PDF is never shown. This needs a content spec: what is in it, in what order, how is it laid out?

5. **Share link modal** — Shown conceptually ("copy link, 48hr TTL") but the actual modal design isn't in the screenshots.

6. **Expiry badge details** — The "⚠ Expires Jun 30" badge is shown on a document card but the document detail view (clicking on a document) is not shown. What does it show?

7. **Document viewing** — Can you preview a PDF in-app or does download always trigger? No preview state is shown.

8. **Settings / profile** — No settings screen exists in the designs. Where does the caregiver manage their account, change notification preferences, or update their own profile?

9. **Logout / session management** — Not shown anywhere.

10. **Mobile nav** — The designs show desktop. The mobile nav state (bottom tab bar or hamburger) is described in the plan but not shown in any screenshot.

11. **Drug interaction explanation** — The Health Hub shows a drug interaction badge and a standalone interaction alert, but tapping either to see the explanation is not shown. What information appears? Drug A + Drug B + the nature of the interaction + recommended action? This is the most likely question a caregiver actually has when they see the flag.

12. **Stage Navigator — Warning sign entry** — The warning signs panel shows existing observations ("Two falls," "Unpaid bills") but the flow for logging a new observation is not shown. Is it a quick-add form inline? A modal? Can the caregiver add a date to an observation?

13. **Conversation guide interior** — Four guides are listed in Stage Navigator but clicking into one is not shown. Is it a long-form article? A script? A downloadable PDF? This is content, not UI — but the container (article page, PDF viewer, etc.) must be designed.

14. **Cost estimator inputs** — Money & Coverage shows the output ("4.2 years, $58K/yr") but none of the inputs. The form where the caregiver enters assets, income, and LTC benefit details is undesigned. This is likely the most complex form in the product.

15. **Care Finder facility card** — The Care Finder shows facility names and prices in the shortlist, but the full facility card (clicking into Sunrise Senior Living) is not shown. What does a detail view include? Address, phone, capacity, ratings, inspection history?

16. **Shortlist sharing flow** — "Share shortlist with siblings" CTA is visible but the flow (how the link is generated, what the recipient sees, whether it updates live) is not shown.

17. **Family Workspace invitation flow** — Three members are visible on the collaboration tab, but how the ADMIN invited them is not shown. Email invitation? In-app contact picker? What does the invitation email say?

18. **Advance directive wizard interior** — The Plan for Yourself screen shows the advance directive builder outputs (Illinois template, downloadable PDF) but the wizard screens themselves — the questions asked, the format, how state selection works — are not shown. This is the most legally sensitive undesigned flow in the product.

---

## The One Thing to Validate First

If this product works, it works because of one moment:

> A caregiver is in an ER waiting room at midnight. A nurse asks for their parent's insurance information, medication list, and power of attorney. They tap "Emergency share packet," send a link via text, and the nurse has everything in under 60 seconds.

Every other feature in the design is valuable. But this is the one that, if it works flawlessly, makes someone tell three friends about Hearth. It is also the one with the most failure modes (PDF generation speed, share link reliability, unauthenticated access, document completeness).

Build and validate this flow first. Everything else can be added around it.

---

## Open Decisions & Research Needed

The DESIGN NOTEs throughout this document answer many of the originally-flagged questions, but a significant number of items remain unresolved, partially resolved, or introduce new decisions that must be made before a feature can be built. The following is a complete list, grouped by Epic, with context on why each item matters and a recommended path forward.

Items marked ✅ **DECIDED** have been resolved and the decision is recorded inline.

---

## Decisions Log
_Captured 2026-04-21. Sprint 1 blockers resolved in Q&A session._

### ✅ X.1 — Unified Alert System Architecture
**Decision:** Single unified `Alert` entity. All epics write to it; the Alerts page reads from it. No siloed per-module alert handling.
- Alert taxonomy uses categorization by type (missing doc, upcoming appointment, overdue task, expiring coverage, etc.) — full taxonomy in FEATURE_SPECS_NEW.md
- Home dashboard care recipient card shows a **summary banner** ("X urgent · Y actions needed") linking to the full Alerts page. No inline alert cards.
- Dedicated Alerts page with filtering is a **beta feature**.

### ✅ X.4 — Per-Recipient Sidebar Navigation Order
**Decision:** General-to-specific ordering, locked before Sprint 1:
> Overview → Documents → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant

### ✅ 2.1 — Home Dashboard Alert Display
**Decision:** Summary banner on the care recipient card ("X urgent · Y actions needed"), links to full Alerts page. No top-3 inline alert cards.

### ✅ 4.1 — Module Name
**Decision:** Module name is **"Document Vault"** — supersedes any earlier reference to "Documents" or "Family Vault." Must propagate to all nav labels, module tiles, breadcrumbs, and user-facing strings before Sprint 1 frontend work.

### ✅ X.4 — Per-Recipient Sidebar Navigation Order (updated)
**Decision:** General-to-specific ordering using "Document Vault" name, locked before Sprint 1:
> Overview → Alerts & Tasks → Document Vault → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant

_Updated after wireframe review (April 2026): "Alerts & Tasks" moves to second position per updated wireframes. Pre-wireframe order had Document Vault second._

### ✅ 12.1 — Role/Permission Matrix
**Decision (Beta):** Three fixed roles with the following defaults:

| Action | Admin | Coordinator | Viewer |
|---|---|---|---|
| Manage members | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ❌ |
| Edit own uploaded documents | ✅ | ✅ | ❌ |
| Edit others' uploaded documents | ✅ | ❌ | ❌ |
| Delete own uploaded documents | ✅ | ✅ | ❌ |
| Delete others' documents | ✅ | ❌ | ❌ |
| Create/assign tasks | ✅ | ✅ | ❌ |
| Add care log entries | ✅ | ✅ | ❌ |
| Edit/delete own care log entries | ✅ | ✅ | ❌ |
| View task board | ✅ | ✅ | ✅ |
| View alerts / Needs Attention | ✅ | ✅ | ✅ |
| View Health Hub | ✅ | ❌ | ❌ |
| View Money & Coverage | ✅ | ❌ | ❌ |

**Decision (Phase 2):** Per-module permission wizard added to the invitation flow. Admin picks a base role, then customizes per-module access via a checklist. Viewer: toggle which modules are visible. Coordinator: toggle which modules they can create/edit/delete in. Role field becomes a template that pre-populates defaults; actual permissions stored as per-member, per-module flags.

### ✅ 5.1 — Emergency Share Packet Content Spec
**Decision — Packet Structure:**
1. **Cover** — Care recipient name, optional photo, date generated, link expiry notice
2. **Emergency Contacts** — Primary caregiver, secondary contacts, non-user contacts (Dorothy-style)
3. **Medical Summary** — Diagnoses/conditions, allergies, current medications (name, dose, frequency)
4. **Providers** — Primary care physician, specialists, pharmacy
5. **Insurance** — Medicare/Medicaid, supplemental, LTC policy number
6. **Key Documents** — List of vault documents (name, category, last updated); links only, not full docs
7. **Legal** — POA holder, healthcare proxy, advance directive status
8. **Care Preferences** — Stage, living situation, known wishes summary

**Empty field handling:**
- Key Documents, Care Preferences: **hidden** if no data entered
- All other sections: show **"No data entered"** placeholder

**Decision — Two sharing modes:**
- **Download** — Generates a PDF immediately, saved locally. No link, no expiry. For caregiver's own records or in-person handoff.
- **Share Link** — Generates a time-limited URL + PIN for remote sharing (e.g., ER doctor, specialist). No account required to view — PIN is the access control.
  - Configurable TTL: 24h / 48h / 72h / 1 week
  - Optional view count limit
  - Access log visible to caregiver (timestamp, approximate location per access)
  - Revocable at any time from the care record

### ✅ 5.2 — Emergency Packet Timestamps
**Decision:** Packet shows "Data as of [date of most recent record change]." Share link confirmation modal shows "Link expires on [date]" only — no generated timestamp shown.

### ✅ 2.2 — Family Meeting Agenda
**Decision:** Removed from beta and Phase 2 scope. Added to wishlist.

### ✅ 2.3 — Add vs. Re-link Care Recipient
**Decision:** Two distinct flows from the "Add care recipient" entry point:
- **Fresh add** — caregiver fills in basic info, new record created
- **Re-link** — caregiver enters care recipient's email address, Hearth finds the existing profile, sends a new invite to that email to confirm connection

### ✅ 2.4 — Home Dashboard Grid Behavior
**Decision:** 3 columns max on desktop, 2 on tablet, 1 on mobile. Cards wrap to new rows. Vertical scroll only, no horizontal scroll.

### ✅ 2.5 — Aging Plan Document Storage
**Decision:** Aging plan documents live in the caregiver's self-owned care recipient record. At upload, caregiver can optionally share a copy to one or more care recipient Document Vault modules they manage. Share is an explicit opt-in at upload — no default duplication.

### ✅ 3.1 — Alert Generation Rules
**Decision:** Beta auto-generates: missing document (from checklist), expiring document, overdue task (past due date), expiring share link. Post-beta adds: medication refill due, upcoming screening overdue, drug interaction flagged, stage reassessment suggested, coverage enrollment window opening.

### ✅ 3.2 — Alert Dismiss/Snooze Behavior
**Decision:**
- Snooze duration: 1 week, auto-reappears after expiry
- Dismissal: silent (no care log entry)
- Dismissed/snoozed alerts remain visible in the Alerts module (with filter). Hidden from home dashboard summary banner and care record overview until they reappear.

### ✅ 4.2 — "Remind Dorothy" Mechanism
**Decision:** Beta: pre-filled email sent to the contact's email address on file. No account required for recipient. Guest upload link (signed token, scoped to specific document slot, time-limited) added to Phase 2 roadmap.

### ✅ 4.3 — Missing Document Banner
**Decision:** Missing doc banner on the Document Vault page shows a filtered view of missing document alerts only. All alerts also exist in the unified Alert system — same records, two views. "Notify aging parent" uses the same Remind flow — one unified contact notification flow across the product.

### ✅ 4.4 — Upload Drawer Form
**Decision:**
- Category: user picks from pre-set list or adds a custom category. No AI auto-categorization. User-selected category is the canonical category field. AI categorization field removed from the Document model.
- Permissions: All members / Admin only / Specific members (multi-select)

### ✅ 4.6 — "See All Documents" Page
**Decision:**
- Filters: Category, Date uploaded, Uploaded by, Status (missing / uploaded / expiring)
- Sort: Newest first, Oldest first, Name A–Z, Category
- Breadcrumb: Home → [Care Recipient Name] → Document Vault → All Documents

### ✅ 6.1 — Clinical Data Source (Deferred)
**Decision:** Deferred until Health Hub enters the sprint queue. Preferred starting point is open-source (OpenFDA/RxNorm). Evaluate licensed APIs (DrFirst, Wolters Kluwer, FDB) when revenue supports it.

### ✅ 6.2 — Medication Entry
**Decision:** RxNorm drug name autocomplete for medication entry. Pharmacy integration deferred to Phase 3.

### ✅ 6.3 — Medication Card Fields
**Decision:** Structured fields — dosage, frequency, prescribing doctor, pharmacy — plus a free-text notes field as secondary. "Add to doctor visit list" deferred to future appointment/visit workflow design.

### ✅ 6.4 — Drug Interaction Badge UX
**Decision:** Inline expansion below the medication card. No modal.

### ✅ 6.5 — Screening Schedule (Deferred)
**Decision:** Deferred to pre-Health Hub sprint. Static USPSTF-based screening list per age/sex bracket, source attributed in UI.

### ✅ 7.1 — Stage Setting
**Decision:** Stage set manually at onboarding, editable from the care record header. App-suggested stage (based on warning sign patterns) deferred to post-beta.

### ✅ 7.2 — Warning Signs Log
**Decision:** Caregivers and Coordinators can log observations. No urgency field — alerts handle escalation separately. Timestamp on every entry. Free-text notes field per observation.

### ✅ 7.3 — Conversation Guide Format
**Decision:** Long-form articles for beta, tagged by stage. Branching scripts added to Phase 2 roadmap for high-stakes topics (driving, memory care transition, end-of-life planning).

### ✅ 7.4 — Stage Model and Clinical Frameworks
**Decision:** Dedicated design session required before Stage Navigator enters the sprint queue. Direction: explore a two-track model — physical track (Katz ADL / Lawton IADL) and cognitive track (mapped to CDR) — with clinical scale references in each stage description. Tooltip clarifying Hearth stages as caregiving language (not clinical diagnosis) wherever stage appears. Current 5-stage enum is a placeholder.

### ✅ 8.1 — AI Scope and Safety Guardrails (Deferred)
**Decision:** Deferred. Dedicated AI policy document required as pre-condition before any AI feature development begins.

### ✅ 9.1 — Care Finder "Recommended" Badge
**Decision:** Stage-to-setting lookup table for initial build (Stage 1–2 → in-home companion, Stage 3 → assisted living, Stage 4 → memory care/skilled nursing, Stage 5 → hospice/skilled nursing). Budget and ADL modifiers deferred to post-launch enhancement.

### ✅ 9.2 — Facility Data Source (Deferred)
**Decision:** Research deferred until Care Finder enters sprint queue. Primary candidates: Seniorly API and Eldercare Locator (free, government-maintained).

### ✅ 9.3 — Facility Detail Data
**Decision:** Facility detail scoped to what the chosen data source reliably provides. UI notes where data is partial (e.g., "inspection history available for skilled nursing facilities only").

### ✅ 9.4 — Cost Estimator Placement
**Decision:** Simplified cost range embedded in Care Finder (reads from Money & Coverage data). Full cost estimator with financial inputs lives in Money & Coverage. Care Finder = discovery tool; Money & Coverage = financial planning tool.

### ✅ 10.1 — Cost Estimator Design
**Decision:** Deterministic formula (not AI). Stores only coverage inventory data already entered (LTC benefit amount, monthly premium). Input asks for "monthly private-pay budget" (not gross assets). Mandatory "this is not financial advice" disclaimer. Financial regulatory attorney review required before launch.

### ✅ 10.2 — Medicare Part A/B Pre-population
**Decision:** Medicare A/B pre-populated as "assumed enrolled" for care recipients 65+. Confirmation prompt at coverage setup: "We've added Medicare Part A and B. Please confirm or remove if not applicable."

### ✅ 10.3 — Benefit Enrollment Windows
**Decision:** Calendar-based windows (Medicare OEP, Medicare Advantage) as hardcoded annual alerts in the unified Alert system. Event-triggered windows (Medigap guaranteed issue) deferred — event model to be designed as part of the API/database modeling session, not bolted on later.

### ✅ 10.4 — Benefits Database Source (Deferred)
**Decision:** Research deferred until Money & Coverage enters sprint queue. Primary candidates: BenefitsCheckUp (NCOA) API, VA.gov API for veteran-specific benefits.

### ✅ 11.1 — Aging Plan Permissions and Role Duality
**Decision (Beta):** Aging plan is a self-owned care recipient record — caregiver is both Admin and the care recipient subject. No module-visibility controls built for beta.
**Decision (Phase 2):** Separation between self-managed aging plan and family-managed care record introduced. Care recipient's self-view scoped to their personal space (documents, wishes, preferences) — not the care log or warning signs their family manages. Data model must not preclude the two-record pattern from day one.

### ✅ 11.2 — Conversation Guide Completion Definition
**Decision:** Conversation guide is a set of prompted responses the caregiver fills in. Completion percentage = responses entered / total prompts. 0% = no responses entered.

### ✅ 11.3 — Advance Directive State Pre-fill and Maintenance
**Decision:** State dropdown pre-fills from user profile with manual override allowed. Annual legal review calendar per state template established as an ongoing operational requirement (not a one-time build).

### ✅ 11.4 — Advance Directive Legal Validity
**Decision:** Healthcare attorney review required before advance directive builder ships in any state. PDF output includes a mandatory state-specific completion instructions page (witness requirements, notary requirement, state registry filing if applicable) and a prominent legal validity notice: "This document is not legally effective until properly signed, witnessed, and/or notarized per [State] law."

### ✅ 11.5 — Wishes Journal AI Summarization
**Decision:** AI summarization deprioritized — the guided prompt structure makes AI processing less necessary as responses are already organized. Added to wishlist (not Phase 2). Explicit opt-in consent still required if AI summarization is ever added. Journal content never included in general AI assistant context without separate consent.

### ✅ 12.2 — Hidden vs. Blocked UI
**Decision:** Restricted actions hidden by default. "Contact admin" affordance shown for actions a lower-permission user might reasonably want to request (e.g., Viewer wanting to add a care log entry).

### ✅ 12.3 — Care Log Initial Category Taxonomy
**Decision:** Initial taxonomy: Cognitive, Medical, Physical, Nutritional, Financial, Social, Behavioral, Legal/Administrative. Custom categories allowed as free-form additions on top.

### ✅ 12.4 — Task Due Dates and Overdue Alerts
**Decision:** Task due dates included in beta. Overdue tasks generate alerts in the unified Alert system. External task app integration (Todoist, Things, etc.) deferred to Phase 2.

### ✅ 12.5 — Task Completions and Care Log
**Decision:** Tasks and care log are separate systems. Task completions do not appear in the care log. No prompt, no auto-population.

### ✅ 12.6 — Invitation Email
**Decision:** Invitation email requires dedicated content and design pass before Epic 12 build. Required elements: inviter name, care recipient context, assigned role explanation, Hearth intro for first-time recipients, clear CTA.

### ✅ X.2 — Real-time Messaging Scope
**Decision:** Email-only outbound for beta (Remind contacts, share shortlist, invitations). In-app messaging and guest upload links deferred to Phase 2.

### ✅ X.3 — Care Recipient Login Boundary
**Decision:** Care recipient login deferred to Phase 2. Beta constraint: all actions performed by caregiver-role users only. Care recipient has no login in beta. Any feature implying care recipient actions is caregiver-proxied. This applies explicitly to: document uploads attributed to care recipients, re-linking expired aging plan invites, and document deletion.

### ✅ 1.1 — Role-based Sidebar Rendering
**Decision:** Resolved by 12.1 role/permission matrix. Sidebar renders based on role — Health Hub and Money & Coverage hidden from Coordinators and Viewers respectively. Implementation follows the role matrix table in 12.1.

---

_All items below have been resolved. See the Decisions Log above for the full recorded decision on each item._

### Epic 1 — Shell & Navigation
**✅ DECIDED (1.1)** — Role-based sidebar rendering resolved by 12.1 role/permission matrix. See Decisions Log.

### Epic 2 — Home Dashboard
**✅ DECIDED (2.1)** — Alert display: summary banner on home card. See Decisions Log.
**✅ DECIDED (2.2)** — Family meeting agenda: removed, added to wishlist. See Decisions Log.
**✅ DECIDED (2.3)** — Add vs. re-link care recipient: two flows, re-link via email lookup. See Decisions Log.
**✅ DECIDED (2.4)** — Grid behavior: 3-col desktop, 2-col tablet, 1-col mobile, wrap + vertical scroll. See Decisions Log.
**✅ DECIDED (2.5)** — Aging plan docs: self-owned care recipient record, optional share to other records at upload. See Decisions Log.

### Epic 3 — Care Record
**✅ DECIDED (3.1)** — Alert generation rules: beta auto-generates 4 types; post-beta adds health/stage/coverage alerts. See Decisions Log.
**✅ DECIDED (3.2)** — Dismiss/snooze: 1-week snooze, auto-reappear, silent dismissal, hidden from dashboard/overview only. See Decisions Log.

### Epic 4 — Document Vault (formerly Family Vault)
**✅ DECIDED (4.1)** — Module name: "Document Vault." See Decisions Log.
**✅ DECIDED (4.2)** — Remind Dorothy: pre-filled email for beta, guest upload link Phase 2. See Decisions Log.
**✅ DECIDED (4.3)** — Missing doc banner: filtered alert view, unified Remind flow. See Decisions Log.
**✅ DECIDED (4.4)** — Upload drawer: user-picked category (no AI), permissions (All / Admin only / Specific). See Decisions Log.
**✅ DECIDED (4.5)** — Deletion: Coordinators delete own uploads, Admins delete any. See Decisions Log.
**✅ DECIDED (4.6)** — See all documents page: filters, sort, breadcrumb defined. See Decisions Log.

### Epic 5 — Emergency Share Packet
**✅ DECIDED (5.1)** — Packet content spec: 8 sections, empty field handling, Download + Share Link modes. See Decisions Log.
**✅ DECIDED (5.2)** — Timestamps: "Data as of X" on packet, "Link expires on X" on share modal. See Decisions Log.

### Epic 6 — Health Hub
**✅ DECIDED (6.1)** — Clinical data source: deferred, prefer open-source (OpenFDA/RxNorm). See Decisions Log.
**✅ DECIDED (6.2)** — Medication entry: RxNorm autocomplete, pharmacy integration Phase 3. See Decisions Log.
**✅ DECIDED (6.3)** — Medication card fields: structured fields + free-text notes, doctor visit list deferred. See Decisions Log.
**✅ DECIDED (6.4)** — Interaction badge: inline expansion (not modal). See Decisions Log.
**✅ DECIDED (6.5)** — Screening schedule: deferred, static USPSTF list, attributed in UI. See Decisions Log.

### Epic 7 — Stage Navigator
**✅ DECIDED (7.1)** — Stage setting: manual for beta, app-suggestion post-beta. See Decisions Log.
**✅ DECIDED (7.2)** — Warning signs log: caregivers + coordinators, no urgency, timestamps + notes. See Decisions Log.
**✅ DECIDED (7.3)** — Conversation guides: articles for beta, branching scripts Phase 2. See Decisions Log.
**✅ DECIDED (7.4)** — Stage model: dedicated design session pre-Stage Navigator, two-track model (physical + cognitive). See Decisions Log.

### Epic 8 — AI Assistant
**✅ DECIDED (8.1)** — AI scope/guardrails: deferred, policy document required pre-Epic 8. See Decisions Log.

### Epic 9 — Care Finder
**✅ DECIDED (9.1)** — Recommended badge: stage-to-setting lookup table, enhanced matching deferred. See Decisions Log.
**✅ DECIDED (9.2)** — Facility data source: deferred, primary candidates Seniorly API + Eldercare Locator. See Decisions Log.
**✅ DECIDED (9.3)** — Facility detail: scoped to available data, UI notes where partial. See Decisions Log.
**✅ DECIDED (9.4)** — Cost estimator placement: simplified range in Care Finder, full estimator in Money & Coverage. See Decisions Log.

### Epic 10 — Money & Coverage
**✅ DECIDED (10.1)** — Cost estimator: deterministic formula, coverage inventory data only, monthly budget input, disclaimer, legal review. See Decisions Log.
**✅ DECIDED (10.2)** — Medicare A/B: pre-populated as assumed enrolled for 65+, confirmation prompt. See Decisions Log.
**✅ DECIDED (10.3)** — Enrollment windows: calendar-based as hardcoded alerts, event model in DB design session. See Decisions Log.
**✅ DECIDED (10.4)** — Benefits database: deferred, primary candidates BenefitsCheckUp + VA.gov API. See Decisions Log.

### Epic 11 — My Own Aging Plan
**✅ DECIDED (11.1)** — Role duality: self-owned care recipient record for beta, two-record separation Phase 2, data model must not preclude it. See Decisions Log.
**✅ DECIDED (11.2)** — Conversation guide completion: prompted responses, % = responses entered / total. See Decisions Log.
**✅ DECIDED (11.3)** — Advance directive pre-fill + maintenance: profile pre-fill, annual legal review calendar. See Decisions Log.
**✅ DECIDED (11.4)** — Advance directive legal validity: attorney review required, mandatory completion instructions in PDF. See Decisions Log.
**✅ DECIDED (11.5)** — Wishes journal AI: deprioritized, on wishlist, explicit consent required if added. See Decisions Log.

### Epic 12 — Family Workspace Collaboration
**✅ DECIDED (12.1)** — Role/permission matrix: fixed roles for beta, per-module wizard Phase 2. See Decisions Log.
**✅ DECIDED (12.2)** — Hidden vs. blocked: hidden by default, "contact admin" affordance for requestable actions. See Decisions Log.
**✅ DECIDED (12.3)** — Care log taxonomy: Cognitive, Medical, Physical, Nutritional, Financial, Social, Behavioral, Legal/Administrative + custom. See Decisions Log.
**✅ DECIDED (12.4)** — Task due dates + overdue alerts: in beta, external app integration Phase 2. See Decisions Log.
**✅ DECIDED (12.5)** — Task completions: separate from care log, no prompt, no auto-population. See Decisions Log.
**✅ DECIDED (12.6)** — Invitation email: dedicated content/design pass required pre-Epic 12. See Decisions Log.

### Cross-Epic / Structural
**✅ DECIDED (X.1)** — Unified alert system: single Alert entity, all epics write to it. See Decisions Log.
**✅ DECIDED (X.2)** — Messaging scope: email-only beta, in-app messaging Phase 2. See Decisions Log.
**✅ DECIDED (X.3)** — Care recipient login: Phase 2, beta is caregiver-only, all care recipient actions are caregiver-proxied. See Decisions Log.
**✅ DECIDED (X.4)** — Navigation order: Overview → Document Vault → Stage Navigator → Health Hub → Care Finder → Money & Coverage → Family Workspace → AI Assistant. See Decisions Log.
