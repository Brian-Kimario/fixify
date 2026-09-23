# FIXIFY — RBAC SPECIFICATION

## 1. Purpose

This document defines Fixify role-based access control and resource-level authorization. A UI role check is never a security boundary. Authorization must be enforced by Supabase Auth, Row Level Security, server/database checks, and business rules.

## 2. Authentication Authority

Authentication is handled by **Supabase Auth** using:
- Email/password
- Google OAuth

The authenticated identity is `auth.users.id`. Application identity is represented by `profiles.id`, which references the authenticated user.

## 3. Roles

| Role | Purpose |
|---|---|
| `CUSTOMER` | Requests and manages property services |
| `PROFESSIONAL` | Performs approved service work |
| `SUPPORT` | Handles assigned customer/operational cases |
| `ADMIN` | Manages the marketplace and privileged operations |

MVP uses one primary application role per user. Role assignment/change is privileged and auditable.

## 4. Permission Model

Authorization is evaluated using:

```text
ROLE
+
RESOURCE OWNERSHIP / ASSIGNMENT
+
CURRENT STATE
+
BUSINESS RULES
```

A role never grants unrestricted access to every resource of that type.

## 5. Permission Vocabulary

Use consistent action names:

```text
CREATE READ LIST UPDATE DELETE
APPROVE REJECT ASSIGN ACCEPT DECLINE
TRANSITION UPLOAD DOWNLOAD REFUND
VERIFY SUSPEND RESOLVE
```

## 6. Customer Permissions

### Profile
- Read/update own profile.
- Cannot change own role.
- Cannot update another user's profile.

### Addresses
- Create/read/update/archive own addresses.
- Cannot access another customer's addresses.

### Properties
- Create/read/update/archive own properties.
- Cannot access another customer's properties.

### Service Catalogue
- Read active categories, services, options and customer-selectable materials.
- Cannot create/update/delete catalogue records or prices.

### Service Requests
- Create own requests.
- Read own requests.
- Update own draft requests.
- Cancel own eligible requests.
- Upload media to own requests.
- Cannot force professional assignment or authoritative pricing.

### AI
- Create/read own AI conversations.
- Send messages to own conversations.
- Read own assessments.
- Cannot modify system assessment fields such as confidence or escalation flags.

### Booking
- Create booking.
- Read own bookings.
- Request cancellation/rescheduling where policy permits.
- Cannot set final price, assignment, payment status, or protected job state.

### Job
Customer may:
- Read own job.
- Read own job timeline.
- Read customer-visible professional information.
- Read permitted evidence.
- Approve/decline an eligible quote.
- Create a complaint for an eligible job.
- Request support.

Customer does **not** directly set `jobs.current_state`.

### Payments / Invoices
- Read own payment and invoice records.
- Initiate authorized checkout.
- Cannot mark a payment paid, change amount, or issue refunds.

### Reviews
- Create review only for eligible completed jobs.
- Read own reviews.

### Complaints
- Create complaint against an eligible job.
- Read own complaint.
- Upload evidence.
- Read complaint status.

### Property Service History
- Read own property history.
- May update explicitly user-editable property metadata only.
- Cannot rewrite completed service records.

## 7. Professional Permissions

A professional account is not automatically eligible for live work.

### Profile / onboarding
Professional may:
- Create onboarding information.
- Read/update own user-editable profile fields.
- Submit verification information.
- Read own verification status.

Professional may not:
- Set own verification status to `VERIFIED`.
- Set own rating or completed-job metrics.

### Skills / service areas / availability
- Manage own eligible skills where policy permits.
- Manage own availability.
- Manage own service areas where policy permits.

### Jobs
Professional may:
- Read eligible job offers.
- Accept/reject an eligible assigned job.
- Read assigned job details.
- Read only customer/property information required for the job.
- Upload authorized job evidence.
- Submit inspection findings.
- Create/update eligible draft quotes.
- Mark on-the-way/arrived.
- Start work where state permits.
- Complete eligible work.

Professional may not:
- Access unrelated customer jobs.
- Access unrelated customer properties.
- Approve a customer quote.
- Set payment status.
- Change authoritative prices outside controlled quote workflow.

### Earnings
- Read own earnings/settlement records.
- Cannot edit financial records.

## 8. Professional Verification

### Professional
- Upload verification documents.
- Read own verification status.

### Support / authorized verifier
- Read assigned verification records.
- Review submitted documents where explicitly permitted.
- Request additional information.

### Admin
- Read verification records.
- Verify.
- Reject.
- Suspend.
- Reactivate.

All verification decisions are auditable.

## 9. Professional Job Visibility

For an authorized job, expose only the minimum needed:

```text
customer display name
service/problem details
service address
relevant access instructions
job media
booking time
relevant service/material information
necessary history/context
```

Do not expose unrelated customer payments, properties, bookings, private complaints, or unrelated personal data.

## 10. Support Permissions

Support may, within assigned scope:
- Read assigned complaints/cases.
- Read relevant job information.
- Read relevant payment information.
- Communicate with customers/professionals.
- Update complaint workflow.
- Add internal notes.
- Escalate cases.

Support does not automatically receive role management, service catalogue administration, financial configuration, or unrestricted verification privileges.

## 11. Admin Permissions

Admin may, according to explicit permission:

```text
manage users
manage professionals
verify/reject/suspend professionals
manage services/categories/material catalogue
manage pricing configuration
manage jobs and assignments
manage complaints
view/manage operational payment records
view analytics
manage notifications
view audit logs
```

Admin UI access does not imply unrestricted database/superuser access.

## 12. Resource Ownership Matrix

| Resource | Customer | Professional | Support | Admin |
|---|---|---|---|---|
| Own profile | CRUD | CRUD | Own only | Manage |
| Other profile | No | Limited | Authorized | Yes |
| Own property | CRUD | No | Authorized | Yes |
| Other property | No | Job-limited | Authorized | Yes |
| Service catalogue | Read | Read relevant | Read | CRUD |
| Own request | CRUD | Relevant read | Authorized | Yes |
| Assigned job | Customer read/actions | Operational control | Authorized | Yes |
| Unrelated job | No | No | No unless authorized | Yes |
| Own availability | No | CRUD | No | Manage if needed |
| Verification docs | Own | Own | Assigned review | Authorized full |
| Quotes | Read/approve | Create/manage | Case-level read | Manage |
| Payments | Own read/checkout | Earnings read | Case-level read | Operational |
| Invoices | Own read | Relevant read | Authorized | Yes |
| Reviews | Create/read own | Read own received | Authorized | Moderate/manage |
| Complaints | Create/read own | Case-related | Assigned | Full |
| Property history | Own read | Job-relevant | Authorized | Full |
| Audit logs | No | No | Limited | Yes |

## 13. Role + State Checks

Examples:

```text
PROFESSIONAL
```

is not enough to complete any job.

The system must also validate:

```text
verified
+ assigned
+ eligible service
+ current state permits action
+ not suspended
```

Likewise, a customer can approve only a quote belonging to that customer's job and only when the quote is approvable.

## 14. RLS Expectations

Protected tables must use Row Level Security.

At minimum enforce:

```text
Customer A cannot read Customer B property.
Customer A cannot read Customer B booking.
Customer A cannot read Customer B invoice.
Professional A cannot read unrelated jobs.
Professional A cannot read another professional's private records.
Customer cannot modify professional verification.
Customer cannot change protected job state.
```

Use ownership/assignment relationships, not route names or UI visibility.

## 15. Sensitive Operations

The following must be server/database controlled:

```text
role assignment
professional verification/suspension
job state transition
quote approval
price calculation
payment confirmation
refund
invoice finalization
earnings calculation
complaint resolution
audit records
```

## 16. Audit Requirements

Create audit records for important actions such as:

```text
role_changed
professional_verified
professional_rejected
professional_suspended
job_assigned
job_state_changed
quote_created
quote_approved
quote_declined
payment_received
refund_created
invoice_voided
complaint_resolved
administrative_reassignment
```

Users must not create arbitrary audit entries.

## 17. Service Role Rule

The Supabase service-role key bypasses ordinary RLS.

```text
Browser: NEVER
Client React code: NEVER
Server / Edge Function: ONLY when required
```

## 18. Permission Failure Behavior

```text
Unauthenticated → 401
Authenticated but forbidden → 403
```

Do not reveal protected data through error messages.

## 19. RBAC Test Minimum

Test at least:

```text
Customer A → Customer B property         FAIL
Customer A → Customer B quote approval   FAIL
Professional A → unrelated job           FAIL
Professional → self-verify               FAIL
Unverified professional → accept job     FAIL
Customer → set job state directly        FAIL
Customer → set payment paid              FAIL
Support → admin-only configuration       FAIL
Admin action → audit record              PASS
```

## 20. Expansion

Future roles may include:

```text
PROPERTY_MANAGER
FIELD_SUPERVISOR
FINANCE
VERIFICATION_AGENT
SUPER_ADMIN
```

Do not add them until required.

# END OF RBAC SPECIFICATION
