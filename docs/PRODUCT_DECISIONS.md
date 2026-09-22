# FIXIFY — Product Decisions

**Document status:** Working draft  
**Version:** 0.1  
**Last updated:** 2026-09-23  
**Purpose:** Single source of truth for business decisions that affect Fixify product behavior, pricing, marketplace operations, and future implementation.

---

## 1. How to use this document

This file records decisions that must not be silently invented by the coding agents.

For every unresolved decision, use:

```text
STATUS: OPEN
CURRENT DEVELOPMENT DEFAULT: <temporary implementation assumption>
BUSINESS DECISION REQUIRED: <decision the product owner must make>
```

A development default is **not** a business decision. Code must be written so that an open decision can be changed without a major rewrite.

### Source grounding

The original Fixify project brief supports the following general product direction: initial focus on urban/high-population cities, multiple home-service categories, verified professionals, service booking, material/brand preferences, and a future pan-India expansion. It does **not** specify a launch city, exact prices, commission percentage, cancellation/refund rules, verification-document list, warranty duration, or final payment policy.

Where the source material is silent, this document marks the decision **OPEN** rather than presenting an invented answer as settled fact.

---

# 2. Launch city

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** One Indian urban market/city only. Configure the application so service availability, professional coverage, pricing, and service areas are city/zone based.

**BUSINESS DECISION REQUIRED:** Select the exact first launch city and initial serviceable zones.

**Why this must remain configurable:** The project brief says Fixify will initially focus on urban and highly populated cities and may later expand into a pan-India platform, but it does not identify the first city. Do not hard-code a city into the core application.

---

# 3. Launch service categories

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Build the catalogue architecture for these categories, based on the project materials:

- Electrical
- Plumbing
- Carpentry
- AC / Cooling
- Appliance services
- Painting
- Cleaning
- Renovation / interior-related maintenance

Keep categories database-driven so additional categories can be added without frontend rewrites.

**BUSINESS DECISION REQUIRED:** Approve the exact launch categories and the exact services under each category.

**Source basis:** The original brief explicitly mentions electrical repairs, plumbing, carpentry, interior work, image/video-supported maintenance requests, and expansion to multiple service categories. The expanded Fixify description additionally names AC technicians, appliance technicians, painters and cleaners.

---

# 4. Currency

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** INR (₹) for the initial product prototype and data model.

**BUSINESS DECISION REQUIRED:** Confirm the launch currency and whether multi-currency support is required at launch.

**Implementation rule:** Currency must be represented as data/configuration, not hard-coded into financial calculations. Monetary values should use integer minor units where appropriate.

---

# 5. Pricing model

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support three pricing models from the beginning:

1. **FIXED_PRICE** — customer sees an authoritative service price before booking.
2. **INSPECTION_FEE** — customer pays a defined inspection/visit fee; repair cost may be determined after inspection.
3. **QUOTE_AFTER_INSPECTION** — professional inspects first, then submits a quote for additional work.

All authoritative totals are calculated server-side.

**BUSINESS DECISION REQUIRED:** Define the actual pricing model for every launch service, including whether inspection fees are refundable, adjustable against repair charges, or separate.

**Important product rule:** “Transparent pricing” must not be implemented as a promise of an exact repair price when the job genuinely requires inspection.

---

# 6. Inspection policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Services that cannot be reliably priced from the initial request use an inspection-first flow. The professional's physical inspection remains the final basis for repair work.

**BUSINESS DECISION REQUIRED:** Identify which launch services require inspection and define the inspection fee/policy for each one.

**Product rule:** AI and customer-submitted media can assist assessment, but the application must not represent an AI assessment as a guaranteed technical diagnosis.

---

# 7. Commission

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Store platform commission as configurable service/category-level data. Do not assume a percentage in production logic.

**BUSINESS DECISION REQUIRED:** Define:

- Fixify platform commission model
- percentage vs fixed fee
- whether commission applies to labour only or total service value
- whether material charges are commissionable
- treatment of discounts
- treatment of refunds
- treatment of taxes/fees
- professional payout timing

**Implementation rule:** Never hard-code the commission percentage in frontend components or client-side calculations.

---

# 8. Cancellation policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Cancellation is state-based and policy-driven. A booking is not physically deleted. The cancellation event is recorded with actor, reason, timestamp, and resulting financial outcome.

Potential policy stages:

- Before professional assignment
- After assignment
- After professional acceptance
- After professional arrival
- After work starts

**BUSINESS DECISION REQUIRED:** Define who can cancel at each stage, whether cancellation fees apply, and how those fees affect customer/professional payouts.

---

# 9. Rescheduling policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support rescheduling as a controlled operation that checks professional availability again on the server. A successful reschedule creates a new event in the booking/job timeline instead of overwriting historical data.

**BUSINESS DECISION REQUIRED:** Define:

- how close to the appointment a customer may reschedule
- whether professionals may reschedule
- whether repeated rescheduling is allowed
- whether price changes when the slot changes
- whether fees apply
- what happens if the original professional becomes unavailable

---

# 10. Refund policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support at least:

- full refund
- partial refund
- no refund
- refund pending
- refund completed

Refunds are initiated through controlled server-side/payment-provider workflows, never by client-side flags.

**BUSINESS DECISION REQUIRED:** Define refund eligibility for:

- customer cancellation
- professional cancellation
- no-show
- failed service
- disputed service
- duplicate payment
- quote cancellation
- service under warranty

---

# 11. Professional verification requirements

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** A professional must pass a Fixify verification workflow before being eligible for live job assignment. The system should support separate verification states rather than a single boolean.

Suggested states:

```text
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

Potential verification domains to support structurally:

- identity
- phone/contact information
- address
- service categories
- skills/experience
- relevant eligibility documents
- background/identity checks where applicable

**BUSINESS DECISION REQUIRED:** Define the exact documents, checks, expiry handling, manual review process, re-verification interval, and category-specific requirements.

**Important:** Do not claim a professional is “verified” until the required checks are actually complete.

---

# 12. Warranty policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Model warranty/rework as configurable job-level information so the product can support service-specific warranty periods later. Do not promise a universal warranty in customer-facing copy until the policy is approved.

Suggested conceptual states:

```text
NOT_APPLICABLE
ACTIVE
EXPIRED
CLAIM_OPEN
RESOLVED
```

**BUSINESS DECISION REQUIRED:** Define:

- whether Fixify provides a warranty
- duration by service/category
- what workmanship is covered
- what parts are covered
- exclusions
- claim window
- who pays for rework
- whether the original professional handles the claim
- escalation rules

---

# 13. Material policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support three customer choices:

- Fixify standard option
- customer preferred brand/material
- no preference

Also allow the professional to recommend materials after inspection where appropriate.

Material price changes must be visible before customer approval when they alter the payable amount.

**BUSINESS DECISION REQUIRED:** Define:

- whether Fixify supplies materials
- whether professionals purchase materials
- whether customers may supply their own materials
- approved brands/suppliers
- markup policy
- proof/record of material purchase
- return/replacement responsibility
- warranty responsibility for supplied materials

**Source basis:** The original brief explicitly states that customers should be able to choose required materials and preferred brands such as wires, fittings, wood types, and fabrics. fileciteturn2file1L556-L565

---

# 14. Emergency service policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Do not advertise emergency service as a guaranteed launch feature until operational coverage exists.

The system should remain extensible for an emergency flag/priority level:

```text
NORMAL
URGENT
EMERGENCY
```

**BUSINESS DECISION REQUIRED:** Decide whether Fixify will offer emergency services at launch and define:

- supported categories
- supported hours
- service-area restrictions
- emergency fees
- matching priority
- expected response time
- professional availability requirements
- cancellation rules

---

# 15. Customer/professional matching rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Deterministic matching for MVP.

Eligibility order:

1. Correct service/category skill
2. Verified professional status
3. Service-area coverage
4. Availability for the requested slot
5. Reasonable travel distance

Ranking can then consider configurable operational factors such as availability, workload, distance, rating, and reliability.

**BUSINESS DECISION REQUIRED:** Define whether:

- Fixify auto-assigns the professional
- customer selects from available professionals
- both modes are supported
- customers can explicitly request/rebook a professional
- professional ranking is customer-visible
- customer choice overrides automatic matching
- emergency requests use a different matching rule

**Source basis:** The brief says customers can book skilled professionals based on availability and rebook preferred workers. fileciteturn2file1L556-L565

---

# 16. Data retention

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Preserve transactional records needed for service history, payments, invoices, complaints, verification/audit purposes. Use soft-delete/archive patterns for operational records rather than destructive deletion.

Media should have configurable retention policies, with stricter controls for professional verification documents.

**BUSINESS DECISION REQUIRED:** Define actual retention periods for:

- customer accounts
- job records
- invoices
- payments
- complaints
- reviews
- photos/videos
- voice recordings/transcripts
- AI conversations
- professional verification documents
- audit logs
- deleted accounts

Also define the process for data export and deletion requests where required by applicable law.

---

# 17. AI escalation rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** AI is an intake/classification assistant, not the final technical authority.

AI may:

- ask clarifying questions
- summarize the customer's problem
- identify a likely service category
- request useful media
- provide a confidence level
- recommend inspection
- escalate to a human/professional

AI must not:

- present uncertain findings as a guaranteed diagnosis
- invent prices
- approve work
- authorize additional charges
- override professional inspection
- claim that an unsafe situation is safe

Escalate when:

- classification confidence is low
- symptoms are ambiguous
- uploaded media is inconclusive
- the customer requests certainty beyond available evidence
- the case is outside supported categories
- a potential safety-critical condition is detected

**BUSINESS DECISION REQUIRED:** Define the exact confidence threshold/logic, supported categories, human-support escalation process, AI data retention policy, customer-facing disclaimer wording, and whether AI is available on every request or only selected categories.

---

# 18. Premium strategy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Premium/subscription is Phase 2+ and disabled in MVP unless explicitly activated.

Potential benefits described in the product concept include:

- priority support
- selected discounts
- maintenance reminders
- preferential booking

**BUSINESS DECISION REQUIRED:** Define:

- subscription price
- billing frequency
- exact benefits
- exclusions
- cancellation/refund rules
- whether discounts apply to labour, materials, or platform fees
- whether premium affects matching priority
- unit economics target

**Product rule:** Do not build premium around the assumption that customers will subscribe. Validate customer value and economics first.

The original project brief lists subscription plans as a possible business strategy, not as a validated launch requirement. fileciteturn1file0L603-L608

---

# 19. B2B strategy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** B2B is a later expansion, but the property/domain model should support multiple properties and controlled organization access without requiring a database redesign.

Potential B2B customers:

- offices
- commercial properties
- property managers
- landlords
- institutions

Potential capabilities:

- multiple properties/units
- staff permissions
- centralized maintenance requests
- recurring maintenance
- service contracts
- consolidated invoices
- approval workflows

**BUSINESS DECISION REQUIRED:** Define whether B2B launches alongside the consumer marketplace or later, target customer segment, contract model, SLA expectations, pricing, invoicing, permissions, and account hierarchy.

---

# 20. Additional open decisions that must not be silently invented

The following are also necessary for a complete implementation even though they are not part of the requested 18-item decision list.

## 20.1 Payment timing

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support payment states and allow payment timing to be configured by service type.

**BUSINESS DECISION REQUIRED:** Pay before service, inspection-only upfront, pay after service, deposit, or mixed model?

## 20.2 Customer/professional communication

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** In-app status updates first; direct chat/phone masking can be added later.

**BUSINESS DECISION REQUIRED:** Should customers and professionals have direct messaging/calling? If yes, when is it available and what information is masked?

## 20.3 Professional no-show

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Record no-show as a job event and trigger reassignment/support workflow.

**BUSINESS DECISION REQUIRED:** Customer compensation, professional penalties, and escalation policy.

## 20.4 Customer no-show / inaccessible property

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Record the event without deleting the booking and route it through the cancellation/no-show policy.

**BUSINESS DECISION REQUIRED:** Fees, rebooking behavior, and evidence required from the professional.

## 20.5 Service completion evidence

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Professional can submit completion notes and optional photos/evidence; required evidence can be configured by category.

**BUSINESS DECISION REQUIRED:** Which service categories require before/after photos, customer signature, OTP, or other proof of completion?

## 20.6 Rating rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Only customers with eligible completed jobs can submit a review.

**BUSINESS DECISION REQUIRED:** Review window, professional response, moderation, editing/deletion policy, and dispute handling.

---

# 21. Implementation principles for open decisions

Until a business owner makes a final decision:

1. Store the rule in configuration where practical.
2. Do not hard-code commercial values into UI components.
3. Do not make irreversible database assumptions.
4. Do not present development defaults as customer-facing promises.
5. Record material changes through migrations and documentation.
6. Update this file before changing business-critical behavior.

---

# 22. Decision record format

When a decision is finalized, replace the relevant `OPEN` section with:

```text
STATUS: DECIDED
DECISION DATE: YYYY-MM-DD
DECISION OWNER: <name/role>
FINAL DECISION: <decision>
RATIONALE: <short explanation>
IMPLEMENTATION IMPACT: <what changes>
```

Keep the historical rationale in Git commit history or a dedicated decision log when the change is significant.

---

# 23. Current implementation status

| Decision | Status | Safe development assumption |
|---|---|---|
| Launch city | OPEN | One Indian urban market, configurable |
| Launch categories | OPEN | Core maintenance categories from Fixify concept |
| Currency | OPEN | INR for prototype/development |
| Pricing model | OPEN | Fixed + inspection + post-inspection quote support |
| Inspection policy | OPEN | Inspection where pre-service diagnosis/pricing is unreliable |
| Commission | OPEN | Configurable, no percentage hard-coded |
| Cancellation | OPEN | State/policy driven |
| Rescheduling | OPEN | Server revalidation of availability |
| Refund | OPEN | Full/partial/refund-pending/refunded states |
| Professional verification | OPEN | Verification workflow required before live jobs |
| Warranty | OPEN | Configurable, no universal promise |
| Materials | OPEN | Customer preference + professional recommendation |
| Emergency service | OPEN | Not promised at launch |
| Matching | OPEN | Deterministic verified/skill/area/availability matching |
| Data retention | OPEN | Preserve transactional/audit records; configurable media retention |
| AI escalation | OPEN | AI assists; uncertainty escalates |
| Premium | OPEN | Phase 2+ |
| B2B | OPEN | Later phase, model extensible |

---

# END OF PRODUCT DECISIONS
