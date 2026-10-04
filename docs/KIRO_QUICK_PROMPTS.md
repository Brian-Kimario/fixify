# Kiro Quick Prompts — Copy & Paste Templates

Use these templates directly in Kiro chat. Just fill in the bracketed sections [like this].

---

## PHASE 0: Discovery

```
TASK: Phase 0 — Establish Baseline Truth
PROJECT: /Users/brian_kimario/Downloads/fixify
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 0)

Investigate current system:
1. Auth architecture and session handling
2. Route matrix (public, /customer, /professional, /admin)
3. Role resolution (where do roles come from?)
4. Data ownership model (tables: users, properties, requests, jobs, quotes, media, events)
5. Job state transitions (where is transition_job_state()?)
6. Server mutation inventory (safe vs unsafe)
7. Known mock/demo data
8. Build status (pnpm build, pnpm lint)
9. Screenshots: /, /auth/login, /customer, /professional, /admin (use Playwright, save to /docs/baselines/)

REPORT:
After investigation, summarize findings verbally:
- Auth architecture description
- Routes and protection status
- Role resolution mechanism
- Data ownership model
- State transition location
- Any unsafe mutations found
- Build status (success or errors)

COMMIT: git commit -m "Phase 0: Baseline discovery complete"
```

---

## PHASE 1: Authentication & Logout

```
TASK: Phase 1 — Authentication, Logout & RBAC Hardening
CONTEXT: Phase 0 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 1)

Verify and implement:

1. LOGOUT FLOW
   [ ] Logout exists on every dashboard
   [ ] Logout calls Supabase.auth.signOut()
   [ ] Cookies cleared (HttpOnly, Secure, SameSite flags)
   [ ] Redirects to /auth/login

2. MIDDLEWARE PROTECTION
   [ ] /customer/* requires authentication
   [ ] /professional/* requires authentication
   [ ] /admin/* requires authentication
   [ ] Unauthenticated redirects to /auth/login

3. CROSS-ROLE DENIAL TESTS (Use Playwright)
   [ ] Customer → /admin: DENIED
   [ ] Customer → /professional: DENIED
   [ ] Professional → /admin: DENIED
   [ ] Professional → /customer: DENIED

4. SESSION INVALIDATION TEST (Use Playwright)
   [ ] Login as customer
   [ ] Navigate to /customer
   [ ] Click "Sign Out"
   [ ] Protected fetch returns 401
   [ ] Direct /customer URL redirects to /auth/login
   [ ] Browser back button: no usable protected data

REPORT: Summarize test results (pass/fail for each), cookie verification

COMMIT: git commit -m "Phase 1: Auth, logout, RBAC verified"
```

---

## PHASE 2: RLS & Data Ownership

```
TASK: Phase 2 — RLS & Data Ownership Enforcement
CONTEXT: Phase 1 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 2)

For each sensitive table (properties, requests, jobs, quotes, media):

1. IMPLEMENT RLS POLICY
   - Customers read/write only owned records
   - Professionals read/write only assigned records
   - Admin access restricted and audited
   
2. TEST NEGATIVE CASES (Use Supabase MCP)
   [ ] Customer A queries Customer B property: DENIED
   [ ] Professional A queries unassigned job: DENIED
   [ ] Direct SQL bypass attempt: DENIED

REPORT: Summarize policies implemented, test results

COMMIT: git commit -m "Phase 2: RLS policies implemented and tested"
```

---

## PHASE 3: State Machine

```
TASK: Phase 3 — State Machine Enforcement
CONTEXT: Phase 2 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 3)

1. AUDIT MUTATIONS
   Search code for all .update({ status: ... }) calls
   For each: is it safe (uses transition_job_state)? or unsafe (direct update)?

2. REPLACE UNSAFE MUTATIONS
   For each unsafe mutation:
   - Create server action calling transition_job_state()
   - Add authorization check
   - Add audit event

3. TEST INVALID TRANSITIONS (Use Playwright + Supabase)
   [ ] REQUESTED → COMPLETED: DENIED
   [ ] APPROVED → REQUESTED: DENIED
   [ ] COMPLETED → ANYTHING: DENIED
   [ ] Valid transitions (REQUESTED → ACCEPTED): ALLOWED

REPORT: Summarize mutations found/replaced, test results

COMMIT: git commit -m "Phase 3: State machine enforcement complete"
```

---

## PHASE 4: Customer Dashboard

```
TASK: Phase 4 — Customer Dashboard Real Data Binding
CONTEXT: Phase 3 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 4)

1. CREATE SERVER ACTIONS
   [ ] fetchCustomerProperties() — with ownership check
   [ ] fetchCustomerJobs() — with ownership verification
   [ ] fetchJobDetails(jobId) — with authorization
   
2. BUILD COMPONENTS
   [ ] CustomerDashboard — main page
   [ ] PropertyList — customer's properties
   [ ] JobCard — single job display
   [ ] LoadingState — skeleton
   [ ] EmptyState — no jobs yet
   [ ] ErrorState — error + retry

3. HANDLE STATES
   For each section: Loading, Loaded, Empty, Error

4. VISUAL VERIFICATION (Use Playwright + Chrome DevTools)
   [ ] Baseline screenshot at: 1440×900, 1280×800, 1024×768, 768×1024, 390×844
   [ ] Inspect with DevTools: spacing, typography, colors
   [ ] Identify top 3 visual defects
   [ ] Fix and re-screenshot
   [ ] Compare before/after

5. TESTING
   [ ] Customer A sees only own data
   [ ] Customer B does not see Customer A data
   [ ] All component states render correctly

DESIGN TOKENS: Porcelain #F7F4EC, Paper #FFFEFA, Ink #18211F, Teal #176B5B, Clay #A9523D

REPORT: Summarize components built, visual improvements, test results

COMMIT: git commit -m "Phase 4: Customer dashboard real data binding complete"
```

---

## PHASE 5: Professional Dashboard

```
TASK: Phase 5 — Professional Workspace Real Data Binding
CONTEXT: Phase 4 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 5)

1. CREATE SERVER ACTIONS
   [ ] fetchEligibleRequests() — filter by service, location
   [ ] fetchAssignedJobs() — professional's jobs only
   [ ] acceptRequest(requestId) — with state validation
   [ ] submitInspection(jobId, findings) — with persistence
   [ ] submitQuote(jobId, items, total) — with versioning

2. BUILD COMPONENTS
   [ ] ProfessionalDashboard — main page
   [ ] RequestQueue — requests to review
   [ ] JobCard — current job with actions
   [ ] InspectionForm — record findings
   [ ] QuoteForm — submit quote
   [ ] LoadingState, EmptyState, ErrorState

3. INFORMATION ARCHITECTURE
   Priority order: Needs action → Today's work → Active job → History

4. VISUAL VERIFICATION
   [ ] Screenshots at all viewports
   [ ] Inspect: hierarchy, spacing, typography
   [ ] Identify and fix top 3 visual defects

5. TESTING
   [ ] Professional sees only assigned jobs
   [ ] Cannot accept already-assigned request
   [ ] State transitions work (REQUESTED → ACCEPTED → INSPECTION, etc.)

REPORT: Summarize components built, test results

COMMIT: git commit -m "Phase 5: Professional dashboard real data binding complete"
```

---

## PHASE 6: Admin Operations

```
TASK: Phase 6 — Admin Operations Properly Built
CONTEXT: Phase 5 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 6)

1. CREATE ADMIN ACTIONS
   [ ] fetchNeedsAttention() — filtered operational cases
   [ ] resolveQuoteDispute(jobId, resolution) — with audit
   [ ] reassignJob(jobId, newProfessionalId) — with validation
   [ ] verifyProfessional(profId, decision) — with audit

2. BUILD ADMIN INTERFACE
   [ ] OperationsQueue — needs attention table
   [ ] CaseDrawer — side-over for details
   [ ] CaseTimeline — job history
   [ ] ActionButtons — permitted operations

3. OPERATIONS FLOW
   Table → Click case → Side-over drawer → Take action → Queue refreshes

4. TESTING
   [ ] Admin cannot arbitrarily modify any record
   [ ] Every action creates audit event
   [ ] Unauthorized operations are denied

REPORT: Summarize operations built, test results

COMMIT: git commit -m "Phase 6: Admin operations properly built"
```

---

## PHASE 7: Design System Consolidation

```
TASK: Phase 7 — Design System Consolidation
CONTEXT: Phase 6 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 7)

1. CONSOLIDATE TOKENS
   [ ] Colors: Porcelain, Paper, Ink, Teal, Deep Teal, Clay (remove legacy)
   [ ] Spacing: 4px rhythm
   [ ] Typography: 3–4 scales (heading, body, caption)
   [ ] Borders: 1px solid, subtle
   [ ] Shadows: restrained, 2–3 variants
   [ ] Border radius: 0.5rem standard (or none)

2. BUILD COMPONENTS
   [ ] Button (primary, secondary, destructive)
   [ ] Input (text, select, checkbox, radio)
   [ ] Badge (status, category)
   [ ] Dialog (modal, side-over)
   [ ] Table
   [ ] Header
   [ ] UserMenu
   [ ] EmptyState, LoadingState, ErrorState

3. MIGRATE USAGE
   Replace legacy token usage incrementally (do not global search/replace)

REPORT: Summarize tokens defined, components built

COMMIT: git commit -m "Phase 7: Design system consolidated"
```

---

## PHASE 8: Loading / Error / Empty States

```
TASK: Phase 8 — Loading, Empty, Error States Complete
CONTEXT: Phase 7 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 8)

For every data-driven component, implement:

1. LOADING STATE
   [ ] Skeleton or spinner
   [ ] Accurate shape/size of final content
   [ ] Clear message (e.g., "Loading your jobs...")

2. EMPTY STATE
   [ ] Message explaining why empty
   [ ] CTA for next action (e.g., "Start your first repair")
   [ ] Optional illustration

3. ERROR STATE
   [ ] Error message (user-friendly, not technical)
   [ ] Reason (if possible)
   [ ] Retry button

4. SUCCESS STATE
   [ ] Data displayed
   [ ] Confirmation feedback (optional)

For mutations, implement:

1. IDLE: Ready to submit
2. SUBMITTING: Spinner, button disabled
3. SUCCESS: Confirmation message
4. ERROR: Error message, retry button

REPORT: Summarize components with states implemented

COMMIT: git commit -m "Phase 8: Loading, error, empty states complete"
```

---

## PHASE 9: Responsive & Accessibility QA

```
TASK: Phase 9 — Responsive Layout & Accessibility QA
CONTEXT: Phase 8 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 9)

TEST VIEWPORTS (Use Playwright):
[ ] Desktop: 1440×900, 1280×800, 1024×768
[ ] Tablet: 768×1024
[ ] Mobile: 430×932, 390×844

For each:
[ ] No horizontal overflow
[ ] Text readable (not too small)
[ ] Touch targets ≥44×44px (mobile)
[ ] Layout reflows intentionally

KEYBOARD NAVIGATION (Use Playwright):
[ ] Tab order logical (left to right, top to bottom)
[ ] Tab cycles through all interactive elements
[ ] Shift+Tab goes backward
[ ] Escape closes modals/menus
[ ] Enter/Space activates buttons
[ ] Arrow keys work for select/tabs

REDUCED MOTION (Use Playwright):
[ ] Set: prefers-reduced-motion: reduce
[ ] Animations should be disabled or simplified
[ ] No motion delays access to content

SCREEN READER / ARIA (Manual test or Playwright checks):
[ ] Headings have proper hierarchy (h1, h2, h3)
[ ] Form labels associated with inputs (aria-label or <label>)
[ ] Buttons have accessible names
[ ] Images have alt text
[ ] Live regions announce updates (aria-live)

REPORT: Summarize viewport tests, keyboard tests, accessibility checks

COMMIT: git commit -m "Phase 9: Responsive and accessibility QA complete"
```

---

## PHASE 10: Visual Polish via Screenshots

```
TASK: Phase 10 — Visual Refinement via Screenshots
CONTEXT: Phase 9 complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Phase 10)

For each major page (/customer, /professional, /admin):

1. RENDER & SCREENSHOT (Use Playwright)
   [ ] Capture at 1440×900 (desktop)
   [ ] Capture at 390×844 (mobile)

2. INSPECT VISUALLY
   [ ] Hierarchy: can user quickly identify primary action?
   [ ] Spacing: is whitespace intentional or accidental?
   [ ] Composition: are related items grouped visually?
   [ ] Typography: font sizes, weights, colors consistent?
   [ ] Alignment: are elements aligned to a grid?

3. IDENTIFY TOP 3 DEFECTS
   Priority: Hierarchy → Spacing → Composition (NOT shadows, gradients, animations)

4. FIX TOP 3 DEFECTS
   Make changes, re-render

5. COMPARE BEFORE/AFTER
   [ ] Screenshot desktop before/after
   [ ] Screenshot mobile before/after
   [ ] Document improvements

REPORT: Summarize pages reviewed, improvements made, defects fixed

COMMIT: git commit -m "Phase 10: Visual refinement complete"
```

---

## FINAL VERIFICATION & SECURITY CHECKS

```
TASK: Final Security & Functionality Verification
CONTEXT: All phases complete
REFERENCE: /docs/SYSTEM_AUDIT.md (Release Gate)

RUN ALL NEGATIVE SECURITY TESTS:

1. AUTHENTICATION
   [ ] Invalid credentials rejected safely
   [ ] Logout invalidates session
   [ ] Back button after logout: no usable protected state

2. AUTHORIZATION (Use Playwright)
   [ ] Customer A cannot access Customer B property
   [ ] Professional cannot access unassigned job
   [ ] Admin cannot bypass authorization

3. RLS (Use Supabase MCP)
   [ ] Direct SQL query by unauthorized user: DENIED
   [ ] Cross-role query attempt: DENIED

4. STATE MACHINE
   [ ] Invalid transitions rejected
   [ ] Valid transitions work
   [ ] Audit events created

5. BUILD & DEPLOYMENT
   [ ] pnpm build: succeeds, 0 errors
   [ ] pnpm lint: 0 errors
   [ ] pnpm test:run: all pass (if tests exist)
   [ ] No secrets in bundle
   [ ] No console errors

REPORT: Summarize all test results (pass/fail)

If ALL tests pass: system is production-ready ✅

FINAL COMMIT: git commit -m "Release: All phases complete, security verified"
FINAL TAG: git tag -a v1.0.0-mvp -m "MVP Release"
```

---

## Usage

1. **Choose your current phase** (0–10 or verification)
2. **Copy the entire prompt** (from opening ``` to closing ```)
3. **Paste into Kiro chat**
4. **Wait for Kiro to complete**
5. **Verify results** (check progress, screenshots)
6. **Commit** as suggested in prompt
7. **Proceed to next phase**

---

## Key Points

- **No deliverable files** — Report results verbally in chat, keep it lean
- **Use MCPs explicitly** — Playwright (screenshots), Chrome DevTools (inspection), Supabase (testing)
- **Verify visually** — Before/after screenshots prove improvements
- **Commit after each phase** — Phase-by-phase progress
- **Report, don't document** — Summarize findings; heavy documentation is optional

Let's build Fixify efficiently! 🚀
