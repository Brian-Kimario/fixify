# FIXIFY_RUNTIME_TRUTH.md

**Phase 0 — Baseline Discovery**
Generated: 2026-10-04 | Node v26.8.1 | pnpm v12.5.1

---

## Four Verification Questions

| Question | Answer | Confidence |
|---|---|---|
| Where does authentication happen? | `src/middleware.ts` via `supabase.auth.getUser()` on every request + layout-level guard in each dashboard | HIGH |
| Where is authorization enforced? | `src/middleware.ts` (primary) + layout components (secondary belt-and-suspenders) | HIGH |
| Where is job state changed? | `supabase.rpc('transition_job_state', …)` in `src/lib/services/jobs.ts` (SAFE) + 3 UNSAFE direct `.update()` calls (see Section 5) | HIGH |
| Where does each dashboard get its data? | All dashboards call `createClient()` (server Supabase SSR client) with RLS-scoped queries in their `page.tsx` Server Components | HIGH |

---

## 1. AUTH ARCHITECTURE

### Supabase Setup

- **Package**: `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`)
- **Client creation pattern**:
  - `src/lib/supabase/server.ts` — `createServerClient()` using `cookies()` from `next/headers` (server components, route handlers, server actions)
  - `src/lib/supabase/client.ts` — `createBrowserClient()` for client components
  - `src/lib/supabase/admin.ts` — service-role client for admin operations (bypasses RLS intentionally)
  - `src/lib/supabase/middleware.ts` — `updateSession()` helper for token refresh (secondary, not used by main middleware)

### Session Retrieval

The main middleware (`src/middleware.ts`) uses:

```ts
const { data: { user } } = await supabase.auth.getUser();
```

This is the **secure** method — it verifies the token with Supabase's auth server on every request, preventing stale-session exploits. The deprecated `getSession()` (which trusts the JWT without server validation) is NOT used in the primary auth path.

`src/lib/supabase/middleware.ts` still calls `supabase.auth.getSession()` in its `updateSession()` helper, but that helper is **not called** from `src/middleware.ts` — it is a vestigial utility.

### Role Storage and Resolution

Roles are **NOT stored in the Supabase JWT**. They are stored in the database:

```sql
-- src/supabase/migrations/001_create_auth_tables.sql
CREATE TYPE public.user_role AS ENUM ('customer', 'professional', 'admin', 'support');

CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id),
  role public.user_role NOT NULL DEFAULT 'customer',
  ...
);
```

Role resolution flow per request:
1. Middleware calls `supabase.auth.getUser()` → gets User object
2. Middleware calls `fetchUserRole(userId)` → queries `profiles.role` from DB
3. Role string is used to enforce routing; also set on response header `x-user-role`

### Where Role Is Resolved

| Location | Method | Note |
|---|---|---|
| `src/middleware.ts:fetchUserRole()` | DB query on every protected request | Primary enforcement |
| `src/app/customer/layout.tsx` | `supabase.from('profiles').select('role')` | Secondary guard |
| `src/app/professional/layout.tsx` | `getCurrentProfile()` from `@/lib/auth` | Secondary guard |
| `src/app/admin/layout.tsx` | `supabase.from('profiles').select('role')` | Secondary guard |

### Middleware Behavior Summary

```
src/middleware.ts
├── Matcher: all routes except _next/static, _next/image, favicon, static assets
├── Creates supabase client via createServerClient() with cookie passthrough
├── Calls supabase.auth.getUser() for every request
│
├── /auth/logout → bypass (pass through)
│
├── /auth/login OR /auth/register + user logged in → redirect to role dashboard
│
├── Protected route + NOT logged in → redirect to /auth/login?role=X&next=PATH
│
├── Protected route + logged in:
│   ├── /customer: role must be 'customer' or redirect
│   ├── /professional:
│   │   ├── role must be 'professional' or redirect
│   │   └── verification_status ≠ 'verified' → redirect to /professional/onboarding
│   ├── /admin: role must be 'admin' or redirect
│   └── /support: role must be 'support' or redirect
│
├── Security headers applied on all responses (X-Frame-Options, CSP, HSTS, etc.)
└── Cache-Control: no-store on protected routes, auth routes, /api/*
```

---

## 2. ROUTE MATRIX

Legend: `○` = Static (pre-rendered) | `ƒ` = Dynamic (server-rendered) | 🔒 = Middleware-enforced auth

### Public Routes

| Route | Type | Notes |
|---|---|---|
| `/` | ƒ | Homepage / marketing landing |
| `/help` | ○ | Help centre, FAQ |
| `/contact` | ○ | Contact form (marketing group) |
| `/demo-contact` | ○ | Demo contact page |
| `/support` | ƒ | Support intake (role: support user or public) |
| `/auth/login` | ○ | Login page |
| `/auth/register` | ○ | Customer registration |
| `/auth/register/professional` | ○ | Professional registration |
| `/auth/forgot-password` | ○ | Password reset request |
| `/auth/verify-email` | ○ | Email verification landing |
| `/auth/callback` | ƒ | Supabase OAuth callback |
| `/auth/debug` | ○ | Debug/test login page |
| `/auth/test-login` | ○ | Test login shortcut |

### Customer Routes 🔒

All require `role = 'customer'`. Protected by middleware + layout guard.

| Route | Type | Data Source |
|---|---|---|
| `/customer` | ƒ | `jobs`, `properties`, `quotes` (RLS-scoped) |
| `/customer/bookings/new` | ƒ | `services`, `properties` |
| `/customer/bookings/[id]` | ƒ | `bookings`, `jobs`, `payments` |
| `/customer/properties` | ƒ | `properties`, `addresses` |
| `/customer/profile` | ƒ | `profiles` |
| `/customer/profile/edit` | ƒ | `profiles` |
| `/customer/settings` | ƒ | `profiles` |
| `/customer/support` | ƒ | `support_tickets` (if exists) |
| `/customer/payments/result/[paymentId]` | ƒ | `payments` |

### Professional Routes 🔒

All require `role = 'professional'` AND `verification_status = 'verified'` (except `/professional/onboarding`).

| Route | Type | Data Source | Notes |
|---|---|---|---|
| `/professional` | ƒ | `jobs`, `professional_profiles` | Today/workspace view |
| `/professional/jobs` | ƒ | `jobs` | Job queue |
| `/professional/jobs/[id]` | ƒ | `jobs`, `quotes`, `inspections` | Job detail |
| `/professional/bids` | ƒ | **MOCK DATA** | Hardcoded `mockBids` array, no DB |
| `/professional/earnings` | ƒ | `payments` | Earnings summary |
| `/professional/profile` | ƒ | `professional_profiles`, `profiles` | Profile view |
| `/professional/profile/edit` | ƒ | `professional_profiles` | Profile edit (TODO: API not wired) |
| `/professional/onboarding` | ƒ | `professional_profiles` | Accessible before verification |

### Admin Routes 🔒

All require `role = 'admin'`.

| Route | Type | Data Source |
|---|---|---|
| `/admin` | ƒ | `jobs`, `payments`, `professional_profiles` (service-role client) |
| `/admin/jobs` | ƒ | `jobs` (admin view) |
| `/admin/professionals` | ƒ | `professional_profiles` (verification queue) |
| `/admin/customers` | ƒ | `profiles` (customer list) |

### API Routes

| Route | Auth | Notes |
|---|---|---|
| `/api/admin/audit-logs` | Admin only | Reads `audit_logs` |
| `/api/admin/users` | Admin only | User list |
| `/api/admin/users/[id]/role` | Admin only | Role change endpoint |
| `/api/auth/test` | None | Auth test helper |
| `/api/csrf-token` | None | CSRF token endpoint |
| `/api/webhooks/razorpay` | Webhook signature | Razorpay payment webhooks |

---

## 3. ROLE MATRIX

### Role Values

```sql
CREATE TYPE public.user_role AS ENUM ('customer', 'professional', 'admin', 'support');
```

| Role | Dashboard | Registration Path | Notes |
|---|---|---|---|
| `customer` | `/customer` | `/auth/register` | Default on sign-up (via `handle_new_user()` trigger) |
| `professional` | `/professional` | `/auth/register/professional` | Requires verification before full access |
| `admin` | `/admin` | DB only (no self-registration) | Set manually in DB |
| `support` | `/support` | DB only | Set manually in DB |

### Role Resolution Trigger

1. A new user signs up → Supabase `auth.users` trigger `on_auth_user_created` fires → `handle_new_user()` inserts into `profiles` with `role = 'customer'`
2. Professional registration calls an admin client that upserts the profile with `role = 'professional'`
3. On every HTTP request, middleware queries `profiles.role` via `fetchUserRole(userId)`
4. Roles are **never elevated from the client**; the RLS policy `"Role cannot be changed by user"` blocks self-elevation via anon client

---

## 4. DATA OWNERSHIP MODEL

### Table Summary

| Table | Owner Column | RLS | Notes |
|---|---|---|---|
| `profiles` | `id = auth.uid()` | ✅ Enabled | Users read/update own; admins read all |
| `audit_logs` | `user_id` | ✅ Enabled | Users read own; admins read all |
| `addresses` | `customer_id` | ✅ Enabled | Full CRUD own only |
| `properties` | `owner_customer_id` | ✅ Enabled | Full CRUD own only |
| `property_assets` | via `properties.owner_customer_id` | ✅ Enabled | Indirect ownership via property |
| `service_categories` | N/A (public catalogue) | ✅ Enabled | SELECT for all (public) |
| `services` | N/A (public catalogue) | ✅ Enabled | SELECT for all (public) |
| `service_requests` | `customer_id` | ✅ Enabled | Full CRUD own only |
| `bookings` | `customer_id` / `professional_id` | ✅ Enabled | Both parties can SELECT; customer INSERTs |
| `jobs` | `customer_id` / `professional_id` | ✅ Enabled | Both parties can SELECT/UPDATE |
| `job_events` | via `jobs` | ✅ Enabled | Both parties can SELECT (immutable log, no UPDATE/DELETE policy) |
| `inspections` | `professional_id` | ✅ Enabled | Professional INSERTs; both parties SELECT |
| `quotes` | `professional_id` | ✅ Enabled | Professional creates; both parties SELECT; customer-side update via separate policy |
| `quote_items` | via `quotes.professional_id` | ✅ Enabled | Professional INSERT; both parties SELECT |
| `payments` | `customer_id` | ✅ Enabled | Customer SELECTs own; admin/support see all |
| `professional_profiles` | `user_id` | ✅ Enabled | Professional owns own; verified profiles public-readable |

### RLS Status: ALL tables have RLS enabled. No table is unprotected.

### Ownership Pattern

- **Customer data**: `customer_id = auth.uid()` (direct)
- **Professional data**: `professional_id = auth.uid()` or `user_id = auth.uid()` (direct)
- **Shared data** (jobs, bookings): `customer_id = auth.uid() OR professional_id = auth.uid()`
- **Public catalogue**: `USING (true)` on SELECT, no INSERT/UPDATE/DELETE for anon
- **Admin access**: Uses service-role client (`src/lib/supabase/admin.ts`) to bypass RLS for admin dashboards

---

## 5. STATE TRANSITION MATRIX

### Job States

```
assigned → accepted → on_the_way → arrived → in_progress ─┬─→ completed → closed
                                                            │
                                               quote_pending → in_progress (approved)
                                                            └→ cancelled → closed
```

All states except `closed` can also transition to `cancelled`.

Full allowed transitions from `migration 004`:

| From | To (allowed) |
|---|---|
| `assigned` | `accepted`, `cancelled` |
| `accepted` | `on_the_way`, `cancelled` |
| `on_the_way` | `arrived`, `cancelled` |
| `arrived` | `in_progress`, `cancelled` |
| `in_progress` | `quote_pending`, `completed`, `cancelled` |
| `quote_pending` | `in_progress`, `cancelled` |
| `completed` | `closed` |
| `cancelled` | `closed` |

### transition_job_state() Function

**Location**: `supabase/migrations/004_create_bookings_and_jobs.sql` (lines ~250–310)

```sql
CREATE OR REPLACE FUNCTION public.transition_job_state(
  p_job_id uuid,
  p_new_state text,
  p_actor_user_id uuid,
  p_metadata jsonb DEFAULT '{}'
) RETURNS BOOLEAN
```

**What it does**:
1. Fetches current state with `FOR UPDATE` (row-level lock)
2. Validates the transition against the allowed matrix (raises EXCEPTION if invalid)
3. Updates `jobs.current_state` and appropriate timestamp columns
4. Inserts an immutable record into `job_events`

### All Places That Change Job State

| File | Location | Method | SAFE? |
|---|---|---|---|
| `src/lib/services/jobs.ts` | `updateJobState()` | `supabase.rpc('transition_job_state', …)` | ✅ SAFE |
| `src/app/api/webhooks/razorpay/route.ts` | line ~169 | `supabase.rpc('transition_job_state', …)` | ✅ SAFE |
| `src/app/professional/actions.ts` | `submitQuoteAction()` line 688–690 | `supabase.from('jobs').update({ current_state: 'quote_pending' })` | ⚠️ UNSAFE |
| `src/app/customer/actions.ts` | `respondToQuoteAction()` line 130–132 | `supabase.from('jobs').update({ current_state: newJobState })` | ⚠️ UNSAFE |
| `src/app/customer/actions.ts` | `simulateJobStateAction()` line 166–168 | `supabase.from('jobs').update({ current_state: newState })` | ⚠️ UNSAFE (simulation/demo) |

**Risk of UNSAFE calls**: These bypass the DB-level state machine entirely. They:
- Do not validate whether the transition is allowed
- Do not check actor ownership
- Do not write to `job_events` (partially fixed by inline inserts, but the validation is missing)
- Could set arbitrary states if called with tampered input

---

## 6. SERVER MUTATION INVENTORY

### Customer Actions (`src/app/customer/actions.ts`)

| Action | Table(s) Written | Safe? | Notes |
|---|---|---|---|
| `logoutUser` | `auth.sessions` (via signOut) | ✅ | Clears session |
| `submitProblemIntakeAction` | `service_requests` | ✅ | Validates `user.id`; graceful fallback on error |
| `respondToQuoteAction` | `quotes`, `jobs`, `job_events` | ⚠️ UNSAFE | Direct `.update()` on jobs bypasses state machine |
| `simulateJobStateAction` | `jobs` | ⚠️ UNSAFE | Demo/test function — no validation, no auth check |

### Professional Actions (`src/app/professional/actions.ts`)

| Action | Table(s) Written | Safe? | Notes |
|---|---|---|---|
| `updateJobState` (lib) | `jobs`, `job_events` (via RPC) | ✅ SAFE | Full auth + ownership check + RPC |
| `submitQuoteAction` | `quotes`, `quote_items`, `jobs`, `job_events` | ⚠️ UNSAFE | Jobs update is direct `.update()` not RPC |
| Other pro actions | Various | ✅ | Reads only |

### API Route Mutations

| Route | Table(s) Written | Safe? | Notes |
|---|---|---|---|
| `POST /api/admin/users/[id]/role` | `profiles`, `audit_logs` | ✅ | Requires admin; writes audit log |
| `POST /api/webhooks/razorpay` | `payments`, `jobs` | ✅ SAFE | Verifies webhook signature; uses transition_job_state RPC |

### Auth Actions

| File | Action | Table(s) |
|---|---|---|
| `src/app/auth/actions.ts` | Login, password reset | `auth.users` (via Supabase SDK) |
| `src/app/auth/register/actions.ts` | Customer register | `auth.users`, `profiles` |
| `src/app/auth/register/professional/actions.ts` | Pro register | `auth.users`, `profiles`, `professional_profiles` |
| `src/app/auth/signout-action.ts` | Sign out | `auth.sessions` |

---

## 7. KNOWN MOCKS / DEMO DATA

### Production Pages with Hardcoded Data

| Page | Location | What's Mocked | Risk |
|---|---|---|---|
| `/professional/bids` | `src/app/professional/bids/page.tsx:10` | Entire `mockBids` array (4 hardcoded bids) | HIGH — page ships with fake data; no DB query wired |
| `/customer` dashboard | `src/app/customer/page.tsx:~100` | Fallback property "Oakwood Residence, 1428 Elm Creek Road, Austin TX" when no real properties exist | MEDIUM — shown to new users with no properties |
| `simulateJobStateAction` | `src/app/customer/actions.ts` | Simulation/demo function to manually set any job state | HIGH — no auth guard, demo code in production |

### TODO Comments (Unimplemented)

| File | Line | Issue |
|---|---|---|
| `src/app/professional/profile/edit/EditProfessionalProfileForm.tsx` | 33 | `// TODO: Replace with actual API call` |
| `src/app/professional/jobs/[id]/BidForm.tsx` | 24 | `// TODO: Replace with actual API call to submit bid` |

### Error Handling with Graceful Fallback Masking Real Errors

- `respondToQuoteAction` returns `{ success: true }` on catch — silently hides DB failures
- `submitProblemIntakeAction` returns `{ success: true, requestId: 'client-draft-...' }` on error — UI advances even if DB write failed

---

## 8. BUILD & TEST STATUS

### pnpm build

```
Exit code: 0 (SUCCESS)
Routes: 43 total (24 dynamic ƒ, 13 static ○, 6 API routes)
Output: .next/ directory populated
Compiler: TypeScript validation skipped ("Skipping validation of types")
```

Build passes despite lint errors because TypeScript strict checking is not blocking the build. The `tsconfig.json` does not set `noEmit: true` in a way that would fail the build.

### pnpm lint

```
Exit code: 1 (FAIL)
Total: 323 problems (249 errors, 74 warnings)
Potentially auto-fixable: 2
```

Primary error categories:

| Category | Count (est.) | Rule |
|---|---|---|
| `@ts-ignore` instead of `@ts-expect-error` | ~40 | `@typescript-eslint/ban-ts-comment` |
| `any` type usage | ~180 | `@typescript-eslint/no-explicit-any` |
| `prefer-const` | ~2 | `prefer-const` |
| Other warnings | ~74 | Various |

Most-affected files:
- `src/lib/services/admin.ts` (largest — service-role admin queries with many `any` casts)
- `src/lib/services/verification.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/auth/session.ts`

**Root cause**: Supabase SDK does not have generated database types wired up. Without a `database.types.ts` generated from the schema, all `.from('table_name')` calls return `any`-typed results.

### pnpm test

```
Test runner: Vitest (vitest.config.ts present)
Test files: src/__tests__/*.test.ts(x)
Status: Not run in this phase (pnpm test:run not attempted)
```

Test files found:
- `src/__tests__/middleware.test.ts`
- `src/__tests__/middleware-routing.test.ts`
- `src/__tests__/middleware-preservation.test.ts`
- `src/__tests__/middleware-bug-condition.test.mjs`
- `src/__tests__/customer-dashboard.test.tsx`

---

## 9. SCREENSHOTS

All screenshots taken with Playwright against `http://localhost:3000` (dev server running).

| Page | File | URL at Capture | Notes |
|---|---|---|---|
| Homepage | `docs/baselines/phase0-homepage.png` | `/` | Full marketing page rendered |
| Login | `docs/baselines/phase0-auth-login.png` | `/auth/login` | Standard login form |
| /customer (unauthenticated) | `docs/baselines/phase0-customer-redirect.png` | `/auth/login?role=customer&next=%2Fcustomer` | Middleware correctly redirects to login with `role` and `next` params |
| /professional (unauthenticated) | `docs/baselines/phase0-professional-redirect.png` | `/auth/login?role=professional&next=%2Fprofessional` | Correct RBAC redirect |
| /admin (unauthenticated) | `docs/baselines/phase0-admin-redirect.png` | `/auth/login?role=admin&next=%2Fadmin` | Correct RBAC redirect |

---

## VERIFICATION CHECKLIST

- [x] **"Where does authentication happen?"** — `src/middleware.ts` via `supabase.auth.getUser()` on every request that matches the middleware pattern. Secondary guards also exist in each layout component.
- [x] **"Where is authorization enforced?"** — `src/middleware.ts` (primary). RBAC checks role from DB on every protected request. Layouts add a second layer.
- [x] **"Where is job state changed?"** — Safely via `supabase.rpc('transition_job_state')` in `src/lib/services/jobs.ts` and the Razorpay webhook. Unsafely via direct `.update()` in `customer/actions.ts` (lines 130–168) and `professional/actions.ts` (line 689).
- [x] **"Where does each dashboard get its data?"** — Each dashboard's `page.tsx` is a Next.js Server Component that calls `createClient()` from `@/lib/supabase/server` and performs RLS-scoped queries. No client-side data fetching on initial page load.

---

## QUESTIONS & FINDINGS FOR PHASE 1

### Critical Issues

1. **`simulateJobStateAction` in production** — `src/app/customer/actions.ts` contains a simulation/demo function that sets any job state without validation or auth checks. Should be removed or guarded behind a dev-only environment check.

2. **3 unsafe job state mutations** — `respondToQuoteAction`, `submitQuoteAction`, and `simulateJobStateAction` bypass `transition_job_state()`. These should all call the RPC instead.

3. **`/professional/bids` ships mock data** — The entire bids page renders hardcoded data. No database connection. Counts displayed are from the mock array, not real data.

4. **`respondToQuoteAction` silently swallows errors** — Returns `{ success: true }` even in the catch block. The UI can advance to a "done" state while the database write may have failed.

### Medium Issues

5. **No Supabase generated types** — `database.types.ts` not generated. Every Supabase query returns untyped results, forcing `as any` casts throughout the codebase. This is the root cause of 200+ lint errors.

6. **Fallback property in customer dashboard** — New customers with no properties see "Oakwood Residence, 1428 Elm Creek Road, Austin TX". This fake property ID (`prop-default`) will cause failures if passed to any DB-linked action.

7. **2 TODO: Replace with actual API call** — `EditProfessionalProfileForm.tsx` and `BidForm.tsx` both have unimplemented save logic.

8. **`src/lib/supabase/middleware.ts` uses `getSession()`** — The `updateSession()` helper calls `getSession()` (trusts client JWT, not verified server-side). This helper is currently unused by `src/middleware.ts`, but its existence is a trap.

### Low / Informational

9. **pnpm lint: 323 problems** — None block the build currently. Primarily `@ts-ignore` and `any` type issues. Easily addressed by adding generated database types.

10. **`/auth/debug` and `/auth/test-login` pages** — Test/debug pages are in the production build. They should be removed or gated by environment.

11. **`prefer-const` in middleware** — `src/middleware.ts:33` uses `let response` but never reassigns it. Minor lint error.

12. **Professional verification gate** — Middleware redirects unverified professionals to `/professional/onboarding`. This is correct behavior, but the verification_status check does a second DB round-trip per request for all `/professional` routes.
