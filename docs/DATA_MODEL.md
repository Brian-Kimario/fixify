# FIXIFY — DATA MODEL

## 1. Purpose

This document is the shared data vocabulary for Fixify.

It is intended to be read by:

- Next.js developers
- Kiro
- Supabase/Postgres implementation work
- UI developers
- anyone adding a Fixify feature

The model is based on the Fixify master blueprint and the supplied Fixify project brief.

The original brief explicitly describes a system containing a customer/user interface, backend/database, service-provider module and admin panel, and identifies service selection, problem description, media upload, material selection, professional verification, booking and rebooking as core capabilities. [Source: Fixify project brief.]

The expanded Fixify definition additionally establishes AI-assisted problem intake, job tracking, quotes/additional-work approval, payments, invoices, reviews, complaints and property service history.

---

# 2. Modeling Rules

## 2.1 Source-of-truth distinction

This document uses three levels:

### NORMATIVE
Explicitly supported by the Fixify blueprint/brief.

### IMPLEMENTATION BASELINE
A technical structure required to make the documented product buildable, but where the source material does not specify the exact database representation.

### OPEN
A business/product decision that must remain configurable and must not be silently hard-coded.

When a field or rule is marked IMPLEMENTATION BASELINE, it is not being presented as a final business decision.

---

# 3. Core Domain Model

The core relationship is:

```text
User
 ├── CustomerProfile
 └── ProfessionalProfile

Customer
 ├── Properties
 ├── ServiceRequests
 ├── Bookings
 ├── Payments
 ├── Reviews
 └── Complaints

Property
 ├── Addresses
 ├── Bookings
 ├── Jobs
 ├── PropertyAssets
 └── PropertyServiceHistory

ServiceCategory
 └── Service
      ├── ServiceOptions
      └── Supported Materials

Professional
 ├── Verification
 ├── Skills
 ├── Availability
 └── Service Areas

ServiceRequest
 └── Booking
      └── Job
           ├── JobEvents
           ├── Inspections
           ├── Quotes
           ├── Payments
           ├── Invoice
           ├── Review
           └── Complaint

Job
 └── PropertyServiceHistory
```

---

# 4. Identity and User Model

## 4.1 auth.users

**Source level:** NORMATIVE from the selected Supabase architecture.

Supabase Auth owns authentication identity.

Do not duplicate authentication credentials in application tables.

Important identity:

```text
auth.users.id
```

This is the authenticated user's UUID.

---

## 4.2 profiles

**Purpose:** application-level identity and common user information.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key; references `auth.users.id` |
| full_name | text | Display name |
| phone | text | Contact number |
| avatar_url | text | Optional profile image |
| role | enum | customer / professional / admin / support |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

### Rules

- `profiles.id` must correspond to `auth.users.id`.
- A user must have exactly one primary application role in MVP.
- Role changes require privileged authorization.
- Authentication remains in Supabase Auth.

---

# 5. Customer Domain

## 5.1 customer_profiles

**Purpose:** customer-specific profile information.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | PK/FK to `profiles.id` |
| preferences | jsonb | Optional non-critical preferences |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

Keep this table minimal initially. Do not put booking, property or payment data into the customer profile.

---

# 6. Address Model

## 6.1 addresses

**Purpose:** reusable service locations.

A customer may have more than one address.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| customer_id | uuid | Owner |
| label | text | e.g. Home, Office |
| address_line_1 | text | Address |
| address_line_2 | text | Optional |
| area | text | Optional |
| city | text | Required where applicable |
| state_region | text | Optional depending on market |
| postal_code | text | Optional depending on market |
| latitude | numeric | Optional |
| longitude | numeric | Optional |
| access_notes | text | Optional instructions |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

### Security

Customers can only read/write their own addresses.

---

# 7. Property Model

## 7.1 properties

**Purpose:** first-class representation of a maintained property.

The blueprint identifies the property dashboard and long-term property service history as a key product differentiator.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| owner_customer_id | uuid | Customer owner |
| name | text | User-defined label |
| property_type | enum/text | house, apartment, office, shop, rental, other |
| address_id | uuid | FK to addresses |
| notes | text | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

### Important rule

Do not assume one customer owns only one property.

One customer may eventually manage multiple properties.

---

# 8. Property Assets

## 8.1 property_assets

**Purpose:** optional record of significant equipment/assets associated with a property.

This supports the future property-management direction.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| property_id | uuid | FK |
| category | text | e.g. AC, appliance, electrical |
| name | text | Asset name |
| brand | text | Optional |
| model | text | Optional |
| serial_number | text | Optional; access-controlled |
| installed_at | date | Optional |
| warranty_expires_at | date | Optional |
| notes | text | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

This is an implementation baseline and may be reduced for the initial MVP.

---

# 9. Service Catalogue

## 9.1 service_categories

**Purpose:** top-level service grouping.

Examples supported by the brief include:

- Electrical
- Plumbing
- Carpentry
- Interior work

The expanded Fixify concept additionally includes:

- AC & Cooling
- Appliances
- Painting
- Cleaning
- Renovation

The exact launch categories remain a product decision.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Display name |
| slug | text | Stable URL/code identifier |
| description | text | Customer-facing description |
| icon_key | text | UI reference |
| is_active | boolean | Catalogue availability |
| sort_order | integer | Display order |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

## 9.2 services

**Purpose:** individual bookable services within a category.

Example:

```text
AC & Cooling
    └── AC General Service
```

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| category_id | uuid | FK |
| name | text | Service name |
| slug | text | Stable identifier |
| description | text | Customer-facing explanation |
| pricing_model | enum | fixed / inspection / quote_after_inspection |
| base_price | numeric | Nullable for variable-price services |
| inspection_fee | numeric | Nullable |
| estimated_duration_minutes | integer | Estimate |
| requires_inspection | boolean | Operational flag |
| is_active | boolean | Availability |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

### Important rule

The client may display pricing, but the authoritative amount is server/database calculated.

---

## 9.3 service_options

**Purpose:** optional configurable choices for a service.

Examples:

```text
AC type
Room size
Material grade
Service level
```

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| service_id | uuid | FK |
| name | text | Option name |
| option_type | text | Choice/type |
| is_required | boolean | Whether selection is mandatory |
| sort_order | integer | Display order |
| created_at | timestamptz | System generated |

---

## 9.4 service_option_values

**Purpose:** values belonging to a service option.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| service_option_id | uuid | FK |
| label | text | Customer-facing label |
| value | text | Stable value |
| price_modifier | numeric | Optional |
| is_active | boolean | Availability |
| sort_order | integer | Display order |

---

# 10. Materials and Brands

## 10.1 brands

**Purpose:** manufacturer/brand catalogue.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Brand |
| is_active | boolean | Catalogue status |
| created_at | timestamptz | System generated |

---

## 10.2 materials

**Purpose:** materials/parts that may be used for supported services.

The original brief explicitly states that customers may select required materials such as wires, fittings, wood types or fabrics and may select branded/preferred materials.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Material name |
| brand_id | uuid | Optional FK |
| specification | text | Size/grade/model |
| unit | text | piece, meter, kg, etc. |
| is_active | boolean | Catalogue status |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

## 10.3 service_materials

**Purpose:** defines which materials are valid/supported for a service.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| service_id | uuid | FK |
| material_id | uuid | FK |
| is_customer_selectable | boolean | Whether customer can select it |
| is_professional_selectable | boolean | Whether professional can recommend/use it |
| created_at | timestamptz | System generated |

Primary key:

```text
(service_id, material_id)
```

---

# 11. Professional Domain

## 11.1 professional_profiles

**Purpose:** professional-specific account and operational identity.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | PK/FK |
| display_name | text | Customer-visible name |
| bio | text | Optional |
| years_experience | integer | Optional |
| rating_average | numeric | Derived/aggregated |
| completed_jobs_count | integer | Derived/aggregated |
| verification_status | enum | Current verification state |
| is_available | boolean | Current online/accepting flag |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

Do not allow the frontend to directly mutate calculated performance metrics.

---

# 12. Professional Skills

## 12.1 professional_skills

**Purpose:** determines which service categories/services the professional is qualified for.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| professional_id | uuid | FK |
| service_category_id | uuid | FK |
| service_id | uuid | Optional FK for specific service qualification |
| skill_level | text | Optional |
| verified | boolean | Skill verification result |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

# 13. Professional Verification

## 13.1 professional_verifications

**Purpose:** records verification workflow.

The brief explicitly states that professionals should be background-checked and skill-verified.

### Verification status

```text
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| professional_id | uuid | FK |
| status | enum | Verification state |
| submitted_at | timestamptz | Optional |
| reviewed_at | timestamptz | Optional |
| reviewed_by | uuid | Admin/support user |
| rejection_reason | text | Optional |
| notes | text | Internal |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

## 13.2 professional_verification_documents

**Purpose:** private verification evidence.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| verification_id | uuid | FK |
| document_type | text | Configurable |
| storage_path | text | Supabase Storage object |
| status | text | pending / accepted / rejected |
| uploaded_at | timestamptz | System generated |
| reviewed_at | timestamptz | Optional |
| reviewer_id | uuid | Optional |

These files must not be public.

---

# 14. Professional Availability

## 14.1 professional_availability

**Purpose:** determines when a professional may receive/accept work.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| professional_id | uuid | FK |
| day_of_week | smallint | 0–6 or agreed convention |
| start_time | time | Availability start |
| end_time | time | Availability end |
| is_active | boolean | Rule active |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

Future exceptions may be modeled separately.

---

# 15. Professional Service Areas

## 15.1 professional_service_areas

**Purpose:** establishes where a professional can operate.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| professional_id | uuid | FK |
| city | text | Service city |
| area | text | Optional |
| radius_km | numeric | Optional |
| is_active | boolean | Area active |
| created_at | timestamptz | System generated |

The exact geographic matching strategy is an implementation decision.

---

# 16. Service Requests

## 16.1 service_requests

**Purpose:** represents the customer's problem before it becomes a confirmed booking.

This separation is important because:

```text
problem description
≠
booking
≠
job
```

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| customer_id | uuid | FK |
| property_id | uuid | FK |
| input_text | text | Original customer description |
| normalized_summary | text | Structured summary |
| suggested_category_id | uuid | Optional |
| suggested_service_id | uuid | Optional |
| classification_confidence | text | low / moderate / high |
| intake_source | enum | manual / ai / voice / media |
| status | text | draft / ready / converted / cancelled |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

The exact status set is an implementation baseline and should be finalized before schema freeze.

---

# 17. AI Conversations

## 17.1 ai_conversations

**Purpose:** persistent conversation context for the AI intake experience.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| customer_id | uuid | FK |
| service_request_id | uuid | Optional FK |
| status | text | active / completed / escalated |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

## 17.2 ai_messages

**Purpose:** messages inside an AI conversation.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| conversation_id | uuid | FK |
| sender_type | enum | customer / assistant / system |
| content | text | Message |
| created_at | timestamptz | System generated |

---

## 17.3 ai_assessments

**Purpose:** structured AI result separate from conversational messages.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| conversation_id | uuid | FK |
| service_request_id | uuid | FK |
| likely_category_id | uuid | Optional |
| likely_service_id | uuid | Optional |
| confidence | enum | low / moderate / high |
| problem_summary | text | Structured summary |
| recommended_next_step | text | Recommendation |
| needs_human_review | boolean | Escalation flag |
| created_at | timestamptz | System generated |

AI assessment is not a technical diagnosis.

---

# 18. Media

## 18.1 media

**Purpose:** metadata for customer/professional uploads.

Supported conceptually:
- photo
- video
- voice/audio
- documents

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| owner_user_id | uuid | Uploader |
| service_request_id | uuid | Optional |
| job_id | uuid | Optional |
| property_id | uuid | Optional |
| media_type | enum | image / video / audio / document |
| mime_type | text | File MIME type |
| storage_path | text | Private storage location |
| size_bytes | bigint | Optional |
| duration_seconds | integer | Optional |
| created_at | timestamptz | System generated |

Authorization must determine who may access each media object.

---

# 19. Booking

## 19.1 bookings

**Purpose:** represents the customer's confirmed service reservation/request.

A booking should reference the service request where one exists.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| booking_reference | text | Human-readable unique identifier |
| customer_id | uuid | FK |
| property_id | uuid | FK |
| service_request_id | uuid | Optional FK |
| service_id | uuid | FK |
| professional_id | uuid | Nullable until assigned |
| scheduled_start | timestamptz | Requested/confirmed start |
| scheduled_end | timestamptz | Optional |
| pricing_model | enum | fixed / inspection / quote_after_inspection |
| quoted_or_base_amount | numeric | Server-derived |
| booking_status | text | Operational booking status |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

Do not allow client-submitted totals to become authoritative.

---

# 20. Job

## 20.1 jobs

**Purpose:** operational execution record for a booking.

Recommended one-to-one relationship:

```text
booking
   ↓
job
```

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| booking_id | uuid | Unique FK |
| customer_id | uuid | FK |
| property_id | uuid | FK |
| professional_id | uuid | FK |
| current_state | enum | Controlled job state |
| started_at | timestamptz | Optional |
| arrived_at | timestamptz | Optional |
| completed_at | timestamptz | Optional |
| closed_at | timestamptz | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

### Critical rule

Application code must not freely update `current_state`.

State transitions must go through the approved transition mechanism.

See:

```text
docs/STATE_MACHINE.md
```

---

# 21. Job Events

## 21.1 job_events

**Purpose:** immutable operational timeline.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | FK |
| from_state | text | Previous state |
| to_state | text | New state |
| actor_user_id | uuid | Actor |
| event_type | text | Event classification |
| metadata | jsonb | Additional safe context |
| created_at | timestamptz | System generated |

Every successful job-state transition should create a job event.

---

# 22. Inspection

## 22.1 inspections

**Purpose:** professional's technical inspection/findings.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | FK |
| professional_id | uuid | FK |
| findings | text | Observed issue |
| recommendation | text | Recommended action |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | Optional |

Additional evidence may link through `media`.

---

# 23. Quotes

## 23.1 quotes

**Purpose:** proposed additional work or variable repair cost.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | FK |
| professional_id | uuid | Creator |
| subtotal | numeric | Server-calculated |
| taxes_or_fees | numeric | Server-calculated/configured |
| discount | numeric | Optional |
| total | numeric | Server-calculated |
| reason | text | Why additional work is needed |
| status | enum | draft / pending_customer / approved / declined / expired / cancelled |
| expires_at | timestamptz | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

## 23.2 quote_items

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| quote_id | uuid | FK |
| item_type | enum | labour / material / service / fee |
| description | text | Line item |
| quantity | numeric | Quantity |
| unit_price | numeric | Server-authoritative |
| line_total | numeric | Server-calculated |
| material_id | uuid | Optional |
| created_at | timestamptz | System generated |

---

# 24. Quote Approval

Approval is a business operation, not a simple field edit.

The application should expose a controlled function conceptually equivalent to:

```text
approve_quote(quote_id, actor)
```

Rules:

```text
quote belongs to actor's job
quote is pending customer approval
quote is not expired
quote has not been declined/cancelled
totals are recalculated server-side
approval is transactional
audit event is created
```

Do not permit:

```text
client → quotes.status = 'approved'
```

as a normal direct update.

---

# 25. Payments

## 25.1 payments

**Purpose:** financial record associated with a booking/job/quote.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| customer_id | uuid | FK |
| booking_id | uuid | Optional |
| job_id | uuid | Optional |
| quote_id | uuid | Optional |
| payment_type | enum | inspection / service / material / additional_work / subscription |
| amount | numeric | Server-authoritative |
| currency | text | Configured market currency |
| provider | text | Payment provider |
| provider_reference | text | External ID |
| status | enum | pending / processing / paid / failed / refunded / partially_refunded |
| paid_at | timestamptz | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | System generated |

---

# 26. Payment Rules

1. Client cannot mark a payment as paid.
2. Backend/provider confirmation is authoritative.
3. Webhook processing must be idempotent.
4. Payment amounts must be derived from authoritative server/database values.
5. A duplicate webhook must not create duplicate payment records.
6. Refunds must create a traceable financial event.

---

# 27. Invoices

## 27.1 invoices

**Purpose:** final customer-facing financial document.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| invoice_number | text | Unique |
| customer_id | uuid | FK |
| property_id | uuid | FK |
| job_id | uuid | FK |
| payment_id | uuid | Optional/depending on payment flow |
| subtotal | numeric | Server-calculated |
| taxes_or_fees | numeric | Server-calculated |
| discounts | numeric | Server-calculated |
| total | numeric | Server-calculated |
| currency | text | Configured |
| status | text | draft / issued / paid / void |
| issued_at | timestamptz | Optional |
| created_at | timestamptz | System generated |

Do not generate authoritative invoice totals from client state.

---

# 28. Reviews

## 28.1 reviews

**Purpose:** customer feedback on completed service.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | Unique review target |
| customer_id | uuid | Reviewer |
| professional_id | uuid | Reviewed professional |
| rating | smallint | Defined rating scale |
| comment | text | Optional |
| created_at | timestamptz | System generated |
| updated_at | timestamptz | Optional |

A review should be tied to a real eligible completed job.

---

# 29. Complaints

## 29.1 complaints

**Purpose:** post-service issue/dispute record.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| job_id | uuid | FK |
| customer_id | uuid | FK |
| professional_id | uuid | FK |
| reason | text | Complaint category |
| description | text | Customer description |
| status | enum | open / under_review / waiting_customer / waiting_professional / resolved / escalated |
| assigned_to | uuid | Support/admin |
| resolution | text | Optional |
| created_at | timestamptz | System generated |
| resolved_at | timestamptz | Optional |
| updated_at | timestamptz | System generated |

Evidence should link through `media`.

---

# 30. Property Service History

## 30.1 property_service_history

**Purpose:** persistent maintenance record associated with a property.

This is a major Fixify differentiator.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| property_id | uuid | FK |
| job_id | uuid | FK |
| service_id | uuid | FK |
| professional_id | uuid | FK |
| service_date | timestamptz | Service completion date |
| problem_summary | text | Original/relevant problem |
| work_performed | text | Completed work |
| materials_summary | jsonb | Used materials |
| final_cost | numeric | Authoritative final cost |
| invoice_id | uuid | Optional |
| warranty_expires_at | timestamptz | Optional |
| created_at | timestamptz | System generated |

The history record should generally reference the completed job rather than duplicating all operational data.

---

# 31. Notifications

## 31.1 notifications

**Purpose:** in-app notification record.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| recipient_user_id | uuid | Recipient |
| type | text | Notification type |
| title | text | Display title |
| body | text | Display content |
| related_entity_type | text | Optional |
| related_entity_id | uuid | Optional |
| read_at | timestamptz | Nullable |
| created_at | timestamptz | System generated |

Potential events include:

```text
booking_created
professional_assigned
professional_accepted
professional_on_the_way
professional_arrived
quote_created
quote_approved
quote_declined
job_completed
payment_success
invoice_issued
review_reminder
complaint_update
```

---

# 32. Audit Log

## 32.1 audit_logs

**Purpose:** immutable record of financially or operationally significant actions.

### Baseline fields

| Field | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| actor_user_id | uuid | Actor |
| actor_role | text | Actor role |
| action | text | Action name |
| entity_type | text | Entity affected |
| entity_id | uuid | Entity affected |
| old_value | jsonb | Optional |
| new_value | jsonb | Optional |
| metadata | jsonb | Safe additional context |
| created_at | timestamptz | System generated |

Important actions include:

```text
professional_verified
professional_suspended
booking_created
job_assigned
job_state_changed
quote_created
quote_approved
quote_declined
payment_received
refund_created
complaint_resolved
```

---

# 33. Optional/Future Subscription Domain

## 33.1 subscriptions

This belongs to a later phase unless business validation requires it earlier.

Possible fields:

```text
id
customer_id
plan_id
status
provider
provider_subscription_reference
started_at
renewal_at
cancelled_at
created_at
updated_at
```

The exact Premium offering remains an OPEN business decision.

---

# 34. Relationships — Canonical View

```text
auth.users
    │
    └── profiles
          │
          ├── customer_profiles
          │       │
          │       ├── addresses
          │       │      └── properties
          │       │             ├── property_assets
          │       │             ├── bookings
          │       │             ├── jobs
          │       │             └── property_service_history
          │       │
          │       ├── service_requests
          │       │       ├── ai_conversations
          │       │       │      └── ai_messages
          │       │       └── ai_assessments
          │       │
          │       ├── bookings
          │       │      └── jobs
          │       │
          │       ├── payments
          │       ├── reviews
          │       └── complaints
          │
          └── professional_profiles
                  ├── professional_skills
                  ├── professional_verifications
                  │      └── verification_documents
                  ├── professional_availability
                  ├── professional_service_areas
                  └── jobs
```

Service catalogue:

```text
service_categories
       │
       └── services
            ├── service_options
            │      └── service_option_values
            │
            └── service_materials
                    └── materials
                           └── brands
```

Operational chain:

```text
service_request
      ↓
booking
      ↓
job
 ├── job_events
 ├── inspections
 ├── quotes
 │    └── quote_items
 ├── payments
 ├── invoices
 ├── reviews
 └── complaints
```

---

# 35. Ownership Rules

## Customer-owned

A customer may access only:

```text
their profile
their addresses
their properties
their service requests
their bookings
their jobs
their payments
their invoices
their reviews
their complaints
their property history
their allowed media
```

## Professional-owned

A professional may access:

```text
their profile
their verification information
their skills
their availability
their service areas
jobs assigned/authorized to them
relevant customer/property/job information
their quotes
their earnings-related records
their support records
```

## Admin/support

Access is permission-controlled.

Do not equate:

```text
admin UI visibility
```

with unrestricted database access.

---

# 36. RLS Expectations

RLS must be applied to protected tables.

At minimum, test:

```text
Customer A cannot read Customer B's property.

Customer A cannot read Customer B's booking.

Customer A cannot read Customer B's invoice.

Professional A cannot read Professional B's private information.

Professional A cannot modify Customer-owned property.

Customer cannot modify Professional verification.

Customer cannot approve another customer's quote.
```

Service catalogue read access may be broader than customer-owned tables.

Admin access must use explicit privileged policy/role design.

---

# 37. Critical Constraints

The database should enforce as much integrity as practical.

Examples:

### User ownership

```text
property.owner_customer_id
→ valid customer profile
```

### Booking

```text
booking.customer_id
→ customer owner
```

### Job

```text
job.booking_id
→ one operational job per booking where applicable
```

### Quote

```text
quote.job_id
→ valid active job
```

### Review

```text
review.job_id
→ eligible completed job
```

### Property history

```text
property_service_history.job_id
→ completed/closed job associated with same property
```

---

# 38. Derived Data

Some values should not be treated as independently authoritative.

Examples:

```text
professional rating average
professional completed job count
booking final amount
quote total
invoice total
customer total spend
property maintenance summary
```

Where appropriate:

```text
source records
    ↓
query / view / controlled calculation
    ↓
derived value
```

Do not allow ordinary customer UI to directly edit these fields.

---

# 39. Money Representation

Use an agreed monetary representation consistently.

Preferred implementation baseline:

```text
numeric/decimal
```

rather than binary floating-point values for stored financial amounts.

Every financial record should have:

```text
amount
currency
status
created_at
```

The exact currency is a product decision and is stored/configured rather than assumed globally.

---

# 40. Time and Dates

Use timezone-aware timestamps:

```text
timestamptz
```

Store canonical timestamps in the database.

Display dates/times according to the customer's/professional's relevant locale/timezone.

Do not store local clock strings as the authoritative time for bookings.

---

# 41. Soft Deletion / Archival

Operational records should normally not be physically deleted.

Prefer:

```text
is_active
status
archived_at
deleted_at
```

where appropriate.

Especially preserve:

```text
jobs
payments
invoices
complaints
audit_logs
verification history
property service history
```

The exact retention/deletion policy remains an OPEN business decision.

---

# 42. Media Access Model

Media must be authorized based on its parent context.

Examples:

```text
customer problem photo
→ customer + authorized professional/admin

professional completion evidence
→ customer + professional + authorized admin

verification document
→ professional + authorized verification/admin users only
```

Do not make the storage bucket public merely to simplify image rendering.

---

# 43. Service Request vs Booking vs Job

These three objects must remain distinct.

## Service Request

What the customer says is wrong.

```text
"AC is running but not cooling."
```

## Booking

The scheduled commercial/service reservation.

```text
AC Repair
Tomorrow
10:30
Professional assigned
```

## Job

The actual operational execution.

```text
Arrived
Inspected
Quoted
Repaired
Completed
```

Do not collapse all three into one table.

---

# 44. Inspection vs Quote

These are also distinct.

## Inspection

What the professional observes.

```text
Capacitor appears faulty.
```

## Quote

What the customer is being asked to approve/pay.

```text
Capacitor: ₹850
Labour: ₹300
Total: ₹1,150
```

An inspection can exist without a quote.

A quote should reference the inspection/job context where applicable.

---

# 45. Quote Approval vs Payment

These are separate events.

```text
Customer approves quote
        ↓
Work is authorized
        ↓
Work completed
        ↓
Payment
```

Do not assume:

```text
approved = paid
```

and do not assume:

```text
paid = approved
```

---

# 46. Job Completion vs Payment

These are also separate states.

A completed job does not automatically mean payment has been successfully confirmed.

The payment workflow must be modeled independently.

---

# 47. Property History vs Job

The job is the operational source.

Property history is the long-term record.

Recommended:

```text
Job
  ↓
completed service data
  ↓
PropertyServiceHistory
```

Avoid copying every job field into history.

---

# 48. Suggested Database Enums

Where Postgres enums are appropriate, candidates include:

```text
user_role
professional_verification_status
pricing_model
job_state
quote_status
payment_status
payment_type
media_type
complaint_status
service_request_status
```

Exact enum names and allowed values must match:

```text
docs/STATE_MACHINE.md
docs/PRODUCT_DECISIONS.md
```

---

# 49. Indexing Baseline

Indexes should support actual access patterns.

Likely candidates:

```text
profiles(role)

properties(owner_customer_id)

service_requests(customer_id)
service_requests(status)

bookings(customer_id)
bookings(professional_id)
bookings(property_id)
bookings(scheduled_start)
bookings(status)

jobs(booking_id)
jobs(professional_id)
jobs(current_state)

job_events(job_id, created_at)

quotes(job_id)
quotes(status)

payments(customer_id)
payments(job_id)
payments(provider_reference)

reviews(professional_id)
complaints(job_id)

property_service_history(property_id, service_date)
notifications(recipient_user_id, read_at)
```

Do not add indexes blindly. Validate against real queries and workload.

---

# 50. Initial Schema Scope

The first production schema should prioritize:

```text
auth.users
profiles
customer_profiles
addresses
properties

service_categories
services
service_options
service_option_values
brands
materials
service_materials

professional_profiles
professional_skills
professional_verifications
professional_verification_documents
professional_availability
professional_service_areas

service_requests
media

bookings
jobs
job_events
inspections
quotes
quote_items

payments
invoices
reviews
complaints

property_service_history
notifications
audit_logs
```

AI-specific tables may be introduced when AI intake is implemented if they are not needed earlier.

---

# 51. Tables That Should Not Be Invented Prematurely

Do not create large speculative schemas for:

```text
IoT devices
predictive maintenance
complex subscription billing
supplier marketplace
full warehouse/inventory management
international tax systems
```

unless the relevant phase requires them.

Keep future expansion possible without polluting the MVP schema.

---

# 52. Open Data-Model Decisions

The following still depend on business decisions:

```text
1. Exact launch geography
2. Exact launch service categories
3. Exact pricing models by service
4. Currency
5. Tax representation
6. Commission representation
7. Cancellation/refund accounting
8. Warranty representation
9. Professional payout/settlement model
10. B2B account hierarchy
11. Subscription schema
12. Exact document-retention period
13. Exact verification document types
14. Emergency-service workflow
15. Exact location/matching strategy
```

Do not silently hard-code these.

Refer to:

```text
docs/PRODUCT_DECISIONS.md
```

---

# 53. Migration Rules

All schema changes must be represented in:

```text
supabase/migrations/
```

Rules:

- one migration per logical change
- never modify an already-applied migration
- use foreign keys deliberately
- add constraints deliberately
- test RLS after schema changes
- document important migration behavior

---

# 54. Next.js / Supabase Boundary

The frontend should primarily:

```text
read authorized data
submit validated requests
call controlled server functions
render state
```

The database/server should:

```text
validate
authorize
calculate
transition
record
```

The frontend must never become the authoritative source of:

```text
price
payment status
job state
professional verification
audit history
```

---

# 55. Example Golden Data Flow

```text
CUSTOMER
  ↓
service_request
  ↓
booking
  ↓
job
  ↓
job_events
  ↓
inspection
  ↓
quote
  ↓
quote_items
  ↓
customer approval
  ↓
job progresses
  ↓
payment
  ↓
invoice
  ↓
review
  ↓
property_service_history
```

This is the primary domain flow the schema must support.

---

# 56. Non-Negotiable Integrity Principles

1. Users own their own customer data.
2. Professionals cannot access unrelated jobs.
3. Unverified professionals cannot receive eligible live jobs.
4. Job state is server/database controlled.
5. Prices are server/database controlled.
6. Quote approval is transactional.
7. Payment status is provider/backend controlled.
8. Audit records capture critical actions.
9. Property history references completed service activity.
10. Operational records are retained according to policy.

---

# 57. Implementation Note

This document intentionally defines the shared vocabulary and a practical implementation baseline.

Before production migrations are frozen:

```text
PRODUCT_DECISIONS.md
        ↓
DATA_MODEL.md
        ↓
STATE_MACHINE.md
        ↓
RLS design
        ↓
SQL migrations
        ↓
tests
```

Do not reverse that sequence.

The coding agent must not invent a conflicting entity or field name when an existing Fixify concept already exists here.

# END OF DATA MODEL
