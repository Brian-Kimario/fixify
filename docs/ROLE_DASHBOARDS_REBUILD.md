# Feasy — Customer & Professional Rebuild Guide

A phased build guide for Claude Code. It covers a full system check and rebuild of the **customer** and **professional** roles: navigation, dashboards, matching, job tracking, messaging, payments/earnings and trust.

> **Status of this document.** It was produced by scanning the codebase, not by building anything. Section 2 lists findings with file references. Anything marked **CONFIRM** was not read during the scan and must be verified in Phase 0 before you rely on it. Do not assert it.

---

## 0. How to use this guide

1. Work **one phase at a time**, in order. Each phase ends with acceptance criteria. Do not start the next phase until they pass.
2. Start every phase by re-reading: `CLAUDE.md`, `AGENTS.md`, and the relevant guide under `node_modules/next/dist/docs/` (Next 16: `proxy.ts` replaces middleware, async request APIs, etc.).
3. Commit per phase (or per sub-step). Never commit `.env.local` or secrets.
4. Out of scope: support ticketing / support queue (explicitly deferred by the owner), admin dashboards (only touch admin where a phase needs a read path).

### Ground rules (from `CLAUDE.md`, restated because they bite here)

- Server Components by default; `'use client'` only for state/effects/browser APIs.
- `createClient()` (`src/lib/supabase/server.ts`) for user-scoped data. `createAdminClient()` only in admin actions and webhooks, and re-check the caller's role first.
- Job state changes **only** through `supabase.rpc('transition_job_state', ...)`. Never `.update({ current_state })`.
- Never trust client input for ownership, amounts or roles. Derive from session and DB.
- Validate every server action / API input with **Zod** (not installed yet; Phase 0 adds it; schemas go in `src/validators`).
- Never return `{ success: true }` from a `catch`. Return a typed error result (see `signInWithEmail` in `src/app/auth/actions.ts` for the house pattern: `{ ok:false, code, message }`).
- No `any`, no `@ts-ignore`. Use `Database` types from `src/lib/supabase/database.types.ts`; regenerate after every migration.
- Colours from design tokens (Tailwind 4 `@theme`: `porcelain, paper, ink, ink-2..4, teal, teal-deep, teal-wash, clay, line, line-strong, sand, ochre, success…`). **No new hex literals.** Editorial headings use `font-editorial`.
- Internal navigation uses `next/link`. Reuse `@/components/ui` before creating a component.
- New tables ship RLS policies **in the same migration**. Migration names: `YYYYMMDD_NNN_description.sql` (next free series: `20261030_001`…).
- Debug/test endpoints gated by `NODE_ENV !== 'production'`.
- **Core product rule for this rebuild: every number, label and claim in the UI must trace to a column or query.** If the backend cannot support it, the UI does not show it. No invented fees, schedules, ratings, ETAs, "verified" badges or policies.

### Migration deployment (important)

- Apply with `supabase db query --linked -f supabase/migrations/<file>.sql` against project `azmajqztvcuwajaaldqm`.
- **Never `supabase db push`** (migration history is out of sync with the folder).
- After each migration: regenerate types, run `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test`.
- Test accounts: use `E2E_TEST_PASSWORD` from the environment. Never write the password into code, docs or chat.

---

## 1. Product model (the "heart")

The product is a **trust-and-tracking layer between a household and a tradesperson**. Everything below serves one loop:

```
Request → Match → Offer → Accept → Visit → Inspect/Quote → Approve → Work → Complete → Pay → Review → Payout
```

Three questions the UI must always answer, for both roles, on every screen:

| | Customer asks | Professional asks |
|---|---|---|
| **Now** | What is happening with my job? | What do I need to do next? |
| **Next** | What do I need to decide or pay? | When/where is my next job? |
| **Proof** | Who is coming, are they verified, what did I agree to? | What am I owed and when? |

### Lifecycle → state → who acts → what each side sees

Source of truth: `transition_job_state()` and `job_events` (`supabase/migrations/20261029_004_transition_job_state_guard.sql` and earlier). Valid transitions:

| From | To | Actor |
|---|---|---|
| assigned | accepted, cancelled | professional (accept), either (cancel) |
| accepted | on_the_way, cancelled | professional |
| on_the_way | arrived, cancelled | professional |
| arrived | in_progress, cancelled | professional |
| in_progress | quote_pending, completed, cancelled | professional |
| quote_pending | in_progress, cancelled | customer (via `respond_to_quote`) |
| completed | closed | system on payment |
| cancelled | closed | system |

DB state values are **lowercase snake_case**. The UI must map them to human copy in **one** shared module (Phase 0), used by both roles.

### Principle: one case file, two views

Booking + job + quote + messages + payment + review are a single **case file**. Build one shared `JobCase` data loader and timeline component; the customer and professional pages render role-appropriate views of it (different actions and different private fields, same facts). Today these are two unrelated implementations.

---

## 2. Verified current-state audit

### 2.1 Navigation and shell

- Customer nav is 4 items (Dashboard, Bookings, Properties, Support): `src/app/customer/layout.tsx`. Professional nav is 4 (Today, Jobs, Earnings, Profile, bottom-only): `src/app/professional/layout.tsx`. Both are rendered by `src/components/shared/AppNavLinks.tsx` (`TopNavLinks` + `BottomNavLinks`) with `SignOutMenu`.
- No notification bell, no unread counts, no "Book a service" shortcut, no availability control in the header, no active-job indicator.
- **Dead code:** `src/components/shared/AppNavbar.tsx` (550 lines) is referenced nowhere. It has stale `?tab=` links and a fake availability dot. Delete it (Phase 0), harvesting ideas only.
- Both layouts use hex literals (`bg-[#F7F4EC]`, `#FFFEFA`, `#D9DED8`) instead of tokens.
- Routes that exist but are unreachable from nav: `/professional/bids`, `/professional/onboarding`, `/customer/settings`, `/customer/profile`.

### 2.2 Customer

- `src/app/customer/page.tsx` (~410 lines): `CustomerDashboardContent({ user, profile }: any)`.
  - **BUG:** active-job query uses `.not('current_state','in','("CLOSED","COMPLETED","cancelled")')` (line ~111) and the same filter at `src/app/customer/actions.ts:354`. DB states are lowercase, so `completed` and `closed` jobs are **not excluded** and can show as "active". Also `.limit(1)` means a second concurrent job is invisible.
  - Uppercase state names also appear in `src/components/ui/Pill.tsx`, `Timeline.tsx`, `Badge.tsx` (mismatch with DB).
- **No cancel / reschedule UI.** `cancelBooking()` in `src/lib/services/bookings.ts:233` has no callers and is broken: it calls `transition_booking_state`, which does not exist in the live DB. The only working path is `transition_job_state(... 'cancelled')` (customer allowed from `assigned/accepted/on_the_way/arrived/quote_pending`). It does not change `booking_status` and touches no payment (none exists before completion). An unmatched booking (no job) has no cancel path. *(Verified in Phase 0; see findings.)*
- **Fabricated policy:** `src/app/customer/support/page.tsx:32-33` says "cancel up to 24 hours before… may incur a fee". There is no such rule or fee in the backend.
- Booking creation (`src/app/customer/bookings/new/actions.ts`): decent (price read from DB, property ownership checked, calls `assign_booking`). Issues: hand-rolled input checks (no Zod), `throw new Error` for expected failures, `Math.random` booking reference (collision-prone; use a DB sequence or `gen_random_uuid` derived code), no problem description/photos captured here. `ProblemIntake` writes a `service_requests` draft, but **nothing links it to a booking** (`service_request_id` is never set), so the customer's problem text never reaches the professional. `service_requests` is effectively orphaned.
- Large components needing review before reuse: `BookingWizard.tsx` (671), `QuoteApprovalPanel.tsx` (457), `ActiveJobPanel.tsx` (346), `ProblemIntake.tsx` (332), `UPIIntentCheckout.tsx` (289).
- Customer routes: `/customer`, `bookings`, `bookings/[id]`, `bookings/new`, `payments/result/[paymentId]`, `profile`, `profile/edit`, `properties`, `settings`, `support`.

### 2.3 Professional

- `src/app/professional/page.tsx`: `jobs: any[]`. "Requests" = `assigned`; "route" = `accepted/on_the_way/arrived/in_progress/quote_pending`. "Today's Route" is just the active-job list: it is **not** sorted by, nor filtered to, today's schedule. The `AvailabilityToggle` only renders in the non-empty state, so a pro with no jobs cannot go on/offline from the dashboard.
- `src/app/professional/earnings/page.tsx` contains **fabricated copy** with no backend: "Payout Schedule: Weekly (Every Friday)", "Platform Fee: Standard 5%", "Disbursement: Direct Bank / UPI". There is no payout table, fee config or bank/UPI account for professionals.
  - "Total Completed Value" is **gross** job value, not what the pro earns.
  - "Pending payouts" is actually **in-progress quote value**, not money owed.
- `src/app/professional/actions.ts` (932 lines) is a grab-bag: `getProfessionalJobs, getJobById, getProfessionalProfile, getServiceCatalogue, transitionJobState, getEarningsData, getProfessionalEarningsLedger, getVerificationStatus, getProfessionalAvailability, updateAvailabilityStatus, getProfessionalSkills, fetchEligibleRequests, acceptRequest, declineJobAction, getJobCustomerContact, fetchJobDetail, submitInspectionAction, createQuoteAction`.
  - `getProfessionalEarningsLedger` builds amounts from jobs + quotes + bookings (approved quote total, else `quoted_or_base_amount`), **not from `payments`**, with no fee deduction.
  - `recentTransactions` uses `quotesList[0]`, which is not necessarily the approved quote.
- `/professional/bids/page.tsx` shows the pro's quotes titled "My Bids". Matching is **push assignment, not bidding**, so the name is wrong, and the page is not in the nav. Mixed hex/token styling.
- Pro routes: `/professional`, `bids`, `earnings`, `jobs`, `jobs/[id]`, `onboarding`, `profile`, `profile/edit`.
- Large components: `StateTransitionButtons.tsx` (375), `QuoteForm.tsx` (365), `JobInspectionAndQuote.tsx` (341), `VerificationUpload.tsx` (363), `ActiveJobPanel.tsx` (346).

### 2.4 Matching (`assign_booking`, `_pick_professional`, `decline_job`, `process_assignment_queue`)

Migrations: `004_create_bookings_and_jobs`, `003_create_professionals_and_verification`, `20261029_002_booking_assignment_and_decline`, `20261029_003_area_match_preference`.

- Mechanism: one pro is offered the job at a time, offer lasts 30 minutes (`offer_expires_at`), declines/expiries recorded in `booking_assignment_attempts`, retried by cron `/api/cron/assignment-queue`.
- Hard filters: verified, `is_available`, skill (service **or** category), same **city**, inside working-hours windows (no schedule = unrestricted), no other job within ±2h, not previously declined/expired for this booking.
- Ranking: exact area match → fewest active jobs → `rating_average` → user_id (arbitrary tie-break).
- **Unused signals:** `radius_km`, latitude/longitude, `skill_level`. Rating is effectively always 0 (no reviews exist), so ranking by it is meaningless today.
- Gaps: customer never sees who was offered/chosen or why; no reputation signals (response time, acceptance rate, completion/cancel rate, repeat customers); no multi-offer / race to accept; no urgency tier.
- **Empty pool (verified):** `_release_offer` deletes the **job** row (its `job_events` cascade with it) and nulls `bookings.professional_id`; the **booking stays `pending`**, it is not deleted. `process_assignment_queue` retries it only while `scheduled_start > now()`; after that it stays `pending` forever. The customer is never notified.
- **The queue is not scheduled.** There is no `vercel.json` and no `pg_cron`; `/api/cron/assignment-queue` runs only if something outside the repo calls it. Without it, offers never expire.

### 2.5 Quotes, contact, payments

- `respond_to_quote` is atomic: approve or decline both resume `in_progress`. `get_job_customer_contact` releases customer contact/address only after accept (good; preserve this and extend to messaging).
- Payments: provider abstraction (Mock/Razorpay) in `src/lib/payments/*`; `createUPIIntentPayment`; `/api/payments/create`; `/api/webhooks/razorpay`.
  - Webhook (`src/app/api/webhooks/razorpay/route.ts`): signature verified, then **broken against the live DB**. It looks up `payments.razorpay_order_id` (column does not exist), calls `transition_payment_status` (function does not exist, cast `as any`) and inserts into `invoices` (table does not exist). The first query fails, the handler throws, and the route returns 200 after logging. **A payment can never be marked paid today.** `createUPIIntentPayment` stores the Razorpay order id in `provider_reference`.
  - `/api/payments/create` (provider abstraction) has no callers, does not check job state, and duplicates `createUPIIntentPayment`.
  - The booking page shows `quoted_or_base_amount` on the Pay button, but the server charges the approved quote total, so the two can differ.
  - `payments` table: `currency DEFAULT 'USD'` (product is INR; 0 rows live), no `professional_id`, no platform-fee / net split, no payout linkage. RLS: only customer or admin/support can read, so **a professional cannot read the payment for their own job**.
  - Several payment migrations in the folder (`20261002_001/002`, `20261004_001..003`) were never applied live. See findings §A.
  - Pricing models on `services`: `fixed`, `inspection`, `quote_after_inspection`; amount lives in `bookings.quoted_or_base_amount`.
- Homepage copy promises "approve the quote and pay by UPI **only when the work is done**". The payment flow must honour that: pay-after-completion, not up-front.

### 2.6 Not built at all (verified by grep: no tables/UI under role code)

Job-scoped messaging · reviews/ratings · cancel/reschedule UI + rules · disputes/refunds · professional payout accounts, settlements, payout ledger · platform-fee configuration · notification delivery (no `notifications` table; `notification_logs` gets customer-only `pending` rows from a trigger, `sendNotification` has no callers, and the preferences UI writes `profiles` columns that do not exist) · proof-of-work photos and on-site start/finish codes (no storage buckets exist) · realtime (publication is empty) · customer view of professional profile · saved/favourite professionals · professional service-area/schedule management UI (`professional_availability` and `professional_service_areas` tables exist with own-row RLS; no UI edits either).

Also broken today: the professional **availability toggle** calls `update_professional_availability`, which does not exist live.

### 2.7 Code-quality baseline (role code: `app/customer`, `app/professional`, `lib/services`)

~1,538 hex literals · ~34 `any` · ~108 `console.*` · manual validators, no Zod · `strict: false` (known debt; do not widen it, and prefer tightening touched files).

### 2.8 CONFIRM in Phase 0 — resolved

All items below were verified on 2026-10-29; results are in `docs/ROLE_DASHBOARDS_REBUILD.findings.md` and folded into §2.2–2.6 above. Additional findings: the migrations folder and the live DB have drifted (findings §A); RLS policies `jobs_update_professional_own` and `bookings_update_professional_own` let a professional write `current_state` and amounts directly, bypassing `transition_job_state` (findings §C).

Original list: `src/lib/payments/*`, `src/app/api/payments/create/route.ts`, `UPIIntentCheckout.tsx` · `customer/bookings/[id]/page.tsx` and `professional/jobs/[id]/page.tsx` · `StateTransitionButtons.tsx` · `invoices` schema and who can read it · notifications/`notification_preferences` tables · realtime enablement on the Supabase project · storage buckets and policies (photos, verification docs) · `process_assignment_queue` empty-pool behaviour · what `ProblemIntake` writes and how it joins to bookings · whether `service_requests` (`src/lib/services/service-requests.ts`) is live or legacy.

---

## 3. Phases

Each phase lists: **Goal · Schema · Services/server · UI · Tests · Acceptance**. Keep migrations small, one concern each, RLS included.

---

### Phase 0 — Baseline, bug fixes, foundations

**Goal:** a trustworthy base. No new features; remove wrongness.

1. **Read & confirm.** Work through §2.8 and amend this document where reality differs. Record findings in a short `docs/ROLE_DASHBOARDS_REBUILD.findings.md`.
2. **Single state vocabulary.** Create `src/lib/jobs/states.ts`:
   - `JobState` type. `jobs.current_state` has no enum or CHECK, so it cannot be derived from `Database`; define it from the `transition_job_state` body and keep the two in sync (a test asserts the list).
   - `STATE_META: Record<JobState, { label; customerCopy; proCopy; tone; terminal; step }>`.
   - Helpers `isActive(state)`, `isTerminal(state)`, `ACTIVE_STATES`, `PRO_ROUTE_STATES`.
   - Rewrite `Pill`, `Timeline`, `Badge` to consume it; **delete uppercase state strings**.
3. **Fix the active-job bug** in `customer/page.tsx` and `customer/actions.ts:354` using `ACTIVE_STATES` (`.in('current_state', ACTIVE_STATES)`), and return **all** active jobs (list, not `.limit(1)`).
4. **Fix `quotes[0]`** in `getProfessionalEarningsLedger`/`recentTransactions`: select the approved quote explicitly.
5. **Relabel dishonest UI now** (before the full rebuild): remove the fabricated payout-schedule/fee/disbursement block, rename "Pending payouts", mark gross vs net honestly, remove the 24h-cancellation FAQ claim until Phase 3 defines a real rule.
6. **Install Zod** (`pnpm add zod`), create `src/validators/{booking,job,quote,profile,payment}.ts`, and a shared `ActionResult<T>` type: `{ ok: true; data: T } | { ok: false; code: string; message: string; fieldErrors?: Record<string,string> }`. Convert `createBookingAction`, `submitProblemIntakeAction`, `respondToQuoteAction`, `createQuoteAction`, `submitInspectionAction`, `acceptRequest`, `declineJobAction` to Zod + `ActionResult` (no throws for expected failures, no success-in-catch).
7. **Currency:** migration to set `payments.currency DEFAULT 'INR'` and backfill/verify existing rows; add `src/lib/money.ts` (`formatINR(paise|rupees)`; **decide and document one unit** — recommend integer paise in new tables, rupees only at display).
8. **Booking reference:** replace `Math.random` generation with a DB-side unique generator (sequence-backed `FS-######`).
9. **Delete** `src/components/shared/AppNavbar.tsx`.
10. **Remove `as any`** from the Razorpay webhook. Regenerating types will not help: `transition_payment_status`, `invoices` and the `razorpay_*` columns do not exist live. The webhook must be rewritten against the live schema (look up by `provider_reference`), or its repair deferred to Phase 5 (owner decision).

**Acceptance:** `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` green; a completed job never shows as active for the customer; no fabricated payout/fee text anywhere in role code; grep for uppercase state literals returns none.

---

### Phase 1 — Design system, app shell and navigation IA

**Goal:** clean, role-relevant navigation designed around real user flows; a shared shell both roles use.

**Shared shell** (`src/components/shell/`): `RoleShell`, `TopBar`, `BottomBar`, `NotificationBell`, `UserMenu`, `PageHeader`, `EmptyState`, `StatTile`, `Section`. Token-only styling; 44px touch targets; focus rings; skip link; works at 375px; no horizontal scroll.

**Customer navigation (by common flows):**

| Flow | Entry |
|---|---|
| "Something broke" | Persistent **Book a service** primary button (top bar + mobile FAB), deep-links to `/customer/bookings/new` |
| "Where's my pro?" | **Active job** chip in top bar (shows state + opens case file) when ≥1 active job |
| Review a quote / pay | **Needs your action** inbox on dashboard + bell count (quote waiting, payment due, review due) |
| History/receipts | Bookings (tabs: Active · Upcoming · Past) |
| Home records | Properties |
| Help | Support (stays "coming soon"; support ticketing is out of scope) |

Top bar: Home · Bookings · Properties · Messages (Phase 4) · bell · user menu (Profile, Settings, Sign out). Mobile bottom bar: Home · Bookings · **Book (centre)** · Messages · Account.

**Professional navigation:**

| Flow | Entry |
|---|---|
| Start of day | **Today** (jobs sorted by `scheduled_start`, next-up card, availability toggle) |
| New work | **Requests** with live offer countdown (30-min window from `offer_expires_at`) |
| In the field | Active job card pinned in the bar when a job is live |
| Money | **Earnings** (Phase 5) |
| Talk to customers | Messages (Phase 4) |
| My business | **Profile & Settings**: Services & skills, Service area, Working hours, Verification, Payout details (Phase 5) |

Top bar: Today · Requests (count) · Jobs · Earnings · Messages · bell · **availability switch (always visible, even with zero jobs)** · user menu. Mobile bottom bar: Today · Requests · Jobs · Earnings · Account.

Rules: show a nav item only if its page is real. Counts/badges come from queries (`count` with RLS), never constants. Unverified professionals see a persistent, honest **verification status banner** (pending / rejected / documents needed) from real `verification` data, and Requests is disabled with an explanation.

**Dashboards (rebuild):**
- Customer: Needs-your-action list → Active jobs (all of them, with progress rail) → Upcoming → Recent completed → Properties summary → Quick book by popular service. Empty state is a guided first booking, not a blank page.
- Professional: Availability + verification strip → Next job → Requests (with countdown) → Today's schedule → This week earnings (real, from Phase 5 ledger; until then show only what is truthfully derivable) → Rating/completion (real, hidden while zero reviews).

**Tests:** Playwright for each role: nav items render and route; mobile bottom bar at 375px; unverified pro sees banner; availability toggle works with zero jobs.

**Acceptance:** zero hex literals in `layout.tsx` for both roles and the shell; every nav item resolves to a real page; badge counts match DB; Lighthouse a11y ≥ 95 on both dashboards.

---

### Phase 2 — Matching v2 ("right pro for the problem")

**Goal:** connect the customer to a professional who can actually solve the problem, with transparency.

**Schema (one migration per concern):**
- `professional_service_areas` **already exists** (`professional_id, city, area, radius_km, is_active`, own-row RLS) but nothing reads or writes it. Extend it with `base_lat`, `base_lng`; customers read only via security-definer functions.
- Extend `professional_skills` use: `skill_level`, `years_experience`; ensure indexed by `service_id`/`category_id`.
- `professional_metrics` (materialised or view, refreshed by trigger/cron): `acceptance_rate`, `median_response_seconds`, `completion_rate`, `cancel_rate`, `jobs_completed`, `repeat_customer_count`, `rating_average`, `rating_count`. Computed only from real `job_events`/`booking_assignment_attempts`/`reviews`.
- `bookings`: add `problem_summary`, `urgency` (`flexible|today|emergency`), and a structured link to intake (after CONFIRM).

**Matching function (`_pick_professional` v2):**
1. Hard filters (keep): verified, available, skill, working hours, ±2h conflict, not previously declined/expired.
2. Geography: replace city-only with distance (haversine on stored coordinates) ≤ pro `radius_km`; fall back to city match when coordinates are missing and say so in the attempt log.
3. Score (documented, weights in a `matching_config` table, not magic numbers): proximity, skill level fit for service complexity, response time, acceptance rate, completion rate, rating **only when `rating_count` ≥ threshold** (otherwise neutral), workload, repeat-customer affinity (prior good job with this customer's household).
4. Urgency tiers: `emergency` offers to top N simultaneously (first accept wins, others auto-expire atomically via row lock); `flexible` stays sequential.
5. Log the ranking inputs per attempt in `booking_assignment_attempts` (explainability + tuning).
6. **Empty pool:** never silently delete. Keep the booking `unassigned`, notify the customer, offer reschedule/widen-window, surface in admin. Verify and fix the current delete-on-exhaustion behaviour.

**Customer-facing:** after match, the case file shows a **Professional card**: name, trade/skills, verified badge (from real status), years of experience, completed jobs, rating (only when real), response time. Never show phone/address (pre-accept contact rules unchanged). Optional: customer may **decline a proposed pro once** ("ask for a different pro") with a reason, bounded to avoid abuse.

**Professional-facing:** request card shows service, problem summary, area (not full address until accept), scheduled window, estimated pay basis, countdown. Decline requires a reason code (feeds metrics).

**Tests:** SQL/vitest tests for the matcher (seed pros with differing distance/skill/response) asserting ordering and filters; e2e: booking → offer → decline → next pro → accept; unmatched path produces customer-visible state and notification.

**Acceptance:** ranking is explainable from `booking_assignment_attempts`; no job is ever lost silently; rating does not influence ranking until real reviews exist.

---

### Phase 3 — Unified job tracking (case file)

**Goal:** one logical, trustworthy way for both sides to follow work from booking to completion.

**Shared:** `src/lib/jobs/case.ts` loader returns `{ booking, job, property(masked per role), service, professional(public), customer(masked until accepted), quote(s), payment, events, messages, review }`. `JobTimeline` component driven by `job_events` with plain-language copy per role from `STATE_META`.

**Progress model (identical for both roles; wording differs):**
Requested → Matched → Accepted → On the way → Arrived → Inspecting → Quote sent → Approved → In progress → Completed → Paid → Reviewed.
Derive "Inspecting/Quote sent/Approved" from `quote_pending` + `quotes.status` (do not add DB states unless the transition function genuinely needs them; if it does, change `transition_job_state` in a migration with tests).

**Add:**
- **Start/finish codes:** `job_codes` (job_id, start_code_hash, finish_code_hash). Customer sees a 4-digit code on arrival; pro enters it to move `arrived → in_progress`. Finish confirmation (customer confirms or auto-confirm after N hours, documented in `app_config`). Server-validated; attempts rate-limited **in the DB**, not in memory.
- **Proof of work:** `job_media` (job_id, uploader_id, kind `before|after|part|receipt`, storage_path, created_at) with a private Storage bucket and RLS (customer + assigned pro + admin). Pro uploads before/after; customer sees them in the case file.
- **ETA / live status:** pro taps "On the way" with an optional ETA window (stored, not computed from fake data). No live GPS in v1 (state it; avoid pretending).
- **Cancel & reschedule with real rules:** `cancellation_policy` (config table: free window hours, fee amount/percent per `pricing_model`, applies to which states). One RPC `cancel_job(job_id, reason_code, note)` and `reschedule_booking(booking_id, new_start)` that enforce the policy server-side, call `transition_job_state`, write `job_events`, and notify the other party. Customer UI shows the exact fee **computed from the policy before confirming**. Professional cancellations require reason codes and count in metrics. Replace the placeholder FAQ with text generated from the same config.
- **Delays/no-show:** pro "running late" event; customer "pro didn't arrive" report after a grace period → reassigns automatically (re-run matcher) and logs against the pro.

**Customer case-file page** (`/customer/bookings/[id]`): header (service, ref, state), progress rail, professional card, schedule, property (own address), problem + media, quote panel (itemised, approve/decline), messages thread, payment/invoice, actions (cancel/reschedule/confirm completion/report issue/review).

**Professional case-file page** (`/professional/jobs/[id]`): same facts plus customer contact/address (post-accept only), **one primary next action button** driven by state (Accept → On the way → Arrived → Enter code → Inspect/Quote → Mark complete), job notes, media upload, earnings preview for this job (Phase 5).

**Tests:** e2e full path with two browser contexts (customer + professional); RLS tests asserting a customer cannot see another's job/media and a pro cannot see jobs they were not assigned.

**Acceptance:** both roles see the same timeline facts; every action is an RPC with `job_events`; cancel fees shown are exactly what is charged; no client-computed money.

---

### Phase 4 — Communication and notifications

**Goal:** talk without leaking private contact details; never miss a state change.

**Schema:**
- `job_messages` (id, job_id, sender_id, body, attachment_path nullable, created_at) + `job_message_reads` (job_id, user_id, last_read_at). RLS: only the job's customer and assigned pro (and admin read for disputes). Chat opens at **accepted**, closes read-only N days after `closed`.
- `notifications` (id, user_id, kind, job_id, title, body, data jsonb, created_at, read_at) with RLS (own rows). Does not exist. `notification_logs` exists (delivery log, customer-only, written by `on_job_state_transition`); decide whether to keep it as the outbound-delivery log beside the new in-app table.
- Enable Supabase Realtime on `job_messages` and `notifications` (publication) and verify RLS applies to realtime.

**Server:** `sendMessage` (Zod, length cap, rate limit in DB), `markThreadRead`, `listThreads` (with unread counts). Emit notifications from DB triggers on `job_events` (assigned, accepted, on the way, arrived, quote sent, quote decision, completed, payment received, cancelled, new message) so they cannot be skipped by a code path.

**Delivery:** in-app bell (Phase 1) first. Email via Supabase/SMTP and SMS/WhatsApp **only** where preferences (`NotificationPreferences.tsx`) and provider credentials exist; otherwise do not claim them. Respect quiet hours as already described in that component (payment failures and cancellations bypass). Add `.env.example` entries for any provider variables.

**UI:** Messages inbox (threads by job, unread badge), in-case-file thread, canned quick replies for pros ("On my way", "Running 10 min late", "Need access to meter room"), automatic system messages for state changes inline in the thread. Phone numbers stay hidden; add a click-to-call only if a masked-number provider is later added (out of scope now; do not fake it).

**Tests:** two-context e2e: message arrives in realtime; unread counts clear; a third user cannot read the thread.

**Acceptance:** messaging unavailable pre-accept; bell counts equal unread rows; no PII in notification payloads beyond what the recipient may already see.

---

### Phase 5 — Payments and earnings (the money model)

**Goal:** a coherent, auditable payment structure that is shown truthfully and drives professional earnings.

**Decisions required from the owner before building (see §5):** platform fee %, payout cadence/minimum, whether inspection fee is charged up-front, cancellation fees, refund policy. Put every decision in config tables, not code constants.

**Recommended structure (pay-after-work, matching the homepage promise):**
1. Booking creation records the **price basis** (`fixed` price / `inspection` fee / `quote_after_inspection`).
2. On completion + customer confirmation, a **payment request** is created for: approved quote total (or fixed price) + any approved extras − nothing implied.
3. Customer pays by UPI (Razorpay). Webhook marks `paid`, closes job, issues invoice.
4. The system records the **split at payment time**: `gross`, `platform_fee`, `tax_on_fee` (only if the business actually charges it; CONFIRM with owner), `net_to_professional`.
5. Net accrues to the pro's **ledger**; a payout job settles it per cadence; the pro sees each step.

**Schema:**
- `platform_fee_config` (id, effective_from, percent_bps, min_fee_paise, applies_to pricing_model) — versioned so history is reproducible.
- `payments`: add `professional_id`, `gross_paise`, `platform_fee_paise`, `net_paise`, `fee_config_id`, `refunded_paise`; set `currency` INR; add RLS so the **assigned professional can read their own payment rows** (select only, limited columns via view if needed).
- `professional_payout_accounts` (pro_id, type `upi|bank`, masked display, provider_ref, verified_at). **Never store raw account/UPI secrets beyond what the provider tokenises**; encrypt or keep only provider references. RLS: own row.
- `earnings_ledger` (id, pro_id, job_id, payment_id, kind `job_earning|adjustment|refund_clawback|payout`, amount_paise signed, status `pending|available|paid_out`, available_at, created_at). Insert only via security-definer functions called from the webhook / payout job. Append-only (no update/delete policies).
- `payouts` (id, pro_id, amount_paise, status `scheduled|processing|paid|failed`, provider_ref, period_start, period_end, failure_reason). RLS: own read.
- Refund/dispute: `refunds` (payment_id, amount, reason, status, created_by) and `disputes` (job_id, opened_by, reason, status, resolution) with admin-only resolution. Keep this minimal; admin tooling is out of scope beyond a read path.

**Server:**
- `src/lib/payments/` stays provider-agnostic; add `splitPayment(gross, feeConfig)` as a pure, unit-tested function (rounding rule documented: round fee half-up to paise, remainder to the pro).
- Webhook becomes idempotent (unique `provider_payment_id`), fully typed (no `any`), returns non-2xx for genuinely retryable DB failures and 200 for already-processed; writes ledger rows in the same transaction as the payment transition.
- Payout cron `/api/cron/payouts` gated by a shared secret header (like the assignment cron). Initially can create `scheduled` payouts and mark `paid` via admin until a payout provider (e.g. Razorpay Route/X) is integrated; the UI must say "Paid manually by Feasy" / "Scheduled" per real status, never imply automation that doesn't exist.

**Customer UI:** payment step shows breakdown (service total; fees only if charged to customer), UPI intent flow, result page, invoice download; refunds shown on the booking.

**Professional Earnings page (rebuilt, all from the ledger):**
- Tiles: *Available to pay out*, *Pending (jobs not yet paid)*, *Paid out (period)*, *Lifetime net*. Each labelled with its exact definition.
- Per-job rows: gross, platform fee, net, status, date; link to case file.
- Payouts list with status and reference; payout account management; fee schedule **read from `platform_fee_config`**.
- Period filter, CSV export, empty state that explains how earnings appear.
- In the job's earnings preview (Phase 3): "You'll earn ≈ ₹X after Y% fee" computed from current config and the approved quote; labelled as an estimate.

**Tests:** unit tests for `splitPayment` (rounding, min fee); integration tests: webhook idempotency, replayed event does not double-credit, refund creates clawback row; RLS tests (pro sees only own ledger/payouts; customer cannot read ledger).

**Acceptance:** every figure on Earnings reconciles to ledger rows; sum(ledger) − sum(payouts) equals "available + pending"; no hard-coded fee, cadence or method text.

---

### Phase 6 — Reviews, reputation and trust

**Goal:** make matching and customer confidence rest on real outcomes.

**Schema:** `reviews` (job_id UNIQUE, customer_id, professional_id, rating 1–5, tags[], comment, created_at, edited_at nullable, pro_reply, status). RLS: customer writes once for their `closed` job; both parties read; professional may reply once; admin moderates. Trigger updates `professional_metrics` (`rating_average`, `rating_count`). `favourite_professionals` (customer_id, pro_id) for rebooking.

**UI:** review prompt appears in the case file and via notification after payment; star + tags (punctual, tidy, explained clearly, fair price) + comment; professional public profile card (stats from `professional_metrics` only; hide rating until `rating_count` ≥ threshold); "Book again" shortcut that biases matching to that pro when available.

**Acceptance:** `rating_average` reflects only real rows; a customer cannot review a job they didn't have or twice; ranking weight for ratings turns on only past threshold.

---

### Phase 7 — Role workspaces

**Professional workspace** (`/professional/settings/*`): Services & skills (with `skill_level`), Service area (city/area/radius), Working hours, Verification (status + upload, from `VerificationUpload`), Payout account, Notification preferences, Quote templates (reusable line items with price defaults the pro owns). Availability: on/off plus "pause until" date. Replace `/professional/bids` with **Quotes** (the pro's sent quotes by status) or fold it into Jobs; rename honestly and put it in the IA.

**Customer workspace:** Properties (access notes, floor/lift/gate instructions the pro sees post-accept), Saved professionals, Payment history & invoices, Notification preferences, Household profile.

**Acceptance:** every field the matcher uses is editable by its owner; every editable field is used by something real.

---

### Phase 8 — Hardening and release

- Tokenise all remaining hex in role code (aim 0); remove `any` (aim 0 in touched files); replace `console.*` with a small `logger` (structured, level-gated, no PII) in server code and delete debug logs.
- Accessibility pass (labels, focus order, contrast on `teal`/`porcelain` and the pro `ink` theme, reduced motion, 44px targets).
- Performance: server-render dashboards, parallelise independent queries with `Promise.all`, add indexes for every new filter (`bookings(customer_id,booking_status)`, `jobs(professional_id,current_state)`, `job_messages(job_id,created_at)`, `earnings_ledger(pro_id,status)`), paginate lists, avoid N+1 in `fetchCustomerJobs`.
- Security review: RLS test matrix for every new table (customer A/B, pro A/B, admin, anon); webhook replay; cron secret; storage policies; rate limits **in DB** (the in-memory limiter is known debt, don't extend it).
- Full e2e: customer books → pro accepts → arrives → code → quote → approve → work → complete → pay → webhook → review → ledger → payout; plus cancel, decline-chain, unmatched, refund paths. Mobile viewport variants.
- Rollout checklist: migrations applied in order via `db query`, types regenerated, env vars in `.env.example`, feature flags (`app_config`) for Messaging, Payout automation, and Matching v2 so each can be switched off.

---

## 4. Cross-cutting checklists

**Definition of done for any screen**
- Data from a typed service function in `src/lib/services/*` (no inline queries in pages).
- Loading, empty, error, and no-permission states exist and are honest.
- Works at 375px and 1280px; keyboard navigable; no hex; no `any`.
- Every displayed number/label has a source (column/query/config). Reviewers: spot-check three.
- Zod on every mutation; typed `ActionResult`; no thrown errors for expected cases.

**RLS test matrix (each new table)**: owner reads/writes own · other customer denied · other pro denied · assigned pro allowed only where specified · admin allowed · anon denied.

**Do not**: add UI for something the backend lacks · compute money in the client · reintroduce uppercase states · write `.update({ current_state })` · push migrations · store the test password anywhere.

---

## 5. Open decisions for the owner (block Phase 5 and parts of 3)

1. **Platform fee:** percentage / flat / tiered? Who bears it (deducted from pro, added to customer)? Any GST on the fee?
2. **Payout:** cadence (daily/weekly/on-demand), minimum payout, method (UPI/bank), and whether payouts are manual at launch.
3. **Inspection fee:** charged up-front at booking, or folded into the final bill? Refundable if the customer declines the quote?
4. **Cancellation policy:** free window, fees by state (before accept / after on-the-way / after arrival), pro-cancel penalties.
5. **Payment timing:** confirm pay-after-work (matches homepage) vs. hold/escrow.
6. **Dispute handling:** who arbitrates (admin vs. support) and time limits — support ticketing is currently deferred.
7. **Reviews:** minimum count before ratings influence ranking and display (default suggestion: 3).
8. **Emergency jobs:** do they exist at launch, and is there a surcharge?
9. **Auto-confirm completion:** hours after which an unconfirmed completion is accepted (suggestion: 24h).

---

## 6. Suggested order of work and sizing

| Phase | Scope | Risk | Depends on |
|---|---|---|---|
| 0 | Fixes, Zod, state module, honesty pass | Low | — |
| 1 | Shell, nav, dashboards | Low–Med | 0 |
| 2 | Matching v2 | High (DB logic) | 0 |
| 3 | Case file, codes, media, cancel/reschedule | High | 0, 1, owner decisions 4, 9 |
| 4 | Messaging + notifications | Med | 3 |
| 5 | Money model + earnings | **Highest** | 3, owner decisions 1–5 |
| 6 | Reviews & reputation | Med | 3, 5 |
| 7 | Workspaces | Low–Med | 2, 5 |
| 8 | Hardening & release | Med | all |

Phases 1 and 2 can run in parallel (UI vs. DB) in separate branches if desired, provided they do not touch the same files.
