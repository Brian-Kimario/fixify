# Fixify Technical Constraints

**Inclusion:** auto  
**Name:** technical-constraints  
**Description:** Production stack, architecture constraints, and technical guardrails for Fixify implementation.

---

## Production Technology Stack

```
Frontend + App
    ↓
Next.js (App Router)
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
    └── Buckets with RLS policies

    ↓

Realtime
    ↓
Supabase Realtime (where appropriate)

    ↓

Server / Backend Logic
    ↓
Next.js Route Handlers
Next.js Server Actions
Supabase SQL Functions / Triggers
Supabase Edge Functions (webhooks, external APIs)

    ↓

External Services
    ├── Payment provider
    ├── AI provider
    ├── Email/notification provider
    └── Maps/location provider (future)
```

---

## Required Architecture Decisions

### 1. Authentication: Supabase only

- **Not Clerk**: Clerk is removed. Use Supabase Auth exclusively.
- **Session management**: Use `@supabase/ssr` for Next.js cookie-based sessions.
- **OAuth**: Google OAuth configured in Supabase.
- **User identity**: `auth.users.id` (UUID) is authoritative.
- **Profile table**: `profiles` bridges `auth.users` to application roles/data.

### 2. Authorization: RLS + Server

- **Row Level Security**: Applied to all customer-owned tables.
- **No client-side security**: Frontend role checks are UX only.
- **Server authorization**: Server actions verify roles/permissions before modifying data.
- **Service role**: Used only server-side for privileged operations. Never exposed to client.

### 3. Database: Single Postgres instance

- **Schema source**: Migrations in `supabase/migrations/`
- **No second schema**: Never create a parallel Prisma/ORM database without explicit approval.
- **RLS enforced**: Policies prevent unauthorized row access.
- **Functions/triggers**: Implement business logic (quote approval, job transitions, audit) at database level where appropriate.

### 4. Financial calculations: Server-authoritative

- **Client displays**: Frontend may show prices/totals for UX.
- **Server calculates**: All amounts calculated server-side.
- **Database stores**: Authoritative amounts persisted in database.
- **No client-side finality**: Browser cannot make a payment final; provider + server confirm.

### 5. Job state: Machine-enforced

- **State machine defined**: Allowed transitions in `docs/STATE_MACHINE.md`.
- **Controlled transitions**: Only `transition_job_state()` function changes state.
- **No direct updates**: Application never does `UPDATE jobs SET current_state = ...` directly.
- **Event logging**: Every transition creates an immutable `job_event` record.

### 6. Payments: Provider-authoritative

- **Webhook idempotency**: Payment webhooks are idempotent (duplicate webhooks don't duplicate records).
- **Server verification**: Backend verifies payment status with provider before trusting webhook.
- **Signature verification**: Webhook signatures are validated.
- **No client-side finality**: Frontend success response does not make payment final.

---

## Codebase Organization

```
src/
  app/
    (marketing)/         # Public marketing pages
    (auth)/              # Login/register/reset
    auth/callback/       # OAuth callback
    app/                 # Customer app (protected)
    pro/                 # Professional app (protected)
    admin/               # Admin panel (protected)

  components/
    ui/                  # Reusable UI components
    marketing/           # Marketing page components
    customer/            # Customer app components
    professional/        # Professional app components
    admin/               # Admin panel components
    booking/             # Booking flow components
    jobs/                # Job tracking components

  lib/
    supabase/            # Supabase client setup
      client.ts
      server.ts
    auth/                # Auth helpers
    services/            # Business logic services
    jobs/                # Job state machine
    payments/            # Payment provider adapter
    notifications/       # Notification service
    ai/                  # AI service adapter
    validators/          # Input validation schemas

  types/
    index.ts             # Shared TypeScript types

supabase/
  migrations/            # SQL migrations (numbered)
  functions/             # SQL functions / triggers
  storage/               # Storage configuration

docs/
  FIXIFY_MASTER_BLUEPRINT.md
  PRODUCT_DECISIONS.md
  DATA_MODEL.md
  RBAC.md
  STATE_MACHINE.md
  API.md
  DESIGN_BRIEF.md
  AI_SPEC.md
  PAYMENT_SPEC.md
  NOTIFICATION_SPEC.md
  TEST_PLAN.md
  OPEN_DECISIONS.md

.kiro/
  steering/
    product.md          # Product rules and vision
    technical.md        # Technical constraints (this file)
    security.md         # Security rules and audit
    structure.md        # Repo structure rules
```

---

## Never Do

1. **Generate Clerk code**
   - Fixify uses Supabase Auth.
   - If you see Clerk generated/recommended, remove it.
   - No parallel authentication systems.

2. **Create a parallel Prisma database**
   - Supabase PostgreSQL is the only database.
   - All schema changes go through migrations.
   - No TypeORM, no secondary databases unless explicitly approved.

3. **Allow client-side financial calculations to become authoritative**
   - Frontend calculates for display/UX.
   - Server calculates for persistence.
   - Database is the source of truth.

4. **Trust client-submitted prices**
   - Prices come from database (service catalogue).
   - Options and materials are looked up server-side.
   - Totals are never accepted from client input.

5. **Allow clients to directly set protected job states**
   - States change through `transition_job_state()` function.
   - No direct UPDATE from application code.
   - State changes are validated, audited, and event-logged.

6. **Expose service-role secrets to client code**
   - Service-role key is server-only.
   - Never in environment.NEXT_PUBLIC_*.
   - Never sent to browser.
   - Only used in server actions / edge functions.

7. **Trust payment success from client**
   - Client receives success page from payment provider.
   - Server/webhook is authoritative.
   - Payment record created only after webhook verification.

8. **Build business logic in UI layer**
   - Quote approval, job transitions, payment → server/database.
   - UI renders state; does not decide outcome.
   - Complex logic belongs in Postgres functions, not client.

---

## Security Rules (Identity Phase Minimum)

1. **Authenticate**: Use Supabase Auth exclusively.
2. **Authorize**: RLS policies enforce ownership/role.
3. **Validate**: Server validates all inputs before persistence.
4. **Audit**: Record important actions (role changes, verification, payment, state changes).
5. **Encrypt**: Sensitive fields use Postgres encryption where appropriate.
6. **Secrets**: Service-role key, payment provider keys, AI API keys are server-only.

---

## Testing Requirements

- **Unit tests**: Business logic (calculations, transitions).
- **Integration tests**: API / server action responses.
- **RLS tests**: Verify row-level security policies.
- **Authorization tests**: Verify role/permission enforcement.
- **E2E tests**: Full user flows (signup, booking, payment, review).

Never skip RLS and authorization tests.

---

## Performance Expectations

- **Supabase reads**: Should be fast; use indexes.
- **Realtime subscriptions**: Use selectively (not every table).
- **Storage**: Supabase Storage with CDN for media.
- **Caching**: Implement caching where sensible (service catalogue).
- **Database queries**: Avoid N+1; use JOINs where appropriate.

---

## Dependency Management

- **Version pinning**: Use exact versions, not ranges.
- **Well-known packages**: Prefer established, actively maintained packages.
- **No typosquatting**: If a package name looks unusual, verify it.
- **Security**: Review vulnerabilities before adding packages.

---

## Code Review Checklist (Technical)

Before merging a feature:

- [ ] Uses Supabase Auth (no alternate auth).
- [ ] RLS policies applied to customer-owned tables.
- [ ] Server-side validation before persistence.
- [ ] Audit logging for sensitive operations.
- [ ] No direct database updates for protected state (use functions).
- [ ] Financial calculations server-side.
- [ ] No service-role key exposed to client.
- [ ] All tests pass.
- [ ] Documentation updated (if schema/API changed).

