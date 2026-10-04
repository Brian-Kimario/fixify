# Phase 2: RLS & Data Ownership Results

**Date:** 2026-10-04  
**Migration:** `phase2_rls_hardening`  
**Test Result:** 12/12 PASS ✅

---

## 1. Pre-Existing RLS Baseline (from Phase 0)

All 17 sensitive tables had RLS enabled. The existing policies provided a solid
foundation but contained 5 exploitable gaps that this phase addresses.

| Table | RLS Enabled | Pre-existing Policies |
|---|---|---|
| `profiles` | ✅ | SELECT/UPDATE own (role=authenticated) |
| `addresses` | ✅ | Full CRUD own (customer_id) |
| `properties` | ✅ | Full CRUD own (owner_customer_id) |
| `property_assets` | ✅ | Full CRUD via property ownership |
| `service_requests` | ✅ | SELECT/INSERT/UPDATE own |
| `bookings` | ✅ | SELECT both parties, INSERT customer, UPDATE both parties |
| `jobs` | ✅ | SELECT both parties, UPDATE both parties |
| `job_events` | ✅ | SELECT via jobs membership (immutable, no write policies) |
| `inspections` | ✅ | SELECT via jobs, INSERT professional |
| `quotes` | ✅ | SELECT via jobs, INSERT professional, UPDATE professional |
| `quote_items` | ✅ | SELECT via quotes, INSERT via professional quotes |
| `payments` | ✅ | SELECT own customer + admin/support |
| `audit_logs` | ✅ | SELECT own user_id only (NO INSERT policy) |
| `professional_profiles` | ✅ | SELECT own + verified, INSERT/UPDATE own |
| `professional_availability` | ✅ | Full CRUD own, public SELECT verified |
| `professional_skills` | ✅ | SELECT own + verified, INSERT own |
| `service_categories/services` | ✅ | SELECT public (catalogue) |

---

## 2. Gaps Identified & Fixed

### GAP 1 — `jobs` UPDATE too broad (CRITICAL)
**Problem:** `jobs_update_restricted` used `customer_id = auth.uid() OR professional_id = auth.uid()` — customers could directly `UPDATE current_state` to any value, bypassing the state machine entirely.

**Fix:** Dropped `jobs_update_restricted`. Added `jobs_update_professional_own` — only the assigned professional can UPDATE job rows directly. Customers have **no direct UPDATE** on jobs; they must use server-side RPCs.

```sql
CREATE POLICY "jobs_update_professional_own"
  ON public.jobs FOR UPDATE
  USING  (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());
```

### GAP 2 — `bookings` UPDATE too broad (HIGH)
**Problem:** `bookings_update_own` allowed both customer and professional to modify any booking field directly, including `booking_status`.

**Fix:** Dropped `bookings_update_own`. Only the assigned professional may update bookings.

```sql
CREATE POLICY "bookings_update_professional_own"
  ON public.bookings FOR UPDATE
  USING  (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());
```

### GAP 3 — `quotes` UPDATE unrestricted (HIGH)
**Problem:** `quotes_update_professional` allowed the professional to update any field on any of their quotes at any time — including changing `total` after customer approval.

**Fix:** Restricted to quotes in `draft` or `pending_customer` status only. Approved quotes are immutable via this path.

```sql
CREATE POLICY "quotes_update_professional_pending"
  ON public.quotes FOR UPDATE
  USING  (professional_id = auth.uid() AND status IN ('draft','pending_customer'))
  WITH CHECK (professional_id = auth.uid() AND status IN ('draft','pending_customer'));
```

### GAP 4 — `audit_logs` had no INSERT policy (HIGH)
**Problem:** No INSERT RLS policy meant any authenticated user could insert audit records claiming any `user_id`, enabling log forgery and history manipulation.

**Fix:** Added INSERT policy requiring `user_id = auth.uid()` — users can only log their own actions.

```sql
CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### GAP 5 — `profiles` inconsistent role (`authenticated` vs `public`) (MEDIUM)
**Problem:** `profiles_select_own` and `profiles_update_own_non_role_fields` used role `{authenticated}` while all other table policies used role `{public}`. Inconsistency could cause unexpected policy evaluation in edge cases.

**Fix:** Dropped and recreated both policies with role `public` (consistent). Added explicit self-role-freeze in `WITH CHECK`:

```sql
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own_non_role_fields"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );
```

**Note:** Role self-elevation is also blocked at the DB trigger layer by `prevent_profile_role_change()` — defence in depth.

### NEW — `properties` professional read during active job
**Reason:** Professionals need property details (address etc.) for their assigned jobs, but the existing policy only allowed the owner (customer) to read.

```sql
CREATE POLICY "properties_select_professional_assigned"
  ON public.properties FOR SELECT
  USING (id IN (
    SELECT property_id FROM public.jobs
    WHERE professional_id = auth.uid()
      AND current_state NOT IN ('closed','cancelled')
  ));
```

### NEW — `service_requests` professional read during active job
**Reason:** Same rationale — professional needs original request context for assigned jobs.

```sql
CREATE POLICY "service_requests_select_professional_assigned"
  ON public.service_requests FOR SELECT
  USING (id IN (
    SELECT sr.id FROM public.service_requests sr
    JOIN public.bookings b ON b.service_request_id = sr.id
    JOIN public.jobs j ON j.booking_id = b.id
    WHERE j.professional_id = auth.uid()
      AND j.current_state NOT IN ('closed','cancelled')
  ));
```

---

## 3. Data Ownership Matrix (Final)

| Table | Owner | Read | Write | Delete |
|---|---|---|---|---|
| `profiles` | user | own row | own row (role frozen) | — |
| `addresses` | customer | own | own | own |
| `properties` | customer | own + assigned professional | own | own |
| `property_assets` | customer (via property) | own | own | own |
| `service_requests` | customer | own + assigned professional | own | — |
| `bookings` | booking workflow | customer + professional | professional only | — |
| `jobs` | job workflow | customer + professional | professional only (direct); both via RPC | — |
| `job_events` | system | customer + professional (own job) | system only (no user policy) | — |
| `inspections` | professional | customer + professional (own job) | professional only | — |
| `quotes` | professional | customer + professional (own job) | professional (pending only) | — |
| `quote_items` | professional | customer + professional (own job) | professional (via own quotes) | — |
| `payments` | customer | own + admin/support | server only | — |
| `audit_logs` | system | own user_id | own user_id (server-role: any) | — (immutable) |
| `professional_profiles` | professional | own + verified (public) | own | — |
| `professional_availability` | professional | own + verified public | own | own |
| `professional_skills` | professional | own + verified public | own | — |
| `service_categories/services` | admin | public (catalogue) | admin/server | — |

**Admin access:** Uses service-role Supabase client (`src/lib/supabase/admin.ts`) which bypasses RLS entirely. This is intentional and correct — admin operations are controlled at the application layer (admin layout auth check + server action authorization).

---

## 4. Negative Case Test Results — 12/12 PASS ✅

Test data created for isolation testing:
- Job `a0000001` assigned: customer.a → professional.a (property: Apartment 3B)

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Customer B reads Customer A's property (`fb3744f4`) | DENY (0 rows) | ✅ PASS |
| 2 | Customer A reads Customer B's property (`8b68d51e`) | DENY (0 rows) | ✅ PASS |
| 3 | Professional B reads job assigned to Professional A | DENY (0 rows) | ✅ PASS |
| 4 | Customer B reads Customer A's job | DENY (0 rows) | ✅ PASS |
| 5 | Customer A directly UPDATEs job `current_state` | DENY (0 rows affected, state unchanged) | ✅ PASS |
| 6 | Professional A reads their own assigned job | ALLOW (1 row) | ✅ PASS |
| 7 | Professional A reads property during active job | ALLOW (1 row) | ✅ PASS |
| 8 | Professional B reads unassigned property | DENY (0 rows) | ✅ PASS |
| 9a | Customer A inserts audit log with Customer B's user_id | DENY (0 rows inserted) | ✅ PASS |
| 10 | Customer A self-elevates role to 'admin' | DENY (trigger + RLS blocks) | ✅ PASS |
| 11 | Customer A reads own property + job | ALLOW | ✅ PASS |
| 12 | Customer A directly UPDATEs booking status | DENY (status unchanged) | ✅ PASS |

---

## 5. Remaining Considerations

- **Admin SELECT bypass on jobs/properties:** Admin dashboard uses service-role client which bypasses RLS. This is the correct pattern — no broad "admin can read everything" RLS policy exists (which would be dangerous if service-role key ever leaked to client bundle).
- **`job_events` write:** No INSERT policy for regular users — system-only inserts via `transition_job_state()` SECURITY DEFINER function. This is correct.
- **Payments INSERT:** No user INSERT policy — payments are created server-side only. Correct.
- **Quotes UPDATE after approval:** Approved quotes (`status = 'approved'`) are now fully immutable from the professional's perspective via RLS.

---

## 6. SQL Reference (Test Queries)

```sql
-- Simulate user context for RLS testing
SELECT set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);
SELECT set_config('role', 'authenticated', true);

-- Then run your query — RLS applies as if user <uuid> is calling
SELECT * FROM public.properties WHERE id = '<property_id>';
```
