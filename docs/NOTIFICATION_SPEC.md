# FIXIFY — NOTIFICATION SPECIFICATION

**Document status:** Implementation specification  
**Version:** 1.0  
**Last updated:** 2026-09-23  
**Purpose:** Define Fixify's notification architecture, event contract, delivery behavior, templates, preferences, read state, reliability, and authorization without silently deciding unresolved business communication policy.

---

## 1. Scope

Fixify notifications communicate important changes in customer, professional, support, payment, booking, complaint, and property-service workflows.

This specification covers:

- notification events;
- recipients;
- channel abstraction;
- in-app notification records;
- optional external channels;
- notification priority;
- template variables;
- deep links;
- idempotency/deduplication;
- delivery status;
- read/unread behavior;
- preference handling;
- security/privacy;
- failure/retry behavior;
- testing and observability.

This specification does **not** finalize unresolved commercial or communication-policy decisions. Those remain in `OPEN_DECISIONS.md` and `PRODUCT_DECISIONS.md`.

---

# 2. Product principles

## 2.1 Operational events are first-class

Notification generation must be tied to authoritative server-side business events, not arbitrary client-side actions.

Bad:

```text
frontend button click → directly mark notification as sent
```

Preferred:

```text
authorized domain action
        ↓
state/data change
        ↓
transactional event
        ↓
notification orchestration
        ↓
delivery channel(s)
        ↓
delivery/read tracking
```

## 2.2 In-app is the canonical application record

The existing `notifications` table is the canonical in-app notification record.

External channels such as push/email/SMS/WhatsApp are delivery mechanisms, not separate business truth.

## 2.3 Notification delivery must not change business state

A failed notification must not make a booking, job, quote, or payment fail unless a separate business rule explicitly requires that dependency.

Example:

```text
email failed
    ≠
job transition rolled back
```

## 2.4 No sensitive leakage

Notification text must expose the minimum information needed to act.

Do not put unnecessary sensitive data into:

- push payloads;
- email subject lines;
- lock-screen notification text;
- SMS text;
- logs.

The notification should deep-link the recipient into an authorized screen where full details can be loaded.

---

# 3. Channel model

Supported channel identifiers:

```text
IN_APP
PUSH
EMAIL
SMS
WHATSAPP
```

The platform should use a channel adapter interface so channels can be enabled/disabled without changing event producers.

### Current development rule

```text
IN_APP = required for operational events
PUSH   = optional/configurable
EMAIL  = optional/configurable
SMS    = optional/configurable
WHATSAPP = optional/configurable
```

The exact customer-facing channel policy remains OPEN; see `OPEN_DECISIONS.md` → `OD-028` and `OD-016`.

---

# 4. Priority classes

```text
CRITICAL
HIGH
NORMAL
LOW
```

### CRITICAL

Immediate operational/safety/payment-impacting messages where timely attention may be important.

Examples:

- job safety/urgent status where the platform has explicitly enabled such a use case;
- critical payment/security event;
- support escalation requiring immediate operational action.

Do not use CRITICAL merely to increase engagement.

### HIGH

Time-sensitive job workflow events.

Examples:

- professional assigned;
- professional accepted/rejected;
- professional on the way;
- professional arrived;
- quote requiring customer action;
- complaint status change.

### NORMAL

Routine operational information.

Examples:

- booking created;
- invoice issued;
- payment success;
- completed job;
- review reminder;
- property-history update.

### LOW

Non-urgent informational or future engagement messages. Promotional notifications must use a separate policy/category and must not inherit transactional defaults.

---

# 5. Notification type taxonomy

Notification `type` values should be stable machine-readable identifiers. Do not use human-readable copy as the event key.

## Booking / request

```text
booking_created
booking_confirmed
booking_updated
booking_rescheduled
booking_cancelled
booking_expiring
```

## Professional assignment

```text
professional_assignment_pending
professional_assigned
professional_acceptance_expired
professional_rejected
professional_accepted
professional_reassigned
```

## Job lifecycle

```text
job_status_changed
professional_on_the_way
professional_arrived
inspection_started
inspection_completed
awaiting_customer_approval
job_started
job_completed
job_closed
```

## Quote

```text
quote_created
quote_updated
quote_approved
quote_declined
quote_expired
```

## Payment / billing

```text
payment_action_required
payment_processing
payment_success
payment_failed
payment_refund_started
payment_refunded
payment_partially_refunded
invoice_issued
```

## Review

```text
review_requested
review_reminder
review_received
review_response_received
```

## Complaint / support

```text
complaint_opened
complaint_update
complaint_waiting_customer
complaint_waiting_professional
complaint_resolved
complaint_escalated
```

## Professional operations

```text
professional_job_request
professional_job_cancelled
professional_schedule_changed
professional_no_show_recorded
professional_earnings_updated
professional_verification_update
```

## Property / maintenance history

```text
property_service_record_added
maintenance_reminder
property_document_added
```

## Account/security

```text
account_security_alert
profile_action_required
```

Promotional and marketing event types must be kept separate from transactional types.

---

# 6. Event contract

A notification-triggering domain event should contain enough context for the notification service without trusting frontend input.

Recommended envelope:

```ts
type DomainEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  actorUserId?: string;
  aggregateType: string;
  aggregateId: string;
  correlationId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
};
```

Example:

```json
{
  "eventId": "evt_...",
  "eventType": "professional.assigned",
  "occurredAt": "2026-09-23T04:30:00Z",
  "actorUserId": "user_...",
  "aggregateType": "job",
  "aggregateId": "job_...",
  "correlationId": "req_...",
  "idempotencyKey": "job_...:professional_assigned"
}
```

The event must originate from a trusted server-side operation or database-backed event/outbox mechanism.

---

# 7. Notification record

The baseline entity already defined in `DATA_MODEL.md` is:

### `notifications`

| Field | Type | Required | Purpose |
|---|---|---:|---|
| `id` | uuid | Yes | Notification ID |
| `recipient_user_id` | uuid | Yes | User receiving the in-app notification |
| `type` | text | Yes | Stable notification type |
| `title` | text | Yes | Rendered title |
| `body` | text | Yes | Rendered body |
| `related_entity_type` | text | No | Entity for navigation/context |
| `related_entity_id` | uuid | No | Related entity ID |
| `read_at` | timestamptz | No | Read timestamp |
| `created_at` | timestamptz | Yes | Server timestamp |

Recommended indexes:

```text
(recipient_user_id, created_at DESC)
(recipient_user_id, read_at, created_at DESC)
(related_entity_type, related_entity_id)
```

Do not add indexes without confirming actual query requirements.

---

# 8. Recommended multi-channel extension

The baseline `notifications` entity is sufficient for in-app operation but is not enough to reliably track external-channel delivery.

When external channels are enabled, add an additive delivery entity such as:

### `notification_deliveries`

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Delivery record ID |
| `notification_id` | uuid | Parent in-app notification |
| `channel` | text | `PUSH`, `EMAIL`, `SMS`, `WHATSAPP` |
| `destination` | text | Provider-specific destination/reference; protect sensitive values |
| `status` | text | Delivery state |
| `provider` | text | Provider adapter name |
| `provider_message_id` | text | External reference |
| `attempt_count` | integer | Retry count |
| `last_attempt_at` | timestamptz | Last delivery attempt |
| `delivered_at` | timestamptz | Successful delivery timestamp |
| `failed_at` | timestamptz | Terminal failure timestamp |
| `error_code` | text | Safe machine-readable failure code |
| `metadata` | jsonb | Non-sensitive provider metadata |
| `created_at` | timestamptz | Server timestamp |

Recommended unique key:

```text
(notification_id, channel)
```

unless one notification intentionally has multiple deliveries per channel.

For channels requiring multiple provider attempts, provider-attempt history can be represented separately or in structured metadata.

---

# 9. Optional notification preferences

External-channel preferences should be modeled separately from the notification event itself.

Recommended entity:

### `notification_preferences`

Conceptual fields:

```text
user_id
notification_type_or_category
channel
enabled
updated_at
```

Default behavior must distinguish:

```text
TRANSACTIONAL
SECURITY
OPERATIONAL
PROMOTIONAL
```

A user's preference must not suppress a message that a separate product/legal rule requires to be delivered through a required channel.

The exact policy is OPEN until decided.

---

# 10. Recipient resolution

Recipients must be derived from the current authoritative relationship, not supplied blindly by the browser.

Examples:

### Customer event

```text
job/booking owner → customer user
```

### Professional event

```text
assigned professional → professional user
```

### Support/admin event

```text
authorized operational queue / assigned support actor
```

Recipient resolution must re-check authorization and record ownership.

Never allow a customer to submit:

```text
recipient_user_id = another_customer
```

and cause a notification to be delivered to that user.

---

# 11. Event → recipient → default notification mapping

The following is the implementation baseline. Channel choice remains configurable unless explicitly decided elsewhere.

| Event type | Primary recipient | Priority | In-app | External channel default |
|---|---|---|---|---|
| `booking_created` | Customer | NORMAL | Yes | Configurable |
| `booking_confirmed` | Customer | HIGH | Yes | Configurable |
| `professional_assigned` | Customer | HIGH | Yes | Configurable |
| `professional_job_request` | Professional | HIGH | Yes | Configurable |
| `professional_accepted` | Customer | HIGH | Yes | Configurable |
| `professional_rejected` | Customer | HIGH | Yes | Configurable |
| `professional_reassigned` | Customer | HIGH | Yes | Configurable |
| `professional_on_the_way` | Customer | HIGH | Yes | Configurable |
| `professional_arrived` | Customer | HIGH | Yes | Configurable |
| `inspection_started` | Customer | NORMAL/HIGH | Yes | Configurable |
| `inspection_completed` | Customer | NORMAL | Yes | Configurable |
| `awaiting_customer_approval` | Customer | HIGH | Yes | Configurable |
| `job_started` | Customer | NORMAL | Yes | Configurable |
| `job_completed` | Customer | NORMAL | Yes | Configurable |
| `quote_created` | Customer | HIGH | Yes | Configurable |
| `quote_approved` | Professional | HIGH | Yes | Configurable |
| `quote_declined` | Professional | NORMAL | Yes | Configurable |
| `quote_expired` | Relevant party | NORMAL | Yes | Configurable |
| `payment_action_required` | Customer | HIGH | Yes | Configurable |
| `payment_success` | Customer | NORMAL | Yes | Configurable |
| `payment_failed` | Customer | HIGH | Yes | Configurable |
| `payment_refunded` | Customer | NORMAL | Yes | Configurable |
| `invoice_issued` | Customer | NORMAL | Yes | Configurable |
| `review_reminder` | Customer | LOW/NORMAL | Yes | Configurable |
| `complaint_update` | Relevant customer/professional | HIGH | Yes | Configurable |
| `professional_verification_update` | Professional | NORMAL/HIGH | Yes | Configurable |
| `professional_earnings_updated` | Professional | NORMAL | Yes | Configurable |
| `property_service_record_added` | Customer | LOW/NORMAL | Yes | Configurable |
| `maintenance_reminder` | Customer | LOW/NORMAL | Yes | Configurable |
| `account_security_alert` | Affected user | CRITICAL/HIGH | Yes | Configurable |

Do not infer financial or communication guarantees from this table.

---

# 12. Notification lifecycle

A notification has two separate concepts:

### In-app lifecycle

```text
CREATED
  ↓
UNREAD
  ↓
READ
```

`read_at IS NULL` means unread.

### External delivery lifecycle

Recommended:

```text
QUEUED
PROCESSING
SENT
DELIVERED
FAILED
RETRY_SCHEDULED
CANCELLED
```

A provider's definition of `SENT` and `DELIVERED` must not be conflated.

The in-app notification can be `READ` even if an external delivery failed.

---

# 13. Idempotency and deduplication

Duplicate domain events must not create duplicate user-visible notifications unintentionally.

Preferred idempotency strategy:

```text
stable domain event ID
        +
notification type
        +
recipient
```

or a stable event-specific idempotency key.

Example:

```text
job_123:professional_assigned:customer_456
```

Do not use random client-generated IDs as the only dedupe mechanism.

### Duplicate webhook example

```text
payment provider webhook #1
    → payment PAID
    → notification created

same webhook #2
    → detected duplicate
    → no second notification
```

This follows the idempotency principles in `STATE_MACHINES.md`.

---

# 14. Outbox / transaction boundary

For reliability, notification generation should be coupled to the same successful business transaction through an outbox/event mechanism where practical.

Preferred pattern:

```text
BEGIN
  perform business mutation
  write domain/outbox event
COMMIT

worker reads outbox
  ↓
create notification
  ↓
dispatch channel deliveries
```

Avoid:

```text
COMMIT job
send email
DB process crashes
→ event permanently lost
```

If an outbox table is introduced, its processing must be idempotent.

---

# 15. Ordering

Notifications for the same aggregate should preserve logical event order where practical.

Example:

```text
professional_assigned
        before
professional_on_the_way
        before
professional_arrived
        before
job_completed
```

A delayed external delivery must not rewrite the underlying event chronology.

The UI should use `created_at` and event references to present the timeline deterministically.

---

# 16. Retry policy

Transient provider failures may be retried.

Permanent failures should not be retried indefinitely.

Recommended conceptual classes:

```text
TRANSIENT
RATE_LIMITED
AUTHENTICATION_ERROR
INVALID_DESTINATION
CONTENT_REJECTED
PROVIDER_FAILURE
UNKNOWN
```

Implementation should use:

- bounded retries;
- exponential backoff;
- jitter where appropriate;
- dead-letter/manual-review path for persistent failures.

Do not let notification retries create duplicate business actions.

---

# 17. Quiet hours and suppression

Quiet hours are a product-policy decision, not a universal engineering assumption.

Before the policy is decided:

- operational events remain available in-app;
- external channel suppression must be configurable;
- security/required transactional messages must not be silently suppressed if policy requires delivery.

Promotional notifications must always have a separate suppression/preference path.

---

# 18. Template system

Notification templates must be versioned and separate from event identifiers.

Suggested template key structure:

```text
notification.<type>.<channel>.<locale>
```

Examples:

```text
notification.professional_assigned.in_app.en
notification.professional_assigned.email.en
notification.payment_success.in_app.en
```

### Template inputs

Templates should receive a typed payload, not arbitrary database access.

Example:

```ts
type ProfessionalAssignedPayload = {
  jobId: string;
  professionalDisplayName: string;
  scheduledDate: string;
  scheduledTimeLabel: string;
};
```

### Template rules

- no hidden database lookups inside templates;
- no authorization bypass through template data;
- no secrets/tokens in notification content;
- localization must not change the machine event key;
- escaping must be applied to prevent HTML injection in email.

---

# 19. Deep links

Notifications should carry a safe application route/reference where useful.

Conceptually:

```text
related_entity_type
related_entity_id
route
```

Examples:

```text
/jobs/<job-id>
/quotes/<quote-id>
/payments/<payment-id>
/complaints/<complaint-id>
/notifications
```

The receiving page must still enforce RBAC/RLS. Possessing a notification or URL must not grant access.

Never put unrestricted database queries behind a notification deep link.

---

# 20. Read/unread behavior

Supported operations:

```text
mark notification read
mark notification unread (if product permits)
mark all visible notifications read
```

Authorization:

```text
recipient_user_id = current authenticated user
```

A user must not be able to modify another user's read state.

Recommended server operation:

```text
mark_notification_read(notification_id, actor_user_id)
```

The database should enforce ownership through RLS and/or secure server-side operations.

---

# 21. Notification center UI contract

The notification center should support:

- unread count;
- newest-first list;
- read/unread visual state;
- event title/body;
- relative or absolute timestamp;
- safe navigation to related entity;
- loading/pagination state;
- empty state;
- retry for recoverable UI fetch failures.

Recommended API shape:

```ts
type NotificationListItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  readAt?: string;
  createdAt: string;
};
```

Do not return provider secrets, raw delivery metadata, or unnecessary recipient data to the browser.

---

# 22. Push notification requirements

When push is enabled, the app needs a device-token abstraction.

Recommended conceptual entity:

### `user_devices`

```text
id
user_id
platform
push_token
app_version
last_seen_at
revoked_at
created_at
updated_at
```

Rules:

- token ownership is tied to the authenticated user;
- revoked/expired tokens are disabled;
- multiple active devices are supported;
- logout may revoke the device token depending on app policy;
- push payload should contain a notification ID or safe route identifier, not sensitive business data.

This is an additive model decision and should be reconciled with `DATA_MODEL.md` before implementation.

---

# 23. Email/SMS/WhatsApp adapter contract

All external channels should implement a common conceptual interface:

```ts
type NotificationDeliveryRequest = {
  notificationId: string;
  recipientUserId: string;
  type: string;
  channel: "PUSH" | "EMAIL" | "SMS" | "WHATSAPP";
  templateKey: string;
  locale: string;
  payload: Record<string, unknown>;
};
```

Adapter responsibilities:

- validate destination;
- render or invoke provider template;
- send;
- return provider reference;
- classify failure;
- never mutate Fixify business state.

---

# 24. Notification generation rules by workflow

## 24.1 Booking created

Trigger:

```text
booking successfully created/confirmed by authoritative server operation
```

Recipient:

```text
customer
```

Content should include only:

- service name;
- scheduled slot;
- booking/job reference;
- next action if any.

Do not include an unapproved price or guarantee.

---

## 24.2 Professional assigned

Trigger:

```text
job moves into ASSIGNED with a valid professional
```

Recipients:

```text
customer
professional
```

Customer content may include the professional's approved display information and scheduled slot.

Professional content should include the job request information they are authorized to see.

---

## 24.3 Professional accepted

Trigger:

```text
professional accepts assignment
```

Recipient:

```text
customer
```

The message should indicate that the assignment has been accepted. Do not imply arrival until the state actually changes.

---

## 24.4 Professional on the way

Trigger:

```text
job transitions to ON_THE_WAY
```

Recipient:

```text
customer
```

Only send this event when the authoritative job state changes.

---

## 24.5 Professional arrived

Trigger:

```text
job transitions to ARRIVED
```

Recipient:

```text
customer
```

Do not infer arrival from GPS heartbeat alone unless the product later explicitly defines such behavior.

---

## 24.6 Quote created

Trigger:

```text
quote transitions to PENDING_CUSTOMER
```

Recipient:

```text
customer
```

Message should make clear that customer approval is required before additional paid work proceeds where the state machine requires it.

Do not state that the quote is approved until the approval event occurs.

---

## 24.7 Quote approved / declined

Trigger:

```text
customer approves or declines the active quote
```

Recipient:

```text
professional
```

A quote approval notification must correspond to the authoritative quote status, not a UI click.

---

## 24.8 Payment success / failure

Trigger:

```text
verified payment state transition
```

Recipient:

```text
customer
```

Payment notifications must never be emitted solely because a client reports payment completion.

---

## 24.9 Invoice issued

Trigger:

```text
invoice becomes available to the authorized customer
```

Recipient:

```text
customer
```

The notification can link to the invoice screen.

Avoid embedding full financial details in push payloads.

---

## 24.10 Complaint update

Trigger:

```text
complaint state or support-visible update changes
```

Recipient:

```text
authorized complaint participant(s)
```

Do not expose internal support notes or confidential investigation content.

---

## 24.11 Review reminder

Trigger:

```text
completed/eligible job enters configured review-reminder condition
```

Recipient:

```text
customer
```

This must be scheduler-driven and idempotent.

Do not send repeated reminders indefinitely.

---

## 24.12 Property maintenance reminder

Trigger:

```text
configured maintenance reminder becomes due
```

Recipient:

```text
customer/property owner
```

Reminder timing and frequency are product-configurable.

---

# 25. Security and RBAC

Notifications must inherit the authorization model defined by `RBAC.md`.

### Customer

Can:

```text
read own notifications
mark own notifications read/unread where enabled
navigate to own related resources
```

Cannot:

```text
read another user's notification
forge notifications
choose arbitrary recipients
change delivery status
```

### Professional

Can:

```text
read own notifications
mark own notifications read/unread where enabled
navigate to authorized jobs/quotes/earnings/verification data
```

### Support/Admin

Operational users may inspect notification records according to their assigned permissions, but access must not automatically expose unrelated personal data.

Service-role processes may create/update notification records only for authorized system workflows.

---

# 26. Audit requirements

Audit when a privileged/system operation:

- manually sends a notification;
- suppresses a required notification;
- retries or replays delivery;
- changes notification preferences on behalf of a user;
- modifies notification templates in production;
- performs bulk operational messaging.

Do not put full notification bodies into audit logs when they contain user data unless necessary.

---

# 27. Observability

Metrics should include:

```text
notifications_created_total
notifications_read_total
notification_delivery_attempts_total
notification_delivery_success_total
notification_delivery_failures_total
notification_retry_total
notification_latency_ms
notification_provider_errors_total
```

Useful dimensions:

```text
type
channel
provider
status
application_role
```

Avoid dimensions with unbounded user IDs in metrics.

Logs should include:

```text
event_id
notification_id
aggregate_id
notification_type
channel
provider reference (safe form)
status
error class
correlation_id
```

Do not log:

- passwords;
- authentication tokens;
- payment secrets;
- full push tokens;
- unnecessary personal information.

---

# 28. Failure handling

Notification failure must degrade gracefully.

Example:

```text
job transition succeeds
        ↓
in-app notification created
        ↓
push provider unavailable
        ↓
push delivery FAILED / RETRY_SCHEDULED
        ↓
job remains in correct state
```

The notification center remains the reliable in-product fallback.

Where an external channel is business-critical, its required delivery policy must be explicitly decided rather than assumed by engineering.

---

# 29. Scheduling and delayed notifications

Scheduled notifications may be required for:

- appointment reminders;
- review reminders;
- maintenance reminders;
- quote expiry warnings;
- other configurable lifecycle reminders.

Scheduler requirements:

- idempotent job key;
- timezone-aware scheduling;
- cancellation when the triggering condition disappears;
- no duplicate reminders;
- bounded retries;
- observability.

The user's property/service timezone should be used where the product supports multiple regions.

Do not assume the browser timezone is authoritative.

---

# 30. Localization

Notification types remain language-neutral.

Recommended locale resolution:

```text
explicit user preference
        ↓
account/profile locale
        ↓
platform default
```

Templates should be reviewed so translated copy preserves the intended operational meaning.

Do not translate enum/type keys.

---

# 31. Content rules

Every operational notification should answer as applicable:

```text
What happened?
What does it mean?
What action is required?
Where can the user view details?
```

Keep titles short and bodies task-oriented.

Do not use notifications to make unresolved business promises.

Examples of prohibited assumptions:

```text
"Your professional will definitely arrive in 15 minutes."
"Your repair is guaranteed for 12 months."
"You will always receive a full refund."
"This price includes all materials."
```

Such statements belong to finalized product policy, not a generic notification template.

---

# 32. API/server operations

Conceptual operations:

```text
GET    /api/notifications
GET    /api/notifications/unread-count
POST   /api/notifications/:id/read
POST   /api/notifications/:id/unread        # only if enabled
POST   /api/notifications/read-all
```

For system use:

```text
create_notification_from_event(event)
dispatch_notification(notification)
process_notification_delivery(delivery_id)
retry_notification_delivery(delivery_id)
```

Actual route placement may use Next.js Route Handlers or Server Actions according to the application architecture.

Clients must not receive a route that can arbitrarily create a notification for another user.

---

# 33. Database/RLS expectations

For `notifications`:

```text
SELECT → recipient_user_id = authenticated user
UPDATE read state → recipient_user_id = authenticated user
INSERT → trusted server/service role only, unless a narrowly defined secure function is used
DELETE → generally restricted; follow retention/audit policy
```

If support/admin access is required, create explicit role/policy paths instead of weakening customer RLS.

If `notification_deliveries` is added:

```text
customer/professional clients → normally no direct write access
server/worker → controlled service role
support/admin → read-only or operational access as explicitly permitted
```

---

# 34. Testing requirements

## Unit tests

Test:

- event → notification type mapping;
- recipient resolution;
- template rendering;
- channel policy resolution;
- idempotency keys;
- priority calculation;
- preference application;
- deep-link generation.

## Integration tests

Test:

```text
job ASSIGNED
    → notification for customer

job ON_THE_WAY
    → on-the-way notification

quote PENDING_CUSTOMER
    → approval-required notification

quote APPROVED
    → professional notification

payment PAID
    → payment success notification

complaint update
    → authorized participant notification
```

## Security tests

Attempt:

```text
customer A reads customer B notification → DENY
customer A marks customer B notification read → DENY
customer A chooses arbitrary recipient → DENY
professional accesses unrelated customer notification → DENY
forged payment event creates payment-success notification → DENY
```

## Idempotency tests

```text
same event twice
    → one logical notification

same payment webhook twice
    → one logical payment notification
```

## Failure tests

Simulate:

- provider timeout;
- rate limit;
- invalid token;
- temporary database outage;
- worker restart;
- duplicate queue delivery.

Expected result:

```text
no duplicate business effects
retry where appropriate
notification state remains inspectable
```

---

# 35. Definition of done

The notification system is implementation-ready when:

```text
[ ] notification types are stable
[ ] event producers are server-authoritative
[ ] recipient resolution is ownership-aware
[ ] in-app notifications work with RLS
[ ] read/unread operations are protected
[ ] notification IDs are stable
[ ] duplicate events are idempotent
[ ] external channels are adapter-based
[ ] delivery status is observable
[ ] retries are bounded
[ ] templates are versioned
[ ] deep links enforce RBAC
[ ] sensitive payload data is minimized
[ ] audit requirements are implemented
[ ] scheduler jobs are idempotent
[ ] security/integration tests pass
[ ] OPEN notification-policy decisions remain configurable
```

---

# 36. Implementation sequence

Recommended order:

### Phase 1 — In-app foundation

```text
1. notifications table + RLS
2. notification type constants
3. event envelope
4. recipient resolver
5. notification creation service
6. notification list + unread count
7. read/unread mutation
8. deep-link handling
```

### Phase 2 — Reliability

```text
9. outbox/event queue
10. idempotency/deduplication
11. retry/error classification
12. observability
```

### Phase 3 — External channels

```text
13. user device/token model
14. push adapter
15. email adapter
16. SMS/WhatsApp adapter only when product policy and provider choice are finalized
17. notification delivery tracking
18. preferences
```

### Phase 4 — Lifecycle automation

```text
19. scheduled reminders
20. review reminders
21. maintenance reminders
22. quote-expiry reminders
```

---

# 37. Canonical architectural rule

Fixify notifications are a **projection of authoritative business events**.

The canonical flow is:

```text
Customer / Professional / Support action
                ↓
        authorized backend operation
                ↓
       state/data transition
                ↓
        domain event / outbox
                ↓
      notification orchestration
                ↓
       recipient resolution
                ↓
          in-app record
                ↓
    optional channel deliveries
                ↓
      delivery/read telemetry
```

Never make the browser the source of truth for notification creation, payment success, job status, quote approval, or professional arrival.

---

# END OF NOTIFICATION SPECIFICATION
