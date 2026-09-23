# KIRO SPEC: IDENTITY-FOUNDATION

**Status:** Spec phase (requirements & design)  
**Version:** 1.0  
**Created:** 2026-09-23  
**Owner:** Kiro  
**Related docs:**
- `docs/PRODUCT_DECISIONS.md`
- `docs/DATA_MODEL.md`
- `docs/RBAC.md`
- `docs/FIXIFY_MASTER_BLUEPRINT.md`

---

## EXECUTIVE SUMMARY

Build the Fixify authentication and identity model using Supabase Auth with email/password and Google OAuth. Create the `profiles` table and role-based access control foundation that supports Customers, Professionals, Admins, and Support staff. Implement Row Level Security policies to enforce ownership and role boundaries. This is the mandatory foundation for all subsequent features.

---

# PART 1: REQUIREMENTS

## R1. Authentication Architecture

### R1.1 Use Supabase Auth exclusively

- Email/password authentication (configured via Supabase dashboard).
- Google OAuth sign-in (configured via Google Cloud console + Supabase).
- No alternate authentication systems (no Clerk, no parallel identity stores).
- `auth.users.id` is the authoritative user identifier (UUID).

### R1.2 Session management

- Use `@supabase/ssr` for Next.js cookie-based sessions.
- Separate browser client and server client.
- Automatic session refresh between requests via middleware.
- Session state persisted in HTTP-only cookies.

### R1.3 Avoid manual token storage

- Do not store access tokens in localStorage.
- Do not manually refresh tokens in client code.
- Use the Supabase SSR middleware pattern for session management.

---

## R2. User Identity Model

### R2.1 Profiles table

Create `profiles` table to bridge Supabase Auth to application-level identity.

Fields:
- `id` (uuid, primary key, references `auth.users.id`)
- `full_name` (text, nullable)
- `phone` (text, nullable)
- `avatar_url` (text, nullable)
- `role` (enum: customer / professional / admin / support)
- `created_at` (timestamptz, server-generated)
- `updated_at` (timestamptz, server-generated)

### R2.2 One role per user (MVP)

- Each `profiles` record has exactly one primary role.
- Role assignments are not customer-modifiable.
- Role changes are privileged operations recorded in audit_logs.
- Future phases may support multiple roles.

### R2.3 Profile creation workflow

- On successful Supabase Auth user creation, automatically create a `profiles` entry.
- Use Supabase Auth triggers or Next.js server action to ensure profiles exist.
- New profiles default to role `customer` unless explicitly set otherwise.
- Professionals must explicitly register; they are not auto-created as professional role.

---

## R3. Role Definitions (MVP)

### R3.1 Customer

- Purpose: Requests property services; manages properties and bookings.
- Key permissions:
  - Create/read/update properties.
  - Create service requests.
  - Book services.
  - Approve quotes.
  - Pay invoices.
  - Review completed jobs.
  - Create complaints.
- Restrictions:
  - Cannot view unrelated customers' properties.
  - Cannot directly set job states.
  - Cannot approve own quotes (professional/system approval required).
  - Cannot set payment as paid (provider authoritative).

### R3.2 Professional

- Purpose: Accepts and performs services; manages availability and verification.
- Key permissions:
  - Manage own profile, skills, availability, service areas.
  - Submit verification documents.
  - Accept/reject job assignments.
  - Upload job evidence.
  - Create and manage quotes for assigned jobs.
  - View assigned job details and customer/property info.
- Restrictions:
  - Cannot view unrelated professional jobs.
  - Cannot modify customer properties.
  - Cannot approve quotes.
  - Cannot set own verification status.
  - Unverified professionals cannot accept live jobs.

### R3.3 Admin

- Purpose: Manages platform operations, configuration, and oversight.
- Key permissions:
  - Manage user accounts and roles.
  - Verify/reject/suspend professionals.
  - Manage service catalogue (categories, services, pricing).
  - Assign/reassign jobs.
  - Manage complaints and escalations.
  - View audit logs and operational analytics.
  - Configure business policies (commission, fees).
- Restrictions:
  - Audit all administrative actions.
  - Service-role key access only.

### R3.4 Support

- Purpose: Handles assigned customer/professional cases and disputes.
- Key permissions:
  - Read assigned complaints and cases.
  - Communicate with customers/professionals.
  - View relevant job/payment information.
  - Update complaint status.
  - Escalate to admin.
- Restrictions:
  - Cannot perform role assignments.
  - Cannot directly modify financial records.
  - Cannot unrestricted read all records.

---

## R4. Customer Profile Extension

### R4.1 Customer-specific data

Create `customer_profiles` table for customer-only data.

Fields:
- `user_id` (uuid, primary key, foreign key to `profiles.id`)
- `preferences` (jsonb, nullable)
- `created_at` (timestamptz, server-generated)
- `updated_at` (timestamptz, server-generated)

Keep this table minimal initially. Do not store properties, bookings, or payment data in the customer profile.

### R4.2 Customer registration flow

- User signs up via email or Google.
- `profiles` entry created with role `customer`.
- `customer_profiles` entry created.
- Profile completion is optional; booking flows handle incomplete profiles.

---

## R5. Professional Profile Extension

### R5.1 Professional-specific data

Create `professional_profiles` table for professional-only data and operational state.

Fields:
- `user_id` (uuid, primary key, foreign key to `profiles.id`)
- `display_name` (text)
- `bio` (text, nullable)
- `years_experience` (integer, nullable)
- `rating_average` (numeric, nullable, read-only, derived)
- `completed_jobs_count` (integer, nullable, read-only, derived)
- `verification_status` (enum: PENDING / DOCUMENTS_SUBMITTED / UNDER_REVIEW / VERIFIED / REJECTED / SUSPENDED)
- `is_available` (boolean, default true)
- `created_at` (timestamptz, server-generated)
- `updated_at` (timestamptz, server-generated)

### R5.2 Verification workflow

Verification states:
- `PENDING`: Professional created account; no documents submitted.
- `DOCUMENTS_SUBMITTED`: Professional uploaded verification documents.
- `UNDER_REVIEW`: Admin/support is reviewing.
- `VERIFIED`: Eligible for live job assignment.
- `REJECTED`: Application rejected; may reapply.
- `SUSPENDED`: Verified professional suspended for policy violation or complaint.

Only `VERIFIED` professionals are eligible to accept live jobs.

### R5.3 Professional registration flow

- User registers with role intent `professional`.
- `profiles` entry created with role `professional`.
- `professional_profiles` entry created with status `PENDING`.
- Professional completes onboarding and submits documents.
- Status transitions to `DOCUMENTS_SUBMITTED`.
- Admin reviews and transitions to `VERIFIED` or `REJECTED`.

---

## R6. Role-Based Access Control (RBAC)

### R6.1 Authorization layers

Authorization is enforced via:
1. Supabase Auth (user identity).
2. Row Level Security (RLS) policies (database enforcement).
3. Server-side authorization checks (Next.js/Edge Functions).
4. Business logic rules (state machine, transitions).

### R6.2 RLS policy foundation

Apply RLS to protected tables using role and ownership relationships.

**Customer-owned tables:** properties, service_requests, bookings, jobs, payments, invoices, reviews, complaints, property_service_history.

Policy pattern:
```sql
CREATE POLICY customer_read_own_data ON <table>
  FOR SELECT
  USING (
    auth.uid() = profiles.user_id
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'customer'
  );
```

**Professional-owned tables:** professional_profiles, professional_skills, professional_availability, professional_service_areas.

Policy pattern:
```sql
CREATE POLICY professional_read_own_data ON <table>
  FOR SELECT
  USING (
    auth.uid() = professional_profiles.user_id
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'professional'
  );
```

**Admin/service-role access:**
Admins use server-side authorization with service-role key for privileged operations. RLS policies permit admin reads where necessary.

### R6.3 No client-side security decisions

- Frontend role checks are UX only.
- Actual security is database + server.
- Never show UI features to a customer and expect that to prevent data access.

---

## R7. Audit Log Foundation

### R7.1 Audit table

Create `audit_logs` table for security and operational audit trail.

Fields:
- `id` (uuid, primary key)
- `actor_user_id` (uuid, foreign key to `profiles.id`)
- `actor_role` (text, snapshot of role at time of action)
- `action` (text, e.g., `role_assigned`, `professional_verified`, `profile_updated`)
- `entity_type` (text, e.g., `profiles`, `professional_profiles`)
- `entity_id` (uuid)
- `old_value` (jsonb, nullable)
- `new_value` (jsonb, nullable)
- `metadata` (jsonb, nullable)
- `created_at` (timestamptz, server-generated)

### R7.2 Auditable events (identity phase)

Record:
- Role assignment/change.
- Professional verification status transitions.
- Profile updates (especially sensitive fields).
- Admin privileged operations.
- Failed authorization attempts (considered for Phase 2+).

---

## R8. Authentication Callback

### R8.1 OAuth flow (Google example)

```
Login page
   ↓
User clicks "Sign in with Google"
   ↓
Supabase signInWithOAuth('google')
   ↓
Google consent screen
   ↓
Google redirects to Supabase
   ↓
Supabase exchanges code
   ↓
Supabase redirects to app callback
   ↓
Next.js route handler: /auth/callback
   ↓
Exchange authorization code for session
   ↓
Set auth cookies
   ↓
Redirect to app dashboard
```

### R8.2 Callback implementation

- Route: `src/app/auth/callback/route.ts`
- Receive authorization code in query params.
- Exchange code for session using `supabase.auth.exchangeCodeForSession()`.
- Redirect authenticated user to dashboard.
- Handle errors gracefully (invalid code, expired code, network errors).

---

# PART 2: DESIGN

## D1. Technology Stack

- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Session:** `@supabase/ssr` for Next.js
- **Database:** Supabase PostgreSQL
- **Policies:** Row Level Security (RLS)
- **Encryption:** Supabase-managed for sensitive fields

---

## D2. Database Schema (Identity Phase)

### D2.1 Core tables

```sql
-- Profiles (bridge between auth.users and application)
profiles
  id (uuid, PK, references auth.users.id)
  full_name (text)
  phone (text)
  avatar_url (text)
  role (enum)
  created_at (timestamptz)
  updated_at (timestamptz)

-- Customer profile extension
customer_profiles
  user_id (uuid, PK, FK -> profiles.id)
  preferences (jsonb)
  created_at (timestamptz)
  updated_at (timestamptz)

-- Professional profile extension
professional_profiles
  user_id (uuid, PK, FK -> profiles.id)
  display_name (text)
  bio (text)
  years_experience (int)
  rating_average (numeric, read-only)
  completed_jobs_count (int, read-only)
  verification_status (enum)
  is_available (boolean)
  created_at (timestamptz)
  updated_at (timestamptz)

-- Audit log
audit_logs
  id (uuid, PK)
  actor_user_id (uuid, FK -> profiles.id)
  actor_role (text)
  action (text)
  entity_type (text)
  entity_id (uuid)
  old_value (jsonb)
  new_value (jsonb)
  metadata (jsonb)
  created_at (timestamptz)
```

### D2.2 Indexes

```sql
-- Profiles
CREATE INDEX idx_profiles_role ON profiles(role);

-- Professional
CREATE INDEX idx_professional_profiles_verification_status 
  ON professional_profiles(verification_status);
CREATE INDEX idx_professional_profiles_is_available 
  ON professional_profiles(is_available);

-- Audit
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

---

## D3. RLS Policies (Identity Phase)

### D3.1 Profiles

```sql
-- Authenticated users can read their own profile
CREATE POLICY users_read_own_profile ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Authenticated users can update their own editable profile fields
CREATE POLICY users_update_own_profile ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Professionals/admins can read profiles for assignment/coordination
CREATE POLICY professionals_read_profiles ON profiles
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'professional')
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Admin can manage all profiles (with service role)
-- This is enforced server-side, not via RLS
```

### D3.2 Customer profiles

```sql
CREATE POLICY customers_read_own_profile ON customer_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY customers_update_own_profile ON customer_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### D3.3 Professional profiles

```sql
CREATE POLICY professionals_read_own_profile ON professional_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY professionals_update_own_profile ON professional_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND verification_status = (SELECT verification_status FROM professional_profiles WHERE user_id = auth.uid())
    AND is_available = (SELECT is_available FROM professional_profiles WHERE user_id = auth.uid())
  );
```

### D3.4 Audit logs

```sql
-- Admins can read audit logs
CREATE POLICY admin_read_audit_logs ON audit_logs
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- No one can modify audit logs (append-only)
```

---

## D4. Next.js Client/Server Structure

### D4.1 Supabase clients

**Browser client** (`src/lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Server client** (`src/lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}
```

### D4.2 Middleware (session refresh)

Create `middleware.ts` at project root to refresh session on every request:
```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
```

---

## D5. Authentication Callback

Route: `src/app/auth/callback/route.ts`

Purpose:
- Receive OAuth authorization code.
- Exchange code for Supabase session.
- Set secure HTTP-only cookies.
- Redirect to dashboard.

Workflow:
1. User is redirected here after Google consent.
2. Extract authorization code from query params.
3. Call `supabase.auth.exchangeCodeForSession(code)`.
4. Cookie middleware automatically handles session persistence.
5. Redirect to `/app` (dashboard) or `/pro` (professional).

---

## D6. Authorization Patterns

### D6.1 Read user identity (server)

```typescript
// In server component or server action
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  // Not authenticated
  redirect('/login')
}
// Use user.id (UUID from auth.users)
```

### D6.2 Read user profile (server)

```typescript
const supabase = await createClient()
const { data: user } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

if (profile.role !== 'customer') {
  // Not a customer
  throw new Error('Unauthorized')
}
```

### D6.3 Enforce role (server action)

```typescript
'use server'

export async function createProperty(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (profile.role !== 'customer') {
    throw new Error('Only customers can create properties')
  }
  
  // Proceed with property creation
}
```

### D6.4 RLS automatic enforcement

When a query is executed against a protected table:
- Supabase Auth token is included.
- RLS policies are evaluated server-side.
- Only rows matching the policy are returned.
- No client-side filtering needed.

Example:
```typescript
// This query will only return properties owned by the authenticated user
const { data: properties } = await supabase
  .from('properties')
  .select('*')
```

---

## D7. Error Handling

### D7.1 Authentication errors

```typescript
const { error } = await supabase.auth.signInWithPassword(email, password)
if (error) {
  if (error.status === 400) {
    // Invalid credentials
  } else if (error.status === 429) {
    // Rate limited
  }
  // Handle error
}
```

### D7.2 Authorization errors (RLS)

```typescript
const { error } = await supabase
  .from('properties')
  .select('*')
  .eq('id', propertyId)

if (error?.code === 'PGRST116') {
  // RLS policy violation: not allowed
  throw new Error('Unauthorized')
}
```

---

# PART 3: IMPLEMENTATION TASKS

## T1. Database Migrations

### T1.1 Create enums and types

**Migration:** `supabase/migrations/20260923_001_enums.sql`

```sql
-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'professional', 'admin', 'support');

-- Professional verification status
CREATE TYPE professional_verification_status AS ENUM (
  'PENDING',
  'DOCUMENTS_SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED'
);
```

### T1.2 Create profiles table

**Migration:** `supabase/migrations/20260923_002_profiles.sql`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### T1.3 Create customer_profiles table

**Migration:** `supabase/migrations/20260923_003_customer_profiles.sql`

```sql
CREATE TABLE customer_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### T1.4 Create professional_profiles table

**Migration:** `supabase/migrations/20260923_004_professional_profiles.sql`

```sql
CREATE TABLE professional_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  years_experience INTEGER,
  rating_average NUMERIC(3, 2),
  completed_jobs_count INTEGER DEFAULT 0,
  verification_status professional_verification_status NOT NULL DEFAULT 'PENDING',
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_professional_profiles_verification_status ON professional_profiles(verification_status);
CREATE INDEX idx_professional_profiles_is_available ON professional_profiles(is_available);

CREATE TRIGGER update_professional_profiles_updated_at
  BEFORE UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### T1.5 Create audit_logs table

**Migration:** `supabase/migrations/20260923_005_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES profiles(id),
  actor_role user_role NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- No RLS on audit_logs; admin access enforced server-side
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

### T1.6 Create RLS policies

**Migration:** `supabase/migrations/20260923_006_rls_policies.sql`

[Implement all D3.1-D3.4 policies as SQL]

---

## T2. Supabase Setup

### T2.1 Configure Supabase Auth

1. Create Supabase project.
2. Navigate to Authentication → Providers.
3. Enable Email/Password authentication.
4. Enable Google OAuth:
   - Create Google OAuth credentials (Google Cloud Console).
   - Configure redirect URLs:
     - Production: `https://<project-url>.supabase.co/auth/v1/callback`
     - Local: `http://localhost:3000/auth/callback`
5. Record credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<PROJECT_URL>
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>
   SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
   ```

---

## T3. Next.js Setup

### T3.1 Install dependencies

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### T3.2 Create Supabase clients

Create `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` as shown in D4.1.

### T3.3 Implement middleware

Create `middleware.ts` at project root (as shown in D4.2).

### T3.4 OAuth callback route

Create `src/app/auth/callback/route.ts` (as shown in D5).

---

## T4. Authentication UI

### T4.1 Login page

Create `src/app/(auth)/login/page.tsx`:
- Email/password form.
- "Sign in with Google" button.
- Link to registration.
- Error display.

### T4.2 Register page

Create `src/app/(auth)/register/page.tsx`:
- Email/password form.
- Role selection (customer/professional).
- Terms of service checkbox.
- Link to login.

### T4.3 Protected app layout

Create `src/app/app/layout.tsx`:
- Check user authentication.
- Redirect unauthenticated to login.
- Display user profile/role.
- Logout button.

---

## T5. Authorization Utilities

### T5.1 Create auth helper functions

Create `src/lib/auth/helpers.ts`:
- `getCurrentUser()`: Get authenticated user or null.
- `getCurrentProfile()`: Get user profile with role.
- `requireRole(role)`: Server action to enforce role.
- `requireAuth()`: Server action to require authentication.

---

## T6. Testing (Identity Phase)

### T6.1 Unit tests

- Verify profiles are created when auth.users are created.
- Verify role defaults to customer.
- Verify audit_logs are created for role changes.

### T6.2 RLS tests

```
Customer A cannot read Customer B's data → PASS
Professional cannot update own verification_status → PASS
Unauthenticated cannot query protected tables → PASS
Admin can read profiles (via service role) → PASS
```

### T6.3 Authentication flow

- Sign up with email → profile created → role defaults to customer.
- Sign in with Google → profile created if not exists.
- Session persists across page refreshes.
- Logout clears session.

### T6.4 Authorization flow

- Customer can update own profile → PASS
- Customer cannot update professional verification_status → PASS
- Professional cannot read Customer A's properties → PASS

---

# PART 4: ROLLOUT CHECKLIST

## Pre-implementation

- [ ] Review with product owner.
- [ ] Confirm RBAC requirements.
- [ ] Confirm Supabase project created and credentials available.
- [ ] Confirm Google OAuth credentials created.

## Implementation

- [ ] Create database migrations (T1.1-T1.5).
- [ ] Apply migrations to Supabase.
- [ ] Create RLS policies (T1.6).
- [ ] Configure Supabase Auth (T2.1).
- [ ] Install packages (T3.1).
- [ ] Create Supabase clients (T3.2).
- [ ] Implement middleware (T3.3).
- [ ] Implement OAuth callback (T3.4).
- [ ] Create auth UI (T4.1-T4.3).
- [ ] Create auth helpers (T5.1).

## Testing

- [ ] Run unit tests (T6.1).
- [ ] Run RLS tests (T6.2).
- [ ] Run authentication flow tests (T6.3).
- [ ] Run authorization flow tests (T6.4).
- [ ] Local end-to-end test:
  - [ ] Register new customer.
  - [ ] Register new professional.
  - [ ] Verify profiles created.
  - [ ] Sign out; sign back in.
  - [ ] Verify role-based redirects.

## Verification

- [ ] All tests pass.
- [ ] Audit logs record important events.
- [ ] RLS prevents unauthorized data access.
- [ ] Session persists across requests.
- [ ] OAuth flow works end-to-end.

## Deployment

- [ ] Push feature branch.
- [ ] Create pull request.
- [ ] Get code review.
- [ ] Merge to develop.
- [ ] Deploy to staging.
- [ ] Run smoke tests.
- [ ] Merge to main (when ready for production).

---

# PART 5: SUCCESS CRITERIA

The identity foundation is complete when:

1. **Authentication works**: Users can sign up/login via email or Google OAuth.
2. **Profiles exist**: Every authenticated user has a profile with a role.
3. **Sessions persist**: Authenticated sessions remain active across page refreshes and requests.
4. **RBAC enforced**: RLS policies enforce role and ownership boundaries.
5. **Audit logging works**: Important identity events (verification, role changes) are logged.
6. **Authorization flows work**: Server-side checks prevent unauthorized actions.
7. **Tests pass**: All unit, integration, and authorization tests pass.
8. **Ready for next phase**: Properties/Services schema can be built on top of this identity foundation.

---

# APPENDIX: Related Documents

- `docs/RBAC.md` — Detailed RBAC specification.
- `docs/DATA_MODEL.md` — Complete data model.
- `docs/PRODUCT_DECISIONS.md` — Product business decisions.
- `GUIDE.md` section 26-37 — Implementation ordering.

# END OF SPEC

