# Fixify Product Context

**Inclusion:** auto  
**Name:** product-context  
**Description:** Product vision, core use cases, and non-negotiable rules for Fixify marketplace development.

---

## Vision

Fixify is a property-maintenance marketplace that helps customers solve home/property problems by connecting them with verified professionals. The core experience is:

```
Customer Problem
   ↓
Problem Intake (text/photo/video)
   ↓
AI-Assisted Classification
   ↓
Service Booking
   ↓
Professional Assignment
   ↓
On-Site Inspection
   ↓
Quote for Additional Work
   ↓
Work Execution
   ↓
Payment & Invoice
   ↓
Property Maintenance History
```

The product is **not** a technician directory. It is a **managed service workflow** with job tracking, quote approval, and professional verification.

---

## Core Use Cases

### Customer

1. **Request service**: Describe a property problem via text, photo, or video.
2. **Browse & book**: Select a service category and preferred appointment.
3. **Track job**: See real-time status (professional assigned, on the way, arrived, inspection, approval, complete).
4. **Approve additional work**: Review and approve quote before professional proceeds with extra repairs.
5. **Pay & invoice**: View invoice and pay for completed service.
6. **Property history**: View all past services performed on a property.

### Professional

1. **Register & verify**: Create account, submit verification documents, skills, availability, service areas.
2. **Receive jobs**: View incoming requests matching skills, location, and availability.
3. **Accept & execute**: Accept job, coordinate timing, perform inspection, create quote, execute work.
4. **Submit evidence**: Upload photos, notes, completion evidence.
5. **Track earnings**: View payments and completed job history.

### Admin

1. **Manage professionals**: Verify, reject, suspend professionals.
2. **Manage service catalogue**: Define categories, services, pricing, options, materials.
3. **Monitor jobs**: View live jobs, handle escalations, manage disputes.
4. **Manage payments**: Process refunds, view financial records.
5. **Business intelligence**: View analytics, operational metrics.

---

## Non-Negotiable Product Rules

1. **Customers describe problems in normal language.**
   - Intake is text/photo/video/voice, not a structured form.
   - AI assists with classification; human professionals confirm.

2. **AI is not the technical authority.**
   - AI may suggest likely service category.
   - AI must not present uncertain assessments as guaranteed diagnoses.
   - Professional inspection is the basis for final decisions.

3. **All additional work requires customer approval.**
   - Professional cannot charge for extra work without approval.
   - Quote approval is explicit, transactional, and auditable.
   - Customer can decline; work stops.

4. **Service activity is part of property history.**
   - Every completed service is recorded on the property.
   - Customer can view maintenance timeline.
   - Supports future property market value/care narratives.

5. **Professionals are verified before live work.**
   - Unverified professionals cannot accept jobs.
   - Verification includes identity, skill, and background checks.
   - Suspended professionals are not eligible.

6. **Pricing is server-authoritative.**
   - Frontend may display prices; database is the source of truth.
   - Client never calculates final amounts.
   - All financial calculations happen server-side.

7. **Job state transitions are controlled.**
   - State machine defines allowed transitions.
   - Only authorized actors can transition states.
   - Application cannot skip states (e.g., REQUESTED → COMPLETED).

8. **Rebooking preferred professionals is supported.**
   - Customer can request the same professional if available and verified.
   - System does not guarantee same professional; handles unavailability gracefully.

---

## Product Phases

### MVP (Phase 1)

- Customer registration and profile.
- Property management.
- Service request intake (text/photo).
- Service catalogue (manual browsing).
- Booking and scheduling.
- Professional registration and verification.
- Job state machine and tracking.
- Quotes and approval.
- Payments and invoices.
- Reviews and complaints.
- Audit logging.

### Phase 2

- AI intake (text/voice classification).
- Advanced matching (professional ranking).
- Premium subscription (priority support, discounts).
- Recurring services (maintenance plans).
- Professional mobile app.
- Voice/video communication.

### Phase 3+

- B2B (property managers, commercial services).
- IoT integration (sensor data).
- Predictive maintenance.
- B2B subscription and contracts.

---

## Out of Scope (Launch)

- Emergency 24/7 guarantee.
- Material supply marketplace.
- Supply chain / inventory management.
- Parallel Prisma database.
- Clerk authentication (use Supabase only).
- Premium features before MVP validation.
- Complex warranty claims workflow.

---

## Decision Point: Product decisions marked OPEN

This product relies on decisions recorded in `docs/PRODUCT_DECISIONS.md`.

Do not hard-code business rules for:
- Launch city or service areas.
- Launch service categories or pricing.
- Commission percentage or cancellation fees.
- Warranty duration or refund eligibility.
- Professional no-show penalties.
- Customer no-show policies.

These are business decisions, not implementation details. Mark them OPEN in the decision document.

---

## Implementation Discipline

- **UI validates**: UI validation is for UX.
- **Server enforces**: Server-side validation is security.
- **Database constrains**: Database constraints are the final authority.

Example:

```
Customer role check in UI    → UX feedback
Customer role check in server  → Authorization
RLS policy blocks query       → Security guarantee
```

Relying only on UI checks is not security.

