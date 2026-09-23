# FIXIFY — STATE MACHINES SPECIFICATION

## 1. Purpose

A state is a controlled business fact, not a frontend variable.

The client may display a state and request an allowed action. It must not decide whether a transition is legal.

Critical transitions must be validated by the server/database and recorded in the relevant event/audit history.

---

# 2. Primary Job State Machine

## 2.1 Canonical states

Primary flow:

```text
REQUESTED
MATCHING
ASSIGNED
ACCEPTED
ON_THE_WAY
ARRIVED
INSPECTION
AWAITING_APPROVAL
IN_PROGRESS
COMPLETED
PAYMENT_PENDING
CLOSED
```

Exception states:

```text
REJECTED
CANCELLED
EXPIRED
DISPUTED
SUSPENDED
```

Do not introduce a new job state without updating this document, tests and backend transition logic.

---

# 3. Job State Definitions

| State | Meaning |
|---|---|
| `REQUESTED` | Customer has created/requested a service |
| `MATCHING` | Fixify is finding an eligible professional |
| `ASSIGNED` | A professional has been assigned but has not necessarily accepted |
| `ACCEPTED` | Assigned professional accepted the job |
| `ON_THE_WAY` | Professional confirmed travel to the property |
| `ARRIVED` | Professional confirmed arrival |
| `INSPECTION` | Professional is inspecting the issue |
| `AWAITING_APPROVAL` | Additional work/cost requires customer authorization |
| `IN_PROGRESS` | Authorized work is being performed |
| `COMPLETED` | Operational work is finished and completion information is submitted |
| `PAYMENT_PENDING` | Final financial confirmation is pending |
| `CLOSED` | Service lifecycle is finalized |
| `REJECTED` | Professional declined or job was rejected in a defined flow |
| `CANCELLED` | Booking/job was cancelled under policy |
| `EXPIRED` | Time-bound workflow expired |
| `DISPUTED` | Job is under formal dispute handling |
| `SUSPENDED` | Job is temporarily halted by authorized operations |

---

# 4. Allowed Job Transitions

| From | To | Actor | Preconditions |
|---|---|---|---|
| `REQUESTED` | `MATCHING` | SYSTEM / ADMIN | Valid request |
| `MATCHING` | `ASSIGNED` | SYSTEM / ADMIN | Eligible professional found |
| `ASSIGNED` | `ACCEPTED` | PROFESSIONAL | Assigned, verified, eligible |
| `ASSIGNED` | `REJECTED` | PROFESSIONAL | Assigned professional may decline |
| `ASSIGNED` | `MATCHING` | SYSTEM / ADMIN | Reassignment required |
| `ACCEPTED` | `ON_THE_WAY` | PROFESSIONAL | Job is eligible to start travel |
| `ON_THE_WAY` | `ARRIVED` | PROFESSIONAL | Arrival confirmed |
| `ARRIVED` | `INSPECTION` | PROFESSIONAL | Authorized for job |
| `INSPECTION` | `IN_PROGRESS` | PROFESSIONAL / SYSTEM | No additional approval required |
| `INSPECTION` | `AWAITING_APPROVAL` | PROFESSIONAL / SYSTEM | Additional paid work requires approval |
| `AWAITING_APPROVAL` | `IN_PROGRESS` | SYSTEM | Valid quote approved by customer |
| `AWAITING_APPROVAL` | `INSPECTION` | SYSTEM / PROFESSIONAL | Quote declined or assessment must be revised |
| `IN_PROGRESS` | `COMPLETED` | PROFESSIONAL | Completion requirements satisfied |
| `COMPLETED` | `PAYMENT_PENDING` | SYSTEM | Final payable state determined |
| `PAYMENT_PENDING` | `CLOSED` | SYSTEM | Required financial closure conditions satisfied |
| eligible pre-work state | `CANCELLED` | AUTHORIZED | Cancellation policy allows |
| eligible state | `DISPUTED` | SYSTEM / ADMIN | Formal dispute opened |
| eligible state | `SUSPENDED` | ADMIN / SYSTEM | Operational/security intervention |

The exact cancellation/rescheduling/refund policy comes from `docs/PRODUCT_DECISIONS.md` and must not be invented by the UI.

---

# 5. Forbidden Direct Job Transitions

Unless explicitly added to this document, reject:

```text
REQUESTED → COMPLETED
REQUESTED → CLOSED
MATCHING → IN_PROGRESS
ASSIGNED → COMPLETED
ASSIGNED → IN_PROGRESS
ACCEPTED → COMPLETED
ON_THE_WAY → COMPLETED
COMPLETED → IN_PROGRESS
COMPLETED → REQUESTED
CLOSED → IN_PROGRESS
CLOSED → COMPLETED
```

The transition function must reject them.

---

# 6. Job Transition Authority

Use one authoritative operation conceptually equivalent to:

```text
transition_job_state(
  job_id,
  new_state,
  actor_user_id
)
```

The operation must:

1. Identify the actor.
2. Load the current job state.
3. Verify actor role/ownership/assignment.
4. Verify the transition is allowed.
5. Verify business preconditions.
6. Update the job state atomically.
7. Set relevant server timestamps.
8. Insert a `job_events` record.
9. Insert an `audit_logs` record when required.
10. Commit the operation transactionally.

Do not expose a generic client API such as:

```text
updateJob({ current_state: "..." })
```

for protected states.

---

# 7. Quote Dependency

Additional paid work must follow:

```text
INSPECTION
    ↓
quote created
    ↓
AWAITING_APPROVAL
    ↓
customer approves
    ↓
IN_PROGRESS
```

A declined quote must not authorize the quoted work.

A quote's existence is not equivalent to approval.

---

# 8. Job Event History

Every successful state transition creates an append-oriented event:

```text
job_id
from_state
to_state
actor_user_id
event_type
metadata
created_at
```

Example:

```text
REQUESTED → MATCHING
actor = SYSTEM
```

The event remains historical even if later operational state changes occur.

---

# 9. Service Request State Machine

Suggested states:

```text
DRAFT
READY
CONVERTED
CANCELLED
```

Transitions:

```text
DRAFT → READY
customer/system

READY → CONVERTED
system when booking is created

DRAFT → CANCELLED
customer/system where eligible

READY → CANCELLED
customer/system where eligible
```

A service request is not a completed job.

```text
SERVICE_REQUEST → BOOKING → JOB
```

---

# 10. Booking State Machine

Suggested states:

```text
DRAFT
PENDING_CONFIRMATION
CONFIRMED
ASSIGNED
RESCHEDULE_REQUESTED
CANCELLED
COMPLETED
EXPIRED
```

Allowed transitions:

```text
DRAFT → PENDING_CONFIRMATION
PENDING_CONFIRMATION → CONFIRMED
CONFIRMED → ASSIGNED
ASSIGNED → CONFIRMED          (if assignment is removed/reopened)
CONFIRMED → RESCHEDULE_REQUESTED
ASSIGNED → RESCHEDULE_REQUESTED
CONFIRMED → CANCELLED
ASSIGNED → CANCELLED
CONFIRMED → COMPLETED          (system, derived from job lifecycle)
ASSIGNED → COMPLETED           (system, only if lifecycle allows)
```

Booking status and job state are intentionally separate.

Example:

```text
Booking = CONFIRMED
Job     = ON_THE_WAY
```

Both can be true at the same time.

---

# 11. Professional Verification State Machine

States:

```text
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

Transitions:

```text
PENDING → DOCUMENTS_SUBMITTED
DOCUMENTS_SUBMITTED → UNDER_REVIEW
UNDER_REVIEW → VERIFIED
UNDER_REVIEW → REJECTED
REJECTED → DOCUMENTS_SUBMITTED
VERIFIED → SUSPENDED
SUSPENDED → VERIFIED
```

Only authorized verifier/admin operations may produce `VERIFIED`.

---

# 12. Professional Eligibility

`VERIFIED` alone does not make a professional eligible for a job.

Eligibility requires, as applicable:

```text
verification = VERIFIED
professional not suspended
correct service/category skill
service area match
availability match
```

Matching rules may add more factors later, such as workload or distance.

---

# 13. Quote State Machine

States:

```text
DRAFT
PENDING_CUSTOMER
APPROVED
DECLINED
EXPIRED
CANCELLED
```

Transitions:

```text
DRAFT → PENDING_CUSTOMER
PENDING_CUSTOMER → APPROVED
PENDING_CUSTOMER → DECLINED
PENDING_CUSTOMER → EXPIRED
DRAFT → CANCELLED
PENDING_CUSTOMER → CANCELLED
```

Actor rules:

```text
professional → create/submit eligible quote
customer     → approve/decline own active quote
system       → expire eligible quote
admin        → cancel/manage where policy permits
```

Only an unexpired `PENDING_CUSTOMER` quote belonging to the customer's job can be approved.

---

# 14. Payment State Machine

States:

```text
PENDING
PROCESSING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Transitions:

```text
PENDING → PROCESSING
PROCESSING → PAID
PROCESSING → FAILED
PAID → REFUNDED
PAID → PARTIALLY_REFUNDED
PARTIALLY_REFUNDED → REFUNDED
```

Payment status is controlled by verified provider/server events.

Never permit:

```text
frontend → status = PAID
```

---

# 15. Payment Idempotency

Duplicate provider webhooks must be safe.

```text
Webhook 1 → PAID
Webhook 2 → detected duplicate → no duplicate payment/invoice/earnings
```

Use a unique provider event/reference or equivalent idempotency mechanism.

---

# 16. Complaint State Machine

States:

```text
OPEN
UNDER_REVIEW
WAITING_CUSTOMER
WAITING_PROFESSIONAL
RESOLVED
ESCALATED
```

Transitions:

```text
OPEN → UNDER_REVIEW
UNDER_REVIEW → WAITING_CUSTOMER
UNDER_REVIEW → WAITING_PROFESSIONAL
WAITING_CUSTOMER → UNDER_REVIEW
WAITING_PROFESSIONAL → UNDER_REVIEW
UNDER_REVIEW → RESOLVED
UNDER_REVIEW → ESCALATED
ESCALATED → UNDER_REVIEW
ESCALATED → RESOLVED
```

The exact actor permissions are defined in `RBAC.md`.

---

# 17. Cancellation

Cancellation is policy-dependent.

At minimum, the platform should support cancellation from eligible pre-work states such as:

```text
REQUESTED
MATCHING
ASSIGNED
ACCEPTED
```

Whether cancellation remains allowed after:

```text
ON_THE_WAY
ARRIVED
IN_PROGRESS
```

must be controlled by `PRODUCT_DECISIONS.md`.

A cancellation should preserve history:

```text
cancelled_by
reason
cancelled_at
previous_state
```

Do not physically delete the job to represent cancellation.

---

# 18. Rescheduling

Rescheduling is a controlled business action, not a history rewrite.

Record:

```text
old scheduled time
new scheduled time
requested_by
reason
created_at
```

Availability must be revalidated when the new slot is confirmed.

---

# 19. Completion Invariants

Before `COMPLETED`, validate the configured completion requirements, such as:

```text
authorized professional
eligible current state
completion notes/evidence where required
required work recorded
```

Before `CLOSED`, validate configured financial/operational closure conditions.

---

# 20. Quote Approval Invariant

A job must never enter `IN_PROGRESS` for additional paid work solely because a professional created a quote.

Required:

```text
quote.status = APPROVED
approved_by = customer
approved_at is set
```

---

# 21. Timestamp Rules

Authoritative lifecycle timestamps should be generated server-side.

Examples:

```text
accepted_at
on_the_way_at
arrived_at
inspection_started_at
completed_at
closed_at
```

Do not trust browser timestamps as the canonical record.

---

# 22. Concurrency

The system must protect against simultaneous actions.

Examples:

```text
Two customers attempt the same professional/time slot.
→ server rechecks availability before confirmation.

Customer double-clicks Approve.
→ one approval only.

Two webhook deliveries arrive.
→ one payment effect only.
```

Use transactions, locking/constraints, and idempotency where required.

---

# 23. Realtime Rule

Supabase Realtime communicates changes; it does not authorize them.

Correct:

```text
validated DB transition
    ↓
Realtime event
    ↓
UI refresh
```

Incorrect:

```text
Realtime event
    ↓
frontend decides whether transition is valid
```

---

# 24. State Machine Testing

Every valid transition must have a positive test.

Every forbidden transition must have a negative test.

Minimum negative tests:

```text
REQUESTED → COMPLETED                  FAIL
REQUESTED → CLOSED                     FAIL
ASSIGNED → COMPLETED                   FAIL
AWAITING_APPROVAL → IN_PROGRESS
    without approved quote             FAIL
expired quote → APPROVED               FAIL
CLOSED → IN_PROGRESS                   FAIL
unverified professional → ACCEPTED     FAIL
unrelated customer → approve quote     FAIL
```

---

# 25. Backend Operation Names

Prefer explicit domain operations:

```text
accept_job()
reject_job()
mark_on_the_way()
mark_arrived()
start_inspection()
submit_inspection()
create_quote()
approve_quote()
decline_quote()
start_work()
complete_job()
cancel_job()
reassign_job()
```

These operations may call a central transition authority.

Avoid exposing a generic arbitrary-state mutation API.

---

# 26. State Change Process

Any modification to state logic must follow:

```text
1. Update this document.
2. Update product decisions if business behavior changes.
3. Update transition tests.
4. Update database/server implementation.
5. Update frontend action availability and labels.
```

The frontend is the last layer to change, not the first place the rule is invented.

# END OF STATE MACHINES SPECIFICATION
