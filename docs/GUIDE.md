# FIXIFY — BUILD EXECUTION GUIDE

## Next.js + pnpm + Supabase Auth + Supabase Postgres/Storage/Realtime + Kiro + Lovable Prototype

This document is the operating manual for turning `FIXIFY_MASTER_BLUEPRINT.md` into a working product.

It deliberately separates:

**Design prototyping** → Lovable
**Production application** → Next.js
**Backend/database/security logic** → Kiro + Supabase
**Version control** → GitHub

The production Next.js repository is the only source of truth for the real application.

---

# 0. ARCHITECTURE DECISION

## The final production stack

```text
Frontend + App
    ↓
Next.js
React
TypeScript
Tailwind CSS
pnpm

    ↓

Authentication
    ↓
Supabase Auth
    ├── Email/password
    └── Google OAuth

    ↓

Database
    ↓
Supabase PostgreSQL
    └── Row Level Security

    ↓

Storage
    ↓
Supabase Storage

    ↓

Realtime
    ↓
Supabase Realtime

    ↓

Server / Backend Logic
    ↓
Next.js Route Handlers / Server Actions
+
Supabase SQL Functions / Triggers
+
Supabase Edge Functions where external/webhook workloads justify them

    ↓

External services
    ├── Payment provider
    ├── AI provider
    ├── Email/notification provider
    └── Maps/location provider
```

Supabase Auth supports both password authentication and Google OAuth. Its Next.js guidance uses `@supabase/ssr` for cookie-based sessions across client and server components.

---

# 1. IMPORTANT TOOL RESPONSIBILITIES

## Lovable

Lovable is used for:

* visual exploration
* landing-page design
* component concepts
* interaction concepts
* motion concepts
* responsive layout experimentation
* design validation

Lovable is NOT the production code owner.

Do not give Lovable responsibility for:

* production authentication
* production database schema
* RLS
* payments
* job-state transitions
* financial calculations
* production API contracts
* security rules

---

# 2. KIRO

Kiro owns:

* Supabase schema
* SQL migrations
* RLS policies
* Postgres functions
* database triggers
* state machine
* quote approval logic
* pricing logic
* payment integration
* webhooks
* AI server integration
* notification infrastructure
* server-side validation
* production backend logic
* security review
* tests

Kiro may also modify Next.js server code when required.

---

# 3. YOU

You own:

* product decisions
* reviewing requirements
* reviewing Kiro changes
* reviewing UI
* accepting/rejecting architecture decisions
* local testing
* Git workflow
* deployment decisions
* business rules not yet decided

Do not let either coding agent silently decide:

* commission percentage
* cancellation fees
* warranty period
* launch geography
* tax rules
* professional payment terms
* pricing policy

Those are business decisions.

---

# 4. GITHUB IS THE PRODUCTION SOURCE OF TRUTH

The production repository is:

```text
fixify
```

Recommended:

```text
main
develop
feature/*
```

Example:

```text
main
develop
feat/supabase-auth
feat/properties
feat/bookings
feat/job-state-machine
feat/payments
```

Do not allow agents to randomly overwrite `main`.

Recommended process:

```text
feature branch
      ↓
test
      ↓
review
      ↓
merge
      ↓
develop
      ↓
final verification
      ↓
main
```

---

# 5. LOVABLE REPOSITORY RULE

Because Lovable currently does not provide a clean arbitrary-existing-repository import workflow, do NOT make the production Next.js GitHub repository a Lovable project.

Instead:

```text
fixify
    ↓
PRODUCTION NEXT.JS REPOSITORY


fixify-ui-reference
    ↓
OPTIONAL LOVABLE DESIGN PROTOTYPE
```

These are separate.

Lovable can be used to explore:

```text
Homepage
Booking flow
Customer dashboard
Professional dashboard
Admin dashboard
AI assistant
Property dashboard
```

Then reproduce the approved design in Next.js.

This is much cleaner than trying to convert a Lovable-generated application back and forth between frameworks.

---

# 6. FIRST THING TO DO — FREEZE THE PRODUCT DOCUMENTATION

Before writing application code, create:

```text
docs/
├── FIXIFY_MASTER_BLUEPRINT.md
├── PRODUCT_DECISIONS.md
├── DATA_MODEL.md
├── STATE_MACHINE.md
├── API.md
├── RBAC.md
├── DESIGN_BRIEF.md
├── AI_SPEC.md
├── PAYMENT_SPEC.md
├── NOTIFICATION_SPEC.md
├── TEST_PLAN.md
└── OPEN_DECISIONS.md
```

The 103-point blueprint remains the product source of truth.

This execution guide controls implementation order and tooling.

---

# 7. PRODUCT DECISIONS

Create `docs/PRODUCT_DECISIONS.md`.

Record:

```text
Launch city
Launch service categories
Currency
Pricing model
Inspection policy
Commission
Cancellation policy
Rescheduling policy
Refund policy
Professional verification requirements
Warranty policy
Material policy
Emergency service policy
Customer/professional matching rules
Data retention
AI escalation rules
Premium strategy
B2B strategy
```

For decisions that are unknown, use:

```text
STATUS: OPEN
CURRENT DEVELOPMENT DEFAULT:
BUSINESS DECISION REQUIRED:
```

Do not hide unresolved business decisions inside code.

---

# 8. CREATE THE NEXT.JS APPLICATION FIRST

This is now the real starting point.

On your Mac:

```bash
mkdir fixify
cd fixify
pnpm create next-app@latest .
```

Use:

```text
TypeScript: Yes
ESLint: Yes
Tailwind: Yes
App Router: Yes
src/ directory: Yes
Turbopack: Yes
Import alias: Yes
```

Then:

```bash
pnpm dev
```

Verify:

```text
http://localhost:3000
```

The project must run locally before proceeding.

---

# 9. INITIAL GITHUB SETUP

Create a GitHub repository:

```text
fixify
```

Then locally:

```bash
git init
git add .
git commit -m "chore: initialize Fixify Next.js app"
git branch -M main
git remote add origin <YOUR_GITHUB_REPOSITORY>
git push -u origin main
```

From now on:

```text
local code
   ↕
GitHub
```

GitHub is the permanent code history.

---

# 10. INSTALL SUPABASE PACKAGES

Use pnpm:

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

Supabase's current Next.js guidance uses `@supabase/supabase-js` together with `@supabase/ssr`, with separate browser and server clients.

---

# 11. CREATE SUPABASE PROJECT

Create a Supabase project.

Record:

```text
Project URL
Publishable key
Database connection information
```

Create:

```text
.env.local
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

to browser/client-side code.

---

# 12. SUPABASE AUTH — FINAL DECISION

Remove Clerk completely.

The authentication architecture is:

```text
Supabase Auth
    │
    ├── Email/password
    │
    └── Google OAuth
```

Supabase officially supports Google sign-in through its OAuth provider configuration and `signInWithOAuth`.

---

# 13. CONFIGURE EMAIL/PASSWORD AUTH

In Supabase:

```text
Authentication
→ Providers
→ Email
```

Enable email authentication.

Decide whether email confirmation is required.

For development:

```text
Enable according to the current development workflow.
```

For production:

```text
Use verified email addresses.
```

---

# 14. CONFIGURE GOOGLE AUTH

In Supabase:

```text
Authentication
→ Providers
→ Google
```

Create Google OAuth credentials through Google Cloud / Google Auth Platform.

You need:

```text
Client ID
Client Secret
```

Configure the Supabase redirect/callback URL supplied by the Supabase dashboard.

For local development, also allow your localhost callback URL.

Supabase's current Google OAuth documentation specifically requires Google OAuth client configuration and redirect URL configuration.

---

# 15. NEXT.JS SUPABASE CLIENT STRUCTURE

Create:

```text
src/
└── lib/
    └── supabase/
        ├── client.ts
        └── server.ts
```

Browser client:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

Server client uses the Next.js cookie-based SSR configuration.

Do not use one universal Supabase client everywhere.

Separate:

```text
Browser client
Server client
```

Supabase explicitly recommends this pattern for Next.js SSR.

---

# 16. AUTH CALLBACK

Use the PKCE OAuth flow.

Create:

```text
src/app/auth/callback/route.ts
```

Google flow:

```text
Login page
   ↓
Supabase signInWithOAuth()
   ↓
Google
   ↓
Supabase callback
   ↓
Next.js /auth/callback
   ↓
exchange authorization code
   ↓
session cookie
   ↓
application
```

Supabase recommends the authorization-code/PKCE flow for OAuth clients and provides a Next.js callback pattern for exchanging the code for a session.

---

# 17. SESSION REFRESH / PROXY

Implement Supabase's current Next.js session-refresh pattern.

The purpose is:

```text
request
 ↓
read auth cookies
 ↓
refresh session when required
 ↓
continue request
```

Do not build authentication by manually storing access tokens in localStorage.

Use the cookie-based SSR approach.

Supabase's current SSR documentation explains that authentication state is maintained through cookies and refreshed between requests.

---

# 18. AUTH DATA MODEL

Do NOT use the old Clerk model:

```text
id = text Clerk user ID
```

Supabase Auth gives you:

```text
auth.users.id
```

Use UUID relationships.

Core table:

```text
profiles
```

Suggested structure:

```text
profiles
---------
id UUID PRIMARY KEY
full_name
phone
avatar_url
role
created_at
updated_at
```

The `id` references the Supabase Auth user.

Role:

```text
customer
professional
admin
support
```

Use a database enum or controlled lookup model.

---

# 19. CRITICAL AUTHORIZATION PRINCIPLE

Do not use:

```text
frontend:
if user.role === admin
```

as your security mechanism.

Frontend checks are UX.

Real security is:

```text
Supabase Auth
+
RLS
+
server authorization
+
database constraints/functions
```

Supabase Auth tokens can be used with RLS to authorize row-level access to database data.

---

# 20. KIRO STEERING FILES

Create:

```text
.kiro/
└── steering/
    ├── product.md
    ├── technical.md
    ├── security.md
    └── structure.md
```

---

# 21. `.kiro/steering/product.md`

Use:

```markdown
# Fixify Product Context

Fixify is a property-maintenance marketplace.

Customer:
problem → service → verified professional → job → payment → history

The core product is not a technician directory.
It is a managed service workflow.

Non-negotiable product rules:

- Customers may describe problems in normal language.
- AI assists with problem intake and likely service classification.
- AI must not represent uncertain assessments as guaranteed diagnoses.
- Verified professionals perform the final technical inspection.
- All additional work requiring extra payment must be approved by the customer before execution.
- All property service activity should be capable of becoming part of the property's maintenance history.
- Rebooking a preferred professional is supported when the professional remains eligible and available.
```

---

# 22. `.kiro/steering/technical.md`

```markdown
# Fixify Technical Constraints

Production application:
Next.js
React
TypeScript
Tailwind CSS
pnpm

Authentication:
Supabase Auth

OAuth:
Google

Database:
Supabase PostgreSQL

Authorization:
Row Level Security + server-side authorization

Storage:
Supabase Storage

Realtime:
Supabase Realtime where appropriate

Server logic:
Next.js Route Handlers / Server Actions
Supabase SQL functions/triggers
Supabase Edge Functions for external webhooks or workloads where appropriate

Never:
- generate Clerk
- generate a parallel Prisma database unless explicitly approved
- allow client-side financial calculations to become authoritative
- allow clients to directly set protected job states
- expose service-role secrets
- trust client-side payment success
```

---

# 23. `.kiro/steering/security.md`

```markdown
# Fixify Security Rules

1. Never trust client-submitted prices.
2. Never trust client-submitted roles.
3. Never expose Supabase service-role credentials.
4. Every protected table requires RLS.
5. Every sensitive server operation requires authorization.
6. Financial state changes must be server-controlled.
7. Job-state transitions must be controlled.
8. Quote approval must be transactional.
9. Payment webhooks must be idempotent.
10. Verification documents must not be publicly exposed.
11. Customer and professional data must be access-scoped.
12. Log financially or operationally important actions.
```

---

# 24. `.kiro/steering/structure.md`

```markdown
# Fixify Repository Structure

src/
  app/
  components/
  lib/
  types/

supabase/
  migrations/
  functions/

docs/

.kiro/
  steering/

Production frontend:
src/

Database:
supabase/

Documentation:
docs/

Kiro may modify backend/server/database code.
Do not create a second backend architecture beside Next.js and Supabase
without explicit approval.
```

---

# 25. THE KIRO WORKFLOW

Do not ask Kiro:

```text
Build Fixify backend.
```

That is too broad.

Use:

```text
Requirements
 ↓
Design
 ↓
Tasks
 ↓
Implementation
 ↓
Tests
 ↓
Review
```

One domain at a time.

---

# 26. FIRST KIRO SPEC — IDENTITY

Prompt Kiro:

```text
Create a Kiro spec named "identity-foundation".

Read:
- docs/PRODUCT_DECISIONS.md
- docs/DATA_MODEL.md
- docs/RBAC.md

Authentication is Supabase Auth only.

We use:
- email/password
- Google OAuth

Do not generate Clerk code.

Build the production identity model around auth.users.id.

Create:
- profiles
- role model
- basic profile policies
- customer/professional/admin role boundaries

The frontend is Next.js App Router.

Generate requirements.md first.
Do not implement until the requirements and design are reviewed.
```

---

# 27. SECOND KIRO SPEC — PROPERTY + SERVICE CATALOGUE

```text
Create a Kiro spec named "properties-and-services".

Read:
- docs/DATA_MODEL.md
- docs/PRODUCT_DECISIONS.md
- docs/RBAC.md

Build:
Property
Address
ServiceCategory
Service
ServiceOption
Material
Brand

Rules:
- customers can only manage their own properties
- service catalogue is public-readable where appropriate
- service catalogue writes require admin authorization
- pricing must never be authoritative from client input
- property data must be isolated by owner

Generate:
requirements.md
design.md
tasks.md

Do not invent undocumented business policies.
```

---

# 28. THIRD KIRO SPEC — PROFESSIONALS

```text
Create a Kiro spec named "professionals-and-verification".

Build:
ProfessionalProfile
ProfessionalSkills
ProfessionalAvailability
ProfessionalVerification
ProfessionalServiceAreas

Support:
- registration
- skills/categories
- service area
- availability
- verification state
- suspension

Verification states:
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED

An unverified professional must not become eligible for live job assignment.
```

---

# 29. FOURTH KIRO SPEC — JOB ENGINE

This is the most important backend specification.

```text
Create a Kiro spec named "booking-and-job-lifecycle".

Read docs/STATE_MACHINE.md.

Build:
Booking
Job
JobEvent

Implement:
transition_job_state()

Requirements:
- only allowed transitions can occur
- actor must be authorized
- every valid transition creates JobEvent
- invalid transitions must fail
- application code must not directly control protected job state
- job state must be server-authoritative
- timestamps must be generated server-side where appropriate

Do not implement independent boolean fields such as:
isStarted
isCompleted
isPaid
isCancelled

Use the defined state machine.
```

---

# 30. STATE MACHINE

Use:

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

Exceptions:

```text
CANCELLED
REJECTED
EXPIRED
RESCHEDULED
DISPUTED
SUSPENDED
```

Then define an explicit transition table.

Example:

```text
REQUESTED → MATCHING
system/admin

MATCHING → ASSIGNED
system/admin

ASSIGNED → ACCEPTED
professional

ASSIGNED → REJECTED
professional

ACCEPTED → ON_THE_WAY
professional

ON_THE_WAY → ARRIVED
professional

ARRIVED → INSPECTION
professional

INSPECTION → IN_PROGRESS
professional

INSPECTION → AWAITING_APPROVAL
professional

AWAITING_APPROVAL → IN_PROGRESS
customer approval

IN_PROGRESS → COMPLETED
professional

COMPLETED → PAYMENT_PENDING
system

PAYMENT_PENDING → CLOSED
system/payment confirmation
```

The exact business transitions must remain defined in `STATE_MACHINE.md`.

---

# 31. TEST THE STATE MACHINE BEFORE BUILDING THE UI

This is mandatory.

Attempt:

```text
REQUESTED → COMPLETED
```

It must fail.

Attempt:

```text
COMPLETED → REQUESTED
```

It must fail.

Attempt:

```text
AWAITING_APPROVAL → IN_PROGRESS
```

without customer approval.

It must fail.

Attempt to change another customer's job.

It must fail.

Attempt to have an unverified professional accept a job.

It must fail.

Do this now.

Not after the frontend exists.

---

# 32. QUOTES + ADDITIONAL WORK

Kiro spec:

```text
Create "quotes-and-approvals".

Build:
Quote
QuoteItem

Implement:
create_quote()
approve_quote()
decline_quote()

Rules:
- professional can create a quote only for an eligible active job
- customer can approve only their own quote
- quote approval is transactional
- approved quote becomes financially authoritative
- declined quote cannot unlock additional work
- expired quote cannot be approved
- every approval creates an audit_log entry
```

---

# 33. PROPERTY HISTORY

Kiro spec:

```text
Create "property-history".

Build:
PropertyAsset
PropertyServiceHistory

When a job reaches its final completed/closed state,
the relevant completed service information should be capable of being
recorded against the associated property.

Preserve:
service
date
professional
work performed
materials
cost
invoice
evidence
warranty where supported
```

---

# 34. REVIEWS + COMPLAINTS

Then:

```text
reviews-and-complaints
```

Build:

```text
Review
Complaint
ComplaintEvidence
```

Customer can review completed eligible jobs.

Customer can create complaints against eligible jobs.

Support/admin can manage complaint status.

---

# 35. AUDIT LOG

Create:

```text
audit_logs
```

Important events:

```text
professional_verified
professional_suspended
booking_created
job_assigned
state_changed
quote_created
quote_approved
quote_declined
payment_received
refund_created
complaint_resolved
```

Important records should not depend on frontend logs.

---

# 36. DATABASE MIGRATIONS

Use:

```text
supabase/migrations/
```

Rules:

```text
one logical schema change
=
one migration
```

Never rewrite an already-applied production migration.

Create a new migration.

Example:

```text
20260922_001_identity.sql
20260922_002_properties_services.sql
20260922_003_professionals.sql
20260922_004_jobs.sql
```

---

# 37. LOCAL DATABASE WORKFLOW

Use Supabase CLI when appropriate.

Development:

```text
local migration
 ↓
test
 ↓
push migration
 ↓
remote Supabase
```

Do not build database tables manually in the dashboard and then forget to encode them as migration files.

The repository must describe the database structure.

---

# 38. DESIGN PROTOTYPE — LOVABLE

Only after the product architecture is stable enough to explain visually.

Create a separate Lovable project:

```text
Fixify UI Prototype
```

Do NOT connect production database.

Do NOT build real auth.

Do NOT build real payment flows.

Use synthetic data.

Purpose:

```text
visual exploration
```

---

# 39. FIRST LOVABLE PROMPT

Use:

```text
Create a visual prototype for Fixify, a premium property-maintenance
service platform.

This is a DESIGN PROTOTYPE ONLY.

Do not implement real authentication.
Do not implement real payments.
Do not create a production database.
Do not make security-sensitive assumptions.

Fixify helps customers:
- describe property problems
- browse services
- upload photos/video
- book verified professionals
- track jobs
- approve additional work
- receive invoices
- view property maintenance history

Design personality:
premium
technical
human
trustworthy
calm
modern

Do not make it look like:
- a construction portfolio
- a generic SaaS dashboard
- an AI chatbot website

Use motion selectively.

The visual language should be inspired by:
maintenance tools
materials
work orders
property records
technical drawings
repair processes

Create:
1. marketing homepage
2. customer dashboard
3. problem intake
4. booking flow
5. active job screen
6. quote approval screen
7. property dashboard
8. professional dashboard
9. admin dashboard

Use realistic synthetic content.
```

---

# 40. LOVABLE HOMEPAGE

The homepage should prototype:

```text
Hero
 ↓
Problem-first interaction
 ↓
Services
 ↓
How Fixify works
 ↓
Trust
 ↓
Property history
 ↓
Professional recruitment
 ↓
Final CTA
```

Hero:

```text
Your problem.
Fixed properly.
```

Primary:

```text
Describe a Problem
```

Secondary:

```text
Browse Services
```

---

# 41. AFTER LOVABLE PROTOTYPE

Do NOT attempt:

```text
Lovable production repo
↓
convert to Next.js
↓
connect Kiro
```

Instead:

```text
Lovable prototype
       ↓
review
       ↓
approved visual specification
       ↓
Next.js implementation
```

Extract:

```text
spacing
typography
component behavior
colors
motion
responsive behavior
interaction patterns
```

Then implement them natively in Next.js.

---

# 42. NEXT.JS PRODUCTION APP STRUCTURE

Recommended:

```text
src/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── app/
│   ├── pro/
│   ├── admin/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── marketing/
│   ├── customer/
│   ├── professional/
│   ├── admin/
│   ├── booking/
│   ├── jobs/
│   ├── property/
│   └── ai/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── services/
│   ├── jobs/
│   ├── matching/
│   ├── payments/
│   ├── notifications/
│   └── ai/
│
├── types/
└── validators/

supabase/
├── migrations/
└── functions/

docs/
```

---

# 43. AUTH ROUTES

Public:

```text
/
 /services
 /services/:slug
 /how-it-works
 /professionals
 /help
```

Auth:

```text
/login
/register
/forgot-password
/auth/callback
```

Customer:

```text
/app
/app/assistant
/app/services
/app/requests/new
/app/bookings
/app/bookings/:id
/app/properties
/app/properties/:id
/app/history
/app/payments
/app/invoices/:id
/app/support
/app/profile
```

Professional:

```text
/pro
/pro/onboarding
/pro/jobs
/pro/jobs/:id
/pro/availability
/pro/earnings
/pro/profile
/pro/support
```

Admin:

```text
/admin
/admin/jobs
/admin/customers
/admin/professionals
/admin/verification
/admin/services
/admin/pricing
/admin/payments
/admin/complaints
/admin/analytics
```

---

# 44. BUILD THE CUSTOMER APP FIRST

Do not build:

```text
customer
professional
admin
AI
payments
```

all at once.

Build the customer golden path.

---

# 45. CUSTOMER STAGE 1

Build:

```text
/app
```

Needs:

```text
profile greeting
Describe Problem CTA
popular services
upcoming booking
property summary
recent service history
```

No fake analytics.

Use real Supabase reads once the relevant tables exist.

---

# 46. CUSTOMER STAGE 2 — PROBLEM INTAKE

Build:

```text
/app/requests/new
```

Allow:

```text
text
photo
video
```

Voice can initially be a later enhancement.

Write to:

```text
service_requests
```

Do not directly create a completed booking from the first text input.

---

# 47. CUSTOMER STAGE 3 — SERVICE BROWSE

Build manual fallback:

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

This is important because not every customer needs AI.

---

# 48. CUSTOMER STAGE 4 — BOOKING

Flow:

```text
problem
 ↓
service
 ↓
property
 ↓
date/time
 ↓
pricing model
 ↓
professional
 ↓
confirmation
```

Server validates everything.

---

# 49. CUSTOMER STAGE 5 — ACTIVE JOB

Display:

```text
Booking confirmed
Professional assigned
Professional accepted
On the way
Arrived
Inspection
Additional work
Work in progress
Completed
Payment
Closed
```

Render from actual `job_events`.

Do not create an independent fake frontend workflow.

---

# 50. CUSTOMER STAGE 6 — QUOTE APPROVAL

Display:

```text
Problem found

Recommended work

Materials
Labour
Fees
Total

[Approve]
[Decline]
```

Approval calls:

```text
approve_quote()
```

Never:

```text
supabase
  .from("quotes")
  .update({ status: "approved" })
```

from the client.

---

# 51. CUSTOMER STAGE 7 — PROPERTY

Build:

```text
/app/properties
/app/properties/:id
```

Property dashboard:

```text
Property overview
Services
Maintenance history
Assets
Documents
Invoices
```

---

# 52. CUSTOMER STAGE 8 — INVOICES

Display:

```text
Invoice number
Service
Materials
Labour
Additional work
Discounts
Taxes/fees
Total
Payment status
```

Read server-authoritative values.

---

# 53. CUSTOMER STAGE 9 — REVIEWS

Only completed eligible jobs.

Support:

```text
rating
comment
```

Later:

```text
professional response
```

---

# 54. CUSTOMER STAGE 10 — SUPPORT

Customer can:

```text
view complaints
create complaint
attach evidence
view complaint status
```

---

# 55. PROFESSIONAL BUILD

Only after customer golden flow works.

Build:

```text
/pro
```

Then:

```text
/pro/jobs
/pro/jobs/:id
/pro/availability
/pro/earnings
/pro/profile
```

---

# 56. PROFESSIONAL JOB FLOW

```text
Receive request
 ↓
Accept
 ↓
On the way
 ↓
Arrived
 ↓
Inspection
 ↓
Findings
 ↓
Quote
 ↓
Approval
 ↓
Work
 ↓
Completion evidence
 ↓
Complete
```

Every state uses backend-controlled transitions.

---

# 57. ADMIN BUILD

Build after enough real data exists.

Admin:

```text
/dashboard
jobs
professionals
verification
customers
services
pricing
payments
complaints
```

Admin is an operational tool, not another marketing website.

---

# 58. PAYMENT ARCHITECTURE

Keep provider-specific code behind:

```text
lib/payments/
```

or an external function adapter.

Conceptually:

```text
Fixify payment request
       ↓
Payment provider adapter
       ↓
provider order
       ↓
checkout
       ↓
provider webhook
       ↓
verify signature
       ↓
idempotency check
       ↓
payment record
       ↓
invoice
       ↓
job/payment state
```

Never trust:

```text
frontend says payment successful
```

as authoritative.

---

# 59. PAYMENT IMPLEMENTATION ORDER

Do not build payment UI before:

```text
quotes
job completion
authoritative totals
```

exist.

Otherwise you're charging for a data model that isn't stable.

---

# 60. AI IMPLEMENTATION ORDER

Do not start with AI.

First implement:

```text
manual service selection
+
structured problem form
```

Then introduce:

```text
AI
 ↓
structured classification
 ↓
customer confirmation
 ↓
service request
```

This gives you a fallback when AI fails.

---

# 61. AI SERVER ARCHITECTURE

Never put the AI secret in Next.js client code.

Use:

```text
Customer UI
   ↓
Next.js server endpoint
   ↓
AI provider
   ↓
structured Fixify output
   ↓
database
```

or:

```text
Customer UI
   ↓
Supabase Edge Function
   ↓
AI provider
```

depending on the workload.

---

# 62. AI RESPONSE CONTRACT

AI output:

```json
{
  "likely_service_category": "...",
  "confidence": "low|moderate|high",
  "problem_summary": "...",
  "recommended_next_step": "...",
  "needs_human_review": true,
  "requested_media": []
}
```

The AI does not produce:

```text
guaranteed diagnosis
final price
authorization
payment
```

---

# 63. REALTIME

Use Supabase Realtime selectively.

Good candidates:

```text
job state
job events
quote status
payment status
complaint status
notifications
```

Do not subscribe every page to every table.

---

# 64. STORAGE

Use Supabase Storage for:

```text
customer photos
customer videos
professional evidence
verification documents
invoice files
property documents
```

Separate buckets/policies where appropriate.

Verification documents require stronger access controls than normal job images.

---

# 65. RLS

Every customer-owned table must implement ownership rules.

Example concept:

```text
customer
    ↓
auth.uid()
    ↓
profile
    ↓
property
    ↓
booking
    ↓
job
```

Customers cannot query another customer's records.

Professionals only see information necessary for assigned/eligible jobs.

Admins have explicit privileged access.

---

# 66. SERVICE ROLE

The Supabase service-role key bypasses RLS.

Therefore:

```text
CLIENT
NEVER

SERVER / CONTROLLED EDGE FUNCTION
ONLY
```

Even on the server, use it only when the operation genuinely requires privileged access.

---

# 67. BUSINESS LOGIC LOCATION

Use this rule:

### Database

For:

```text
constraints
ownership
critical transactional logic
state transitions
quote approval
authoritative calculations
```

### Next.js server

For:

```text
application orchestration
server actions
API endpoints
UI-specific server workflows
```

### Edge Functions

For:

```text
webhooks
external APIs
AI calls
notification dispatch
provider integrations
```

Do not put the same business rule into all three places.

---

# 68. NEVER DUPLICATE BUSINESS LOGIC

Bad:

```text
Frontend:
calculates total

Next.js:
calculates total

Postgres:
calculates another total
```

Good:

```text
Postgres:
authoritative calculation

Frontend:
displays result
```

Same principle applies to job states.

---

# 69. TESTING ORDER

Test in this sequence:

```text
Database constraints
 ↓
RLS
 ↓
Postgres functions
 ↓
Server actions/API
 ↓
UI
 ↓
End-to-end
```

Not the reverse.

---

# 70. SECURITY TESTS

Try:

```text
Customer A accessing Customer B property
```

Must fail.

Try:

```text
Professional A accessing Professional B earnings
```

Must fail.

Try:

```text
Customer editing professional verification
```

Must fail.

Try:

```text
Professional modifying quote price after approval
```

Must fail.

Try:

```text
Customer approving another customer's quote
```

Must fail.

---

# 71. GOLDEN END-TO-END TEST

The application must support:

```text
Customer registration
        ↓
Creates property
        ↓
Describes problem
        ↓
Uploads photo
        ↓
Creates service request
        ↓
Books service
        ↓
Professional sees request
        ↓
Accepts
        ↓
On the way
        ↓
Arrives
        ↓
Inspection
        ↓
Quote
        ↓
Customer approves
        ↓
Professional completes
        ↓
Payment succeeds
        ↓
Invoice created
        ↓
Review submitted
        ↓
Property history updated
```

This is the milestone that matters.

---

# 72. DEVELOPMENT ORDER — FINAL VERSION

The actual order is:

```text
STEP 1
Freeze product decisions

↓

STEP 2
Create documentation

↓

STEP 3
Create local Next.js + pnpm application

↓

STEP 4
Create GitHub production repository

↓

STEP 5
Create Supabase project

↓

STEP 6
Configure Supabase Auth
Email/password
Google OAuth

↓

STEP 7
Implement Next.js Supabase SSR auth

↓

STEP 8
Kiro identity schema + profiles + RBAC

↓

STEP 9
Kiro properties + services schema

↓

STEP 10
Kiro professional schema + verification

↓

STEP 11
Kiro job/booking state machine

↓

STEP 12
TEST STATE MACHINE + RLS

↓

STEP 13
Design Fixify UI prototype in Lovable

↓

STEP 14
Review and freeze Design Brief

↓

STEP 15
Implement Next.js customer UI

↓

STEP 16
Implement customer booking flow

↓

STEP 17
Implement professional UI

↓

STEP 18
Implement admin UI

↓

STEP 19
Quotes + additional-work approval

↓

STEP 20
Payments + invoices

↓

STEP 21
Reviews + complaints

↓

STEP 22
Property history

↓

STEP 23
Realtime updates

↓

STEP 24
AI intake

↓

STEP 25
Voice/media intelligence

↓

STEP 26
Advanced matching

↓

STEP 27
Polish / motion / responsiveness

↓

STEP 28
Security audit

↓

STEP 29
End-to-end testing

↓

STEP 30
Production deployment
```

---

# 73. GIT WORKFLOW DURING DEVELOPMENT

Every feature follows:

```text
git checkout develop

git pull

git checkout -b feat/<feature>
```

Then:

```text
Kiro implementation
 ↓
local testing
 ↓
commit
 ↓
push
 ↓
review
 ↓
merge
```

Example:

```bash
git checkout -b feat/supabase-auth
```

Commit:

```bash
git add .
git commit -m "feat: add Supabase authentication"
git push -u origin feat/supabase-auth
```

---

# 74. DO NOT HAVE MULTIPLE AGENTS EDIT THE SAME AREA SIMULTANEOUSLY

For example:

```text
Kiro modifying:
src/app/api/*
supabase/*

You modifying:
same files

Lovable:
separate prototype
```

Do not simultaneously have two systems modifying the same production files.

---

# 75. WHEN TO USE LOVABLE

Use Lovable when the question is:

```text
What should this look like?
```

Use Next.js/Kiro when the question is:

```text
How should this actually work?
```

This is the clean separation.

---

# 76. WHEN NOT TO USE LOVABLE

Do not use Lovable to decide:

```text
database structure
authentication architecture
RLS
payments
state transitions
pricing calculations
financial records
professional verification logic
```

Those are engineering decisions.

---

# 77. WHEN NOT TO USE KIRO

Do not ask Kiro to "make the site beautiful."

Give Kiro:

```text
design specification
component requirements
interaction requirements
accessibility requirements
```

and let it implement exact behavior where needed.

---

# 78. LOVABLE DESIGN → NEXT.JS TRANSLATION

For each approved Lovable screen, create:

```text
docs/ui/
```

Example:

```text
docs/ui/customer-dashboard.md
docs/ui/problem-intake.md
docs/ui/booking.md
docs/ui/professional-job.md
```

Document:

```text
layout
component hierarchy
responsive behavior
states
interactions
motion
data required
```

Then recreate it in Next.js.

This prevents the design from existing only inside Lovable.

---

# 79. DESIGN SYSTEM

Create:

```text
DESIGN_BRIEF.md
```

Core identity:

```text
Premium
Technical
Human
Trustworthy
Calm
Functional
```

Avoid:

```text
generic SaaS
generic AI chatbot
construction portfolio
card-everything UI
gradient-everything UI
```

Application UI:

```text
sentence case
dense enough to be useful
clear status
minimal decorative animation
```

Marketing:

```text
larger typography
cinematic motion
visual storytelling
```

---

# 80. MOTION RULE

One deliberate motion idea per interaction.

Good:

```text
AI conversation progresses
Booking timeline advances
Professional matching animates
Property history expands
Quote approval confirms
```

Bad:

```text
every card fades up
every button bounces
every section slides
every number counts
```

Motion must reinforce the product.

---

# 81. MOBILE RULE

Customer:

```text
mobile-first
```

Professional:

```text
mobile-first
```

Admin:

```text
desktop-first
```

Marketing:

```text
fully responsive
```

Do not merely shrink desktop layouts.

---

# 82. DEFINITION OF DONE

A feature is complete only when:

```text
UI
+
database
+
server logic
+
validation
+
authorization
+
RLS
+
loading
+
empty
+
error
+
mobile
+
testing
```

For financial features:

```text
server-calculated amount
+
idempotency
+
payment verification
+
audit record
```

For job-state features:

```text
allowed transition
+
unauthorized transition test
+
event history
```

---

# 83. MVP STOP LINE

Before building:

```text
Premium
IoT
predictive maintenance
advanced AI vision
complex subscriptions
large materials marketplace
```

the following must work:

```text
Customer
 ↓
Request
 ↓
Booking
 ↓
Professional
 ↓
Job
 ↓
Quote
 ↓
Approval
 ↓
Completion
 ↓
Payment
 ↓
Invoice
 ↓
Review
 ↓
Property history
```

If this chain is broken, stop adding features.

---

# 84. FINAL OPERATING PRINCIPLE

The production system is:

```text
GitHub
   ↓
Next.js
   ↓
Supabase
   ↓
Kiro
```

The visual laboratory is:

```text
Lovable
```

Lovable is not the backend.
Lovable is not the production repository.
Lovable is not the authentication authority.
Lovable is not the source of business rules.

It is the place to explore what the product should look and feel like.

The actual Fixify product lives in:

```text
Next.js
+
Supabase Auth
+
Supabase PostgreSQL
+
Supabase Storage
+
Supabase Realtime
+
server-side business logic
```

And the single most important engineering principle is:

```text
The frontend requests.
The backend validates.
The database enforces.
The audit log records.
```

That is the architecture that prevents Fixify from becoming a beautiful prototype with unreliable business logic.

# END
