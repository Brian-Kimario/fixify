# FIXIFY — API SPECIFICATION

## 1. Purpose

This document defines the contract between the Fixify Next.js application, Supabase, and external service integrations.

It answers:

- What operations exist?
- Which role may call them?
- Which operations may be performed directly through Supabase?
- Which operations must go through Next.js/server/database functions?
- What input is accepted?
- What output is returned?
- What errors are expected?
- Which operations are authoritative?

This document must be used together with:

```text
docs/DATA_MODEL.md
docs/RBAC.md
docs/STATE_MACHINES.md
docs/PRODUCT_DECISIONS.md
```

If those documents conflict, the following precedence applies:

```
PRODUCT_DECISIONS
        ↓
DATA_MODEL
        ↓
RBAC
        ↓
STATE_MACHINES
        ↓
API
        ↓
UI
```

---

# 2. API Architecture

Fixify uses a hybrid application boundary.

```
Next.js UI
    │
    ├── Safe read → Supabase client + RLS
    │
    ├── Simple user-owned mutation → Supabase client + RLS
    │
    └── Sensitive/business operation → Next.js server endpoint/server action
                                              ↓
                                     Database function / transaction
                                              ↓
                                      Supabase PostgreSQL
```

External integrations:

```
Next.js / Edge Function
        ↓
External Provider
        ↓
Verified callback/webhook
        ↓
Server/database
```

Examples:

- Authentication → Supabase Auth
- Database → Supabase PostgreSQL
- Storage → Supabase Storage
- Realtime → Supabase Realtime
- AI → server/Edge Function
- Payments → server/Edge Function
- Email/notifications → server/Edge Function/provider adapter
- Maps → server or controlled client integration depending on provider

---

# 3. API Design Principles

## 3.1 No parallel backend duplication

Do not create a second independent REST/GraphQL backend that duplicates the Supabase data model.

Next.js server routes exist to:

- protect secrets
- orchestrate workflows
- invoke controlled database operations
- validate complex requests
- integrate external providers
- provide frontend-specific contracts where useful

Supabase remains the primary data platform.

## 3.2 RLS is mandatory

Every request that reads or changes user-owned data must still be protected by Supabase Row Level Security.

A successful API route does not replace RLS.

## 3.3 Client input is untrusted

Never trust:

- price
- total
- role
- payment status
- verification status
- job state
- professional rating
- customer ID
- actor ID

The authenticated session is the identity authority.

Sensitive values are derived server-side.

---

# 4. API Layers

### Layer A — Supabase Client Reads

Suitable for:

- service catalogue
- own profile
- own properties
- own bookings
- own history
- own notifications
- authorized job reads

Use:

- supabase-js
- RLS

### Layer B — Supabase Client + RLS Mutations

Suitable for low-risk ownership mutations such as:

- update own profile
- create own property
- update own property
- create draft request
- upload allowed media metadata
- mark own notification read

Only when the table's RLS and constraints are sufficient.

### Layer C — Postgres RPC / Controlled Database Functions

Mandatory for critical operations such as:

- job state transition
- quote approval
- quote decline
- authoritative price calculation
- professional assignment
- professional verification
- admin reassignment
- refund operations where applicable

These operations must not be implemented as arbitrary `.update()` calls against sensitive columns.

### Layer D — Next.js Server Routes / Server Actions

Use where the application needs:

- external API calls
- secure provider credentials
- orchestration across multiple systems
- server-side validation
- custom frontend API contracts

### Layer E — Edge Functions

Use for:

- payment webhooks
- AI requests
- provider callbacks
- notification dispatch
- long-running/external workloads

---

# 5. Authentication API

Supabase Auth owns authentication.

### Register

**Supabase:**
```
signUp()
```

Email/password registration.

The application then creates/synchronizes the application profile.

### Login

**Supabase:**
```
signInWithPassword()
```

### Google Login

**Supabase:**
```
signInWithOAuth({
  provider: "google"
})
```

OAuth callback:

```
/auth/callback
```

Next.js exchanges the authorization code for a session.

The browser must not manually manufacture or persist authentication tokens as the source of truth.

### Logout

**Supabase:**
```
signOut()
```

---

# 6. Profile API

### GET /api/me

**Purpose:**

Return the authenticated user's application profile.

**Auth:**

Authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "full_name": "string",
  "phone": "string|null",
  "avatar_url": "string|null",
  "role": "customer|professional|support|admin"
}
```

**Rules:**

- `id` comes from authenticated identity.
- Role comes from server/database.
- Client cannot request an arbitrary user profile through this endpoint.

### PATCH /api/me

**Purpose:**

Update allowed profile fields.

**Allowed:**
- full_name
- phone
- avatar_url

**Forbidden:**
- role
- verification_status
- rating_average
- completed_jobs_count

---

# 7. Customer Property API

### GET /api/properties

Returns properties owned by authenticated customer.

**Auth:**

CUSTOMER.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "property_type": "string",
      "address": {},
      "created_at": "timestamp"
    }
  ]
}
```

### POST /api/properties

Creates a property for the authenticated customer.

**Request:**
```json
{
  "name": "Home",
  "property_type": "apartment",
  "address_id": "uuid",
  "notes": "string|null"
}
```

**Server derives:**
- owner_customer_id
- created_at

Do not accept `owner_customer_id` from the client as authoritative.

### GET /api/properties/:id

Returns a property only if the authenticated user is authorized.

### PATCH /api/properties/:id

Updates user-editable property metadata.

Cannot rewrite historical service records.

---

# 8. Address API

### GET /api/addresses

Returns authenticated customer's addresses.

### POST /api/addresses

Creates customer-owned address.

### PATCH /api/addresses/:id

Updates customer-owned address.

### DELETE /api/addresses/:id

Use only where business policy permits.

Prefer archive/inactive handling for addresses referenced by historical bookings.

---

# 9. Service Catalogue API

Catalogue is mostly read-oriented for customers/professionals.

### GET /api/service-categories

Returns active service categories.

**Auth:**

Public.

**Example:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "AC & Cooling",
      "slug": "ac-cooling",
      "description": "..."
    }
  ]
}
```

### GET /api/services

Optional query:

```
?category_id=<uuid>
```

Returns active services.

### GET /api/services/:id

Returns service detail:

- category
- service
- pricing model
- base/inspection pricing where publicly displayable
- options
- supported materials

---

# 10. Admin Catalogue API

ADMIN only.

### POST /api/admin/services

Create service.

### PATCH /api/admin/services/:id

Update service configuration.

### POST /api/admin/services/:id/activate

Activate service.

### POST /api/admin/services/:id/deactivate

Deactivate service.

Prefer explicit operations instead of generic unrestricted status updates.

---

# 11. Service Request API

A service request represents:

- customer problem
- not a confirmed booking.

### POST /api/service-requests

Create a request.

**Auth:**

CUSTOMER.

**Request:**
```json
{
  "property_id": "uuid",
  "input_text": "My AC is running but not cooling",
  "service_id": "uuid|null",
  "category_id": "uuid|null",
  "intake_source": "manual|ai|voice|media"
}
```

**Server rules:**
- customer owns the property
- selected service/category is active
- intake source is accepted
- customer identity comes from session
- timestamps are server-generated

**Response:**
```json
{
  "id": "uuid",
  "status": "DRAFT"
}
```

### GET /api/service-requests/:id

**CUSTOMER:**

own request only

**PROFESSIONAL:**

only if the request is linked to an authorized job

**ADMIN/SUPPORT:**

according to RBAC.

### PATCH /api/service-requests/:id

Allowed only while the request remains editable.

Cannot modify a converted historical request in a way that changes what the completed job recorded.

---

# 12. AI Intake API

### POST /api/ai/conversations

Creates an AI intake conversation.

**Auth:**

CUSTOMER.

**Request:**
```json
{
  "service_request_id": "uuid|null",
  "initial_message": "string"
}
```

### POST /api/ai/conversations/:id/messages

Send a message.

**Auth:**

CUSTOMER who owns the conversation.

**Behavior:**
```
Next.js
  ↓
validate session + conversation ownership
  ↓
AI provider
  ↓
structured result
  ↓
persist message/assessment
```

Never expose the AI provider secret to the browser.

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "sender_type": "assistant",
    "content": "string"
  },
  "assessment": {
    "likely_service_category": "uuid|null",
    "likely_service": "uuid|null",
    "confidence": "low|moderate|high",
    "problem_summary": "string",
    "recommended_next_step": "string",
    "needs_human_review": true
  }
}
```

The API must not return a fabricated technical certainty.

---

# 13. AI Classification Rules

AI may:

- ask questions
- summarize
- classify likely service
- request useful media
- recommend inspection
- escalate

AI may not:

- guarantee diagnosis
- set final repair price
- approve additional work
- confirm payment
- mark a job complete
- override professional findings

---

# 14. Media API

### POST /api/media/upload

Prefer signed/private storage upload flow.

**Request:**
```json
{
  "context": "service_request|job|verification|property",
  "context_id": "uuid",
  "media_type": "image|video|audio|document",
  "filename": "string",
  "content_type": "string",
  "size_bytes": 12345
}
```

The server validates:

- allowed media type
- size
- context ownership/access

Storage path is generated server-side.

### POST /api/media/complete

Used after a successful upload to finalize the metadata record.

### GET /api/media/:id

Must authorize access to the underlying context.

Do not expose arbitrary storage paths.

---

# 15. Booking API

### POST /api/bookings

Creates/requests a booking based on an eligible service request.

**Auth:**

CUSTOMER.

**Request:**
```json
{
  "service_request_id": "uuid",
  "property_id": "uuid",
  "service_id": "uuid",
  "scheduled_start": "timestamp",
  "scheduled_end": "timestamp|null",
  "professional_id": "uuid|null"
}
```

**Server must validate:**
- customer owns service request
- customer owns property
- service is active
- professional is eligible if specified
- professional is available
- professional covers service area
- time slot remains available
- pricing model
- authoritative amount

The server must re-check availability at confirmation.

### GET /api/bookings

**CUSTOMER:**
own bookings.

**PROFESSIONAL:**
assigned/authorized bookings.

**ADMIN:**
operational access.

### GET /api/bookings/:id

Returns booking details according to RBAC.

---

# 16. Booking Cancellation API

### POST /api/bookings/:id/cancel

Do not use:

```
PATCH { status: "CANCELLED" }
```

**Request:**
```json
{
  "reason": "string"
}
```

**Server:**
- authorization
- cancellation policy
- financial implications
- booking transition
- job implications if applicable
- audit log
- notification

Exact cancellation rules come from PRODUCT_DECISIONS.md.

---

# 17. Booking Rescheduling API

### POST /api/bookings/:id/reschedule

**Request:**
```json
{
  "scheduled_start": "timestamp",
  "scheduled_end": "timestamp|null",
  "reason": "string"
}
```

**Server revalidates:**
- availability
- service area
- state
- policy

The previous schedule remains auditable.

---

# 18. Professional Discovery API

### GET /api/professionals

This endpoint must never expose all professionals indiscriminately.

Query parameters may include:

- service_id
- category_id
- property_id
- scheduled_start

The server calculates eligibility.

Returned fields should be customer-safe:

- id
- display_name
- avatar
- rating_average
- completed_jobs_count
- verification_badge
- relevant_service
- estimated_distance/arrival where supported

Do not return:

- private phone
- private address
- verification documents
- earnings
- internal notes

---

# 19. Professional Assignment API

### POST /api/admin/jobs/:id/assign

ADMIN/SUPPORT only where permitted.

**Request:**
```json
{
  "professional_id": "uuid",
  "reason": "string"
}
```

**Server validates:**

- professional verified
- professional skill matches
- service area matches
- availability
- job state

Assignment creates the appropriate job event/audit record.

---

# 20. Professional Onboarding API

### POST /api/professionals/onboarding

Creates onboarding information.

### PATCH /api/professionals/onboarding

Updates editable onboarding details.

### POST /api/professionals/verification/submit

Submits verification package.

Professional cannot set:

- status = VERIFIED

---

# 21. Professional Availability API

### GET /api/professionals/me/availability

PROFESSIONAL only.

### POST /api/professionals/me/availability

Create availability rule.

### PATCH /api/professionals/me/availability/:id

Update own availability.

Server must protect existing accepted bookings from accidental schedule corruption.

---

# 22. Professional Job Request API

### GET /api/professionals/me/job-offers

Returns eligible incoming job offers.

---

# 23. Job Acceptance API

### POST /api/jobs/:id/accept

PROFESSIONAL only.

**Server validates:**

- job assigned to professional
- professional verified
- professional not suspended
- job still in ASSIGNED

Then:

```
ASSIGNED → ACCEPTED
```

through the state transition authority.

---

# 24. Job Rejection API

### POST /api/jobs/:id/reject

PROFESSIONAL.

**Request:**
```json
{
  "reason": "string"
}
```

Valid transition:

```
ASSIGNED → REJECTED
```

or controlled reassignment flow according to the state-machine rules.

---

# 25. Job On-the-Way API

### POST /api/jobs/:id/on-the-way

PROFESSIONAL.

Valid:

```
ACCEPTED → ON_THE_WAY
```

Server creates event and timestamp.

---

# 26. Job Arrival API

### POST /api/jobs/:id/arrive

PROFESSIONAL.

Valid:

```
ON_THE_WAY → ARRIVED
```

Location capture, if used, must follow product/privacy policy.

---

# 27. Job Inspection API

### POST /api/jobs/:id/inspection

PROFESSIONAL.

**Request:**
```json
{
  "findings": "string",
  "recommendation": "string",
  "media_ids": ["uuid"]
}
```

Server validates assignment and job state.

Inspection becomes a separate persisted record.

---

# 28. Start Work API

### POST /api/jobs/:id/start-work

Valid primarily from:

```
INSPECTION → IN_PROGRESS
```

or:

```
AWAITING_APPROVAL → IN_PROGRESS
```

only after the required approval has been verified.

Do not allow the client to claim approval by passing:

```json
{
  "approved": true
}
```

---

# 29. Quote API

### POST /api/jobs/:id/quotes

PROFESSIONAL.

**Request:**
```json
{
  "reason": "string",
  "items": [
    {
      "item_type": "labour|material|service|fee",
      "description": "string",
      "quantity": 1,
      "unit_price": 100,
      "material_id": "uuid|null"
    }
  ]
}
```

**Server rules:**
- professional is authorized for job
- job is in an inspection-compatible state
- materials/services are valid
- prices are recalculated/validated server-side
- quote total is authoritative server-side

---

# 30. Quote Submission

### POST /api/quotes/:id/submit

Changes:

```
DRAFT → PENDING_CUSTOMER
```

Professional only.

---

# 31. Quote Approval

### POST /api/quotes/:id/approve

CUSTOMER only.

**Server must:**

```
authenticate
→ verify quote belongs to customer's job
→ verify quote is PENDING_CUSTOMER
→ verify quote not expired
→ recalculate amount
→ approve transactionally
→ create audit log
→ create notification
→ allow relevant job transition
```

This is a critical operation.

Do not expose generic quote status mutation.

---

# 32. Quote Decline

### POST /api/quotes/:id/decline

CUSTOMER only.

**Request:**
```json
{
  "reason": "string"
}
```

Transition:

```
PENDING_CUSTOMER → DECLINED
```

The system must determine the correct job recovery path.

---

# 33. Job Completion API

### POST /api/jobs/:id/complete

PROFESSIONAL.

**Server checks:**

- job assigned to actor
- current state permits completion
- required inspection/work data exists
- required completion evidence exists where policy requires
- required approvals exist

Then:

```
IN_PROGRESS → COMPLETED
```

A job cannot be completed by manipulating a status field directly.

---

# 34. Job Event API

### GET /api/jobs/:id/events

Returns authorized timeline events.

**Customer:**

customer-visible events

**Professional:**

operational events permitted to them

**Admin:**

full authorized operational view

Do not expose internal audit metadata to ordinary customers.

---

# 35. Payment API

### POST /api/payments/create-order

This is a controlled server-side operation.

**Request:**
```json
{
  "job_id": "uuid",
  "payment_type": "inspection|service|material|additional_work"
}
```

**The server:**

- loads authoritative amount
- validates customer/job
- creates provider order
- stores pending payment
- returns checkout information

Client cannot submit:

- amount
- currency override
- professional payout

as authority.

---

# 36. Payment Status API

### GET /api/payments/:id

Returns payment status visible to authorized user.

**Example:**

```json
{
  "id": "uuid",
  "status": "pending",
  "amount": 1150,
  "currency": "INR",
  "payment_type": "additional_work"
}
```

---

# 37. Payment Webhook

**Example:**

```
POST /functions/v1/payment-webhook
```

The webhook must:

```
verify provider signature
→ find provider event/payment
→ enforce idempotency
→ update payment
→ execute required business transition
→ generate invoice if appropriate
→ write audit record
```

The webhook must never trust the browser.

---

# 38. Invoice API

### GET /api/invoices/:id

Authorized customer/professional/admin access.

### GET /api/jobs/:id/invoice

Convenience endpoint for job-associated invoice.

Invoice data is server-generated.

---

# 39. Review API

### POST /api/jobs/:id/review

CUSTOMER.

**Request:**
```json
{
  "rating": 5,
  "comment": "string"
}
```

**Server validates:**

- job belongs to customer
- job is eligible for review
- customer has not already reviewed if one-review policy applies

### GET /api/professionals/:id/reviews

Returns customer-visible review information according to privacy rules.

---

# 40. Complaint API

### POST /api/jobs/:id/complaints

CUSTOMER.

**Request:**
```json
{
  "reason": "string",
  "description": "string",
  "media_ids": ["uuid"]
}
```

Server validates job ownership/eligibility.

### GET /api/complaints/:id

Returns complaint information to authorized participants.

### POST /api/complaints/:id/respond

PROFESSIONAL where permitted.

### POST /api/admin/complaints/:id/resolve

SUPPORT/ADMIN according to RBAC.

Resolution must create an audit record.

---

# 41. Property History API

### GET /api/properties/:id/service-history

**CUSTOMER:**

Own property.

**PROFESSIONAL:**

Only job-authorized relevant history.

**ADMIN:**

Authorized operational access.

### GET /api/properties/:id/assets

Returns property assets.

### POST /api/properties/:id/assets

Customer creates/editable asset metadata where supported.

---

# 42. Notification API

### GET /api/notifications

Authenticated user sees own notifications.

### POST /api/notifications/:id/read

Marks own notification as read.

No user may modify another user's notifications.

---

# 43. Rebooking API

### POST /api/jobs/:id/rebook

CUSTOMER.

**Server:**

- checks completed job
- checks professional eligibility
- checks service still active
- checks professional availability
- checks service area
- creates new service request/booking as appropriate

Never duplicate the previous job as the new operational job.

---

# 44. Admin User Management API

### GET /api/admin/customers

ADMIN/support according to RBAC.

### GET /api/admin/customers/:id

Authorized administrative access.

### POST /api/admin/users/:id/suspend

ADMIN.

### POST /api/admin/users/:id/reactivate

ADMIN.

Exact account-suspension business rules remain in product decisions.

---

# 45. Professional Verification API

### GET /api/admin/professionals/:id/verification

ADMIN/authorized support.

### POST /api/admin/professionals/:id/verify

ADMIN/authorized verifier.

### POST /api/admin/professionals/:id/reject

ADMIN/authorized verifier.

### POST /api/admin/professionals/:id/suspend

ADMIN.

These operations are audit-sensitive.

---

# 46. Admin Job Operations

### GET /api/admin/jobs

Filters:

- state
- service
- professional
- customer
- date
- location

### POST /api/admin/jobs/:id/reassign

Authorized admin/support.

### POST /api/admin/jobs/:id/cancel

Authorized admin/support.

### GET /api/admin/jobs/:id/timeline

Returns operational history.

---

# 47. API Response Convention

Successful response:

```json
{
  "data": {},
  "error": null
}
```

For collections:

```json
{
  "data": {
    "items": [],
    "pagination": {}
  },
  "error": null
}
```

Errors:

```json
{
  "data": null,
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "The selected time slot is no longer available.",
    "details": null
  }
}
```

Do not leak database internals into messages.

---

# 48. Standard Error Codes

Use stable application-level codes.

### Authentication

- UNAUTHENTICATED
- FORBIDDEN
- INVALID_SESSION

### Resource

- NOT_FOUND
- RESOURCE_NOT_OWNED
- RESOURCE_INACTIVE

### Booking

- INVALID_BOOKING
- SLOT_UNAVAILABLE
- PROFESSIONAL_UNAVAILABLE
- PROFESSIONAL_NOT_ELIGIBLE
- SERVICE_UNAVAILABLE_IN_AREA

### Job

- INVALID_JOB_STATE
- UNAUTHORIZED_JOB_ACTION
- MISSING_COMPLETION_REQUIREMENT

### Quote

- QUOTE_NOT_APPROVABLE
- QUOTE_EXPIRED
- QUOTE_ALREADY_DECIDED
- QUOTE_TOTAL_INVALID

### Payment

- PAYMENT_NOT_ALLOWED
- PAYMENT_PROVIDER_ERROR
- PAYMENT_NOT_CONFIRMED
- PAYMENT_ALREADY_PROCESSED

### Media

- MEDIA_TYPE_NOT_ALLOWED
- MEDIA_TOO_LARGE
- MEDIA_ACCESS_DENIED

### AI

- AI_UNAVAILABLE
- AI_ESCALATION_REQUIRED
- AI_CLASSIFICATION_UNCERTAIN

---

# 49. HTTP Status Convention

Use:

- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 409 Conflict
- 422 Unprocessable Entity
- 429 Too Many Requests
- 500 Internal Server Error
- 502 Bad Gateway

Important business conflicts such as a slot becoming unavailable should generally return:

```
409 Conflict
```

rather than a generic 500.

---

# 50. Pagination

Collections must support pagination.

**Example:**

```
GET /api/bookings?page=1&page_size=20
```

**Response:**

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "has_more": true
  }
}
```

For large datasets, cursor pagination may be introduced.

Admin lists should not load the entire database.

---

# 51. Filtering

Use explicit query parameters.

**Example:**

```
GET /api/admin/jobs?
  state=IN_PROGRESS&
  service_id=<uuid>&
  professional_id=<uuid>
```

Avoid arbitrary SQL-like filter parameters.

Whitelist supported filters.

---

# 52. Sorting

Only expose supported sort fields.

**Example:**

```
sort=created_at
order=desc
```

Do not pass raw column names directly into SQL.

---

# 53. Idempotency

The following operations should support idempotency:

- payment order creation where applicable
- payment webhooks
- quote approval
- booking confirmation if retries are possible
- rebooking
- critical notification dispatch

Client may send:

```
Idempotency-Key
```

for retryable mutation endpoints.

---

# 54. Concurrency

The server must revalidate critical resources immediately before committing.

**Examples:**

- professional availability
- booking slot
- quote validity
- job state
- payment state

Use database transactions and/or locking where needed.

---

# 55. API Authorization Model

Each protected endpoint should evaluate:

```
authenticated?
    ↓
role allowed?
    ↓
resource owned/assigned?
    ↓
current state allows action?
    ↓
business rules satisfied?
    ↓
execute
```

**Example:**

```
POST /api/jobs/:id/complete
```

```
authenticated?
        ↓
professional?
        ↓
assigned to this job?
        ↓
verified/not suspended?
        ↓
job state = IN_PROGRESS?
        ↓
completion requirements satisfied?
        ↓
transition to COMPLETED
```

---

# 56. Supabase Direct-Access Rules

The frontend may directly query:

- service_categories
- services
- service_options
- service_option_values
- supported public materials/brands
- own profiles
- own addresses
- own properties
- own bookings/jobs where RLS permits
- own notifications

The frontend should call controlled server/database functions for:

- job state transitions
- quote approval
- professional assignment
- professional verification
- payment operations
- refund operations
- financial calculations
- admin operations
- privileged actions
- AI provider calls
- payment webhooks

---

# 57. No Generic Mutation Endpoints

Do not create:

```
PATCH /api/jobs/:id
PATCH /api/quotes/:id
PATCH /api/payments/:id
PATCH /api/professionals/:id
```

for arbitrary field updates.

Prefer intent-specific operations:

```
/jobs/:id/accept
/jobs/:id/reject
/jobs/:id/on-the-way
/jobs/:id/arrive
/jobs/:id/start-work
/jobs/:id/complete

/quotes/:id/submit
/quotes/:id/approve
/quotes/:id/decline

/admin/professionals/:id/verify
/admin/professionals/:id/suspend
```

This makes authorization and business rules explicit.

---

# 58. Request Validation

Every server mutation must use a schema validator.

**Examples:**

- CreatePropertySchema
- CreateServiceRequestSchema
- CreateBookingSchema
- CancelBookingSchema
- RescheduleBookingSchema
- CreateInspectionSchema
- CreateQuoteSchema
- ApproveQuoteSchema
- CreateReviewSchema
- CreateComplaintSchema

Validate:

- format
- length
- allowed enum
- ownership
- cross-field rules

---

# 59. API and Database Naming

Use the vocabulary from DATA_MODEL.md.

Do not create variants such as:

- serviceRequest
- request
- issue
- ticket
- problem

for the same domain object.

**Canonical naming:**

- service_request
- booking
- job
- quote
- inspection
- payment
- invoice
- property
- property_service_history
- professional_profile

Frontend camelCase mapping is allowed, but API/domain names must remain unambiguous.

---

# 60. Realtime API Behavior

Realtime is not a replacement for API authorization.

**Example:**

```
job changes in database
       ↓
Supabase Realtime event
       ↓
customer/professional UI receives update
       ↓
UI fetches authoritative current record
```

The UI should not treat a client-originated event as authority.

---

# 61. API Caching

Safe-to-cache data:

- active service catalogue
- service categories
- static public content

Be careful caching:

- job state
- availability
- payment state
- quotes
- notifications

Never serve stale availability as though it guarantees a booking slot.

---

# 62. Rate Limiting

Apply rate limits to:

- login/auth endpoints
- AI endpoints
- media upload initiation
- payment operations
- complaint creation where appropriate
- professional job actions
- public search endpoints

AI requests should especially be protected against abuse.

---

# 63. Logging

Log:

- request ID
- authenticated user ID where appropriate
- endpoint/action
- success/failure
- error code
- latency

Do not log:

- passwords
- authentication secrets
- service-role key
- payment secrets
- private verification documents
- unnecessary sensitive media contents

---

# 64. API Audit Requirements

The following API operations must generate audit records:

```
/admin/professionals/:id/verify
/admin/professionals/:id/reject
/admin/professionals/:id/suspend

/jobs/:id/accept
/jobs/:id/reject
/jobs/:id/on-the-way
/jobs/:id/arrive
/jobs/:id/complete

/quotes/:id/approve
/quotes/:id/decline

payment confirmation/refund

/admin/jobs/:id/assign
/admin/jobs/:id/reassign
/admin/jobs/:id/cancel

complaint resolution

role changes
```

Audit generation should occur server-side.

---

# 65. API Security Rules

- Never trust client role.
- Never trust client user ID as actor identity.
- Never trust client amount.
- Never trust client payment status.
- Never trust client job state.
- Never trust client quote total.
- Never expose service-role credentials.
- Never expose private storage URLs without authorization.
- Never permit arbitrary resource IDs without ownership checks.
- Never use a generic mutation endpoint for protected business entities.

---

# 66. Frontend-to-API Mapping

### Customer Dashboard

```
→ GET /api/me
→ GET /api/properties
→ GET /api/bookings
→ GET /api/notifications
```

### Problem intake

```
→ POST /api/service-requests
→ POST /api/ai/conversations
→ POST /api/ai/conversations/:id/messages
→ POST /api/media/upload
```

### Booking

```
→ GET /api/services
→ GET /api/professionals
→ POST /api/bookings
```

### Active job

```
→ GET /api/bookings/:id
→ GET /api/jobs/:id/events
→ Realtime subscription
```

### Quote

```
→ GET /api/quotes/:id
→ POST /api/quotes/:id/approve
→ POST /api/quotes/:id/decline
```

### Payment

```
→ POST /api/payments/create-order
→ GET /api/payments/:id
```

### History

```
→ GET /api/properties/:id/service-history
```

### Review

```
→ POST /api/jobs/:id/review
```

### Complaint

```
→ POST /api/jobs/:id/complaints
```

---

# 67. Professional-to-API Mapping

### Profile

```
→ GET /api/me
→ PATCH /api/me
```

### Verification

```
→ POST /api/professionals/verification/submit
```

### Availability

```
→ GET /api/professionals/me/availability
→ POST /api/professionals/me/availability
```

### Job offers

```
→ GET /api/professionals/me/job-offers
```

### Accept

```
→ POST /api/jobs/:id/accept
```

### Reject

```
→ POST /api/jobs/:id/reject
```

### Travel

```
→ POST /api/jobs/:id/on-the-way
```

### Arrival

```
→ POST /api/jobs/:id/arrive
```

### Inspection

```
→ POST /api/jobs/:id/inspection
```

### Quote

```
→ POST /api/jobs/:id/quotes
→ POST /api/quotes/:id/submit
```

### Work

```
→ POST /api/jobs/:id/start-work
→ POST /api/jobs/:id/complete
```

### Earnings

```
→ GET /api/professionals/me/earnings
```

---

# 68. Admin-to-API Mapping

### Jobs

```
→ GET /api/admin/jobs
→ GET /api/admin/jobs/:id
→ POST /api/admin/jobs/:id/assign
→ POST /api/admin/jobs/:id/reassign
→ POST /api/admin/jobs/:id/cancel
```

### Professionals

```
→ GET /api/admin/professionals
→ GET /api/admin/professionals/:id
→ GET /api/admin/professionals/:id/verification
→ POST /api/admin/professionals/:id/verify
→ POST /api/admin/professionals/:id/reject
→ POST /api/admin/professionals/:id/suspend
```

### Customers

```
→ GET /api/admin/customers
→ GET /api/admin/customers/:id
```

### Services

```
→ POST /api/admin/services
→ PATCH /api/admin/services/:id
```

### Complaints

```
→ GET /api/admin/complaints
→ POST /api/admin/complaints/:id/resolve
```

### Analytics

```
→ GET /api/admin/analytics
```

---

# 69. API Versioning

MVP may begin with:

```
/api/...
```

If public clients or major external integrations are introduced, adopt:

```
/api/v1/...
```

Do not prematurely version every internal call if it adds no value.

---

# 70. API Documentation Requirement

Every production endpoint must have:

- purpose
- authentication requirement
- allowed roles
- request schema
- response schema
- error codes
- business rules
- side effects
- audit behavior

This can later be represented in OpenAPI where useful.

---

# 71. Definition of Done for an API Endpoint

An endpoint is not complete until:

- request validation exists
- authorization exists
- RLS remains enforced
- business rules exist
- error handling exists
- success response is defined
- loading/retry implications are understood
- audit requirements are satisfied
- tests exist

For financial endpoints:

- server-calculated amount
- idempotency
- provider verification
- duplicate handling
- refund/failure behavior

For job endpoints:

- state-machine validation
- actor validation
- event creation
- audit behavior

---

# 72. Critical Test Cases

### Customer

- Customer cannot read another customer's property.
- Customer cannot create booking against another customer's property.
- Customer cannot approve another customer's quote.
- Customer cannot set job.current_state directly.

### Professional

- Professional cannot accept another professional's job.
- Unverified professional cannot accept a live job.
- Professional cannot modify payment state.
- Professional cannot approve own quote.

### Admin

- Support cannot perform admin-only configuration.
- Admin assignment still validates professional eligibility.
- Admin operations produce audit records.

### Payments

- Duplicate webhook does not duplicate payment.
- Invalid signature is rejected.
- Client-provided amount is ignored as authority.

### State

- Invalid transitions fail.
- Quote approval without ownership fails.
- Quote approval after expiry fails.
- Completion before required work/approval fails.

---

# 73. Golden API Sequence

The core successful workflow is:

```
POST /api/service-requests
        ↓
POST /api/bookings
        ↓
POST /api/jobs/:id/accept
        ↓
POST /api/jobs/:id/on-the-way
        ↓
POST /api/jobs/:id/arrive
        ↓
POST /api/jobs/:id/inspection
        ↓
POST /api/jobs/:id/quotes
        ↓
POST /api/quotes/:id/submit
        ↓
POST /api/quotes/:id/approve
        ↓
POST /api/jobs/:id/start-work
        ↓
POST /api/jobs/:id/complete
        ↓
POST /api/payments/create-order
        ↓
payment provider webhook
        ↓
GET /api/invoices/:id
        ↓
POST /api/jobs/:id/review
        ↓
GET /api/properties/:id/service-history
```

Each operation has a distinct responsibility.

---

# 74. Final API Principle

The API is designed around explicit intent.

**Bad:**

```
PATCH job.status
```

**Good:**

```
POST /jobs/:id/accept
POST /jobs/:id/on-the-way
POST /jobs/:id/arrive
POST /jobs/:id/start-work
POST /jobs/:id/complete
```

**Bad:**

```
PATCH quote.status = approved
```

**Good:**

```
POST /quotes/:id/approve
```

**Bad:**

```
POST payment { amount: 100 }
```

**Good:**

```
POST /payments/create-order
```

where the server derives the amount.

The rule is:

- Frontend expresses intent.
- Server validates intent.
- Database enforces integrity.
- External providers confirm external facts.
- Audit logs record important actions.

---

# END OF API SPECIFICATION
