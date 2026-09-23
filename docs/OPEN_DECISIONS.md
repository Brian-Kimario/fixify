# FIXIFY — OPEN DECISIONS REGISTER

**Document status:** Active decision register  
**Version:** 1.0  
**Last updated:** 2026-09-23  
**Purpose:** Central tracker for unresolved Fixify product, marketplace, operational, policy, and commercial decisions that must not be silently invented by developers or coding agents.

---

## 1. Authority and relationship to other documents

This file is a **decision tracker**, not a replacement for the product specification.

Decision authority is:

```text
PRODUCT_DECISIONS.md
        ↓
OPEN_DECISIONS.md
        ↓
STATE_MACHINES.md / RBAC.md / DATA_MODEL.md
        ↓
implementation
```

`PRODUCT_DECISIONS.md` contains the current business-policy record. This file gives the unresolved items a practical queue, ownership, dependency, and completion record.

Rules:

1. An item marked `OPEN` is not a final business rule.
2. A `CURRENT DEVELOPMENT DEFAULT` exists only to keep implementation reversible.
3. Coding agents must not convert a default into a customer-facing promise.
4. A decision becomes authoritative only after it is recorded as `DECIDED` in `PRODUCT_DECISIONS.md` and reflected here.
5. Technical implementation choices may be made without business approval only when they are low-risk, reversible, and do not change customer economics, permissions, or marketplace policy.

---

## 2. Status values

```text
OPEN
NEEDS_RESEARCH
READY_FOR_DECISION
DECIDED
DEFERRED
BLOCKED
```

### Meaning

| Status | Meaning |
|---|---|
| OPEN | Unresolved and actively requires product/business decision. |
| NEEDS_RESEARCH | Requires evidence, operational testing, legal/payment review, or unit-economics analysis first. |
| READY_FOR_DECISION | Options/evidence are sufficiently prepared for a final choice. |
| DECIDED | Final business decision has been recorded in `PRODUCT_DECISIONS.md`. |
| DEFERRED | Deliberately postponed to a later phase. |
| BLOCKED | Cannot be finalized because a prerequisite decision or external dependency is missing. |

---

## 3. Decision ownership

Unless explicitly reassigned, unresolved business decisions are owned by the **Fixify product/business owners**.

Engineering owns:

- technical implementation;
- reversibility;
- validation;
- logging;
- tests;
- migration safety;
- configuration mechanisms.

Engineering does **not** own:

- prices;
- commissions;
- refund promises;
- warranty promises;
- customer compensation;
- professional penalties;
- commercial membership benefits;
- final verification policy;
- customer communication policy;
- launch geography.

---

# 4. Launch and market decisions

## OD-001 — Launch city and serviceable geography

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes for commercial launch; no for core prototype

**Decision required:**

Select the exact first launch city and the initial serviceable zones/pincodes.

**Current development default:**

Use a configurable city/zone model. Do not hard-code one city into the schema or matching logic.

**Questions to resolve:**

- Which city is first?
- Which areas/pincodes are serviceable at launch?
- Are there excluded areas?
- Can availability differ by service category?
- Who can change service coverage?

**Downstream dependencies:** service areas, pricing, professional onboarding, matching, catalogue availability, emergency policy.

---

## OD-002 — Launch service catalogue

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes for commercial launch; no for catalogue prototype

**Decision required:**

Approve the exact categories and bookable services at launch.

**Current development default:**

Database-driven catalogue with the ability to activate/deactivate services without code changes.

**Candidate categories from current Fixify definition:**

- Electrical
- Plumbing
- Carpentry
- AC / Cooling
- Appliance services
- Painting
- Cleaning
- Renovation / interior-related maintenance

The final list is intentionally not decided here.

**Downstream dependencies:** service pricing, AI triage, professional skills, materials, inspection rules, matching.

---

## OD-003 — Launch currency and money display

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Medium  
**RELEASE BLOCKER:** Yes for commercial launch

**Decision required:**

Confirm the launch currency and whether multi-currency support is required at launch.

**Current development default:** INR for prototype/development.

**Implementation constraint:**

Currency must be stored/configured as data. Do not scatter currency symbols or exchange assumptions through the frontend.

---

# 5. Pricing, payment, and marketplace economics

## OD-004 — Service pricing architecture

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Very High  
**RELEASE BLOCKER:** Yes for commercial launch

**Decision required:**

Define which services use:

```text
FIXED_PRICE
INSPECTION_FEE
QUOTE_AFTER_INSPECTION
```

and whether a single service can support multiple pricing modes depending on conditions.

**Questions to resolve:**

- What does the customer pay before booking?
- Which prices include labour?
- Which prices include materials?
- Which jobs require inspection?
- Can the professional change the scope after arrival?
- What information must appear before confirmation?

**Current development default:** support all three models structurally.

**Dependencies:** quotes, payments, invoices, UI checkout, completion workflow.

---

## OD-005 — Payment timing

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Very High  
**RELEASE BLOCKER:** Yes for payment-enabled launch

**Decision required:**

Define payment timing per pricing/service model:

- upfront;
- inspection fee first;
- deposit;
- post-service;
- mixed strategy.

**Current development default:** configuration-driven payment timing; no single global payment promise.

**Dependencies:** payment state machine, invoices, refunds, cancellation, professional payout.

---

## OD-006 — Commission and platform fee

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Very High  
**RELEASE BLOCKER:** Yes for commercial marketplace launch

**Decision required:**

Define the commercial model:

- percentage vs fixed fee;
- labour-only vs total order;
- treatment of materials;
- taxes/fees;
- discounts;
- refunds;
- cancellations;
- professional adjustments;
- payout timing;
- category/area variation.

**Current development default:** configuration-driven commission/fee calculation with server-authoritative totals.

**Hard rule:** the frontend must never be the financial authority.

---

## OD-007 — Cancellation policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes for commercial launch

**Decision required:**

Define cancellation rights and financial consequences by lifecycle stage:

```text
REQUESTED
MATCHING
ASSIGNED
ACCEPTED
ON_THE_WAY
ARRIVED
IN_PROGRESS
```

Questions include:

- who may cancel;
- notice periods;
- cancellation fee;
- refund percentage or amount;
- professional compensation;
- evidence requirements;
- repeated cancellation handling.

**Current development default:** policy-driven cancellation service that preserves the event/history.

---

## OD-008 — Rescheduling policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes for commercial launch

**Decision required:**

Define:

- customer reschedule window;
- professional reschedule rights;
- maximum repeated reschedules;
- fees;
- price changes;
- professional replacement rules;
- whether customer reapproval is required.

**Current development default:** server revalidates availability and records the old/new schedule.

---

## OD-009 — Refund policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Very High  
**RELEASE BLOCKER:** Yes for payment-enabled commercial launch

**Decision required:**

Define refund treatment for:

- cancellation;
- professional no-show;
- customer no-show;
- failed service;
- disputed service;
- duplicate payment;
- overpayment;
- rejected/declined quote;
- partial completion;
- warranty/rework outcomes.

**Current development default:** payment system supports full and partial refund outcomes; business rules remain external to the payment provider callback.

---

# 6. Professional operations and trust

## OD-010 — Professional verification standard

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes for live marketplace work

**Decision required:**

Define the exact verification and eligibility requirements, including where applicable:

- identity;
- phone/email;
- address/service area;
- skill assessment;
- experience evidence;
- reference/background checks;
- documents;
- training/onboarding;
- re-verification cadence.

**Current development default:** professionals must pass an explicit verification workflow before accepting live work.

---

## OD-011 — Professional no-show policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** Medium/High  
**RELEASE BLOCKER:** Yes for mature marketplace operations

**Decision required:**

Define:

- customer notification;
- reassignment rules;
- customer refund/credit;
- professional penalty;
- evidence requirements;
- escalation path;
- repeat-offender handling.

**Current development default:** record no-show → notify → attempt reassignment → apply policy when decided.

---

## OD-012 — Customer no-show / inaccessible property

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** Medium/High  
**RELEASE BLOCKER:** Yes for mature marketplace operations

**Decision required:**

Define:

- professional compensation;
- customer fee;
- refund effect;
- evidence;
- grace period;
- rescheduling rights;
- repeated incidents.

**Current development default:** preserve the booking and record the incident.

---

## OD-013 — Completion evidence

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Service-dependent

**Decision required:**

For each service, define whether completion requires:

- before/after photos;
- notes;
- checklist;
- customer approval;
- OTP/PIN;
- signature;
- meter readings;
- material/part record;
- other proof.

**Current development default:** support configurable evidence requirements per service.

---

## OD-014 — Warranty / rework policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/operations owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Recommended before broad commercial launch

**Decision required:**

Define:

- whether warranty exists by service;
- warranty duration;
- what defects qualify;
- exclusions;
- labour/material treatment;
- repeat-visit process;
- refund vs rework;
- evidence required;
- customer complaint relationship.

**Current development default:** recurring issue is linked to the original job and routed into warranty/complaint workflow without promising universal coverage.

---

## OD-015 — Service-area model

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** Medium/High  
**RELEASE BLOCKER:** Yes for reliable matching

**Decision required:**

Choose the production coverage model:

- pincode;
- radius;
- ward/zone;
- manually maintained service areas;
- hybrid.

**Current development default:** city/zone-aware model with room for professional-level coverage constraints.

---

# 7. Customer communication and support

## OD-016 — Customer ↔ professional communication policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/operations owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes before direct communication is enabled

**Decision required:**

Define:

- whether in-app messaging is allowed;
- whether direct phone calling is allowed;
- whether numbers are masked;
- which job states permit communication;
- moderation/reporting rules;
- whether attachments are allowed;
- how abusive/off-platform solicitation is handled.

**Current development default:** operational status notifications only; no assumption that direct contact is enabled.

---

## OD-017 — Customer support and complaint SLA

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify operations/product owners  
**ENGINEERING IMPACT:** Medium/High  
**RELEASE BLOCKER:** Yes for operational launch

**Decision required:**

Define:

- complaint categories;
- first-response targets;
- resolution targets;
- escalation levels;
- refund/credit authority;
- evidence collection;
- customer communication expectations.

**Current development default:** use the complaint state machine already defined in `STATE_MACHINES.md`.

---

# 8. Reviews and reputation

## OD-018 — Review and rating policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Medium  
**RELEASE BLOCKER:** Yes before reviews are enabled publicly

**Decision required:**

Define:

- rating scale;
- review window;
- review editing;
- moderation;
- removal/deletion policy;
- professional response;
- review disputes;
- whether reviews are public to all users;
- how review abuse is handled.

**Current development default:** only eligible customers for completed jobs can submit a review.

---

# 9. Materials and service execution

## OD-019 — Material responsibility and markup

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes where materials affect price

**Decision required:**

Define:

- customer-supplied materials;
- Fixify-supplied materials;
- professional-supplied materials;
- approved brands;
- substitutes;
- material markup;
- proof of purchase;
- warranty responsibility;
- unused-material handling.

**Current development default:** support standard/preferred/no-preference selection and professional recommendation without hard-coded markup rules.

---

## OD-020 — Emergency service policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/operations owners  
**ENGINEERING IMPACT:** Medium  
**RELEASE BLOCKER:** No for MVP

**Decision required:**

Define:

- what qualifies as emergency;
- operating hours;
- service-area limits;
- response expectation;
- emergency pricing/fees;
- cancellation rules;
- safety exclusions.

**Current development default:** emergency service is not promised at launch.

---

# 10. AI and automation

## OD-021 — AI escalation and safety policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/safety owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes before customer-facing AI assessment is marketed as a decision aid

**Decision required:**

Define:

- categories the AI may triage;
- categories requiring mandatory human review;
- confidence thresholds/heuristics;
- dangerous/safety-sensitive scenarios;
- disallowed claims;
- escalation destination;
- customer-facing uncertainty language;
- retention/use of uploaded media.

**Current development default:** AI assists intake and likely service categorization; professional inspection remains authoritative for actual repair scope where required.

---

# 11. Data, privacy, and retention

## OD-022 — Data retention policy

**STATUS:** OPEN  
**BUSINESS OWNER:** Fixify product/operations owners  
**ENGINEERING IMPACT:** High  
**RELEASE BLOCKER:** Yes before production launch

**Decision required:**

Define retention periods and deletion rules for:

- account data;
- job data;
- invoices/payments;
- photos/videos;
- AI conversations;
- verification documents;
- audit logs;
- complaint evidence.

**Current development default:** retain transactional/audit records needed for operations and reporting; media retention remains configurable.

---

# 12. Growth and later-stage business models

## OD-023 — Premium membership

**STATUS:** OPEN / DEFERRED TO PHASE 2+  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** Low for MVP if schema remains extensible

**Decision required:**

Define:

- price;
- target segment;
- benefits;
- limits;
- renewal/cancellation;
- discounts;
- service priority;
- support priority;
- economics.

**Current development default:** do not make Premium an MVP dependency.

---

## OD-024 — B2B / property-management model

**STATUS:** OPEN / DEFERRED  
**BUSINESS OWNER:** Fixify product/business owners  
**ENGINEERING IMPACT:** High if activated

**Decision required:**

Define:

- target segment;
- account hierarchy;
- property/unit model;
- staff roles;
- approval workflow;
- contracts/SLA;
- recurring service;
- consolidated invoicing;
- pricing;
- reporting.

**Current development default:** preserve extensibility through property and authorization models but do not build full B2B workflows into MVP.

---

# 13. Implementation-specific decisions still needing explicit product ownership

These items can materially affect user experience even though they are not primarily pricing decisions.

## OD-025 — Professional preference vs automatic matching

**STATUS:** OPEN  
**CURRENT DEVELOPMENT DEFAULT:** deterministic matching first using verified status + skill + service area + availability, then distance/workload/reliability signals.

**Decision required:**

- may customers choose a professional directly?
- may customers rebook a previous professional without re-matching?
- may professionals reject requests without penalty?
- can a customer exclude a professional?
- when does Fixify override customer preference?

---

## OD-026 — Rebooking rules

**STATUS:** OPEN  
**CURRENT DEVELOPMENT DEFAULT:** allow rebooking from eligible completed jobs, subject to current availability and serviceability.

**Decision required:**

- guaranteed same-professional priority or simple preference?
- price reuse vs current price?
- whether old warranty terms carry forward;
- what happens if the professional is unavailable.

---

## OD-027 — Job communication channel and attachment rules

**STATUS:** OPEN  
**CURRENT DEVELOPMENT DEFAULT:** system notifications are first-class; communication attachments are disabled until policy is decided.

**Decision required:**

- chat allowed?
- voice calls?
- file/photo sharing?
- moderation?
- off-platform contact controls?

---

## OD-028 — Notification channel policy

**STATUS:** OPEN  
**CURRENT DEVELOPMENT DEFAULT:** in-app notifications are required for operational events. Push/email/SMS/other external channels are adapter-based and configurable.

**Decision required:**

- which events require push;
- which events require email;
- whether SMS/WhatsApp is used;
- fallback order;
- quiet hours;
- transactional vs promotional messaging;
- user opt-out behavior where legally/commercially applicable.

See `NOTIFICATION_SPEC.md` for the technical contract.

---

# 14. Decisions needed by phase

## Before first functional prototype

The following can remain open if the implementation stays configurable:

```text
OD-001  Launch city
OD-003  Currency
OD-004  Pricing architecture
OD-006  Commission
OD-007  Cancellation
OD-008  Rescheduling
OD-009  Refunds
OD-013  Completion evidence
OD-015  Service-area model
OD-016  Communication policy
OD-019  Materials/markup
OD-021  AI escalation
OD-028  Notification channels
```

## Before controlled pilot with real professionals/customers

These should be resolved before real transactions or live service operations:

```text
OD-001  Launch city/service zones
OD-002  Launch catalogue
OD-003  Currency
OD-004  Pricing model by service
OD-005  Payment timing
OD-006  Commission/platform fees
OD-007  Cancellation
OD-008  Rescheduling
OD-009  Refunds
OD-010  Professional verification
OD-011  Professional no-show
OD-012  Customer no-show
OD-013  Completion evidence
OD-014  Warranty/rework
OD-015  Service areas
OD-016  Communication policy
OD-017  Support/complaint SLA
OD-018  Review policy
OD-019  Materials/markup
OD-021  AI escalation/safety
OD-022  Data retention
OD-028  Notification channel policy
```

## Before broad public launch

All unresolved commercial and customer-promise decisions should be resolved or explicitly deferred with documented scope.

---

# 15. Decision log

When an item is decided, record the outcome here as a reference and copy the authoritative final rule into `PRODUCT_DECISIONS.md`.

| ID | Decision date | Owner | Final decision | Product Decisions updated? | Implementation status |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

Do not overwrite historical entries. Append rows for finalized decisions.

---

# 16. Coding-agent rule

A coding agent encountering an unresolved item must do one of three things:

```text
1. Implement the reversible development default.
2. Isolate the decision behind configuration/data.
3. Stop and surface the decision when proceeding would create a business promise or irreversible commercial rule.
```

The agent must **not** choose a price, fee, commission, refund, warranty, compensation rule, launch market, or customer communication entitlement simply because a value is convenient to code.

---

# END OF OPEN DECISIONS REGISTER
