# Data Ownership Reference

| Table | Owner | Read | Write | Delete | Notes |
|-------|-------|------|-------|--------|-------|
| profiles | user | self | self (role frozen) | admin | role changes blocked by trigger + RLS |
| addresses | customer | owner | owner | owner | linked by customer_id |
| properties | customer | owner + (prof during active job) | owner | owner | professional access via jobs JOIN |
| property_assets | customer | owner (via property) | owner | owner | indirect ownership via properties |
| service_requests | customer + job system | customer + prof (if assigned) | customer (create) | — | immutable after submission |
| bookings | booking workflow | customer + professional | professional only | — | customers act via RPC |
| jobs | job workflow | customer + professional (assigned) | professional only direct; both via transition_job_state() RPC | — | state machine controlled |
| job_events | system | customer + professional (own job) | system only (SECURITY DEFINER) | — | immutable audit log |
| inspections | professional | customer + professional (own job) | professional only | — | professional_id = auth.uid() |
| quotes | professional | customer + professional (own job) | professional (draft/pending only) | — | approved quotes immutable |
| quote_items | professional | customer + professional (own job) | professional (via own quotes) | — | cascades from quotes |
| payments | server/provider | customer + admin/support | server/webhook only | — | no user INSERT policy |
| audit_logs | system | own user_id | own user_id (server-role: any) | — | immutable; no UPDATE/DELETE policy |
| professional_profiles | professional | own + verified (public) | own | — | verification_status read-only for pro |
| professional_availability | professional | own + public (verified pros) | own | own | booking system reads public |
| professional_skills | professional | own + public (verified) | own | — | admin verifies via service-role |
| professional_verifications | professional/admin | own + admin/support | admin/server | — | admin approves via service-role |
| service_categories | admin | public (catalogue) | admin only | — | seeded via migrations |
| services | admin | public (catalogue) | admin only | — | seeded via migrations |

## RLS Enforcement Architecture

```
Browser / Client
    ↓
Next.js Middleware (auth.uid() verified via getUser())
    ↓
Server Component / Server Action (role + ownership checks)
    ↓
Supabase Authenticated Request (JWT with sub = user.id)
    ↓
PostgreSQL RLS (USING / WITH CHECK on every query)
    ↓
Data returned only if all layers pass
```

## Admin Access Pattern

Admin operations use the service-role client (`src/lib/supabase/admin.ts`) which
bypasses RLS entirely. Access is controlled at the application layer:

1. `src/app/admin/layout.tsx` — verifies `role = 'admin'` before rendering
2. `src/middleware.ts` — redirects non-admin users away from `/admin/*`
3. Service-role key is **never exposed to the browser** (server-only import)

No broad "admin can read everything" RLS policy exists. This prevents service-role
key exposure from granting an attacker database access.
