# Fixify Route Map & Authentication Flow

**Last Updated:** September 28, 2026  
**Status:** CANONICAL (all routes consolidated, no fragmentation)

---

## Overview

This document defines the canonical route structure, authentication flows, middleware logic, and role-based access control for Fixify. It serves as the source of truth for route organization and is enforced by Next.js middleware.

**Key Principles:**
- One canonical route per destination (no `/login` and `/auth/login` both existing).
- Middleware enforces role-based access control (RBAC) on protected routes.
- Public routes are unauthenticated; protected routes require valid session + role.
- Professional users must pass verification checks to access `/professional` (unverified → `/professional/onboarding`).
- All redirects are validated against user role to prevent open redirects.

---

## Table of Contents

1. [Public Routes](#public-routes)
2. [Authenticated Routes (Role-Based)](#authenticated-routes-role-based)
3. [OAuth Callback & Special Routes](#oauth-callback--special-routes)
4. [Middleware Logic](#middleware-logic)
5. [Session & Cookie Management](#session--cookie-management)
6. [Authorization Flows](#authorization-flows)
7. [Redirect Chains & Examples](#redirect-chains--examples)
8. [Route Consolidation Summary](#route-consolidation-summary)

---

## Public Routes

These routes are accessible without authentication. Unauthenticated users can visit; authenticated users are redirected away (to their role dashboard).

### `/`
- **Type:** Public landing page
- **Handler:** `src/app/(marketing)/page.tsx`
- **Description:** Marketing homepage with hero, value props, CTA buttons
- **Redirect Logic:**
  - If authenticated: Redirect to role dashboard (e.g., `/customer`, `/professional`, `/admin`)
  - If unauthenticated: Show homepage
- **Buttons Link To:**
  - "Sign In" → `/auth/login`
  - "Join as Professional" → `/auth/register/professional`
  - "Get Service" → `/auth/register` (customer)

### `/auth/login`
- **Type:** Email/password login form
- **Handler:** `src/app/(auth)/login/page.tsx`
- **Query Params:**
  - `next` (optional): Redirect after successful login (validated by `validateNextParam()`)
  - `role` (optional): Pre-fill role hint (for middleware redirects)
  - `logged_out` (optional): Show "logged out" message if present
- **OAuth Provider:** Google sign-in button
- **Description:**
  - Email/password form for customers, professionals, and admin
  - Google OAuth button with inline SVG (18px sized)
  - "Forgot password?" link → `/auth/forgot-password`
  - "Create account" link → `/auth/register`

### `/auth/register`
- **Type:** Customer registration form
- **Handler:** `src/app/(auth)/register/page.tsx`
- **Query Params:**
  - `next` (optional): Redirect after signup
- **Form Fields:** Email, password, confirm password
- **OAuth Provider:** Google sign-up button
- **Post-Signup:**
  - Profile created in `profiles` table with `role='customer'`
  - Redirects to `next` (validated) or `/customer`
- **Links:**
  - "Sign in instead" → `/auth/login`
  - "Join as Professional" → `/auth/register/professional`

### `/auth/register/professional`
- **Type:** Professional registration form
- **Handler:** `src/app/(auth)/register/professional/page.tsx`
- **Form Fields:**
  - Email, password, confirm password
  - Services (multi-select from service_categories)
  - Service areas (multi-select or location-based)
  - Verification documents upload (optional)
- **Post-Signup:**
  - Profile created with `role='professional'` and `verification_status='unverified'`
  - Redirects to `/professional/onboarding` (verification step)
- **Links:**
  - "Sign in instead" → `/auth/login`
  - "Join as Customer" → `/auth/register`

### `/auth/forgot-password`
- **Type:** Password reset initiation
- **Handler:** `src/app/(auth)/forgot-password/page.tsx`
- **Form:** Email address
- **Action:** Sends reset link to email (via Supabase Auth)
- **User Flow:**
  - Enter email → Receives reset link in mailbox
  - Reset link is `<APP_URL>/auth/reset-password?token=...`
  - User sets new password; redirected to `/auth/login`

### `/auth/reset-password`
- **Type:** Password reset form
- **Handler:** `src/app/(auth)/reset-password/page.tsx`
- **Query Params:**
  - `token` (required): Reset token from email link
- **Form:** New password, confirm password
- **Post-Reset:** Redirects to `/auth/login`

### `/help`
- **Type:** Public help/FAQ page
- **Handler:** `src/app/(marketing)/help/page.tsx`
- **Description:** FAQs, contact, troubleshooting
- **Links:**
  - "Get Started" → `/auth/register`
  - "Sign In" → `/auth/login`

### `/services`
- **Type:** Public service catalogue (marketing)
- **Handler:** `src/app/(marketing)/services/page.tsx`
- **Description:** Browse available service categories (unauthenticated)

### `/how-it-works`
- **Type:** Public product walkthrough
- **Handler:** `src/app/(marketing)/how-it-works/page.tsx`
- **Description:** 3-step process explanation

### `/professionals`
- **Type:** Public professional community info
- **Handler:** `src/app/(marketing)/professionals/page.tsx`
- **Description:** Benefits for professionals; CTA to join

---

## Authenticated Routes (Role-Based)

Protected routes require:
1. Valid Supabase session (non-expired JWT in `sb-access-token` cookie)
2. Matching role in `profiles` table
3. Middleware verification (see [Middleware Logic](#middleware-logic))

Unauthenticated users are redirected to `/auth/login?next=<requested_path>&role=<guessed_role>`.

### Customer Routes

**Base Path:** `/customer`  
**Role Required:** `role='customer'`  
**Verification:** None (any authenticated customer)

#### `/customer`
- **Type:** Customer dashboard (main entry)
- **Handler:** `src/app/app/page.tsx`
- **Description:**
  - Overview of active/pending service requests
  - Quick links to properties, history, bookings
  - CTA: "Request Service" → `/customer/services` or AI intake flow

#### `/customer/services`
- **Type:** Browse available services
- **Handler:** `src/app/app/services/page.tsx`
- **Description:** Filterable list of service categories; select to book

#### `/customer/requests`
- **Type:** Service request history
- **Handler:** `src/app/app/requests/page.tsx`
- **Description:** All customer-submitted requests (past & present)

#### `/customer/bookings`
- **Type:** Active/past bookings
- **Handler:** `src/app/app/bookings/page.tsx`
- **Description:** Appointments, professional assignments, status tracking

#### `/customer/properties`
- **Type:** Property management
- **Handler:** `src/app/app/properties/page.tsx`
- **Description:**
  - List of customer's properties
  - View maintenance history per property
  - Edit property details

#### `/customer/properties/[id]`
- **Type:** Property detail & history
- **Handler:** `src/app/app/properties/[id]/page.tsx`
- **Description:**
  - Property info (address, type, notes)
  - Service history timeline
  - Active jobs on this property

#### `/customer/profile`
- **Type:** Account settings
- **Handler:** `src/app/app/profile/page.tsx`
- **Description:** Email, password, preferences, notification settings

#### `/customer/support`
- **Type:** Support tickets/help
- **Handler:** `src/app/app/support/page.tsx`
- **Description:** Contact support, view ticket history

### Professional Routes

**Base Path:** `/professional`  
**Role Required:** `role='professional'`  
**Verification:** 
- If `verification_status='verified'` → Allow `/professional/*`
- If `verification_status='unverified'` → Redirect to `/professional/onboarding`
- If `verification_status='rejected'` or `'suspended'` → Deny access (redirect to `/auth/login?error=not_verified`)

#### `/professional`
- **Type:** Professional dashboard (main entry)
- **Handler:** `src/app/professional/page.tsx`
- **Description:**
  - Overview of active/assigned jobs
  - Pending quotes to create
  - Earnings summary
  - Availability status
  - CTA: "View Available Jobs" → `/professional/jobs`
  - **Verification Check:** Unverified professionals redirected to `/professional/onboarding`

#### `/professional/onboarding`
- **Type:** Verification & profile completion (for unverified professionals)
- **Handler:** `src/app/professional/onboarding/page.tsx`
- **Description:**
  - Multi-step verification: identity, skills, service areas, background check
  - Document upload (ID, insurance, certifications)
  - Submit for admin review
  - Redirects to `/professional` once verified (by admin)

#### `/professional/jobs`
- **Type:** Available/assigned job board
- **Handler:** `src/app/professional/jobs/page.tsx`
- **Description:**
  - Filter: Available (not yet accepted), Assigned (accepted), Completed
  - Real-time job notifications
  - CTA: Accept job → `/professional/jobs/[id]/accept`

#### `/professional/jobs/[id]`
- **Type:** Job detail & tracking
- **Handler:** `src/app/professional/jobs/[id]/page.tsx`
- **Description:**
  - Customer & property info
  - Current job state & timeline
  - Photos, notes, inspection findings
  - Action buttons (Accept, Arrive, Complete, Create Quote, etc.)
  - RLS Policy: Professional can only view assigned jobs

#### `/professional/availability`
- **Type:** Schedule & availability management
- **Handler:** `src/app/professional/availability/page.tsx`
- **Description:**
  - Set working hours
  - Block time off
  - Service area management
  - Skills & certifications

#### `/professional/earnings`
- **Type:** Earnings & payment history
- **Handler:** `src/app/professional/earnings/page.tsx`
- **Description:**
  - Monthly earnings breakdown
  - Payment history
  - Payout method settings

#### `/professional/profile`
- **Type:** Account & professional profile
- **Handler:** `src/app/professional/profile/page.tsx`
- **Description:**
  - Basic profile (name, bio, photo)
  - Verification status & documents
  - Skills & certifications
  - Service areas
  - Rates & pricing

#### `/professional/support`
- **Type:** Support & help
- **Handler:** `src/app/professional/support/page.tsx`
- **Description:** Contact support, FAQ

### Admin Routes

**Base Path:** `/admin`  
**Role Required:** `role='admin'`  
**Verification:** None (any authenticated admin)

#### `/admin`
- **Type:** Admin dashboard
- **Handler:** `src/app/admin/page.tsx`
- **Description:**
  - KPI overview (jobs, revenue, users, etc.)
  - Quick links to management sections

#### `/admin/jobs`
- **Type:** Job management & monitoring
- **Handler:** `src/app/admin/jobs/page.tsx`
- **Description:**
  - Live job board (all jobs, any state)
  - Filter by state, professional, customer
  - Escalation tools, force state transitions

#### `/admin/customers`
- **Type:** Customer management
- **Handler:** `src/app/admin/customers/page.tsx`
- **Description:**
  - Customer list, search, view profiles
  - Suspend/unsuspend customers

#### `/admin/professionals`
- **Type:** Professional management & verification
- **Handler:** `src/app/admin/professionals/page.tsx`
- **Description:**
  - Professional list, search, profiles
  - Verification queue
  - Suspend/unsuspend professionals
  - Override verification status

#### `/admin/payments`
- **Type:** Payment & financial management
- **Handler:** `src/app/admin/payments/page.tsx`
- **Description:**
  - All transactions
  - Refund management
  - Financial reports

#### `/admin/analytics`
- **Type:** Business intelligence
- **Handler:** `src/app/admin/analytics/page.tsx`
- **Description:** KPIs, trends, reports

### Support Routes

**Base Path:** `/support`  
**Role Required:** `role='support'`  
**Verification:** None

#### `/support`
- **Type:** Support agent dashboard
- **Handler:** `src/app/support/page.tsx`
- **Description:**
  - Support ticket queue
  - Customer/professional escalations
  - Complaint management

---

## OAuth Callback & Special Routes

### `/auth/callback`
- **Type:** OAuth callback handler (API Route)
- **Handler:** `src/app/auth/callback/route.ts`
- **HTTP Method:** GET
- **Query Params:**
  - `code` (Supabase Auth code)
  - `state` (PKCE state parameter)
  - `next` (optional): Post-login redirect target
- **Flow:**
  1. Exchanges `code` for session
  2. Reads `next` from query params
  3. Validates `next` against user role using `validateNextParam()`
  4. Redirects to validated `next` or role dashboard
  5. If error: Redirects to `/auth/login?error=<error>`

### `/auth/logout`
- **Type:** Logout handler (Server Action)
- **Handler:** Called via form submission from header/menu
- **Action:**
  1. Calls `signOut()` server action
  2. Clears session cookies
  3. Clears session metadata cookies
  4. Redirects to `/auth/login?logged_out=1`
- **Result:** User sees logout confirmation message on login page

### `/_next/*` & `/favicon.ico`
- **Type:** Static assets (excluded from middleware)
- **Handler:** Next.js built-in
- **Middleware Bypass:** Configured in `middleware.ts` matcher regex

---

## Middleware Logic

**File:** `src/middleware.ts`

### Purpose
- Run on every request (except static assets)
- Refresh session on each navigation
- Enforce RBAC by redirecting unauthenticated users
- Handle token expiry and re-authentication

### Implementation

```typescript
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create SSR Supabase client for this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This refreshes the session if needed (handles token expiry)
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Behavior

1. **Session Refresh:**
   - Calls `supabase.auth.getUser()` on every request
   - If token expired: Supabase middleware automatically refreshes it
   - Updated session cookies are set in response

2. **Unauthenticated Access to Protected Routes:**
   - Middleware does NOT redirect (Next.js route handlers do)
   - Protected routes are wrapped with `requireAuth()` or similar guard
   - If no session: Guard redirects to `/auth/login?next=<path>&role=<guessed>`

3. **Role Verification:**
   - Middleware does NOT check roles (SSR route handlers do)
   - Route handlers call `getCurrentUser()` and check role
   - If role mismatch: Route handler redirects to `/auth/login?error=invalid_role`

4. **Professional Verification Check:**
   - Professional routes (`/professional`) must check `verification_status`
   - If `unverified`: Redirect to `/professional/onboarding`
   - If `rejected` or `suspended`: Deny access

### Key Files
- `src/middleware.ts` — Entry point
- `src/lib/supabase/server.ts` — `createServerSupabase()` factory
- `src/lib/auth/helpers.ts` — Route guards (`requireAuth`, `requireRole`)

---

## Session & Cookie Management

### Cookies Set by Supabase Auth

| Cookie Name | Purpose | Expiry | Secure | HttpOnly |
|---|---|---|---|---|
| `sb-access-token` | JWT access token | ≈1 hour | Yes | Yes |
| `sb-refresh-token` | JWT refresh token | ≈7 days | Yes | Yes |
| `sb-auth-token` | Session token (old format) | Session | Yes | Yes |

### Custom Session Metadata Cookies (Optional)

**File:** `src/lib/session.ts`

| Cookie Name | Purpose | Content |
|---|---|---|
| `fixify-session-id` | Tracking ID for session | UUID |
| `fixify-session-metadata` | User role & ID | JSON: `{ userId, role, createdAt }` |

**Note:** These are optional and used for analytics/debugging. Core auth uses Supabase cookies only.

### Logout & Cookie Clearing

**File:** `src/app/auth/actions.ts` → `signOut()` function

```typescript
export async function signOut() {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[Auth Actions] signOut error:", err);
  }

  // Clear all session and auth cookies
  await clearSessionCookies();

  // Return redirect path with logged_out flag
  return { success: true, redirectPath: "/auth/login?logged_out=1" };
}
```

**Effect:**
- Clears `sb-access-token`, `sb-refresh-token`, all custom session cookies
- User redirected to `/auth/login?logged_out=1`
- Logout message displayed on login page

---

## Authorization Flows

### Flow 1: Email/Password Login

```
1. User enters email & password on /auth/login
   ↓
2. Form submits to signInWithEmail(email, password, next?)
   ├─ Server Action: src/app/auth/actions.ts
   ├─ Queries profiles table to get user's role
   ├─ Validates next param against role via validateNextParam()
   └─ Returns { success, redirectPath }
   ↓
3. Client-side redirect to redirectPath
   ├─ Example: /customer (if next=null and role='customer')
   ├─ Example: /customer/properties/123 (if next='/customer/properties/123')
   └─ Example: /customer (if next='/professional' but role='customer' — blocked)
   ↓
4. Route handler on destination checks getCurrentUser()
   ├─ If no session: Redirect to /auth/login
   ├─ If role mismatch: Redirect to /auth/login?error=invalid_role
   └─ If verified: Render page
```

### Flow 2: Google OAuth Login

```
1. User clicks "Sign in with Google" on /auth/login or /auth/register
   ↓
2. Form submits to signInWithGoogle(next?)
   ├─ Server Action: src/app/auth/actions.ts
   ├─ Builds OAuth redirect URL: https://accounts.google.com/o/oauth2/v2/auth?...
   ├─ Callback URL set to /auth/callback?next=<next>
   └─ Returns { url: "https://accounts.google.com/..." }
   ↓
3. Client redirects to Google Auth URL
   ├─ User authenticates with Google
   └─ Google redirects back to /auth/callback?code=...&state=...&next=...
   ↓
4. /auth/callback (API Route) processes OAuth response
   ├─ Exchanges code for Supabase session via supabase.auth.signInWithOAuth()
   ├─ Reads next from query params
   ├─ Queries profiles table to get user's role
   ├─ Validates next against role via validateNextParam()
   └─ Redirects to validated next or role dashboard
   ↓
5. Client lands on destination (e.g., /customer)
   ├─ Route handler verifies session & role
   └─ Renders page
```

### Flow 3: Professional Verification Check

```
1. Verified professional accesses /professional
   ├─ Route handler checks getCurrentUser()
   ├─ Queries professional_profiles table for verification_status
   ├─ If verification_status='verified': Render /professional dashboard
   └─ Response: Professional dashboard
   ↓
2. Unverified professional accesses /professional
   ├─ Route handler checks verification_status
   ├─ If verification_status='unverified': Redirect to /professional/onboarding
   └─ Redirect: /professional/onboarding
   ↓
3. Professional completes verification (admin approves)
   ├─ Admin updates verification_status='verified'
   ├─ Professional refreshes browser (new session)
   ├─ Middleware refreshes cookies
   └─ /professional route allows access
```

### Flow 4: Role Mismatch on Protected Route

```
1. Customer (role='customer') tries to access /professional
   ├─ Route handler calls getCurrentUser() and checks role
   ├─ If role != 'professional': Redirect to /auth/login?error=invalid_role
   └─ Redirect: /auth/login?error=invalid_role
   ↓
2. /auth/login displays error message
   └─ "Your account does not have access to that page."
   ↓
3. User can:
   ├─ Create a professional account (new signup)
   └─ Contact support for role assignment
```

### Flow 5: Session Expiry & Token Refresh

```
1. User logged in, browsing /customer/properties
   ├─ sb-access-token expired (>1 hour old)
   └─ sb-refresh-token valid (<7 days old)
   ↓
2. User navigates to /customer/bookings
   ├─ Middleware runs: supabase.auth.getUser()
   ├─ Supabase middleware detects expired access token
   ├─ Exchanges refresh token for new access token
   ├─ Sets new sb-access-token cookie
   └─ Request proceeds with new session
   ↓
3. Route handler on /customer/bookings succeeds
   ├─ getCurrentUser() returns valid user
   └─ Page renders
   ↓
4. (Later) Refresh token also expires (>7 days old)
   ├─ Middleware cannot refresh
   ├─ supabase.auth.getUser() returns null
   ├─ Route guard redirects to /auth/login
   └─ User must re-authenticate
```

---

## Redirect Chains & Examples

### Example 1: New Customer Registration → Dashboard

```
POST /auth/register
  ├─ Form: email, password
  ├─ Server Action: signInWithEmail() (auto-login after signup)
  └─ Validations pass
     ↓
201 Created: Profile in profiles table (role='customer')
     ↓
Redirect: /customer (baseRedirectPath for customer)
     ↓
GET /customer
  ├─ Middleware: Refresh session ✓
  ├─ Route handler: getCurrentUser() → { role: 'customer' }
  ├─ Check: role === 'customer' ✓
  └─ Render: Customer dashboard
```

### Example 2: Google OAuth → Unverified Professional

```
GET /auth/register/professional
  └─ User clicks "Sign in with Google"
     ↓
POST /auth/register/professional (Google button form)
  ├─ Server Action: signInWithGoogle()
  └─ Redirects to Google Auth URL
     ↓
(User authenticates with Google)
     ↓
GET /auth/callback?code=...&state=...&next=null
  ├─ API Route exchanges code for session
  ├─ Queries profiles table
  ├─ Profile found: role='professional', verification_status='unverified'
  ├─ next=null, so use baseRedirectPath for professional → '/professional'
  └─ Redirects to /professional
     ↓
GET /professional
  ├─ Middleware: Refresh session ✓
  ├─ Route handler: getCurrentUser() → { role: 'professional' }
  ├─ Check: verification_status === 'unverified'
  ├─ Redirect: /professional/onboarding
  └─ Client navigates to /professional/onboarding
     ↓
GET /professional/onboarding
  ├─ Middleware: Refresh session ✓
  └─ Render: Verification form
```

### Example 3: Admin Force-Approves Professional

```
Admin accesses /admin/professionals
  ├─ Clicks "Verify" on professional's row
  └─ POST request: updateProfessionalVerification(profId, 'verified')
     ↓
Server updates: professional_profiles.verification_status='verified'
     ↓
Professional (in another browser tab) navigates to /professional
  ├─ Middleware: Refresh session
  │  └─ Supabase Auth still has old session (verification_status cached locally)
  ├─ Route handler: getCurrentUser()
  │  └─ Queries profiles + professional_profiles in real-time
  │  └─ Finds verification_status='verified' ✓
  └─ Render: /professional dashboard
```

### Example 4: Invalid `next` Param Blocked

```
Attacker crafts link: /auth/login?next=https://evil.com
  ├─ Middleware: Refresh session (none, public route)
  └─ Render: /auth/login
     ↓
User logs in with email
  ├─ Server Action: signInWithEmail(email, password, next='https://evil.com')
  ├─ validateNextParam() checks:
  │  ├─ next.startsWith('/') → false
  │  └─ Return baseRedirectPath ('/customer')
  └─ Redirect to /customer ✓ (safe)
     ↓
(Attacker link neutralized; user goes to dashboard, not evil.com)
```

### Example 5: Role-Mismatched `next` Param

```
Customer logs in with next='/professional/jobs'
  ├─ Server Action: signInWithEmail(email, password, next='/professional/jobs')
  ├─ getUserRole(userId) → 'customer'
  ├─ validateNextParam(next='/professional/jobs', role='customer', base='/customer')
  │  ├─ next.startsWith('/professional') but role='customer'
  │  └─ Return baseRedirectPath ('/customer')
  └─ Redirect to /customer ✓ (not /professional/jobs)
```

---

## Route Consolidation Summary

This section documents the route cleanup performed in the Fixify authentication bugfix.

### Deleted Routes (No Longer Valid)

| Old Route | Reason | Replacement |
|---|---|---|
| `/login` | Fragmentation; canonical is `/auth/login` | `/auth/login` |
| `/src/app/pro` | Mistakenly created; canonical is `/professional` | `/professional` |
| `src/app/auth/login/LoginForm.tsx` | Unused component referencing non-existent `/app` | Removed (imported only in dead page) |
| `src/app/auth/login/actions.ts` | Duplicate; canonical auth actions in `/auth/actions.ts` | `/auth/actions.ts` |

### Created Routes (New Canonical Paths)

| New Route | Created For | Status |
|---|---|---|
| Already exists: `/professional/page.tsx` | Professional dashboard (canonical) | ✓ Active |

### Route Fixes in Components

| File | Fix | Before | After |
|---|---|---|---|
| `src/app/help/page.tsx` | Link corrections (3x) | `/login` (3 instances) | `/auth/login` (3 instances) |
| `src/components/marketing/site-footer.tsx` | Link corrections (2x) | `/professional` (2 instances) | `/professional` (2 instances) |
| `src/app/auth/login/page.tsx` | Google icon sizing | `width: 100%` (inherited) | `width: 18px; height: 18px` (inline) |
| `src/app/auth/register/page.tsx` | Google icon sizing | `width: 100%` (inherited) | `width: 18px; height: 18px` (inline) |
| `src/app/page.tsx` | Homepage professional link | `/pro` | `/professional` |
| `src/app/professional/onboarding/OnboardingClient.tsx` | Verification dashboard link | `/pro` | `/professional` |
| `src/app/professional/onboarding/page.tsx` | Onboarding checklist links | `/pro/profile/edit`, `/pro/jobs` | `/professional/profile/edit`, `/professional/jobs` |

### Auth Action Consolidation

| File | Change | Reason |
|---|---|---|
| `src/app/auth/utils.ts` | Changed redirect path from `/pro` to `/professional` | Use canonical professional route |
| `src/app/auth/actions.ts` | Uses `getRedirectPathByRole()` which now returns `/professional` | Consistent routing for professionals |
| `src/app/auth/callback/route.ts` | Replaced inline validation with call to `validateNextParam()` | DRY principle; single source of truth |
| `src/lib/auth/validateNextParam.ts` | Extracted to new file | Shared between auth actions and callback |

---

## Appendix: Testing Route Consolidation

### Manual Test Cases

1. **Public Route Access:**
   - ✓ Unauthenticated users can access `/`, `/auth/login`, `/auth/register`, `/help`
   - ✓ Unauthenticated users are redirected from protected routes to `/auth/login`

2. **Email Login Flow:**
   - ✓ Email login on `/auth/login` redirects to `/customer` (for customer role)
   - ✓ Email login on `/auth/login` redirects to `/pro` (for professional role, if verified)
   - ✓ Unverified professional redirected to `/pro/onboarding` from `/pro`

3. **Google OAuth Flow:**
   - ✓ Google sign-in on `/auth/login` redirects to `/auth/callback` → role dashboard
   - ✓ Google sign-up on `/auth/register` auto-creates profile and redirects to `/customer`
   - ✓ Google sign-up on `/auth/register/professional` redirects to `/pro/onboarding`

4. **Route Integrity:**
   - ✓ All links in marketing pages point to canonical routes
   - ✓ No 404s on canonical routes
   - ✓ Old routes (`/login`, `/professional`) either deleted or redirect

5. **Role-Based Redirect:**
   - ✓ Customer cannot access `/pro` (redirects to `/auth/login?error=invalid_role`)
   - ✓ Professional cannot access `/customer/properties` (redirects to `/auth/login?error=invalid_role`)
   - ✓ Admin can access `/admin` only if role='admin'

6. **Session & Logout:**
   - ✓ Logout clears cookies and redirects to `/auth/login?logged_out=1`
   - ✓ Logout message displays on login page
   - ✓ After logout, accessing `/customer` redirects to `/auth/login`

For comprehensive test matrices, see:
- `TEST_AUTH_FLOW.md` — 9 test matrices, 43 email/OAuth/RBAC/error test cases
- `TEST_CROSS_TAB_SESSION.md` — 7 manual test cases for multi-tab session sync

---

## Files Modified (Reference)

### Core Auth & Session
- `src/app/auth/actions.ts` — Canonical auth actions
- `src/app/auth/callback/route.ts` — OAuth callback handler
- `src/lib/auth/validateNextParam.ts` — Shared next-param validation
- `src/middleware.ts` — Request-level session refresh
- `src/lib/session.ts` — Session metadata management

### Routes Created/Deleted
- ✓ `src/app/pro/page.tsx` — CREATED (professional dashboard)
- ✗ `src/app/auth/login/LoginForm.tsx` — DELETED (unused)
- ✗ `src/app/auth/login/actions.ts` — DELETED (duplicate)

### Links Fixed
- `src/app/help/page.tsx` — Fixed `/login` → `/auth/login` (3x)
- `src/components/marketing/site-footer.tsx` — Fixed `/professional` → `/pro` (2x)
- `src/app/auth/login/page.tsx` — Fixed Google icon sizing
- `src/app/auth/register/page.tsx` — Fixed Google icon sizing

### Documentation
- `TEST_AUTH_FLOW.md` — Test matrix: 9 flows, 43 test cases
- `TEST_CROSS_TAB_SESSION.md` — Cross-tab session test guide (7 cases)
- `ROUTE_MAP.md` — THIS FILE (canonical route documentation)

---

## Conclusion

Fixify now has a **consolidated, canonical route structure** with:
- One auth flow (email + OAuth)
- One set of protected routes (no fragmentation)
- Middleware-enforced session refresh
- Role-based RBAC with validation
- Audit-logged access control
- Comprehensive test coverage

All routes are documented here. Link to this file when debugging navigation or authentication issues.

**Last Verified:** September 28, 2026
