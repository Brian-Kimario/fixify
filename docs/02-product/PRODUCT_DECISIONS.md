# FIXIFY — PRODUCT DECISIONS

**Document status:** Working draft  
**Version:** 0.2  
**Last updated:** 2026-09-23  
**Purpose:** Single source of truth for business decisions that affect Fixify product behavior, pricing, marketplace operations, customer/professional experience, and future implementation.

---

## 1. How to use this document

This document prevents coding agents from silently inventing commercially meaningful behavior.

Every decision has one of these states:

```text
STATUS: DECIDED
```

or, while unresolved:

```text
STATUS: OPEN
CURRENT DEVELOPMENT DEFAULT: <temporary implementation assumption>
BUSINESS DECISION REQUIRED: <decision the product owner must make>
```

A **CURRENT DEVELOPMENT DEFAULT is not a business decision**.

When a decision is open:

- code must remain configurable where practical;
- customer-facing copy must not present the default as a promise;
- financial, permission, and workflow logic must not hard-code an arbitrary value;
- the open decision must remain visible to the product owner;
- changing the final decision should not require a fundamental rewrite.

### Source grounding

The supplied Fixify project brief establishes the broad product direction: an urban-focused home-repair/maintenance platform, multiple service categories, smart problem description, image/video upload, customer material/brand choices, verified professionals, flexible booking, rebooking, a backend/database, service-provider module, admin panel, and possible future expansion. It does **not** establish the exact launch city, exact launch catalogue, prices, commission percentage, cancellation/refund rules, verification-document list, warranty duration, or final payment policy.

The expanded Fixify business definition additionally establishes AI-assisted intake, voice/text/photo/video input, service matching, job tracking, payment/invoice handling, customer approval before additional work, reviews, complaint resolution, professional operations, property maintenance history, and possible Premium/B2B expansion.

Where the sources are silent, this document deliberately marks the item **OPEN** rather than turning an assumption into a hidden product rule.

---

# 2. Launch city

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Launch in one Indian urban market/city. Model service coverage as city/zone based rather than hard-coding one geographic location into the application.

**BUSINESS DECISION REQUIRED:** Select the exact first launch city and the initial serviceable zones/pincodes.

**Implementation implications:**

- service availability must be location-aware;
- professionals must have service areas;
- pricing may vary by city/zone;
- the same service catalogue should be reusable across cities;
- future expansion must not require a new schema.

**Source basis:** The project brief says Fixify will initially focus on urban/high-population cities and may later expand into a pan-India platform, but it does not specify the first city.

---

# 3. Launch service categories

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Build a database-driven catalogue capable of supporting at least:

- Electrical
- Plumbing
- Carpentry
- AC / Cooling
- Appliance services
- Painting
- Cleaning
- Renovation / interior-related maintenance

The exact launch catalogue must be controlled by active/inactive service records rather than frontend hard-coding.

**BUSINESS DECISION REQUIRED:** Approve the exact launch categories and the exact bookable services under each category.

**Source basis:** The original brief explicitly names electrical, plumbing, carpentry and interior work and says the platform can expand to multiple categories. The expanded Fixify definition additionally names AC technicians, appliance technicians, painters and cleaners.

---

# 4. Currency

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** INR (₹) for the initial prototype/development environment because the supplied proposal is India-oriented.

**BUSINESS DECISION REQUIRED:** Confirm launch currency and whether multi-currency support is required at launch.

**Implementation rule:** Currency is data/configuration, not a UI constant. Monetary calculations must use a consistent precise representation; use integer minor units where the selected payment/accounting model supports that approach.

---

# 5. Pricing model

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support three pricing models from the beginning:

### FIXED_PRICE

A customer sees an authoritative service price before booking.

### INSPECTION_FEE

The customer pays a defined visit/inspection charge. Repair pricing may be determined after inspection.

### QUOTE_AFTER_INSPECTION

The professional inspects the problem and submits a quote before variable/additional work proceeds.

**BUSINESS DECISION REQUIRED:** Define the pricing model for every launch service, including:

- base price;
- inspection fee;
- labour treatment;
- material treatment;
- taxes/fees;
- discounts;
- minimum charges;
- whether inspection fees are separate or adjustable against repair work;
- whether any service allows customer-selected material substitution.

**Non-negotiable product rule:** Transparency does not mean pretending every repair has a fixed price. If reliable pricing requires physical inspection, the UI must say so.

**Implementation rule:** Final totals are calculated server-side. Client-submitted totals are never authoritative.

---

# 6. Inspection policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Use inspection-first workflows for services where the initial description/media cannot reliably establish repair scope or final price.

**BUSINESS DECISION REQUIRED:** Identify which services require inspection and define:

- inspection fee;
- expected inspection duration;
- whether inspection can itself resolve the problem;
- whether inspection fee is refundable/creditable;
- what happens if the professional cannot diagnose the issue;
- what evidence is captured during inspection.

**Product rule:** AI, photographs, videos and customer descriptions can assist triage. A professional inspection remains the basis for actual repair decisions where required.

---

# 7. Commission

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Commission is configurable by service/category and is not hard-coded as one global percentage.

**BUSINESS DECISION REQUIRED:** Define:

- percentage vs fixed platform fee;
- labour-only vs total-order commission;
- material commissionability;
- tax/fee treatment;
- discounts;
- refunds;
- cancelled jobs;
- professional payout timing;
- adjustments/disputes;
- whether commission changes by category or service area.

**Implementation rule:** Customer and professional clients never calculate authoritative platform commission.

---

# 8. Cancellation policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Cancellation is a controlled operation, not deletion of a booking. The cancellation event is recorded with actor, reason, time, and resulting financial outcome.

Evaluate cancellation by lifecycle stage:

```text
Before professional assignment
After assignment
After professional acceptance
Professional on the way
Professional arrived
Work started
```

**BUSINESS DECISION REQUIRED:** Define who may cancel at each stage, notice periods, fees, refunds, professional compensation, and customer compensation.

**Implementation rule:** Cancellation behavior is policy-driven and configurable.

---

# 9. Rescheduling policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Rescheduling is a controlled operation that revalidates availability and records the old and new schedule in the audit/timeline history.

**BUSINESS DECISION REQUIRED:** Define:

- customer reschedule window;
- professional reschedule rights;
- maximum/repeated rescheduling;
- whether fees apply;
- whether price can change;
- what happens if the original professional becomes unavailable;
- whether customer reapproval is required.

**Implementation rule:** Never simply overwrite the historical appointment without an event showing the change.

---

# 10. Refund policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Financial model supports at least:

```text
REFUND_PENDING
PARTIALLY_REFUNDED
REFUNDED
```

with no-refund outcomes also possible through explicit policy.

**BUSINESS DECISION REQUIRED:** Define refund eligibility for:

- customer cancellation;
- professional cancellation;
- no-show;
- failed service;
- duplicate payment;
- dispute resolution;
- rejected/declined quote;
- warranty/rework;
- system/payment errors.

**Implementation rule:** Refunds are created by controlled server/provider workflows. A browser flag cannot create or finalize a refund.

---

# 11. Professional verification requirements

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Professionals must pass a Fixify verification workflow before they are eligible for live job assignment.

Suggested verification states:

```text
PENDING
DOCUMENTS_SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

Potential verification domains:

- identity;
- phone/contact information;
- address;
- service category;
- skill/experience;
- relevant eligibility/licensing documents where applicable;
- background/identity checks where applicable.

**BUSINESS DECISION REQUIRED:** Define exact document/check requirements, review process, expiry handling, re-verification interval, category-specific rules, and consequences of failed verification.

**Important:** An account existing is not the same as a professional being verified.

---

# 12. Warranty policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support configurable job-level warranty/rework information without promising a universal warranty in public marketing.

Possible conceptual states:

```text
NOT_APPLICABLE
ACTIVE
EXPIRED
CLAIM_OPEN
RESOLVED
```

**BUSINESS DECISION REQUIRED:** Define:

- whether Fixify provides workmanship warranty;
- duration by service/category;
- parts coverage;
- labour coverage;
- exclusions;
- claim window;
- responsibility for supplied materials;
- who performs rework;
- escalation rules;
- refund/replacement interaction.

---

# 13. Material policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support three customer choices where a service permits material selection:

```text
Fixify standard
Customer preferred brand/material
No preference
```

Professionals may recommend an alternative after inspection where appropriate.

Price changes must be disclosed before they become payable.

**BUSINESS DECISION REQUIRED:** Define:

- whether Fixify supplies materials;
- whether professionals purchase materials;
- whether customers may supply their own materials;
- approved brands/suppliers;
- markup policy;
- proof of purchase;
- replacement/return responsibility;
- warranty responsibility;
- material quality verification.

**Source basis:** The original brief explicitly allows customers to choose required materials such as wires, fittings, wood types or fabrics and select branded/preferred materials. fileciteturn2file1L556-L565

---

# 14. Emergency service policy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Do not advertise guaranteed emergency service at launch unless Fixify has real operational coverage.

The data model should remain capable of supporting:

```text
NORMAL
URGENT
EMERGENCY
```

**BUSINESS DECISION REQUIRED:** Define:

- categories eligible for emergency service;
- hours;
- service areas;
- emergency pricing;
- response-time target;
- professional eligibility;
- priority matching;
- cancellation/no-show treatment.

---

# 15. Customer/professional matching rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Deterministic matching for MVP.

Eligibility order:

```text
Correct service/category skill
        ↓
Verified professional
        ↓
Service-area coverage
        ↓
Availability
        ↓
Reasonable travel distance
```

After eligibility, ranking may consider:

```text
availability
workload
travel distance
customer-visible rating
reliability/completion metrics
```

**BUSINESS DECISION REQUIRED:** Define whether:

- Fixify auto-assigns professionals;
- customers choose from eligible professionals;
- both modes exist;
- rebooking a preferred professional is guaranteed only when available;
- customer preference can override automated ranking;
- emergency jobs have separate matching logic.

**Source basis:** The original brief says customers can book skilled professionals based on availability and rebook preferred workers. fileciteturn2file1L556-L565

---

# 16. Data retention

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Preserve transactional and accountability records needed for service history, payments, invoices, complaints, verification, and audit. Use archive/soft-delete patterns rather than destructive deletion for historical operational records.

Media and verification documents should have separate retention/access policies.

**BUSINESS DECISION REQUIRED:** Define retention periods for:

- customer accounts;
- properties;
- job records;
- invoices;
- payments;
- complaints;
- reviews;
- photos/videos;
- voice recordings/transcripts;
- AI conversations;
- professional verification documents;
- audit logs;
- deleted accounts.

Also define applicable data export/deletion processes.

---

# 17. AI escalation rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** AI is a service-intake and classification assistant, not the final technical authority.

AI may:

- ask clarifying questions;
- summarize the problem;
- identify likely service category;
- request useful media;
- provide confidence;
- recommend inspection;
- escalate to human/professional assistance.

AI must not:

- present uncertain findings as guaranteed diagnosis;
- invent prices;
- approve additional work;
- authorize charges;
- override professional findings;
- claim a safety-critical situation is safe without a reliable basis.

Escalation should occur when:

- confidence is low;
- symptoms are ambiguous;
- media is inconclusive;
- the case is outside supported categories;
- a user requests certainty beyond available evidence;
- potential safety-critical conditions are detected.

**BUSINESS DECISION REQUIRED:** Define exact confidence/escalation thresholds, supported categories, escalation destination, customer disclosure, AI retention period, and whether AI is optional or mandatory for selected flows.

---

# 18. Premium strategy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Premium is Phase 2+ and disabled from the MVP unless explicitly activated.

Potential benefits from the business concept:

- priority support;
- selected discounts;
- maintenance reminders;
- preferential booking.

**BUSINESS DECISION REQUIRED:** Define:

- price;
- billing frequency;
- exact benefits;
- exclusions;
- discount scope;
- premium cancellation/refund;
- whether premium changes matching priority;
- unit-economics target.

**Product rule:** Do not assume subscription demand before validating customer value.

The original brief presents subscription plans as a possible business strategy, not as a validated MVP requirement. fileciteturn1file0L603-L608

---

# 19. B2B strategy

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** B2B is a later expansion, but the property/data model must support multiple properties and controlled organizational access without a fundamental redesign.

Potential B2B segments:

- offices;
- shops/commercial properties;
- property managers;
- landlords;
- institutions.

Potential capabilities:

- multiple properties/units;
- staff permissions;
- centralized maintenance requests;
- recurring services;
- service contracts;
- consolidated invoices;
- approval workflows.

**BUSINESS DECISION REQUIRED:** Define target B2B segment, launch timing, account hierarchy, contract/SLA model, pricing, permissions, invoicing, and recurring-maintenance model.

---

# 20. Additional business decisions required before commercial launch

These are not merely implementation details. They can materially change the product and economics.

## 20.1 Payment timing

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Support the architecture for upfront, inspection-upfront, post-service, deposit, and mixed strategies without committing the UI to one universal pattern.

**BUSINESS DECISION REQUIRED:** Define payment timing by service/pricing model.

---

## 20.2 Customer/professional communication

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** In-app operational status updates first. Direct chat/calling can be added behind an explicit communication policy.

**BUSINESS DECISION REQUIRED:** Decide whether direct messaging/calling is allowed, at what job stages, and whether phone numbers are masked.

---

## 20.3 Professional no-show

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Record a no-show event, notify the customer, attempt reassignment where operationally possible, and route the incident into the appropriate policy.

**BUSINESS DECISION REQUIRED:** Define compensation, penalties, customer refund, rebooking priority, and evidence requirements.

---

## 20.4 Customer no-show / inaccessible property

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Preserve the booking and record the incident rather than deleting it.

**BUSINESS DECISION REQUIRED:** Define fees, professional compensation, evidence, cancellation effects, and rebooking rules.

---

## 20.5 Completion evidence

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Professionals can submit completion notes and evidence; service-specific required evidence can be configured.

**BUSINESS DECISION REQUIRED:** Define where required:

- before/after photographs;
- customer signature;
- OTP/PIN confirmation;
- checklist;
- meter readings;
- material records.

---

## 20.6 Customer review rules

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Only customers with an eligible completed job can review that job/professional.

**BUSINESS DECISION REQUIRED:** Define:

- rating scale;
- review window;
- editing;
- deletion/moderation;
- professional response;
- review disputes.

---

## 20.7 Service-area definition

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** Store service coverage by city/zone and professional area rather than assuming platform-wide availability.

**BUSINESS DECISION REQUIRED:** Define whether coverage is:

- pincode based;
- radius based;
- ward/zone based;
- manually managed;
- hybrid.

---

## 20.8 Job warranty / recurrence handling

**STATUS: OPEN**

**CURRENT DEVELOPMENT DEFAULT:** A customer can report a recurring issue through the original job where a warranty/rework policy applies.

**BUSINESS DECISION REQUIRED:** Define how recurring faults are classified and whether they become a warranty claim, new booking, complaint, or support case.

---

# 21. Product decisions that should NOT be left to coding agents

Coding agents must not independently decide:

```text
Launch city
Launch service catalogue
Currency
Prices
Inspection fees
Commission
Taxes/fees treatment
Cancellation fees
Refund eligibility
Professional payouts
Verification requirements
Warranty promises
Material markup
Emergency pricing
Matching policy visible to customers
Premium price/benefits
B2B pricing/contracts
```

An agent may propose options, but the final value belongs in this document.

---

# 22. Implementation rules for OPEN decisions

Until a business decision is finalized:

1. Use configuration/data rather than hard-coded constants where practical.
2. Use neutral UI copy that does not promise an unresolved policy.
3. Keep migrations reversible through additive/configurable design where practical.
4. Do not create irreversible commercial assumptions inside database functions.
5. Mark temporary seed values as development data.
6. Record the affected feature/module when an open decision is implemented with a temporary default.
7. Update this document before changing production commercial behavior.

---

# 23. Decision record format

When a decision becomes final, replace the relevant OPEN status with:

```text
STATUS: DECIDED
DECISION DATE: YYYY-MM-DD
DECISION OWNER: <name/role>
FINAL DECISION: <decision>
RATIONALE: <short explanation>
IMPLEMENTATION IMPACT: <affected product/backend/UI areas>
```

For significant decisions, preserve historical changes in Git and/or a dedicated decision log.

---

# 24. Current implementation status

| Decision | Status | Safe development default |
|---|---|---|
| Launch city | OPEN | One Indian urban market, configurable |
| Launch categories | OPEN | Core Fixify maintenance categories, database-driven |
| Currency | OPEN | INR for prototype/development |
| Pricing model | OPEN | Fixed + inspection + post-inspection quote support |
| Inspection policy | OPEN | Inspection where reliable pre-service pricing/scope is not possible |
| Commission | OPEN | Configurable; no percentage hard-coded |
| Cancellation | OPEN | State/policy driven |
| Rescheduling | OPEN | Server revalidation + history |
| Refunds | OPEN | Full/partial/refund-pending/refunded support |
| Professional verification | OPEN | Verification workflow required before live work |
| Warranty | OPEN | Configurable; no universal promise |
| Materials | OPEN | Standard/preferred/no-preference + professional recommendation |
| Emergency service | OPEN | Not promised at launch |
| Matching | OPEN | Verified + skill + area + availability first |
| Data retention | OPEN | Preserve transactional/audit records; configurable media policy |
| AI escalation | OPEN | AI assists; uncertainty/safety-sensitive cases escalate |
| Premium | OPEN | Phase 2+ |
| B2B | OPEN | Later phase; extensible property model |
| Payment timing | OPEN | Configurable by service/pricing model |
| Communication | OPEN | In-app operational updates first |
| Professional no-show | OPEN | Record + notify + reassignment workflow |
| Customer no-show | OPEN | Record + policy-driven financial outcome |
| Completion evidence | OPEN | Configurable per service |
| Review rules | OPEN | Completed-job reviews only |
| Service-area model | OPEN | City/zone-based |
| Recurrence/warranty claims | OPEN | Supported structurally; final policy undecided |

---

# 25. Final rule for product and engineering

When a requirement is unclear, do not solve the ambiguity by quietly inventing business behavior.

Use this decision path:

```text
Is the behavior already defined here?
        |
      YES → implement it.
        |
       NO
        ↓
Is it a low-risk technical implementation detail?
        |
   YES → choose the simplest reversible implementation.
        |
       NO
        ↓
Mark the decision OPEN.
Record a temporary development default.
Do not turn it into an irreversible business rule.
```

The goal of this document is not to eliminate all uncertainty before coding.

The goal is to make uncertainty **visible, isolated, configurable, and owned by the correct decision-maker**.

# END OF PRODUCT DECISIONS
