# Phase 4 — Authorization & Ownership Verification

## Summary

All server actions in `/src/app/customer/actions.ts` implement defense-in-depth authorization through:

1. **App-layer ownership check** — verify `customer_id = auth.getUser().id` before returning data
2. **RLS enforcement** — database policies prevent cross-customer access even if app-layer check is bypassed
3. **Audit trail** — all mutations (quote approval/decline) recorded via `transition_job_state()` RPC

---

## OWNERSHIP CHECK: Implemented Actions

### 1. fetchCustomerProperties()
**Ownership enforcement:**
- App layer: verifies `owner_customer_id = user.id` before querying
- Database layer: RLS policy `properties_select_own` enforces `owner_customer_id = auth.uid()`
- Error handling: returns empty array + error message if authentication fails

**Guarantee:** Customer can only fetch their own properties; cross-customer queries are denied at both layers.

---

### 2. fetchCustomerJobs()
**Ownership enforcement:**
- App layer: verifies `customer_id = user.id` before querying
- Database layer: RLS policy `jobs_select_own` enforces `customer_id = auth.uid()` OR `professional_id = auth.uid()` (for assigned professionals)
- Error handling: returns empty array if authentication fails

**Guarantee:** Customer sees only their own jobs; queries return empty result if user is not authenticated.

---

### 3. fetchJobDetails(jobId: string)
**Ownership enforcement:**
- App layer, step 1: verifies `customer_id = user.id` before fetching full details
- App layer, step 2: if ownership check fails, returns 401 error ("Not authorized")
- Database layer: RLS policy `jobs_select_own` enforces ownership at query boundary
- Error handling: logs error, returns `{ data: null, error: 'Not authorized to view this job' }`

**Guarantee:** Customer A cannot read Customer B's job details; access denied at app layer before expensive query.

---

### 4. fetchJobTimeline()
**Ownership enforcement:**
- App layer: verifies `customer_id = user.id` before querying completed jobs
- Database layer: RLS policy `jobs_select_own` filters to owned jobs only
- Error handling: returns empty array + error message if authentication fails

**Guarantee:** Timeline shows only the authenticated customer's completed jobs.

---

### 5. fetchRecentActivityEvents()
**Ownership enforcement:**
- App layer, step 1: queries jobs table to find job IDs owned by `customer_id = user.id`
- App layer, step 2: uses resulting job ID list to filter job_events table
- Database layer: RLS policies enforce ownership on both jobs and job_events tables
- Error handling: returns empty array if no jobs found; skips events if lookup fails

**Guarantee:** Activity feed shows only events from the authenticated customer's jobs; cross-customer events are not accessible.

---

## respondToQuoteAction(payload) — Mutation Security

**Ownership enforcement:**
- Step 1: verifies `customer_id = user.id` AND `current_state = 'quote_pending'` before accepting quote decision
- Step 2: updates `quotes` table (RLS ensures job→customer match)
- Step 3: calls `transition_job_state()` RPC with `p_actor_user_id = user.id`
  - RPC validates actor is customer before allowing transition
  - RPC records audit event with immutable metadata (timestamp, actor, decision)
  - RPC returns error if transition is illegal for current job state

**Guarantee:** Customer can approve/decline only their own quotes; no cross-customer mutations possible. All changes are immutable, timestamped, and audited.

---

## RLS Policies — Database Layer Defense

All policies are defined in `/supabase/migrations/` and active on the Fixify Supabase project:

| Table | Policy | Enforced Condition |
|-------|--------|-------------------|
| `properties` | `properties_select_own` | `owner_customer_id = auth.uid()` |
| `jobs` | `jobs_select_own` | `customer_id = auth.uid() OR professional_id = auth.uid()` |
| `jobs` | `jobs_update_restricted` | requires `transition_job_state()` RPC (no direct updates) |
| `quotes` | (inherited from job) | joined via `job_id`, RLS cascade enforces ownership |
| `job_events` | (inherited from job) | joined via `job_id`, RLS cascade enforces ownership |

---

## Testing Recommendations

### Test Case 1: Customer A cannot see Customer B's properties
```
Precondition: Two distinct customer accounts (A and B)
Action: Customer A calls fetchCustomerProperties()
Expected: Returns only properties where owner_customer_id = A's user ID
Verify: No properties owned by Customer B are returned
```

### Test Case 2: Customer A cannot see Customer B's jobs
```
Precondition: Two distinct customer accounts with active jobs
Action: Customer A calls fetchCustomerJobs()
Expected: Returns only jobs where customer_id = A's user ID
Verify: No jobs from Customer B's account are returned
```

### Test Case 3: fetchJobDetails rejects unowned job ID
```
Precondition: Job owned by Customer B
Action: Customer A calls fetchJobDetails(jobIdBelongingToB)
Expected: Returns { data: null, error: 'Not authorized to view this job' }
Verify: App-layer check prevents query execution
```

### Test Case 4: Quote approval enforces ownership
```
Precondition: Quote on job owned by Customer B
Action: Customer A calls respondToQuoteAction({ jobId: B's job, decision: 'approved' })
Expected: Returns { success: false, error: 'Job not found or access denied' }
Verify: Ownership check prevents unauthorized state transition
```

### Test Case 5: Invalid job ID returns 401
```
Precondition: No job exists with ID "nonexistent-job"
Action: Customer A calls fetchJobDetails("nonexistent-job")
Expected: Returns { data: null, error: 'Job not found' }
Verify: Query fails gracefully, no information disclosure
```

---

## Audit Trail — respondToQuoteAction Mutations

Every quote approval/decline creates an immutable audit event via `transition_job_state()` RPC:

```
Event type: 'quote_approved' or 'quote_declined'
Event metadata:
  - actor_user_id: authenticated customer ID
  - quote_id: the quote being approved/declined
  - reason: optional customer-provided reason
  - timestamp: server-generated, immutable
  - to_state: resulting job state ('in_progress' or 'assigned')
```

**Guarantee:** All quote decisions are logged with actor identity, quote ID, and timestamp. Events cannot be modified or deleted by customers; they are immutable audit records.

---

## Conclusion

Phase 4 server actions enforce customer data isolation through:

1. **Authenticated identity verification** — every action requires valid Supabase session
2. **Ownership validation** — app layer checks `customer_id = user.id` before data access
3. **RLS enforcement** — database layer prevents queries that violate ownership policies
4. **Audit logging** — all mutations recorded with actor, timestamp, and metadata
5. **Error handling** — unauthorized access returns errors, not cached/stale data

**Result:** Customer A cannot access, see, or modify any data belonging to Customer B or any other customer. The system enforces isolation at multiple layers, ensuring security even if one layer is compromised.
