# FIXIFY — DESIGN SYSTEM & UI IMPLEMENTATION BRIEF

**Document status:** Design source of truth for prototype + Next.js implementation
**Version:** 1.0
**Last updated:** 2026-09-23
**Audience:** Kiro, frontend implementation agents, product/design collaborators, future human designer
**Primary implementation target:** Next.js + React + TypeScript + Tailwind + Supabase-backed production application

---

## 1. Purpose

This document turns the Fixify product context into a concrete visual and interaction system for the **best UI prototype** and the later **Next.js production UI**.

It is deliberately more comprehensive than a normal design brief. Kiro should be able to use it to:

- build the prototype screens without inventing a visual language;
- create the production component structure from the prototype;
- keep marketing, customer, professional, and admin surfaces visually related but appropriately different;
- implement interaction patterns consistently;
- avoid generic AI-generated SaaS/dashboard layouts;
- preserve usability, accessibility, responsiveness, and reduced-motion behavior;
- understand which visual elements are product behavior and which are purely illustrative.

This is a **design specification**, not a replacement for:

```text
PRODUCT_DECISIONS.md   -> business rules
OPEN_DECISIONS.md      -> unresolved product decisions
DATA_MODEL.md          -> data vocabulary
RBAC.md                -> authorization
STATE_MACHINES.md      -> workflow/state transitions
AI_SPEC.md             -> AI behavior and safety
PAYMENT_SPEC.md        -> payment behavior
NOTIFICATION_SPEC.md   -> notification behavior
```

When another document defines business behavior, this document must not override it.

---

# 2. Design source hierarchy

Use the following priority when implementing UI:

```text
1. Current Fixify business definition supplied in project context
2. FIXIFY_MASTER_BLUEPRINT.md / current product blueprint
3. PRODUCT_DECISIONS.md + OPEN_DECISIONS.md
4. DATA_MODEL.md / RBAC.md / STATE_MACHINES.md
5. This DESIGN_BRIEF.md for visual and interaction decisions
6. PROJECT BRIEF - FIXIFY.docx for original product framing
7. abcd (1).html as motion / interaction / craftsmanship reference only
8. Generic framework defaults last
```

The supplied ABCD HTML is **not** the information architecture or content source for Fixify. It is a reference for the level of visual craft and interaction quality: cinematic composition, strong typography, layered visuals, scroll reveals, expandable panels, responsive navigation, subtle technical graphics, and reduced-motion handling.

Do not copy its construction-company content, project language, statistics, ecosystem structure, or brand identity.

---

# 3. Product design premise

Fixify is not merely a directory of technicians and not merely a booking form.

The product experience is the controlled journey from an uncertain home problem to an accountable service outcome:

```text
Problem
  ↓
Understand
  ↓
Triage / service selection
  ↓
Property + context
  ↓
Booking
  ↓
Professional match
  ↓
Arrival / inspection
  ↓
Approved work
  ↓
Completion evidence
  ↓
Payment / invoice
  ↓
Review / support
  ↓
Property history
```

The UI should make this journey feel **calm, understandable and trustworthy**, even when the underlying workflow is complex.

The customer's emotional target is:

> “I explained the problem. Fixify understood what needed to happen next. I always know what is happening, who is responsible, and what I am paying for.”

The professional's emotional target is:

> “I receive enough context to do the job properly, and Fixify makes the operational steps and earnings clear.”

The admin/support target is:

> “I can see what is happening, why it happened, and what intervention is needed.”

---

# 4. Design personality

## 4.1 Core character

Fixify should feel:

- **Human** — written and structured around real household problems, not software abstractions.
- **Competent** — precise without becoming clinical or intimidating.
- **Trustworthy** — transparent about uncertainty, pricing, status, and responsibility.
- **Premium but practical** — refined enough to feel credible, never luxury for luxury's sake.
- **Warmly technical** — technical details appear when they help the user make a decision.
- **Quietly distinctive** — visual identity should come from composition, type, pacing, diagrams, material textures, and micro-interactions rather than gimmicks.
- **Operationally honest** — no visual treatment should imply certainty the platform does not actually have.

## 4.2 What Fixify must NOT feel like

Do not make the product look like:

- a generic fintech dashboard;
- a generic AI chatbot landing page;
- a food-delivery marketplace clone;
- a template assembled from common rounded cards;
- an enterprise admin system on every screen;
- a construction company website;
- a neon “AI future” interface;
- a page where every section is a three-column card grid;
- a page with decorative animation that does not explain or reinforce the product.

---

# 5. Design principles

## Principle 01 — Design around the customer's problem, not the platform's features

Lead with language such as:

```text
What needs fixing?
What are you seeing?
Where is it happening?
When do you need help?
```

Do not lead with:

```text
Create service request
Configure service workflow
AI classification module
```

The backend can use those terms. The customer UI should speak naturally.

---

## Principle 02 — Show complexity progressively

Do not expose every possible field at once.

A good sequence is:

```text
Simple question
    ↓
Optional detail
    ↓
Evidence
    ↓
Service confirmation
    ↓
Schedule
    ↓
Price / inspection explanation
    ↓
Professional
    ↓
Confirm
```

Advanced details remain available without becoming the default experience.

---

## Principle 03 — Every important decision has visible context

For actions involving:

- money;
- cancellation;
- additional work;
- inspection;
- professional assignment;
- customer approval;
- payment;
- dispute/support;

show enough context before the action that a reasonable user understands the consequence.

---

## Principle 04 — Visual hierarchy should carry the workflow

The user should be able to answer these questions almost immediately:

1. Where am I?
2. What is happening now?
3. What do I need to do?
4. What happens next?
5. What does it cost?

Use hierarchy before decoration.

---

## Principle 05 — Motion explains state and continuity

Use motion to show:

- entering a workflow;
- progress through a process;
- panels opening into detail;
- an object moving from one state to another;
- a notification arriving;
- a quote expanding into line items;
- a timeline becoming active.

Do not animate everything merely because animation is available.

---

## Principle 06 — Trust is a visual system

Trust should not depend on a single “verified” badge.

Use repeated evidence:

```text
Who is this professional?
Why were they matched?
What is included?
What is not yet known?
What was approved?
What changed?
What was completed?
What evidence exists?
```

---

# 6. Visual direction

## 6.1 Overall visual language

Recommended visual direction:

```text
Warm architectural calm
+ technical precision
+ human service photography
+ restrained editorial typography
+ subtle blueprint / measurement motifs
+ tactile surfaces
+ purposeful motion
```

The interface should feel influenced by:

- workshop labels;
- architectural drawings;
- material samples;
- maintenance logs;
- service tickets;
- well-designed consumer products;
- editorial layouts.

It should **not** look like a literal collage of those things.

---

# 7. Color system

The baseline palette uses a warm neutral canvas, graphite structure, muted teal-green as the brand signal, and a rust/amber accent for attention states.

Exact values may be tuned during implementation, but the role of each color is fixed.

## 7.1 Semantic roles

| Token | Role | Guidance |
|---|---|---|
| `--fx-canvas` | Primary page background | Warm off-white, never stark white by default |
| `--fx-surface` | Cards / panels | Slightly differentiated from canvas |
| `--fx-surface-raised` | Elevated interactive surfaces | Reserved for meaningful elevation |
| `--fx-ink` | Primary text | Deep graphite rather than pure black |
| `--fx-ink-soft` | Secondary text | Calm neutral |
| `--fx-line` | Borders/dividers | Low-contrast and purposeful |
| `--fx-teal` | Primary brand/action signal | Use for primary actions and selected states |
| `--fx-teal-dark` | Deep brand tone | Hero / strong CTA / dark panels |
| `--fx-rust` | Attention / warmth | Approval, pending attention, important accents |
| `--fx-success` | Successful/completed state | Distinct from brand teal where necessary |
| `--fx-danger` | Destructive/error state | Clear but not visually dominant |
| `--fx-info` | Informational state | Cool neutral/blue only where useful |
| `--fx-grid` | Technical decorative lines | Extremely low opacity |
```

## 7.2 Recommended baseline values

These are a starting implementation palette, not a reason to introduce a rainbow theme.

```text
Canvas          #F3F0E8
Surface         #FAF8F3
Surface raised  #FFFFFF
Ink             #1E2423
Ink soft        #68706C
Line            #D8D4CB
Teal            #2F716D
Teal dark       #214C49
Rust            #B76A4C
Sand            #D9C8AE
Success         #3E7A5D
Danger          #B8544C
Info            #4E6675
```

For implementation, prefer CSS custom properties so the entire system can be refined centrally.

## 7.3 Usage ratio

A typical screen should visually remain close to:

```text
60–75% warm neutral surfaces
15–25% graphite / dark structural elements
5–10% brand teal
1–5% rust / signal accents
```

Do not fill entire interfaces with the primary brand color.

---

# 8. Typography

## 8.1 Typographic character

Typography should create a strong editorial identity while remaining highly legible.

Use a display face with a distinctive but restrained character and a highly readable sans-serif for body/UI text.

Preferred system direction:

```text
Display: expressive geometric / grotesk sans
Body: humanist or neutral UI sans
Mono: restrained technical mono for metadata only
```

The prototype may use a display/body pairing similar in spirit to:

```text
Display: Space Grotesk / Geist / equivalent
Body: Inter / IBM Plex Sans / equivalent
Mono: IBM Plex Mono / Geist Mono / equivalent
```

Do not use more than three families.

## 8.2 Hierarchy

```text
Display hero       64–104 px desktop, responsive clamp on smaller screens
Page headline      40–64 px
Section headline   30–48 px
Card headline      17–22 px
Body               15–18 px
UI label           12–14 px
Technical metadata 10–12 px
```

The exact scale can flex by surface. Do not force a single typography scale on admin screens.

## 8.3 Typography behavior

Use animated typography sparingly:

- masked upward entrance for hero lines;
- subtle character/word reveal for selected section headings;
- no perpetual typewriter effect;
- no bouncing or elastic text;
- respect reduced-motion preferences.

---

# 9. Spacing, grids and geometry

## 9.1 Layout system

Use a predictable spacing scale based on multiples of 4 px.

Recommended:

```text
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 80 / 96 / 128
```

## 9.2 Marketing layout

Use a broad editorial container rather than a boxed SaaS frame.

```text
max width: ~1280–1440px
side padding: 24–40px desktop
mobile padding: 18–20px
```

Allow some elements to intentionally break the grid:

- hero visual;
- horizontal service reel;
- large image/media panels;
- property-history timeline;
- trust statement.

## 9.3 Application layout

Use an application shell with:

- persistent but collapsible navigation on desktop;
- top utility bar;
- responsive mobile navigation;
- content width tuned to task complexity;
- wider layouts for operational tables;
- narrower layouts for conversational intake and approvals.

Do not make every page a fixed 3-column dashboard.

---

# 10. Surface hierarchy

Fixify has four visual surfaces.

## Surface A — Marketing

Purpose:

```text
Build understanding
Build trust
Explain the process
Drive “Describe a problem” / service discovery
```

Visual tone:

```text
Editorial
Cinematic
Expressive
Minimal copy density
```

## Surface B — Customer application

Purpose:

```text
Complete tasks
Understand current job state
Approve / schedule / pay
Maintain property history
```

Visual tone:

```text
Calm
Clear
Focused
Slightly warm
```

## Surface C — Professional application

Purpose:

```text
Receive work
Manage availability
Travel / arrive
Inspect
Quote
Complete
Track earnings
```

Visual tone:

```text
Operational
Fast
Legible
Mobile-first
```

## Surface D — Admin / support

Purpose:

```text
Monitor
Investigate
Resolve
Verify
Intervene
Audit
```

Visual tone:

```text
Dense but controlled
Information-forward
State-driven
Low decoration
```

---

# 11. Global navigation principles

## Marketing navigation

Recommended structure:

```text
Logo
Services
How it works
For professionals
Why Fixify
Help

[Describe a Problem]
[Log in]
```

The primary CTA should feel like a real entry point into the product, not a generic “Get Started” button.

## Customer navigation

Primary destinations:

```text
Home
Report a problem
Bookings
Properties
History
Payments / Invoices
Support
Profile
```

On mobile, prioritize the current task and the active booking rather than showing every destination simultaneously.

## Professional navigation

```text
Today
Jobs
Availability
Earnings
Profile
Support
```

## Admin navigation

```text
Overview
Jobs
Customers
Professionals
Verification
Services
Pricing
Payments
Complaints
Analytics
```

Admin navigation should not reuse marketing navigation.

---

# 12. Navigation interactions

The supplied ABCD HTML is a benchmark for the quality of navigation behavior.

Implement:

- transparent header over hero where appropriate;
- header becoming more solid after scrolling;
- compact mobile menu;
- animated menu entrance/exit;
- keyboard-accessible menu;
- body scroll lock while modal mobile menu is open;
- Escape key closes overlays;
- focus returns to the trigger after close;
- `aria-expanded`, `aria-controls`, and `aria-hidden` where applicable.

The mobile menu should feel like a deliberate full-screen surface, not a dropdown squeezed into a header.

---

# 13. Button language

Buttons should describe the action and its consequence.

Prefer:

```text
Describe the problem
Choose a service
See available times
Confirm booking
Approve additional work
View invoice
Pay securely
Get support
Book again
```

Avoid:

```text
Submit
Continue
Process
Execute
Manage
Click here
```

Generic “Continue” is acceptable only when the context makes the next step unmistakable.

## 13.1 Button hierarchy

### Primary
Filled teal / strong contrast.

Use for one dominant action per area.

### Secondary
Outlined or neutral raised.

Use for a complementary action.

### Tertiary
Text/link action.

Use for lower-priority navigation.

### Destructive
Explicitly destructive with clear consequence.

Never style cancellation casually.

---

# 14. Component philosophy

Components should have **visual identity through structure**, not through excessive decoration.

Build reusable primitives for:

```text
Button
Input
Textarea
Select
Checkbox / radio
File upload
Badge
Avatar
Tooltip
Dialog
Drawer
Toast
Tabs
Accordion
Popover
Dropdown
Skeleton
Empty state
Error state
Timeline item
Price row
Status chip
Media thumbnail
Service card
Professional card
Property card
Job card
Quote card
Notification item
```

Then compose product components:

```text
ProblemComposer
AIIntakePanel
ServiceSelector
MediaUploader
BookingStepper
ProfessionalMatchCard
JobStatusTimeline
QuoteBreakdown
ApprovalPanel
PropertyOverview
PropertyAssetCard
ServiceHistoryTimeline
InvoiceSummary
ComplaintPanel
ProfessionalJobCard
VerificationPanel
AdminQueue
```

Do not build every screen from one universal “Card” component with identical padding and radius.

---

# 15. Shape language

Use moderately rounded geometry.

Recommended:

```text
Small controls:     8–10px radius
Cards/panels:       14–18px radius
Large feature cards: 18–24px radius
Pills/status chips: full radius
```

Avoid exaggerated pillification.

Inputs and cards should feel tactile and physical rather than toy-like.

---

# 16. Borders and shadows

Use borders as the primary structure.

Shadows are supportive, not decorative.

Preferred shadow behavior:

```text
Default: almost none / very subtle
Hover: slight lift
Modal: deeper but soft
Floating action: visible enough for separation
```

Avoid large blurred “startup landing page” shadows.

---

# 17. Technical visual motifs

A Fixify-specific visual identity can use subtle technical motifs:

- measurement ticks;
- thin grid lines;
- route lines;
- status nodes;
- blueprint-like diagrams;
- service schematic icons;
- component outlines;
- material swatches;
- timestamps;
- small labels;
- mono metadata.

Use them as secondary layers.

A technical motif should never reduce readability or imply fabricated data.

---

# 18. Photography and imagery

## 18.1 Image direction

Use imagery that looks like real service work:

- technician at work;
- hands inspecting a component;
- appliance / fixture detail;
- tools and materials;
- before/after conditions;
- real homes and rooms;
- contextual city/home environments.

Prefer slightly imperfect, documentary-feeling imagery over polished stock photography.

## 18.2 Image treatment

Use:

- natural light;
- warm neutrals;
- muted contrast;
- close details;
- occasional wide environmental frames.

Avoid:

- fake “happy family pointing at tablet” stock shots;
- excessive blue tint;
- glossy 3D app mockup overload;
- unrelated construction imagery.

## 18.3 Generated / synthetic visuals

During prototype development, generated visuals are allowed as placeholders.

They must be clearly treated as visual content, not evidence that a professional or service outcome actually exists.

---

# 19. Hero design direction

The homepage hero should carry Fixify's personality immediately.

## Recommended structure

```text
Top navigation

Large statement
Short human explanation

[Describe a Problem]  [Browse Services]

Interactive visual / service scene

Small trust / process marker
```

Example conceptual headline direction:

```text
Your problem.
Fixed properly.
```

This is direction, not a requirement to keep that exact copy.

The hero should communicate:

```text
simple entry
+ human support
+ professional accountability
+ clarity
```

## Hero visuals

Better than a generic laptop mockup:

- an evolving room/fixture composition;
- service parts or tools arranged as a visual system;
- problem → assessment → resolution animation;
- layered blueprint + photo composition;
- subtle service route / timeline animation.

Do not build a WebGL experience merely to show technical skill.

---

# 20. Marketing homepage structure

Recommended page architecture:

```text
01 Navigation
02 Hero
03 Problem-first interaction
04 Service categories
05 How Fixify works
06 Trust / verified professionals
07 Live-looking but honest workflow visualization
08 Property record / maintenance history
09 Professional CTA
10 FAQ / Help entry
11 Final CTA
12 Footer
```

## 20.1 Problem-first interaction

The user should be able to interact with an example flow immediately.

Example:

```text
“What is going wrong?”

[ The kitchen tap is leaking near the base ]

[ Add a photo ] [ Add a video ]

Fixify thinks this may be:
Plumbing → Tap / fitting issue

[See what happens next]
```

This may use synthetic content in the prototype, but the production implementation must follow AI_SPEC and must not claim diagnostic certainty.

---

# 21. Service catalogue design

Categories should feel like a useful toolbox, not a marketplace grid full of promotional badges.

Recommended categories for the initial prototype:

```text
Electrical
Plumbing
AC & Cooling
Appliances
Carpentry
Painting
Cleaning
Renovation
```

Each category should reveal:

- representative tasks;
- whether inspection is commonly required;
- starting / indicative price language only where authorized;
- availability;
- service expectations;
- optional material information;
- clear path to book.

The exact production catalogue remains controlled by product decisions and database data.

---

# 22. Service detail page

Recommended structure:

```text
Breadcrumb
Category label
Service title
Plain-language summary
Visual / supporting image
What this covers
What to expect
Pricing model explanation
Materials / brands where applicable
Typical duration where supported
Availability
FAQ
Book CTA
```

Avoid putting the price at the top if the service cannot honestly have a fixed price.

For inspection-based services, communicate the inspection model before the user commits.

---

# 23. Problem intake design

This is one of Fixify's signature interactions.

## 23.1 Entry

Use:

```text
Tell us what happened
```

rather than:

```text
Create service request
```

## 23.2 Composer

Support:

```text
Text
Photo
Video

Voice = later enhancement unless enabled by product scope
```

The text area should feel conversational, not like a CRM form.

## 23.3 AI-assisted intake

The visual flow may show:

```text
You:
“The AC is running but the room isn't cooling.”

Fixify:
“It sounds like a cooling issue. A technician may need to inspect airflow, the condenser, or the refrigerant system.”

Confidence / certainty language:
“Initial assessment — not a final diagnosis.”

[Add a photo]
[Continue with AC & Cooling]
[Choose another service]
```

AI must never be visually represented as an omniscient technician.

Follow `AI_SPEC.md` for actual output contracts, escalation, safety, and uncertainty handling.

---

# 24. Media upload design

The upload area should communicate:

```text
What to capture
Why it helps
What file types are accepted
What happens to the evidence
```

Interaction:

```text
Drop / select
→ thumbnail preview
→ upload progress
→ success
→ remove / replace
```

For videos, show a poster thumbnail and duration when available.

Do not block users unnecessarily if media is optional.

---

# 25. Booking flow design

The booking UI follows the business workflow:

```text
Problem
→ service
→ property
→ date/time
→ pricing model
→ professional
→ confirmation
```

Use a progress indicator, but do not turn the process into a long generic checkout wizard.

Each step should answer one clear question.

## Confirmation summary

Before confirmation show:

```text
Problem
Service
Property
Date/time
Professional / matching basis
Pricing model
Estimated or fixed amount as authorized
Important conditions
```

The primary CTA should contain the action, e.g.:

```text
Confirm booking
```

not merely:

```text
Finish
```

---

# 26. Professional matching design

The customer should understand enough about the professional to trust the assignment.

Show where relevant:

```text
Name
Photo
Trade / skills
Verified indicator
Service area / approximate proximity
Experience or relevant profile facts if supported
Rating / review summary if available
Availability
Why this match
```

Do not invent ratings, certifications, distance, review counts, or verification claims in production.

Prototype data must be visibly synthetic when not connected to real Supabase data.

---

# 27. Active job page

This is the most important authenticated customer screen after intake.

The page should feel like a live operational record rather than a dashboard.

Recommended structure:

```text
Job header
Current status
Professional card
Next action / expectation
Timeline
Problem summary
Media
Quote / approval area when applicable
Payment area when applicable
Support entry
```

The status flow visually maps to `STATE_MACHINES.md`:

```text
REQUESTED
MATCHING
ASSIGNED
ACCEPTED
ON_THE_WAY
ARRIVED
INSPECTION
AWAITING_APPROVAL
IN_PROGRESS
COMPLETED
PAYMENT_PENDING
CLOSED
```

Exception states must be visually distinct:

```text
REJECTED
CANCELLED
EXPIRED
DISPUTED
SUSPENDED
```

Do not create a second frontend-only state machine.

---

# 28. Timeline design

The timeline should be one of Fixify's signature patterns.

Use:

```text
time
node
state
short human explanation
optional evidence
```

Example:

```text
14:28
● Arrived
The professional confirmed arrival at your property.

14:35
● Inspection
The issue is being assessed.

15:02
● Additional work proposed
A quote is ready for your approval.
```

Active state:

- slightly larger node;
- stronger contrast;
- subtle motion only when appropriate.

Completed states:

- quieter but still readable.

Future states:

- low-contrast and clearly inactive.

---

# 29. Quote approval design

The quote page is a trust-critical surface.

Required hierarchy:

```text
Problem found

What the professional recommends

Labour
Materials / parts
Fees / taxes where applicable
Discounts if applicable

TOTAL

Why this work is needed

Expected duration / visit information if supported

[Approve]
[Decline]
```

For each line item, show enough detail that the customer can understand the charge.

Never present an AI-generated price as the authoritative quote.

The customer approval action must use the server-side operation defined in the backend specifications.

---

# 30. Additional-work presentation

When the original scope changes, make the difference visually obvious.

Use a comparison pattern where useful:

```text
Original scope
Current approved scope
Newly proposed work
```

Highlight only the changed portion.

Avoid alarming red UI for ordinary additional work. Use the rust signal color for attention, with clear explanation.

The customer should never have to infer that a new charge appeared.

---

# 31. Payment UI

Payment UI must look authoritative and calm.

Display:

```text
Invoice / order reference
Service
Approved work
Materials
Labour
Fees / taxes
Discounts
Total
Payment status
```

Use the authoritative amount from the server.

Do not show a fake client-calculated total as truth.

Follow `PAYMENT_SPEC.md` for state, provider, webhook, reconciliation, and refund behavior.

---

# 32. Invoice design

Invoice screen should support quick comprehension before document detail.

Top:

```text
Paid / Payment pending / Refunded etc.
Invoice number
Date
Property
Service
```

Then:

```text
Line items
Taxes / fees
Total
Payment reference
```

Then:

```text
Download / view invoice
Support
```

Keep the document visually clean enough that it can later map to a PDF representation.

---

# 33. Property dashboard design

Property history is a Fixify differentiator and should not be hidden under an “account” screen.

Recommended structure:

```text
Property header
Address
Property type
Since / tenure metadata if available

Systems / assets

Open maintenance issues

Upcoming maintenance

Recent service history

Documents
Invoices
```

## Asset presentation

Examples:

```text
AC unit
Water heater
Electrical panel
Kitchen plumbing
Appliance
```

Each asset can show:

```text
status
last service
next due date if supported
recent related jobs
documents
```

Avoid making it look like an IoT dashboard unless real IoT data exists.

---

# 34. Service history design

Use a chronological, human-readable log.

Each record may show:

```text
Date
Service
Problem
Work completed
Professional
Parts / materials
Cost
Invoice
Evidence
```

The history should feel like a reliable household maintenance record.

This is closer to a **service logbook** than a banking transaction table.

---

# 35. Professional experience

Professional UI is operational first.

The home screen should answer:

```text
What do I have today?
What needs a response?
Where do I go next?
What is pending?
What have I earned?
```

Recommended `/pro` composition:

```text
Today summary
Urgent / new job requests
Current job
Next scheduled job
Availability
Earnings snapshot
Support
```

## Professional job screen

Display:

```text
Job reference
Customer/property context necessary for the job
Problem description
Media
Service category
Schedule
Actions
Inspection section
Quote section
Completion evidence
```

Do not overload the first screen with customer-history information that is not necessary for the job.

---

# 36. Professional mobile design

Assume many professional interactions occur on a phone.

Optimize for:

- large tap targets;
- fast scanning;
- strong primary action;
- persistent job state;
- minimal typing;
- one-handed interaction;
- clear arrival / status actions;
- camera upload;
- location/navigation handoff;
- resilient loading/offline-like states where technically appropriate.

The interface should not require the professional to hunt through menus while standing at a customer's door.

---

# 37. Admin / support design

Admin should be visually quieter and information-dense.

Use:

- sortable tables where useful;
- filters;
- status chips;
- queues;
- side drawers;
- audit/event timelines;
- search;
- bulk actions only where safe;
- permission-aware controls.

The admin dashboard should not be decorated with meaningless charts simply because charts are expected in dashboards.

Only show metrics supported by real data and useful to operational decisions.

---

# 38. Admin queue pattern

A useful operational queue pattern is:

```text
Queue title
Count
Filters

Issue
Reference
Customer
Professional
Age
State
Severity
Action
```

Selecting a row should open a focused detail drawer/page.

Use colors to identify state, not to turn every row into a traffic light.

---

# 39. Empty, loading and error states

Every production surface must have intentional states.

## Empty

Explain:

```text
What is empty
Why it is empty
What can the user do next
```

Example:

```text
No upcoming bookings

When you book a service, your next appointment will appear here.

[Describe a problem]
```

## Loading

Use skeletons that preserve actual layout proportions.

Avoid generic full-page spinners unless the entire application genuinely cannot render yet.

## Error

State:

```text
What failed
Whether the user's data is safe
What can be retried
How to get help
```

Avoid blaming the user.

---

# 40. Form design

Forms should feel like guided conversations, not forms created by database schema.

Rules:

- one label per control;
- helper text only when it helps the decision;
- inline validation close to the input;
- error messages say what to do next;
- preserve user input after validation errors;
- never clear a long form because one field failed;
- use sensible defaults only when they are actually known;
- do not preselect economically meaningful choices without reason.

---

# 41. AI conversation UI

The AI assistant should visually communicate that it is an assistant, not a technician or human representative unless a real human has joined.

Visual hierarchy:

```text
Conversation
Supporting media
Structured extracted information
Confidence / uncertainty
Suggested next actions
Escalation / human support when required
```

Avoid a generic ChatGPT clone.

Make the assistant an **intake tool embedded into Fixify's service workflow**.

A good AI panel transitions naturally from chat to structured service information.

Example:

```text
You described:
“Water leaking under my kitchen sink.”

Likely service:
Plumbing

What would help:
A photo of the pipe connection and surrounding cabinet.

[Add photo]
[Continue with Plumbing]
[Choose another service]
```

The customer remains in control of the classification and service request.

---

# 42. Trust design system

Trust elements should be distributed throughout the product.

## Professional trust

```text
Verified
Skill/category
Availability
Reviews when real
Relevant profile context
```

## Pricing trust

```text
Fixed price vs inspection vs quote
What is included
What may change
Approval required
```

## Workflow trust

```text
Current status
Next event
Timeline
Evidence
Notifications
```

## Data trust

```text
Why a photo is requested
Who can see job evidence
What is stored in property history
```

Do not make unsupported “100% safe”, “guaranteed”, or absolute trust claims.

---

# 43. Micro-interactions

Use a small set of repeated interaction signatures.

Recommended:

### Hover lift

Card moves 1–3 px with a subtle shadow/contrast change.

### Underline / line reveal

Navigation links reveal a short rule rather than a large color block.

### Status pulse

Only current operational states may use a slow pulse.

### Accordion expansion

Use height/opacity/rotation carefully; never create layout jumps that feel accidental.

### Media reveal

Image or media can clip/reveal into view when entering a section.

### Timeline progression

The active timeline node can animate once when its state becomes active.

### Toast arrival

Notification enters with a short slide/fade, then settles.

---

# 44. Scroll-triggered reveals

The ABCD reference demonstrates scroll-triggered reveals. Fixify should use the same principle with a more restrained visual vocabulary.

Recommended effects:

```text
fade + 12–20px translate
clip-path reveal for large media
line draw for technical diagrams
staggered child reveal inside feature groups
number counter only for meaningful metrics
```

Do not:

- animate every paragraph;
- cause content to appear late enough to hurt comprehension;
- rely on scroll animation for functionality;
- create motion on critical payment or confirmation actions.

Use `IntersectionObserver` or framework-equivalent behavior only when it does not interfere with server-rendered content.

---

# 45. Animated typography

Use large text as a composition tool.

Good patterns:

```text
Masked line reveal
Word-group rise
Subtle tracking normalization
Section heading clip reveal
```

Bad patterns:

```text
Typewriter headlines
Constant scrambling
Bouncy letters
Random character animation
```

Animation should preserve readability when JavaScript is delayed or disabled.

---

# 46. Expanding panels

Use expanding panels for information that is useful but not required immediately.

Good candidates:

```text
How pricing works
What the service covers
Professional details
Material options
Job event details
FAQ
Admin evidence
```

Desktop:

- hover may preview where appropriate;
- click must always work;
- do not make hover the only access path.

Mobile:

- click/tap only;
- large touch target;
- clear open/close state.

---

# 47. Horizontal reels / carousels

Use horizontal reels when the content is editorial or discovery-oriented.

Good:

```text
Service categories
Recent property activity
Professional examples
How it works steps
```

Avoid carousels for critical transactional information.

Every carousel must support:

- touch scrolling;
- keyboard navigation;
- visible controls when controls are necessary;
- meaningful focus management;
- no autoplay for essential content.

---

# 48. Responsive behavior

Design mobile-first at the component level, but allow desktop to become more expressive.

## Mobile

Prioritize:

```text
single-column flow
large action zones
sticky contextual CTA where useful
bottom-sheet patterns
full-screen drawers
compressed metadata
```

## Tablet

Use:

```text
2-column opportunities
wider cards
side-by-side detail where useful
```

## Desktop

Use:

```text
editorial split layouts
wide visual media
persistent navigation
side-by-side panels
rich timeline/detail views
```

Do not simply shrink desktop into mobile.

---

# 49. Responsive breakpoint guidance

Suggested baseline:

```text
< 640px       mobile
640–767px     large mobile
768–1023px    tablet
1024–1279px   desktop
1280px+       wide desktop
```

These are implementation guidelines, not reasons to create five different designs.

The design should remain coherent between breakpoints.

---

# 50. Accessibility requirements

Accessibility is part of the visual design, not a separate QA phase.

Required:

- semantic HTML;
- visible keyboard focus;
- sufficient contrast;
- accessible labels;
- form errors associated with controls;
- dialogs with correct focus behavior;
- Escape to close dismissible overlays;
- no hover-only essential interactions;
- touch targets approximately 44px or larger where practical;
- status changes exposed accessibly;
- reduced-motion support;
- no information communicated by color alone.

---

# 51. Reduced-motion support

The ABCD reference explicitly includes reduced-motion handling and Fixify should retain this quality bar.

Use:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

In JavaScript, motion-dependent behaviors must also respect a reduced-motion preference.

When reduced motion is enabled:

- show final visual states immediately;
- remove parallax;
- stop decorative loops;
- stop non-essential camera movement;
- replace elaborate panel transitions with immediate state changes.

Do not remove essential state communication.

---

# 52. Motion budget

Motion should have a budget.

A screen should generally have:

```text
1 primary entrance behavior
1–3 supporting micro-interactions
0–1 ambient loop
```

Critical operational pages should use less motion than the marketing homepage.

The more important the transaction, the quieter the motion should become.

---

# 53. Loading and performance rules for visual effects

Visual quality must not create a slow product.

Rules:

- prefer CSS transforms/opacity for common motion;
- use `will-change` sparingly;
- lazy-load non-critical media;
- use responsive image sizes;
- pause off-screen canvas/animation where applicable;
- do not continuously render WebGL when the hero is not visible;
- provide a static fallback for complex visual effects;
- avoid shipping a large animation library solely for a few reveals.

The ABCD HTML demonstrates performance-conscious behavior such as intersection-triggered canvas painting and visibility-aware animation. Use that principle, not necessarily its implementation.

---

# 54. Dark surfaces

Dark graphite panels are allowed and useful for visual rhythm.

Good candidates:

- hero overlays;
- key brand moments;
- timeline summary;
- strong CTA bands;
- professional operational status modules;
- selected technical diagrams.

Do not make the entire app dark unless separately designed as a deliberate theme.

Dark surfaces must retain readable contrast and accessible focus states.

---

# 55. Data visualization

Charts are optional, not default.

Use charts only when the user needs trends or comparisons.

Customer:

```text
maintenance spend over time
upcoming service schedule
asset/service history
```

Professional:

```text
earnings trend
job volume
acceptance / completion metrics where useful
```

Admin:

```text
job volume
response time
queue aging
disputes
service mix
```

Do not manufacture “analytics” on the customer homepage merely to make the dashboard feel sophisticated.

---

# 56. Prototype vs production data

The prototype can use synthetic data to demonstrate layout and interaction.

However:

```text
Synthetic data must be obvious to developers.
Production UI must never silently depend on synthetic fixtures.
```

When implementing production routes from the prototype:

```text
Prototype fixture
      ↓
Typed domain model
      ↓
Supabase query / server action
      ↓
Real state
```

Do not preserve hard-coded examples in production because they make the UI look complete.

---

# 57. Prototype file set

The prototype should eventually be represented as a family of screens, not one oversized HTML file.

Recommended design prototype set:

```text
prototype/
├── 01-home.html
├── 02-services.html
├── 03-service-detail.html
├── 04-how-it-works.html
├── 05-professionals.html
├── 06-help.html
├── 07-customer-dashboard.html
├── 08-problem-intake.html
├── 09-booking.html
├── 10-active-job.html
├── 11-quote-approval.html
├── 12-property.html
├── 13-invoice.html
├── 14-support.html
├── 15-pro-dashboard.html
├── 16-pro-job.html
├── 17-pro-availability.html
├── 18-pro-earnings.html
├── 19-admin-overview.html
├── 20-admin-jobs.html
├── 21-admin-professionals.html
├── 22-admin-verification.html
├── 23-admin-pricing.html
├── 24-admin-payments.html
├── 25-admin-complaints.html
└── assets/
```

These files are **visual prototypes / references**. They are not a second production frontend.

---

# 58. Production Next.js mapping

Section 42 of the implementation guide becomes the production architecture.

The design prototype maps to:

```text
src/app/
├── (marketing)/
│   ├── page.tsx
│   ├── services/
│   ├── how-it-works/
│   ├── professionals/
│   └── help/
│
├── (auth)/
│   ├── login/
│   ├── register/
│   └── forgot-password/
│
├── auth/
│   └── callback/
│
├── app/
│   ├── page.tsx
│   ├── assistant/
│   ├── services/
│   ├── requests/new/
│   ├── bookings/
│   ├── properties/
│   ├── history/
│   ├── payments/
│   ├── invoices/[id]/
│   ├── support/
│   └── profile/
│
├── pro/
│   ├── page.tsx
│   ├── onboarding/
│   ├── jobs/
│   ├── availability/
│   ├── earnings/
│   ├── profile/
│   └── support/
│
└── admin/
    ├── page.tsx
    ├── jobs/
    ├── customers/
    ├── professionals/
    ├── verification/
    ├── services/
    ├── pricing/
    ├── payments/
    ├── complaints/
    └── analytics/
```

Use route groups to separate layout behavior without exposing implementation-only route names in the URL.

---

# 59. Production component mapping

Use:

```text
src/components/
├── ui/
├── marketing/
├── customer/
├── professional/
├── admin/
├── booking/
├── jobs/
├── property/
└── ai/
```

Suggested cross-surface ownership:

```text
ui/
    generic primitives only

marketing/
    public editorial components

customer/
    customer-facing application components

professional/
    professional operational components

admin/
    administrative components

booking/
    booking stepper, schedule, confirmation

jobs/
    timeline, status, job summary, events

property/
    property overview, assets, history

ai/
    assistant, intake, structured suggestions, media context
```

Do not put business logic inside visual components.

---

# 60. Server/client boundary

The visual implementation must follow Next.js server/client boundaries.

Use server components by default where interactivity is not required.

Use client components for:

- menus;
- accordions;
- drag/drop upload;
- interactive intake;
- rich timeline interaction;
- booking stepper;
- dialogs/drawers;
- realtime status updates;
- small visual effects requiring client APIs.

Do not convert entire route trees to client components simply because one component needs interaction.

---

# 61. Design tokens implementation

Centralize the system in:

```text
src/styles/
  tokens.css
  motion.css
  globals.css
```

or the project's equivalent global Tailwind/theme configuration.

At minimum define:

```text
colors
spacing
radius
shadows
font families
font sizes
line heights
z-index layers
motion durations
motion easing curves
```

Do not scatter arbitrary hex values through components.

---

# 62. Iconography

Use one coherent icon family.

Lucide-style line icons are suitable for product UI, provided they are used consistently.

Rules:

- icons support labels rather than replace them where meaning is ambiguous;
- use consistent stroke width;
- do not mix multiple icon families;
- avoid decorative icon clutter;
- service illustrations can be more expressive than utility icons.

---

# 63. Service category iconography

Service categories may use custom icon/illustration treatments.

Suggested visual concepts:

```text
Electrical       circuit / switch / plug
Plumbing         pipe / valve / drop
AC & Cooling     airflow / vent / coil
Appliances       appliance silhouette
Carpentry        joint / saw / timber
Painting         brush / roller / surface
Cleaning         cloth / sparkle / surface
Renovation       plan / room outline / layered structure
```

Avoid generic emoji as the final production visual language.

---

# 64. Copywriting style

Fixify UI copy should be:

```text
Plain
Direct
Reassuring
Specific
Short
Honest about uncertainty
```

Prefer:

```text
We need a little more detail

A technician will inspect this before repair pricing is confirmed

Your professional is on the way

Additional work needs your approval
```

Avoid:

```text
Our AI has definitively diagnosed your issue

Premium intelligent service orchestration

Execute workflow

Your request has been processed successfully
```

The user should feel spoken to by a thoughtful service company, not a software API.

---

# 65. Notifications in the UI

Use `NOTIFICATION_SPEC.md` as the behavioral authority.

Visual rules:

- notification bell/icon is secondary, not the main product navigation;
- unread state should be visible but restrained;
- notifications should identify the event and the next action;
- clicking a notification should deep-link to the relevant object when appropriate;
- payment / quote / job changes deserve stronger visual treatment than low-value informational messages;
- do not use red for all unread notifications.

Example:

```text
Additional work needs approval

Your professional found an issue that requires an updated quote.

[Review quote]
```

---

# 66. Errors involving sensitive actions

For:

```text
Approve quote
Cancel booking
Pay
Submit complaint
Accept professional job
Change availability
```

provide confirmation feedback.

For destructive actions, show:

```text
what will happen
whether the action can be undone
what financial consequence may apply if relevant
```

Do not hide meaningful consequences under vague modal copy.

---

# 67. Feedback and confirmation states

A successful action should create an unmistakable but calm acknowledgement.

Examples:

```text
Booking confirmed

Quote approved

Payment received

Complaint submitted

Availability updated
```

Where useful, show the next step immediately.

Example:

```text
Quote approved

The professional can now proceed with the approved work.

[View job]
```

---

# 68. Security-sensitive UI boundaries

The design must not expose backend security mechanisms as if they were user-facing workflow.

Never display:

- service-role credentials;
- internal policy secrets;
- raw database IDs unnecessarily;
- internal audit implementation details to customers;
- hidden verification documents without authorization.

Human-readable references such as `FX-4790` or invoice numbers are fine where intentionally designed.

---

# 69. Job status color mapping

Use semantic state colors consistently.

Baseline:

| State family | Visual treatment |
|---|---|
| Neutral / requested | muted graphite / neutral |
| Assigned / accepted | teal-tinted neutral |
| Travel / active | stronger teal |
| Inspection / approval | rust / amber attention |
| Completed | success |
| Cancelled / expired | neutral muted |
| Disputed / critical | danger |
| Suspended | danger + clear text |

Never rely on color alone. Always include label/icon/text.

---

# 70. Responsive sticky actions

On mobile transactional pages, a sticky bottom action may be used for:

```text
Continue
Confirm booking
Approve quote
Pay
Submit complaint
```

The sticky action must:

- respect safe-area insets;
- not hide content;
- clearly state the action;
- become disabled when the action is not valid;
- communicate loading state without layout jumps.

Do not use a sticky CTA on every screen.

---

# 71. Dialogs, drawers and sheets

Use the smallest overlay that fits the task.

```text
Tooltip / popover  -> small clarification
Dialog             -> confirmation / focused action
Drawer             -> operational detail
Bottom sheet       -> mobile selection/action
Full-screen        -> complex mobile workflow
```

Avoid nested overlays.

---

# 72. Content density by surface

```text
Marketing       low density / large rhythm
Customer        medium density / task-first
Professional    medium-high density / action-first
Admin           high density / information-first
```

A common mistake is applying one density level to all four surfaces.

---

# 73. Design states matrix

Every reusable component should consider:

```text
Default
Hover
Focus
Pressed
Disabled
Loading
Success
Error
Empty
Selected
```

Not every state applies to every component, but critical controls must have complete interaction states.

---

# 74. Data freshness and realtime indicators

Where Realtime is used, visual status should communicate freshness without being noisy.

Examples:

```text
Updated just now
Live
Waiting for professional
Payment verification in progress
```

Do not show fake “Live” indicators on static prototype data without making it clear that the prototype is synthetic.

---

# 75. Prototype realism rules

The prototype should feel real enough to evaluate product behavior, but not pretend that non-existent backend features already work.

Synthetic prototype may simulate:

- job progress;
- notifications;
- quote opening;
- booking steps;
- service filtering;
- property history expansion;
- professional selection.

Prototype may not falsely imply:

- a real payment was taken;
- a real professional was verified;
- an AI diagnosis is medically/technically certain;
- GPS tracking is live when it is not;
- a complaint has actually been submitted to a real support queue.

---

# 76. What to borrow from the current HTML reference

The supplied `abcd (1).html` demonstrates several patterns worth carrying into Fixify:

### Keep

- strong hero composition;
- visual depth without excessive decoration;
- scroll-triggered headline reveals;
- responsive mobile menu;
- hover transitions on desktop;
- expandable service/panel sections;
- visual project/service reels;
- technical line/grid graphics;
- custom visual scenes/canvas where justified;
- fallback behavior for visual effects;
- visibility-aware animation;
- reduced-motion support;
- careful keyboard/overlay behavior;
- progressive image/canvas loading.

### Do not copy

- construction company positioning;
- “projects” as the primary product model;
- builder/contractor language;
- fictional construction statistics;
- ABCD/Creacon/Artra branding;
- construction portfolio information architecture;
- gold luxury styling as a central Fixify identity;
- contact flow designed around large construction projects.

---

# 77. Visual craftsmanship standard

The prototype should pass this test:

> Could a strong human product designer plausibly have made this interface without anyone noticing that an AI generated it?

To reach that standard:

- vary composition intentionally;
- use asymmetry where it helps;
- avoid repeating identical cards across every section;
- give large spaces a reason to exist;
- use realistic copy lengths;
- avoid excessive badges;
- avoid excessive gradients;
- avoid gratuitous rounded containers;
- use whitespace confidently;
- make typography do part of the design work;
- use imagery sparingly but well;
- build visual rhythm across a page rather than decorating individual blocks.

The design should look **authored**, not assembled.

---

# 78. Avoiding AI-generated visual clichés

Kiro / frontend agents must actively avoid:

```text
purple-blue gradient hero
huge center-aligned headline + three cards
floating glassmorphism blobs
random dashboard charts
five-column icon grid
identical rounded cards everywhere
excessive badges
AI sparkle icons on every AI feature
huge drop shadows
neon borders
excessive glassmorphism
stock-photo smiling people pointing
```

A contemporary interface is not automatically good because it contains gradients, glass, animations, or cards.

---

# 79. Design quality checklist for every page

Before considering a page complete, verify:

### Product

- Is the user's goal obvious?
- Is the next action obvious?
- Is important context visible?
- Are uncertainty and pricing rules represented honestly?

### Visual

- Does the page have a clear visual hierarchy?
- Is composition more varied than a generic card grid?
- Is whitespace intentional?
- Does the palette remain restrained?
- Are typography and imagery carrying real design work?

### Interaction

- Are hover/focus/pressed states present?
- Are expanding areas accessible?
- Does mobile have a deliberate layout?
- Is motion purposeful?

### Accessibility

- Can keyboard users operate it?
- Can screen readers understand the state?
- Is contrast adequate?
- Does reduced motion work?

### Engineering

- Does the component fit the Next.js ownership model?
- Is data real or clearly synthetic?
- Is server-authoritative behavior preserved?
- Is business logic kept outside presentational components?

---

# 80. Page-specific implementation checklist

## `/`

Must include:

- distinct hero;
- problem-first entry;
- service discovery;
- explanation of trust/process;
- property-history differentiator;
- professional CTA;
- help entry;
- strong final CTA.

Should feel:

```text
confident + human + refined
```

## `/services`

Must include:

- searchable/filterable service discovery where useful;
- category hierarchy;
- clear service descriptions;
- non-promotional information density.

## `/services/:slug`

Must include:

- service explanation;
- pricing model;
- what is included;
- when inspection may be required;
- materials/options when relevant;
- booking CTA.

## `/how-it-works`

Should visually explain:

```text
Problem → Understanding → Professional → Approval → Fix → History
```

Use motion / diagrams rather than a plain six-card section.

## `/professionals`

Show:

- who professionals are;
- verification concept;
- professional workflow;
- earning/work benefits only when supported by product decisions;
- onboarding CTA.

## `/help`

Prioritize:

- searchable help;
- booking/payment/job support paths;
- contact options;
- common issue categories.

## `/app`

Must show:

- greeting/profile context;
- Describe Problem CTA;
- popular services;
- upcoming booking;
- property summary;
- recent service history.

No fake analytics.

## `/app/assistant`

Must feel conversational but structured.

## `/app/requests/new`

Must support:

- text;
- photo;
- video;
- clear progression;
- AI assistance without AI authority.

## `/app/bookings`

Show upcoming/past bookings as service records, not generic calendar cards.

## `/app/bookings/:id`

Primary job detail / operational page.

## `/app/properties`

Property cards should feel like durable records, not subscription dashboard tiles.

## `/app/properties/:id`

Deep property record with assets/history/documents.

## `/app/history`

Chronological maintenance log.

## `/app/payments`

Payment activity with strong state clarity.

## `/app/invoices/:id`

Invoice detail optimized for comprehension and later PDF parity.

## `/app/support`

Complaints + support status with evidence attachments where supported.

## `/pro`

Today-first operations.

## `/pro/jobs`

Fast job list with urgency, schedule, and response action.

## `/pro/jobs/:id`

Job lifecycle as a controlled state flow.

## `/pro/availability`

Simple schedule editing with clear consequences.

## `/pro/earnings`

Readable payout history and trend information.

## `/pro/profile`

Skills, verification status, service areas, account details.

## `/admin`

Operational summary only.

## `/admin/jobs`

Queue + filters + detail.

## `/admin/customers`

Search + customer record.

## `/admin/professionals`

Professional management + performance context.

## `/admin/verification`

Verification queue with evidence access governed by RBAC.

## `/admin/services`

Catalogue management.

## `/admin/pricing`

Pricing configuration view; permissions and audit matter.

## `/admin/payments`

Transaction/reconciliation view.

## `/admin/complaints`

Investigation-focused complaint queue.

## `/admin/analytics`

Real operational analytics only.

---

# 81. Golden customer journey visual test

The prototype must be able to demonstrate this journey visually without dead ends:

```text
Customer opens Fixify
        ↓
Describe the problem
        ↓
Adds text/photo
        ↓
AI-assisted likely category
        ↓
Customer confirms service
        ↓
Selects property
        ↓
Chooses date/time
        ↓
Sees pricing model
        ↓
Sees matched professional
        ↓
Confirms booking
        ↓
Active job timeline
        ↓
Professional arrives
        ↓
Inspection
        ↓
Quote appears
        ↓
Customer approves
        ↓
Work in progress
        ↓
Completion evidence
        ↓
Payment / invoice
        ↓
Review
        ↓
Property history updated
```

This is the central design validation path.

---

# 82. Golden professional journey visual test

```text
Professional opens app
        ↓
Sees request
        ↓
Reviews problem/media
        ↓
Accepts
        ↓
Travels
        ↓
Arrives
        ↓
Inspects
        ↓
Creates quote if required
        ↓
Customer approval
        ↓
Performs work
        ↓
Uploads completion evidence
        ↓
Marks completion
        ↓
Sees resulting earnings/settlement state
```

The UI must make the state transition obvious at each stage.

---

# 83. Prototype interaction inventory

The prototype should demonstrate at least:

```text
Scroll reveal
Hero typography entrance
Responsive navigation
Mobile full-screen menu
Hover card state
Expanding panel
Accordion
Service filtering
Horizontal reel / carousel
Media upload preview
Booking step progression
Professional selection
Job timeline
Quote expansion
Approval confirmation
Notification panel
Property history expansion
Responsive tables / lists
Modal / drawer
Reduced-motion mode
```

The goal is not to demonstrate every possible UI pattern. The goal is to demonstrate Fixify's most important product interactions at a professional level.

---

# 84. Interaction anti-patterns

Do not use:

- autoplaying audio;
- endless scrolling on operational screens;
- aggressive cursor effects;
- fake loading delays;
- fake progress bars that imply real backend work;
- hidden click targets;
- hover-only data;
- modal chains;
- animation during payment confirmation;
- decorative motion near critical destructive controls;
- inaccessible custom controls.

---

# 85. Production conversion rule

The visual prototype is an **evaluation artifact**.

When converting to Next.js:

```text
Do not copy HTML blindly.

Extract:
  visual tokens
  component patterns
  layout patterns
  interaction behavior
  content hierarchy

Then implement them using:
  React
  TypeScript
  Tailwind / project styling
  Server Components where appropriate
  Client Components where required
  Supabase-backed real data
```

The prototype must not become a separate production frontend to maintain forever.

---

# 86. Kiro operating rules

Kiro must:

1. Read this document before implementing the UI.
2. Read `PRODUCT_DECISIONS.md`, `OPEN_DECISIONS.md`, `DATA_MODEL.md`, `RBAC.md`, and `STATE_MACHINES.md` before building authenticated screens.
3. Read `AI_SPEC.md` before building AI UI.
4. Read `PAYMENT_SPEC.md` before building payment/invoice UI.
5. Read `NOTIFICATION_SPEC.md` before building notification UI.
6. Treat this file as the visual source of truth.
7. Reuse shared tokens and components instead of creating one-off styles.
8. Never invent unsupported business promises to make a page look complete.
9. Never use fake analytics on customer screens.
10. Never make client-calculated financial values appear authoritative.
11. Never create an independent frontend-only job state machine.
12. Never expose privileged backend data through convenience UI.
13. Preserve accessibility and reduced-motion requirements.
14. Prefer human-readable copy.
15. Prefer design decisions that remain coherent across desktop and mobile.

---

# 87. What Kiro may decide without product approval

Kiro may decide:

- exact spacing values within the defined system;
- component extraction boundaries;
- CSS implementation details;
- animation timing within the motion budget;
- whether a pattern belongs in a shared component;
- exact breakpoint adjustments;
- accessible implementation details;
- loading skeleton geometry;
- icon choice within the iconography system;
- technically necessary responsive adaptations.

---

# 88. What Kiro must NOT decide through design

Kiro must not silently decide:

- launch city;
- service prices;
- commission;
- taxes/fees;
- cancellation/refund policy;
- warranty promises;
- professional compensation rules;
- final verification standards;
- customer eligibility rules;
- membership benefits;
- B2B contract terms;
- AI confidence policy;
- payment success logic;
- payment/refund authority;
- who can approve/dispute/override business outcomes.

These belong to the relevant product/engineering specifications.

---

# 89. Design handoff format

When a visual prototype screen is considered complete, record:

```text
Screen
Purpose
Primary user
Primary action
Secondary actions
Required states
Responsive notes
Motion notes
Accessibility notes
Data source
Prototype-only behavior
Production component candidates
```

This prevents a beautiful prototype from becoming impossible to implement consistently.

---

# 90. Definition of done — visual prototype

A prototype surface is complete when:

```text
The hierarchy is clear
The content feels realistic
The key interaction is demonstrable
Desktop works
Mobile works
Reduced motion works
Keyboard behavior is intentional
Empty/loading/error states are represented where relevant
No fake business promise is implied
The page looks authored rather than templated
```

---

# 91. Definition of done — production UI

A production UI surface is complete when:

```text
Real Supabase-backed data is used where required
RLS/RBAC assumptions are respected
Authoritative server state drives the UI
Business transitions use approved server/database operations
Loading/error/empty states are complete
Realtime is used only where required
Notifications link to real objects
Accessibility passes baseline review
Responsive behavior is tested
Reduced motion works
No debug fixtures remain
No hard-coded business values remain
```

---

# 92. Recommended implementation sequence from Section 42 onward

This document supports the guide's customer-first approach.

Build visually and technically in this order:

```text
01  Shared design tokens
02  Global UI primitives
03  Marketing shell
04  Customer application shell
05  /app dashboard
06  Problem intake
07  Service browse
08  Booking flow
09  Active job
10  Quote approval
11  Property
12  Invoice
13  Review / support
14  Professional shell
15  Professional jobs
16  Professional availability
17  Professional earnings
18  Admin shell
19  Admin operational queues
20  Notifications / realtime polish
21  Loading / error / empty states
22  Accessibility pass
23  Reduced-motion pass
24  Visual refinement pass
25  Golden end-to-end journey
```

Do not attempt to perfect every surface before the customer golden path exists.

---

# 93. Section 42 readiness checklist

Before creating the production Next.js structure, confirm:

- [ ] This design system is loaded.
- [ ] Product decisions are loaded.
- [ ] Open decisions are loaded.
- [ ] Data model is loaded.
- [ ] RBAC is loaded.
- [ ] State machines are loaded.
- [ ] AI spec is loaded for AI screens.
- [ ] Payment spec is loaded for financial screens.
- [ ] Notification spec is loaded for notification surfaces.
- [ ] Prototype reference has been reviewed for visual craft.
- [ ] Generic template UI has been rejected.
- [ ] The customer golden path is the first production priority.

---

# 94. Final design directive

Build Fixify as a **real service product with a visual identity**, not a set of attractive mockups.

The interface should repeatedly communicate:

```text
I understand your problem.

I am not pretending to know more than I do.

Here is what happens next.

Here is who is responsible.

Here is what has been approved.

Here is what changed.

Here is what you paid for.

Here is the record of what was done.
```

The prototype should be visually ambitious enough to set a high bar, but restrained enough that the final Next.js application remains fast, accessible, maintainable, and believable.

The design quality target is:

> **Human-authored, product-first, technically precise, visually memorable, commercially honest.**

