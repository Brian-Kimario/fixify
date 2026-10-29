# Role dashboards rebuild — Phase 0 findings

Verified on 2026-10-29 against the code on `main` (304920c) and the live Supabase project
`azmajqztvcuwajaaldqm` (read-only queries). This resolves every **CONFIRM** in
`ROLE_DASHBOARDS_REBUILD.md` §2.8, §2.2 and §2.6. Where the guide was wrong it has been
corrected in place.

There is no `README.md` in the repository; corrections were made to the rebuild guide itself.

---

## A. The headline: migrations folder ≠ live database

`supabase/migrations/` has 24 files; the live migration history has 9 rows. Several files in
the folder were never applied, and their objects do not exist live:

| File | Objects it would create | Live |
|---|---|---|
| `20261002_001` | `payments.razorpay_order_id`, `razorpay_payment_id`, `upi_*` | missing |
| `20261002_002` | `invoices` table | missing |
| `20261003_001` | `profiles.notification_preferences`, `whatsapp_number` | missing |
| `20261004_001..003` | `transition_payment_status`, `transition_booking_state`, `transition_professional_verification_status`, `update_professional_availability`, `payment_events`, `booking_events`, `professional_verification_events` | missing |
| `20261004_007` | hardened `jobs`/`bookings` UPDATE policies | missing (and its `WHERE id = id` subqueries are buggy; do not re-apply as written) |
| `20261005_001` | `properties.status` | missing |
| `20261029_005` | `handle_new_user` change | not in history; unconfirmed |

**Rule going forward:** the live DB is the source of truth. New migrations start at
`20261030_001` and are written against live, not against the unapplied files.

Code that depends on the missing objects and is therefore broken today:

- **Razorpay webhook** (`src/app/api/webhooks/razorpay/route.ts`) looks up
  `payments.razorpay_order_id` (does not exist) → query errors → it throws → the catch logs and
  returns **200**. A payment can never be marked paid, the job never moves to `closed`, and
  the `invoices` insert would fail anyway. `createUPIIntentPayment` stores the order id in
  `provider_reference`, which is what the webhook should look up.
- **`cancelBooking`** (`src/lib/services/bookings.ts:233`) calls `transition_booking_state`
  (missing). No callers.
- **`updateAvailabilityStatus`** (`src/app/professional/actions.ts:522`) calls
  `update_professional_availability` (missing). It is wired to `AvailabilityToggle`, so **the
  professional availability toggle is broken in production**.
- **`NotificationPreferences`** / `updateNotificationPreferences` write
  `profiles.notification_preferences` (missing).
- `src/lib/supabase/database.types.ts` is stale (no `booking_assignment_attempts`, no newer
  RPCs); it does not reflect live. Regenerate it in Phase 0.

## B. §2.8 items

### Payments (`src/lib/payments/*`, `/api/payments/create`, `UPIIntentCheckout`)
- `createUPIIntentPayment(jobId)` (server action, the live path): requires
  `current_state = 'completed'`, checks job ownership, amount = approved quote `total`, else
  `bookings.quoted_or_base_amount`; converts to paise for Razorpay, stores rupees; reuses a
  pending order (idempotent); enforces the ₹1,00,000 UPI limit; inserts `currency 'INR'`
  explicitly. Uses `any` on `rzp.orders`; returns `{ success }`; throws inside
  `resolveAmountPaise`.
- Provider abstraction (`get-provider.ts`, Mock/Razorpay) is used **only** by
  `/api/payments/create`, which has **no callers** but is reachable by POST. It does not check
  job state, so a customer could create a payment row for an unfinished job. Recommend deleting
  it (Phase 0) rather than hardening a second path.
- `UPIIntentCheckout` shows the `displayAmountRupees` prop (from `quoted_or_base_amount` on the
  booking page), while the server charges the **approved quote total**. The displayed and
  charged amounts can differ. A `quote_after_inspection` booking with null base amount never
  shows a Pay button. Hex literals throughout, including Razorpay `theme.color`.
- `payments` live columns: `id, customer_id, booking_id, job_id, quote_id, payment_type,
  amount numeric, currency DEFAULT 'USD', provider, provider_reference UNIQUE, status DEFAULT
  'pending', paid_at, created_at, updated_at`. **0 rows**, so the currency default fix needs no
  backfill.
- RLS: `payments_select_own` = customer or admin/support. No insert/update policies (writes
  happen in SECURITY DEFINER / admin contexts). A professional cannot read their job's payment.

### Invoices
- The `invoices` table **does not exist**. Nobody can read it. The guide's description of the
  webhook "inserting invoices" describes intent, not reality.

### Detail pages and `StateTransitionButtons`
- `customer/bookings/[id]/page.tsx`: booking-status labels omit `confirmed` (present live);
  Pay section as above; professional card shows a ★ rating that is always 0 and the pro's phone;
  "We'll notify you" copy has no sender behind it; no cancel action; no quote panel; `as any`;
  hex literals.
- `professional/jobs/[id]/page.tsx`: local `STATE_LABELS`/`STATE_BADGE`/`TERMINAL_STATES`
  (wrongly treats `quote_pending` as terminal). Contact/address only after accept via
  `get_job_customer_contact` (correct).
- `StateTransitionButtons`: assigned → accept/decline; accepted/on_the_way/arrived → next or
  cancel; in_progress → complete or cancel (no `quote_pending` here; that goes via
  `JobInspectionAndQuote`). Decline → `declineJobAction` → `decline_job`. Others →
  `updateJobState` (`src/lib/services/jobs.ts`) → `transition_job_state`. Cancel takes no
  reason.
- A second, duplicate path `transitionJobState` exists in `professional/actions.ts:191`
  (throws on error). No callers found besides its definition; remove in Phase 0.

### `transition_job_state` (live body)
- Transitions: as in the guide's table. Customer may cancel from `assigned, accepted,
  on_the_way, arrived, quote_pending` (not `in_progress`) and may move `quote_pending →
  in_progress`. A null `auth.uid()` (service role) bypasses actor checks.
- `closed_at` is set when entering **`completed` or `cancelled`**, not `closed`. Looks like a bug;
  flag for Phase 3, do not depend on `closed_at`.
- Cancellation does not touch `bookings.booking_status`; the booking stays `confirmed`/`pending`.
- **There is no CHECK constraint or enum on `jobs.current_state`.** `JobState` cannot be derived
  from `Database` types; it must be defined from this function body (states: `assigned,
  accepted, on_the_way, arrived, in_progress, quote_pending, completed, cancelled, closed`).

### §2.2 Which cancel path is correct
- `transition_job_state(job, 'cancelled', uid)` is the only working path. `cancelBooking` is dead
  (missing RPC). Neither applies any fee or touches payments (no payment exists before
  completion). A booking with no job (unmatched) has **no** cancel path at all. Real cancel rules
  wait for §5 decision 4 (Phase 3).

### `process_assignment_queue` / empty pool
- When no professional is left, `_release_offer` **deletes the job row** (its `job_events`
  cascade), nulls `bookings.professional_id`, and leaves the booking `pending`. **The booking is
  not deleted** (the guide was wrong).
- `process_assignment_queue` retries pending, job-less bookings only while
  `scheduled_start > now()`. After that the booking stays `pending` forever (1 such booking
  live). The customer is never notified.
- The queue runs only when something POSTs `/api/cron/assignment-queue` with `CRON_SECRET`.
  There is **no `vercel.json` and no `pg_cron`** in the project, so nothing schedules it.
  Offers therefore never expire automatically unless an external scheduler exists outside the
  repo.

### Notifications
- No `notifications` table. `notification_logs` exists (12 rows, all `pending`, channel
  `whatsapp`), written by the trigger `trg_job_state_transition_notify` →
  `on_job_state_transition()` for the **customer only**; it maps `on_the_way`, `arrived` and
  `in_progress` all to `arrived`.
- `src/lib/notifications/send.ts` exports `sendNotification` with **no callers**. Nothing
  delivers anything. Preferences UI writes columns that do not exist.
- RLS: `notification_logs` readable by own customer and admin/support.

### Realtime
- The `supabase_realtime` publication contains **no tables**. No `.channel()` /
  `postgres_changes` usage in `src`.

### Storage
- **No storage buckets** and no storage policies. No `.storage` usage in `src`. Verification
  document upload (`VerificationUpload.tsx`) therefore cannot be storing files in Supabase
  Storage; to be checked when Phase 1/3 touches it.

### `ProblemIntake` / `service_requests`
- `ProblemIntake` → `submitProblemIntakeAction` inserts a `service_requests` row
  (`status 'draft'`, `input_text`, `normalized_summary` = first 160 chars). If the customer has
  no property it returns `{ success: true, requestId: null }` and writes nothing.
- The booking wizard and `createBookingAction` **never pass `service_request_id`**; nothing links
  intake to a booking. Live: 3 `service_requests` rows, all `open`, none linked.
- `src/lib/services/service-requests.ts` is only re-exported from `services/index.ts`; no page
  uses it. **`service_requests` is effectively legacy/orphaned.** The problem text the customer
  types never reaches the professional. Phase 2's "structured link to intake" should add
  `bookings.problem_summary` captured in the booking flow and retire the orphan path.

### §2.6 Working hours / service-area UI
- Tables exist: `professional_availability (day_of_week, start_time, end_time)` and
  `professional_service_areas (city, area, radius_km, is_active)` (no lat/lng), both with
  own-row RLS. `getProfessionalAvailability` reads availability; **there is no UI to edit
  either.** No code reads or writes `professional_service_areas`.

## C. Other findings from the audit

- **RLS lets professionals update `jobs` and `bookings` directly.** `jobs_update_professional_own`
  and `bookings_update_professional_own` have `USING/WITH CHECK professional_id = auth.uid()`
  with no column restriction, so a professional can set `current_state`, `quoted_or_base_amount`
  or `customer_id` from the browser and bypass `transition_job_state`. No app code relies on
  these policies (the only direct writes are in `admin/actions.ts` via the admin client).
- `quotes.status` default is `pending_customer`, live rows use `pending_customer_approval` and
  `approved`; `quotes_update_professional_pending` checks `'draft','pending_customer'`, so it
  never matches live pending quotes.
- `admin/actions.ts:307` writes `bookings.status` (column is `booking_status`) with values like
  `quote_approved`; that admin action cannot succeed. Admin is out of scope here; recorded only.
- `src/app/customer/page.tsx:~111` and `src/app/customer/actions.ts:354` filter
  `("CLOSED","COMPLETED","cancelled")` → completed/closed jobs show as active; dashboard uses
  `.limit(1)`. Bookings that have no job (unmatched/pending) are invisible on the dashboard.
- `src/components/shared/AppNavbar.tsx` has no importers; safe to delete.
- Live data: bookings `confirmed 3, pending 2`; jobs `completed 1, in_progress 1, cancelled 2`;
  quotes `approved 1, pending_customer_approval 2`; payments 0.
- Extensions: `plpgsql, pg_stat_statements, uuid-ossp, pgcrypto, supabase_vault`. No sequences in
  `public`.
