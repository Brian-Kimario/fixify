# FIXIFY

## Master Product, UX & Technical Blueprint

### Coding-Agent Source of Truth

**Product:** Fixify
**Product type:** Property-service marketplace + service operations platform + AI-assisted problem intake + property maintenance history
**Primary users:** Customers, Professionals, Fixify Admin/Operations
**Build philosophy:** Product-first, modular, trustworthy, mobile-first, scalable without premature complexity

---

# 1. SOURCE-OF-TRUTH RULE

Use the following priority whenever requirements conflict:

**Priority 1 — Current Fixify business definition**

Fixify helps customers turn an unclear property problem into a structured service request, identify the likely service category, connect with a verified professional, manage the job, handle payment and documentation, and maintain a persistent property service history.

**Priority 2 — Original Fixify project brief**

The brief establishes service selection, problem description, image/video upload, material/brand selection, verified professionals, flexible booking, rebooking, customer/professional/admin modules and future AI capabilities.

**Priority 3 — Supplied ABCD HTML**

Use only as inspiration for:

* visual quality
* typography
* transitions
* scroll reveals
* expandable cards/panels
* cinematic hero composition
* responsive behavior
* reduced-motion support

Do not copy its:

* construction-company information architecture
* projects portfolio
* fictional statistics
* Creacon/Artra ecosystem
* construction terminology
* “Start a project” workflow

The HTML's current navigation is centered on Work, Services, About, Ecosystem, Projects and Contact, which is unsuitable as Fixify's application architecture.

---

# 2. PRODUCT DEFINITION

## 2.1 One-sentence definition

Fixify is a digital property-maintenance platform that helps customers explain what is wrong, find the right service, connect with a verified professional, manage the repair transparently, and preserve the property's maintenance history.

## 2.2 Core promise

**Problem → Right service → Verified professional → Transparent job → Documented result**

## 2.3 What Fixify is NOT

Fixify is not merely:

* a directory of technicians
* a lead-generation website
* a generic booking form
* an AI diagnosis tool
* a construction portfolio
* a chat application

The product is a managed service workflow.

---

# 3. CORE PRODUCT LOOP

The entire product should revolve around this loop:

```text
Customer has a problem
        ↓
Customer explains problem
        ↓
Fixify gathers context
        ↓
AI / rules identify likely service category
        ↓
Customer provides address + preferred time
        ↓
Fixify determines pricing model
        ↓
Suitable verified professional is matched
        ↓
Professional accepts
        ↓
Professional travels to property
        ↓
Professional checks in
        ↓
Professional inspects
        ↓
Fixed service OR additional quote
        ↓
Customer approves additional work when required
        ↓
Professional completes work
        ↓
Completion documented
        ↓
Payment/invoice
        ↓
Review
        ↓
Property history updated
```

This is the primary business workflow.

Every major feature must support this loop.

---

# 4. PRODUCT SURFACES

Fixify consists of four closely related surfaces.

## 4.1 Public website

Purpose:

**Discovery + trust + conversion**

Primary actions:

* Describe a problem
* Browse services
* Become a professional
* Learn how Fixify works
* Contact/support

## 4.2 Customer application

Purpose:

**Request and manage property services**

Primary areas:

* Home
* AI Assistant
* Services
* New Request
* Bookings
* Active Job
* Payments
* Property
* Service History
* Reviews
* Support
* Profile

## 4.3 Professional application

Purpose:

**Receive, execute and manage jobs**

Primary areas:

* Dashboard
* Job Requests
* Active Jobs
* Availability
* Earnings
* Verification/Profile
* Support

## 4.4 Admin/Operations console

Purpose:

**Control marketplace quality and intervene when necessary**

Primary areas:

* Operations Dashboard
* Jobs
* Customers
* Professionals
* Verification
* Services
* Pricing
* Materials
* Payments
* Reviews
* Complaints
* Notifications
* Analytics
* Settings

---

# 5. USER ROLES

## Customer

Can:

* create account
* manage profile
* create/manage properties
* create service requests
* use AI assistant
* upload text/photo/video/voice input
* select services
* select materials where supported
* choose time slots
* view professional
* approve quotes
* pay
* track job
* receive invoice
* review
* raise complaint
* view service history
* rebook

## Professional

Can:

* register
* submit verification information
* select skills/categories
* configure service area
* configure availability
* receive job offers
* accept/reject
* view customer-provided job information
* navigate
* mark arrival
* inspect
* submit findings
* create additional-work quote
* record materials
* complete work
* upload completion evidence
* view earnings
* report incidents
* contact support

## Admin

Can:

* manage customers
* manage professionals
* verify/suspend professionals
* manage categories
* manage pricing
* manage service areas
* manage jobs
* manually intervene in matching
* manage payments
* manage complaints
* review activity
* configure content
* view analytics
* audit important actions

## Support/Operations

Can be introduced as a restricted admin role rather than a separate product initially.

---

# 6. CUSTOMER EXPERIENCE

# 6.1 Customer homepage

The customer homepage should answer:

**What do I do next?**

Recommended structure:

```text
Greeting

What needs fixing?

[ Describe a Problem ]

Quick Services
Electrical
Plumbing
AC & Cooling
Appliances
Carpentry
Painting
Cleaning
Renovation

Upcoming Booking

Active Service

Your Property

Recent Service History

Support
```

Do not overwhelm the user with analytics.

The primary CTA is always the problem-resolution action.

---

# 6.2 Problem-first entry

Primary component:

```text
WHAT NEEDS FIXING?

[ Type what's wrong... ]

🎤 Speak
📷 Photo
🎥 Video

[ Continue ]
```

Examples shown beneath input:

```text
“My AC is running but not cooling.”

“My kitchen tap is leaking.”

“My washing machine is making a loud noise.”

“There is a power issue in one room.”
```

This teaches the user how to use the system without requiring them to understand service categories.

---

# 6.3 Manual service entry

Some customers already know what they need.

Provide:

```text
Electrical
Plumbing
AC & Cooling
Appliances
Carpentry
Painting
Cleaning
Renovation
Other
```

Clicking a category opens service-specific options.

---

# 7. AI ASSISTANT

## 7.1 AI's role

The AI is a:

**problem-intake and service-classification assistant**

It is not the final technical authority.

## 7.2 AI workflow

Example:

Customer:

> My AC is not cooling.

AI:

> I can help narrow this down. When did the issue start?

Customer:

> Yesterday.

AI:

> Is the AC blowing air?

Customer:

> Yes.

AI:

> Is the air completely warm, or just not as cold as usual?

Customer:

> Mostly warm.

AI:

> A technician inspection would be appropriate. You can also upload a photo or short video of the indoor unit if useful.

The system then converts the conversation into structured information.

## 7.3 AI output schema

The AI should produce structured data similar to:

```json
{
  "likely_service_category": "ac_repair",
  "confidence": "moderate",
  "problem_summary": "AC is operating but not providing expected cooling",
  "customer_answers": {},
  "recommended_next_step": "technician_inspection",
  "required_information": [],
  "requested_media": [],
  "customer_visible_disclaimer": true
}
```

## 7.4 AI restrictions

The AI must not:

* claim certainty when uncertain
* present an assessment as a guaranteed diagnosis
* invent a repair price
* authorize work
* create unauthorized charges
* override technician findings
* approve additional work
* represent itself as a technician

The AI can:

* ask questions
* classify likely category
* summarize the problem
* request useful media
* prepare a service request
* recommend inspection
* route to human/professional assistance

## 7.5 Escalation

Escalate when:

* confidence is low
* symptoms are ambiguous
* dangerous conditions are suspected
* the customer asks for technical certainty
* the requested service is outside supported categories
* media is inconclusive

---

# 8. MEDIA INPUT

Supported:

* text
* voice
* photo
* short video

## Photo use

Useful for:

* visible damage
* leaking area
* appliance model label
* electrical component
* wall/ceiling damage
* damaged fittings

## Video use

Useful for:

* abnormal noise
* vibration
* water flow
* appliance behavior
* AC sound
* mechanical movement

## Important principle

Media is evidence/input.

It is not automatically a diagnosis.

## Media model

Every uploaded file should be associated with:

```text
media_id
user_id
job/request_id
type
storage_path
mime_type
size
duration if video/audio
created_at
visibility
```

Customer and professional access must be controlled by authorization.

---

# 9. BOOKING FLOW

The booking flow should be progressive.

## Step 1 — Problem

Customer explains issue or selects service.

## Step 2 — Service category

Show Fixify's likely interpretation:

```text
Likely service:
AC Repair

Why:
Your answers suggest an AC cooling issue.
```

Allow customer correction:

```text
[ Change service ]
```

## Step 3 — Property/address

Select existing address or create new one.

## Step 4 — Pricing model

Display clearly:

```text
Fixed service
OR
Inspection fee
OR
Quote after inspection
```

Never imply a final repair price when inspection is required.

## Step 5 — Time

```text
Today
Tomorrow
Choose date

Morning
Afternoon
Evening
```

Use actual professional availability.

## Step 6 — Professional

The customer can see:

```text
Name
Verification badge
Service categories
Rating
Completed jobs
Approximate arrival
```

Whether the customer chooses the professional or Fixify automatically assigns one should be configurable by business rules.

## Step 7 — Payment

Show:

* service/inspection fee
* applicable materials
* platform charges if any
* taxes/fees if applicable
* total or known payable amount
* conditions for variable pricing

## Step 8 — Confirmation

Generate booking ID.

---

# 10. PRICING MODEL

This is a critical product rule.

Fixify must support at least three pricing patterns.

## Fixed-price service

Example:

```text
AC General Service

Service: ₹799
Parts: Not included unless listed

Total: ₹799
```

## Inspection pricing

```text
AC Repair Inspection

Inspection: ₹299

Repair cost:
Determined after professional inspection.
```

## Inspection + additional quote

Example:

```text
Inspection complete

Recommended work:
Capacitor replacement

Part: ₹850
Labour: ₹300

Total additional work: ₹1,150

[ Approve Work ]
[ Decline ]
```

The exact currency and commercial policy must remain configurable.

---

# 11. ADDITIONAL WORK APPROVAL

This is server-controlled.

Never let the professional simply alter the booking amount.

Correct workflow:

```text
Existing booking
      ↓
Professional inspection
      ↓
Additional work required
      ↓
Professional creates quote
      ↓
Quote status = PENDING_CUSTOMER
      ↓
Customer receives notification
      ↓
Customer approves OR declines
      ↓
Approved → professional may proceed
Declined → professional cannot charge/work on that item
```

Quote must contain:

```text
quote_id
job_id
items[]
labour
materials
taxes/fees
total
reason
created_by
created_at
expires_at
status
```

Quote status:

```text
DRAFT
PENDING_CUSTOMER
APPROVED
DECLINED
EXPIRED
CANCELLED
```

---

# 12. JOB STATE MACHINE

Do not implement job lifecycle as independent booleans.

Use a controlled state machine.

## Primary states

```text
DRAFT
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

## Exception states

```text
CANCELLED
REJECTED
EXPIRED
RESCHEDULED
DISPUTED
SUSPENDED
```

## Example

```text
REQUESTED
→ MATCHING
→ ASSIGNED
→ ACCEPTED
→ ON_THE_WAY
→ ARRIVED
→ INSPECTION
→ IN_PROGRESS
→ COMPLETED
→ PAYMENT_PENDING
→ CLOSED
```

Certain transitions must be server-authorized.

---

# 13. JOB EVENT HISTORY

Every important transition must generate an event.

Example:

```text
09:10
Booking requested

09:12
Professional assigned

09:14
Professional accepted

10:03
Professional on the way

10:21
Professional arrived

10:30
Inspection started

10:52
Additional work quote submitted

11:02
Customer approved quote

12:05
Work completed

12:07
Invoice generated

12:10
Payment confirmed
```

This timeline becomes the customer's job history and an administrative audit trail.

---

# 14. PROFESSIONAL MATCHING

Initial matching should be deterministic.

Do not build a fake AI matching engine.

## Matching requirements

A professional must satisfy:

```text
Correct category/skill
+
Service area
+
Availability
+
Verification status
```

Then rank by configurable factors:

```text
distance
availability
current workload
rating
completion/reliability metrics
```

The system should support manual admin reassignment.

---

# 15. PROFESSIONAL ONBOARDING

Flow:

```text
Register
 ↓
Verify phone/email
 ↓
Personal information
 ↓
Service categories
 ↓
Skills/experience
 ↓
Service area
 ↓
Availability
 ↓
Documents
 ↓
Verification review
 ↓
Approved / Rejected / More information
```

Verification state:

```text
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

The UI must never imply a professional is verified merely because an account exists.

---

# 16. PROFESSIONAL DASHBOARD

Primary view:

```text
GOOD MORNING

Status:
[ ONLINE / OFFLINE ]

Today's jobs

Upcoming
Active
Earnings

Availability
```

Job card:

```text
AC Repair
10:30 AM
2.4 km

Customer issue:
AC running but not cooling

[ View Job ]
```

---

# 17. PROFESSIONAL JOB EXECUTION

Job detail:

```text
Customer
Property
Problem summary
Photos/video
AI assessment
Customer notes
Booking details
```

Actions:

```text
Accept
Reject

Start Navigation
Arrived

Start Inspection

Submit Findings
Create Quote

Start Work
Complete Work
```

---

# 18. INSPECTION

Professional submits:

```text
Observed issue
Findings
Recommended work
Parts/materials
Labour
Additional notes
Evidence photos
```

Do not allow an additional quote to silently modify the original price.

---

# 19. MATERIAL SYSTEM

The original Fixify proposal explicitly includes customer preference for materials and brands.

Support:

```text
Material
Brand
Variant/specification
Unit
Price
Availability
Source
```

Customer preference:

```text
Preferred brand
Standard Fixify option
No preference
```

Professional recommendation:

```text
Recommended material
Reason
Price
Quantity
```

Customer approval should be captured when material choice changes price or scope.

---

# 20. PROPERTY SYSTEM

Property is a first-class domain entity.

A customer can own/manage multiple properties.

Example:

```text
Customer
 ├── Home
 ├── Office
 └── Rental Property
```

Property fields:

```text
property_id
owner/customer_id
name
type
address
city
postal_code
latitude
longitude
access_notes
created_at
```

Types:

```text
HOUSE
APARTMENT
OFFICE
SHOP
RENTAL
OTHER
```

---

# 21. PROPERTY DASHBOARD

Example:

```text
MY HOME

2 Bedroom Apartment

Recent service
AC service
12 Aug 2026
₹799

Maintenance history

Electrical
4 records

Plumbing
3 records

AC
5 records

Appliances
2 records
```

Later:

```text
Maintenance reminders
Equipment/assets
Warranty information
Documents
Preventive recommendations
```

---

# 22. SERVICE HISTORY

Every completed job should be capable of producing a property record.

Store:

```text
property
service category
service
date
professional
problem
work performed
parts/materials
cost
invoice
photos
documents
warranty information if configured
```

This is the long-term retention layer of the product.

---

# 23. PAYMENTS

The payment architecture must be provider-agnostic.

Create a payment adapter rather than hard-coding payment logic throughout the application.

Payment states:

```text
PENDING
PROCESSING
PAID
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Payment types:

```text
INSPECTION
SERVICE
MATERIAL
ADDITIONAL_WORK
SUBSCRIPTION
```

Never trust a frontend amount.

The backend calculates the authoritative amount.

---

# 24. INVOICE

Invoice should contain:

```text
Fixify
Invoice number
Job ID
Customer
Property
Professional

Service
Labour
Materials
Additional work
Discounts
Taxes/fees

Total

Payment status
Date
```

Invoice should be generated server-side.

---

# 25. REVIEWS

After a completed job:

```text
Rate service
★★★★★

Was the professional on time?

Was the work explained clearly?

Was pricing transparent?

Optional comment
```

Review should reference a completed job.

Prevent arbitrary users from reviewing jobs they did not participate in.

---

# 26. COMPLAINTS / DISPUTES

A complaint belongs to a job.

Fields:

```text
complaint_id
job_id
customer_id
professional_id
reason
description
evidence
status
assigned_support_user
resolution
created_at
resolved_at
```

Status:

```text
OPEN
UNDER_REVIEW
WAITING_CUSTOMER
WAITING_PROFESSIONAL
RESOLVED
ESCALATED
```

Admin/support must be able to inspect the complete audit trail before deciding an outcome.

---

# 27. NOTIFICATIONS

Important events:

```text
Booking requested
Professional assigned
Professional accepted
Professional on the way
Professional arrived
Quote created
Quote approved
Quote declined
Job completed
Payment successful
Invoice generated
Review reminder
Complaint update
Booking cancelled
Booking rescheduled
```

Start with:

* in-app
* email/push where available

Keep SMS/WhatsApp behind adapters.

---

# 28. LOCATION & TRACKING

Location is required for:

* service areas
* address selection
* matching
* arrival estimates
* navigation
* optional live tracking

Do not continuously track professionals.

Suggested model:

```text
Accepted
   ↓
On the way
   ↓
Location sharing active
   ↓
Arrived
   ↓
Tracking stops
```

Live GPS should be configurable by policy and platform capability.

---

# 29. CANCELLATION / RESCHEDULING

These policies are not fully specified in the supplied business documents, so implement them as configurable rules rather than hard-coded assumptions.

Recommended architecture:

```text
CancellationPolicy
ReschedulePolicy
RefundPolicy
```

Policies can vary according to:

```text
before assignment
after assignment
after acceptance
after arrival
after work starts
```

Do not bake commercial penalties directly into UI components.

---

# 30. WARRANTY / REWORK

A warranty mechanism is not explicitly defined in the provided brief; it is a recommended gap closure because repeat failures are directly relevant to a trust-oriented maintenance platform.

Potential model:

```text
Job
 ↓
Warranty active
 ↓
Customer reports recurrence
 ↓
Warranty claim
 ↓
Review
 ↓
Resolution
```

Keep warranty duration configurable by service/category.

---

# 31. REBOOKING

The original brief explicitly supports rebooking preferred professionals.

Customer can select:

```text
Book again

Same professional
Same service
Same property
New date/time
```

The system should still verify:

* professional availability
* service eligibility
* current verification status
* service-area coverage

Do not guarantee the same professional if they are unavailable.

---

# 32. ADMIN CONSOLE

## Dashboard

Display:

```text
Jobs today
Active jobs
Unassigned jobs
Pending verification
Completed jobs
Revenue
Open complaints
Average rating
Cancellations
```

## Jobs

Capabilities:

```text
Search
Filter
View job
View timeline
Reassign professional
Cancel
View quotes
View payment
View complaint
```

## Professionals

Capabilities:

```text
Search
Filter
Verification
Skills
Service area
Availability
Performance
Jobs
Earnings
Suspend
Reactivate
```

## Customers

Capabilities:

```text
Profile
Properties
Bookings
Payments
Reviews
Complaints
Account status
```

## Services

CRUD:

```text
Category
Service
Pricing model
Base price
Inspection fee
Duration estimate
Supported materials
Service area
Availability rules
```

---

# 33. SERVICE CATALOGUE MODEL

Do not hard-code services directly into frontend components.

Use database/configuration.

Example:

```text
Category:
AC & Cooling

Service:
AC General Service

Pricing:
FIXED

Base price:
configured

Duration:
configured

Materials:
optional

Requires inspection:
false
```

Another:

```text
Category:
Plumbing

Service:
Leak Investigation

Pricing:
INSPECTION

Inspection fee:
configured

Repair quote:
AFTER_INSPECTION
```

---

# 34. DATA MODEL

Core entities:

```text
User
CustomerProfile
ProfessionalProfile

Property
Address

ServiceCategory
Service
ServiceOption
Material
Brand

ServiceRequest
AIConversation
AIMessage
AIAssessment

Booking
Job
JobEvent

ProfessionalAvailability
ProfessionalVerification

Inspection
Quote
QuoteItem

Payment
Invoice

Review
Complaint

Media
Notification

PropertyAsset
PropertyServiceHistory

AuditLog
```

---

# 35. KEY RELATIONSHIPS

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
 ├── Bookings
 ├── Jobs
 ├── ServiceHistory
 └── Assets

ServiceRequest
 └── Booking

Booking
 └── Job

Job
 ├── Events
 ├── Inspection
 ├── Quotes
 ├── Payment
 ├── Invoice
 ├── Review
 └── Complaint

Professional
 ├── Verification
 ├── Availability
 ├── Skills
 └── Jobs
```

---

# 36. AUTHENTICATION & AUTHORIZATION

Implement role-based access control.

Roles:

```text
CUSTOMER
PROFESSIONAL
ADMIN
SUPPORT
```

Rules:

A customer can only access:

* their profile
* their properties
* their requests
* their jobs
* their payments
* their service history

A professional can only access:

* their profile
* assigned/eligible jobs
* their earnings
* their availability
* appropriate customer/job information

Admin/support access must be explicitly permissioned.

Never rely exclusively on frontend route protection.

Every server-side operation must enforce authorization.

---

# 37. SECURITY NON-NEGOTIABLES

The coding agent must follow these rules:

1. Never expose database credentials to the client.
2. Never trust client-submitted prices.
3. Never trust client-submitted role values.
4. Never allow direct database access from the browser.
5. Validate all request bodies server-side.
6. Authorize every protected resource.
7. Use signed/private media URLs where appropriate.
8. Log financially or operationally important changes.
9. Make payment webhooks idempotent.
10. Make job-state transitions server-controlled.
11. Avoid storing sensitive verification documents publicly.
12. Rate-limit authentication, AI and upload endpoints.

---

# 38. AUDIT LOG

Important actions should produce an immutable audit entry.

Example:

```text
actor
role
action
entity_type
entity_id
old_value
new_value
timestamp
ip/device metadata where appropriate
```

Important audit events:

```text
Professional verified
Professional suspended
Booking assigned
Booking cancelled
Quote created
Quote approved
Price changed
Payment status changed
Refund issued
Complaint resolved
```

---

# 39. FRONTEND ARCHITECTURE

Use a modular architecture rather than a giant component tree.

Suggested structure:

```text
app/
  (marketing)/
  (auth)/
  customer/
  professional/
  admin/

components/
  ui/
  marketing/
  customer/
  professional/
  admin/
  booking/
  jobs/
  ai/
  property/

lib/
  auth/
  db/
  payments/
  storage/
  notifications/
  matching/
  ai/

server/
  services/
  repositories/
  validators/
  state-machine/

types/
```

Organize code by business domain.

---

# 40. BACKEND ARCHITECTURE

Prefer a modular monolith for the MVP.

Do not begin with microservices.

Recommended conceptual modules:

```text
Auth
Users
Customers
Professionals
Properties
Services
Requests
Bookings
Jobs
Matching
Quotes
Payments
Invoices
Reviews
Complaints
Notifications
AI
Media
Admin
Audit
```

Modules communicate through clear service interfaces.

---

# 41. API DESIGN

Use clear resource-oriented endpoints.

Examples:

```text
POST   /api/auth/register
POST   /api/auth/login

GET    /api/services
GET    /api/services/:id

POST   /api/requests
GET    /api/requests/:id

POST   /api/bookings
GET    /api/bookings
GET    /api/bookings/:id

POST   /api/bookings/:id/cancel
POST   /api/bookings/:id/reschedule

GET    /api/jobs/:id
POST   /api/jobs/:id/accept
POST   /api/jobs/:id/arrive
POST   /api/jobs/:id/start
POST   /api/jobs/:id/complete

POST   /api/jobs/:id/inspection
POST   /api/jobs/:id/quotes

POST   /api/quotes/:id/approve
POST   /api/quotes/:id/decline

POST   /api/payments
GET    /api/invoices/:id

POST   /api/reviews
POST   /api/complaints

GET    /api/professionals
POST   /api/professionals/availability

POST   /api/ai/conversations
POST   /api/ai/messages
```

Exact framework syntax can differ.

The business boundaries must not.

---

# 42. VALIDATION

Use shared schemas for request validation.

Examples:

```text
CreateServiceRequestSchema
CreateBookingSchema
CreateQuoteSchema
ApproveQuoteSchema
CreateReviewSchema
CreateComplaintSchema
ProfessionalVerificationSchema
```

Validation must happen server-side.

---

# 43. STATE MANAGEMENT

Separate:

### Server state

Examples:

* bookings
* jobs
* professionals
* services
* property history

### UI state

Examples:

* modal open
* selected card
* animation state
* mobile menu

Do not put the entire backend database into global frontend state.

---

# 44. UI DESIGN SYSTEM

Fixify should inherit the visual sophistication of the supplied HTML, but its personality should change.

## Desired character

```text
Premium
Modern
Trustworthy
Technical
Human
Calm
Fast
Reliable
```

Avoid:

```text
Generic SaaS blue
Cheap marketplace appearance
Overly playful animations
Construction-company luxury aesthetic
```

## Suggested visual direction

Base:

```text
Graphite / near-black
Warm off-white
Electric blue
Small amounts of amber
```

Use color primarily to communicate:

* status
* trust
* actions
* alerts

Do not turn every component into a gradient.

---

# 45. TYPOGRAPHY

Use:

* one highly readable UI sans-serif
* optional refined display face for marketing headlines

The ABCD HTML uses a sans + serif pairing and highly spaced uppercase typography.

For Fixify:

Marketing:

```text
large expressive headline
short supporting copy
strong CTA
```

Application UI:

```text
high readability
normal capitalization
clear labels
strong information hierarchy
```

Do not use giant uppercase typography throughout the customer dashboard.

---

# 46. MOTION DESIGN

The supplied HTML contains:

* scroll-triggered text reveals
* expanding panels
* image/canvas transitions
* animated counters
* responsive menu animation
* reduced-motion handling.

Use the same principle, but make animation functional.

## Marketing motion

Use:

* hero ambient animation
* section reveals
* service-card hover
* smooth transitions
* subtle parallax
* animated progress lines

## Application motion

Use:

* booking progress
* AI message transitions
* professional matching
* status changes
* quote approval
* property timeline
* success confirmation

Avoid excessive page-transition animation in operational screens.

## Accessibility

Respect:

```text
prefers-reduced-motion
```

The supplied reference already demonstrates this requirement.

---

# 47. HOMEPAGE INFORMATION ARCHITECTURE

Recommended:

```text
NAVIGATION

Logo
Services
How It Works
For Professionals
Why Fixify
Help

[Describe a Problem]
[Login]
```

## Hero

Headline:

**Your problem. Fixed properly.**

Supporting text:

**Tell Fixify what's wrong. We help identify the right service, connect you with a verified professional, and keep the job transparent from request to completion.**

CTA:

**Describe a Problem**

Secondary:

**Browse Services**

---

# 48. HOMEPAGE SECTION: PROBLEM-FIRST

Show:

```text
What needs fixing?

“My AC isn't cooling.”

[ 🎤 ]
[ 📷 ]
[ ✍ ]

[ Continue ]
```

This should be an actual interactive prototype, not just decoration.

---

# 49. HOMEPAGE SECTION: SERVICES

Use visually rich cards.

```text
Electrical
Plumbing
AC & Cooling
Appliances
Carpentry
Painting
Cleaning
Renovation
```

Card interaction:

```text
hover → subtle movement
click → service details
CTA → book/request
```

The original brief explicitly supports electrical, plumbing, carpentry, interior work and expansion into further categories.

---

# 50. HOMEPAGE SECTION: HOW IT WORKS

```text
01
Tell us the problem

02
Fixify understands it

03
Choose / receive a professional

04
Track the service

05
Approve additional work

06
Pay and keep the record
```

This is more useful than a generic “About us” section.

---

# 51. HOMEPAGE SECTION: TRUST

Show actual operational promises:

```text
Verified professionals
Transparent pricing
Customer approval for additional work
Digital invoices
Service history
Support and complaint handling
```

These directly correspond to the problems and objectives identified in the original brief.

---

# 52. HOMEPAGE SECTION: PROPERTY RECORD

Visualize the property dashboard:

```text
YOUR PROPERTY

AC
Last serviced: 12 Aug

Electrical
Last checked: 04 Jul

Plumbing
Last repaired: 21 May

[ View Maintenance History ]
```

Make this visually distinctive.

---

# 53. HOMEPAGE SECTION: PROFESSIONALS

Headline:

**Skilled professional? Work with Fixify.**

Show:

```text
Verified jobs
Flexible availability
Digital job management
Transparent earnings
Support
```

CTA:

**Become a Fixify Professional**

---

# 54. HOMEPAGE FINAL CTA

Use:

**Something needs fixing?**

Supporting copy:

**Tell us what is happening. Fixify will help you take the next step.**

CTA:

**Describe a Problem**

---

# 55. CUSTOMER ROUTES

Recommended route map:

```text
/
 /services
 /services/:slug
 /how-it-works
 /professionals
 /help
 /about

 /login
 /register
 /forgot-password

 /app
 /app/assistant
 /app/services
 /app/services/:slug
 /app/requests/new
 /app/requests/:id
 /app/bookings
 /app/bookings/:id
 /app/properties
 /app/properties/:id
 /app/history
 /app/payments
 /app/invoices/:id
 /app/reviews
 /app/support
 /app/profile
```

---

# 56. PROFESSIONAL ROUTES

```text
/pro
/pro/onboarding
/pro/onboarding/verification
/pro/jobs
/pro/jobs/:id
/pro/availability
/pro/earnings
/pro/profile
/pro/support
```

---

# 57. ADMIN ROUTES

```text
/admin
/admin/jobs
/admin/jobs/:id
/admin/customers
/admin/customers/:id
/admin/professionals
/admin/professionals/:id
/admin/verification
/admin/services
/admin/pricing
/admin/materials
/admin/payments
/admin/invoices
/admin/reviews
/admin/complaints
/admin/notifications
/admin/analytics
/admin/settings
```

---

# 58. RESPONSIVE BEHAVIOR

Customer application:

**Mobile first.**

Professional application:

**Mobile first.**

Admin:

**Desktop first, responsive secondary.**

Marketing:

**Fully responsive.**

The supplied HTML demonstrates responsive transformations including mobile navigation and stacked layouts.

Do not merely shrink desktop designs.

Recompose them.

---

# 59. EMPTY STATES

Every collection needs an empty state.

Examples:

```text
No upcoming bookings

No service history yet

No saved properties

No available professionals

No complaints

No notifications
```

Each should explain what the user can do next.

---

# 60. LOADING STATES

Use skeletons/spinners where appropriate.

Example:

```text
Finding available professionals...
```

instead of a blank screen.

AI:

```text
Fixify is reviewing your description...
```

Matching:

```text
Finding verified professionals nearby...
```

Never simulate fake backend progress for long periods.

---

# 61. ERROR STATES

Design explicit states for:

```text
Network failure
Payment failure
Upload failure
No professional found
Professional rejected request
Time slot became unavailable
Quote expired
Booking cancelled
Service unavailable in area
AI unable to classify
```

Every error needs a recovery action.

---

# 62. NO-PROFESSIONAL-AVAILABLE FLOW

Do not dead-end.

Show:

```text
We couldn't find an available professional
for your requested time.

Try:
[ Different Time ]

[ Different Service Area ]

[ Request Help ]
```

Admin should see the unfulfilled request.

---

# 63. BOOKING CONFLICTS

A time slot must be revalidated on the server before final confirmation.

Correct flow:

```text
Customer selects 14:00
       ↓
Server rechecks availability
       ↓
Available → confirm
Unavailable → return alternatives
```

Never assume the slot remains available because it was visible 30 seconds earlier.

---

# 64. PAYMENT FAILURE

If payment fails:

```text
Booking remains in a controlled pending state
until timeout/policy
```

Do not mark:

```text
PAID
```

based on frontend success.

Only provider/backend confirmation can finalize payment.

---

# 65. PROFESSIONAL CANCELLATION

If a professional cancels:

```text
Customer notified
       ↓
Reassignment attempt
       ↓
Alternative professional
       ↓
Customer confirmation if required
```

Admin sees the event.

Professional cancellation should be recorded as an operational metric.

---

# 66. CUSTOMER CANCELLATION

The cancellation workflow must depend on current job state and configurable commercial policy.

Never implement:

```text
DELETE booking
```

Use:

```text
status = CANCELLED
cancelled_by
reason
timestamp
```

Preserve the record.

---

# 67. DELETION STRATEGY

Operational records should generally not be physically deleted.

Use:

* status
* archive
* soft deletion where necessary
* retention rules

This is especially important for:

* payments
* invoices
* completed jobs
* complaints
* verification history
* audit records

---

# 68. SEARCH & FILTERING

Admin and customer-facing collections should support relevant filters.

Jobs:

```text
status
service
date
professional
customer
location
```

Professionals:

```text
category
verification status
service area
availability
rating
```

Service history:

```text
category
property
date
professional
```

---

# 69. OBSERVABILITY

Build the system so errors can be diagnosed.

Log:

* API errors
* failed jobs
* failed payments
* failed notifications
* AI failures
* upload failures
* unauthorized attempts
* state-transition failures

Never log secrets or unnecessary sensitive content.

---

# 70. ANALYTICS

MVP analytics:

```text
Requests created
Bookings
Booking conversion
Jobs completed
Cancellation rate
Average service value
Professional acceptance rate
Average rating
Complaints
Repeat bookings
```

Later:

```text
Customer lifetime value
Professional retention
Category profitability
AI classification accuracy
Time-to-match
Time-to-arrival
Repeat-service interval
```

---

# 71. AI ANALYTICS

Measure:

```text
classification success
manual correction rate
AI escalation rate
customer drop-off after AI
average question count
service-category accuracy
```

If customers constantly correct the AI classification, the AI is not helping.

Do not optimize purely for “AI usage.”

Optimize for successful service completion.

---

# 72. MVP SCOPE

## MVP MUST INCLUDE

### Customer

```text
Authentication
Profile
Address/property
Service catalogue
Problem description
Photo upload
Booking
Availability
Professional assignment
Job tracking
Payment
Invoice
Review
History
Support/complaint submission
Rebooking
```

### Professional

```text
Registration
Verification workflow
Skills/categories
Service area
Availability
Job requests
Accept/reject
Job execution
Inspection
Quote
Completion evidence
Earnings
Support
```

### Admin

```text
Dashboard
Customers
Professionals
Verification
Services
Pricing
Jobs
Payments
Complaints
Reviews
```

---

# 73. PHASE 2

Implement after the core booking marketplace works:

```text
AI conversational intake
Voice input
Short video
Image analysis
Smart service classification
Advanced professional matching
Property assets
Maintenance reminders
Advanced notifications
```

---

# 74. PHASE 3

Later:

```text
Fixify Premium
Preventive maintenance
B2B/property manager accounts
Facility maintenance contracts
Advanced analytics
Parts/material marketplace
IoT integrations
Predictive maintenance
```

Premium should not be treated as mandatory MVP functionality. The original brief lists subscriptions as a business strategy possibility, not proof of customer demand.

---

# 75. WHAT NOT TO BUILD FIRST

Do not begin with:

```text
Microservices
Complex AI diagnosis
Full real-time GPS infrastructure
IoT
Subscription billing
Complex recommendation engine
Large parts marketplace
Pan-city scaling architecture
```

First prove:

```text
Request
→ Match
→ Service
→ Payment
→ Completion
```

---

# 76. DESIGN SYSTEM PRINCIPLE

Create reusable primitives:

```text
Button
Input
Select
Textarea
Dialog
Drawer
Card
Badge
Avatar
StatusBadge
Timeline
StepIndicator
PriceBreakdown
ServiceCard
ProfessionalCard
BookingCard
QuoteCard
PropertyCard
MediaUploader
ChatMessage
Notification
EmptyState
Skeleton
```

Do not create ten different versions of the same UI element.

---

# 77. STATUS DESIGN

Use a consistent semantic status system.

Example:

```text
REQUESTED
ASSIGNED
ACCEPTED
ON_THE_WAY
ARRIVED
INSPECTION
AWAITING_APPROVAL
IN_PROGRESS
COMPLETED
CANCELLED
DISPUTED
```

Status colors must remain accessible.

Never communicate status using color alone.

---

# 78. COMPONENT BEHAVIOR

Every component should define:

```text
default
loading
empty
error
disabled
success
mobile
desktop
reduced-motion
```

Example:

`ProfessionalCard`

Must work for:

```text
available
busy
verified
not verified
selected
unavailable
```

---

# 79. SOURCE HTML REUSE STRATEGY

The existing HTML can contribute implementation ideas for:

```text
navigation motion
hero animation
scroll reveals
horizontal reels
expandable panels
project/detail modal pattern
responsive menu
reduced-motion support
```

The HTML already uses canvas-generated visuals, intersection observers and responsive interaction patterns.

However:

**Do not copy its procedural construction scenes into the Fixify product.**

Replace them with:

* service imagery
* property imagery
* repair visuals
* technician imagery
* UI illustrations
* contextual motion graphics

---

# 80. HOMEPAGE INTERACTION STANDARD

The marketing site should feel alive without becoming a demo.

Good:

```text
Hero ambient motion
Text reveal
Service card expansion
Scroll-linked progress
Hover image scaling
Subtle cursor response
Animated booking preview
```

Bad:

```text
Animation everywhere
Huge WebGL scenes with no product purpose
Long loading intro
Auto-playing distracting video
Navigation that is difficult to use
Content hidden purely for visual effect
```

---

# 81. ACCESSIBILITY

Requirements:

```text
keyboard navigation
focus-visible states
semantic HTML
form labels
ARIA where needed
sufficient contrast
reduced motion
usable touch targets
screen-reader-friendly status changes
```

Do not sacrifice usability for visual sophistication.

---

# 82. PERFORMANCE

Marketing:

* lazy-load heavy visuals
* compress images
* avoid large blocking bundles
* defer non-essential effects

Application:

* prioritize data loading
* paginate history/jobs
* lazy-load media
* avoid huge global state
* cache stable service catalogue data

AI:

* stream conversational responses where appropriate
* persist structured output separately from raw messages

---

# 83. MEDIA STORAGE

Separate:

```text
media metadata
```

from:

```text
actual media file
```

Use private object storage where possible.

Access through authorized URLs.

Do not expose storage buckets publicly merely for convenience.

---

# 84. DATABASE PRINCIPLES

Use PostgreSQL or another relational database suitable for transactional workflows.

Why:

Fixify has:

* users
* properties
* services
* bookings
* state transitions
* quotes
* payments
* invoices
* reviews
* disputes
* audit logs

These require strong relationships and transactional consistency.

Avoid designing the core transactional model as a loose document database.

---

# 85. TRANSACTIONAL RULES

Operations that change money or critical job state should be transactional.

Examples:

```text
Approve quote
Create final charge
Complete payment
Close job
Create invoice
Update property history
```

Do not allow partially completed state updates.

---

# 86. IDEMPOTENCY

Payment creation, webhook handling and important state transitions must be safe to retry.

Example:

```text
Payment webhook arrives twice
```

Result:

```text
One payment record
One final payment state
No duplicate invoice
No duplicate earnings
```

---

# 87. BUSINESS CONFIGURATION

Do not hard-code:

```text
service prices
commission
inspection fees
service radius
cancellation policy
tax rates
warranty durations
premium price
```

Build configuration support.

Even if the admin UI for all of them is not implemented immediately, keep the domain model configurable.

---

# 88. PROFESSIONAL EARNINGS

Professional earnings should derive from finalized completed jobs.

Do not simply expose booking price as earnings.

Eventually:

```text
Gross service value
- Fixify platform fee
- adjustments
= professional earnings
```

Exact commercial model remains a business decision and must be configurable.

---

# 89. BUSINESS MODEL SUPPORT

The supplied brief identifies:

* service/platform commission
* premium services
* subscription
* supplier/brand partnerships.

The architecture should support these later without forcing them into MVP.

---

# 90. B2B / PROPERTY-MANAGER EXTENSION

Future role:

```text
PROPERTY_MANAGER
```

Could manage:

```text
multiple properties
multiple units
maintenance requests
staff permissions
service history
recurring contracts
approvals
invoices
```

Do not implement full B2B unless required for launch.

Design the property model so it can expand.

---

# 91. CODING-AGENT RULES

The coding agent must follow these rules.

### Rule 1

Do not invent undocumented business behavior when it affects money, permissions, or job state.

### Rule 2

Where the blueprint marks something as configurable, create a configurable abstraction.

### Rule 3

Do not create fake AI functionality that pretends to diagnose technical faults.

### Rule 4

Do not create fake payments or claim real payment success.

### Rule 5

Do not use mock data as though it were production data.

Clearly isolate seed/demo data.

### Rule 6

All server actions must validate authorization.

### Rule 7

All prices are server-derived.

### Rule 8

All important workflow transitions are server-controlled.

### Rule 9

Never delete operational records merely because they are no longer active.

### Rule 10

Desktop design must not dictate mobile UX.

---

# 92. SEED DATA FOR DEVELOPMENT

Create realistic development data:

```text
8 service categories
20–30 services
10 professionals
15 customers
10 properties
20 bookings
multiple job states
quotes
payments
reviews
complaints
```

Examples:

```text
Electrical
Plumbing
AC & Cooling
Appliances
Carpentry
Painting
Cleaning
Renovation
```

Use clearly synthetic names and contact information.

---

# 93. DEVELOPMENT ENVIRONMENT

Recommended MVP approach:

```text
Frontend:
Next.js + React + TypeScript

Styling:
Tailwind CSS + reusable design system

Backend:
Modular server/API layer within the same application initially

Database:
PostgreSQL

ORM:
Prisma or equivalent typed relational ORM

File storage:
Object storage abstraction

Authentication:
Provider/implementation abstraction with RBAC

Payments:
Provider adapter

Notifications:
Notification service abstraction

AI:
AI service adapter

Maps:
Map/location service adapter
```

Do not hard-wire the architecture around a single external provider.

---

# 94. ENVIRONMENT VARIABLES

Centralize configuration.

Examples:

```text
DATABASE_URL
AUTH_SECRET
STORAGE_BUCKET
STORAGE_URL
PAYMENT_API_KEY
PAYMENT_WEBHOOK_SECRET
AI_API_KEY
MAPS_API_KEY
EMAIL_API_KEY
```

Never commit real secrets.

Provide `.env.example`.

---

# 95. TESTING STRATEGY

Test the business rules first.

Critical tests:

```text
Unauthorized customer cannot access another customer's job

Professional cannot access unrelated customer information

Unverified professional cannot accept jobs

Professional cannot complete rejected job

Professional cannot charge additional work before approval

Customer cannot approve another customer's quote

Payment webhook cannot create duplicate payment

Completed job creates service-history record

Cancelled job cannot transition directly to completed

Expired quote cannot be approved
```

These are more important than testing whether a button has a particular border radius.

---

# 96. END-TO-END GOLDEN TEST

The most important automated/manual test:

```text
Customer registers
 ↓
Creates property
 ↓
Creates AC service request
 ↓
Uploads photo
 ↓
Booking created
 ↓
Professional sees request
 ↓
Professional accepts
 ↓
Customer sees assigned professional
 ↓
Professional marks on-the-way
 ↓
Professional arrives
 ↓
Professional performs inspection
 ↓
Professional submits additional quote
 ↓
Customer approves
 ↓
Professional completes work
 ↓
Payment finalized
 ↓
Invoice created
 ↓
Customer reviews
 ↓
Property history updated
```

This path must work before advanced features are considered complete.

---

# 97. MVP DELIVERY ORDER

## Sprint/Stage 1 — Foundation

Build:

```text
project setup
database
auth
RBAC
design system
app shell
navigation
```

## Stage 2 — Customer

Build:

```text
customer dashboard
properties
services
service request
photo upload
booking
```

## Stage 3 — Professional

Build:

```text
professional onboarding
verification
availability
job feed
accept/reject
job detail
job status
```

## Stage 4 — Operations

Build:

```text
admin
job management
professional management
verification
service/pricing management
```

## Stage 5 — Transaction layer

Build:

```text
quotes
additional work approval
payments
invoice
```

## Stage 6 — Trust layer

Build:

```text
reviews
complaints
audit history
service history
rebooking
```

## Stage 7 — Intelligence

Build:

```text
AI intake
voice
media intelligence
matching improvements
```

## Stage 8 — Premium UX

Build:

```text
advanced motion
marketing polish
property intelligence
maintenance reminders
```

---

# 98. DEFINITION OF DONE

A feature is not complete merely because its page renders.

For every feature, verify:

```text
UI exists
+
validation exists
+
backend behavior exists
+
database persistence exists
+
authorization exists
+
loading state exists
+
error state exists
+
empty state exists
+
mobile behavior exists
+
audit implications considered
```

For money-related features also verify:

```text
server-calculated amount
idempotency
payment state
failure handling
refund implications
```

---

# 99. FINAL PRODUCT PRINCIPLE

Fixify's interface should communicate:

> **“You don't need to know what is wrong. You just need to tell us what is happening.”**

The platform then takes responsibility for structuring the problem, finding the right service path, connecting the customer to an appropriate professional, making costs understandable, requiring approval when scope changes, and preserving the outcome.

That is the product.

Not:

```text
AI + maps + payments + technician cards
```

but:

```text
Problem
→ Understanding
→ Trust
→ Action
→ Accountability
→ History
```

---

# 100. CODING-AGENT EXECUTION INSTRUCTION

Before creating code:

1. Read this entire blueprint.
2. Create the domain model.
3. Create the database schema.
4. Define enums/state machines.
5. Define RBAC.
6. Define service boundaries.
7. Define the page/route structure.
8. Create the shared design system.
9. Build the customer golden path.
10. Build the professional golden path.
11. Build the admin operational path.
12. Add transactional/payment logic.
13. Add reviews/complaints/history.
14. Add AI after the core workflow is stable.
15. Add advanced motion only after usability and workflow correctness.

When requirements are ambiguous, **do not silently invent a commercially significant rule**. Flag it in a `PRODUCT_DECISIONS.md` file under:

```text
OPEN DECISION
OPTION A
OPTION B
CURRENT DEFAULT
BUSINESS OWNER DECISION REQUIRED
```

The application should remain usable and logically consistent while unresolved decisions are isolated.

---

# 101. FIRST FILES TO CREATE

```text
README.md
PRODUCT_SPEC.md
PRODUCT_DECISIONS.md
ARCHITECTURE.md
DATABASE.md
API.md
STATE_MACHINES.md
RBAC.md
DESIGN_SYSTEM.md
AI_SPEC.md
TEST_PLAN.md
.env.example
```

These become the project's internal documentation layer.

---

# 102. FIRST IMPLEMENTATION CHECKPOINT

Before any visual polish, the application should be able to demonstrate:

```text
Customer
   ↓
Creates problem
   ↓
Creates booking
   ↓
Professional receives job
   ↓
Professional accepts
   ↓
Professional arrives
   ↓
Professional inspects
   ↓
Professional creates quote
   ↓
Customer approves
   ↓
Professional completes
   ↓
Payment recorded
   ↓
Invoice generated
   ↓
Review submitted
   ↓
Property history updated
```

Once that works end-to-end, Fixify becomes a real product prototype rather than a collection of attractive screens.

---

# 103. FINAL DESIGN REFERENCE RULE

The supplied ABCD HTML is a **visual reference, not a functional specification**.

Keep its strengths:

* cinematic visual hierarchy
* refined typography
* restrained palette
* smooth transitions
* responsive composition
* interactive panels
* high-quality visual storytelling

But redesign everything around Fixify's actual user journey.

The original HTML's project cards, construction scenes, group-company ecosystem, project statistics and construction contact workflow should not be transplanted into Fixify. The existing contact form, for example, ultimately submits through a `mailto:` flow rather than implementing transactional booking.

**Fixify should look premium because the product is trustworthy and well-designed, not because it imitates an architecture portfolio.**

# END OF BLUEPRINT
