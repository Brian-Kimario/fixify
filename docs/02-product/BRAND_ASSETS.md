# FIXIFY — BRAND ASSETS, VISUAL LANGUAGE & UI DESIGN SYSTEM

**Status:** Implementation-ready design source of truth  
**Version:** 2.0  
**Last updated:** 2026-09-23  
**Primary target:** Next.js + React + TypeScript + Tailwind + Supabase  
**Audience:** Kiro, frontend agents, product/design collaborators, future human designers

---

## 0. What this document is actually deciding

The previous prototype-derived asset sheet mixed together two different things:

1. **What should be preserved from the prototype** — mainly the Fixify mark/symbol geometry and the general feeling of technical precision.
2. **What was merely a prototype implementation choice** — its dark-only palette, mint color, Space Grotesk/Inter pairing, exact radii, spacing, and some generic UI patterns.

This document corrects that distinction.

### Locked from the prototype

- Fixify symbol geometry.
- Fixify wordmark concept.
- Symbol + wordmark lockup relationship.
- Stroke-based icon language.
- The idea that the brand can combine **property + connection + intelligence** without becoming a literal house illustration.
- The ambition for restrained motion, strong composition, and technical visual details.

### Not locked from the prototype

- Dark mode as the primary theme.
- Mint as the primary brand color.
- Space Grotesk as the brand font.
- Inter as the body font.
- Exact color hex values from the prototype.
- Exact prototype spacing/radius values.
- Generic pill-button treatment everywhere.
- Card-heavy information architecture.
- Construction-style visual language.
- Decorative 3D/canvas visuals on every page.

### New design direction

Fixify should feel like a **well-designed service company that happens to have excellent software**, not a software startup pretending to be a repair company.

The interface should therefore combine:

- warmth of a real household;
- precision of professional service operations;
- calmness when something in the customer's property has gone wrong;
- enough technical detail for trust;
- enough visual character to be memorable;
- almost no ornamental UI that does not help the customer act.

---

# 1. Source-of-truth hierarchy

When visual instructions conflict, use this order:

```text
1. Current Fixify business definition
2. FIXIFY_MASTER_BLUEPRINT.md
3. PRODUCT_DECISIONS.md
4. OPEN_DECISIONS.md
5. DESIGN_BRIEF.md
6. BRAND_ASSETS.md  ← visual implementation authority
7. DATA_MODEL.md / RBAC.md / STATE_MACHINES.md / AI_SPEC.md /
   PAYMENT_SPEC.md / NOTIFICATION_SPEC.md for product-state semantics
8. PROJECT BRIEF - FIXIFY.docx for original framing
9. Prototype HTML for visual inspiration only
10. Framework defaults
```

A visual pattern must never imply a business rule that does not exist in the product documents.

Examples:

- A green status treatment must not imply a completed payment when payment is only initiated.
- An AI confidence indicator must not visually imply that an AI assessment is a technical diagnosis.
- A professional verification badge must only appear when the underlying verification state permits it.
- A price must not be presented as final when the active service uses inspection/quote pricing.

---

# 2. Brand idea

## 2.1 The central idea

**Fixify turns a messy property problem into a clear next step.**

The brand should visually express the movement:

```text
uncertain problem
      ↓
clear understanding
      ↓
trusted person
      ↓
visible progress
      ↓
finished record
```

The visual system should therefore prefer:

- lines that connect;
- frames that guide;
- structured layers;
- before/after states;
- quiet movement from one point to another;
- small human details;
- material-inspired warmth;
- useful technical annotations.

Avoid visual metaphors that feel detached from home services.

---

# 3. Brand personality

Fixify should be:

### Warm

The user may have a broken appliance, a leak, a power problem, or damage in their home. The UI should reduce tension, not increase it.

### Capable

Use confident hierarchy and precise microcopy. Never compensate for uncertainty with visual bravado.

### Transparent

Pricing, professional status, quote status, next actions, and uncertainty should be visible.

### Human

Use natural language and visual moments that feel editorial and tactile rather than machine-generated.

### Contemporary

The interface can be sophisticated, but it must remain understandable at a glance.

### Distinctive

Differentiation should come from composition, color relationships, typography, icon geometry, motion, and information choreography — not from excessive gradients, glassmorphism, or 3D decoration.

---

# 4. Design anti-patterns — do not let Kiro drift here

Never default to the following without a strong product reason:

```text
❌ Purple/blue AI gradients
❌ Dark dashboard as the default for every surface
❌ “AI magic” sparkles around every AI control
❌ Three identical cards in every section
❌ Giant centered headline + 3 cards + logo wall
❌ Pill-shaped containers everywhere
❌ Floating gradient blobs
❌ Glassmorphism as the main visual language
❌ Excessive drop shadows
❌ Excessive border radius
❌ Fake metrics or fake social proof
❌ Fake map movement when there is no live location
❌ Fake real-time job status
❌ Decorative charts with no operational meaning
❌ Stock-house illustrations that look interchangeable
❌ Generic chatbot UI copied from an AI assistant product
❌ Every button doing a “magnetic” animation
❌ Every section entering with the same fade-up animation
❌ Monochrome UI where status is impossible to distinguish
❌ Tiny grey text that users cannot comfortably read
❌ All-caps everywhere
❌ Overuse of monospace typography
```

### What to use instead

```text
✅ Light-first customer experience
✅ Warm neutrals
✅ Deep ink with readable secondary text
✅ One strong brand accent
✅ A restrained warm secondary accent
✅ Semantic status colors
✅ Editorial composition
✅ Real product states
✅ Dense-but-readable operational layouts
✅ Short purposeful animations
✅ Custom symbol/diagram details
✅ Layered surfaces rather than endless cards
✅ Human language
```

---

# 5. Color system — new Fixify palette

The palette is intentionally different from the prototype's mint-on-black scheme.

Fixify's base environment should feel like a **clean, warm home surface with graphite tools and a quiet green-blue signal**.

## 5.1 Core color tokens

```css
:root {
  /* Foundations */
  --fx-porcelain: #F7F4EC;
  --fx-paper: #FFFEFA;
  --fx-paper-2: #F1EEE5;
  --fx-sand: #E7E1D5;

  /* Ink */
  --fx-ink: #18211F;
  --fx-ink-2: #34413D;
  --fx-ink-3: #5A6661;
  --fx-ink-4: #7C8681;

  /* Brand */
  --fx-teal: #176B5B;
  --fx-teal-deep: #0D5144;
  --fx-teal-soft: #E2EEE9;
  --fx-teal-wash: #EFF6F2;

  /* Warm accent */
  --fx-clay: #A9523D;
  --fx-clay-soft: #F3E1DA;

  /* Secondary warm signal */
  --fx-ochre: #9B6A1E;
  --fx-ochre-soft: #F5EBD7;

  /* Supporting information */
  --fx-blue: #416B84;
  --fx-blue-soft: #E6EEF2;

  /* Semantic status */
  --fx-success: #2F7D5B;
  --fx-success-soft: #E3F0E8;
  --fx-warning: #9B6A1E;
  --fx-warning-soft: #F5EBD7;
  --fx-danger: #B94A43;
  --fx-danger-soft: #F6E3E1;
  --fx-info: #416B84;
  --fx-info-soft: #E6EEF2;

  /* Structure */
  --fx-line: #D9DED8;
  --fx-line-strong: #C7CEC8;
  --fx-focus: #176B5B;
}
```

## 5.2 Color roles, not isolated colors

Kiro should consume **semantic variables**, not scatter raw hex codes through components.

Recommended semantic layer:

```css
--background: var(--fx-porcelain);
--background-subtle: var(--fx-paper-2);
--surface: var(--fx-paper);
--surface-raised: #FFFFFF;
--foreground: var(--fx-ink);
--foreground-muted: var(--fx-ink-3);
--foreground-faint: var(--fx-ink-4);
--border: var(--fx-line);
--border-strong: var(--fx-line-strong);
--primary: var(--fx-teal);
--primary-strong: var(--fx-teal-deep);
--primary-soft: var(--fx-teal-soft);
--accent: var(--fx-clay);
--accent-soft: var(--fx-clay-soft);
```

## 5.3 Why this palette works for Fixify

### Warm neutral foundation

The customer sees a home-service product. A warm porcelain background is more inviting than a pure software-grey canvas and gives the brand a physical/material association without pretending to be an interior-design company.

### Deep graphite ink

Avoid absolute black as the default. Very dark green-graphite carries warmth while keeping text extremely clear.

### Teal as the primary action color

The teal-green is intended to communicate **reliability, progress, and care**, not “AI”. It should be concentrated around primary actions and meaningful product signals.

### Clay as the human accent

Clay is used sparingly for expressive moments: selected states, editorial emphasis, photographs/illustration overlays, or a meaningful secondary action. It should not compete with the primary CTA.

### Ochre for attention, not decoration

Ochre is reserved for warnings, pending decisions, inspection/quote states, and small highlight details.

### Blue is supporting, not the brand identity

Blue can communicate informational/technical states and is allowed in diagrams, maps, operational data, and secondary information without turning Fixify into another generic blue SaaS product.

---

# 6. Accessibility rules for color

Color must never be the sole carrier of meaning.

Every status should combine at least two signals:

```text
color + label
color + icon
color + position/state
```

Examples:

```text
✓ Completed
! Awaiting approval
△ Disputed
→ On the way
```

Do not use low-contrast grey text for body content simply because it looks “minimal”.

Use the darker ink tokens for normal reading text and reserve the faintest token for metadata only.

Primary interactive states must include a visible focus treatment.

Do not rely on raw color contrast assumptions from the prototype. Final production colors should be checked using the rendered component/background combination, including disabled, hover and focus states.

---

# 7. Light and dark surfaces

## 7.1 Customer experience — light first

Default:

```text
Warm porcelain page
White/warm white surfaces
Deep graphite text
Teal actions
Muted clay accents
```

This should be the primary customer visual environment.

## 7.2 Operational dark surfaces

Professional/admin interfaces may use deeper surfaces selectively where information density benefits from it, but dark mode must not become an automatic “developer dashboard” look.

Dark operational token direction:

```css
--dark-bg: #18211F;
--dark-surface: #22302B;
--dark-surface-2: #293934;
--dark-line: #3B4944;
--dark-ink: #F4F1E9;
--dark-ink-muted: #B8C0BB;
--dark-primary: #74BBA6;
--dark-accent: #D58A70;
```

Use dark areas for:

- professional availability/work mode;
- selected operational queues;
- focused job panels;
- hero moments;
- data-heavy admin details where it improves focus.

Do not put the whole product in dark mode merely because dark interfaces feel premium.

---

# 8. Gradient policy

Gradients are allowed only when they describe a real lighting/material relationship.

Good:

```text
subtle warm photograph overlay
hero depth shading
surface illumination
map/diagram depth
```

Bad:

```text
purple → blue AI gradient
teal → lime CTA gradient
rainbow background
blob gradients behind every heading
```

Most Fixify screens should work perfectly without gradients.

---

# 9. Typography system

Typography from the prototype is **not a brand requirement**.

## 9.1 Direction

Use a modern, humanist sans-serif for the product interface. The exact font family can change without redesigning the system.

### Recommended starting stack

```text
Primary UI: Instrument Sans
Fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Technical metadata: DM Mono or ui-monospace
Optional editorial accent: Source Serif 4, used sparingly
```

### Important

Do not force the optional editorial font into dashboard screens. It exists for moments where the brand needs warmth or personality, such as selected marketing headlines, testimonials, editorial property notes, or human-centered explanatory copy.

The logo/wordmark is a brand asset and should not depend on the interface font.

---

# 10. Type hierarchy

Use responsive type, but avoid oversized startup-style headlines on every page.

```text
Display XL     clamp(44px, 6vw, 84px)
Display L      clamp(36px, 4.8vw, 64px)
Heading 1      clamp(30px, 3.4vw, 46px)
Heading 2      clamp(24px, 2.7vw, 34px)
Heading 3      19px–22px
Body L         17px–19px
Body           15px–16px
Body Small     13px–14px
Metadata       11px–12px
```

Do not use Display XL on a screen merely because it is available.

## 10.1 Sentence case

Preferred:

```text
Describe the problem
Your next appointment
Recent service history
Awaiting your approval
```

Avoid:

```text
DESCRIBE THE PROBLEM
YOUR NEXT APPOINTMENT
RECENT SERVICE HISTORY
```

## 10.2 Line length

Reading paragraphs should generally remain around 55–75 characters per line on desktop.

Do not create huge text blocks simply to fill a card.

---

# 11. Wordmark and logo system

## 11.1 Fixify mark — preserve the prototype geometry

The following mark is the main asset extracted from the prototype. The **geometry** is retained; the prototype colors are not treated as permanent brand colors.

```svg
<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path
    d="M8 30 L24 13 L40 30"
    fill="none"
    stroke="currentColor"
    stroke-width="3.2"
    stroke-linecap="round"
    stroke-linejoin="round"/>

  <line
    x1="24" y1="13" x2="15" y2="35"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"/>

  <line
    x1="24" y1="13" x2="33" y2="35"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"/>

  <circle
    cx="24" cy="13" r="3.6"
    fill="var(--fx-teal, #176B5B)"/>
</svg>
```

### Interpretation

The mark can be read as:

```text
property / roof
      +
connected support structure
      +
intelligent point / service connection
```

Do not add extra house windows, chimneys, wifi arcs, robot eyes, AI sparkles, or wrench illustrations to the core logo.

---

# 12. Logo color variants

## Light background

```text
Stroke: --fx-ink
Node:   --fx-teal
```

## Dark background

```text
Stroke: --dark-ink
Node:   --dark-primary
```

## One-color mark

For embossing, monochrome print, legal/technical documentation, or constrained surfaces:

```text
All paths: currentColor
Node: currentColor
```

The one-color version must remain recognizable without the node contrast.

---

# 13. Logo lockup

Preferred desktop structure:

```text
[ MARK ] Fixify
```

Use a visual gap of approximately 8–12px at normal navigation sizes.

The exact wordmark typeface should not be assumed to be the prototype font. Build the lockup as a reusable React component so the wordmark treatment can evolve without changing application code.

Recommended exports:

```text
FixifySymbol
FixifyWordmark
FixifyLockup
FixifyMarkOnDark
FixifyMarkMono
```

---

# 14. Clear space and sizing

Use the height of the node circle as the internal minimum clear-space unit where possible.

Avoid visually crowding the logo with:

- utility icons;
- notification badges;
- buttons;
- dense navigation.

Recommended size guidance:

```text
Favicon / app icon     16–32px mark
Compact app header     28–34px mark
Standard navigation    32–38px mark
Marketing lockup       36–52px mark
Hero / brand feature   56px+
```

Do not enlarge the logo merely to fill an empty header.

---

# 15. Favicon / app icon

The mark can sit inside a rounded square.

Preferred direction:

```text
Background: --fx-ink
Mark:       warm white
Node:       --fx-teal / --dark-primary
Radius:     approximately 10–12px at 48px source size
```

Do not put the full wordmark inside the favicon.

Recommended files:

```text
/public/brand/fixify-mark.svg
/public/brand/fixify-mark-dark.svg
/public/brand/fixify-lockup.svg
/public/brand/fixify-favicon.svg
/public/brand/fixify-og.svg
```

---

# 16. Symbol language beyond the logo

The product can use a family of supporting symbols derived from the same visual principle:

### Line + node

For:

- connected systems;
- property relationships;
- timeline events;
- matching;
- property history.

### Frame

For:

- inspection areas;
- media evidence;
- property assets;
- document previews.

### Check path

For:

- completed steps;
- verified actions;
- approval confirmation.

### Route line / directional arrow

For:

- professional movement;
- workflow progression;
- next-step navigation.

These are supporting symbols, not alternate logos.

---

# 17. Icon system

Use stroke-based icons with a consistent geometric family.

Preferred baseline:

```css
.icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
```

At larger display sizes, stroke width can move toward 1.6–2.0px depending on the icon.

Avoid mixing:

```text
filled Material symbols
thin Lucide icons
emoji
heavy illustration icons
```

within the same interaction group.

### Core product icon vocabulary

```text
Problem / issue
Camera
Video
Microphone
Search
Wrench / repair
Electrical
Water / plumbing
Cooling / AC
Appliance
Carpentry
Painting
Cleaning
Calendar
Clock
Location
Verified / shield
Professional
Property
Asset / appliance
Quote
Receipt / invoice
Payment
Review
Support
Notification
History / timeline
Arrow / route
Check
Warning
Dispute
```

---

# 18. Service-category icons

Service icons should be slightly abstract and geometric rather than cartoon illustrations.

Example direction:

```text
Electrical → branching line / current symbol
Plumbing  → curved pipe / droplet geometry
AC        → airflow lines + unit frame
Appliance → simplified appliance silhouette
Carpentry → joint / measured angle
Painting  → brush stroke + wall edge
Cleaning  → structured sparkle used sparingly
Renovation→ layered plan / room frame
```

Do not turn the service catalogue into a children's icon set.

---

# 19. Buttons

Fixify should have only a small set of button families.

## Primary

For the single most important action in a context.

```css
.btn-primary {
  background: var(--fx-teal);
  color: #FFFFFF;
  border: 1px solid var(--fx-teal);
  min-height: 46px;
  padding: 0 18px;
  border-radius: 12px;
  font-weight: 650;
  transition:
    transform 160ms ease,
    background-color 160ms ease,
    box-shadow 160ms ease;
}
```

Hover:

```text
slight upward movement (1–2px)
subtle shadow increase
small darkening / stronger teal
```

Pressed:

```text
transform: translateY(0) scale(0.985)
```

## Secondary

For adjacent actions.

```text
warm white background
ink text
subtle border
```

## Tertiary / text

For low-emphasis navigation.

No pill background unless necessary.

## Destructive

Use only for actions whose effect is genuinely destructive or irreversible.

Never use red as a decorative accent.

---

# 20. Button shape language

Use rounded rectangles, not giant pills, for the product UI.

Recommended:

```text
Primary action     10–12px radius
Secondary action   10–12px radius
Icon button         10px radius
Tags/status pills   pill shape
Marketing special   pill allowed selectively
```

This makes Fixify feel more like a real service product and less like a template landing page.

---

# 21. Cards, panels and surfaces

The system should not use “card everything”.

Use three levels:

### Surface

Plain page region with no enclosing container.

### Panel

A clearly grouped piece of information with a border or tonal shift.

### Raised panel

Used for moments needing interaction or hierarchy: active booking, approval, payment, primary intake composer.

Recommended baseline:

```css
.panel {
  background: var(--fx-paper);
  border: 1px solid var(--fx-line);
  border-radius: 16px;
}

.panel-raised {
  background: #FFFFFF;
  border: 1px solid var(--fx-line);
  border-radius: 18px;
  box-shadow:
    0 2px 6px rgba(24, 33, 31, 0.05),
    0 18px 42px rgba(24, 33, 31, 0.07);
}
```

Avoid putting shadows on every container.

---

# 22. Surface composition

Prefer combinations such as:

```text
large open area
+ one strong panel
+ supporting metadata
+ one visual / diagram
```

over:

```text
six cards
inside three cards
inside one page card
```

Dense operational pages may be more panel-heavy because their job is clarity, not editorial beauty.

---

# 23. Forms and input fields

The input experience should feel conversational and calm.

```css
.field {
  background: var(--fx-paper);
  border: 1px solid var(--fx-line-strong);
  border-radius: 12px;
  min-height: 48px;
  padding: 12px 14px;
  color: var(--fx-ink);
}
```

Focus:

```text
border becomes --fx-focus
optional 0 0 0 3px focus ring using a low-opacity teal
```

Placeholder text should be readable but visually secondary.

Do not make input fields look like dark code editors.

---

# 24. Problem-intake composer

This is one of Fixify's signature UI patterns.

The customer should see a large, welcoming interaction rather than a traditional form dumped on one screen.

Recommended structure:

```text
What needs fixing?

[ Tell us what you're seeing...                         ]

        Add photo     Add video     Use voice

[ optional suggestions / common problems ]

                         Continue →
```

As information becomes available, the composer can transform into a structured summary:

```text
Problem
Kitchen sink leaking beneath the trap

Likely service
Plumbing

Evidence
3 photos · 1 video

Location
Kitchen

[Review]                  [Continue]
```

Do not make the AI conversation look like a general-purpose ChatGPT clone.

---

# 25. AI visual language

AI should look like **assistance inside Fixify**, not a separate brand.

Use:

```text
small “Fixify assistant” label
structured suggestions
confidence language
helpful next-step prompts
```

Avoid:

```text
sparkles everywhere
neon gradients
“magical AI” language
animated robot imagery
holographic effects
```

When the AI is uncertain, the UI should become calmer and more explicit:

```text
We can narrow this down, but a professional should inspect it before any repair is confirmed.
```

The visual design should reinforce that honesty.

---

# 26. Professional verification badge

Do not make the badge look like a luxury social-media checkmark.

Preferred:

```text
shield / check symbol
+ “Verified professional”
+ optional verification detail on profile
```

For example:

```text
✓ Verified professional
Electrical · Identity checked · Skills verified
```

The badge should communicate evidence, not popularity.

---

# 27. Status system

Status is a major part of the product and needs a durable visual grammar.

| State family | Visual treatment | Example |
|---|---|---|
| Neutral | grey/ink | Requested |
| Informational | blue | Professional assigned |
| Progress | teal | In progress |
| Pending decision | ochre | Awaiting approval |
| Success | green | Completed |
| Attention / risk | amber/ochre | Delayed |
| Destructive | red | Cancelled / failed |
| Dispute | clay/red combination | Disputed |

Never introduce a new status color per page.

---

# 28. Status component anatomy

Preferred status badge:

```text
[ icon ] label
```

Example:

```text
→ On the way
! Awaiting approval
✓ Completed
△ Disputed
```

For major workflow states, use a richer component:

```text
● Inspection
  Professional is checking the issue
  Updated 14:35
```

The richer component can include the event note and timestamp.

---

# 29. Booking UI language

Booking should feel like a service confirmation, not an ecommerce checkout.

Primary hierarchy:

```text
What
Where
When
Who
How pricing works
What happens next
Confirm
```

The customer should not have to understand internal Fixify entities such as `service_request` or `job`.

---

# 30. Quote approval UI

Quote approval is a high-trust moment.

Use a strong but calm composition:

```text
INSPECTION FINDING
Blocked condensate line + failing capacitor

RECOMMENDED WORK
────────────────────────
Condensate line flush       ₹ / local currency
Replacement capacitor       ₹ / local currency
Coil cleaning               ₹ / local currency

Labour                      ₹ ...
Materials                   ₹ ...
Fees                        ₹ ...
────────────────────────
Total                       ₹ ...

Why this work is needed
[short professional explanation]

[ View evidence ]

[ Decline ]       [ Approve quote ]
```

The actual currency and commercial values must come from product decisions/configuration, never from a visual mockup.

---

# 31. Payment UI language

Payment should communicate:

```text
what is being paid
why
how much
what happens after payment
current payment status
```

Do not design a flashy payment completion animation that implies an invoice exists before the backend confirms it.

Use the `PAYMENT_SPEC.md` state vocabulary.

---

# 32. Property dashboard visual language

The Property surface should feel more like a **living maintenance record** than a generic analytics dashboard.

Use:

```text
Property identity
Systems/assets
Current issues
Maintenance timeline
Documents/invoices
Service patterns
```

A useful visual metaphor is a vertical technical record:

```text
PROPERTY
Meridian Court · Flat 3B

SYSTEMS
Boiler        serviced Jan       ✓
Split AC      service overdue    !
Fuse board    RCD tested Nov     ✓

RECENT HISTORY
18 Mar  • Kitchen leak repaired
12 Mar  • Socket replaced
04 Jan  • Boiler serviced
```

Do not turn property history into a generic line chart unless there is actually a useful metric to show.

---

# 33. Property asset cards

An asset can have:

```text
asset name
brand/model where known
last service
next recommended service
status
related records
```

The asset card should support a quick scan and a deeper drill-down.

Use a subtle technical annotation style for model numbers or service dates, but never overwhelm the customer with engineering metadata.

---

# 34. Professional app visual language

The professional surface has different emotional requirements.

Customer:

```text
“Help me understand my problem.”
```

Professional:

```text
“Help me execute this job correctly.”
```

Therefore the professional interface can be denser.

Prioritize:

```text
next job
location
customer context
problem evidence
schedule
state action
earnings
support
```

Use larger tap targets because professionals may use the app while moving between jobs.

Avoid hidden actions behind tiny overflow menus when the action is operationally important.

---

# 35. Admin interface visual language

Admin is an operations room, not a marketing site.

Prefer:

```text
queue
filters
state
priority
ownership
timestamps
audit context
action
```

Avoid decorative illustrations and excessive whitespace in high-density work queues.

A good admin row should answer:

```text
What happened?
How urgent is it?
Who is involved?
What state is it in?
What should an operator do?
```

---

# 36. Navigation

## Marketing navigation

Recommended:

```text
Logo
Services
How it works
For professionals
Why Fixify
Help

[Describe a problem]
[Log in]
```

The exact content can evolve according to the product blueprint, but the principle is:

**one clear primary action, not six equal CTAs.**

## App navigation

Customer should emphasize:

```text
Home
Requests / active work
Bookings
Properties
History
```

Professional should emphasize:

```text
Today
Jobs
Availability
Earnings
Profile
```

Admin should emphasize:

```text
Overview
Jobs
Professionals
Verification
Customers
Services/Pricing
Payments
Complaints
Analytics
```

---

# 37. Mobile navigation

The mobile menu should be a deliberate interaction, not a shrunken desktop navbar.

Recommended behavior:

```text
menu button
      ↓
full-height / large-sheet menu
      ↓
large readable navigation items
      ↓
primary action
```

Support:

- Escape to close on keyboard.
- Focus trapping where appropriate.
- `aria-expanded`.
- `aria-controls`.
- body scroll locking while open.
- reduced motion.

Do not animate the menu from three unrelated directions.

---

# 38. Layout system

## 38.1 Container

Desktop:

```css
--container-max: 1240px;
--page-gutter: clamp(20px, 3vw, 40px);
```

The product should not be constrained to the prototype's exact 1180px width. The container can breathe on large screens while still controlling reading width.

## 38.2 Grid

Use an editorial 12-column grid for marketing and flexible grid systems for applications.

Marketing example:

```text
2 columns → hero
3/9       → text + visual
4/8       → supporting content
6/6       → comparisons
```

Application example:

```text
12 columns desktop
8 columns tablet
4 columns mobile
```

Do not force every section into equal cards.

---

# 39. Spacing system

Use a 4px base with a restrained semantic scale:

```text
4    micro
8    xs
12   sm
16   md
20   lg
24   xl
32   2xl
40   3xl
56   4xl
72   5xl
96   6xl
128  display spacing
```

Prefer rhythm over arbitrary one-off spacing.

Example:

```text
label → 8px → heading
heading → 12–16px → body
body → 20–24px → action
section → 56–96px → next section
```

---

# 40. Radius system

Fixify should use medium radii, not inflated “soft SaaS” corners.

```text
4px   micro details
8px   compact controls
10px  standard button/input
12px  field/action grouping
16px  standard panel
20px  featured panel
28px  major marketing surface
999px status/tag only
```

A large page should not contain six different radius values.

---

# 41. Borders and separators

Use borders as **structural lines**, not as outlines around everything.

Default:

```css
border-color: var(--fx-line);
```

Stronger structural boundary:

```css
border-color: var(--fx-line-strong);
```

For marketing sections, a horizontal rule can act as a visual pause and reinforce the brand's technical/editorial quality.

---

# 42. Shadows

Shadows should indicate elevation, not style.

```text
No shadow       page-level / normal surface
Small shadow    interactive panel
Large shadow    modal / floating composer
```

Avoid dramatic black shadows.

---

# 43. Motion philosophy

Fixify's motion should communicate **continuity, confirmation, and progress**.

The user should not consciously think “this has good animation”. They should feel that the interface responds naturally.

Motion is allowed to answer:

```text
Where did this come from?
What just changed?
What should I look at now?
What action did I trigger?
What is currently in progress?
```

If motion answers none of these, remove it.

---

# 44. Motion timing tokens

Use a small motion vocabulary.

```css
--motion-instant: 100ms;
--motion-fast: 160ms;
--motion-standard: 240ms;
--motion-slow: 420ms;
--motion-reveal: 620ms;
```

Recommended easing:

```css
--ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
--ease-soft: cubic-bezier(0.4, 0, 0.2, 1);
--ease-emphasis: cubic-bezier(0.16, 1, 0.3, 1);
```

Do not create dozens of custom easings.

---

# 45. Scroll-triggered reveals

Use Intersection Observer or a compatible animation utility.

Recommended reveal:

```css
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition:
    opacity 620ms var(--ease-standard),
    transform 620ms var(--ease-standard);
}

.reveal.in {
  opacity: 1;
  transform: none;
}
```

Variation may include:

```text
translateY 18px → standard
translateX 20px → side-by-side editorial block
scale .985 → featured image/panel
clip-path reveal → special marketing visual only
```

Do not animate every paragraph separately.

Recommended stagger:

```text
40–80ms between sibling items
```

Maximum typical stagger group:

```text
4–6 items
```

---

# 46. Animated typography

Animated headlines should feel editorial, not like an AI-generated website template.

Good patterns:

### Line reveal

Text starts clipped and rises into place.

### Word emphasis

One word changes weight/opacity/color after the main headline appears.

### Sequential statement

```text
Problem.
Clarity.
A professional.
Fixed properly.
```

Each line can reveal with a restrained 80–120ms offset.

Avoid:

```text
per-character bouncing text
random letter scrambling
constant morphing text
3D rotating words
```

---

# 47. Hover interactions

Hover should clarify interaction.

Examples:

### Service card

```text
icon shifts 1–2px
arrow becomes visible
border becomes slightly stronger
```

### Professional card

```text
photo crops very slightly
availability indicator becomes more prominent
```

### History row

```text
background tone shifts
arrow appears
```

Do not lift cards 12px into the air.

---

# 48. “Magnetic” controls

Magnetic hover is allowed only for a small number of marketing CTAs on capable pointer devices.

Rule:

```text
maximum displacement: 2–4px
```

Never use magnetic behavior for:

- destructive actions;
- payment buttons;
- approval actions;
- mobile;
- dense admin controls.

A button should never move enough to feel unstable.

---

# 49. Press feedback

Every interactive control should acknowledge touch/click.

Recommended:

```css
active {
  transform: scale(0.985);
}
```

Do not use bounce/spring animations for routine actions.

---

# 50. Loading states

Avoid full-screen spinners whenever possible.

Preferred:

```text
skeleton for content
inline progress for uploads
small spinner inside the active button
stateful timeline placeholder for jobs
```

Example:

```text
Finding a professional
[ subtle progress indicator ]
Checking nearby verified professionals…
```

Do not fabricate an ETA simply to make the loading state feel alive.

---

# 51. Upload interactions

Photo/video uploads are core Fixify behavior.

The UI should make the user feel that evidence is useful rather than mandatory unless the workflow actually requires it.

Preferred upload panel:

```text
Add evidence

[ camera icon ]  Take a photo
[ image icon  ]  Choose photos
[ video icon  ]  Add a video

JPG, PNG, MP4 • size limits shown by actual configuration
```

After upload:

```text
3 photos
1 video

[ preview grid ]
```

Include upload progress and clear failure recovery.

---

# 52. Image/media presentation

Do not display customer evidence as decorative gallery photography.

It is operational evidence.

Use:

- consistent thumbnail ratios;
- clear media count;
- timestamp where relevant;
- optional annotations only where supported;
- accessible alt text where applicable;
- clear permissions/security expectations.

---

# 53. Timeline design

The service timeline is a signature component.

Preferred structure:

```text
● Requested
│  Problem submitted with evidence
│
● Assigned
│  Verified plumber matched
│
● Accepted
│  Visit confirmed
│
● Inspection
│  Professional checking issue
│
○ Work in progress
```

The line should visually connect the workflow without becoming an ornamental railway-map graphic.

---

# 54. Timeline animation

When a new real event appears:

```text
existing timeline remains stable
new node fades/slides in
connector grows subtly
new event receives brief emphasis
```

Do not replay the entire timeline every time the data refreshes.

For live/realtime updates, motion should be tied to actual data changes.

---

# 55. Expandable panels

Expandable sections are encouraged where a user may want detail without being overwhelmed.

Good candidates:

```text
Why this was recommended
Professional verification details
Quote line-item detail
Service terms
Property asset history
Complaint details
```

Interaction:

```text
closed → title + summary + chevron
open   → content reveals
```

Height animation should be graceful but not mathematically elaborate.

Accessibility:

```text
button element
aria-expanded
aria-controls
visible focus state
```

---

# 56. Modal / sheet behavior

Use modal dialogs for focused decisions.

Good:

```text
quote approval
complaint evidence review
reschedule confirmation
payment confirmation
```

Use drawers/sheets for contextual detail where desktop and mobile can share the same mental model.

Do not create nested modals.

---

# 57. Mobile behavior

Mobile is not a compressed desktop layout.

Priorities:

```text
single primary action
large touch targets
shorter reading lines
sticky contextual action
progressive disclosure
bottom-sheet patterns where useful
```

Target:

```text
minimum comfortable tap target ~44px
```

Important customer tasks should remain usable one-handed where practical.

---

# 58. Responsive breakpoints

Use content-driven breakpoints rather than arbitrary prototype media queries.

Baseline:

```text
< 640px     mobile
640–899px   large mobile / tablet
900–1199px  laptop
1200px+     desktop
```

Components may use more granular container queries when appropriate.

Do not create five breakpoint-specific versions of the same component unless the content truly needs it.

---

# 59. Reduced motion

Fixify must support `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
}
```

Additionally:

- remove parallax;
- remove looping decorative motion;
- do not replace important state changes with invisible transitions;
- maintain instant but understandable state updates.

---

# 60. Motion performance rules

Animations should avoid expensive layout work.

Prefer:

```text
transform
opacity
clip-path for selective marketing use
```

Avoid repeatedly animating:

```text
width
height
top
left
box-shadow at high frequency
large blur filters
```

Visibility-aware rendering is encouraged for large canvas/WebGL/animated media.

If a visual is not visible, stop or reduce its animation work.

---

# 61. Creative visual language

Fixify can use visual details that make the design feel authored.

Good examples:

### Measurement marks

Tiny technical dimensions beside a property/system diagram.

### Route traces

A subtle line showing progress from booking to arrival.

### Material swatches

Small physical-feeling samples when material selection is relevant.

### Property diagrams

Simple floorplan/equipment relationships.

### Evidence frames

Photo/video previews framed like inspection evidence, not social media.

### Handled/complete stamps

Used sparingly in property history or completed records.

### Editorial captions

Small descriptive notes beside a visual.

These can create a recognizable visual language without introducing visual noise.

---

# 62. Imagery direction

The photography/visuals should feel documentary and tactile.

Preferred:

```text
real homes
real tools
real surfaces
real technicians
close-up material detail
natural lighting
slightly imperfect environments
```

Avoid:

```text
perfect CGI homes
obvious stock-photo handshakes
smiling models pointing at laptops
unrealistically pristine workshops
fake AI-generated technician portraits
```

A slightly imperfect real image can communicate more trust than a flawless illustration.

---

# 63. Illustration direction

When illustration is needed:

- use technical linework;
- use restrained fills;
- use warm neutral backgrounds;
- use the brand teal sparingly;
- include measurement or process cues;
- maintain asymmetry where it improves character.

Do not use generic isometric SaaS illustrations.

---

# 64. Hero design direction

The Fixify hero should not be a generic landing page hero.

Preferred conceptual composition:

```text
large statement
      +
real service/problem interaction
      +
small technical detail / property visual
```

Example structure:

```text
Your problem.
Fixed properly.

Describe what is happening — by text, photo or video.

[ Describe a problem ]   [ Browse services ]

                 ┌───────────────────────┐
                 │ kitchen tap dripping  │
                 │ 3 photos · plumbing   │
                 │ likely next step →    │
                 └───────────────────────┘
```

The hero visual should demonstrate the product, not merely decorate the screen.

---

# 65. Marketing page composition

Avoid repeating:

```text
heading
paragraph
3 cards
```

Instead alternate visual structures:

```text
Hero + interactive proof
Asymmetric service catalogue
Horizontal workflow
Editorial trust section
Property record visual
Professional callout
Final action
```

Use asymmetry deliberately.

A 5/7 or 4/8 composition can feel more authored than four identical columns.

---

# 66. Service catalogue

Service cards should be discoverable but not visually overwhelming.

Each service item may contain:

```text
icon
service name
one-line description
starting/inspection pricing language where authoritative
next arrow
```

Examples:

```text
Electrical
Sockets, switches, wiring and more

Plumbing
Leaks, fittings, drainage and more

AC & Cooling
Service, repair and maintenance
```

The exact service catalogue must remain configurable through product data.

---

# 67. Trust section

Trust should be expressed through evidence:

```text
verified professionals
visible service process
transparent quote
completion record
property history
support / complaint path
```

Avoid invented trust badges such as:

```text
#1 rated
10,000 happy customers
industry's most trusted
```

unless real product data and approved claims exist.

---

# 68. Professional cards

A professional preview should answer:

```text
Who?
What trade?
Verified?
Availability?
Relevant experience?
Rating/review context when available?
```

A useful card might be:

```text
Dario Venn
Verified plumber

2.1 km away
Available today · 14:30

4.8 ★ · 92 completed jobs

[ View profile ]
```

Only display the fields the backend actually has.

---

# 69. Matching UI

Do not pretend automated matching is magic.

A suitable progress message:

```text
Finding a professional
Checking skill, service area and availability…
```

After matching:

```text
Matched
Why this professional?
✓ verified for plumbing
✓ serves your area
✓ available in your selected window
```

This makes the matching logic understandable without exposing ranking internals unnecessarily.

---

# 70. Notification visual language

Notifications should be:

```text
short
specific
actionable
state-aware
```

Example:

```text
Your professional is on the way
Dario is heading to your property.
ETA shown from current operational data.
```

Do not use generic:

```text
Something happened!
Great news!
Your Fixify moment is here!
```

Notification appearance must align with `NOTIFICATION_SPEC.md`.

---

# 71. Empty states

Empty states should help users decide what to do next.

Bad:

```text
No data.
```

Better:

```text
Nothing booked yet
When you schedule your first service, it will appear here.

[ Describe a problem ]
```

For professional users:

```text
No jobs in your queue
Your availability is active. New eligible jobs will appear here.
```

---

# 72. Error states

Errors should be direct and useful.

Pattern:

```text
What went wrong
Why it may have happened
What the user can do now
```

Example:

```text
We couldn't upload this video
It may be too large or your connection may have dropped.

[ Try again ]
```

Never make an error look like a successful state with a red icon hidden in the corner.

---

# 73. Microcopy rules

Fixify language should be:

```text
plain
specific
calm
short
human
```

Prefer:

```text
Describe what is happening

We need a little more detail

A professional will confirm the issue on site

This extra work needs your approval

Your invoice is ready
```

Avoid:

```text
Initialize service orchestration

AI diagnosis completed

Execution layer active

Workflow transaction initiated
```

Those are backend concepts, not customer copy.

---

# 74. Voice and tone by surface

| Surface | Tone |
|---|---|
| Marketing | confident, warm, concise |
| Customer app | reassuring, plain, useful |
| AI assistant | conversational, transparent, humble |
| Professional app | operational, direct, respectful |
| Admin | factual, compact, action-oriented |
| Payment | precise, explicit, calm |
| Complaints | empathetic, procedural, fair |
| Errors | clear, non-blaming |

---

# 75. Accessibility baseline

Implement:

```text
semantic HTML
keyboard navigation
visible focus
screen-reader labels
proper button/link semantics
aria-expanded for disclosure
aria-live for important asynchronous state changes
reduced motion
sufficient color contrast
44px+ comfortable touch targets
```

Do not use `div` elements as buttons for aesthetic reasons.

---

# 76. Focus styling

Recommended:

```css
:focus-visible {
  outline: 2px solid var(--fx-focus);
  outline-offset: 3px;
}
```

Do not remove outlines without providing an equivalent.

---

# 77. Data truth in UI

This visual system is built around real service states.

Therefore:

```text
UI state = backend state
```

The frontend may animate a transition, but it must not invent the state.

Examples:

- `ARRIVED` appears because the authoritative state says `ARRIVED`.
- `AWAITING_APPROVAL` appears because a quote requires customer action.
- “Paid” appears only after the authoritative payment state permits it.
- “Verified professional” appears only when the relevant verification state supports it.

---

# 78. Component architecture expectations for Next.js

Brand/UI primitives should live independently from route-specific pages.

Recommended:

```text
src/components/
├── brand/
│   ├── fixify-mark.tsx
│   ├── fixify-wordmark.tsx
│   └── fixify-lockup.tsx
│
├── ui/
│   ├── button.tsx
│   ├── badge.tsx
│   ├── panel.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── drawer.tsx
│   ├── tooltip.tsx
│   └── skeleton.tsx
│
├── status/
│   ├── status-badge.tsx
│   └── status-timeline.tsx
│
├── intake/
│   ├── problem-composer.tsx
│   ├── media-uploader.tsx
│   └── ai-assistance.tsx
│
├── booking/
│   ├── booking-summary.tsx
│   └── professional-card.tsx
│
├── jobs/
│   ├── job-progress.tsx
│   ├── inspection-panel.tsx
│   └── quote-approval.tsx
│
├── property/
│   ├── property-header.tsx
│   ├── asset-card.tsx
│   └── maintenance-timeline.tsx
│
└── layout/
    ├── marketing-nav.tsx
    ├── app-shell.tsx
    └── mobile-menu.tsx
```

Kiro may adapt names to repository conventions, but brand primitives should not be reimplemented independently in multiple routes.

---

# 79. Token implementation

Create a single token layer.

Recommended:

```text
src/styles/tokens.css
src/styles/globals.css
```

Tailwind semantic aliases should reference the same design tokens rather than duplicating hex values.

Example:

```js
colors: {
  background: "var(--background)",
  surface: "var(--surface)",
  foreground: "var(--foreground)",
  muted: "var(--foreground-muted)",
  primary: "var(--primary)",
  accent: "var(--accent)",
  border: "var(--border)",
}
```

Do not hard-code `#176B5B` in twenty components.

---

# 80. Animation architecture

Animation logic should be centralized where possible.

Recommended utilities:

```text
useReducedMotion()
Reveal
AnimatedPresence / equivalent
Transition primitives
```

Avoid dozens of one-off animation classes.

For scroll reveals:

```text
IntersectionObserver
→ add visible class / trigger animation
→ unobserve after entry
```

For live workflow updates:

```text
data change
→ state-aware transition
```

Not:

```text
page refresh
→ replay all animations
```

---

# 81. Prototype requirements

The visual prototype should demonstrate:

### Marketing

```text
Homepage
Services
How it works
Professional recruitment / profile
Help
```

### Customer

```text
Dashboard
AI/problem intake
Service selection
Booking
Active job
Quote approval
Property record
Invoice
Review
Support / complaint
```

### Professional

```text
Professional dashboard
Job queue
Job detail
Availability
Earnings
Profile / verification
```

### Admin

```text
Operations dashboard
Jobs
Professional verification
Customers
Pricing/services
Payments
Complaints
```

These screens can use realistic synthetic data in the prototype, but the UI should be designed so each major value maps cleanly to a future real field.

---

# 82. Prototype → Next.js translation rule

The prototype should be a **visual specification**, not a source-code dependency.

When converting to Next.js:

```text
prototype visual pattern
        ↓
identify component
        ↓
identify real data/state
        ↓
build reusable component
        ↓
connect to server/data layer
```

Do not copy prototype synthetic state into production.

Do not allow prototype route names to override the official Next.js route structure.

---

# 83. Do not let the prototype dictate the backend

Prototype may contain:

```text
fake jobs
fake professionals
fake pricing
fake metrics
fake timestamps
```

These are only visual content.

Production must use:

```text
Supabase
server-authoritative state
actual roles
actual permissions
actual pricing
actual payment status
actual notification state
```

---

# 84. Brand assets folder

Recommended production structure:

```text
public/
└── brand/
    ├── fixify-mark.svg
    ├── fixify-mark-dark.svg
    ├── fixify-mark-mono.svg
    ├── fixify-lockup.svg
    ├── fixify-lockup-dark.svg
    ├── fixify-favicon.svg
    ├── fixify-og.svg
    └── icons/
```

SVGs should use `currentColor` where practical so the same geometry can be reused across light/dark surfaces.

---

# 85. Logo component contract

Example API:

```tsx
<FixifyMark size={32} tone="default" />
<FixifyMark size={40} tone="inverse" />
<FixifyLockup size="md" />
```

Recommended props:

```ts
type BrandTone = "default" | "inverse" | "mono";
type BrandSize = "xs" | "sm" | "md" | "lg" | "hero";
```

The component should not expose raw arbitrary colors by default. Use semantic tones.

---

# 86. Dark-surface logo rule

When a logo sits on a dark panel:

```text
symbol stroke → dark ink inverse
node → light teal
wordmark → warm white
```

Avoid bright neon green nodes.

The node should feel like a point of connection, not an LED indicator.

---

# 87. Brand accent hierarchy

At any moment, the screen should visually prioritize approximately:

```text
1. Content / task
2. Primary action
3. State
4. Brand accent detail
5. Decorative detail
```

Brand color must never overpower the user's task.

---

# 88. Color usage ratio guidance

As a loose composition guide for customer pages:

```text
~65–75% warm neutrals / surfaces
~15–25% ink/text/structural elements
~5–10% teal primary action and meaningful signals
<5% clay / ochre / blue accents
```

This is not a mathematical rule; it is a visual discipline.

If a page starts looking “green”, too much brand color is being used.

---

# 89. Accent rules by context

### Teal

Use for:

```text
primary CTA
active progress
selected navigation
positive action
verified signal when appropriate
```

### Clay

Use for:

```text
human emphasis
editorial detail
secondary CTA in marketing
highlighted visual moment
```

### Ochre

Use for:

```text
awaiting approval
attention
inspection required
pending decision
```

### Blue

Use for:

```text
informational state
technical data
location/map details
secondary operational information
```

### Red

Use only for:

```text
failed action
critical warning
cancellation consequence
destructive action
dispute where appropriate
```

---

# 90. Charts and data visualizations

Charts should inherit the Fixify semantic palette.

Avoid using all five chart colors simply because they exist.

Recommended sequence:

```text
primary metric → teal
secondary       → blue
attention       → ochre
negative        → red
comparison      → neutral/graphite
```

Do not use gradients inside bars unless there is a meaningful encoding.

For admin screens, use data labels and legends that remain understandable without color.

---

# 91. Tables

Tables should feel operational and calm.

Use:

```text
clear header hierarchy
comfortable row height
subtle rules
hover state
status badge
compact actions
```

Avoid turning every row into a card on desktop.

On mobile, transform only where scanning would genuinely improve.

---

# 92. Toasts and transient messages

Toasts are for brief confirmations, not important decisions.

Good:

```text
Photo uploaded
Quote request sent
Availability updated
```

Important workflow information should live in the page/timeline as persistent state.

Do not hide critical errors in toasts alone.

---

# 93. Notification badges

Use notification dots/badges sparingly.

A badge should mean:

```text
there is something the user should probably inspect
```

Do not show a red dot merely because a notification exists.

Prefer semantic states:

```text
teal/blue for information
ochre for action needed
red for urgent/failed
```

---

# 94. Skeleton and loading design

Skeletons should use warm neutrals:

```text
base: --fx-paper-2
highlight: subtle --fx-sand / low-opacity white
```

Do not use shimmering gradients across the whole screen.

Limit shimmer to content that actually loads progressively.

---

# 95. Authentication pages

Auth screens should feel like entering the Fixify service, not entering a generic startup dashboard.

Recommended:

```text
logo
one clear statement
simple form
social sign-in where configured
short privacy/help language
```

Optional supporting visual:

```text
small property/service illustration
subtle technical line motif
real home texture
```

Do not fill half the page with giant gradients.

---

# 96. Customer home screen

The first screen after login should prioritize:

```text
greeting
Describe a problem
upcoming booking
open issue / active job
property summary
recent history
```

The visual priority should follow urgency and actionability.

Not:

```text
six KPI cards
monthly spend chart
AI usage count
```

unless real product usage justifies them.

---

# 97. Service request detail

The customer should see a coherent record:

```text
Problem summary
Evidence
Service
Property
Booking
Professional
Current state
Next action
History
```

Use section anchors or progressive disclosure for longer requests.

---

# 98. Professional job detail

The professional needs:

```text
customer context
property
problem
media
service
schedule
navigation
state action
materials
inspection/quote
completion evidence
```

Put operational action at thumb level on mobile.

Do not hide “Arrived”, “Start inspection”, or “Complete” in secondary menus.

---

# 99. Completion experience

Completion is a meaningful moment but should remain grounded.

Good:

```text
Work completed
✓ Completion evidence uploaded
✓ Final amount confirmed

Invoice available
Property history updated
```

A brief check animation is appropriate.

Avoid confetti.

Fixify is a maintenance platform, not a gaming app.

---

# 100. Review experience

Reviews should be easy and contextual.

```text
How did the service go?

★ ★ ★ ★ ★

What went well? (optional)

[ Submit review ]
```

The UI should not guilt the user into a positive review.

---

# 101. Complaint/support experience

This surface must feel safe and procedural.

Use:

```text
Issue
Evidence
What happened
Current status
Expected next step
Support contact
```

Avoid aggressive red UI unless the issue is genuinely critical.

---

# 102. Professional earnings

Earnings screens should feel trustworthy and auditable.

Show:

```text
current balance
pending settlement
completed jobs
payout history
fees/adjustments where applicable
```

Do not present speculative earnings as actual earnings.

---

# 103. Verification workflow

Verification UI should communicate progress and evidence.

Example:

```text
Professional verification

✓ Identity
✓ Skill evidence
○ Insurance / required document
○ Final review

Status: Submitted for review
```

Avoid greenwashing an incomplete verification process.

---

# 104. Property visual assets

A property can use a simple visual identity:

```text
property photo OR
abstract architectural crop OR
technical floorplan fragment
```

Do not require a beautiful property image for the system to look good.

The UI must remain strong with no image.

---

# 105. Editorial details

Humanistic visual character can come from small details:

```text
“Kitchen · under-sink”
“Inspection 14:35”
“Photo 03 / 04”
“Last serviced Jan 2026”
“Record added after completion”
```

Use small metadata typography carefully.

These details create the feeling of a real operational record.

---

# 106. Technical motif system

A restrained technical motif can be reused across marketing pages:

```text
fine grid
measurement line
small node
route trace
thin frame
coordinate label
inspection marker
```

Rules:

- low opacity;
- never behind readable text if it reduces clarity;
- never more than one or two motifs in a major section;
- static fallback required.

---

# 107. Canvas / WebGL guidance

The prototype may use canvas/WebGL for a hero or large visual.

This is optional, not mandatory.

Use it only when it creates a visual effect that would be difficult to communicate with normal DOM/CSS.

Requirements:

```text
visibility-aware rendering
responsive sizing
fallback visual
reduced-motion behavior
mobile performance consideration
no essential information trapped inside canvas
```

Never make the core product unusable if WebGL is unavailable.

---

# 108. Decorative visual fallback

Every advanced visual should have a simpler fallback:

```text
WebGL scene → static image / CSS composition
animated diagram → static SVG
parallax photo → normal image
canvas map → accessible DOM/map representation
```

If the visual is decorative, it can disappear completely.

---

# 109. Responsive image rules

Use modern responsive image handling and explicit dimensions where possible.

Avoid layout shifts.

Preferred image qualities:

```text
realistic contrast
natural shadows
slightly warm lighting
visible material texture
```

Do not apply the same LUT/filter to every image.

---

# 110. Content density by surface

| Surface | Density |
|---|---|
| Marketing | medium / editorial |
| Customer home | medium |
| Intake | low → medium progressive |
| Booking | focused |
| Active job | medium / status-heavy |
| Property | medium / record-heavy |
| Professional | medium-high |
| Admin | high |
| Payment | focused / explicit |

A single density standard across every route will make the product feel generic.

---

# 111. Information hierarchy by task

### Customer

```text
Next action > current state > context > detail
```

### Professional

```text
Next operational action > job context > schedule > detail
```

### Admin

```text
Exception/priority > state > ownership > evidence > action
```

---

# 112. Brand consistency test

Before approving a screen, ask:

```text
Does this look like Fixify without seeing the logo?

Can the primary task be understood in <5 seconds?

Does color communicate meaning rather than decoration?

Does the screen still work with animation disabled?

Could this screen belong to a generic SaaS template?
```

If the answer to the last question is “yes”, redesign the composition before adding more decoration.

---

# 113. Human-authored design test

A screen should ideally contain at least two of these characteristics where appropriate:

```text
asymmetric composition
purposeful technical detail
unexpected but useful spacing
edited content hierarchy
realistic service terminology
property-specific visual cue
contextual microcopy
non-uniform card composition
subtle material cue
```

This is how to avoid the “AI generated landing page” appearance.

Do not force all ten into one screen.

---

# 114. Marketing motion choreography example

A strong homepage can use:

```text
0ms      navigation settles
150ms    hero eyebrow appears
280ms    hero headline line 1
380ms    hero headline line 2
500ms    support copy
620ms    primary CTA
800ms    product/problem visual starts
scroll   service sections reveal
hover    service cards respond
```

Only one of these should be the visual focal point at a time.

---

# 115. Customer dashboard motion choreography

Use substantially less animation:

```text
page enter → 1 brief content reveal
active job update → timeline event emphasis
quote available → subtle attention state
button action → immediate pressed feedback
```

Do not replay a cinematic intro every time the customer opens the dashboard.

---

# 116. Real-time motion rules

When Supabase Realtime updates a job:

```text
new actual state
   ↓
update UI
   ↓
animate only affected region
```

For example:

```text
ASSIGNED → ACCEPTED
```

Only the relevant status/timeline areas animate.

Do not make the entire page jump.

---

# 117. AI loading animation

Preferred:

```text
subtle pulse on a small assistant indicator
one or two moving dots
short text update
```

Avoid:

```text
spinning gradients
starburst “AI magic” effects
huge animated brain/robot
```

AI should disappear into the Fixify workflow when it is no longer needed.

---

# 118. Payment loading animation

Payment loading should be boring in a good way.

```text
Processing payment…
```

Use a compact spinner/progress indicator and lock duplicate submission.

Do not use decorative animation while money is moving.

---

# 119. Quote attention animation

When a new quote needs approval:

```text
badge/status enters once
quote panel receives a subtle highlight
primary action becomes visually clear
```

Do not continuously pulse the approve button.

---

# 120. Error animation

Use motion sparingly.

A failed upload can:

```text
shake 2–3px once
then settle
```

Avoid repeated shaking, flashing red, or aggressive error motion.

---

# 121. Selection behavior

Selected states should use:

```text
border weight
background tint
check/icon
```

not color alone.

Example:

```text
Selected service
┌────────────────────┐
│ ✓  Plumbing        │
│    Leaks & drains  │
└────────────────────┘
```

---

# 122. Chips / tags

Pills should be reserved for compact metadata.

Good:

```text
Verified
Today 14:30
Awaiting approval
Plumbing
```

Bad:

```text
large pill containers around normal paragraphs
pill buttons for every action
```

---

# 123. Tooltip rules

Use tooltips for:

```text
unfamiliar icon
technical abbreviation
compact admin control
```

Do not hide essential customer information in hover-only tooltips.

Mobile alternatives must exist.

---

# 124. Icon-only button rules

Icon-only controls require:

```text
aria-label
visible hover/focus treatment
comfortable hit area
consistent placement
```

Use tooltips on desktop when the action is not obvious.

---

# 125. Breadcrumb rules

Customer flows usually need minimal breadcrumbing.

Use explicit contextual headings instead.

Admin/professional deep navigation can use breadcrumbs where it improves orientation.

Do not show:

```text
Home / App / Requests / Requests / 4832
```

just because the route hierarchy exists.

---

# 126. Footer / legal surfaces

The footer can be quieter and simpler.

Suggested structure:

```text
Fixify
Services
Company
Professionals
Support
Privacy
Terms
```

Avoid giant footer link walls.

---

# 127. Theme architecture

Support theme tokens even if only one theme is enabled initially.

```text
light
brand-dark
system (future)
```

Use semantic variables so theme switching does not require rewriting component styles.

---

# 128. Dark-mode rule

Do not treat dark mode as merely “invert light mode”.

Dark surfaces need:

```text
different border contrast
different text hierarchy
adjusted teal brightness
reduced shadow dependence
```

The dark theme should be deliberate and editorial.

---

# 129. Design QA matrix

Every significant screen should be checked at least at:

```text
375 × 812
390 × 844
768 × 1024
1280 × 800
1440 × 900
```

Also test:

```text
keyboard only
reduced motion
slow connection
no image
long text
empty state
error state
loading state
```

---

# 130. Performance QA

Before accepting a visually rich page:

```text
Does it still feel fast on mobile?
Does animation stop when off-screen?
Are large images properly sized?
Is layout stable while media loads?
Does reduced-motion remove unnecessary work?
```

Visual quality is not an excuse for poor performance.

---

# 131. Prototype data rules

Prototype synthetic data should:

- use realistic service vocabulary;
- use internally consistent dates/statuses;
- reflect the state-machine vocabulary;
- reflect plausible property/service relationships;
- never present fabricated statistics as real company claims.

Use labels such as:

```text
Prototype data
Illustrative example
Synthetic data
```

where needed.

---

# 132. Currency rules

Do not hard-code a currency symbol in reusable visual components.

Use the authoritative configuration from product decisions.

Example:

```ts
formatMoney(amount, currency)
```

The visual system defines hierarchy, not the business currency.

---

# 133. Pricing visuals

Pricing UI should clearly distinguish:

```text
fixed price
inspection / visit charge
quote after inspection
additional approved work
fees/taxes/discounts
```

Do not flatten different pricing models into one generic “from $X” component.

---

# 134. Trust and uncertainty

One of Fixify's strongest design opportunities is showing uncertainty honestly.

Use language such as:

```text
Likely service
Needs professional inspection
Estimated from submitted information
Final repair scope confirmed on site
```

Never visually style an AI suggestion like a verified fact.

---

# 135. Final AI guardrail for design

The AI layer should visually support the user while making its limits visible.

Never design a screen that implies:

```text
AI diagnosed it with certainty
AI set the final price
AI approved the repair
AI made the payment decision
AI replaced professional inspection
```

Refer to `AI_SPEC.md` for authoritative AI behavior.

---

# 136. Final payment guardrail for design

The UI must never treat:

```text
frontend “success”
```

as proof that:

```text
payment is completed
invoice exists
job is closed
```

Visual states must follow authoritative backend/payment state.

Refer to `PAYMENT_SPEC.md`.

---

# 137. Brand implementation checklist

Before a production route is considered visually complete:

### Brand

```text
□ Correct Fixify mark
□ Correct light/dark logo tone
□ No prototype color leakage
□ Semantic tokens used
□ No arbitrary hard-coded colors
```

### Typography

```text
□ Human-readable body text
□ Sensible type hierarchy
□ Sentence case
□ No excessive display typography
□ Metadata remains legible
```

### Layout

```text
□ Clear primary task
□ Deliberate spacing rhythm
□ No unnecessary card nesting
□ Responsive behavior reviewed
```

### Motion

```text
□ Motion communicates change
□ No animation overload
□ Reduced-motion supported
□ Off-screen expensive animation stopped
```

### Product truth

```text
□ Status comes from real state
□ Money comes from authoritative totals
□ AI confidence is not presented as diagnosis
□ Verification badge reflects verification state
□ No fake data presented as real
```

### Accessibility

```text
□ Keyboard usable
□ Focus visible
□ Labels present
□ Touch targets comfortable
□ Color not sole meaning carrier
□ Async states announced where appropriate
```

---

# 138. Kiro implementation rules

When implementing the brand system, Kiro must:

1. Treat the **logo geometry as approved** and the prototype palette/font as non-authoritative.
2. Use semantic color tokens from this document.
3. Keep customer surfaces light-first unless a product reason justifies a darker surface.
4. Use teal as a concentrated primary action/progress color, not a page background color.
5. Use clay and ochre sparingly and semantically.
6. Never introduce generic “AI blue/purple gradient” styling.
7. Keep icons consistent and stroke-based.
8. Centralize brand primitives instead of duplicating them per route.
9. Implement reduced-motion behavior from day one.
10. Prefer state-aware animation over decorative animation.
11. Never invent business values to make the UI look complete.
12. Never use a prototype fake statistic as a production claim.
13. Never let animation hide an important state transition.
14. Never let visual styling imply certainty that the business logic does not provide.
15. Do not redesign the logo mark without a deliberate brand decision outside this implementation task.

---

# 139. What can evolve later

The following remain intentionally flexible:

```text
exact interface font
exact marketing headline type treatment
photo direction details
illustration style details
additional accent colors
dark theme depth
advanced hero visual technology
micro-animation tuning
exact radii after usability testing
```

The following should remain stable unless there is an explicit brand decision:

```text
Fixify mark geometry
core symbol language
warm-neutral foundation
teal primary relationship
human + technical personality
semantic status system
restrained motion philosophy
no-gimmick principle
```

---

# 140. One-page design summary for agents

When an agent cannot read the entire document, this is the minimum it must retain:

```text
FIXIFY VISUAL RULES

1. Preserve the supplied logo/symbol geometry.
2. Do not treat the prototype's mint, black, Space Grotesk or Inter as locked brand decisions.
3. Build light-first around warm porcelain, white surfaces and deep graphite ink.
4. Use deep teal as the main action/progress color.
5. Use clay and ochre as restrained human/attention accents.
6. Use blue only as supporting information color.
7. Use semantic tokens, not scattered hex codes.
8. Keep cards and rounded corners under control.
9. Design around real household problems, not abstract software features.
10. Customer UI should feel reassuring; professional UI should feel operational; admin UI should feel factual.
11. Motion explains entry, change, progress and confirmation.
12. Use scroll reveals, subtle hover, expandable panels and responsive menus where they improve understanding.
13. Never use animation everywhere.
14. Always support reduced motion.
15. Do not make AI look like a separate neon chatbot product.
16. Do not present AI suggestions as technical certainty.
17. Do not present frontend payment success as authoritative payment success.
18. Do not fake metrics, verification, live tracking or availability.
19. Use real product states and real backend values.
20. The final visual test is: “Could this screen belong to a generic AI-generated SaaS template?”
    If yes, improve the composition and information hierarchy rather than adding more decoration.
```

---

# 141. Relationship to the other Fixify docs

```text
BRAND_ASSETS.md
       ↓ visual tokens / identity / motion
DESIGN_BRIEF.md
       ↓ screen composition / UX intent
       ↓
PRODUCT_DECISIONS.md
OPEN_DECISIONS.md
       ↓ business behavior
DATA_MODEL.md
STATE_MACHINES.md
RBAC.md
       ↓ authoritative application state/security
AI_SPEC.md
PAYMENT_SPEC.md
NOTIFICATION_SPEC.md
       ↓ specialized product behavior
Next.js implementation
```

No visual document may override the underlying business/security/state specifications.

---

# END OF BRAND ASSETS & DESIGN SYSTEM
