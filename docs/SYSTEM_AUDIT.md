# SYSTEM_AUDIT_README.md

> **Fixify — System Audit & Implementation Orchestration Plan V2**
>
> **Purpose:** This document is the execution blueprint for the next Fixify engineering cycle. It is written for Kiro (the sole implementation agent) using MCPs (Playwright, Chrome DevTools, Shadcn, 21st Century) to orchestrate backend, frontend, and visual verification work with logical rigor and pixel-perfect execution.
>
> **Critical scope decision:** Razorpay/payment implementation is **NOT part of the current implementation phases**. Fixify does not currently have the required business PAN/setup to complete the payment integration. Payment architecture must remain clean and server-authoritative, but no live Razorpay integration, webhook deployment, payment collection, or refund implementation should block the current milestone.

---

# PART 1: FOUNDATIONAL PRINCIPLES

---

# 0. Operating Rules for Kiro (Sole Implementation Agent)

## 0.1 Kiro's Unified Responsibility

Kiro is the **sole implementation agent** for all Fixify development phases.

Kiro owns and is solely responsible for:

- **Supabase schema and migrations** — database structure, constraints, defaults
- **PostgreSQL functions/RPCs** — server-side computational boundaries
- **`transition_job_state()`** — the authoritative state machine
- **RLS (Row-Level Security) policies** — data-layer access control
- **Authentication/session behavior** — Supabase Auth integration, session lifecycle
- **Middleware and server-side authorization** — Next.js middleware, route protection
- **Role resolution** — determining the source of truth for user roles
- **Server actions / API boundaries** — next/server boundary enforcement
- **Customer/professional/admin data ownership** — enforcing ownership at read/write time
- **Server-side validation** — input checking where it affects business state
- **Audit/event records** — immutable event log for compliance and debugging
- **Cache/session security** — HTTP cache headers, cookie flags, secure defaults
- **Logout/session invalidation** — complete session termination
- **Business rules and state transitions** — job lifecycle invariants
- **Integration boundaries for future payment functionality** — preserving clean interfaces

### UI/Frontend Layer (Kiro responsibility using MCPs)

Using **Playwright**, **Chrome DevTools**, **Shadcn**, and **21st Century** MCPs, Kiro will:

- **Implement React components** — component structure, composition, reusability
- **Build page composition** — information architecture within role-specific dashboards
- **Style with Tailwind/CSS** — styling, responsive behavior, animations
- **Establish design tokens** — color, spacing, typography system (Fixify palette)
- **Create responsive layouts** — desktop/tablet/mobile adaptations
- **Build loading/empty/error states** — visual feedback during async operations
- **Implement animations** — purposeful motion communicating state change or hierarchy
- **Ensure accessibility** — ARIA labels, keyboard affordances, focus visibility
- **Design interaction affordances** — hover states, button feedback, menu patterns
- **Optimize imagery** — selection, cropping, optimization, responsive sizing
- **Refine visual hierarchy** — font sizing, weight, color contrast

### Visual Verification Layer (Kiro using browser MCPs)

Using **Playwright** and **Chrome DevTools**, Kiro will:

- **Capture rendered screenshots** at target viewports (desktop, tablet, mobile)
- **Inspect visual details** — spacing, alignment, font sizes, colors, borders
- **Verify responsive behavior** — no horizontal overflow, intentional reflow
- **Test keyboard navigation** — Tab order, focus visibility, Escape, Enter, Space
- **Check reduced-motion** — animations disabled when `prefers-reduced-motion: reduce`
- **Inspect accessibility** — ARIA labels, heading hierarchy, image alt text
- **Verify interactions** — hover states, menu open/close, button feedback
- **Detect visual regressions** — compare before/after screenshots
- **Log detailed findings** — document every pixel-level defect

### Critical Rules

**Kiro must NOT:**

- Treat client-side route hiding or localStorage as authorization
- Invent business states or job statuses not defined by the backend
- Bypass RLS through client-side filtering
- Directly mutate job status without server authorization
- Trust client-supplied roles, user_id, or ownership identifiers
- Calculate authoritative money or quote values client-side
- Expose service-role credentials or any secrets
- Implement fake successful backend operations
- Replace real data with hardcoded demo data on production paths
- Create UI workflows that contradict the backend's allowed state transitions

**Kiro MUST:**

- Render pages and inspect actual screenshots, not claim finished from source code
- Identify and fix the top 3 visual defects per page (hierarchy, spacing, composition first)
- Test at all required viewports: desktop (1440, 1280, 1024), tablet (768), mobile (430, 390)
- Verify keyboard navigation and reduced-motion support using browser MCPs
- Capture before/after screenshots to prove visual improvements
- Report only verified behaviors; mark unverified tests as such
- Use MCPs (Playwright, Chrome DevTools, Shadcn, 21st Century) to automate visual capture and inspection

---

# 1. Product Model — What Fixify Actually Is

Fixify is not a generic SaaS dashboard or property-management marketplace clone.

Its core promise is:

```text
Messy property problem
        ↓
Clear service interpretation
        ↓
Verified professional
        ↓
Inspection / diagnosis
        ↓
Transparent quote
        ↓
Explicit customer approval
        ↓
Work performed
        ↓
Completion evidence
        ↓
Persistent property maintenance record
```

### Three Primary Actors

| Actor | Primary Responsibility | Key Constraints |
|-------|------------------------|-----------------|
| **Customer** | Describe problems, manage properties, approve work, track jobs, retain maintenance history | Owns their data; cannot access other customers' property/jobs; must explicitly approve quotes |
| **Professional** | Receive eligible requests, inspect, quote, perform work, submit completion evidence | Can access only assigned jobs; cannot bypass inspection→quote→approval sequence for regular work |
| **Admin / Operations** | Resolve exceptions, verify professionals, handle disputes/reassignments, monitor system health | Operationally necessary access only; must audit every mutation; cannot invent authorizations |

### Existing Audit Baseline

The supplied deployment audit captured:
- **21 routes rendering** with 0 detected runtime/network errors (useful but insufficient)
- **Route rendering capability** ≠ authorization, RLS, session invalidation, cache safety, or state-machine integrity

**Current readiness scores (from previous audit):**

| Area | Score | Meaning |
|------|-------|---------|
| Design / UI | 68/100 | Coherent Fixify direction exists, but several surfaces remain generic or inconsistent |
| Workflow / Logic | 63/100 | Product rules are defined, but authoritative live-state binding is insufficiently proven |
| Reliability / Security | 58/100 | Routes render, but auth, RLS, logout, cache, and cross-role protection remain insufficiently proven |
| **Overall** | **63/100** | Controlled demo / pre-production, not general public traffic |

**Important caveat:** These scores are directional observations, not formal security certifications. The audit material explicitly identifies that live RLS, role enforcement, cookie flags, session invalidation, logout behavior, browser-back behavior, private cache headers, and complete build/type/lint status were **not proven** during the assessment.

Therefore, this document treats those areas as **verification work requiring deliberate testing**, not assumed failures or assumed passes.

---

# PART 2: DESIGN & SECURITY CONTRACTS

---

# 2. Non-Negotiable Design Rules

### 2.1 Brand — Canonical Palette

**Porcelain:** #F7F4EC
**Paper:** #FFFEFA
**Ink:** #18211F
**Teal:** #176B5B
**Deep Teal:** #0D5144
**Clay:** #A9523D

The product is explicitly **light-first** and rejects:
- Generic AI-template aesthetics
- Fake metrics/KPI dashboards
- Purple/blue gradients (the default SaaS fallback)
- Generic chatbot bubbles
- Default dark customer surfaces
- Excessive rounded rectangles (glassmorphism)

### 2.2 UX Principle — Clarity Over Decoration

Every important screen must answer these questions:

1. **What does this user need to understand right now?**
2. **What is the next action they should take?**
3. **What did the previous action accomplish?**

**Anti-patterns to avoid:**

- Do not add components because they are visually impressive
- A dashboard should not become a collection of cards
- A homepage should not become a collection of animations
- A customer should not have to interpret internal Fixify terminology
- Do not use fake metrics as visual filler (total requests, conversion, activity score)

### 2.3 Animation Rules

**Good uses of animation:**
- Request state changes (animated transitions between job stages)
- Intake interpretation feedback (category suggestion reveal)
- Quote difference callout (highlighting changes from initial estimate)
- Job progression (step indicator advancement)
- Hover feedback (button state, link underline)
- Menu transitions (slide, fade, scroll)
- Scroll reveal (progressive content disclosure)
- Image transitions (smooth cross-fade)
- Progressive disclosure (accordion opens, modal slides)

**Bad uses of animation:**
- Constantly moving backgrounds
- Animation on every component (fatigue)
- Distracting hero particles
- Animated financial values (false precision impression)
- Animated destructive actions (destructive ops should feel deliberate, not playful)
- Fake "AI" effects (pulsing glow, animated thinking)
- Excessive parallax

**Technical rules for animation (if using Anime.js/GSAP):**
- Prefer `transform` and `opacity` (GPU-accelerated, performant)
- Clean up timelines and event listeners on unmount
- Avoid layout-heavy animation (avoid animating `width`, `height`, `left`, `top` where possible)
- Honor `prefers-reduced-motion` setting
- Never animate security/payment/destructive confirmation states

---

# 3. Authentication & Session Security Contract

## 3.1 Defense in Depth — Multiple Layers

Do not rely on any single layer as sufficient.

```text
Browser
   ↓
Next.js middleware
   ↓
Server route/action
   ↓
Supabase authenticated session
   ↓
Role/ownership check
   ↓
RLS policy
   ↓
Database
```

**Layer 1 — Middleware / Route Protection**
- Purpose: prevent obvious unauthorized navigation, redirect unauthenticated users, route role-appropriate users
- Responsibility: Kiro
- Outcome: unauthenticated users cannot reach /customer, /professional, /admin; redirects occur before component hydration

**Layer 2 — Server Authorization (actions/RPCs)**
- Purpose: verify identity, verify role, verify ownership/assignment, validate mutation
- Responsibility: Kiro
- Outcome: identity is verified from server session, not browser token; role is resolved server-side; data access is checked before returning

**Layer 3 — Supabase RLS**
- Purpose: enforce data ownership at the database boundary, protect against direct query/API misuse, provide defense in depth
- Responsibility: Kiro
- Outcome: a row visible only to its owner, even if a compromised server action tries to fetch it

## 3.2 Logout Contract — Complete Session Invalidation

Logout must:

1. **Invalidate the server-side authentication session** through the configured Supabase auth mechanism
2. **Clear/expire relevant auth cookies** through the supported auth flow (HttpOnly, Secure, SameSite flags respected)
3. **Redirect to a public route** (e.g., `/` or `/auth/login`)
4. **Prevent subsequent authenticated server requests** from the same session
5. **Invalidate/refresh relevant client state** (clear auth tokens, context, caches if any)
6. **Avoid exposing private data through cached pages** (use `Cache-Control: private, no-store` where appropriate)

**What NOT to do:**

```javascript
// DO NOT use localStorage as the logout mechanism
localStorage.clear()  // This alone is not sufficient

// DO NOT assume that hiding a button means the route is protected
if (role !== 'customer') return <Redirect />  // Route protection happens in middleware/server
```

## 3.3 Back-Button Contract — Test Sequence

This test is **mandatory before production**:

```text
Step 1: Login
Step 2: Navigate to /customer (or /professional or /admin)
Step 3: Navigate to protected private job page
Step 4: Click "Sign Out" (or invoke logout)
Step 5: Click browser Back button (multiple times if needed)
Step 6: Attempt to navigate to the original protected route
Step 7: Refresh the page
```

**Expected outcomes:**

- Protected route redirects to login or returns 401
- Protected API request returns unauthorized/forbidden
- No fresh private data can be fetched
- Stale browser pixels (historical screenshot in browser history) are not proof of an active session

**Important distinction:**

> Browser history may contain a previous visual snapshot of a protected page. That is NOT equivalent to authorization. The security requirement is that the old page cannot regain authenticated functionality or fetch protected data.

Do not attempt to solve browser history retention with fragile client JavaScript. Instead, verify that:
1. Protected routes redirect before rendering
2. Protected data endpoints return 401/403
3. Client auth state is cleared

---

# 4. Cookie & Cache Requirements

## 4.1 Cookie Security

Kiro should verify appropriate cookie flags:

- **HttpOnly** — prevents JavaScript access (security against XSS)
- **Secure** — sent only over HTTPS (prevents MITM interception)
- **SameSite=Lax or Strict** — prevents CSRF attacks where compatible
- **Path=/** — correct path scope (do not use overly broad paths)
- **Domain** — avoid unnecessary broad Domain configuration

**Never store session secrets in:**
- `localStorage`
- `sessionStorage`
- URL parameters
- React state (except temporarily during the page load)

## 4.2 Private Content Caching

Authenticated/user-specific responses should not be publicly or shared-cached.

**Rule of thumb:**

```text
Public content (homepage, help pages)
→ cacheable where safe (Cache-Control: public, max-age=3600)

User-specific/private content (/customer, /professional, /admin)
→ private / no-store as appropriate (Cache-Control: private, no-store)
```

Do not blindly add `no-store` to every response; that defeats legitimate browser caching.

The goal is:
- Public marketing pages benefit from HTTP caching where appropriate
- Private dashboards and data are not cached across sessions or users

---

# PART 3: USER WORKFLOWS & DATA OWNERSHIP

---

# 5. End-to-End User Flows

These flows are the backbone of implementation. Coding agents should use them to decide what the UI and backend are allowed to do.

## 5.1 Customer: New Repair Request

**User goal:** "I have a problem at my property and want Fixify to get it handled."

### Flow

```text
Homepage
  ↓
Describe a problem
  ↓
[Authentication if required]
  ↓
Customer intake form
  ↓
Issue description
  ↓
Optional photo/video/voice evidence
  ↓
Service/category interpretation
  ↓
Select property (must be owned by customer)
  ↓
Choose availability/schedule
  ↓
Submit request
  ↓
Request created (server confirms)
  ↓
Professional matching/assignment begins
  ↓
Customer sees current authoritative state
```

### Backend Invariants (Kiro responsibility)

- Request belongs to authenticated customer (verify at create time, not client-side)
- Property belongs to that customer (check ownership before allowing request)
- Uploaded evidence belongs to that request/customer (enforce ownership at storage/retrieval)
- Category cannot be trusted merely because the browser sends it (validate/normalize server-side)
- Request creation is atomic where appropriate (all-or-nothing, not partial state)
- A customer cannot create a request against another user's property by changing a URL parameter
- The resulting job/request state comes from the database (not from optimistic client state)

### UI States (visible to customer)

The UI must explicitly represent these states (not invent them):

```text
Draft              (form being filled, not yet submitted)
Submitting         (POST in flight, show spinner)
Submitted          (server confirmed, show success feedback)
Matching           (professional search/assignment in progress)
Professional       (professional has been assigned)
Failed             (submission error, show reason)
Retry Available    (error resolved, allow user to retry)
```

**Critical rule:** Do not show "Request submitted" before the server confirms it. Do not use optimistic UI updates for creation; only for confirmed operations.

---

## 5.2 Customer: Track Active Job

**User goal:** "I want to see where my repair is, what's happening next, and what I need to do."

### Flow

```text
Customer dashboard (/customer)
  ↓
Active request/job section
  ↓
Current authoritative job state (from database)
  ↓
Professional information / contact
  ↓
Appointment/inspection scheduled
  ↓
Inspection phase
  ↓
Quote ready notification
  ↓
Customer reviews quote
  ↓
Approve OR decline/request clarification
  ↓
[If approved] Work in progress
  ↓
Completion evidence submitted by professional
  ↓
Job marked completed
  ↓
Property maintenance record updated
```

### Critical Rule

**The customer dashboard must not invent progress.**

- If the database says "inspection_pending", the UI shows "Inspection pending"
- If the database says "quote_pending_approval", the UI shows "Quote approval"
- The browser never decides the state
- State is fetched on page load, not constructed from previous navigation

---

## 5.3 Customer: Quote Approval

**User sees:**
- What was originally requested
- What inspection discovered (findings)
- Line items (labor, materials, parts)
- Labor/material explanation
- Total cost
- What changed from the initial estimate
- Explicit approval action

### Flow

```text
Quote created by professional
   ↓
Server validates quote (ownership, authorization, state)
   ↓
Customer receives notification
   ↓
Customer reviews quote details
   ↓
Approve button OR decline/clarification button
   ↓
Server validates ownership + current state
   ↓
State transition executed (via transition_job_state)
   ↓
Audit event recorded
   ↓
Fresh state returned to UI
```

### Security Contract

Never accept as authoritative browser data:
```javascript
// DO NOT accept these from the browser:
{ approved: true }
{ price: clientCalculatedPrice }
{ status: 'approved' }
{ professional_id: 999 }
```

The server/database determines whether the operation is legal:
- Is the user the customer of this job?
- Is the job in a state that permits quote approval?
- Are the quote details unchanged (or within acceptable variance)?
- Is there customer-identity confirmation?

---

## 5.4 Professional: Daily Workspace

**User goal:** "What do I need to work on today, and how do I track my earnings?"

### Flow

```text
Login to professional workspace
   ↓
Availability toggle
   ↓
Verification status check
   ↓
Requests to review (eligible and waiting)
   ↓
Accept / decline request
   ↓
Accepted job → Today's route
   ↓
Job workspace
   ↓
Inspect property/issue
   ↓
Record findings
   ↓
Draft quote
   ↓
Waiting for customer approval
   ↓
Customer approves (or declines, triggering next action)
   ↓
Perform work
   ↓
Submit completion evidence
   ↓
Job completed
   ↓
Earnings recorded
```

### UI Priority

The professional should always see (in this order):

1. **What needs attention now** — requests awaiting response, blocked jobs, customer actions needed
2. **Where they need to go** — today's route, next appointment
3. **Which jobs are blocked** — waiting on customer, waiting on approval
4. **What action is required** — "Approve quote", "Submit completion", "Review request"
5. **Their work/earnings history** — recent completions, monthly total (informational, not primary)

**Avoid:**

- Generic analytics dashboards
- Meaningless KPI cards
- Decorative metrics without decision value

---

## 5.5 Admin / Operations Flow

**User goal:** "What is broken or needs my intervention, and what can I do about it?"

Admin is **exception handling**, not a super-user dashboard.

### Flow

```text
Admin login (/admin)
   ↓
"Needs Attention" section (filtered, prioritized)
   ↓
Filter by:
   - Quote issue
   - Dispute
   - Reassignment
   - Professional verification
   - System signal
   ↓
Open case / inspect relevant data
   ↓
Side-over panel:
   ├── Customer context
   ├── Property
   ├── Job state
   ├── Timeline
   ├── Quote details
   ├── Audit events
   └── Allowed actions
   ↓
Perform authorized operation
   ↓
Audit event recorded
   ↓
Queue refreshed (case resolved or escalated)
```

### Authorization Model

Admin should use **least privilege**:
- "Admin" does not mean "expose every sensitive field by default"
- "Admin" does not mean "bypass all authorization"
- Every action is auditable and reversible (or at least recorded)
- Operationally necessary access only

---

## 5.6 Authentication Flow

### Login

```text
Public page (homepage, /auth/login)
   ↓
User enters credentials or selects provider
   ↓
Supabase authenticates
   ↓
Server-authenticated session established
   ↓
Role resolved (from Supabase user metadata or database lookup)
   ↓
Role-appropriate destination:
   ├── customer → /customer
   ├── professional → /professional
   └── admin → /admin
```

### Critical Rules

- Do not trust a role query parameter (`?role=admin`)
- Do not trust localStorage for authorization (`localStorage.getItem('role')`)
- Do not let the browser decide which dashboard a user is entitled to access
- Role resolution happens server-side, in middleware or the initial server action

---

# 6. Data Ownership Model

Every major record needs an explicit ownership model and authorization rule.

| Data | Owner / Authority | Read Access | Write Access | Delete Access |
|------|-------------------|-------------|--------------|---------------|
| **User profile** | authenticated user | own profile + admin | own profile (limited) | restricted |
| **Property** | customer | owner + assigned professional (during active job) + admin | owner only | owner only |
| **Request** | customer/job system | customer + assigned professional + authorized admin | backend state machine | backend cleanup |
| **Job** | job workflow | customer + assigned professional + authorized admin | backend state machine | backend cleanup |
| **Quote** | professional/job | assigned professional + customer + authorized admin | professional (draft) + backend (approved) | backend only |
| **Media/evidence** | owning workflow | relevant participants + admin | uploader/owner | backend cleanup |
| **Job events** | system | relevant users + admin | system only | admin audit only |
| **Audit logs** | system/admin | restricted to admin | system only | immutable |
| **Professional verification** | admin | professional + admin | admin only | admin only |
| **Payment state** | server/provider | authorized participants + admin | backend/webhook | backend/admin |

**Kiro responsibility:** Document the exact database implementation (RLS policies, role checks, ownership queries) rather than relying on this conceptual table.

---

# 7. State Machine Contract

The database is the **source of truth**.

## 7.1 Required Pattern

```text
UI intent (click "Approve quote")
   ↓
Validated server action / RPC call
   ↓
Authenticated identity verified
   ↓
Authorization checked (is this user permitted?)
   ↓
Current state validated (is the job in quote_pending_approval?)
   ↓
Allowed transition checked (quote_pending_approval → approved is allowed)
   ↓
Atomic mutation executed
   ↓
Job event / audit event recorded
   ↓
Fresh state returned
   ↓
UI updates
```

### 7.2 Failure Behavior

If the transition fails:

```text
Database rejects transaction
   ↓
Error returned to UI
   ↓
UI remains in previous confirmed state
   ↓
User sees actionable error message
```

**Never do this:**

```javascript
// DO NOT do this:
click_button()
  .then(() => setStatus('completed'))  // optimistic, never rolled back
  .then(server_call_fails)
  // status stays 'completed' forever even though it failed
```

Unless you implement a careful rollback strategy, **do not use optimistic updates for state mutations**. Do use them for non-authoritative operations (like toggling a local filter or opening a menu).

### 7.3 Concurrency Testing

Kiro should test:

```text
Two browser tabs, same user
   ↓
Two professionals accessing same job
   ↓
Repeated rapid button clicks
   ↓
Network retry during mutation
   ↓
Refresh/back during mutation
```

Expected outcome: **no duplicate transitions, no contradictory states, no race conditions**.

---

# PART 4: IMPLEMENTATION ROADMAP

---

# 8. Phase-Based Implementation Strategy

The original audit roadmap was too coarse for agent execution. The following sequence is ordered by dependency and risk: **security and truth first, then experience polish**.

---

# Phase 0: Establish the Truth Baseline

**Estimated effort:** 2–4 hours

**Owner:** Kiro

**Goal:** Stop agents from modifying the wrong thing. Create a clear picture of what exists and what is known to be broken.

### Tasks

1. Confirm current branch and git status
2. Record unrelated work in progress (do not reset)
3. Identify all active routes and components
4. Identify current Supabase migrations and schema
5. Identify auth middleware and session utilities
6. Locate `transition_job_state()` and every caller
7. Identify role source of truth (where does role come from?)
8. Identify current RLS policies (what is being enforced?)
9. Identify logout implementation (where does it exist?)
10. Identify any mock/demo data hardcoded into operational pages
11. Check for service-role credentials in client bundle
12. Run build/typecheck/lint where environment permits
13. Capture baseline screenshots of all major pages

### Deliverable

Create: `/docs/FIXIFY_RUNTIME_TRUTH.md`

Contents:
- **Auth architecture:** Supabase Auth integration, session flow, middleware behavior
- **Route matrix:** public, customer, professional, admin routes with current state
- **Role matrix:** role source, role values, role resolution logic
- **Data ownership matrix:** which tables, who owns each row, current RLS policies
- **State transition matrix:** allowed job state transitions, where they're enforced
- **Server mutation inventory:** every place that changes job status (safe vs unsafe)
- **Known mocks:** any hardcoded demo data or fake state
- **Unresolved questions:** areas of uncertainty to investigate

### Definition of Done

Another engineer can answer these four questions without opening more than 2 files:

1. "Where does authentication happen?"
2. "Where is authorization enforced?"
3. "Where is job state changed?"
4. "Where does each dashboard get its data?"

---

# Phase 1: Authentication, Logout & RBAC Hardening

**Estimated effort:** 3–5 hours

**Owner:** Kiro

**Goal:** No cross-role access, no usable private session after logout, role-correct routing.

### Implementation Order

1. Confirm Supabase SSR session retrieval in middleware
2. Confirm middleware protects `/customer/*`, `/professional/*`, `/admin/*`
3. Confirm server-side authorization on every protected action
4. Confirm RLS policies prevent cross-role data access
5. Add/verify logout UI on every role dashboard
6. Confirm session invalidation after logout
7. Verify cookie behavior (HttpOnly, Secure, SameSite flags)
8. Verify private cache behavior (no-store for protected responses)
9. Add negative test suite
10. Verify browser-back behavior after logout

### Test Sequence (Mandatory)

```text
Customer flow:
  login (valid customer)
  → /customer dashboard loads
  → logout
  → /customer returns to login/denied

Professional flow:
  login (valid professional)
  → /professional dashboard loads
  → logout
  → /professional returns to login/denied

Admin flow:
  login (valid admin)
  → /admin dashboard loads
  → logout
  → /admin returns to login/denied

Cross-role attacks:
  customer → /admin (DENY)
  customer → /professional (DENY)
  professional → /admin (DENY)
  professional → /customer (DENY)

IDOR (Insecure Direct Object Reference):
  customer A → customer B's property (DENY)
  customer A → customer B's job (DENY)
  professional A → unassigned job (DENY)

Back-button test:
  login → dashboard → detail page → logout → back → refresh
  Expected: protected page denies or redirects; no usable private data
```

### Definition of Done

- All negative tests pass from a fresh browser context (no cached auth state)
- Logout invalidates session server-side
- Cookie flags verified (HttpOnly, Secure, SameSite)
- Cross-role URL access is denied before rendering sensitive UI
- Browser back-button does not restore usable authenticated state

---

# Phase 2: RLS & Data Ownership Enforcement

**Estimated effort:** 4–8 hours

**Owner:** Kiro

**Goal:** Database-layer access control is proven, not assumed.

### Step 1: Map Ownership

For each sensitive table (properties, requests, jobs, quotes, media, events), document:
- Who owns the row?
- Who can read it?
- Who can insert it?
- Who can update it?
- Who can delete it?

Write this in a structured table or matrix.

### Step 2: Implement/Verify RLS Policies

For each table, implement RLS that enforces the ownership model. Every policy should:
- Check authenticated user ID
- Check user role if relevant
- Verify ownership or explicit assignment
- Deny by default (whitelist access, not blacklist)

### Step 3: Test Customer Isolation

Verify that customer A cannot read/modify:
- customer B's profile
- customer B's properties
- customer B's property assets
- customer B's requests/jobs
- customer B's media
- customer B's quotes
- customer B's maintenance history

### Step 4: Test Professional Isolation

Verify that a professional can access only:
- Their own professional profile
- Authorized/assigned jobs
- Assigned/eligible operational records
- Permitted earnings data

### Step 5: Test Admin Access

Define exactly which admin operations require access. Avoid:
```sql
-- DO NOT USE THIS:
CREATE POLICY "admin_all" ON jobs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
-- This bypasses all other authorization logic
```

Instead, implement specific policies:
```sql
-- Correct approach:
CREATE POLICY "admin_read_jobs_for_operations" ON jobs FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'admin' AND status IN ('disputed', 'exception'));
```

### Definition of Done

- All negative security tests pass
- Cross-role access is denied at RLS layer
- Ownership is enforced for read and write
- Admin access is scoped to necessary operations
- Each policy is documented with its business purpose

---

# Phase 3: State Machine Enforcement

**Estimated effort:** 4–8 hours

**Owner:** Kiro

**Goal:** No job state can be changed by arbitrary client-side mutation.

### Step 1: Inventory Job Status Changes

Locate every frontend and server location that changes job status:
- UI buttons that trigger state changes
- Server actions that accept status mutations
- RPC functions
- Admin operations
- Background jobs or cron

### Step 2: Classify

For each mutation point:

- **SAFE:** calls `transition_job_state()` or equivalent authoritative function
- **UNSAFE:** direct table status update, client-only state, hardcoded demo status

### Step 3: Replace Unsafe Paths

All job state changes must follow this architecture:

```text
UI button (e.g., "Approve quote")
 ↓
Next.js server action or RPC
 ↓
Authorization (is this user permitted?)
 ↓
Validation (is the input valid?)
 ↓
transition_job_state(current_state, requested_transition, actor, inputs)
 ↓
Audit event recorded
 ↓
Fresh state returned
 ↓
UI updates
```

### Step 4: Test Invalid Transitions

Test that these invalid transitions fail:

```text
REQUESTED → COMPLETED (should fail; must go through inspection, quote, approval)
APPROVED → REQUESTED (should fail; go backward is not allowed)
COMPLETED → REQUESTED (should fail; terminal state)
INSPECTION → QUOTE (should fail; requires quote submission first)
```

### Definition of Done

- No production job state can be changed by client-side status dropdown
- Every state change is validated against allowed transitions
- Audit events record every state change with actor, timestamp, old state, new state
- Invalid transitions fail with clear error, not silent failure

---

# Phase 4: Bind Customer Workflow to Real Data

**Estimated effort:** 4–8 hours

**Owner:** Kiro + UI agent

**Goal:** Customer dashboard becomes an operational workspace, not a mockup.

### Dashboard Hierarchy

```text
1. What needs your attention?
   → If no active repairs: "Start a repair" CTA
   → If quote pending: "Review quote" button
   → If active repair: current state + next action

2. Start a repair
   → Problem intake form
   → Property selector
   → Evidence upload
   → Schedule

3. Active jobs
   → Current state
   → Professional info
   → Timeline
   → Next customer action

4. Your properties
   → Property list
   → Recent activity
   → Maintenance history

5. Maintenance history
   → Completed jobs
   → Issue type
   → Date
   → Notes
```

**Avoid:**
- Revenue / Users / Growth KPI cards (irrelevant to customer persona)
- Fake analytics
- Generic card layouts

### Kiro Tasks

- Bind properties to customer (verify ownership in query)
- Bind requests to customer (verify creation)
- Bind active jobs with real state
- Bind quotes and require explicit approval UI
- Bind completion updates to maintenance history
- Enforce every mutation uses server authority

### UI Agent Tasks

- Replace generic counters
- Make intake primary (problem-first, not analytics-first)
- Create meaningful loading/empty/error states
- Make active job state visually obvious
- Show next customer action clearly
- Integrate property history without turning it into metrics dashboard

### Definition of Done

- A real customer can follow one real request from creation through currently supported lifecycle
- No mock data on production paths
- Every displayed number/state is freshly fetched, not cached from previous navigation
- Every customer action (approve quote, provide feedback) produces an audit event

---

# Phase 5: Bind Professional Workspace to Real Data

**Estimated effort:** 4–8 hours

**Owner:** Kiro + UI agent

**Goal:** Professional dashboard becomes operational.

### Kiro Tasks

Verify backend provides:

- Eligible request query (filter by service, location, time)
- Assignment ownership (professional can access only assigned jobs)
- Accept/decline mutation with state validation
- Inspection persistence (findings stored, versioned)
- Quote persistence (quote submitted, awaiting approval)
- Approval dependency (work cannot start until quote approved)
- Completion evidence (photos, notes, signature)
- State transitions (via `transition_job_state()`)

### UI Agent Tasks

Redesign around operational priority:

```text
1. Needs action
   → Requests awaiting response
   → Blocked jobs (waiting on customer, approval)

2. Today's work
   → Route / appointments
   → Scheduled inspections

3. Active job
   → Inspect
   → Quote
   → Work
   → Submit completion

4. History
   → Recent completed
   → Monthly earnings
```

### Definition of Done

- Every displayed job is backed by live state
- Every action (accept, inspect, quote, complete) produces server state change
- Professional cannot see unassigned jobs
- Professional cannot skip inspection→quote→approval sequence
- Earnings calculations are authoritative (not client-side math)

---

# Phase 6: Build Admin Operations Properly

**Estimated effort:** 4–8 hours

**Owner:** Kiro + UI agent

**Goal:** Admin handles exceptions, not fake metrics.

### Required Modules

1. **Needs Attention queue** — filtered by exception type
2. **Quote disputes** — customer questions, professional clarifications
3. **Reassignments** — professional unavailable or underperforming
4. **Professional verification** — document review, onboarding
5. **Audit/event inspection** — timeline of mutations
6. **System signals** — errors, performance issues, capacity alerts

### Interaction Model (Recommended)

Use a queue + inspection drawer:

```text
Operations table (filterable list)
   ↓
Select case
   ↓
Slide-over drawer appears:
   ├── Customer context
   ├── Property
   ├── Job state
   ├── Timeline
   ├── Quote
   ├── Audit events
   └── Allowed actions
   ↓
Take action (approve, reassign, escalate)
   ↓
Audit event recorded
   ↓
Queue refreshed
```

This avoids constantly navigating away from the operational queue.

### Security

Every admin mutation must:
- Authenticate admin
- Validate input
- Validate target
- Check permitted action
- Execute atomically
- Create an immutable audit record

### Definition of Done

- Every admin action has a visible reason
- Every action requires confirmation
- Every action produces an audit trail
- Admin cannot arbitrarily grant/revoke permissions
- Admin interface does not expose service-role credentials or internal IDs

---

# Phase 7: Shared Design System Consolidation

**Estimated effort:** 3–6 hours

**Owner:** UI agent

**Goal:** Stop visual drift, establish single source of truth.

### Consolidate These Layers

1. **Colors** — eliminate legacy dark/mint tokens, standardize on Fixify palette
2. **Spacing** — establish rhythm (4px base unit?)
3. **Typography** — font sizes, weights, line heights
4. **Border radius** — single standard (or no border-radius except where intentional)
5. **Shadows** — restrained, consistent
6. **Buttons** — primary, secondary, tertiary, destructive variants
7. **Badges** — status badges, category tags
8. **Inputs** — text, select, checkbox, radio
9. **Dialogs** — modal, side-over, popover
10. **Headers** — customer, professional, admin dashboard headers
11. **User menus** — consistent across roles
12. **Focus states** — visible, consistent, accessible
13. **Tables** — headers, rows, sorting, pagination
14. **Empty states** — consistent messaging and illustration
15. **Loading states** — spinners, skeletons, progressive disclosure
16. **Error states** — inline errors, toast errors, error pages

### Implementation Approach

- Create a `/components/ui/` directory with reusable primitives
- Document token usage in a design file or Storybook
- Migrate existing usage incrementally (do not perform blind global replace)
- Remove legacy aliases only after all usages are updated

### Definition of Done

- Fixify palette is used consistently (no rogue slate gradients)
- Button geometry is consistent across all pages
- Typography hierarchy is clear (headings, body, labels, captions)
- Focus states are visible and consistent
- No unexplained one-off colors or sizes

---

# Phase 8: Loading / Empty / Error States

**Estimated effort:** 2–4 hours

**Owner:** UI agent + Kiro

**Goal:** Every async interaction has intentional visual feedback.

### Required States Per Component

For data-driven screens:

```text
Loading
Empty (no data)
Success (data displayed)
Error (with actionable message)
Retry (after error)
```

For mutations:

```text
Idle (ready to interact)
  ↓
Submitting (POST/PUT in flight)
  ↓
Success
    OR
Failure (show reason)
  ↓
Retry available
```

### Specific Requirements

**Never:**
```javascript
click()
  .then(() => show('Success!'))
  .then(() => later_backend_fails())
  // Success message stays forever even though mutation failed
```

**Always:**
```javascript
click()
  .then(submit_to_server())
  .then(response => {
    if (response.ok) show('Success!')
    else show('Error: ' + response.reason)
  })
```

**Empty states should:**
- Show why the section is empty
- Provide the next action (e.g., "Start your first repair")
- Use illustration or photography to reinforce product purpose

**Error states should:**
- Explain what went wrong
- Suggest a fix if possible
- Provide a retry button
- Log details for debugging

### Definition of Done

- Every async operation has a loading indicator
- Every page that fetches data has an empty state
- Every error is shown with a reason
- No data sticks after an error unless explicitly retained
- Retry buttons work (hitting the same endpoint again, not showing cached failure)

---

# Phase 9: Responsive Layout & Accessibility QA

**Estimated effort:** 3–5 hours

**Owner:** UI agent + QA

**Goal:** Product works at all target viewports and with keyboard/assistive tech.

### Required Viewport Testing

```text
Desktop:
  1440 × 900
  1280 × 800
  1024 × 768

Tablet:
  768 × 1024

Mobile:
  430 × 932
  390 × 844
```

### Responsive Checks

- No horizontal overflow
- Text is readable (not too small)
- Touch targets are ≥ 44×44 px (mobile)
- Layout reflows intentionally (not cramped)
- Navigation is accessible on mobile

### Keyboard Navigation

- Tab cycles through interactive elements in logical order
- Shift+Tab goes backward
- Enter/Space activates buttons
- Escape closes modals/menus
- Arrow keys work for select/tabs
- Focus is always visible

### Reduced Motion

- Test with `prefers-reduced-motion: reduce` in browser
- Animations should be disabled or simplified
- No auto-playing animations
- No parallax

### Screen Reader / ARIA

- Headings have proper hierarchy (h1, h2, h3)
- Form labels are associated with inputs
- Buttons have accessible names
- Live regions announce async updates
- Images have alt text
- Skip links present (optional but recommended)

### Definition of Done

- Tested at all required viewports
- No horizontal overflow
- Keyboard navigation works
- Focus is visible
- Reduced motion is respected
- ARIA labels are appropriate
- No console warnings from React (missing keys, etc.)

---

# Phase 10: Screenshot-Driven Visual Refinement

**Estimated effort:** 2–5 hours per major surface

**Owner:** UI agent

**Goal:** Visual polish is proven through rendered inspection, not source code review.

### Required Loop (Per Major Page)

```text
Step 1: Render the page
Step 2: Take screenshots (desktop, tablet, mobile)
Step 3: Visual inspection — identify top 3 problems
Step 4: Fix only those 3 problems
Step 5: Render again
Step 6: Compare before/after
Step 7: If improved, commit; if not, revert
```

### Problems to Prioritize

Fix in this order:

1. **Hierarchy** — can the user quickly understand what is most important?
2. **Spacing** — is whitespace intentional or accidental?
3. **Composition** — are related items grouped visually?
4. **Visual grouping** — can the user distinguish sections?
5. **Readability** — is text large enough? Is contrast sufficient?

**Only after those:**

6. Shadows (supporting hierarchy, not primary)
7. Gradients (accent, not primary visual)
8. Micro-animations (polish, not essential)
9. Decorative effects (lowest priority)

### Definition of Done

- Major pages have been rendered and inspected
- Visual defects have been identified and prioritized
- At least 3 passes of capture-inspect-fix have occurred
- Screenshots are archived for regression testing
- No visual defects remain that block usability or understanding

---

# PART 5: EXECUTION TEMPLATES & TESTING

---

# 9. Agent Execution Prompt — Kiro (Backend/System)

Use this prompt when assigning backend/system work:

```text
You are the Fixify principal backend and systems engineer.

Read SYSTEM_AUDIT.md completely before changing code.

Your responsibility is the system-of-record layer:
- Supabase schema, migrations, PostgreSQL functions
- RLS (Row-Level Security) policies
- Authentication and session handling
- Middleware and server-side authorization
- Server actions and RPCs
- transition_job_state() and state machine integrity
- Data ownership and IDOR prevention
- Audit and event persistence
- Input validation and error handling
- Concurrency and atomic operations
- Private cache headers and session security
- Logout and session invalidation
- Integration boundaries for payment (deferred, but architecture preserved)

Do NOT:
- Redesign the UI unless required to expose a backend failure
- Invent product behavior not explicitly in SYSTEM_AUDIT.md
- Trust client-submitted user_id, role, job_status, payment_status, price, or ownership
- Implement production Razorpay integration (deferred)
- Create fake backend operations to make UI demos look complete

For every change:

1. Inspect the current implementation
2. Explain the existing behavior
3. Identify the security/business invariant you are upholding
4. Make the smallest correct implementation
5. Test positive cases (intended behavior works)
6. Test negative cases (attacks/invalid transitions fail)
7. Verify no cross-role access (customer ≠ professional ≠ admin)
8. Verify no IDOR (customer A cannot modify customer B's data)
9. Verify logout and session invalidation where relevant
10. Verify state-machine integrity (no invalid transitions)
11. Report exactly what was changed and what remains unverified

If a UI request requires a new backend rule, stop and state the required
contract instead of silently inventing it.

Example output:

  "I updated transition_job_state() to reject APPROVED → REQUESTED transitions.
   
   Tested:
   - [✓] APPROVED → INSPECTION fails (state machine denies)
   - [✓] APPROVED → COMPLETED fails (requires work completion evidence)
   - [✓] APPROVED → QUOTE fails (already has quote)
   
   Verified:
   - [✓] Audit event recorded for rejected transition
   - [✓] No race condition if two requests attempt simultaneously
   - [?] Browser-back after logout still denies protected fetch (need to verify
         with fresh session test)
   
   Remaining:
   - Need to implement quote evidence validation before allowing APPROVED → COMPLETED"
```

---

# 10. Agent Execution Prompt — UI / Frontend

```text
You are the Fixify lead product designer and frontend engineer.

Read SYSTEM_AUDIT.md before editing.

Your job is NOT to make the page look like an AI-generated SaaS template
or to add more cards because they look impressive.

Design for the actual Fixify workflow:

  Messy problem
    ↓
  Evidence
    ↓
  Service interpretation
    ↓
  Verified professional
    ↓
  Inspection
    ↓
  Transparent quote
    ↓
  Explicit customer approval
    ↓
  Work performed
    ↓
  Completion
    ↓
  Property history

Before editing:

1. Render the current page (if environment allows)
2. Take a screenshot
3. Identify the three largest visual problems
4. Fix those problems *before* adding decoration
5. Do not add new components merely to look more finished

Rules:

- Preserve backend behavior (do not invent state transitions)
- Never invent business data (show real values or show "loading")
- Never use fake metrics as filler
- Use the Fixify design tokens (Porcelain, Paper, Ink, Teal, Clay)
- Make mobile a deliberate composition (not a squeeze of desktop)
- Use real imagery where it strengthens trust
- Use animation only when it communicates:
  * state change (blue → approved)
  * hierarchy (highlight the important thing)
  * progress (step indicator advancing)
  * feedback (button clicked, loading)
  * or interaction (hover state)
- Honor prefers-reduced-motion
- Keep loading/error/empty/success states intentional and visible
- Do not add a component merely because it is visually impressive
- Do not add a new dependency unless its value is clear and measured

After implementation:

1. Render the page again
2. Take screenshots at desktop (1440×900, 1280×800) and mobile (390×844)
3. Check for horizontal overflow
4. Check focus states (keyboard Tab through all interactive elements)
5. Check navigation (open/close menus, dialogs, slides)
6. Check reduced motion (prefers-reduced-motion should disable animations)
7. Report remaining visual defects honestly (do not claim they are "future work")

Example output:

  "Updated /customer dashboard:
   
   Changes:
   - Simplified intro (removed 4 empty KPI cards, added problem-first CTA)
   - Integrated active job state (fetched from backend, no mock data)
   - Created loading skeleton (while jobs are fetching)
   - Added empty state (when customer has no active jobs)
   
   Remaining visual defects:
   1. Typography hierarchy needs refinement (captions are 12px, should be 14px+)
   2. Property history section has too much vertical spacing
   3. Mobile layout needs adjusting (active job card is too cramped)
   
   Tested:
   - [✓] Desktop at 1440×900, 1280×800
   - [✓] Mobile at 390×844
   - [✓] Keyboard navigation (Tab cycles through buttons, Escape closes menus)
   - [✓] Reduced motion respected (animations disabled)
   - [?] Screen reader labels (need manual VoiceOver test)"
```

---

# 11. Negative Security Test Matrix

These tests must pass before production traffic. Use this as an acceptance matrix.

| Scenario | Expected | Pass/Fail | Notes |
|----------|----------|-----------|-------|
| **Authentication** | | | |
| Customer login with valid creds | Dashboard loads | | |
| Customer login with invalid creds | Generic error, no user leak | | |
| Professional login with valid creds | Dashboard loads | | |
| Admin login with valid creds | Dashboard loads | | |
| Unauthenticated `/customer` | Redirect to login | | |
| Unauthenticated `/professional` | Redirect to login | | |
| Unauthenticated `/admin` | Redirect to login | | |
| **Authorization** | | | |
| Customer A → Customer B property | DENY | | |
| Customer A → Customer B job | DENY | | |
| Customer A → Customer B media/evidence | DENY | | |
| Customer → `/professional` route | DENY | | |
| Customer → `/admin` route | DENY | | |
| Professional → `/admin` route | DENY | | |
| Professional → `/customer` route | DENY | | |
| Professional → unassigned job | DENY (read/write) | | |
| Professional → other professional's earnings | DENY | | |
| **Data Ownership** | | | |
| Customer modifies another customer's property | DENY | | |
| Customer modifies another customer's request | DENY | | |
| Professional modifies unassigned job status | DENY | | |
| Admin creates quote without authorization | DENY | | |
| **State Machine** | | | |
| REQUESTED → COMPLETED (skip phases) | DENY | | |
| APPROVED → REQUESTED (go backward) | DENY | | |
| COMPLETED → REQUESTED (re-open) | DENY | | |
| INSPECTION → COMPLETED (skip quote) | DENY | | |
| Accept quote then modify price | Modified price ignored/validated | | |
| **Session & Logout** | | | |
| Logout invalidates session | Protected requests denied | | |
| Browser back after logout | No usable protected state | | |
| Protected route with expired token | Redirect to login | | |
| Direct `/customer/job/999` after logout | DENY | | |
| **Cache & Headers** | | | |
| Private dashboard response caching | Private, no-store set | | |
| Protected API response caching | Cache-Control appropriate | | |
| **Input Validation** | | | |
| SQL injection attempt in form | Sanitized/rejected | | |
| Cross-site scripting (XSS) in request text | Escaped/sanitized | | |
| Negative numbers for price/cost | Rejected | | |
| Invalid date range | Rejected | | |
| **Concurrency** | | | |
| Two tabs approve same quote | Second approval fails cleanly | | |
| Rapid repeated button clicks | Single action executed, others queued/rejected | | |
| Refresh during mutation | State remains consistent | | |

---

# PART 6: RELEASE GATES & FINAL PRINCIPLES

---

# 12. Final Release Gate — Production Readiness Checklist

Fixify is ready for broader public traffic only when:

```text
[✓] Authentication
    - Login works for all three roles
    - Invalid login is handled safely
    - Logout exists and invalidates session

[✓] RBAC
    - Customer cannot access professional/admin
    - Professional cannot access admin/customer
    - Every protected route is enforced in middleware

[✓] RLS
    - Database policies enforce ownership
    - Cross-role queries denied at database layer
    - All negative security tests pass

[✓] State Machine
    - Every state transition validated
    - Invalid transitions rejected
    - Audit events recorded

[✓] Real Data Binding
    - Customer dashboard shows real customer data
    - Professional dashboard shows real assigned jobs
    - Admin dashboard shows real operational cases
    - No hardcoded demo data on production paths

[✓] Error Handling
    - Loading states visible
    - Empty states clear
    - Error states actionable
    - Retry mechanisms work

[✓] Session Security
    - Cookies have correct flags (HttpOnly, Secure, SameSite)
    - Private responses have correct cache headers
    - Logout clears all relevant state
    - Browser back after logout denies access

[✓] Responsive & Accessibility
    - Desktop: 1440×900, 1280×800, 1024×768
    - Tablet: 768×1024
    - Mobile: 430×932, 390×844
    - Keyboard navigation works
    - Focus states visible
    - Reduced motion respected
    - ARIA labels appropriate

[✓] Security Negative Tests
    - IDOR tests pass
    - Cross-role access tests pass
    - State transition tests pass
    - Logout/back-button tests pass
    - Input validation tests pass
    - Concurrency tests pass

[✓] Screenshot & Visual QA
    - All major pages rendered and inspected
    - Visual hierarchy clear
    - Spacing intentional
    - Typography consistent
    - No generic SaaS template appearance
    - Brand palette used consistently

[✓] Build & Deployment
    - TypeScript compile succeeds (0 errors)
    - Linter passes (no ignored errors)
    - Build completes successfully
    - Environment variables documented
    - Secrets not in bundle
    - Performance acceptable (LCP, CLS measured)

[✓] Documentation
    - BASELINE.md created (Phase 0 deliverable)
    - SYSTEM_AUDIT.md kept current
    - Admin operational docs available
    - Runbook for on-call operations
```

**Payment Status:**

- [ ] Razorpay integration NOT required for this gate
- [ ] Payment architecture remains clean (not coupled to UI)
- [ ] Future payment boundary defined but not implemented
- [ ] Product is operationally complete without payment

---

# 9. Kiro Execution Template — Unified Implementation (Backend + UI + Visual QA)

Kiro is the sole implementation agent for all Fixify development phases. This template applies to every assignment.

Use MCPs (Playwright, Chrome DevTools, Shadcn, 21st Century) to:
- Implement React components and pages
- Capture and inspect screenshots at target viewports
- Verify keyboard navigation and accessibility
- Test visual hierarchy, spacing, and responsive behavior
- Log and fix visual defects before marking work complete

Every Kiro execution spans three coordinated layers:

**BACKEND** (Supabase, Auth, RLS, State Machine):
- Implement authoritative data layer
- Enforce security via middleware and RLS
- Validate state transitions
- Record audit events

**FRONTEND UI** (React, Tailwind, Components):
- Implement pages and components using Fixify design tokens
- Build loading/empty/error states
- Ensure keyboard and accessibility support
- Use MCPs to capture before/after screenshots

**VISUAL VERIFICATION** (Playwright, Chrome DevTools):
- Render pages at all target viewports
- Inspect pixels: spacing, typography, colors, focus states
- Test interactions and responsive behavior
- Identify top 3 visual defects
- Fix, then compare before/after

Example Kiro output format:

```
PHASE 4: Customer Dashboard Real Data Binding

Backend:
- [✓] RLS policy: customers read own properties only
- [✓] Server action: fetchCustomerProperties() with ownership check
- [✓] Bound active jobs to transition_job_state()
- [✓] Audit events on state change

UI:
- [✓] Implemented CustomerDashboard component
- [✓] Built JobCard, LoadingState, EmptyState
- [✓] Design tokens: Fixify palette applied consistently

Visual Verification (Playwright + Chrome DevTools):
Baseline: [1440×900 screenshot], [390×844 screenshot]
After implementation: [1440×900 new], [390×844 new]

Visual defects fixed:
1. Removed 4 empty KPI cards (hierarchy improved)
2. Increased job card padding 12px → 16px (breathing room)
3. Typography: caption 12px → 14px (readability)

Remaining defects:
1. Property history spacing inconsistent (Phase 5 polish)
2. Professional contact card needs emphasis (nice-to-have)

Testing:
- [✓] Customer A cannot see Customer B property (RLS denies)
- [✓] Keyboard Tab navigates through job cards
- [✓] Escape closes detail panel
- [✓] Responsive: desktop, tablet, mobile reflow intentional
- [✓] Reduced motion: animations disabled when enabled
```

---

# 13. Final Orchestration Strategy

Fixify is built by a **single unified engineer (Kiro)** with coordinated responsibilities across three layers:

```text
                        FIXIFY
                           │
                    KIRO RESPONSIBILITY
                           │
        ┌────────────────────┬────────────────────┐
        │                    │                    │
    BACKEND            FRONTEND UI          VISUAL VERIFY
        │                    │                    │
    Auth/RBAC          React/Tailwind      Playwright/DevTools
    RLS                Components           Screenshots
    State machine       Responsive          Inspect pixels
    Supabase            Animation           Test interactions
    Server validation   Accessibility       Verify a11y
    Sessions            Design tokens       Report defects
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                        VERIFY LOOP
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
        Security         Workflow          Visual
        (negative         (state            (screenshots
        tests)           machine)           inspected)
            │                ▼                ▼
            └─────────────── PASS ───────────┘
                             │
                             ▼
                      RELEASE GATE
```

**The workflow:** Backend establishes truth → UI presents truth → MCPs verify visually

### The Central Rule

> **Never let the UI become more sophisticated than the system can truthfully support.**

If the dashboard says:

- **"Professional assigned"** → there must be authoritative data proving it
- **"Quote approved"** → there must be an authorized state transition proving it
- **"Completed"** → there must be completion evidence/state proving it

If a user logs out:
- The browser must not regain usable protected access merely because an old page remains in history

If the UI looks finished:
- It must have been rendered and inspected at the target viewports using Playwright
- It is not finished from source code review alone
               │                       │
        Auth / RBAC              Layout
        RLS                      Typography
        State machine            Components
        Supabase                 Animation
        Server validation        Responsive UX
        Sessions                 Accessibility
        Events                   Visual QA
               │                       │
               └───────────┬───────────┘
                           │
                           ▼
                       QA / VERIFY
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         Security        Workflow        Visual
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                    RELEASE GATE
```

### The Central Rule

> **Never let the UI become more sophisticated than the system can truthfully support.**

If the dashboard says:

- **"Professional assigned"** → there must be authoritative data proving it
- **"Quote approved"** → there must be an authorized state transition proving it
- **"Completed"** → there must be completion evidence/state proving it
- **"Status: In progress"** → the database must confirm it

If a user logs out:
- The browser must not regain usable protected access merely because an old page remains in history

If the UI looks finished:
- It must have been rendered and inspected at the target viewports
- It is not finished from source code review alone

---

# 14. What Is Explicitly Deferred

The following should NOT consume the current implementation cycle unless required to unblock another system:

- **Live Razorpay setup** — no production credentials
- **Razorpay production flow** — no payment collection
- **Refund execution** — no live refund processing
- **Payment webhook deployment** — no webhook infrastructure
- **Payment reconciliation** — no live provider reconciliation
- **Advanced animation libraries** — Anime.js/GSAP only for proven ROI
- **Major homepage redesign** — after the current visual system stabilizes
- **Unnecessary architecture rewrites** — refactor only to fix known failures

Payment remains an **architectural boundary, not a current implementation milestone**.

The system should preserve clean payment-state concepts (PAYMENT_PENDING, PAYMENT_COMPLETED) and future webhook integration points, but no live payment functionality is required for controlled MVP.

---

# 15. Fundamental Principle: Truth First, Polish Second

The immediate objective is NOT to make Fixify look like a finished billion-dollar marketplace.

The immediate objective is to make it:

1. **Truthful** — every visible data point matches backend reality
2. **Secure** — authentication, authorization, and data ownership are proven
3. **State-correct** — job state transitions are validated and atomic
4. **Role-correct** — customer, professional, and admin see only what they should
5. **Operationally coherent** — workflows are complete and reversible

Once those foundations are proven, the remaining UI polish has dramatically higher ROI and is much faster to execute.

A beautiful interface built on insecure or false foundations causes harm (security breaches, data corruption, customer trust erosion). A functional interface built on rock-solid foundations can be polished safely and quickly.

---

# END OF SYSTEM_AUDIT.md

**Document version:** 2.1 (Kiro-unified)  
**Last updated:** 2026-10-04  
**Target audience:** Kiro (sole implementation agent using MCPs for UI/visual verification)  
**Maintenance:** Update this document each time implementation phases complete or new decisions are made.

**MCP Tools Used:**
- **Playwright** — Browser automation, screenshot capture, interaction testing
- **Chrome DevTools** — Visual inspection, pixel-level measurement, accessibility checks
- **Shadcn** — Component library integration for consistent UI
- **21st Century** — Design system and component management
