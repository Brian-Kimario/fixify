# FIXIFY — PAYMENT SPECIFICATION

**Status:** Implementation Specification

**Version:** 1.0

**Last updated:** 2026-09-23

**Purpose:** Define the implementation-ready payment architecture for Fixify so customer charges, quote approvals, provider confirmations, refunds, invoices, and future professional settlements remain authoritative, traceable, idempotent and independent from client-side state.

**Related documents:**
- `docs/PRODUCT_DECISIONS.md`
- `docs/OPEN_DECISIONS.md`
- `docs/DATA_MODEL.md`
- `docs/RBAC.md`
- `docs/STATE_MACHINES.md`
- `docs/NOTIFICATION_SPEC.md`

---

# 1. Executive contract

Fixify payment processing is a **server-authoritative financial workflow**.

The browser can:

```text
select a service
select options
submit a booking
approve/decline a quote
start a payment attempt
```

The browser cannot declare:

```text
payment = PAID
invoice = PAID
refund = complete
commission = final
professional payout = final
```

Authoritative financial state comes from:

```text
validated server calculation
        ↓
payment provider interaction
        ↓
verified provider response/webhook
        ↓
idempotent server processing
        ↓
Fixify payment record
        ↓
invoice/settlement side effects
```

---

# 2. Payment design goals

The payment system must provide:

- authoritative totals;
- clear linkage to booking/job/quote;
- support for fixed-price and inspection/quote flows;
- provider abstraction;
- idempotent payment attempts and webhook handling;
- safe partial/full refund representation;
- invoice traceability;
- auditable financial events;
- clear failure states;
- controlled access by role;
- no client-side trust in financial status;
- future support for professional settlements without forcing the MVP into a full accounting platform.

---

# 3. Payment is separate from job state

The existing job state machine and payment state machine are intentionally separate.

Job lifecycle:

```text
... → COMPLETED → PAYMENT_PENDING → CLOSED
```

Payment lifecycle:

```text
PENDING → PROCESSING → PAID
                    ↘ FAILED
PAID → PARTIALLY_REFUNDED → REFUNDED
PAID → REFUNDED
```

Do not replace one with the other.

Examples:

```text
job completed ≠ payment paid
quote approved ≠ payment paid
payment paid ≠ job completed
```

---

# 4. Pricing model compatibility

Fixify supports structurally:

```text
FIXED_PRICE
INSPECTION_FEE
QUOTE_AFTER_INSPECTION
```

The exact service-by-service configuration remains governed by `PRODUCT_DECISIONS.md` / `OPEN_DECISIONS.md`.

Payment logic must support all three without embedding a universal payment timing assumption.

---

# 5. Authoritative money source

Every payable amount must originate from server-side authoritative data.

Potential inputs include:

```text
service base price
service options
material charges
inspection fee
approved quote items
discounts
platform/service fees
taxes where applicable
other policy-driven adjustments
```

Calculation must happen in trusted server/database logic.

Never trust:

```text
localStorage.total
hidden input total
frontend subtotal
frontend commission
frontend tax
```

---

# 6. Money representation

Use precise decimal/numeric representation consistent with `DATA_MODEL.md`.

Do not use binary floating-point arithmetic for authoritative monetary calculations.

Every monetary value must carry:

```text
amount
currency
```

Recommended application representation:

```ts
type Money = {
  amount: string;
  currency: string;
};
```

Using strings at API boundaries avoids accidental floating-point conversion.

The database remains the financial authority.

---

# 7. Currency configuration

The exact launch currency is an OPEN decision (`OD-003`).

The existing development status uses INR as a prototype baseline, but the implementation must not assume INR globally.

Store/configure currency at the relevant market/business boundary.

Never:

```text
currency = "INR" everywhere in code
```

Prefer:

```text
currency_code from configured market/service/payment context
```

Do not support mixed-currency financial records inside a single ordinary service transaction unless explicitly designed and reconciled.

---

# 8. Payment entities

The existing `payments` model contains:

```text
id
customer_id
booking_id
job_id
quote_id
payment_type
amount
currency
provider
provider_reference
status
paid_at
created_at
updated_at
```

Payment types currently include the conceptual categories:

```text
inspection
service
material
additional_work
subscription
```

The schema may be extended when implementation requires payment-attempt or refund detail, but changes must be reconciled into `DATA_MODEL.md` before migration.

---

# 9. Payment intent vs payment record

The product must distinguish:

```text
customer intends to pay
```

from:

```text
payment has actually succeeded
```

The payment initiation flow may conceptually use a provider payment intent/session while `payments.status` remains the Fixify financial state.

Example:

```text
Checkout opened
→ provider intent created
→ payment record PENDING
→ customer completes provider flow
→ provider confirms
→ Fixify PROCESSING/PAID
```

Do not call a payment `PAID` merely because a checkout session was created.

---

# 10. Recommended payment-attempt abstraction

If the selected payment provider requires multiple attempts for the same payable obligation, introduce a payment-attempt abstraction rather than creating multiple business charges accidentally.

Conceptual:

```text
payment obligation
   ├── attempt 1 → failed
   ├── attempt 2 → abandoned
   └── attempt 3 → paid
```

A provider attempt/reference should be uniquely traceable.

Do not create three independent customer liabilities unless the business transaction actually contains three separate charges.

If a dedicated `payment_attempts` table is implemented, update `DATA_MODEL.md`.

---

# 11. Payment state machine

Canonical states from `STATE_MACHINES.md`:

```text
PENDING
PROCESSING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Allowed transitions:

```text
PENDING → PROCESSING
PROCESSING → PAID
PROCESSING → FAILED
PAID → REFUNDED
PAID → PARTIALLY_REFUNDED
PARTIALLY_REFUNDED → REFUNDED
```

No other transitions should be implemented without updating the state-machine specification and tests.

---

# 12. Payment transition authority

Payment status changes must occur through trusted server logic.

Conceptual operation:

```ts
processPaymentProviderEvent(...)
```

The server must:

1. authenticate the incoming event where applicable;
2. verify the provider signature or equivalent;
3. identify the payment/provider reference;
4. load the authoritative Fixify payment record;
5. validate the expected transition;
6. enforce idempotency;
7. record the event/audit trail;
8. apply derived financial side effects exactly once.

The browser must never directly call:

```text
UPDATE payments SET status = 'PAID'
```

---

# 13. Payment amount calculation pipeline

Recommended pipeline:

```text
Customer selection
      ↓
server loads active catalogue/pricing
      ↓
server validates service/options/materials
      ↓
server calculates subtotal
      ↓
server applies configured fees/taxes/discounts
      ↓
server creates payable amount
      ↓
provider payment intent/session
      ↓
customer pays
      ↓
provider verification
      ↓
Fixify records PAID
```

The customer-facing amount shown before payment must be based on the same authoritative server calculation used for the provider request.

---

# 14. Price snapshot rule

When money is committed for a transaction, preserve the effective financial context needed to explain what the customer paid.

At minimum the system must be able to reconstruct:

```text
service
price basis
material/items
fees
discounts
tax/other charges if applicable
currency
total
```

Do not recalculate a historical invoice later using today's catalogue prices.

If the current schema cannot fully snapshot these values, add a suitable transaction/line-item representation before live financial launch and update `DATA_MODEL.md`.

---

# 15. Fixed-price payment flow

Conceptual:

```text
service selected
  ↓
server validates availability + price
  ↓
payable total created
  ↓
payment initiated
  ↓
provider confirmation
  ↓
PAID
  ↓
booking/job follows normal workflow
```

Whether payment occurs before or after service remains an OPEN business decision (`OD-005`).

The architecture must support either without changing the authoritative state model.

---

# 16. Inspection-fee flow

Conceptual:

```text
customer requests inspection
      ↓
server calculates inspection fee
      ↓
inspection payment (if policy requires)
      ↓
professional inspection
      ↓
inspection record
      ↓
repair price determined if needed
```

Whether the inspection fee is refundable or credited against repair is a business decision (`PRODUCT_DECISIONS.md` / `OD-004`).

Do not embed crediting logic until decided.

---

# 17. Quote-after-inspection flow

Conceptual:

```text
inspection
  ↓
professional creates quote DRAFT
  ↓
quote submitted PENDING_CUSTOMER
  ↓
customer APPROVES or DECLINES
  ↓
if approved → work authorized
  ↓
payment according to configured timing
```

Quote approval is not payment confirmation.

A quote approval operation must use the quote state machine, not the payment endpoint.

---

# 18. Additional-work payment

Additional work must follow:

```text
professional identifies additional scope
      ↓
quote created
      ↓
customer approval
      ↓
payment/authorization according to policy
      ↓
work proceeds
```

AI cannot approve or charge additional work.

A professional cannot silently convert extra work into a larger final charge without the normal quote/approval/payment rules.

---

# 19. Quote-to-payment linkage

When a quote is payable, the resulting payment must reference the authoritative quote ID.

This allows:

```text
quote
  ↓
payment
  ↓
invoice
```

to be reconstructed.

Do not create a payment without a meaningful domain reference unless it is a legitimate standalone payment type such as a subscription or another explicitly configured transaction.

---

# 20. Payment checkout session

A checkout session should carry only identifiers needed to safely resume the payment flow.

Recommended metadata:

```text
payment_id
customer_id
booking_id/job_id/quote_id as applicable
```

Do not put sensitive personal data or mutable financial totals into provider metadata merely for convenience.

The server retrieves the authoritative amount from the database.

---

# 21. Customer payment flow

Recommended UI flow:

```text
Review order
  ↓
Show price breakdown
  ↓
Confirm payment intent
  ↓
Provider checkout
  ↓
Return page
  ↓
Server checks payment status
  ↓
Show final state
```

The return page is informational.

The return URL itself is not proof of payment.

---

# 22. Provider webhook flow

Canonical flow:

```text
Provider webhook
      ↓
HTTPS endpoint
      ↓
signature verification
      ↓
parse event
      ↓
identify payment/provider reference
      ↓
idempotency check
      ↓
load Fixify payment
      ↓
validate transition
      ↓
update payment state
      ↓
create financial/audit event
      ↓
trigger dependent workflows
```

Dependent workflows may include:

- invoice update;
- job `PAYMENT_PENDING` resolution;
- customer notification;
- professional earnings/settlement calculation.

These must remain server-controlled.

---

# 23. Webhook security

Webhook endpoints must:

- use HTTPS;
- verify provider signature;
- reject malformed events;
- enforce timestamp/replay controls if the provider supports them;
- log provider event IDs safely;
- process idempotently;
- avoid trusting arbitrary metadata for authorization.

Do not accept a client-supplied event claiming:

```text
payment successful
```

as equivalent to a verified provider event.

---

# 24. Webhook idempotency

Duplicate events are expected operationally.

Example:

```text
webhook #1001 → PAID
webhook #1001 → duplicate
```

The second event must produce no duplicate:

- payment state change;
- invoice issuance;
- notification;
- professional earnings event;
- refund;
- property history update.

Use a unique provider event ID/reference when available.

If the provider does not offer an event ID, use a deterministic equivalent that is safe for that provider.

---

# 25. Payment failure handling

A payment may fail due to:

```text
customer cancellation
provider decline
insufficient funds
expired payment session
network failure
provider outage
invalid payment details
fraud/risk rejection
```

Failure should result in:

```text
PROCESSING → FAILED
```

where the verified provider/server result confirms failure.

The customer should be offered a controlled retry path where business policy allows.

Do not create a new booking automatically just because payment failed unless product rules explicitly require it.

---

# 26. Retry payment attempt

A retry should normally reuse the same underlying business payable obligation but create a new provider attempt/session as required.

The canonical payment state machine does **not** permit `FAILED → PROCESSING`. Therefore a retry must not mutate a failed payment back into processing.

Use one of these two implementations:

```text
Preferred when payment_attempts exists:
payment obligation
   ├── attempt 1 → FAILED
   └── attempt 2 → PROCESSING → PAID
```

```text
Current-schema fallback:
payment record 1 → FAILED
payment record 2 → PROCESSING → PAID
```

In the current schema, if a dedicated `payment_attempts` entity is not yet implemented, a new payment record may represent the new actual provider charge attempt, linked to the same booking/job/quote and payable business context. The UI must treat these as attempts against one customer obligation rather than independent successful charges.

Do not duplicate the service charge in the financial result merely because the customer clicked “Try again.” Any reconciliation/aggregation logic must count only the authoritative successful transaction(s) applicable to the obligation.

---

# 27. Payment timeout

If provider status is unknown:

```text
client thinks payment failed/succeeded
but server has no authoritative confirmation
```

Show:

```text
Payment status is being confirmed.
```

Do not mark the payment failed solely because the browser timed out.

The server may reconcile through provider APIs when supported.

---

# 28. Reconciliation

A payment system needs a way to detect mismatch between:

```text
Fixify database
```

and

```text
payment provider
```

Examples:

```text
provider says PAID, Fixify says PROCESSING
Fixify says PENDING, provider has captured payment
```

Recommended operational process:

```text
periodic reconciliation job
       ↓
find mismatches
       ↓
fetch provider truth
       ↓
apply safe transition / flag for review
```

Reconciliation must not bypass state validation or idempotency.

---

# 29. Refund model

Existing payment states support:

```text
PARTIALLY_REFUNDED
REFUNDED
```

Refunds must be traceable to the original payment.

Conceptual flow:

```text
refund requested
    ↓
policy / support authorization
    ↓
provider refund request
    ↓
provider confirmation
    ↓
payment refund state updated
```

Do not mark a refund complete merely because an internal support agent clicked a button.

The final financial state must reflect verified provider outcome where provider processing is involved.

---

# 30. Refund authority

The exact refund policy is OPEN (`OD-009`).

Potential triggers include:

- customer cancellation;
- professional cancellation/no-show;
- service failure;
- dispute resolution;
- duplicate payment;
- quote decline where money was already collected;
- warranty/rework decision;
- payment/system error.

The payment system should support the mechanics without deciding the business policy itself.

---

# 31. Partial refund

A partial refund must be numerically bounded by the captured/paid amount that is still refundable.

Never allow:

```text
refund > refundable amount
```

The server should calculate:

```text
refundable_balance = paid_amount - prior_refunds
```

Then validate the requested refund against that value.

---

# 32. Refund idempotency

Refund provider events must be idempotent just like payment success events.

A duplicated refund confirmation must not produce:

- duplicate refund accounting;
- negative customer balance;
- duplicate notifications;
- duplicate invoice adjustments.

If a dedicated refund table is implemented, update `DATA_MODEL.md`.

---

# 33. Invoice behavior

The existing invoice model contains:

```text
invoice_number
customer_id
property_id
job_id
payment_id
subtotal
taxes_or_fees
discounts
total
currency
status
issued_at
created_at
```

Invoice totals are server-calculated.

Historical invoices must be reproducible and immutable after issue except through controlled void/credit/refund mechanisms defined later.

Do not edit an issued invoice directly from the browser.

---

# 34. Invoice lifecycle

Recommended conceptual lifecycle:

```text
DRAFT
  ↓
ISSUED
  ↓
PAID
```

and:

```text
ISSUED → VOID
```

The exact invoice status values currently present in the data model are:

```text
draft
issued
paid
void
```

Do not confuse invoice status with payment status.

A payment can fail while an invoice remains issued depending on the financial flow.

---

# 35. Invoice issuance timing

Invoice timing depends on the commercial/payment model.

Possible patterns:

```text
before payment
at payment confirmation
at job completion
after final quote/work completion
```

The exact timing is a product decision.

The implementation must support controlled issuance without changing historical totals.

---

# 36. Invoice line-item integrity

If the current invoice schema does not have normalized line items, the implementation must retain enough immutable financial detail to explain the invoice.

Recommended conceptual line-item structure:

```text
invoice_id
line_type
reference_id
description
quantity
unit_amount
line_total
currency
metadata
```

If added, update `DATA_MODEL.md`.

Never reconstruct an old invoice solely from the current service catalogue.

---

# 37. Taxes and fees

Taxes, statutory charges and platform/service fees are OPEN commercial decisions where not already finalized.

Architecture must support separate components so they are not hidden inside one unexplained total.

Recommended breakdown:

```text
subtotal
service/platform fee
tax/other required charges
discount
final total
```

The exact labels and treatment are configured by the applicable market policy.

Do not let AI calculate tax.

---

# 38. Discounts

Discounts must be server-authoritative.

Recommended conceptual flow:

```text
customer enters/uses discount code
      ↓
server validates eligibility
      ↓
server computes discount
      ↓
price snapshot updated
```

Do not trust a frontend-submitted discount amount.

A discount should reference its source/policy when possible.

---

# 39. Commission and platform economics

Commission remains an OPEN decision (`OD-006`).

The architecture should support:

```text
percentage fee
fixed fee
category-specific rule
labour-only basis
total-order basis
material exclusions
```

The customer-facing payment amount and professional earnings calculation must be separate concepts.

Never expose a client-calculated commission as authoritative.

---

# 40. Professional earnings boundary

A customer payment does not automatically equal the professional's final payout.

Conceptually:

```text
customer amount
      ↓
platform/required fees
      ↓
refund/adjustment effects
      ↓
professional payable amount
      ↓
settlement/payout
```

The exact commission, deductions, payout timing and settlement policy are OPEN.

For MVP development, professional earnings may be represented as derived operational values, but live settlement should not rely on an un-auditable UI calculation.

If a dedicated earnings/settlements ledger is required for live launch, add it to `DATA_MODEL.md` before implementation.

---

# 41. Settlement states

If professional payouts are implemented as a provider-controlled workflow, the system should model at least conceptually:

```text
ELIGIBLE
PROCESSING
PAID
FAILED
REVERSED
ON_HOLD
```

Do not confuse these with customer payment states.

Do not add these to the customer `payments.status` enum.

A separate settlement abstraction is recommended when actual marketplace payouts begin.

---

# 42. Payment timing decision matrix

The current architecture must support:

| Flow | Possible payment timing | Business decision |
|---|---|---|
| Fixed-price service | upfront / post-service | `OD-005` |
| Inspection | upfront / post-visit | `OD-005` |
| Quote-after-inspection | before work / after work / deposit | `OD-005` |
| Additional work | approval + payment according to policy | `OD-005` |
| Subscription | recurring provider billing | later/premium decision |

Do not hard-code one global checkout point.

---

# 43. Booking-payment dependency

Booking creation and payment authorization must be coordinated carefully.

Possible flows:

### Payment-first

```text
request
 ↓
payment
 ↓
confirmed booking
```

### Booking-first

```text
request
 ↓
booking created
 ↓
payment required
```

The exact business choice is OPEN.

Whichever flow is used, the system must define what happens to an unpaid/failed booking and how inventory/time-slot capacity is released.

---

# 44. Idempotency keys

All payment initiation endpoints should support idempotency.

Conceptual header:

```text
Idempotency-Key: <server/client-generated unique key>
```

The server should bind the key to:

```text
authenticated user
payment operation
payable entity
requested amount/version
```

Reusing an idempotency key must return the original operation result where safe.

An idempotency key must not allow a user to replay a successful payment into a different job.

---

# 45. Concurrency controls

Payment operations may race with:

- quote expiry;
- quote approval;
- cancellation;
- refund;
- job closure;
- duplicate checkout sessions.

Use server-side concurrency protection.

Example:

```text
Quote approved
       ↓
customer starts payment
       ↓
quote becomes expired concurrently
```

The server must validate current authoritative state before creating/confirming the payable transaction.

Do not rely on UI state captured minutes earlier.

---

# 46. Stale checkout protection

A checkout session should be tied to a version/snapshot of the payable transaction.

If the underlying amount or quote changes before payment completion:

```text
stale payment attempt
       ↓
block finalization
       ↓
require refreshed checkout
```

Do not silently charge the new amount against an old approval page.

---

# 47. Quote expiry protection

A quote in:

```text
PENDING_CUSTOMER
```

can be approved only while valid according to the quote state machine.

Payment must reference the authoritative quote status.

Do not accept payment for an expired/declined quote merely because an old checkout URL still exists.

---

# 48. Cancellation interaction

Cancellation policy is OPEN (`OD-007`).

The payment system should expose controlled outcomes such as:

```text
no financial change
full refund
partial refund
refund pending
professional compensation
customer fee
```

The payment layer executes the authorized financial consequence; it does not decide the cancellation policy.

---

# 49. Rescheduling interaction

Rescheduling may alter:

- payment timing;
- inspection date;
- pricing validity;
- professional availability;
- cancellation exposure.

Do not recalculate or recollect money automatically unless product policy explicitly requires it.

Any financial change must be represented as an explicit server action.

---

# 50. Customer no-show

Customer no-show handling is OPEN (`OD-012`).

The payment layer must be able to support the chosen outcome:

```text
no charge
partial charge
full charge
rebooking fee
refund of prior payment
```

The job/no-show event should be the operational source; the payment workflow applies the resulting authorized financial adjustment.

---

# 51. Professional no-show

Professional no-show handling is OPEN (`OD-011`).

Possible financial outcomes include:

```text
customer refund
no charge
rebooking
professional penalty
Fixify-funded compensation
```

The payment system should support the authorized result without embedding the policy in the payment provider adapter.

---

# 52. Complaints/disputes

Complaint resolution may produce a financial action, but the complaint system owns the decision.

Flow:

```text
complaint
  ↓
review
  ↓
resolution decision
  ↓
financial instruction
  ↓
refund/adjustment workflow
```

A support agent should not manually edit payment status as a shortcut.

---

# 53. Warranty/rework

Warranty/rework is OPEN (`OD-014`).

If policy results in:

```text
no charge rework
partial refund
full refund
new paid booking
```

the payment layer should execute the authorized outcome through a traceable financial event.

Do not mutate the historical original payment into a new unrelated transaction.

---

# 54. Payment notifications

Use the notification architecture from `NOTIFICATION_SPEC.md`.

Relevant events include:

```text
payment_action_required
payment_success
payment_failed
payment_refunded
invoice_issued
```

Notifications must be generated from authoritative payment events.

AI may improve wording only from trusted event data.

---

# 55. Customer payment visibility

Customer payment UI should show:

```text
amount
currency
payment status
payment reference where appropriate
related job/booking
invoice link when available
refund status when applicable
```

Do not expose:

- provider secrets;
- internal fraud/risk scores;
- private provider payloads;
- internal reconciliation metadata;
- other users' payment data.

---

# 56. Professional visibility

Professionals should only see payment information relevant to their authorized operational context.

Example:

```text
“Customer payment confirmed”
```

may be operationally useful.

But exposing the customer's complete payment method or unrelated billing history is not.

The exact visibility must follow `RBAC.md` and product policy.

---

# 57. Support/admin visibility

Support/admin financial interfaces may need:

- payment status;
- amount/currency;
- provider reference;
- refund history;
- invoice status;
- reconciliation flags;
- linked booking/job/quote;
- audit history.

High-risk actions must require stronger authorization and audit.

---

# 58. PCI/sensitive payment data boundary

Fixify should avoid storing raw card/bank credentials when the provider can tokenize or host the payment experience.

Prefer:

```text
Fixify → provider checkout/tokenization
Fixify ← safe provider references/status
```

Do not store sensitive payment credentials in ordinary Fixify tables.

Provider-specific compliance requirements must be handled at integration time.

---

# 59. Security model

Payment operations require:

```text
authenticated actor
   ↓
RBAC/RLS
   ↓
ownership / relationship checks
   ↓
server validation
   ↓
provider action
   ↓
verified provider result
```

Sensitive operations such as:

```text
refund
manual adjustment
settlement release
payment dispute override
```

must be restricted to authorized support/admin roles and audited.

---

# 60. Manual payment operations

Manual financial actions may be necessary for support/reconciliation.

They must use explicit commands such as:

```text
request_refund
approve_refund
retry_provider_refund
mark_reconciliation_issue
```

Do not expose a generic:

```text
edit payment
```

endpoint.

The UI may present a “refund” button, but the underlying server operation must enforce eligibility and policy.

---

# 61. Audit requirements

Audit significant payment events:

- payment initiated;
- checkout created;
- payment processing;
- payment succeeded;
- payment failed;
- refund requested;
- refund processed;
- invoice issued;
- invoice voided;
- manual financial adjustment;
- reconciliation mismatch;
- settlement action.

Each audit record should capture:

```text
actor/system source
action
entity ID
previous state where appropriate
new state where appropriate
timestamp
request/correlation ID
safe metadata
```

Never place sensitive payment credentials into audit metadata.

---

# 62. Financial event history

Payment status alone is not sufficient for forensic reconstruction.

A robust implementation should maintain an append-oriented history of significant payment events.

Conceptual:

```text
payment_created
payment_processing
provider_confirmed
payment_paid
refund_requested
refund_processed
```

This may be implemented using existing audit/event infrastructure or a dedicated financial event table, but the final design must preserve traceability.

---

# 63. Refund and invoice consistency

When a refund occurs, the system must decide how the invoice is represented according to accounting/business policy.

Possible outcomes include:

```text
invoice remains issued + refund recorded
invoice adjusted/credited
invoice voided
new credit document
```

Do not invent the accounting treatment inside payment code.

Record the financial relationship and defer document-policy specifics to the approved business/accounting design.

---

# 64. Payment and property history

Property service history records the operational service record.

A historical payment record may be linked to a completed job but should not become the property history's only evidence of work.

Preferred chain:

```text
job
 ↓
service history
 ↓
invoice/payment references
```

Do not create a property history record merely because a payment succeeded if the underlying job has not actually completed the required service workflow.

---

# 65. Subscription boundary

Subscriptions are a later-stage product area.

The payment architecture should remain extensible for recurring provider billing but should not contaminate normal one-off job payments.

Use:

```text
payment_type = subscription
```

only when the subscription product is actually implemented.

Subscription state, entitlements and cancellation must be separate from one-off job payment state.

---

# 66. B2B payment boundary

B2B/property-management billing may eventually require:

- organization account;
- billing contact;
- consolidated invoices;
- payment terms;
- monthly invoicing;
- purchase orders;
- multiple properties.

Do not bolt B2B ledger behavior into the consumer payment path.

When B2B launches, introduce the required account/billing abstractions and reconcile them into `DATA_MODEL.md`.

---

# 67. Payment reconciliation jobs

Recommended scheduled operations:

```text
provider status reconciliation
stale PROCESSING detection
unsettled refund detection
invoice/payment mismatch detection
duplicate reference detection
```

A reconciliation job must be safe to run repeatedly.

Do not let a scheduled job blindly flip statuses.

Each correction must satisfy the canonical state transition rules.

---

# 68. Stale processing payments

A payment remaining in `PROCESSING` longer than the configured threshold should trigger reconciliation, not automatic failure.

Conceptual:

```text
PROCESSING too long
      ↓
provider lookup
      ↓
PAID / FAILED / still unknown
```

Only a verified outcome should advance the state.

---

# 69. Provider adapter contract

Use a provider abstraction so business logic is provider-neutral.

Conceptual:

```ts
interface PaymentProvider {
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  fetchPayment(reference: string): Promise<PaymentProviderStatus>;
  refund(input: RefundPaymentInput): Promise<RefundResult>;
  verifyWebhook(request: unknown): Promise<VerifiedProviderEvent>;
}
```

The adapter owns provider-specific API behavior.

Fixify services own:

- business validation;
- pricing;
- authorization;
- state transitions;
- idempotency;
- audit.

---

# 70. Provider result normalization

Normalize provider-specific statuses into Fixify's canonical states.

Example:

```text
provider CAPTURED → Fixify PAID
provider DECLINED → Fixify FAILED
provider REFUNDED → Fixify REFUNDED
```

Provider-specific values must not leak throughout the codebase.

Keep provider-specific metadata at the integration boundary.

---

# 71. API surface

Recommended conceptual routes:

```text
POST /api/payments/create
GET  /api/payments/:id
POST /api/payments/:id/retry
POST /api/payments/webhooks/<provider>
POST /api/payments/:id/refund        # restricted
GET  /api/payments/:id/reconciliation # restricted/internal
```

Actual names may be adapted to the Next.js API architecture.

Every route must:

- authenticate where appropriate;
- validate input;
- enforce RBAC/RLS;
- use server-authoritative amounts;
- avoid direct status mutation;
- return typed errors.

---

# 72. Payment API response model

Recommended customer-safe response:

```ts
type PaymentView = {
  id: string;
  status: "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  amount: string;
  currency: string;
  paymentType: string;
  bookingId?: string;
  jobId?: string;
  quoteId?: string;
  paidAt?: string;
  createdAt: string;
};
```

Do not expose internal provider payloads or secrets.

---

# 73. Error codes

Use stable machine-readable payment errors such as:

```text
PAYMENT_NOT_FOUND
PAYMENT_NOT_AUTHORIZED
PAYMENT_AMOUNT_MISMATCH
PAYMENT_ALREADY_PAID
PAYMENT_NOT_PAYABLE
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_PROVIDER_REJECTED
PAYMENT_WEBHOOK_INVALID
PAYMENT_STATE_CONFLICT
PAYMENT_IDEMPOTENCY_CONFLICT
PAYMENT_STALE_CHECKOUT
PAYMENT_REFUND_NOT_ALLOWED
PAYMENT_REFUND_AMOUNT_INVALID
PAYMENT_RECONCILIATION_REQUIRED
```

Do not return provider stack traces to customers.

---

# 74. Payment UI anti-patterns

Never implement:

```text
if (paymentReturnUrl) setPaid(true)
```

Never implement:

```text
await supabase.from('payments').update({ status: 'paid' })
```

from a client component.

Never calculate the final charge only in React.

Never trust a hidden form field containing a total.

Never issue a refund by deleting the original payment record.

Never overwrite historical provider references without an audit trail.

---

# 75. Booking/job closure invariant

From the state-machine design:

```text
COMPLETED → PAYMENT_PENDING → CLOSED
```

The exact conditions for moving to `CLOSED` depend on the configured financial workflow.

The implementation should explicitly define and test the required closure conditions once payment timing is decided.

A frontend “Mark complete” button must never bypass payment requirements.

---

# 76. Payment + additional-work approval invariant

The required chain is:

```text
Professional identifies additional scope
        ↓
Inspection/findings where required
        ↓
Quote DRAFT
        ↓
PENDING_CUSTOMER
        ↓
Customer APPROVED
        ↓
Payment/authorization as required
        ↓
Additional work
```

Forbidden:

```text
additional work
   ↓
auto-charge customer
```

---

# 77. Payment + AI invariant

AI can:

- explain a price from trusted data;
- summarize a quote;
- explain payment status;
- guide a customer through checkout.

AI cannot:

- set the authoritative total;
- mark payment paid;
- refund;
- approve a quote;
- alter payment state;
- change commission;
- waive a required fee;
- release professional settlement.

See `AI_SPEC.md`.

---

# 78. Notification invariant

Financial notifications are emitted from authoritative payment events.

Example:

```text
verified provider event
    ↓
payment PAID
    ↓
outbox/event
    ↓
payment_success notification
```

Not:

```text
checkout button clicked
    ↓
“Payment successful” notification
```

See `NOTIFICATION_SPEC.md`.

---

# 79. Testing strategy

## Unit tests

Test:

- monetary arithmetic;
- fee/tax/discount calculation;
- currency validation;
- refund bounds;
- payment state transitions;
- idempotency keys;
- quote/payment linkage;
- stale checkout detection.

## Integration tests

Test:

- fixed-price payment;
- inspection payment;
- quote payment;
- additional-work payment;
- provider success;
- provider failure;
- duplicate webhook;
- delayed webhook;
- refund;
- partial refund;
- payment retry;
- reconciliation.

## Security tests

Test:

- cross-customer payment access;
- unauthorized refund;
- modified amount in request;
- modified currency;
- modified job/quote reference;
- replayed webhook;
- forged webhook;
- provider secret exposure;
- direct client status mutation.

## Concurrency tests

Test:

- double checkout;
- double-click pay;
- quote expiry during payment;
- cancellation during payment;
- refund race;
- duplicate payment attempt.

---

# 80. Financial invariants

The following must always hold:

```text
1. payment amount > 0 for ordinary charges unless explicitly supported otherwise
2. refund amount <= captured paid amount - prior refunds
3. PAID can only follow a verified processing/success path
4. REFUNDED cannot exceed previously paid amount
5. quote approval and payment are separate events
6. job completion and payment success are separate events
7. browser state never becomes financial truth
8. provider webhooks are idempotent
9. historical payment records are not deleted to “undo” a transaction
10. all financial amounts have a currency
11. all financial transitions are auditable
12. payment references link back to the correct domain object
```

---

# 81. Observability

Track:

```text
payments_created_total
payments_processing_total
payments_paid_total
payments_failed_total
payments_refunded_total
payment_provider_latency_ms
payment_provider_errors
webhook_received_total
webhook_duplicate_total
webhook_invalid_total
reconciliation_mismatch_total
refund_failure_total
```

Safe dimensions:

```text
provider
payment_type
currency
outcome
```

Do not use full card/payment credentials as metric dimensions.

---

# 82. Operational alerts

Trigger operational review for:

- spike in provider failures;
- large queue of `PROCESSING` payments;
- repeated webhook signature failures;
- refund backlog;
- reconciliation mismatches;
- duplicate provider references;
- payment state transition errors.

Alerts should avoid exposing customer financial details unnecessarily.

---

# 83. Reconciliation procedure

A practical reconciliation workflow:

```text
1. Find payments stuck in PROCESSING.
2. Query provider status.
3. Verify provider reference and amount.
4. Compare provider and Fixify state.
5. Apply only an allowed transition.
6. Write audit/reconciliation event.
7. Emit resulting notification if appropriate.
8. Flag unresolved mismatch for support/admin.
```

Do not silently overwrite mismatched records.

---

# 84. Environment separation

Use distinct payment credentials/configuration for:

```text
local/development
staging/test
production
```

Never use production provider keys in development.

Never point test environments at live customer financial records.

---

# 85. Secret management

Provider secrets must be stored in server-side secret management/environment configuration.

Never commit:

- private API keys;
- webhook signing secrets;
- secret tokens;
- raw payment credentials.

Do not expose server-only environment variables through Next.js public environment prefixes.

---

# 86. Development mode

Local development should use provider test/sandbox mode where available.

A payment test should be able to simulate:

```text
success
failure
timeout
webhook duplication
refund
partial refund
```

Do not “fake” payment success by changing the production payment status manually in the client.

Use a test provider adapter or sandbox webhook mechanism.

---

# 87. Feature flags

Payment capability may be controlled through feature flags such as:

```text
PAYMENTS_ENABLED
REFUNDS_ENABLED
EXTERNAL_PAYMENT_PROVIDER_ENABLED
PROFESSIONAL_SETTLEMENTS_ENABLED
SUBSCRIPTIONS_ENABLED
```

Feature flags must not replace authorization or state validation.

A disabled feature should fail closed.

---

# 88. Launch stages

## Stage 1 — Development

```text
sandbox provider
server-authoritative pricing
payment state machine
webhook handling
idempotency
```

## Stage 2 — Controlled pilot

```text
real provider in restricted mode
reconciliation
refund workflow
invoice generation
support/admin financial tooling
```

## Stage 3 — Public launch

```text
production provider
operational alerts
reconciliation automation
documented refund/cancellation rules
professional settlement process where applicable
```

---

# 89. Open decisions owned elsewhere

Do not duplicate final business answers here.

Relevant decisions include:

```text
OD-003  Currency
OD-004  Pricing architecture
OD-005  Payment timing
OD-006  Commission/platform fee
OD-007  Cancellation
OD-008  Rescheduling
OD-009  Refund policy
OD-011  Professional no-show
OD-012  Customer no-show
OD-014  Warranty/rework
OD-019  Materials/markup
OD-023  Premium subscription
```

The payment system implements the chosen policy; it does not invent one.

---

# 90. Required schema reconciliation before live payments

Before enabling live financial transactions, review whether the existing `DATA_MODEL.md` fully represents:

```text
[ ] payment obligations
[ ] payment attempts where required
[ ] immutable price snapshots
[ ] invoice line-item detail
[ ] refund traceability
[ ] provider webhook/event identity
[ ] professional settlement/earnings if live payouts exist
[ ] reconciliation records or equivalent audit trail
```

If a missing abstraction is required, update:

```text
DATA_MODEL.md
STATE_MACHINES.md
RBAC.md
OPEN_DECISIONS.md
```

before implementing the migration.

---

# 91. Coding-agent rules

A coding agent implementing payments must follow these rules:

1. Never trust client totals.
2. Never allow browser code to mark payments `PAID`.
3. Never bypass the payment state machine.
4. Never treat a payment return URL as proof of payment.
5. Never trust a client-supplied provider event.
6. Always verify webhook authenticity.
7. Always process provider events idempotently.
8. Never create duplicate business charges from retry clicks.
9. Never refund more than the refundable balance.
10. Never delete historical payments to undo a transaction.
11. Never silently change historical invoice totals.
12. Never expose raw payment credentials.
13. Never invent currency, commission, tax or refund policy.
14. Never let AI authorize charges or refunds.
15. Never use payment status to infer job completion without the canonical job workflow.
16. When a financial business rule is missing, consult `OPEN_DECISIONS.md` instead of inventing one.

---

# 92. Definition of done

The payment system is ready for controlled real transactions when:

```text
[ ] pricing is server-authoritative
[ ] money uses precise representation
[ ] payment states match STATE_MACHINES.md
[ ] checkout is provider-backed
[ ] webhook signatures are verified
[ ] webhook processing is idempotent
[ ] stale/duplicate checkout is protected
[ ] refund mechanics are implemented safely
[ ] invoices are traceable
[ ] financial actions are audited
[ ] RBAC/RLS protects financial data
[ ] customer UI never controls financial truth
[ ] reconciliation exists
[ ] provider failure has a safe path
[ ] notifications are event-driven
[ ] test/sandbox mode is available
[ ] commercial decisions required for the pilot are resolved
```

The desired property is:

> A payment can be explained from Fixify's records after the fact, and no browser, model or duplicate provider event can silently rewrite financial truth.

# END OF PAYMENT SPECIFICATION
