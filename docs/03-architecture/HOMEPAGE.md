# FIXIFY — HOMEPAGE / PUBLIC ENTRY SPEC

**Route:** `/`  
**Development URL:** `http://localhost:3000`  
**Surface:** Public marketing homepage + primary customer gateway  
**Status:** Implementation source of truth for the homepage  
**Audience:** Customer-first; professionals are supported through a deliberate secondary entry path  
**Auth:** Supabase Auth (email/password + Google OAuth)  

---

## 1. Purpose

The homepage is not a generic SaaS landing page. It is the **front door to Fixify**.

A first-time visitor should understand within seconds:

> **Fixify helps people turn an everyday property problem into a properly managed service job.**

The page must move naturally from:

```text
Problem
  ↓
Understanding
  ↓
Trust
  ↓
Service choice
  ↓
Customer action
  ↓
Authentication when needed
  ↓
Customer app
```

The homepage must also communicate that Fixify is more than a directory of workers. It coordinates the complete service journey: problem intake, media, service selection, verified professionals, booking, inspection, additional-work approval, payment, history and support.

The original project brief establishes the same core promise through smart problem description, image/video upload, material selection, verified professionals, flexible booking and rebooking. fileciteturn6file5

---

## 2. Critical Product Decision: Customer-First Authentication

### Do NOT expose a large "Customer / Professional" role selector on the main login page.

That pattern is easy to build but feels like a generic marketplace and creates a dangerous security assumption: **a user should never receive professional permissions simply because they selected "Professional".**

Instead:

### Customer path — primary

```text
Homepage
  ↓
Describe a Problem / Browse Services
  ↓
Customer auth when required
  ↓
/app
```

Primary auth route:

```text
/login
/register
```

The UI language should be customer-oriented:

> Welcome back  
> Get your property problem moving.

Primary actions:

```text
Continue with Google
Continue with email
```

Secondary actions:

```text
Create account
Forgot password
```

### Professional path — secondary and contextual

Do not put **"Professional Login"** beside the customer CTA in the main hero.

The professional path should be discovered through places where professionals naturally look for it:

```text
Homepage footer
Professionals page
Professional recruitment CTA
```

Use language such as:

> **You fix it. We handle the rest.**  
> Join Fixify as a verified professional.

Actions:

```text
Become a professional
Already with Fixify? Sign in
```

Professional sign-in route:

```text
/pro/login
```

Professional onboarding:

```text
/pro/onboarding
```

### Role assignment rule

Authentication identity and product role are separate concepts.

Never trust a client-side role selector to grant access.

```text
Supabase Auth user
       ↓
profiles / role data
       ↓
CUSTOMER / PROFESSIONAL / SUPPORT / ADMIN
       ↓
server + RLS authorization
```

A person can authenticate successfully and still **not** have professional access. Professional access requires the appropriate professional profile, onboarding and verification state defined by `PRODUCT_DECISIONS.md` and `RBAC.md`.

This is the correct long-term pattern because the professional surface contains sensitive job, earnings, customer and operational data.

---

## 3. Homepage Experience

The homepage should feel like a **calm, capable service company with unusually good software**.

It should not feel like:

- a template marketplace
- a generic AI startup
- a construction-company portfolio
- a dashboard dumped onto a landing page
- an app-store screenshot with marketing copy around it

The page should be visually attractive but every visual should reinforce a product idea.

### Tone

```text
Human
Trustworthy
Calm
Capable
Modern
Precise
Warm
Confident without hype
```

Avoid exaggerated claims such as "instant diagnosis", "100% guaranteed repair", or "AI knows exactly what's wrong".

AI assists intake; professional inspection remains the basis for actual repair decisions.

---

## 4. Recommended Header

Desktop:

```text
[FIXIFY mark + wordmark]

Services   How it works   For professionals   Help

                         Sign in   [Describe a problem]
```

The primary CTA should be:

> **Describe a problem**

Not:

> Get Started

Not:

> Book Now

The first Fixify interaction is often uncertain. The customer may not know which service they need. "Describe a problem" matches the product's problem-first model.

### Header behavior

At the top of the page:

- generous breathing room
- transparent or lightly integrated background
- no heavy dashboard-style navigation

After scrolling:

- compact sticky navigation
- subtle backdrop/surface transition
- CTA remains visible
- avoid an oversized sticky bar

### Mobile

Use a clean menu button.

Inside the mobile menu:

```text
Services
How it works
For professionals
Help

Sign in
Describe a problem
```

The professional path remains secondary.

---

## 5. Hero Section

The hero must communicate the business in one glance.

Recommended message direction:

> **Your problem. Properly fixed.**

Supporting copy:

> Tell Fixify what is wrong, show us what you can, and we will help turn it into a clear service job with a verified professional.

Primary CTA:

```text
Describe a problem →
```

Secondary CTA:

```text
Browse services
```

### Hero interaction

Use an interactive problem-intake visual rather than a generic abstract 3D object.

Example:

```text
┌─────────────────────────────────────┐
│ What needs fixing?                  │
│                                     │
│ "Water is leaking under my sink."  │
│                                     │
│ [photo] [video] [describe]          │
│                                     │
│ Fixify is understanding the issue…  │
│                                     │
│ Likely service                      │
│ Plumbing                            │
└─────────────────────────────────────┘
```

The visual can animate through states:

```text
Customer message
      ↓
Media attached
      ↓
Likely category
      ↓
Service options
      ↓
Verified professional
```

This demonstrates the product instead of merely decorating the hero.

### Hero motion

Use restrained motion:

- text reveal on initial load
- UI elements entering in sequence
- subtle cursor/pointer response on the product visual
- small live status changes
- gentle ambient movement

Do not make the hero continuously move at full intensity.

---

## 6. Trust Strip

Immediately after the hero, establish the core reasons a customer can trust the platform.

Use four concise concepts:

```text
Verified professionals
Clear pricing
Customer-approved additional work
Service history that stays with your property
```

Avoid invented numerical claims until real operating data exists.

Do not use fake:

```text
10,000+ professionals
50,000 jobs completed
4.9/5 rating
99% satisfaction
```

unless those numbers are backed by actual product data.

---

## 7. Problem-First Service Discovery

This section should teach visitors how Fixify differs from a basic service directory.

Possible heading:

> **You don't need to know the trade. You just need to explain the problem.**

Show three natural entry modes:

```text
Write it
Tell us in normal language.

Show it
Add photos or video.

Choose it
Browse a service when you already know what you need.
```

This section is important because not every customer needs AI.

Manual service selection is always a valid fallback.

---

## 8. Service Categories

Keep the catalogue easy to scan.

Initial categories:

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

Each category should link to:

```text
/services/:slug
```

The category cards should not all look identical.

Use small visual differences based on the service itself:

- line illustration
- cropped photography
- material texture
- restrained symbol
- contextual accent

Avoid the common AI-generated pattern of eight identical colorful rounded cards.

### Category interaction

Desktop:

- hover can reveal a short description or sub-services
- image/illustration can shift slightly
- active treatment should remain subtle

Mobile:

- touch-friendly cards
- no interaction dependent on hover
- keep descriptions short

---

## 9. How Fixify Works

Show the real golden path in a human-readable form.

```text
01  Tell us what is wrong
02  Add photos or video when useful
03  Review the likely service and booking options
04  Meet a verified professional
05  Inspect and approve additional work when required
06  Pay, review and keep the record
```

The visual should feel like a **journey**, not a numbered SaaS feature grid.

Use a connected line/timeline, flowing stages, or a single evolving service-job visualization.

Each stage can reveal more detail as the visitor scrolls.

---

## 10. Show Transparency, Don't Just Say It

A strong homepage should visually demonstrate the pricing philosophy.

Example interactive quote:

```text
Service visit                         ₹ / configured currency
Labour                                …
Materials                             …
Additional work                      …
------------------------------------------
Total                                 …

Nothing extra is approved silently.
```

The numbers used in the public prototype should be illustrative only and clearly marked as examples.

Never imply that every service has a fixed price if the actual pricing model can be inspection-based or quote-based.

Connect this section conceptually to the quote approval flow defined in `PAYMENT_SPEC.md` and `PRODUCT_DECISIONS.md`.

---

## 11. Professional Trust

Instead of a generic "Meet our experts" carousel, explain the system behind trust.

Possible composition:

```text
VERIFIED

Identity
Skill / trade
Service area
Availability
Quality monitoring
```

The point is not to claim that Fixify can eliminate all service risk.

The point is to show that the platform has a process for reducing uncertainty.

Use real professional data only once available.

Before launch, prototype with clearly synthetic data.

---

## 12. Property Record Differentiator

This is one of the most important parts of the homepage.

Most service marketplaces end when the job ends.

Fixify should communicate a longer relationship with the property.

Show a compact property record such as:

```text
MERIDIAN COURT · FLAT 3B

Kitchen plumbing
  Trap replaced · Mar 2026

Split AC
  Service due

Electrical
  RCD test · Nov 2025

[View property record]
```

Explain the benefit in plain language:

> **Every service leaves the property better documented than before.**

This connects directly to the property dashboard and service history in the production app.

---

## 13. Rebooking / Relationship Section

A satisfied customer should not have to start from zero every time.

Show:

```text
Previous professional
Previous service
Property
Book again
```

Copy direction:

> **Found someone you trust? Keep the relationship.**

This reinforces continuity without forcing a subscription model into the homepage.

---

## 14. AI Section

AI should be presented as an assistant, not the hero of the company.

Good positioning:

> **Not sure what the problem is? Start with what you can see.**

Show:

```text
Customer explanation
      +
Photo / video
      ↓
Fixify AI
      ↓
Likely category
Questions to narrow it down
Suggested next step
```

Also show an uncertainty state:

> "We can't confidently identify the issue from this alone. A professional inspection is recommended."

This is important brand behavior: **honest uncertainty creates more trust than artificial certainty.**

Do not advertise:

- guaranteed diagnosis
- guaranteed repair outcome
- AI replacing professionals
- AI-generated final prices

The implementation must follow `AI_SPEC.md`.

---

## 15. Customer CTA

Near the lower portion of the page, provide a strong but calm CTA.

Example:

> **Something at home needs attention?**  
> Start with the problem. We'll take it from there.

Primary:

```text
Describe a problem →
```

Secondary:

```text
Browse services
```

Do not create a second competing CTA such as "Download app", "Book a professional", and "Get quote" all at once.

One primary action should dominate.

---

## 16. Professional CTA

Place the professional recruitment section close to the bottom, before the footer.

Make it visually distinct from the customer CTA.

Suggested direction:

> **For professionals who take their work seriously.**

Supporting message:

> Build a reliable service pipeline, manage jobs clearly and grow your work with Fixify.

Actions:

```text
Become a Fixify professional
Already registered? Sign in
```

This is where the professional entry becomes explicit.

It should feel like a separate door—not a competing homepage audience.

---

## 17. Footer

Footer should complete both journeys without confusing them.

Suggested structure:

```text
FIXIFY
Property service, properly managed.

CUSTOMERS
Services
How it works
Help
Sign in

PROFESSIONALS
Become a professional
Professional sign in

COMPANY
About
Contact
Terms
Privacy

© Fixify
```

Do not add large corporate link forests in the first version.

Keep it useful.

---

## 18. Navigation / Route Map

Public homepage links should resolve to:

```text
/
/services
/services/:slug
/how-it-works
/professionals
/help
```

Customer auth:

```text
/login
/register
/forgot-password
/auth/callback
```

After successful customer authentication:

```text
/app
```

Professional:

```text
/pro
/pro/login
/pro/onboarding
```

The homepage does not itself determine the user's authorization role.

---

## 19. Authentication Behavior

### Existing customer clicks "Sign in"

```text
/ → /login → Supabase Auth → /app
```

### New customer clicks "Describe a problem"

Do not force an account wall unnecessarily.

Preferred flow:

```text
/requests/new or /app/requests/new
      ↓
Allow useful problem intake
      ↓
Ask for authentication when the request must be persisted/booked
      ↓
/login or /register
      ↓
Return user to the request context
```

The exact implementation can depend on the current Next.js routing decision, but the UX should avoid throwing away a customer's problem description because authentication was needed later.

### Person wants to become a professional

```text
/professionals
   ↓
Become a professional
   ↓
/pro/onboarding
   ↓
Authenticate/create account
   ↓
Submit professional information
   ↓
Verification
```

### Existing professional

```text
/professionals
   ↓
Already with Fixify? Sign in
   ↓
/pro/login
   ↓
Supabase Auth
   ↓
verify professional authorization
   ↓
/pro
```

If an authenticated user has no valid professional access, do not simply render the professional dashboard.

Show a clear next step such as onboarding/verification/support based on the user's actual state.

---

## 20. Homepage Components

Recommended Next.js component boundaries:

```text
src/components/marketing/
├── site-header.tsx
├── hero.tsx
├── problem-intake-demo.tsx
├── trust-strip.tsx
├── service-category-grid.tsx
├── workflow-story.tsx
├── pricing-transparency.tsx
├── professional-trust.tsx
├── property-record-preview.tsx
├── rebooking-story.tsx
├── ai-assistant-preview.tsx
├── customer-cta.tsx
├── professional-cta.tsx
└── site-footer.tsx
```

Use reusable UI primitives from:

```text
src/components/ui/
```

Do not place business logic, payment calculations or authorization decisions inside marketing components.

---

## 21. Visual Direction

The homepage follows `BRAND_ASSETS.md` and `DESIGN_BRIEF.md`.

Important:

**Do not copy the prototype's entire visual identity just because the prototype exists.**

The logo/mark geometry is a brand reference.

The homepage should use the broader Fixify design system with:

- light-first, human-friendly surfaces where appropriate
- strong graphite typography
- restrained teal/green action color
- warm clay/ochre accents where they add character
- soft neutral backgrounds
- clear semantic status colors
- subtle depth
- real imagery or purposeful technical illustrations
- restrained lines and geometric motifs

The page should be bright enough to feel approachable and trustworthy.

Dark sections may be used deliberately for contrast, but **dark mode is not the homepage identity requirement**.

Typography should follow the approved design system, not the font choices from the prototype unless those fonts are explicitly adopted elsewhere.

---

## 22. Anti-Generic Design Rules

Kiro must reject the following unless there is a specific product reason:

```text
❌ giant gradient blob hero
❌ three identical feature cards
❌ arbitrary floating glassmorphism cards
❌ excessive rounded pills
❌ random blue/purple startup gradients
❌ fake statistics
❌ AI robot artwork
❌ stock-photo grid with no story
❌ every section centered
❌ every section inside a card
❌ excessive icon decoration
❌ animated elements that do not explain anything
❌ giant "Get Started" CTA with no context
❌ customer/professional role toggle as the main auth pattern
```

Prefer:

```text
✓ editorial composition
✓ asymmetrical but balanced layouts
✓ real product states
✓ meaningful whitespace
✓ varied section rhythm
✓ tactile controls
✓ service-specific visual language
✓ small technical labels where useful
✓ visual hierarchy based on importance
✓ interactive demonstrations of real product flows
```

---

## 23. Motion System

Animation should make the interface easier to understand or more pleasant to use.

### Recommended

- headline line reveal
- section reveal on scroll
- staggered service-category entrance
- timeline progression
- quote line-item reveal
- subtle image parallax
- hover lift measured in a few pixels
- icon/path drawing for the Fixify mark where appropriate
- mobile menu slide/fade
- expanding service details
- button press feedback

### Avoid

- permanent looping movement on every section
- excessive spring physics
- spinning icons
- random floating shapes
- dramatic page transitions between ordinary routes

### Performance rule

Use CSS/DOM animation for most interactions.

Canvas/WebGL is optional only where it materially improves the experience.

When used, it must have:

- visibility-aware rendering
- responsive sizing
- graceful fallback
- reduced-motion behavior
- no dependency on it for core information

---

## 24. Reduced Motion / Accessibility

Support:

```text
prefers-reduced-motion: reduce
```

When reduced motion is enabled:

- remove large parallax
- remove continuous ambient loops
- shorten or remove entrance animations
- preserve content order
- preserve interaction meaning
- use instant or near-instant state changes

The homepage must remain fully understandable without animation.

Keyboard users must be able to access:

```text
navigation
CTAs
service links
interactive previews
mobile menu when open
footer links
```

Do not use color alone to communicate status.

---

## 25. Responsive Behavior

Do not design desktop and simply shrink it.

### Mobile priorities

Order content around the customer task:

```text
Brand
Hero
Describe problem
Service fallback
How it works
Trust
Property record
AI explanation
Customer CTA
Professional CTA
Footer
```

The hero visual may simplify on mobile rather than becoming a tiny desktop composition.

Large interactive demonstrations can collapse into a clean sequence of states.

### Breakpoints

Use the responsive system from `BRAND_ASSETS.md` as guidance, but choose breakpoints based on actual layout behavior rather than forcing arbitrary breakpoint counts.

---

## 26. Data Rules for the Homepage

The public homepage may use static content for marketing copy.

Do not expose private customer/professional data.

Prototype/demo values must be clearly synthetic.

The homepage should not make live database requests merely to render decorative metrics.

Useful dynamic public data may include only intentionally public information such as:

- published service categories
- public service descriptions
- approved public professional content, if the product later supports it
- genuine aggregated public metrics after launch

No private job, payment, property or professional verification records should be fetched into the public page.

---

## 27. State / Error Behavior

Interactive homepage components need proper fallback states.

Example service catalogue failure:

> Services are temporarily unavailable. You can still describe the problem and we'll help from there.

Example auth error:

> We couldn't sign you in. Check your details and try again.

Example demo component failure:

Render the static version of the content instead of leaving an empty region.

The marketing page should never become visually broken because one enhancement failed.

---

## 28. SEO / Metadata Basics

Use a clear page title and description oriented toward the actual customer problem.

Concept direction:

```text
Title:
Fixify — Property maintenance, properly managed.

Description:
Describe a repair or maintenance problem, find the right service,
and connect with a verified professional through Fixify.
```

Do not keyword-stuff.

Use semantic HTML:

```text
<header>
<nav>
<main>
<section>
<h1>
<h2>
<footer>
```

Only one primary `h1`.

---

## 29. CTA Hierarchy

There should be one dominant customer action:

> **Describe a problem**

Secondary:

> Browse services

Tertiary:

> Sign in

Professional:

> Become a professional

This hierarchy should stay consistent throughout the page.

Do not let every section invent its own primary CTA.

---

## 30. Homepage Does Not Become the Customer App

Important architectural boundary:

The public homepage is a marketing + conversion surface.

The customer app starts at:

```text
/app
```

Do not put authenticated dashboard navigation into `/`.

Do not render customer private data on the homepage just because the visitor is authenticated.

If a logged-in customer returns to `/`, they may see a small contextual sign such as:

> Continue your request

or a subtle account entry.

The page should still behave as the public Fixify homepage.

---

## 31. Suggested Logged-In Header Enhancement

When authenticated as a customer:

```text
[Fixify]
Services  How it works  Help

My Fixify   [Describe a problem]
```

`My Fixify` links to:

```text
/app
```

For an authenticated professional who visits `/`:

Do not automatically replace the homepage with `/pro`.

Keep the public homepage intact and provide a discreet route to the professional workspace where appropriate.

Authorization remains server-controlled.

---

## 32. Implementation Order

Build the homepage in this order:

```text
1. Layout shell + brand mark
2. Header / mobile menu
3. Hero + primary CTAs
4. Service navigation
5. Workflow story
6. Trust section
7. Pricing transparency preview
8. Property record preview
9. AI preview
10. Customer CTA
11. Professional CTA
12. Footer
13. Responsive behavior
14. Accessibility
15. Motion refinement
16. SEO metadata
17. Visual QA
```

Do not build the entire page around animation first.

The page must remain useful before motion is added.

---

## 33. Kiro Build Rules

When implementing `/`, Kiro must:

1. Read `MASTER_BLUEPRINT`, `DESIGN_BRIEF`, `BRAND_ASSETS`, `PRODUCT_DECISIONS`, `OPEN_DECISIONS`, `RBAC`, `STATE_MACHINES`, `AI_SPEC`, `PAYMENT_SPEC` and `NOTIFICATION_SPEC` before introducing product behavior.
2. Treat this document as the homepage-specific information architecture and conversion spec.
3. Treat `BRAND_ASSETS.md` as the visual design system, not as permission to copy arbitrary prototype colors/fonts.
4. Treat `FIXIFY_MASTER_BLUEPRINT.md` and the latest business definition as product authority.
5. Never invent public metrics, guarantees, pricing claims, verification claims or service availability.
6. Never create professional privileges from a client-side role switch.
7. Keep customer and professional authentication conceptually separate while using the same Supabase Auth foundation.
8. Keep all authorization decisions on the server/database/RLS boundary.
9. Keep payment logic out of marketing components.
10. Keep AI calls out of client-side secrets.
11. Build responsive and accessible behavior from the beginning rather than patching it afterward.
12. Preserve the public route `/` as the landing page even after the authenticated app is implemented.

---

## 34. Definition of Done

The homepage is ready for the next production-app stage when:

```text
✓ localhost:3000 renders the complete public Fixify homepage
✓ customer understands the product without logging in
✓ primary CTA is clearly Describe a problem
✓ services can be browsed without authentication where intended
✓ customer sign-in routes cleanly to /app
✓ Google OAuth and email auth fit the existing Supabase setup
✓ professional entry is visible but secondary
✓ professional access is protected by actual authorization/verification state
✓ mobile navigation works
✓ keyboard navigation works
✓ reduced motion works
✓ hero has a graceful non-animated fallback
✓ no fake statistics or fake product guarantees
✓ no private data is exposed publicly
✓ page remains useful with JavaScript enhancements unavailable
✓ visual language follows BRAND_ASSETS + DESIGN_BRIEF
✓ homepage does not look like a generic AI SaaS template
```

---

## 35. The Core Design Idea

The homepage should make the customer think:

> **"I don't have to figure everything out myself. I can just tell Fixify what's wrong."**

That is the gateway to the product.

The professional should see a different message:

> **"If you are the person who fixes the problem, there is a professional workspace built for you."**

Two audiences. One platform. Two clearly different doors.

But the homepage remains, first and foremost, **the customer's front door**.

---
