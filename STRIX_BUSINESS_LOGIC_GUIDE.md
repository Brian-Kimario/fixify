# FIXIFY — BUSINESS LOGIC GUIDE FOR STRIX SECURITY TESTING

**Purpose:** This guide provides context about Fixify's business logic, user flows, and security-sensitive operations so Strix can perform more targeted and accurate penetration testing.

**Last Updated:** October 4, 2026  
**Deployment URL:** https://fixify-amber.vercel.app  
**Tech Stack:** Next.js 16.3, React 19, Supabase (PostgreSQL), Razorpay (Payments)

---

## 1. CORE BUSINESS MODEL

Fixify is an **on-demand property-maintenance marketplace** connecting:
- **Customers** (property owners seeking maintenance services)
- **Professionals** (service providers/contractors)
- **Admin/Ops Team** (platform operators & dispute resolution)

### Revenue Model & Payment Processing
- Commission-based on completed jobs
- **Payment Processing:** Dual-mode system
  - **Production/Live:** Razorpay UPI Intent (via `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`)
  - **Development/Staging:** MockProvider for testing (enable via `MOCK_PAYMENTS=true`)
  - MockProvider is automatically disabled in production (throws error if enabled)
  - For testing: `MOCK_PAYMENT_FAIL=true` simulates payment verification failures
- **Currency:** INR (₹) - Configured in environment as `NEXT_PUBLIC_CURRENCY_CODE`
- **Payment Flow:** Quote → Payment Intent → Razorpay UPI → Verification → Job Completion
- **Webhook Integration:** Razorpay webhook handler for payment confirmation (see `/api/webhooks`)

---

## 2. USER ROLES & CAPABILITIES

### 2.1 Customer Role
**Core Capabilities:**
- View property maintenance service catalog
- Create maintenance requests with property details
- Upload photos/documentation of issues
- Select professionals from available pool
- Review quotes and approve service
- Track job progress in real-time
- Provide feedback and ratings post-completion
- View maintenance history and archived jobs

**Sensitive Operations:**
- Payment authorization (Razorpay integration)
- Personal property information storage
- Service request visibility (should be private to assigned professional)
- Rating/review visibility to platform only

### 2.2 Professional Role
**Core Capabilities:**
- Maintain service profile (skills, certifications, rates)
- View eligible incoming job requests
- Accept/decline service requests
- Schedule visits with customers
- Perform property inspection
- Generate service quotes
- Upload completion evidence (photos/reports)
- Track earnings and job history
- Manage availability calendar

**Sensitive Operations:**
- Access to customer property addresses
- Commission/payment calculations
- Customer contact information access
- Profile verification status

### 2.3 Admin/Ops Role
**Core Capabilities:**
- Monitor all active jobs and users
- Verify professional credentials
- Resolve disputes between customers & professionals
- Reassign jobs if needed
- View audit logs
- Access system analytics
- Manage platform flags/policies
- Escalate safety concerns

**Sensitive Operations:**
- Full data access across all users
- Financial transaction review
- User account suspension/deletion
- Dispute resolution and refund processing

---

## 3. CRITICAL BUSINESS FLOWS & SECURITY BOUNDARIES

### 3.1 Job Lifecycle (Customer → Professional → Completion)

```
1. CUSTOMER INITIATES REQUEST
   - Create job with property address, issue description, photos
   - Select maintenance category
   - System assigns available professionals
   - Customer receives confirmation

2. PROFESSIONAL RECEIVES NOTIFICATION
   - Professional sees eligible requests (location/skills based)
   - Can view job summary WITHOUT customer contact info initially
   - Accepts or declines job
   - Upon acceptance: receives customer contact & address

3. SCHEDULING & INSPECTION
   - Professional schedules visit time
   - Customer receives appointment confirmation
   - Professional arrives and inspects issue
   - Documents findings (photos, measurements, notes)

4. QUOTE GENERATION
   - Professional generates service quote
   - Quote includes labor, materials, timeline
   - Customer reviews and approves/requests changes
   - System flags if professional increases price >20%

5. WORK COMPLETION
   - Professional completes service
   - Uploads completion evidence (before/after photos, reports)
   - Marks job complete
   - Payment authorized from customer's account

6. POST-COMPLETION
   - Customer reviews completion & professional
   - Rating system (1-5 stars) + feedback
   - Professional can respond to feedback
   - Dispute window: 7 days for customer claims
```

### 3.2 Payment Flow (Razorpay UPI Intent)

```
CUSTOMER PAYMENT AUTHORIZATION
├─ Customer approves quote → POST /api/payments/create
├─ Payment record created (status: pending)
├─ Razorpay order created via RazorpayProvider or MockProvider
├─ UPI Intent flow initiated (VPA required)
├─ Customer completes payment via UPI app
├─ Razorpay webhook: POST /api/webhooks/razorpay
├─ Payment status updated (pending → paid/failed)
├─ Job eligible for professional completion
└─ Audit log records transaction

SECURITY REQUIREMENTS:
✓ Amount ALWAYS sourced from database quote.total (never from request body)
✓ Quote ownership verified (customer_id check)
✓ Payment record persisted BEFORE returning to frontend (idempotent)
✓ RLS prevents frontend from updating payment status
✓ Razorpay webhook validates signature via RAZORPAY_WEBHOOK_SECRET
✓ Duplicate orders prevented by razorpay_order_id UNIQUE constraint
✓ No sensitive card data stored (UPI-only flow)
✓ Payment status tracked: pending → processing → paid/failed
✓ Idempotency: Existing payment returned on page refresh
✓ Refund only available during 7-day dispute window
✓ Commission calculated at completion, not at authorization
```

### 3.3 Professional Verification Flow

```
VERIFICATION PROCESS
├─ Professional provides: License #, Insurance policy, ID photo
├─ Admin reviews submitted documents
├─ Verification status: pending → approved/rejected
├─ Only verified professionals visible to customers
├─ Unverified professionals can receive requests but flagged
└─ Rejection reason communicated to professional
```

---

## 4. DATABASE SECURITY BOUNDARIES (RLS - Row Level Security)

### 4.1 Customers
- Can view own jobs and assigned professionals
- CANNOT view other customers' jobs
- CANNOT access professional profiles until assigned
- Can view own account settings & payment history

### 4.2 Professionals
- Can view jobs assigned to them
- Can see customer info ONLY for jobs they accepted
- CANNOT view other professionals' jobs or earnings
- Can edit own profile, but verification requires re-approval on changes

### 4.3 Admin
- Can view all jobs, users, transactions
- Can filter by status, date range, location
- Can access audit logs
- Can impersonate users for troubleshooting (logged)

---

## 5. ATTACK SURFACE & SECURITY TESTING PRIORITIES

### 5.1 High-Priority Vulnerabilities (OWASP Top 10)

**Broken Access Control (CRITICAL)**
- Customer viewing other customers' jobs (IDOR)
- Professional accessing jobs not assigned to them
- Non-verified professionals performing services
- Admin capability bypass (privilege escalation)
- Date/time manipulation for deadline bypassing

**Injection Attacks (HIGH)**
- SQL injection in job search/filter endpoints
- NoSQL injection in document queries
- Command injection if file processing used
- SSTI in quote/report generation

**Authentication & Session (HIGH)**
- Session fixation attacks
- JWT token manipulation
- Expired token re-use
- OAuth callback hijacking (if using external auth)
- Rate limiting bypass on login attempts

**Business Logic Flaws (HIGH)**
- Quote price manipulation (customer increasing without approval)
- Commission calculation bypass
- Job reassignment without audit trail
- Completion evidence tampering
- Dispute window exploitation (claim after 7 days)
- Multiple payment authorizations on single job

**API Security (MEDIUM)**
- Missing rate limiting on API endpoints
- Batch operations without validation
- API response leaking sensitive data
- Unvalidated redirects in confirmation links

### 5.2 Medium-Priority Areas

**Data Exposure**
- Customer phone/email visible in response when shouldn't be
- Professional financial data leaked in list endpoints
- Property addresses exposed in public endpoints
- Payment transaction details accessible to wrong user

**File Upload Security**
- Malicious file upload in completion evidence
- Path traversal in file operations
- Zip bomb in bulk uploads
- XSS through SVG/HTML uploads

**Frontend Vulnerabilities**
- XSS in user-generated content (job descriptions, reviews)
- CSRF on state-changing operations (accept job, approve quote)
- DOM-based vulnerabilities in React components

---

## 6. KEY ENDPOINTS FOR SECURITY TESTING

### 6.1 Authentication Endpoints
- `POST /api/auth/signup` - Customer/Professional registration
- `POST /api/auth/login` - Login (OAuth or email/password)
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/reset-password` - Password reset flow

### 6.2 Job Management Endpoints
- `GET /api/jobs` - List eligible jobs (filter by role)
- `GET /api/jobs/:id` - Fetch specific job details
- `POST /api/jobs` - Create new job request
- `PUT /api/jobs/:id` - Update job status
- `POST /api/jobs/:id/accept` - Professional accepts job
- `POST /api/jobs/:id/decline` - Professional declines job
- `POST /api/jobs/:id/complete` - Mark job complete

### 6.3 Quote & Approval Endpoints
- `POST /api/quotes` - Professional generates quote
- `GET /api/quotes/:id` - Retrieve quote details
- `PUT /api/quotes/:id/approve` - Customer approves quote
- `POST /api/quotes/:id/counter-offer` - Customer requests changes

### 6.4 Payment Endpoints
- `POST /api/payments/create` - Create payment intent from approved quote
- `POST /api/webhooks/razorpay` - Razorpay webhook handler for payment confirmation
- `GET /api/payments/status/:id` - Check payment status (customer can only see own payments via RLS)

### 6.5 User Profile Endpoints
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/professionals/:id` - Public professional profile
- `POST /api/professionals/verify` - Submit verification docs
- `GET /api/users/me/history` - Job history

### 6.6 Admin Endpoints
- `GET /api/admin/jobs` - All jobs (admin only)
- `GET /api/admin/users` - All users (admin only)
- `POST /api/admin/users/:id/verify` - Approve professional
- `POST /api/admin/disputes/:id/resolve` - Resolve dispute
- `GET /api/admin/audit-logs` - Audit trail

---

## 7. CRITICAL BUSINESS RULES TO TEST

### 7.1 Authorization Rules
✓ Customers can ONLY see their own jobs  
✓ Professionals can ONLY see jobs assigned to them  
✓ Professionals can access customer info ONLY after accepting job  
✓ Only admins can view all jobs/users  
✓ Only admins can approve professional verification  
✓ Job reassignment only via admin + audit log  

### 7.2 State Machine Rules
✓ Jobs cannot go from completed → accepted  
✓ Quotes cannot be approved after job completion  
✓ Payment cannot be confirmed twice for same job  
✓ Disputes must be raised within 7 days of completion  
✓ Professional cannot accept same job twice  
✓ Job must have accepted quote before completion  

### 7.3 Financial Rules
✓ Amount in payment record ALWAYS comes from approved quote.total (immutable)
✓ Payment created with status=pending before returning to frontend
✓ Razorpay order_id stored in razorpay_order_id (UNIQUE constraint prevents duplicates)
✓ Payment confirmation via webhook validation (RAZORPAY_WEBHOOK_SECRET)
✓ Payment status tracked: pending → paid/failed (never modified by customer)
✓ Idempotency: Existing payment returned if quote_id already has pending/processing payment
✓ Refund only available during 7-day dispute window
✓ Commission calculated at job completion, not at authorization
✓ UPI-only flow (no card data stored)
✓ Currency fixed at INR (NEXT_PUBLIC_CURRENCY_CODE)  

### 7.4 Data Privacy Rules
✓ Customer address NEVER visible to non-assigned professionals  
✓ Phone numbers masked in API responses (visible only in UI for assigned party)  
✓ Payment details (card brand, last 4 digits) visible only to customer  
✓ Professional earnings visible only to that professional + admin  
✓ Email addresses never returned in list endpoints  

---

## 8. TESTING SCENARIOS (EXAMPLE ATTACK PATHS)

### Scenario 1: IDOR - View Other Customer's Job
**Attack:** Customer A modifies URL to view Customer B's job  
**Endpoint:** `GET /api/jobs/999` (where 999 is another customer's job)  
**Expected:** 403 Forbidden  
**Vulnerable If:** Returns job details with customer B's address/contact

### Scenario 2: Privilege Escalation - Professional Approves Verification
**Attack:** Professional tries to approve their own verification  
**Endpoint:** `POST /api/admin/professionals/:id/verify`  
**Expected:** 403 Forbidden (admin only)  
**Vulnerable If:** Professional can call endpoint successfully

### Scenario 3: Business Logic - Quote Price Manipulation
**Attack:** Customer approves $500 quote, then changes amount to $100 before payment  
**Flow:** Approve quote → modify quote → authorize payment  
**Expected:** Payment should match approved amount, not modified  
**Vulnerable If:** Payment processes for $100 instead of $500

### Scenario 4: State Machine Bypass - Complete Job Without Quote
**Attack:** Professional tries to complete job without approved quote  
**Endpoint:** `POST /api/jobs/:id/complete`  
**Expected:** 422 Unprocessable Entity (quote required)  
**Vulnerable If:** Job marked complete without quote approval

### Scenario 5: Date Bypass - Dispute After 7 Days
**Attack:** Customer tries to claim dispute 8 days after completion  
**Endpoint:** `POST /api/disputes`  
**Expected:** 403 Forbidden (outside dispute window)  
**Vulnerable If:** Dispute accepted after 7-day window

### Scenario 6: Payment Webhook Replay - Double Payment (CRITICAL)
**Attack:** Attacker replays Razorpay webhook to process payment twice  
**Endpoint:** `POST /api/webhooks/razorpay`  
**Expected:** Webhook validates signature + checks razorpay_payment_id UNIQUE constraint  
**Vulnerable If:** Payment confirmed twice OR signature not validated  

### Scenario 7: Quote-Payment Mismatch - Amount Manipulation
**Attack:** Customer approves quote for $500, then somehow payment processes for $100  
**Flow:** GET /api/payments/create with modified body?  
**Expected:** Amount ALWAYS loaded from database quote.total, never from request body  
**Vulnerable If:** Amount parameter from request body used instead of database query

---

## 9. SENSITIVE DATA FIELDS

**Customer:**
- Full name, email, phone, residential address, payment methods

**Professional:**
- Full name, email, phone, service location, verification docs, bank account

**Job:**
- Full property address, photos showing interior/valuables, issue description

**Payment:**
- Amount, currency, payment method (partially masked), transaction ID

**Dispute:**
- Claims and counter-claims containing sensitive information

---

## 10. COMPLIANCE & REGULATORY CONSIDERATIONS

- **PCI-DSS:** Payment handling via Razorpay (no direct card processing)
- **Data Privacy:** Customer address privacy critical (could enable physical threats)
- **Professional Verification:** Liability if unverified person completes work
- **Payment Disputes:** Clear audit trail required for chargeback defense
- **Service Level:** Job completion evidence crucial for dispute resolution

---

## 11. STRIX TESTING FOCUS AREAS (Based on Actual Implementation)

### Payment Security (CRITICAL)
- ✅ Amount validation: Always from DB quote.total, never from request
- ✅ Quote ownership: Customer must own the job the quote belongs to
- ✅ Razorpay webhook signature validation
- ✅ Duplicate order prevention (UNIQUE constraint on razorpay_order_id)
- ✅ Idempotency on payment creation endpoint
- ✅ Status progression: pending → paid/failed (RLS prevents customer updates)

### Access Control (CRITICAL)
- IDOR in /api/payments (can customer access other customer's payments?)
- IDOR in /api/jobs (can customer see other customer's jobs?)
- Can professional access jobs not assigned to them?
- Can non-admin call admin endpoints?

### Webhook Security (HIGH)
- Razorpay webhook signature validation
- Webhook replay attack prevention
- Status update validation in webhook handler
- Concurrent webhook processing for same payment

### Business Logic (HIGH)
- Job state machine: can jobs transition in invalid ways?
- Quote approval flow: can job be completed without approved quote?
- Professional verification: can unverified professional accept job?
- Dispute window: claims after 7 days should be rejected
- Concurrent operations: what if customer approves quote + pays simultaneously?

### How to Use This Document
When running Strix penetration testing, provide this document as context:

**In Strix CLI:**
```bash
strix --target https://fixify-amber.vercel.app \
      --instruction "This is a property-maintenance marketplace. Business rules include: 
      1) Customers can only view their own jobs
      2) Professionals can only access customer info after job acceptance
      3) Payments via Razorpay must match approved quotes
      4) Disputes only valid within 7 days of job completion
      5) Professional verification required before service delivery
      Test for IDOR, privilege escalation, business logic flaws, and payment manipulation."
```

**In Strix Cloud (app.strix.ai):**
1. Create/start scan
2. Add target: `https://fixify-amber.vercel.app`
3. Click "Advanced" or "Instruction"
4. Paste business logic rules from sections 7-8 above

### What Strix Should Focus On
🔴 **CRITICAL:** Access Control - IDOR vulnerabilities  
🔴 **CRITICAL:** Business Logic - quote/payment manipulation  
🟡 **HIGH:** Authentication - session/token bypass  
🟡 **HIGH:** API Injection - SQL/NoSQL injection in filters  
🟢 **MEDIUM:** Data Exposure - field-level leakage  
🟢 **MEDIUM:** File Upload - completion evidence validation  

---

## 12. KNOWN LIMITATIONS & NOTES FOR TESTERS

- **Rate Limiting:** Current implementation status unknown - test thoroughly
- **File Upload Size:** Limits unknown - test with large files
- **Concurrent Jobs:** Test behavior when professional accepts job mid-quote-revision
- **Currency Handling:** Multiple currency flows exist - test conversion logic
- **Admin Impersonation:** Verify audit logging works when admin tests as customer
- **Session Expiry:** Test behavior of expired token during payment flow

---

## Contact for Questions
For clarifications about business logic during testing:
- **Product Owner:** Brian Kimario
- **Deployment:** https://fixify-amber.vercel.app
- **Report Issues:** Create GitHub issue with `[SECURITY]` prefix

---

**Last Reviewed:** October 4, 2026  
**Next Review:** After each major feature release
