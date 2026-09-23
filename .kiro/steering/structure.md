# Fixify Repository Structure

**Inclusion:** auto  
**Name:** repository-structure  
**Description:** Canonical repository structure, file organization, and structural rules for Fixify development.

---

## Project Layout

```
fixify/
├── src/
│   ├── app/                          # Next.js app router
│   │   ├── (marketing)/              # Public marketing pages
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── layout.tsx
│   │   │   ├── services/
│   │   │   ├── how-it-works/
│   │   │   ├── professionals/
│   │   │   └── help/
│   │   │
│   │   ├── (auth)/                   # Auth-related routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts          # OAuth callback handler
│   │   │
│   │   ├── app/                      # Customer app (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── assistant/            # AI intake
│   │   │   ├── services/
│   │   │   ├── requests/             # Service requests
│   │   │   ├── bookings/             # Bookings
│   │   │   ├── properties/           # Properties
│   │   │   ├── history/              # Maintenance history
│   │   │   ├── payments/
│   │   │   ├── invoices/
│   │   │   ├── profile/
│   │   │   └── support/
│   │   │
│   │   ├── pro/                      # Professional app (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── onboarding/
│   │   │   ├── jobs/                 # Job management
│   │   │   ├── availability/
│   │   │   ├── earnings/
│   │   │   ├── profile/
│   │   │   └── support/
│   │   │
│   │   ├── admin/                    # Admin panel (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── jobs/
│   │   │   ├── customers/
│   │   │   ├── professionals/
│   │   │   ├── verification/
│   │   │   ├── services/
│   │   │   ├── pricing/
│   │   │   ├── payments/
│   │   │   ├── complaints/
│   │   │   └── analytics/
│   │   │
│   │   ├── globals.css
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/
│   │   ├── ui/                       # Shadcn/headless UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── marketing/                # Homepage/marketing components
│   │   │   ├── hero.tsx
│   │   │   ├── pricing.tsx
│   │   │   ├── testimonials.tsx
│   │   │   └── cta.tsx
│   │   │
│   │   ├── auth/                     # Auth components
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   └── oauth-buttons.tsx
│   │   │
│   │   ├── customer/                 # Customer app components
│   │   │   ├── dashboard.tsx
│   │   │   ├── property-card.tsx
│   │   │   ├── service-request.tsx
│   │   │   ├── booking-wizard.tsx
│   │   │   └── job-timeline.tsx
│   │   │
│   │   ├── professional/             # Professional app components
│   │   │   ├── job-card.tsx
│   │   │   ├── job-detail.tsx
│   │   │   ├── quote-form.tsx
│   │   │   └── earnings-chart.tsx
│   │   │
│   │   ├── admin/                    # Admin panel components
│   │   │   ├── job-table.tsx
│   │   │   ├── customer-table.tsx
│   │   │   ├── verification-queue.tsx
│   │   │   └── payment-dashboard.tsx
│   │   │
│   │   ├── shared/                   # Shared across routes
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── navigation.tsx
│   │   │
│   │   └── loading/                  # Loading states
│   │       └── skeleton.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser client
│   │   │   ├── server.ts             # Server client
│   │   │   └── middleware.ts         # Session refresh
│   │   │
│   │   ├── auth/
│   │   │   ├── helpers.ts            # Auth utility functions
│   │   │   ├── getCurrentUser.ts
│   │   │   └── requireAuth.ts
│   │   │
│   │   ├── services/
│   │   │   ├── properties.ts
│   │   │   ├── bookings.ts
│   │   │   ├── jobs.ts
│   │   │   ├── professionals.ts
│   │   │   └── payments.ts
│   │   │
│   │   ├── jobs/
│   │   │   ├── state-machine.ts      # Job state logic
│   │   │   ├── transitions.ts
│   │   │   └── validation.ts
│   │   │
│   │   ├── payments/
│   │   │   ├── provider.ts           # Payment provider adapter
│   │   │   ├── webhook.ts
│   │   │   └── idempotency.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── send.ts
│   │   │   ├── types.ts
│   │   │   └── queue.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── client.ts             # AI provider client
│   │   │   ├── classify.ts           # Service classification
│   │   │   └── extract.ts
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.ts
│   │   │   ├── properties.ts
│   │   │   ├── bookings.ts
│   │   │   ├── quotes.ts
│   │   │   └── payments.ts
│   │   │
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── formatting.ts
│   │       ├── calculations.ts
│   │       └── logger.ts
│   │
│   ├── types/
│   │   ├── index.ts                  # All shared types
│   │   ├── user.ts
│   │   ├── property.ts
│   │   ├── booking.ts
│   │   ├── job.ts
│   │   ├── professional.ts
│   │   ├── payment.ts
│   │   └── api.ts
│   │
│   └── styles/
│       ├── globals.css
│       ├── variables.css
│       └── animations.css
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260923_001_enums.sql
│   │   ├── 20260923_002_profiles.sql
│   │   ├── 20260923_003_customer_profiles.sql
│   │   ├── 20260923_004_professional_profiles.sql
│   │   ├── 20260923_005_audit_logs.sql
│   │   ├── 20260923_006_rls_policies.sql
│   │   └── ...
│   │
│   ├── functions/
│   │   ├── auth/
│   │   │   └── handle_new_user.sql  # Trigger for new auth users
│   │   │
│   │   ├── jobs/
│   │   │   ├── transition_job_state.sql
│   │   │   └── validate_job_transition.sql
│   │   │
│   │   ├── quotes/
│   │   │   ├── approve_quote.sql
│   │   │   └── create_quote.sql
│   │   │
│   │   └── audit/
│   │       └── log_audit_event.sql
│   │
│   └── storage/
│       └── config.ts                 # Storage bucket configuration
│
├── docs/
│   ├── FIXIFY_MASTER_BLUEPRINT.md   # Master product spec
│   ├── PRODUCT_DECISIONS.md          # Business decisions log
│   ├── DATA_MODEL.md                 # Database schema documentation
│   ├── RBAC.md                       # Role-based access control
│   ├── STATE_MACHINE.md              # Job state machine diagram
│   ├── API.md                        # API endpoints
│   ├── DESIGN_BRIEF.md               # UI/UX design spec
│   ├── AI_SPEC.md                    # AI intake specification
│   ├── PAYMENT_SPEC.md               # Payment integration spec
│   ├── NOTIFICATION_SPEC.md          # Notifications spec
│   ├── TEST_PLAN.md                  # Testing strategy
│   ├── OPEN_DECISIONS.md             # Undecided items
│   └── ui/                           # UI component specs (future)
│       └── customer-dashboard.md
│
├── .kiro/
│   └── steering/
│       ├── product.md                # Product rules
│       ├── technical.md              # Technical constraints
│       ├── security.md               # Security rules
│       └── structure.md              # This file
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── middleware.ts                     # Next.js middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── package.json
├── pnpm-lock.yaml
├── .env.local                        # Local environment (git-ignored)
├── .env.example                      # Template
├── .gitignore
├── README.md
└── AGENTS.md                         # Kiro agent handoff guide
```

---

## Structural Rules

### 1. Frontend Code

**Location:** `src/app/` and `src/components/`

- Use Next.js App Router.
- Group routes by domain (marketing, auth, app, pro, admin).
- Use `(groupName)` for layout grouping without affecting URLs.
- Separate public, authenticated, and role-specific routes.

### 2. Server Logic

**Location:** `src/lib/`

- Organize by domain (auth, jobs, payments, notifications, etc.).
- Create server actions for mutations.
- Export helper functions for common operations.
- Keep business logic server-side, not in components.

### 3. Database

**Location:** `supabase/migrations/` and `supabase/functions/`

- One logical schema change = one migration file.
- Migrations are numbered by date: `20260923_001_description.sql`
- SQL functions for complex business logic.
- Triggers for automatic record updates (audit logs, timestamps).

### 4. Types

**Location:** `src/types/`

- Centralize all TypeScript types.
- Use consistent naming: singular (User, Job, Property).
- Document complex types with JSDoc comments.

### 5. Documentation

**Location:** `docs/`

- Master blueprint and product decisions are source of truth.
- Data model documents schema.
- RBAC documents authorization.
- STATE_MACHINE documents job lifecycle.
- UI specs document visual requirements (after Lovable review).

---

## File Naming Conventions

### Components

- PascalCase: `CustomerDashboard.tsx`, `JobCard.tsx`
- Type: `<Domain><Type>.tsx`
- Location: `src/components/<domain>/<name>.tsx`

Example:
```
src/components/customer/PropertyCard.tsx
src/components/professional/JobTimeline.tsx
src/components/admin/VerificationQueue.tsx
```

### Server Code

- camelCase: `getCurrentUser.ts`, `approveQuote.ts`
- Type: `<verb><noun>.ts` or `<noun><Operation>.ts`
- Location: `src/lib/<domain>/<name>.ts`

Example:
```
src/lib/auth/getCurrentUser.ts
src/lib/jobs/transitionState.ts
src/lib/quotes/approveQuote.ts
```

### Routes

- kebab-case: `/app/service-requests/`, `/pro/jobs/[id]`
- Dynamic: `[id].tsx` for single parameter
- Location: `src/app/<group>/<route>/page.tsx`

Example:
```
src/app/app/properties/[id]/page.tsx
src/app/pro/jobs/[id]/page.tsx
```

### Migrations

- ISO date + sequence + description: `20260923_001_enums.sql`
- One migration per schema change.
- Never edit already-applied migrations; create new ones.

Example:
```
supabase/migrations/20260923_001_enums.sql
supabase/migrations/20260923_002_profiles.sql
supabase/migrations/20260924_001_add_properties.sql
```

---

## Do NOT

1. **Create a second backend directory** next to Next.js + Supabase without explicit approval.
2. **Store logic in UI components** that belongs server-side (auth, payments, state transitions).
3. **Commit `.env.local`** — use `.env.example` as template.
4. **Edit migrations** after they are applied to production. Create new migrations.
5. **Import server code in client components** (use `'use server'` for server actions instead).
6. **Hard-code business rules** in UI — read from database/configuration.
7. **Create random directories**. Follow the structure above.

---

## Example Feature Addition

To add a new feature (e.g., Property Management):

1. **Database** (`supabase/migrations/`):
   - Create migration: `20260924_001_add_properties.sql`
   - Define schema: `properties`, `property_assets`, etc.
   - Add RLS policies.
   - Create indexes.

2. **Server Logic** (`src/lib/`):
   - Create `src/lib/services/properties.ts`
   - Export functions: `createProperty()`, `getProperty()`, `updateProperty()`

3. **Types** (`src/types/`):
   - Define: `type Property = { ... }`
   - Export from `src/types/index.ts`

4. **Routes** (`src/app/`):
   - Create `src/app/app/properties/page.tsx` (list)
   - Create `src/app/app/properties/[id]/page.tsx` (detail)

5. **Components** (`src/components/`):
   - Create `src/components/customer/PropertyCard.tsx`
   - Create `src/components/customer/PropertyForm.tsx`

6. **Documentation** (`docs/`):
   - Update `DATA_MODEL.md` with schema.
   - Update `RBAC.md` with permissions.
   - Add UI spec if visual design exists.

---

## Code Review Checklist (Structure)

Before merging a PR:

- [ ] New files follow naming conventions.
- [ ] Code is in the correct directory.
- [ ] No server code imported in client components.
- [ ] Database changes are migrations (not manual updates).
- [ ] Types are centralized in `src/types/`.
- [ ] Documentation updated (if schema/API changed).
- [ ] No configuration or secrets hard-coded.
- [ ] No random new directories.

