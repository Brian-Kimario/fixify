# Kiro CLI Execution Guide — Phase-by-Phase Prompting Strategy

This guide teaches you how to effectively prompt Kiro (via VS Code or CLI) to execute each phase in SYSTEM_AUDIT.md with maximum effectiveness and verification.

**Key principle:** Use **structured, context-rich prompts** that give Kiro all the information upfront so it can work autonomously and verify results.

---

## Part 1: Before You Start — Prerequisites

### 1. Verify Your Setup

```bash
# Ensure Node.js and pnpm are installed
node --version   # Should be v18+
pnpm --version   # Should be v8+

# Verify MCPs are loaded in Kiro (they should auto-connect)
# In VS Code: open Kiro chat and type "test" → MCPs appear in context
```

### 2. Create Output Directories

```bash
mkdir -p /Users/brian_kimario/Downloads/fixify/docs/phase-outputs
mkdir -p /Users/brian_kimario/Downloads/fixify/docs/baselines
mkdir -p /Users/brian_kimario/Downloads/fixify/docs/screenshots
```

### 3. Set Project Context

Before each major phase, ensure Kiro knows:
- The project root: `/Users/brian_kimario/Downloads/fixify`
- The audit document: `/Users/brian_kimario/Downloads/fixify/docs/SYSTEM_AUDIT.md`
- Current phase number
- What was completed in the previous phase

---

## Part 2: Phase 0 — Baseline Discovery (2–4 hours)

**Goal:** Establish a clear picture of what exists before making any changes.

### Step 0.1: Initial Discovery Prompt

Open Kiro and use this prompt:

```
TASK: Phase 0 — Establish Baseline Truth
PROJECT: Fixify (Next.js + Supabase + React)
AUDIT: /Users/brian_kimario/Downloads/fixify/docs/SYSTEM_AUDIT.md (Section 8, Phase 0)

Your job is to create a comprehensive baseline of the current Fixify implementation.

DELIVERABLE: Create /docs/FIXIFY_RUNTIME_TRUTH.md with these sections:

1. AUTH ARCHITECTURE
   - Current Supabase Auth setup
   - Session retrieval mechanism (getSession? middleware?)
   - Where roles are stored/resolved
   - Current middleware behavior

2. ROUTE MATRIX
   - All public routes (/, /help, /auth/*)
   - All customer routes (/customer/*)
   - All professional routes (/professional/*)
   - All admin routes (/admin/*)
   - Current protection status (middleware enforced? yes/no)

3. ROLE MATRIX
   - Where do roles come from? (Supabase JWT? database lookup?)
   - Role values: customer, professional, admin, other?
   - How is role resolution triggered?

4. DATA OWNERSHIP MATRIX
   - List tables: users, properties, requests, jobs, quotes, media, events
   - For each table: who owns rows? how is ownership stored?
   - Current RLS policies (list them or say "not yet implemented")

5. STATE TRANSITION MATRIX
   - Allowed job states (REQUESTED, INSPECTION, QUOTE_PENDING, APPROVED, IN_PROGRESS, COMPLETED, etc.)
   - Where is transition_job_state() defined? (path/to/file:line)
   - List every place that changes job status (backend + frontend)
   - For each: is it safe (uses transition_job_state)? or unsafe (direct update)?

6. SERVER MUTATION INVENTORY
   - Every server action that changes data
   - Every RPC that changes data
   - Mark: AUTHORITATIVE (validates) or UNSAFE (needs fixing)

7. KNOWN MOCKS / DEMO DATA
   - Any hardcoded fake data on production pages?
   - Any environment-dependent fake behavior?

8. BUILD & TEST STATUS
   - Run: pnpm build → capture exit code, errors
   - Run: pnpm lint → capture exit code, errors
   - Run: pnpm test:run (if available) → capture results
   - List any blocking issues

9. CURRENT SCREENSHOTS (Use Playwright MCP)
   - Screenshot of / (homepage)
   - Screenshot of /auth/login
   - Screenshot of /customer (if accessible)
   - Screenshot of /professional (if accessible)
   - Screenshot of /admin (if accessible)
   - Store in /docs/baselines/phase0-*.png

VERIFICATION:
- [ ] Can you answer: "Where does authentication happen?"
- [ ] Can you answer: "Where is authorization enforced?"
- [ ] Can you answer: "Where is job state changed?"
- [ ] Can you answer: "Where does each dashboard get its data?"

If you cannot answer all four from your investigation, that's a finding to document.

REPORT FORMAT:
Output the /docs/FIXIFY_RUNTIME_TRUTH.md file with clear sections.
Include screenshot URLs for visual verification.
End with a "QUESTIONS" section listing uncertainties.
```

### Step 0.2: Post-Discovery Review

After Kiro completes Phase 0, review verbally in chat:

1. **Ask Kiro to explain:** The four key findings:
   - "Where does authentication happen?" ✅
   - "Where is authorization enforced?" ✅
   - "Where is job state changed?" ✅
   - "Where does each dashboard get its data?" ✅

2. **Check screenshots** from Kiro's report (should be at least 5 captured)

3. **Note any uncertainties** — Kiro will mention in summary

### Step 0.3: Commit Baseline

```bash
cd /Users/brian_kimario/Downloads/fixify
git add docs/baselines/
git commit -m "Phase 0: Baseline discovery complete

- Auth architecture: [brief description]
- Routes: [brief status]
- Data ownership: [brief summary]
- State machine location identified
- Screenshots captured"
```

---

## Part 3: Phase 1 — Authentication & Session Hardening (3–5 hours)

**Goal:** Prove authentication, logout, and RBAC work correctly.

### Step 1.1: Authentication Verification Prompt

```
TASK: Phase 1 — Authentication, Logout & RBAC Hardening
CONTEXT: Phase 0 complete. Reference /docs/FIXIFY_RUNTIME_TRUTH.md

You have discovered the auth architecture. Now implement and verify it works.

PHASE GOALS:
- No cross-role access (customer ≠ professional ≠ admin)
- Logout invalidates session completely
- Cookies secure (HttpOnly, Secure, SameSite)
- Browser back-button after logout cannot restore protected state

IMPLEMENTATION CHECKLIST:

1. MIDDLEWARE / ROUTE PROTECTION
   [ ] Verify /customer, /professional, /admin protected by middleware
   [ ] Confirm unauthenticated redirect happens
   [ ] Use Playwright to test: unauthenticated access to /customer → redirects to /auth/login

2. LOGOUT IMPLEMENTATION
   [ ] Does logout exist on every dashboard? (check UI)
   [ ] Backend: is logout calling Supabase signOut()?
   [ ] Does logout clear cookies?
   [ ] Does logout clear client-side auth state?
   [ ] Does logout redirect to public page?

3. VERIFY LOGOUT (Use Playwright)
   - [ ] Test: Login (valid customer) → /customer loads → Click "Sign Out"
   - [ ] After logout: protected fetch should return 401
   - [ ] After logout: direct /customer URL should redirect to login
   - [ ] Back button after logout: no usable protected data

4. VERIFY COOKIES
   [ ] Use Chrome DevTools to inspect cookies
   [ ] Check: HttpOnly flag set? Secure flag set? SameSite=Lax or Strict?

5. CROSS-ROLE ACCESS TESTS (Critical)
   [ ] Customer account → try /admin → should DENY
   [ ] Customer account → try /professional → should DENY
   [ ] Professional account → try /admin → should DENY
   [ ] Professional account → try /customer → should DENY
   [ ] Admin account → try /customer → should DENY (if intended)

TESTING SEQUENCE:
Use Playwright MCP to automate these tests:

const playwright = require('@playwright/test');

// Test 1: Customer login succeeds
test('Customer login succeeds', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/auth/login');
  await page.fill('input[name="email"]', 'customer@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button:has-text("Sign In")');
  await page.waitForNavigation();
  expect(page.url()).toContain('/customer');
});

// Test 2: Customer cannot access /admin
test('Customer cannot access /admin', async ({ browser }) => {
  // ... login as customer ...
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  // Should redirect to /customer or /auth/login
  expect(page.url()).not.toContain('/admin');
});

// Test 3: Logout invalidates session
test('Logout invalidates session', async ({ browser }) => {
  // ... login as customer ...
  // ... click logout ...
  await page.click('button:has-text("Sign Out")');
  await page.waitForNavigation();
  // Try to access protected route
  await page.goto('http://localhost:3000/customer');
  // Should redirect to login, not load dashboard
  expect(page.url()).toContain('/auth');
});

OUTPUT:
Create /docs/phase-outputs/phase1-auth-results.md with:
- [ ] Test results (pass/fail for each test above)
- [ ] Cookie flags verified (screenshot from DevTools)
- [ ] Cross-role access test results
- [ ] Any failures identified
- [ ] Fixes applied to pass failing tests

REPORT: Summarize findings verbally in chat
AFTER TESTS PASS:
- [ ] Commit changes: git commit -m "Phase 1: Auth, logout, RBAC verified"
- [ ] Do NOT proceed to Phase 2 until ALL tests pass
```

### Step 1.2: Run Phase 1 Tests

In Kiro chat, paste the prompt above. Kiro will:
1. Investigate current auth setup
2. Use Playwright to create and run test scenarios
3. Use Chrome DevTools to inspect cookies
4. Report pass/fail for each test
5. Fix failures if found

### Step 1.3: Manual Verification (Optional but Recommended)

Even though Kiro runs automated tests, manually verify once:

```bash
# Terminal 1: Start dev server
cd /Users/brian_kimario/Downloads/fixify
pnpm dev

# Terminal 2: In another terminal, open browser manually
# Go to http://localhost:3000
# Login as customer
# Verify /customer loads
# Click "Sign Out"
# Try back button
# Try direct URL /customer
# Expect: all denied or redirected
```

### Step 1.4: Commit Results

After Kiro completes and tests pass:

```bash
git add .
git commit -m "Phase 1: Auth, logout, RBAC verified

- Customer/professional/admin login verified
- Cross-role access denied
- Logout invalidates session
- Back-button after logout secure
- Cookie flags verified"
```

---

## Part 4: Phase 2 — RLS & Data Ownership (4–8 hours)

**Goal:** Database-layer security is proven.

### Step 2.1: RLS Implementation Prompt

```
TASK: Phase 2 — RLS & Data Ownership Enforcement
CONTEXT: Phase 1 complete. Auth/logout verified.

CRITICAL BEFORE STARTING:
- Read /docs/FIXIFY_RUNTIME_TRUTH.md Section 4 (DATA OWNERSHIP MATRIX)
- You now know which tables need RLS and who owns them
- Build RLS incrementally, testing each table

IMPLEMENTATION ORDER (by criticality):

1. CUSTOMERS TABLE
   - Current RLS (if any): [describe from Phase 0 findings]
   - Desired: customers can read/update only own row
   - SQL:
     CREATE POLICY "customers_read_own" ON auth.users
     FOR SELECT USING (auth.uid() = id);

2. PROPERTIES TABLE
   - Desired: customer can read/update only owned properties
   - Owned by: customer_id column
   - SQL:
     CREATE POLICY "customer_read_own_properties" ON properties
     FOR SELECT USING (auth.uid() = customer_id);
     
     CREATE POLICY "customer_update_own_properties" ON properties
     FOR UPDATE USING (auth.uid() = customer_id);

3. REQUESTS / JOBS TABLE
   - Desired: customer reads own jobs, professional reads assigned jobs
   - Owned by: customer_id, professional_id columns
   - Implement policies for both roles

4. QUOTES TABLE
   - Desired: customer reads own job's quotes, professional reads assigned quotes
   - Implement read policies

5. MEDIA / EVIDENCE TABLE
   - Desired: restricted to owner and authorized participants
   - Most restrictive: storage-level access control

IMPLEMENTATION:
1. For each table, implement RLS policies
2. Test NEGATIVE cases (unauthorized access is denied)

TESTING (use Supabase MCP):
For each table and policy:

Test: Customer A reads Customer B property
- Expected: DENIED
- Actual: [run SQL query as customer A, try to SELECT * FROM properties WHERE customer_id = B]

Test: Professional reads unassigned job
- Expected: DENIED
- Actual: [run SQL query, verify DENIED]

Test: Admin reads any record (if admin role exists)
- Expected: ALLOWED (with restrictions)
- Actual: [verify allowed]

VERIFICATION:
Create /docs/phase-outputs/phase2-rls-results.md with:
- RLS policies implemented (one section per table)
- Test results: pass/fail for each negative test
- Any policies that failed, fixed, and re-tested
- SQL queries used for testing (for future reference)

REPORT: Summarize findings verbally in chat
AFTER TESTS PASS:
- [ ] Apply RLS policies to production (via Supabase migrations)
- [ ] Commit: git commit -m "Phase 2: RLS policies implemented and tested"
```

### Step 2.2: Data Ownership Matrix Template

Before running Phase 2, create a reference file:

```bash
cat > /Users/brian_kimario/Downloads/fixify/docs/DATA_OWNERSHIP_REFERENCE.md << 'EOF'
# Data Ownership Reference

| Table | Owner | Read | Write | Delete | Notes |
|-------|-------|------|-------|--------|-------|
| users | user | self | self | admin | auth.users or custom users table |
| properties | customer | owner + (prof during job) | owner | owner | linked by customer_id |
| requests | customer + job system | customer + prof (if assigned) + admin | backend only | backend | immutable after creation |
| jobs | job workflow | customer + prof (if assigned) + admin | backend transition_job_state | backend | state machine controlled |
| quotes | professional | prof (draft) + customer (for approval) + admin | prof (draft) + backend (approved) | backend | version controlled |
| media | uploader | uploader + relevant participants | uploader | uploader | storage-level access |
| job_events | system | relevant users + admin | system | admin audit only | immutable audit log |

EOF
```

---

## Part 5: Phase 3 — State Machine Enforcement (4–8 hours)

**Goal:** Job state cannot be changed by arbitrary client-side mutations.

### Step 3.1: State Machine Audit Prompt

```
TASK: Phase 3 — State Machine Enforcement
CONTEXT: Phases 1–2 complete. Auth and RLS verified.

GOAL: No job state can be changed except through transition_job_state() with proper authorization.

AUDIT STEP 1: Inventory all state mutations
Search your codebase for EVERY place that changes job status:

Patterns to search for:
- .update({ status: ... })
- .patch({ status: ... })
- setStatus(...)
- job.status = ...
- transition_job_state (the SAFE one)
- Any server action with "job" and "update"
- Any RPC with "status" parameter

For each location, categorize:
SAFE: calls transition_job_state() or equivalent validated function
UNSAFE: direct table update, client-side state, hardcoded values

Output: /docs/phase-outputs/phase3-mutation-audit.md
- [ ] Total mutations found: N
- [ ] Safe mutations: N
- [ ] Unsafe mutations: N (these need fixing)

AUDIT STEP 2: Define valid state transitions
From SYSTEM_AUDIT.md, job states and allowed transitions:

Allowed:
REQUESTED → ACCEPTED (professional accepts)
ACCEPTED → INSPECTION (professional starts inspection)
INSPECTION → QUOTE_PENDING (professional submits findings)
QUOTE_PENDING → APPROVED (customer approves quote)
QUOTE_PENDING → DECLINED (customer rejects quote)
APPROVED → IN_PROGRESS (professional starts work)
IN_PROGRESS → COMPLETED (professional submits completion evidence)
DECLINED → INSPECTION (if customer requests clarification)

Disallowed (these MUST FAIL):
REQUESTED → COMPLETED (skip all intermediate states)
APPROVED → REQUESTED (backward transition)
COMPLETED → ANYTHING (terminal state)

IMPLEMENTATION:
For each UNSAFE mutation found:

1. Trace where it's called (backend + frontend)
2. Replace with server action/RPC calling transition_job_state()
3. Verify authorization in server action (is user permitted?)
4. Verify state validation (is current state allowed?)
5. Create audit event on transition

Example fix:

// UNSAFE (before):
await supabase
  .from('jobs')
  .update({ status: 'completed' })
  .eq('id', jobId);

// SAFE (after):
// Server action:
async function completeJob(jobId, completionEvidence) {
  // 1. Authenticate
  const { user } = await getSession();
  if (!user) throw new Error('Unauthorized');
  
  // 2. Verify ownership
  const { data: job } = await supabase
    .from('jobs')
    .select('professional_id, status')
    .eq('id', jobId)
    .single();
  
  if (job.professional_id !== user.id) {
    throw new Error('Not authorized to complete this job');
  }
  
  // 3. Call state machine
  const result = await transition_job_state(
    jobId,
    job.status,
    'COMPLETED',
    { evidence: completionEvidence },
    user.id
  );
  
  // 4. Audit event created inside transition_job_state
  return result;
}

TESTING:
For each fixed mutation, test INVALID transitions fail:

Test: Try REQUESTED → COMPLETED
- Expected: DENIED
- Actual: [run test, verify DENIED]

Test: Try to complete job that's not IN_PROGRESS
- Expected: DENIED
- Actual: [verify]

Output: /docs/phase-outputs/phase3-state-machine-results.md
- [ ] All unsafe mutations replaced with authoritative calls
- [ ] Invalid transition tests pass (all return error)
- [ ] Valid transitions work (state changes correctly)
- [ ] Audit events created for each transition

REPORT: Summarize findings verbally in chat
AFTER TESTS PASS:
- [ ] Commit: git commit -m "Phase 3: State machine enforcement complete"
```

---

## Part 6: Phase 4 — Customer Dashboard Real Data Binding (4–8 hours)

**Goal:** Customer dashboard shows real data, not mocks.

### Step 4.1: Customer Dashboard Binding Prompt

```
TASK: Phase 4 — Bind Customer Dashboard to Real Data
CONTEXT: Phases 1–3 complete. Auth, RLS, state machine verified.

GOAL: /customer dashboard fetches real customer data and displays it truthfully.

CURRENT STATE:
Check: Is /customer currently showing mock data or real data?
- Look at /src/app/customer/page.tsx
- Search for hardcoded arrays, lorem ipsum, or static states
- Look for data fetches (server action, getServerSideProps, etc.)

IF MOCK DATA EXISTS:
- Replace with actual data fetches
- Verify data ownership (customer can only see own data)

IMPLEMENTATION CHECKLIST:

1. CREATE SERVER ACTIONS (in /src/app/customer/actions.ts or similar)
   [ ] fetchCustomerProperties() - with ownership check
   [ ] fetchCustomerJobs() - with ownership verification
   [ ] fetchJobDetails(jobId) - with authorization
   [ ] fetchQuote(quoteId) - with authorization

2. COMPONENTS TO BUILD / REFACTOR
   [ ] CustomerDashboard - main page component
   [ ] PropertyList - list of customer's properties
   [ ] JobCard - display single job with state, professional, timeline
   [ ] LoadingState - skeleton while fetching
   [ ] EmptyState - "No active repairs" when customer has no jobs
   [ ] ErrorState - error message with retry

3. INFORMATION ARCHITECTURE
   Dashboard layout:
   - [ ] What needs your attention (primary action if any)
   - [ ] Start a repair (CTA)
   - [ ] Active jobs (current state, next action)
   - [ ] Your properties (recent activity)
   - [ ] Maintenance history (past jobs)

4. STATES TO HANDLE
   For each section:
   - [ ] Loading (skeleton)
   - [ ] Loaded with data
   - [ ] Empty (no data)
   - [ ] Error (with retry)

5. VISUAL VERIFICATION (Use Playwright + Chrome DevTools)
   [ ] Capture baseline screenshot: /docs/baselines/customer-dashboard-phase4.png
   [ ] Render /customer at 1440x900, 1280x800, 1024x768, 768x1024, 390x844
   [ ] Use Chrome DevTools: inspect spacing, typography, colors
   [ ] Identify top 3 visual defects (hierarchy, spacing, composition)
   [ ] Fix those defects
   [ ] Capture final screenshot: /docs/screenshots/customer-dashboard-phase4-final.png
   [ ] Compare before/after

TESTING:
[ ] Fetch as customer A, verify shows only customer A's data
[ ] Fetch as customer B, verify does NOT see customer A's data
[ ] Try to fetch with invalid customer ID → DENIED
[ ] Test all 5 states (loading, loaded, empty, error, retry)

DESIGN CONSTRAINTS:
✓ Use Fixify design tokens (Porcelain, Paper, Ink, Teal, Clay)
✓ Make hierarchy clear (what should I do now?)
✓ No fake KPI cards or generic metrics
✓ Real imagery where appropriate
✓ Responsive and intentional on mobile

OUTPUT:
Create /docs/phase-outputs/phase4-customer-dashboard-results.md with:
- [ ] Components implemented (list each)
- [ ] Data sources implemented (each server action)
- [ ] Screenshots: baseline, final
- [ ] Visual improvements made (top 3 defects fixed)
- [ ] Test results (pass/fail)
- [ ] Any data issues found and fixed

REPORT: Summarize findings verbally in chat
AFTER TESTS PASS:
- [ ] Commit: git commit -m "Phase 4: Customer dashboard real data binding complete"
```

---

## Part 7: General Workflow — How to Run Each Phase

### Pattern for Every Phase Prompt

**Structure your Kiro prompts like this:**

```
TASK: [Phase N] — [Goal]
CONTEXT: [Previous phases complete. Reference files.]

GOALS: [What must be true when done]

IMPLEMENTATION CHECKLIST:
[ ] Step 1
[ ] Step 2
[ ] Step 3

TESTING:
- Test 1: [expected outcome]
- Test 2: [expected outcome]

VISUAL VERIFICATION (if UI phase):
- Baseline screenshot at [viewports]
- Identify top 3 defects
- Fix and compare

OUTPUT:
Create  with:
- [ ] All checklist items completed
- [ ] Test results (pass/fail)
- [ ] Screenshots if applicable
- [ ] Any issues found

REPORT: Summarize findings verbally in chat
AFTER TESTS PASS:
- [ ] Commit: git commit -m "Phase N: [Goal] complete"
```

### Why This Pattern Works

1. **Clear context** — Kiro knows what's already done
2. **Explicit checklist** — Kiro tracks progress methodically
3. **Testing first** — Failures are caught early
4. **Visual verification** — UI work is proven, not assumed
5. **Documentation** — Results are captured for your review

---

## Part 8: Running Phases in Sequence

### Timeline Overview

| Phase | Duration | Status | Blocker |
|-------|----------|--------|---------|
| 0 | 2–4h | Discover | None |
| 1 | 3–5h | Auth verified | Phase 0 done |
| 2 | 4–8h | RLS verified | Phase 1 done |
| 3 | 4–8h | State machine | Phase 2 done |
| 4 | 4–8h | Customer UI | Phase 3 done |
| 5 | 4–8h | Professional UI | Phase 4 done |
| 6 | 4–8h | Admin UI | Phase 5 done |
| 7 | 3–6h | Design system | Phase 6 done |
| 8 | 2–4h | Error states | Phase 7 done |
| 9 | 3–5h | Responsive QA | Phase 8 done |
| 10 | 2–5h | Visual polish | Phase 9 done |

### Recommended Weekly Schedule

**Week 1:**
- Phase 0 (Tue–Wed): Discovery
- Phase 1 (Thu–Fri): Auth + logout

**Week 2:**
- Phase 2 (Mon–Wed): RLS
- Phase 3 (Thu–Fri): State machine

**Week 3:**
- Phase 4 (Mon–Wed): Customer UI
- Phase 5 (Thu–Fri): Professional UI

**Week 4:**
- Phase 6 (Mon–Tue): Admin UI
- Phase 7 (Wed–Thu): Design system
- Phase 8 (Fri): Error states

**Week 5:**
- Phase 9 (Mon–Tue): Responsive QA
- Phase 10 (Wed–Thu): Visual polish
- Final review + Release prep (Fri)

---

## Part 9: Useful Kiro Prompting Tips

### Tip 1: Provide File Paths Explicitly

```
✓ GOOD:
Check authentication in /src/app/api/auth/route.ts

✗ VAGUE:
Check authentication
```

### Tip 2: Use Code Context Keys

```
✓ GOOD:
Reference #File:/src/app/customer/page.tsx to understand current customer dashboard

✗ VAGUE:
Look at the customer dashboard
```

### Tip 3: Ask for Specific Output Formats

```
✓ GOOD:
Output results as a markdown table with columns: Component, Status, Test Result

✗ VAGUE:
Tell me the results
```

### Tip 4: Test Before Claiming Done

```
✓ GOOD:
After implementation, run: pnpm build && pnpm test:run
Capture exit code. If non-zero, fix before reporting.

✗ VAGUE:
Build should work
```

### Tip 5: Use MCPs Explicitly

```
✓ GOOD:
Use Playwright MCP to:
1. Navigate to /customer
2. Take screenshot at 1440×900
3. Save as /docs/screenshots/customer-phase4.png

✗ VAGUE:
Take a screenshot
```

---

## Part 10: Handling Failures in Phases

### When a Test Fails

**Don't ask Kiro to "fix it" vaguely.**

Instead:

```
PHASE 1 TEST FAILURE

Test: Logout invalidates session
Expected: Protected fetch returns 401
Actual: Protected fetch returns 200 (unauthorized access succeeded)

ROOT CAUSE ANALYSIS:
1. Check: Is logout calling Supabase.auth.signOut()?
2. Check: Are cookies being cleared?
3. Check: Is middleware checking for valid session?
4. If logout is not calling signOut, that's the bug.

FIX:
In /src/app/customer/actions.ts, update logout action:
- Verify it calls supabase.auth.signOut()
- Verify it returns redirect to /auth/login

RE-TEST:
After fix, re-run the same test. Expected result: 401 for protected fetch.
Report: Test now passes / still fails
```

### When a Visual Defect is Identified

```
VISUAL DEFECT

Issue: Job card padding is inconsistent (12px top, 16px bottom)
Expected: Even spacing (16px all sides)
Fix: In JobCard component, update padding from p-3 to p-4

VERIFY:
1. Render /customer
2. Use Chrome DevTools Inspector to measure job card padding
3. Take screenshot
4. Confirm: all sides = 16px

Result: Fixed / still defective
```

---

## Part 11: Commands Reference

### Start Development Server

```bash
cd /Users/brian_kimario/Downloads/fixify
pnpm dev
# Opens http://localhost:3000
```

### Run Tests

```bash
pnpm test:run  # Run all tests once
pnpm lint      # Check code quality
pnpm build     # Build production
```

### View Screenshots

```bash
# MCPs store screenshots in various locations
# After Playwright tests, check:
ls -la /Users/brian_kimario/Downloads/fixify/docs/screenshots/
ls -la /Users/brian_kimario/Downloads/fixify/docs/baselines/
```

### Commit Progress

```bash
git add .
git commit -m "Phase N: [What was done]"
git push origin main  # Optional: push to remote
```

---

## Part 12: Example Phase 0 Execution

Here's a **real example** of how to run Phase 0:

### Your Prompt to Kiro

```
TASK: Phase 0 — Establish Baseline Truth
PROJECT: Fixify at /Users/brian_kimario/Downloads/fixify
AUDIT: /Users/brian_kimario/Downloads/fixify/docs/SYSTEM_AUDIT.md

Create /docs/FIXIFY_RUNTIME_TRUTH.md with:

1. AUTH ARCHITECTURE
   - Where is Supabase Auth setup?
   - How are sessions retrieved?
   - Where are roles stored?

2. ROUTE MATRIX
   - List all routes and their protection status

3. DATA OWNERSHIP
   - For each table: who owns rows?

4. BUILD STATUS
   - Run: pnpm build
   - Run: pnpm lint
   - Capture output

5. SCREENSHOTS
   - Use Playwright: screenshot / (homepage)
   - Screenshot /auth/login
   - Save to /docs/baselines/

After investigation, output to /docs/FIXIFY_RUNTIME_TRUTH.md

Required final check:
- [ ] Can you answer: "Where does authentication happen?"
- [ ] Can you answer: "Where is job state changed?"
- [ ] Are screenshots saved?
```

### Kiro Response (Expected)

Kiro will:
1. Read your codebase
2. Find auth setup (likely in supabase/client.ts or similar)
3. Check middleware (likely in /src/middleware.ts)
4. Find routes and their protection
5. Use Playwright to capture screenshots
6. Create comprehensive `/docs/FIXIFY_RUNTIME_TRUTH.md`

### Your Next Step

1. **Open** `/docs/FIXIFY_RUNTIME_TRUTH.md` — read it
2. **Check** `/docs/baselines/*.png` — do they render correctly?
3. **Review** the "QUESTIONS" section — note any uncertainties
4. **Commit** with: `git commit -m "Phase 0: Baseline discovery"`
5. **Proceed** to Phase 1 using the same pattern

---

## Part 13: Key Success Metrics

For each phase to be considered **DONE**:

- ✅ **Deliverable created** (output file exists)
- ✅ **Tests defined** (clear pass/fail criteria)
- ✅ **Tests passing** (all critical tests pass)
- ✅ **Screenshots captured** (before/after if UI work)
- ✅ **Issues documented** (findings recorded)
- ✅ **Committed to git** (changes saved)
- ✅ **No regressions** (Phase N doesn't break Phase N-1)

---

## Part 14: Getting Help Mid-Phase

If Kiro gets stuck:

```
UNBLOCK REQUEST

Context: Phase N in progress
Issue: [Describe what's not working]
Expected: [What should happen]
Actual: [What's happening instead]

Options to fix:
A) Change approach to [alternative method]
B) Skip this subtask and continue with [next task]
C) Investigate [specific file/function] in more detail

Which would you recommend?
```

---

## Conclusion

**To get the best out of Kiro CLI for SYSTEM_AUDIT.md:**

1. **Use structured prompts** — give Kiro all context upfront
2. **Test every phase** — don't claim done without verification
3. **Capture screenshots** — prove visual work, don't assume
4. **Commit incrementally** — phase-by-phase, not all at once
5. **Document findings** — output files in `/docs/phase-outputs/`
6. **Follow dependencies** — phases build on each other
7. **Use MCPs explicitly** — Playwright, Chrome DevTools, Shadcn
8. **Review before proceeding** — read Kiro's output, verify it matches your goals

**Estimated total time:** 4–5 weeks working full-time with Kiro
**Output quality:** Production-ready when all phases complete and release gate passes

Good luck! 🚀
