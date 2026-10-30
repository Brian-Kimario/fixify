# Fixify — Pre-Production Audit Report (Revision 2)

**Status:** audit complete for the scope in §2; items not exercised are listed in §7 as NOT RUN, never as passed. No application code was changed. Nothing was pushed or deployed. The shared test password was used only at sign-in forms and the Auth API for the five test accounts and is not recorded anywhere in this repo.

## 1. Release-readiness verdict

| Target | Verdict |
|---|---|
| Controlled external testing | **NOT READY** — resolve R0 items first |
| General production | **NOT READY** |

Reasons: (1) the deployed build is 70 commits behind the audited code; (2) debug and test-login pages are public; (3) `audit_logs` can be forged by any signed-in user (now live-confirmed); (4) the customer "Cancel booking" feature calls a database function that does not exist; (5) test and real users share one database. The core job flow (offer → accept → travel → codes → quote → complete → pay), cross-user isolation, payment amount derivation and storage rules all held up under live, state-changing testing.

## 2. Scope, baseline and environment

- Audited commit `2c847af`, branch `main`, run locally; Supabase project `azmajqztvcuwajaaldqm` (shared DB). Razorpay test mode only; no real money, SMS, WhatsApp or email.
- **Baseline recovery reference:** local tag `fixify-pre-remediation-baseline-20261030` at `2c847af`. Secret scan clean; `pnpm build` passes.
- **Branches:** `audit/preproduction-remediation` (local, cut from `2c847af`, holds this report only). `main` is 70 commits ahead of `origin/main`. **Nothing has been pushed.**
- **Deployment trigger:** the Vercel project (`prj_7pjuH3XlxqDp0VxPWsiQONhwuB0d`) auto-deploys Production on pushes to `main`; no `vercel.json` overrides this. Pushing `main` now would publish F-02/F-04 exposures, so it was not done. Pushing a branch triggers only a Preview deploy; also not done pending your approval.
- Method: Node scripts signing in as each of the five users and calling PostgREST, RPC and Storage; the in-app browser for UI journeys; read-only SQL via the Supabase MCP; fixture cleanup via exact IDs.

## 3. Findings

Severity: CRIT / HIGH / MED / LOW / INFO. Each finding states role, workflow, expected, actual, repro, evidence, cause, fix and verification.

### R0 — security and blockers

**F-01 HIGH — Stale deployment.** Role: all. Workflow: release. Expected: deployed = audited code. Actual: `origin/main` is 70 commits behind; `/api/cron/assignment-queue` and `/api/cron/job-media-sweep` return 404 on `fixify-amber.vercel.app` while pg_cron targets the deployed `app_url`; start/finish codes and no-show are undeployed. Repro: `git log origin/main..HEAD`; `curl -i <deploy>/api/cron/assignment-queue`. Cause: unpushed work. Fix: deploy with approval after R0 fixes. Verify: cron route returns 401 without secret; re-run this audit on the deployed commit.

**F-02 HIGH — Public debug/test pages (violates Rule 12).** Role: anonymous. Expected: unreachable in production. Actual: `/auth/debug` and `/auth/test-login` return 200; test-login shows one-click buttons for the test customer, professional and admin. Repro: GET both paths. Cause: no guard in `src/app/auth/test-login/page.tsx`. Fix: `notFound()` when `NODE_ENV === 'production'` or delete; rotate the shared test password. Verify: 404 on the deployment.

**F-04 HIGH (upgraded from MED) — `audit_logs` forgery confirmed live.** Role: any authenticated user. Expected: only trusted server code writes audit rows. Actual: customer.a inserted `AUDITR2_FORGED_admin_override` (HTTP 201) with arbitrary `action` and `changes`, and read it back; inserting with another user's `user_id` was blocked (403). Repro: POST `/rest/v1/audit_logs` with own `user_id`. Evidence: row `699783ed-6326-4814-807f-f9ea0bedd27f`. Cause: public INSERT policy `user_id = auth.uid()`. Fix: drop the policy; write via SECURITY DEFINER or service role. Verify: same POST returns 403.

**F-03 MED — Shared test/real database.** Tester actions (bookings, queue, notifications) can reach real users (3 non-`@fixify.dev` auth users exist). Fix: staging Supabase project before external testing.

**F-09 MED — Leaked-password protection disabled** (advisor). Fix: enable.

**F-11 LOW — Trigger functions `on_job_state_transition`, `sync_profile_email` executable by `anon`**, two with mutable `search_path`. Fix: REVOKE EXECUTE, set `search_path`.

### R1 — deployment, infrastructure, engineering

**F-18 HIGH — Customer "Cancel booking" is broken.** Role: customer. Workflow: cancel booking. Expected: booking and any job cancelled. Actual: `cancelBooking()` (`src/lib/services/bookings.ts:165`) calls RPC `transition_booking_state`, which does not exist (`pg_proc` count 0); the API returns 404 "Could not find the function". There is no other customer path to cancel a booking that has no job. The call also carries `@ts-ignore`, which is why the type-check missed it. Repro: call the RPC as customer.a for FS-000014. Fix: add the missing migration (with RLS-safe ownership checks) or route through an existing function; remove `@ts-ignore`. Verify: customer cancels an unmatched booking and a matched one; Customer B is rejected.

**F-19 HIGH — Orphan jobs that nobody can cancel.** Actual: after the only offered professional declines, the job stays `assigned` with `professional_id = null`. A customer cancel then fails with `jobs_professional_required` check-constraint (HTTP 400, raw DB message). Evidence: jobs `7153294b-…` (FS-000014) and `bb392dfc-…` (FS-000019) remain in this state. Cause: decline path nulls the pro without moving the job to an unassigned or terminal state. Fix: define a state for "awaiting reassignment" or cancel on exhausted matching; allow cancel from it. Verify: decline then cancel succeeds.

**F-20 MED — Booking status never follows job state.** `bookings.booking_status` stays `pending` after the job is `closed` (FS-000012), `completed` (FS-000013) or `cancelled` (FS-000015/16). Only `pending` and `confirmed` exist in the data. Customer lists that read booking status will show wrong labels. Fix: sync via transition function; verify on every terminal job state.

**F-05 MED — Stuck unmatched booking** `BK-1791118258770-65966` (scheduled 5 Oct) still open; the queue re-tries every minute and never expires bookings. During this audit it also kept re-offering my cancelled fixtures until their booking status was set directly. Fix: expiry rule, customer notification, admin close action.

**F-21 MED — Single open offer blocks all matching for that professional.** While Pro B held an unanswered offer, further `assign_booking` calls returned `matched:false` even for different bookings. May be intended capacity, but undocumented and not surfaced to the customer. Owner decision needed.

**F-22 MED — Admin cancel through the user-scoped RPC is rejected.** `transition_job_state` called with the admin session and a valid admin `actor_user_id` returns 400 "Not allowed to change this job" (job unchanged at `accepted`). `src/lib/services/admin.ts` is the intended path; the admin UI cancel action was **not** exercised end to end (see §7). Verify via UI before release; if admin cancel only works with the service client, confirm the caller's role is re-checked.

**F-06 MED — CSP allows `'unsafe-inline'` / `'unsafe-eval'`; `payment=*`.** Fix: nonce CSP.

**F-07 MED — `strict: false`; `ignoreBuildErrors` unless `CI` set.** F-18 shows the practical cost. Fix: `CI=true` on Vercel, enable `strict` incrementally.

**F-08 MED — Lint fails:** 329 problems (240 errors, 89 warnings). Fix: triage, add CI gate.

### R2 — core functionality and behaviour

**F-23 MED — Business errors surface as HTTP 500.** "Property not found", "Job not found", rate-limit and non-owner calls (ETA, quote, no-show by wrong customer, decline by non-assignee) return 500 instead of 4xx. Hampers monitoring and client handling. Fix: map to 400/403/404/429 codes.

**F-24 LOW — Misleading ETA error:** "can only be shared before you arrive (state: accepted)" when ETA is valid only in `on_the_way`.

**F-25 MED — Cancellation rules undefined.** Customer can cancel at `quote_pending` with no reason or fee; a professional can cancel at `accepted` and `arrived` with no reason (HTTP 200 for Pro B at `accepted`, no reason); a professional can move a cancelled job to `closed`, setting `closed_at` equal to `cancelled_at`. Owner decision needed on fees, mandatory reasons and terminal states.

**F-26 MED — Code lockout with no reissues left can strand a job** (`in_progress`/`arrived`); no admin recovery path found. Fix: admin override action with audit.

**F-13 LOW — Mixed job reference formats** (`FS-…`, `BK-…`, `TEST-001`) and completed jobs with no amount. Fix: normalise; require amount at completion.

**F-14 LOW — `GET /auth/logout` does not sign out.** Fix: POST action plus explicit GET handler.

**F-12 LOW (downgraded)** — `assign_booking` is owner-scoped (`bookings.customer_id = auth.uid()`); other SECURITY DEFINER RPCs rejected tampering. Remaining RPC bodies still warrant a line review.

### R3 — UX, accessibility, performance, regression

**F-10 MED (UX)** — mobile booking wizard overflowed at 375px; fixed in `2c847af`, recheck on deploy. "Completed (current step)" label is misleading.
**F-16 LOW** — ~350 `console.*` calls. **F-17 INFO** — four RLS-no-policy tables (service-only, consistent); 24 unindexed FKs. **F-15 LOW** — sparse test data.

## 4. Functional coverage matrix

| # | Scenario | Result |
|---|---|---|
| C1 | Customer books service (own property) | VERIFIED |
| C2 | Book against another user's property | VERIFIED blocked |
| C3 | Direct INSERT into bookings | VERIFIED blocked |
| C4 | Auto-assign / unmatched retry | PARTIALLY VERIFIED (F-05, F-21) |
| C5 | Cancel booking | **FAILED** (F-18) |
| C6 | Cancel job pre-accept | VERIFIED (customer.a, job `233450a0-…`); Customer B and Pro A rejected |
| C7 | Cancel at `quote_pending` | PARTIALLY VERIFIED (allowed; rules undefined, F-25) |
| C8 | Quote approve / decline | VERIFIED for create/validation; approved/declined decisions re-run NOT confirmed after enum fix — see §7 |
| C9 | Start/finish code (view, 5 attempts, lock, reissue) | VERIFIED; lock-out recovery FAILED (F-26) |
| C10 | Pay (pending payment, tamper, duplicate) | VERIFIED (sandbox); webhook capture NOT RUN |
| C11 | Messaging (2000 cap, empty, idempotency, XSS-as-text, rate limit) | VERIFIED; rate-limit status code FAILED (F-23) |
| C12 | Media upload (MIME, size, participant-only) | VERIFIED |
| C13 | Report no-show | PARTIALLY VERIFIED — guard enforced ("30 minutes after scheduled start"), bad preference rejected, wrong customer rejected; happy path NOT RUN (needs a job 30+ min past start) |
| C14 | Professional accept / decline | VERIFIED (valid codes; "other" needs note; non-assignee rejected) |
| C15 | ETA | PARTIALLY VERIFIED (F-24) |
| C16 | Pro cancel at accepted / arrived | PARTIALLY VERIFIED (accepted allowed with no reason; arrived NOT RUN, pro busy) |
| C17 | Concurrent double accept | VERIFIED (one winner) |
| C18 | Forged `p_actor_user_id`, invalid transitions | VERIFIED blocked |
| C19 | Admin sees queue/jobs/professionals | VERIFIED (UI) |
| C20 | Admin cancel / reassign / verify actions | **BLOCKED** at RPC level (F-22); UI actions NOT RUN |
| C21 | `audit_logs` integrity | **FAILED** (F-04) |
| C22 | Notifications privacy/read-state | NOT RUN |
| C23 | Logout / debug pages | FAILED (F-14, F-02) |
| C24 | Playwright E2E | NOT RUN (needs env password) |
| C25 | 375px customer/pro dashboards | VERIFIED |
| C26 | Pro B browser journey, 768px layout, a11y tooling, perf | NOT RUN |

## 5. Verified positives
Cross-user isolation on 12 tables for five users; foreign-property booking blocked; outsider/forged-actor transitions rejected; concurrent accept resolves to one winner; payment amount re-derived server-side; one pending payment per job; `job-media` private bucket with size/MIME rules; queue/health visible to admin; build, `tsc`, 189 Vitest tests pass; no secrets in repo.

## 6. Fixture inventory and cleanup
Audit-run ID: **AUDITR2**. All fixtures belong to customer.a/pro.a/pro.b test users; no real-user data touched.

| Ref | Booking id / Job id | Final state | Decision |
|---|---|---|---|
| FS-000012 | job `b0315a20-5d8e-4912-8a6f-2a39494da58d` | closed | retained as audit history |
| FS-000013 | job `acc169ad-417a-437d-9b66-a85c498aea2a` | completed | retained; pending payment `0c6b82fa-8e79-4914-b826-eba29f5f16fe` (₹349, sandbox) and storage object `job-media/acc169ad-417a-437d-9b66-a85c498aea2a/c-AUDITR2.png` retained |
| FS-000014 | job `7153294b-a7cc-4575-9574-7ac4bbca2507` | booking `cancelled`; job `assigned`, no pro | **orphan retained** — cannot be cancelled through the API (F-19) |
| FS-000015 | job `233450a0-0cf9-4023-9dd3-8a660bb41a30` | job cancelled by customer | retained |
| FS-000016 | job `7a208bb1-98b4-4a11-aeef-a400c77399b9` | job cancelled by Pro B | retained |
| FS-000017, FS-000018 | no job | booking `cancelled` | retained |
| FS-000019 | job `bb392dfc-1e2f-4243-8c5e-6dd05ffbf281` | booking `cancelled`; job `assigned`, no pro | **orphan retained** (F-19) |
| audit_logs | `699783ed-6326-4814-807f-f9ea0bedd27f` | forged row | retained as evidence |

Cleanup mechanics: unmatched bookings were set `cancelled` by SQL restricted to exact booking references with the `AUDITR2-C` summary prefix, because the intended cancel RPC is missing (F-18). Nothing was hard-deleted. Notification rows created by these journeys went only to test accounts.

## 7. Not run / blocked (not passed)
Admin mutating actions through the UI; no-show happy path; pro cancel at `arrived`/`on_the_way`; final quote approve/decline re-run; notification read/unread and privacy; Razorpay webhook capture; overdue booking expiry; Playwright E2E; Pro B browser journey; 768px; automated accessibility; performance benchmarks.

## 8. Roadmap
- **R0:** gate/remove debug pages and rotate test password; drop `audit_logs` INSERT policy; revoke anon execute on trigger functions; enable leaked-password protection; staging DB; do not deploy `main` until done.
- **R1:** add `transition_booking_state` migration (F-18); fix orphan jobs (F-19); sync booking status (F-20); unmatched-booking expiry (F-05); decide capacity rule (F-21); verify admin cancel path (F-22); `CI=true`, lint gate, `strict`; deploy and re-audit.
- **R2:** HTTP status mapping (F-23); cancellation/fee policy (F-25); lock recovery (F-26); ETA message; references and amounts.
- **R3:** nonce CSP; logout route; `console.*` cleanup; FK indexes; label polish; 768px, a11y and perf passes.

## 9. Owner decisions needed
1. Is pushing the audit branch (Preview deploy only) approved? Is a staging Supabase project available?
2. May I begin R0 fixes on `audit/preproduction-remediation`?
3. Capacity rule: may a professional hold only one open offer?
4. Cancellation fees and mandatory reasons for customers and professionals.
5. Expected lifecycle for unmatched bookings past start time.

## 10. R0 remediation status (branch `audit/preproduction-remediation`)

| Item | Status | Evidence |
|---|---|---|
| R0-01 `audit_logs` integrity | **Closed** (migration `20261030_102_r0_security_hardening.sql`, applied to the shared DB) | Forged inserts rejected for customer A/B, pro A/B, admin and anon (live suite); UPDATE/DELETE affect 0 rows; TRUNCATE blocked; users read only their own rows; forged evidence row `699783ed-…` retained; logout events still written (service role, session-derived user id) — browser sign-out as customer.b produced a `logout` row. |
| R0-02 debug / test-login | **Closed** | `/auth/debug`, `/auth/test-login`, `/api/auth/test`, `debug-check` deleted (not just hidden); 404 on dev server; absent from the production build output. |
| R0-03 SECURITY DEFINER review | **Closed for known issues** | Only `on_job_state_transition()` and `sync_profile_email()` were executable by anon/authenticated without need; EXECUTE revoked, `sync_profile_email` search_path pinned. Internal `_*` helpers are not executable by anon/authenticated. Legitimate flow (booking → assign → accept → cancel) still writes `job_events` and `notification_logs`. |
| R0-04 auth hardening | **Partly closed; owner actions remain** | Hard-coded test password removed from the working tree (scripts use `E2E_TEST_PASSWORD`; report redacted). Login/logout verified in browser. Open redirects are handled by `validateNextParam`. **Owner:** rotate the shared test password (it remains in git history of earlier commits) and enable leaked-password protection in the Supabase dashboard (not settable by SQL). GET `/auth/logout` bypass stays R3 (F-14). |
| R0-05 regression tests | **Done** | `src/__tests__/r0-security.test.ts` (7, static) and `tests/security/r0-live.test.ts` (16, live, skipped without credentials). |

**Verification:** `pnpm tsc --noEmit` clean; production build passes (`CI=1`, run with `NODE_ENV` unset — see risk below); full Vitest 196 passed, 16 skipped (live); live suite 16/16; eslint on changed files 0 errors, 2 pre-existing warnings in `signout.ts` (unused `SupabaseClient`, `CACHE_PATTERNS`). Repo-wide lint was not run to completion and is not claimed to pass.

**Remaining risks:** shared DB for any Preview; password still in git history; leaked-password protection off; `.env.local` sets `NODE_ENV`, which breaks `next build` with a prerender error when exported into the shell — never set it in Vercel env; F-18/F-19/F-20 (cancellation RPC missing, orphan jobs, booking/job status drift) are open and are the first R1 priority.

**Payment `0c6b82fa-…` (₹349):** row is `pending`, `paid_at` null, `provider_reference` `AUDITR2-fake-order` — no Razorpay order exists behind it, so no funds can have been captured. The webhook verifies an HMAC signature and matches on `provider_reference`, so a real Razorpay event cannot complete it. Job FS-000013 is `completed` while the payment is `pending`: an intentional audit fixture, not production drift.

**Fixture added:** AUDITR3-R0 booking `468a7afe-947f-4c57-8149-d15deb4c5ad5` / job `d8f11c77-dbde-4eda-9654-b40ee239d6e8` — job cancelled via the RPC, booking set `cancelled` by exact id; retained.

**Staging requirements (no resources provisioned):** a second Supabase project (free tier is enough for synthetic data; Pro if PITR is wanted), all `supabase/migrations/` applied in order, Auth settings mirrored (redirect URLs, leaked-password protection), synthetic users with a fresh password, storage buckets `job-media` with the same size/MIME rules, Razorpay test keys and a staging webhook secret, pg_cron/queue jobs disabled or pointed at staging, Vercel Preview env vars scoped to Preview only, deployment protection on.
