# FIXIFY — PROFESSIONALITY, TRUST, UX & ENGINEERING HARDENING

## Kiro Implementation Orchestration README

**Document purpose:** Implementation specification for turning the existing Fixify application into a more credible, production-shaped property-maintenance platform without inventing requirements, breaking existing business logic, or blindly applying generic UI patterns.

**Primary implementation owner:** Kiro  

**Architecture owner:** Kiro / existing backend architecture  

**Product/design orchestration:** This README  

**Required rule:** Kiro must inspect the repository, existing routes, Supabase schema/RLS, auth implementation, components, environment configuration, and current rendered behavior before changing anything.

---

# 0. NON-NEGOTIABLE OPERATING RULES

## 0.1 Do not blindly implement this document

This README is an orchestration specification, not permission to assume that every recommendation maps directly to the current codebase.

Before implementation Kiro MUST:

1. Inspect the current repository structure.

2. Identify the actual implementation of authentication, sessions, middleware/proxy, route protection, Supabase clients, RLS, forms, dashboards, layouts and public pages.

3. Search for existing equivalents before creating new components.

4. Inspect current `package.json` and installed dependencies before adding packages.

5. Inspect the existing design tokens before introducing new colors or themes.

6. Inspect actual route behavior instead of assuming route names.

7. Inspect current cookie names and session handling before modifying cookie behavior.

8. Inspect current database tables and RLS before changing authorization logic.

9. Inspect whether analytics, consent, tracking, third-party embeds or SDKs actually exist before adding consent requirements.

10. Question every recommendation whose implementation depends on an unknown product/legal decision.

If an assumption is necessary, Kiro must document:

- **Assumption**

- **Why it is needed**

- **Evidence**

- **Risk if wrong**

- **Question requiring product-owner confirmation**

Do not silently convert assumptions into business rules.

---

# 1. PRODUCT CONTEXT

Fixify is an on-demand property-maintenance marketplace.

The core user journeys are:

### Customer

Visitor → understand Fixify → sign up/login → describe property problem → select/confirm service → provide relevant property/job information → request service → track job → review inspection/quote → approve when required → follow progress → completion/evidence → retain property/service history.

### Professional

Professional → authenticate → maintain profile/verification → receive eligible requests → review request → accept/decline → schedule/visit → inspect → record findings → draft quote where applicable → obtain customer approval → perform work → upload completion evidence → complete job.

### Admin / Operations

Admin → authenticate → access operations workspace → monitor jobs/users/professionals → investigate exceptions → verify professionals → resolve disputes/reassignments → inspect audit history → monitor operational/system signals.

The application therefore needs to communicate four things clearly:

1. **Trust** — users understand who is handling their information and service request.

2. **Control** — users understand what they are approving or sharing.

3. **Reliability** — the interface behaves predictably under loading, errors, slow networks and expired sessions.

4. **Professionalism** — the application feels like a real operational product rather than a generated demo.

---

# 2. IMPLEMENTATION STRATEGY

Do NOT implement all recommendations simultaneously.

Use this sequence:

1. **Phase 0 — Discovery and assumption register**

2. **Phase 1 — Legal/privacy information architecture**

3. **Phase 2 — Authentication, consent and security hardening**

4. **Phase 3 — UX state system**

5. **Phase 4 — Responsive/mobile/accessibility hardening**

6. **Phase 5 — Performance and caching**

7. **Phase 6 — SEO and web standards**

8. **Phase 7 — Engineering/security review**

9. **Phase 8 — Product instrumentation and adoption measurement**

10. **Phase 9 — Full QA and release gate**

The ordering is intentional.

Do not optimize SEO before authentication/privacy basics are understood.  

Do not introduce optimistic updates before the mutation semantics are known.  

Do not introduce aggressive caching around authenticated/private data without proving the cache cannot leak another user's data.  

Do not add consent UI for trackers that do not exist.

---

# 3. PHASE 0 — DISCOVERY & ASSUMPTION REGISTER

## Objective

Build a factual map of the current application before changing behavior.

## Kiro must inspect

### Frontend

- `src/app`

- route groups

- layouts

- middleware/proxy

- loading/error/not-found files

- public marketing pages

- authentication pages

- customer dashboard

- professional dashboard

- admin dashboard

- shared components

- design tokens

- global CSS

- Tailwind configuration

- image handling

- animation libraries

### Authentication

Determine:

- Which Supabase auth flow is used.

- Whether `@supabase/ssr` is used.

- Where browser Supabase client is created.

- Where server Supabase client is created.

- How session cookies are written/refreshed.

- How protected routes are identified.

- How role is derived.

- Where logout happens.

- Whether middleware/proxy uses `getSession()` or a stronger server-side verification mechanism.

- Whether tokens are ever exposed to browser JavaScript unnecessarily.

- Whether auth state is duplicated in localStorage/sessionStorage.

Supabase currently recommends cookie-based SSR sessions for Next.js and warns that server-side protection should not blindly trust `getSession()`; current guidance points to `getClaims()` for protecting pages/data. Verify the exact implementation against the installed/current Supabase packages before modifying it.

### Database

Inspect:

- tables

- views

- RPCs

- functions

- triggers

- RLS policies

- role/profile relationships

- job ownership

- professional ownership

- admin privileges

- audit tables

- storage policies

### Product tracking

Search for:

- Google Analytics

- GTM

- Meta Pixel

- PostHog

- Sentry

- Hotjar

- Microsoft Clarity

- embedded maps

- chat widgets

- YouTube/Vimeo

- payment SDKs

- external fonts

- social embeds

- other third-party scripts

### Output

Create an internal implementation note documenting assumptions:

```text
ASSUMPTION REGISTER

A-001:
Finding:
Evidence:
Decision:
Owner:
Risk:
Requires confirmation: YES/NO
```

No Phase 1+ implementation should proceed on an unresolved high-risk security assumption.

---

# 4. PHASE 1 — LEGAL, PRIVACY & TRUST FOUNDATION

## Objective

Make the application transparent about what it does, what it collects and what users agree to.

This is not a legal certification. Kiro must NOT invent claims such as "GDPR compliant", "DPDP compliant", "fully compliant", "PCI compliant", etc.

Legal text must be treated as product/legal content requiring owner/legal review.

## 4.1 Terms & Conditions

Create or refine a public Terms page.

Recommended route: `/terms`

Content should cover, where applicable:

- service description
- account eligibility
- account responsibilities
- customer responsibilities
- professional responsibilities
- service requests
- inspection and estimates
- quote approval
- cancellation
- no-show handling
- prohibited conduct
- property/access responsibilities
- user-generated content
- photographs/videos
- service records
- dispute handling
- platform vs professional responsibilities
- intellectual property
- limitation of liability
- disclaimers
- suspension/termination
- changes to terms
- governing law/jurisdiction
- contact method

**Important:** Do NOT invent cancellation windows, refund percentages, guarantees, service warranties, legal jurisdiction, or liability limits. If these are not defined by the business, create explicit placeholders and ask the owner.

## 4.2 Privacy Policy

Recommended route: `/privacy`

Explain in human language:

**Data categories** — Potential examples, only if actually collected:

- name
- email
- phone
- account identifiers
- property information
- service request descriptions
- uploaded images/videos
- job notes
- location/address
- professional verification documents
- payment-related identifiers
- device/browser information
- security logs
- analytics information

For each category document:

- What is collected
- Why it is collected
- Whether it is required
- Where it is stored
- Who can access it
- How long it is retained
- Whether it is shared with service providers
- User controls/rights where applicable

Do not claim that Fixify collects something merely because the database contains a field. Verify actual runtime behavior.

## 4.3 Data minimization

Apply: Collect only what is required for a defined product purpose.

For example, a customer requesting a plumber may need:
- problem description
- property/service location
- scheduling information
- contact information

They should not be forced to provide unrelated personal information merely because a form component can collect it.

For uploaded media, establish:
- maximum file size
- supported formats
- purpose
- retention
- deletion behavior
- who can access the file

## 4.4 Refund Policy

Create: `/refund-policy`

But only publish concrete refund promises if the business has decided them. If payments are not currently live, the page can state the current operational status rather than pretending a payment system is active. Avoid fake Razorpay/payment guarantees.

## 4.5 Cookie policy

Create: `/cookies`

Separate cookies into:

1. Strictly necessary
2. Authentication/session
3. Preferences
4. Analytics
5. Marketing/advertising

The exact list must come from an actual cookie inventory. Do not add a fake cookie banner simply because it looks professional.

## 4.6 Cookie consent

If non-essential tracking exists:

- show a concise first-visit banner
- explain categories
- provide accept/reject/manage choices where applicable
- store consent state
- do not load non-essential tracking before required consent
- provide a way to change preferences later

Authentication cookies are fundamentally different from optional analytics cookies. Do not block necessary authentication merely because an analytics consent state is false.

## 4.7 Consent on forms

For account creation and other legally/product-sensitive forms:

Use explicit language such as:

> By creating an account, you agree to the Terms and acknowledge the Privacy Policy.

Do not use: "By continuing, you agree to everything."

Consent checkboxes must not be preselected when affirmative consent is legally required.

For optional communications:

- separate consent
- optional checkbox
- clear purpose
- ability to withdraw later

## 4.8 Last updated dates

Legal pages should display:

- Last updated
- Effective date, where appropriate

Do not fabricate dates. Use a maintained constant/content source.

---

# 5. PHASE 2 — AUTHENTICATION, SESSION SECURITY & RBAC

## Objective

Make login/logout/session handling robust across Customer, Professional and Admin roles.

OWASP treats session identifiers as security-sensitive credentials and recommends secure lifecycle management, proper invalidation, secure cookie attributes and server-side authorization.

## 5.1 Authentication vs authorization

Never treat: logged in = authorized for everything

Correct model:

```
Authentication
    ↓
Who is this user?
    ↓
Authorization
    ↓
What role/resources/actions may this user access?
```

Roles must be enforced server-side. Client-side role checks are UX only.

## 5.2 Route protection

Define route classes:

**PUBLIC**
- `/auth/*`
- `/`
- `/services/*`
- `/help`
- `/privacy`
- `/terms`
- `/cookies`

**CUSTOMER**
- `/customer/*`
- `/customer/bookings/*`
- `/customer/properties/*`

**PROFESSIONAL**
- `/pro/*`
- `/professional/*`

**ADMIN**
- `/admin/*`

Use the actual project routes after inspection; this list is illustrative.

Unauthorized users should receive:
- redirect to login when appropriate
- preservation of intended destination only when safe
- no leakage of protected content before redirect

## 5.3 Cross-role testing

Explicitly test:

- Customer → `/admin`
- Customer → `/pro`
- Professional → `/admin`
- Professional → another customer's booking
- Admin → customer-only workflow where inappropriate

Expected:

- HTTP-level/server-level denial
- safe UI response
- no sensitive payload leaked

Never rely on: `if (role !== "admin") return null;` as the only protection.

## 5.4 Logout

Every authenticated dashboard must have a visible logout action.

Logout must:

1. call the actual Supabase logout/session termination mechanism
2. clear/invalidate the server session
3. clear relevant auth cookies
4. clear client auth state
5. invalidate private cached data
6. navigate to a public route
7. prevent authenticated pages from being rendered from stale client state

After logout, test:
- dashboard URL directly
- browser Back
- browser Forward
- refresh
- new tab
- mobile back gesture
- manually typed protected URL

The user should not regain authorized server data.

**Important distinction:** Browser back may display a previously rendered page from browser history in some situations. The security requirement is not "erase browser history"; it is:

> A previously viewed private page must not become usable or fetch protected data after logout.

## 5.5 Cookie security

Inspect every cookie.

For session cookies, verify appropriate:
- `Secure`
- `HttpOnly`
- `SameSite`
- `Path`
- expiration/max-age

Do not invent cookie names or manually rewrite Supabase's session model without understanding the installed SSR package.

Supabase's SSR architecture uses cookies for server/client session availability and refresh-token rotation.

Never store authentication tokens in:
- localStorage
- sessionStorage
- URL query parameters

OWASP specifically warns against storing session/refresh tokens in browser storage accessible to JavaScript.

## 5.6 Cache-control

Authenticated/private pages must not be accidentally publicly cached.

Inspect:
- Next.js caching
- route caching
- fetch caching
- CDN/Vercel caching
- browser cache headers
- server component data caching
- client query caching

Use `private`/`no-store` behavior where appropriate for highly sensitive user-specific data.

Do NOT globally disable caching. Public marketing pages can be cached aggressively. Private customer/professional/admin data requires a different strategy.

## 5.7 Session expiry

Handle expired sessions gracefully.

Flow:

```
Protected request
   ↓
Session valid?
   ├─ YES → continue
   └─ NO
       ↓
clear stale client state
       ↓
redirect to login
       ↓
preserve safe destination
```

Never expose an exception stack or raw auth token.

## 5.8 Sensitive actions

Consider reauthentication for high-risk actions such as:
- changing email
- changing password
- deleting account
- sensitive professional verification changes
- high-impact admin operations

Do not add unnecessary reauthentication to ordinary navigation.

---

# 6. PHASE 3 — UX STATE SYSTEM

## Objective

Stop the application from looking like a static prototype.

Every meaningful async interaction should define:

```
idle → loading → success → error
```

For data fetching:

```
loading → loaded → empty → error
```

For mutations:

```
ready → submitting → success → failure
```

For long-running operations:

```
queued → processing → complete → failed
```

## 6.1 Skeleton loaders

Use skeletons where content layout is known.

**Good:**
- dashboard cards
- booking rows
- property cards
- tables
- profile sections
- service lists

**Bad:**
- tiny 200ms operations
- buttons where a disabled/loading state is clearer
- decorative skeletons that create more noise than value

Skeletons must approximate the final geometry to prevent layout shift.

## 6.2 Tooltips

Use tooltips for icon-only controls.

Every icon-only button must also have:
- accessible name
- keyboard access
- visible focus state

Tooltip is not a replacement for accessible naming.

## 6.3 Password visibility

Login/register/reset forms should provide:
- show/hide password
- accessible label
- no password value logging
- no password persistence in localStorage
- sensible autocomplete attributes

## 6.4 Form validation

Validation should occur:
- client-side for immediate feedback
- server-side for security and integrity

Never trust client validation.

Errors should identify:

> What is wrong? How do I fix it?

Avoid: "Invalid input."

Prefer: "Enter a valid phone number, including the country code."

## 6.5 Success states

Do not merely show: "Success!"

Use:
- what happened
- what happens next
- relevant navigation

Example:

> Request submitted
> Your request is now waiting for professional review.

## 6.6 Confirmation dialogs

Use confirmation dialogs for destructive or consequential actions:
- delete
- cancel booking
- reject quote
- reassign job
- suspend professional
- remove property

Do not use dialogs for every button.

## 6.7 Empty states

Empty states must be purposeful.

**Customer:**

> No active requests
> Describe a property problem to get started.

**Professional:**

> No requests to review
> New matching requests will appear here.

**Admin:**

> No unresolved items
> Operations are currently clear.

Never show meaningless: `0 0 0 0` as the primary dashboard experience.

## 6.8 Error states

Every critical route needs a useful fallback.

Include:
- readable explanation
- retry
- navigation back
- support/help route where appropriate

Do not expose database errors.

---

# 7. PHASE 4 — RESPONSIVE DESIGN & ACCESSIBILITY

## 7.1 Target viewports

At minimum verify:
- 320px
- 390px
- 768px
- 1024px
- 1280px
- 1440px

Do not design only for 1440px.

## 7.2 Mobile navigation

Verify:
- menu button
- aria-expanded
- aria-controls
- keyboard access
- visible open state
- body scroll behavior
- close behavior
- Escape key
- focus behavior

## 7.3 Sticky headers

Use only where they help.

Avoid:
- consuming too much mobile viewport
- overlapping anchors
- hiding focused elements

## 7.4 Skip link

Add a keyboard-accessible: "Skip to main content"

The target must exist and be focusable.

## 7.5 Keyboard navigation

Every interactive element must be reachable with Tab.

Test:
- header
- navigation
- forms
- dropdowns
- dialogs
- tables
- icon controls
- dashboards

Do not use clickable `<div>` elements when a semantic `<button>` or `<a>` is appropriate.

## 7.6 Color contrast

Use WCAG 2.2 as the accessibility target.

Verify:
- body text
- secondary text
- buttons
- focus indicators
- disabled states
- form errors
- status badges

Do not fix contrast by destroying the Fixify brand palette; adjust shade, size, weight or surface instead.

## 7.7 Images and alt text

**Rules:**

- **Informative image** → Meaningful alt text.
- **Decorative image** → Empty alt or equivalent accessibility exclusion.
- **Functional image** → Alt should communicate the action/destination.

Do not write: "Image of Fixify" when the image's actual purpose is: "Plumber inspecting a leaking kitchen sink."

Do not duplicate adjacent visible text in alt text.

---

# 8. PHASE 5 — PERFORMANCE & RESPONSIVENESS

## Objective

Make the site feel fast without creating stale-data or security problems.

## 8.1 Caching model

Separate data into:

**Public static data**
Examples:
- marketing copy
- service categories
- public FAQ
- public legal pages

Can usually tolerate caching.

**User-private data**
Examples:
- bookings
- properties
- profile
- notifications
- quotes

Must be scoped to authenticated identity.

**Highly volatile operational data**
Examples:
- job state
- quote status
- active dispatch
- admin alerts

Should use short freshness windows or realtime mechanisms where already supported.

Never introduce a cache key that could return `/customer/A` to `/customer/B`.

## 8.2 Optimistic updates

Only use optimistic UI when the operation is:
- reversible or safely recoverable
- deterministic
- likely to succeed
- visually understandable if rolled back

**Good examples:**
- preference toggle
- simple UI state
- read/unread state

**Use caution for:**
- job state transitions
- quote approval
- cancellations
- professional acceptance
- payment-related state

For critical business transitions, server confirmation should remain authoritative.

## 8.3 State synchronization

After a mutation:

```
User action
   ↓
server validates authorization
   ↓
DB mutation / RPC
   ↓
state-machine validation
   ↓
audit event
   ↓
response
   ↓
refresh/revalidate affected UI
```

Do not fake success by mutating only React state.

## 8.4 Core Web Vitals

Target:
- LCP: good ≤ 2.5s
- INP: good ≤ 200ms
- CLS: good ≤ 0.1

These are practical targets, not excuses to sacrifice usability.

Inspect:
- large hero images
- font loading
- hydration cost
- excessive client components
- animation workload
- third-party scripts
- layout shifts
- large JavaScript bundles

## 8.5 Images

Use Next.js image optimization where appropriate.

Check:
- correct dimensions
- responsive sizes
- modern formats
- lazy loading below the fold
- priority loading only for actual LCP candidates
- no massive uncompressed assets

Do not lazy-load the primary above-the-fold LCP image if that delays the page's primary visual.

---

# 9. PHASE 6 — SEO & WEB STANDARDS

## 9.1 Metadata

Every public indexable page should have:
- title
- description
- canonical URL where appropriate
- Open Graph metadata
- Twitter/social metadata where appropriate

Avoid duplicate generic titles.

Example structure:

> Fixify | Property Maintenance, Made Simple

Then route-specific titles.

## 9.2 Robots

Create a robots configuration appropriate to Next.js.

Public marketing pages may be indexable.

Private routes should not be index targets.

Examples likely requiring `noindex`:
- `/auth/*`
- `/customer/*`
- `/pro/*`
- `/admin/*`

Verify actual routes before implementing.

Next.js supports robots directives and metadata through its supported metadata mechanisms.

## 9.3 Sitemap

Create a sitemap containing only meaningful public URLs.

Do not include:
- authenticated dashboards
- account-specific pages
- temporary test pages
- duplicate routes

## 9.4 Canonical URLs

Use canonical URLs to reduce duplicate indexing.

Do not blindly canonicalize every route to `/`.

Canonical should represent the preferred public URL for equivalent content.

## 9.5 Headings

Each public page should have a clear heading hierarchy:

```
H1
 ├─ H2
 │   ├─ H3
 │   └─ H3
 └─ H2
```

Avoid using heading tags only for visual sizing.

## 9.6 Structured data

Only add schema types that accurately represent Fixify.

Potential candidates:
- Organization
- WebSite
- FAQPage where content genuinely qualifies
- Service where appropriate

Do not manufacture reviews, ratings, prices or business facts.

## 9.7 Internal links

Connect relevant public pages:

Homepage → Services → How it works → Help → Terms → Privacy → Contact/support

Fix broken links instead of hiding them.

## 9.8 URL hygiene

Prefer stable readable routes.

Avoid unnecessary query parameters for content identity.

Do not change existing production URLs without a migration/redirect plan.

## 9.9 Open Graph

Create a professional default OG image.

It should contain:
- Fixify brand
- concise proposition
- no excessive text
- correct dimensions

Use route-specific OG images only where the benefit justifies the complexity.

## 9.10 Search Console

Prepare the site for Google Search Console verification.

Do not claim verification unless actually completed.

## 9.11 llms.txt

Treat `llms.txt` as optional experimental metadata, not a replacement for:
- sitemap
- robots
- structured data
- accessible content

Create it only if it provides useful machine-readable orientation for public Fixify content. Do not put private information in it.

## 9.12 UTM tracking

If marketing campaigns are actually planned:

Use consistent parameters:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

Do not store arbitrary URL parameters permanently in user profiles.

If attribution is implemented, document:
- retention
- consent implications
- attribution window
- first-touch vs last-touch logic

---

# 10. PHASE 7 — ENGINEERING, SECURITY & THIRD-PARTY RIGOR

## 10.1 HTTPS

Production must use HTTPS.

Do not create custom client-side redirects as the primary HTTPS security mechanism if the hosting platform already enforces TLS.

Verify:
- HTTP → HTTPS behavior
- secure cookies
- no mixed content

## 10.2 Third-party embeds

Inventory every external resource.

For each:

```
Provider:
Purpose:
Data sent:
Cookies:
Required:
Consent required:
Fallback:
Failure impact:
```

Remove unnecessary third-party scripts.

Every third-party dependency increases:
- privacy surface
- performance cost
- failure surface
- supply-chain risk

## 10.3 SDK validation

Before adding an SDK:

1. Verify official package/source.
2. Verify current compatibility with Next.js 16/React 19.
3. Check bundle impact.
4. Check whether a native platform feature already solves the problem.
5. Check server/client execution boundaries.
6. Check privacy implications.
7. Check licensing.
8. Check maintenance status.

Do not install packages merely because an AI-generated UI example uses them.

## 10.4 Server/client boundaries

Audit every `'use client'`.

Ask: Does this component actually require browser state, effects or event handlers?

If not, prefer a Server Component. But do not force Server Components where interaction requires client state.

## 10.5 Input validation

Every mutation must validate on the server.

Validate:
- type
- format
- length
- allowed enum values
- ownership
- authorization
- state transition
- resource existence

Client validation is convenience, not security.

## 10.6 IDOR protection

For every route like:

- `/bookings/[id]`
- `/properties/[id]`
- `/jobs/[id]`
- `/quotes/[id]`

ask: What prevents User A from requesting User B's ID?

The answer must be server-side authorization/RLS, not obscurity.

## 10.7 RLS

Review policies against actual use cases.

For each sensitive table document:

```
SELECT:
INSERT:
UPDATE:
DELETE:
Role:
Ownership condition:
State condition:
```

Ensure admin policies do not accidentally expose everything to ordinary users.

Supabase integrates Auth JWTs with Postgres RLS, making RLS a core authorization boundary rather than merely a database convenience.

## 10.8 Error handling

Create proper:
- `not-found`
- `error`
- `global-error` where appropriate
- route-specific loading states

Never show:
- SQL errors
- stack traces
- raw Supabase errors containing internal details
- tokens
- internal IDs unnecessarily

Log useful diagnostic information server-side without logging secrets.

---

# 11. PHASE 8 — PRODUCT ADOPTION & OBSERVABILITY

The phrase "check user adoption" must be translated into measurable product behavior.

Do not add analytics blindly.

Define a small event vocabulary around actual product outcomes.

**Possible events:**

- `landing_viewed`
- `service_category_selected`
- `intake_started`
- `intake_submitted`
- `signup_started`
- `signup_completed`
- `login_success`
- `request_created`
- `professional_request_viewed`
- `professional_request_accepted`
- `inspection_recorded`
- `quote_created`
- `quote_viewed`
- `quote_approved`
- `job_completed`

Only implement events that correspond to real implemented actions.

## 11.1 Funnel

**Customer:**

```
Landing
 ↓
Intake start
 ↓
Request submitted
 ↓
Professional matched/assigned
 ↓
Inspection
 ↓
Quote
 ↓
Approval
 ↓
Completion
```

Measure conversion and drop-off at each meaningful stage.

## 11.2 Error observability

Track:
- authentication failures
- authorization denials
- failed mutations
- state transition failures
- upload failures
- notification failures
- unexpected server errors

Do not send sensitive personal data to analytics/error providers unnecessarily.

---

# 12. PHASE 9 — QA & RELEASE GATE

No phase is complete because code "looks correct". It is complete when behavior has been tested.

## 12.1 Browser matrix

Test:
- Chromium
- Safari/WebKit where available
- mobile viewport
- desktop viewport

If a browser environment is unavailable, mark it **BLOCKED** rather than pretending it passed.

## 12.2 Authentication QA

Test:

**Customer**
- login
- logout
- refresh
- Back
- direct protected URL
- session expiry
- wrong role

**Professional**
Same.

**Admin**
Same, plus:
- unauthorized role access
- admin-only operations

## 12.3 Privacy QA

Verify:
- private pages are not publicly indexable
- no sensitive data in URLs
- no auth tokens in localStorage
- cookies have appropriate flags
- analytics do not load before required consent
- logout invalidates the session
- private data cannot cross user boundaries

## 12.4 Accessibility QA

Test:
- keyboard-only navigation
- focus visibility
- screen-reader naming
- headings
- labels
- form errors
- contrast
- reduced motion
- touch target sizing

## 12.5 Performance QA

Measure:
- LCP
- INP
- CLS
- JS bundle
- image payload
- number of network requests
- third-party script cost

Do not chase a perfect Lighthouse score while degrading the actual user experience.

## 12.6 Functional QA

Test every major mutation:

```
UI action
→ request
→ authorization
→ database
→ state transition
→ audit
→ response
→ UI synchronization
```

The UI must reflect the server's result.

---

# 13. IMPLEMENTATION PRIORITY MATRIX

## P0 — Security / privacy / correctness

Implement first:

1. Authentication route protection
2. Server-side RBAC
3. RLS verification
4. Logout/session invalidation
5. Private cache protection
6. IDOR checks
7. Secure cookie audit
8. Protected route noindex
9. Sensitive error redaction
10. Form server-side validation

These are not cosmetic.

## P1 — Trust & professional product behavior

1. Terms
2. Privacy
3. Cookie policy
4. Consent architecture if actually required
5. Refund policy based on actual business rules
6. Legal-page metadata/last-updated
7. Skeleton states
8. Empty states
9. Error states
10. Success states
11. Password visibility
12. Confirmation dialogs
13. Mobile navigation
14. Keyboard/focus support

## P2 — Performance & discoverability

1. Image optimization
2. Core Web Vitals improvements
3. Appropriate caching
4. Sitemap
5. robots
6. canonical metadata
7. titles/descriptions
8. OG image
9. structured data
10. internal-link cleanup

## P3 — Growth / refinement

1. Analytics event model
2. UTM attribution
3. adoption funnel
4. optional llms.txt
5. advanced optimistic UI
6. richer micro-interactions
7. additional performance optimization

---

# 14. WHAT NOT TO DO

Kiro must NOT:

- invent legal claims
- invent refund rules
- invent retention periods
- invent jurisdiction
- install random UI/analytics packages
- add a cookie banner without identifying actual non-essential cookies
- store auth tokens in localStorage
- trust client-side role checks
- use mock data to hide missing backend functionality
- cache private data publicly
- make every page no-store just to avoid thinking about caching
- make every interaction optimistic
- add dark mode merely because it is fashionable
- add animations that reduce accessibility or performance
- add schema markup with fake facts
- add fake reviews or ratings
- expose database errors to users
- expose internal Supabase service-role credentials to the browser
- rewrite existing business logic without tracing its dependencies
- modify payment architecture during this phase
- touch Razorpay integration unless a separate payment implementation task is explicitly authorized

---

# 15. KIRO EXECUTION FORMAT

For each phase, Kiro should report:

```
PHASE:
STATUS:

FILES INSPECTED:

CURRENT BEHAVIOR:

FINDINGS:

ASSUMPTIONS:

QUESTIONS / BLOCKERS:

CHANGES PROPOSED:

FILES TO CHANGE:

SECURITY IMPACT:

DATA / RLS IMPACT:

UX IMPACT:

TEST PLAN:

RESULTS:

REMAINING RISKS:
```

Do not report "implemented" when only source code was changed.

Use:
- `IMPLEMENTED`
- `VERIFIED`
- `PARTIALLY VERIFIED`
- `BLOCKED`
- `REQUIRES OWNER DECISION`

---

# 16. DEFINITION OF DONE

A recommendation is **DONE** only when:

## Product

- behavior matches the intended user journey
- no unnecessary complexity was introduced

## Security

- server-side authorization is enforced
- private data remains private
- session lifecycle is correct

## UX

- loading/error/empty/success states exist where appropriate
- mobile behavior is usable
- keyboard behavior works

## Performance

- no obvious layout shift
- no unnecessary network calls
- images/scripts are appropriately loaded

## Accessibility

- semantic controls
- labels
- focus
- contrast
- reduced-motion behavior

## SEO

For public pages only:

- metadata
- canonical where appropriate
- robots
- sitemap
- internal links

## QA

- real browser inspection completed
- regression tests completed
- security negative tests completed

---

# 17. FINAL RELEASE CHECKLIST

## Legal / privacy

- [ ] Terms reviewed by owner/legal reviewer
- [ ] Privacy Policy reviewed
- [ ] Cookie inventory verified
- [ ] Consent behavior verified
- [ ] Refund policy reflects actual business rules
- [ ] Data collection inventory matches implementation
- [ ] Retention/deletion behavior documented

## Authentication

- [ ] Customer auth works
- [ ] Professional auth works
- [ ] Admin auth works
- [ ] Logout works everywhere
- [ ] Back button does not restore usable private state
- [ ] Direct URL access is protected
- [ ] Session expiry handled
- [ ] Cookies reviewed
- [ ] No auth tokens in browser storage
- [ ] RBAC server-enforced

## Data

- [ ] RLS policies reviewed
- [ ] IDOR tests pass
- [ ] Customer isolation verified
- [ ] Professional isolation verified
- [ ] Admin access verified
- [ ] Storage policies reviewed

## UX

- [ ] Skeletons
- [ ] Empty states
- [ ] Error states
- [ ] Success states
- [ ] Form validation
- [ ] Password visibility
- [ ] Confirmation dialogs
- [ ] Tooltips
- [ ] Mobile navigation
- [ ] Focus states
- [ ] Skip link

## Performance

- [ ] LCP reviewed
- [ ] INP reviewed
- [ ] CLS reviewed
- [ ] Images optimized
- [ ] Third-party scripts reviewed
- [ ] Public caching reviewed
- [ ] Private caching reviewed

## SEO

- [ ] sitemap
- [ ] robots
- [ ] metadata
- [ ] canonical
- [ ] OG image
- [ ] headings
- [ ] schema
- [ ] internal links
- [ ] broken links
- [ ] Search Console readiness

## Engineering

- [ ] TypeScript passes
- [ ] lint passes
- [ ] production build passes
- [ ] browser QA passes
- [ ] mobile QA passes
- [ ] reduced-motion QA passes
- [ ] security negative tests pass
- [ ] no secrets exposed
- [ ] no fake/mock production behavior introduced

---

# 18. FINAL ORCHESTRATOR DIRECTIVE

The goal is NOT to make Fixify contain every feature listed in this README.

The goal is to make Fixify feel and behave like a credible product.

Prioritize:

```
Security
   ↓
Correctness
   ↓
Trust
   ↓
Clarity
   ↓
Responsiveness
   ↓
Performance
   ↓
Discoverability
   ↓
Polish
```

A polished UI sitting on insecure authorization is a failure. A technically secure application that behaves like a static demo is also a failure.

Kiro must therefore treat every implementation as a system change:

```
USER INTENT
    ↓
UI
    ↓
VALIDATION
    ↓
AUTHENTICATION
    ↓
AUTHORIZATION
    ↓
SERVER ACTION / RPC
    ↓
DATABASE / RLS
    ↓
STATE MACHINE
    ↓
AUDIT / OBSERVABILITY
    ↓
REVALIDATION / STATE SYNC
    ↓
USER FEEDBACK
```

If any link in this chain is unknown, stop and inspect it.

If the business rule is unknown, ask.

If the security boundary is unknown, do not guess.

If the visual behavior cannot be rendered and verified, mark it **BLOCKED**.

If a recommendation is unnecessary for the actual Fixify use case, reject it.

**The standard is not "the code changed."** The standard is:

> The product behavior is correct, secure, understandable, responsive, and verified.
