# Fixify System Check & Integration Roadmap

**Date**: October 1, 2026  
**Status**: Pre-MVP Integration Phase  
**Objective**: Complete backend-to-frontend integration without demo data dependency for all core workflows.

---

## Executive Summary

Fixify has a **solid database foundation** (4 migrations, complete schema) with **70% of server actions** implemented. However, the **UI layer is only ~40% connected** to real data. Critical gaps exist in job workflows, quote management, payment integration, and professional verification.

### Current State
- ✅ Database: Fully designed with RLS policies
- ✅ Auth & Profiles: ~70% integrated
- ✅ Properties & Catalogue: 100% connected
- ⚠️ Bookings & Jobs: ~30% connected (UI uses mock data)
- ❌ Payments: 5% (database only, no provider integration)
- ❌ Admin: 5% (database only, no UI)
- ❌ Notifications: 0% (not implemented)

### Time Estimate to Full Integration
**60-80 hours** to complete all 10 integration phases (excluding payment provider negotiations).

---

## Part 1: System Architecture Verification

### 1.1 Frontend Stack ✅
```
Framework:     Next.js 16.3.5 (App Router)
React:         19.2.8
UI Library:    Tailwind CSS 4 + Custom Components
Type Safety:   TypeScript 5
Authentication: @supabase/ssr (cookie-based sessions)
Database SDK:  @supabase/supabase-js 2.116.0
```
**Status**: Correctly configured. No changes needed.

### 1.2 Backend Stack ✅
```
Database:      Supabase PostgreSQL
Auth Provider: Supabase Auth (JWT)
Session:       Cookie-based via @supabase/ssr
Server Logic:  Next.js Server Actions + Route Handlers
API Calls:     Next.js RPC to Supabase functions
```
**Status**: Correctly configured. No changes needed.

### 1.3 Environment Configuration ✅
```
✅ NEXT_PUBLIC_SUPABASE_URL (browser)
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY (browser)
✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (browser)
✅ SUPABASE_SERVICE_ROLE_KEY (server-only)
✅ NEXT_PUBLIC_APP_URL (localhost:3000)
```
**Status**: All required keys present. RLS policies active in Supabase project.

---

## Part 2: Database Schema Verification

### 2.1 Applied Migrations ✅

| Migration | Tables | Status | Verification |
|-----------|--------|--------|--------------|
| `20260923_001_enums.sql` | Enums: user_role, job_state, booking_status, etc. | ✅ Applied | RLS disabled for enums (correct) |
| `20260923_002_profiles.sql` | profiles, audit_logs | ✅ Applied | RLS enabled, trigger creates profile on signup |
| `20260923_003_properties.sql` | addresses, properties, property_assets | ✅ Applied | Customer-owned with RLS policies |
| `20260923_004_services.sql` | service_categories, services, options, values | ✅ Applied | Public read access via RLS |
| `20260923_005_professionals.sql` | professional_profiles, skills, verifications, documents, availability, service_areas | ✅ Applied | Professional-owned with RLS |
| `20260923_006_bookings_jobs.sql` | bookings, jobs, job_events, inspections, quotes, quote_items, payments | ✅ Applied | Transactional integrity, state machine enforced |

**Critical Function**: `transition_job_state()` 
```sql
Status: ✅ Deployed in database
Called by: src/app/professional/actions.ts (currently broken field names)
RLS Impact: Can only transition jobs assigned to current user
```

### 2.2 RLS Policies Verification

| Table | Owner | Policy Type | Status |
|-------|-------|------------|--------|
| profiles | auth.users | Customer can read own + admin reads all | ✅ Working |
| addresses | customer | Customer can read/write own, professional reads assigned | ✅ Working |
| properties | customer | Customer reads own only | ✅ Working |
| service_* | public | All authenticated read (USING true) | ✅ Working |
| professional_profiles | professional | Professional reads own, public sees verified only | ✅ Working |
| professional_verifications | professional + admin | Professional reads own, admin reads all | ✅ Working |
| jobs | customer + professional | Both see own, RLS enforces | ✅ Working |
| payments | customer + admin | Customer sees own, admin sees all | ✅ Working |
| audit_logs | admin | Admin only, immutable | ✅ Working |

**Verification Done**: RLS policies tested via Supabase dashboard. No data leaks detected.

### 2.3 Critical Indexes

| Table | Index | Reason | Status |
|-------|-------|--------|--------|
| jobs | (professional_id, current_state) | Professional jobs lookup | ✅ Present |
| jobs | (customer_id, created_at) | Customer job history | ✅ Present |
| bookings | (customer_id, status) | Active bookings filter | ✅ Present |
| properties | (customer_id) | Property list queries | ✅ Present |
| professional_profiles | (verification_status) | Only show verified pros | ✅ Present |
| audit_logs | (created_at) | Audit trail queries | ✅ Present |

**Status**: ✅ All indexes present, queries should be fast.

---

## Part 3: Server-Side Integration Status

### 3.1 Authentication & Session Management

**Files**: `src/lib/auth/`, `src/lib/supabase/`

| Function | Status | Details |
|----------|--------|---------|
| `getCurrentUser()` | ✅ Complete | Fetches from auth.users, handles server-side |
| `getCurrentProfile()` | ✅ Complete | Fetches from profiles table with RLS |
| `requireAuth()` | ✅ Complete | Middleware for protected pages |
| Middleware setup | ✅ Complete | Session refresh via @supabase/ssr |
| OAuth callback | ⚠️ Partial | Handler exists but role selection missing |

**Issues Found**: None blocking MVP.

### 3.2 Properties Service (`src/lib/services/properties.ts`)

| Function | Status | Returns | Used By |
|----------|--------|---------|---------|
| `getCustomerProperties()` | ✅ | List with address details | Customer dashboard |
| `getProperty(id)` | ✅ | Single property + address | Property detail page |
| `createProperty()` | ✅ | New property object | Add property form |
| `updateProperty()` | ✅ | Updated property | Edit property form |
| `deleteProperty()` | ✅ | Void | Delete action |
| `getPropertyStats()` | ✅ | { total, completed_jobs } | Dashboard widget |

**Issues Found**: None. This service is production-ready.

### 3.3 Booking Service (`src/lib/services/bookings.ts`)

| Function | Status | Returns | Used By |
|----------|--------|---------|---------|
| `createBooking()` | ✅ | Booking + reference | Not yet integrated |
| `getCustomerBookings()` | ✅ | Array with full relations | Customer dashboard |
| `getBooking(id)` | ✅ | Single booking detail | Not yet integrated |
| `getActiveBookings()` | ✅ | Filtered list | Dashboard active section |
| `getCompletedBookings()` | ✅ | Filtered list | Dashboard history section |
| `cancelBooking()` | ✅ | Updated booking | Not yet integrated |
| `getBookingStats()` | ✅ | Counts by status | Dashboard widget |

**Issues Found**: 
- ❌ No UI wizard to call `createBooking()`
- ❌ No calendar/availability picker
- ❌ No service-to-booking conversion flow

**Impact**: Customers cannot book services through UI.

### 3.4 Catalogue Service (`src/lib/services/catalogue.ts`)

| Function | Status | Returns | Used By |
|----------|--------|---------|---------|
| `getServiceCategories()` | ✅ | Active categories | Service browser |
| `getServiceCategory()` | ✅ | Category with nested services | Category detail |
| `getService()` | ✅ | Full service with options | Service detail |
| `searchServices()` | ✅ | Filtered services | Search |
| `getBrands()` | ✅ | Brands list | Quote builder |
| `getServiceMaterials()` | ✅ | Materials list | Quote builder |
| `getFullCatalogue()` | ✅ | Everything (expensive) | Initial load |
| `getServicePricing()` | ✅ | Pricing model + amount | Price calculation |

**Issues Found**: None. Service is production-ready.

### 3.5 Professional Service (`src/lib/services/professionals.ts`)

**Status**: ⚠️ CRITICAL BUGS FOUND

```typescript
// BUG #1: Field name mismatch
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    id,
    assigned_professional_id,  // ❌ Wrong field (should be professional_id)
    state                        // ❌ Wrong field (should be current_state)
  `)

// FIX:
.select(`
  id,
  professional_id,              // ✅ Correct
  current_state                 // ✅ Correct
`)
```

```typescript
// BUG #2: State transition params incorrect
await supabase.rpc('transition_job_state', {
  p_job_id: jobId,
  state: newState  // ❌ Wrong param name (should be p_new_state)
})

// FIX:
await supabase.rpc('transition_job_state', {
  p_job_id: jobId,
  p_new_state: newState,      // ✅ Correct
  p_actor_id: userId           // ✅ Required parameter
})
```

**Impact**: Professional cannot fetch jobs or transition states. Features will fail at runtime.

### 3.6 Missing Server Actions (Critical Gap)

| Feature | Needed For | File | Status |
|---------|-----------|------|--------|
| `approveQuote()` | Customer quote approval | `src/lib/services/quotes.ts` | ❌ Missing |
| `createQuote()` | Professional quote creation | `src/lib/services/quotes.ts` | ❌ Missing |
| `uploadVerificationDocument()` | Professional verification | `src/lib/services/verification.ts` | ❌ Missing |
| `submitPayment()` | Payment checkout | `src/lib/services/payments.ts` | ❌ Missing |
| `verifyPaymentWebhook()` | Payment confirmation | `src/lib/services/payments.ts` | ❌ Missing |
| `getUnverifiedProfessionals()` | Admin verification queue | `src/lib/services/admin.ts` | ❌ Missing |
| `approveProfessional()` | Admin professional approval | `src/lib/services/admin.ts` | ❌ Missing |

---

## Part 4: Frontend Integration Status

### 4.1 Currently Connected (Real Data) ✅

**Customer Dashboard** (`/app/page.tsx`)
```tsx
✅ Fetches properties: FROM properties WHERE customer_id = auth.uid()
✅ Fetches jobs: FROM jobs + relationships
✅ Fetches bookings: FROM bookings + service details
✅ Displays real data with state-based coloring
```

**Properties Page** (`/app/properties/page.tsx`)
```tsx
✅ Lists customer properties with addresses
✅ Shows property details and past services
⚠️ "Add Property" button exists but form not wired
⚠️ "View Jobs" button exists but navigation not wired
```

**Professional Dashboard** (`/pro/page.tsx`)
```tsx
✅ Fetches professional_profiles data
✅ Shows online/offline toggle (state stored)
✅ Displays verification status
⚠️ No job count or earnings preview
```

### 4.2 Using Mock Data ❌

**Professional Jobs Page** (`/pro/jobs/page.tsx`)
```tsx
❌ const mockJobs = [
  { id: 'job-001', customer: 'John Doe', ... }
  // Hardcoded 15 jobs
]
```
**Fix**: Replace with query to `getAssignedJobs()` function.

**Professional Job Detail** (`/pro/jobs/[id]/page.tsx`)
```tsx
❌ const mockJobDetails = { ... }
```
**Fix**: Replace with `getJob(id)` query.

### 4.3 Missing UI Components (Critical)

| Component | Purpose | Status | Blocker |
|-----------|---------|--------|---------|
| `BookingWizard` | Service → date/time → confirm | ❌ Missing | Blocks booking creation |
| `QuoteBuilder` | Professional creates quote | ❌ Missing | Blocks quote workflow |
| `QuoteApproval` | Customer approves quote | ❌ Missing | Blocks approval flow |
| `JobTimeline` | Visual job state progression | ❌ Missing | Blocks job tracking |
| `PaymentCheckout` | Stripe/Square integration | ❌ Missing | Blocks payments |
| `InvoiceViewer` | Display invoice PDF/HTML | ❌ Missing | Blocks post-job flow |
| `VerificationUpload` | Professional doc upload | ⚠️ Partial | Blocks verification |
| `AdminVerificationQueue` | Admin approves professionals | ❌ Missing | Blocks admin workflow |
| `AdminJobDashboard` | Admin monitors jobs | ❌ Missing | Blocks admin oversight |
| `AvailabilityScheduler` | Professional sets availability | ❌ Missing | Blocks availability mgmt |

### 4.4 Route Status

| Route | Purpose | Page | Server Action | Status |
|-------|---------|------|---------------|--------|
| `/` | Homepage | ✅ Built | - | ✅ |
| `/login` | Sign in | ✅ Built | ⚠️ Partial | ⚠️ |
| `/register` | Sign up | ✅ Built | ⚠️ Partial | ⚠️ |
| `/app` | Customer dashboard | ✅ Connected | ✅ | ✅ |
| `/app/properties` | Property list | ✅ Connected | ✅ | ✅ |
| `/app/properties/[id]` | Property detail | ✅ Built | ✅ | ✅ |
| `/app/bookings` | Booking list | ✅ Connected | ✅ | ⚠️ No create flow |
| `/app/bookings/new` | New booking | ❌ Missing | ❌ | ❌ Blocker |
| `/app/services` | Browse services | ✅ Built | ✅ | ✅ |
| `/pro` | Professional dashboard | ✅ Connected | ⚠️ Buggy | ⚠️ |
| `/pro/jobs` | Job list | ❌ Mock data | ⚠️ Buggy | ❌ Blocker |
| `/pro/jobs/[id]` | Job detail | ❌ Mock data | ⚠️ Buggy | ❌ Blocker |
| `/pro/quotes/[id]/create` | Create quote | ❌ Missing | ❌ | ❌ |
| `/pro/earnings` | Earnings view | ✅ Built | ❌ | ⚠️ No data |
| `/admin` | Admin dashboard | ❌ Stub | ❌ | ❌ Blocker |
| `/admin/verifications` | Verify professionals | ❌ Missing | ❌ | ❌ Blocker |
| `/admin/jobs` | Monitor jobs | ❌ Missing | ❌ | ❌ Blocker |

---

## Part 5: Integration Gaps & Dependencies

### 5.1 Booking Flow Gap
```
Current State:
  Customer views services (✅ working)
  Customer clicks book → ❌ No booking wizard
  Database has booking schema (✅)
  Server action exists (✅)

Missing:
  1. BookingWizard component (select service → date/time → payment → confirm)
  2. Route: /app/bookings/new
  3. Calendar/availability widget to fetch professional slots
  4. Connection to createBooking() server action
  5. Post-booking redirect to job tracking

Impact: CRITICAL - No way to actually book services
Timeline: 4-6 hours to implement
```

### 5.2 Job Workflow Gap
```
Current State:
  Database has job state machine (✅)
  transition_job_state() function exists (✅)
  Professional job list uses mock data (❌)
  Job detail uses mock data (❌)

Bugs:
  - src/app/professional/actions.ts has field name errors
  - State transitions called with wrong params

Missing:
  1. Fix professional/actions.ts field names + params
  2. Create real data query to replace mockJobs
  3. Add UI buttons for state transitions (Accept, Arrived, etc.)
  4. Add JobTimeline component for visual feedback
  5. Real-time updates when job state changes

Impact: CRITICAL - Professional cannot manage jobs
Timeline: 3-4 hours to fix + 2-3 hours for UI
```

### 5.3 Quote Management Gap
```
Current State:
  Database has quotes + quote_items tables (✅)
  Server actions: MISSING (❌)
  UI components: MISSING (❌)

Missing:
  1. Server action: createQuote(jobId, items, total)
  2. Server action: approveQuote(quoteId, customerId)
  3. Server action: declineQuote(quoteId, customerId)
  4. UI: QuoteBuilder (professional creates)
  5. UI: QuoteApproval (customer approves)
  6. Route: /pro/quotes/[id]/create
  7. Route: /app/quotes/[id]

Impact: HIGH - No quote workflow, all work must be fixed-price
Timeline: 5-6 hours to implement
```

### 5.4 Payment Integration Gap
```
Current State:
  Database has payments table (✅)
  Payment provider: NOT CONFIGURED (❌)
  Webhook handler: NOT IMPLEMENTED (❌)
  UI checkout: NOT BUILT (❌)

Missing:
  1. Setup Razorpay account (India's leading payment processor for INR)
  2. Create provider adapter: src/lib/payments/provider.ts
  3. Implement webhook handler: /api/webhooks/payment
  4. Add idempotency tracking
  5. Build PaymentCheckout UI component
  6. Wire up post-payment redirect
  7. Generate invoices

Impact: CRITICAL - Cannot collect payment
Timeline: 6-8 hours (+ provider account setup)
```

### 5.5 Professional Verification Gap
```
Current State:
  Database has verifications + documents tables (✅)
  Document upload UI: PARTIAL (exists but incomplete)
  Server action to create verification: MISSING (❌)
  Admin verification queue: MISSING (❌)
  Admin approval/rejection: MISSING (❌)

Missing:
  1. Server action: uploadVerificationDocument(file, documentType)
  2. Server action: (admin) approveProfessional(professionalId)
  3. Server action: (admin) rejectProfessional(professionalId, reason)
  4. UI: AdminVerificationQueue (list pending verifications)
  5. UI: VerificationDocumentReview (inspect uploaded docs)
  6. UI: ApprovalDialog (approve/reject with reason)
  7. Route: /admin/verifications

Impact: HIGH - Unverified professionals are security risk
Timeline: 4-5 hours to implement
```

### 5.6 Admin Dashboard Gap
```
Current State:
  Admin route exists (/admin) but is stub only
  Database queries: MISSING (❌)
  Admin UI: NOT BUILT (❌)

Missing:
  1. Admin dashboard: live job count, professional count, revenue
  2. Job monitoring page: list all jobs with status filtering
  3. Professional management page: list all professionals with verification status
  4. Verification queue: pending approvals
  5. Payment dashboard: transaction history, refunds
  6. Complaints/disputes: customer complaints and resolutions
  7. Analytics: usage metrics, revenue trends

Impact: HIGH - No admin oversight, cannot manage platform
Timeline: 6-8 hours to implement
```

### 5.7 Notification/Email Gap
```
Current State:
  Email service: NOT CONFIGURED (❌)
  Notification templates: NOT CREATED (❌)
  Real-time updates: NOT IMPLEMENTED (❌)

Missing:
  1. Choose email provider (SendGrid/Postmark/AWS SES)
  2. Create email templates (booking confirmation, job assigned, payment received, etc.)
  3. Server action: sendNotification(userId, type, data)
  4. Trigger emails on key events (via database triggers or server actions)
  5. Setup Supabase Realtime subscriptions for live updates
  6. Create notification UI components (toast, in-app notifications)

Impact: MEDIUM - Can operate without, but UX degraded
Timeline: 3-4 hours (+ provider setup)
```

### 5.8 Seed Data Gap
```
Current State:
  Service catalogue database: EMPTY (❌)
  Demo/test data: NOT SEEDED (❌)

Missing:
  1. Create seed script: supabase/seeds/00_demo_data.sql
  2. Add service categories (plumbing, electrical, carpentry, etc.)
  3. Add services per category (pipe repair, fixture install, etc.)
  4. Add service options (urgency level, size, etc.)
  5. Add materials/brands for quotes
  6. Add demo professional profiles
  7. Add demo properties and jobs for testing

Impact: CRITICAL - UI has nothing to display
Timeline: 2-3 hours to create initial seed data
```

---

## Part 6: Phase-by-Phase Integration Roadmap

### Phase 1: Fix Critical Bugs (2-3 hours)

**Priority**: IMMEDIATE - Blocking other work

**Tasks**:
1. ✏️ Fix `src/app/professional/actions.ts` field name bugs
   - Change `assigned_professional_id` → `professional_id`
   - Change `state` → `current_state`
   - Change RPC param from `state` → `p_new_state`
   - Add missing `p_actor_id` param

2. ✏️ Add missing parameter to `transition_job_state()` call
   ```typescript
   await supabase.rpc('transition_job_state', {
     p_job_id: jobId,
     p_new_state: newState,
     p_actor_id: userId  // ← Add this
   })
   ```

3. ✅ Verify professional queries work with real data

**Deliverable**: Professional actions fixed, ready for testing.

---

### Phase 2: Connect Professional Jobs (3-4 hours)

**Priority**: HIGH - Unblocks professional UX

**Tasks**:
1. Create server action: `src/lib/services/jobs.ts`
   ```typescript
   export async function getAssignedJobs(professionalId: string) {
     // Query jobs WHERE professional_id = professionalId
     // Include customer, property, service details
     // Order by current_state priority, then created_at DESC
     return jobs with relationships
   }
   ```

2. Create UI component: `src/components/professional/JobList.tsx`
   - Replace mockJobs with real query
   - Display loading/error states
   - Show job card with state badge

3. Update `/pro/jobs/page.tsx` to call `getAssignedJobs()`

4. Connect `/pro/jobs/[id]/page.tsx` to `getJob(jobId)` query

5. Add JobTimeline component for state visualization

**Deliverable**: Professional can see real assigned jobs.

---

### Phase 3: Seed Demo Data (2-3 hours)

**Priority**: HIGH - Needed for testing all other phases

**Tasks**:
1. Create seed script: `supabase/migrations/20261001_000_seed_demo_data.sql`

2. Insert service categories:
   ```sql
   INSERT INTO service_categories (name, description, icon_url, is_active)
   VALUES 
   ('Plumbing', 'Pipe repairs, fixtures, drainage', 'plumbing.svg', true),
   ('Electrical', 'Wiring, outlets, lighting', 'electrical.svg', true),
   ('Carpentry', 'Wood repairs, shelving, doors', 'carpentry.svg', true),
   ...
   ```

3. Insert services per category with pricing models

4. Insert service options and values

5. Insert demo materials/brands

6. Insert demo professional profiles (10-15 verified pros)

7. Insert demo properties for test customers

8. Insert demo jobs with various states for testing

**Deliverable**: Test data available in Supabase, UI can render real services.

---

### Phase 4: Implement Booking Flow (4-6 hours)

**Priority**: CRITICAL - Core user journey

**Tasks**:
1. Create component: `src/components/customer/BookingWizard.tsx`
   - Step 1: Select service category → service
   - Step 2: Select date/time (fetch professional availability)
   - Step 3: Review price & confirm
   - Step 4: Show booking reference

2. Create route: `/app/bookings/new`

3. Wire up "Book Service" button from service detail page

4. Add server action call:
   ```typescript
   await createBooking({
     customerId,
     propertyId,
     serviceId,
     preferredDatetime,
     estimatedAmount
   })
   ```

5. Redirect to `/app/bookings/[id]` after booking

6. Add booking confirmation email trigger

**Deliverable**: Customer can book services end-to-end.

---

### Phase 5: Implement Job State Transitions (2-3 hours)

**Priority**: HIGH - Core professional workflow

**Tasks**:
1. Add UI buttons to job detail:
   - Professional: "Accept", "Arrived", "Start Inspection", "Complete"
   - Customer: "Approve Quote", "Decline Quote", "Schedule Reschedule"
   - Admin: "Reassign", "Cancel", "Override"

2. Create server action wrapper:
   ```typescript
   export async function updateJobState(jobId, newState, userId) {
     // Call transition_job_state() RPC
     // Return updated job with new state
     // Emit real-time update
   }
   ```

3. Wire buttons to call server action

4. Add optimistic UI updates + error handling

5. Display job_events timeline (audit trail)

**Deliverable**: Job state machine fully functional.

---

### Phase 6: Implement Quote Management (5-6 hours)

**Priority**: HIGH - Enables additional work charging

**Tasks**:
1. Create server actions in `src/lib/services/quotes.ts`:
   ```typescript
   export async function createQuote(jobId, items, total)
   export async function approveQuote(quoteId, customerId)
   export async function declineQuote(quoteId, customerId, reason)
   ```

2. Create component: `src/components/professional/QuoteBuilder.tsx`
   - List labor items with pricing
   - List material items
   - Total calculation
   - Submit quote

3. Create component: `src/components/customer/QuoteApproval.tsx`
   - Display quote details
   - Approve/Decline buttons
   - Show breakdown of costs

4. Create routes:
   - `/pro/jobs/[id]/quote/create` (professional quote form)
   - `/app/jobs/[id]/quote` (customer approval)

5. Add email notifications for quote creation/approval

**Deliverable**: Professional can create quotes, customer can approve.

---

### Phase 7: Implement Payment Integration with Razorpay (6-8 hours)

**Priority**: CRITICAL - Revenue collection  
**Payment Provider**: Razorpay (India-based, INR support)

**Tasks**:
1. Setup Razorpay account
   - Create account at https://razorpay.com
   - Get API Key ID and Key Secret
   - Enable webhooks
   - Add keys to .env.local

2. Create payment adapter: `src/lib/payments/razorpay.ts`
   ```typescript
   export async function createPaymentOrder(bookingId, amountInPaise, email, phone)
   export function verifyPaymentSignature(orderId, paymentId, signature)
   export async function getPaymentDetails(paymentId)
   ```

3. Create webhook handler: `src/app/api/webhooks/razorpay/route.ts`
   - Verify webhook signature (HMAC SHA256)
   - Check for idempotency (webhook already processed?)
   - Create payment record in database with INR amount
   - Trigger job transition to COMPLETED
   - Send confirmation email with INR amount

4. Create component: `src/components/customer/PaymentCheckout.tsx`
   - Display final amount in ₹ INR
   - Embed Razorpay Checkout modal
   - Handle payment success/failure
   - Show confirmation

5. Create API routes:
   - `/api/payments/razorpay/create-order` — Create Razorpay order
   - `/api/payments/razorpay/verify` — Verify payment signature
   - `/api/webhooks/razorpay` — Webhook endpoint for payment events

6. Add route: `/app/bookings/[id]/checkout`

7. Wire up booking → checkout flow

**Deliverable**: Customer can pay for bookings in INR via Razorpay (cards, UPI, NetBanking, wallets).

**Testing**:
- Use Razorpay test keys (rzp_test_*)
- Test card: 4111 1111 1111 1111
- Verify webhook delivery locally using Razorpay dashboard

---

### Phase 8: Implement Professional Verification (4-5 hours)

**Priority**: HIGH - Security & compliance

**Tasks**:
1. Create server actions in `src/lib/services/verification.ts`:
   ```typescript
   export async function uploadVerificationDocument(professionalId, file, documentType)
   export async function getUnverifiedProfessionals()
   ```

2. Update component: `src/components/professional/VerificationUpload.tsx`
   - Upload form for documents (ID, license, insurance, background check)
   - File validation (size, format)
   - Call server action on submit
   - Show upload status

3. Create component: `src/components/admin/VerificationQueue.tsx`
   - List pending professionals
   - Show uploaded documents
   - Approve/Reject buttons

4. Create component: `src/components/admin/DocumentReview.tsx`
   - Display document preview
   - Notes field for review
   - Approve/Reject with reason

5. Add server actions for admin approval:
   ```typescript
   export async function approveProfessional(professionalId, adminId)
   export async function rejectProfessional(professionalId, reason, adminId)
   ```

**Deliverable**: Professional verification workflow complete.

---

### Phase 9: Implement Admin Dashboard (6-8 hours)

**Priority**: HIGH - Platform governance

**Tasks**:
1. Create admin service: `src/lib/services/admin.ts`
   - Query all jobs with filtering
   - Query all professionals with status
   - Query payment metrics
   - Query complaint tickets

2. Create main admin dashboard:
   - Live metrics (jobs in progress, verified pros, revenue)
   - Quick links to verification queue, job disputes, payment issues
   - Charts for usage trends

3. Create admin jobs page:
   - List all jobs (filter by state, date, professional, customer)
   - Job detail with full timeline
   - Actions: reassign, cancel, refund
   - Escalation buttons

4. Create admin professionals page:
   - List all professionals (filter by verification status, rating)
   - Actions: suspend, reactivate, review documents

5. Create admin payments page:
   - Transaction history with filtering
   - Refund management
   - Revenue summary

6. Create admin complaints page:
   - List complaints from customers
   - Resolution workflow
   - Dispute mediation tools

**Deliverable**: Admin can manage platform effectively.

---

### Phase 10: Implement Notifications & Real-time Updates (3-4 hours)

**Priority**: MEDIUM - UX enhancement

**Tasks**:
1. Choose email provider (SendGrid, Postmark, or AWS SES)
   - Setup account and API keys

2. Create email service: `src/lib/notifications/email.ts`
   ```typescript
   export async function sendBookingConfirmation(customerId, bookingId)
   export async function sendJobAssigned(professionalId, jobId)
   export async function sendPaymentReceived(customerId, paymentId)
   export async function sendQuoteCreated(customerId, quoteId)
   ```

3. Create email templates (HTML):
   - booking-confirmation.html
   - job-assigned.html
   - payment-received.html
   - quote-created.html
   - quote-approved.html
   - job-completed.html

4. Setup database triggers to send emails on key events:
   - New booking → send confirmation to customer
   - Job assigned → send to professional
   - Payment received → send to customer
   - Quote created → send to customer

5. Setup Supabase Realtime subscriptions:
   - Professional subscribes to job_events for assigned jobs
   - Customer subscribes to booking_events for owned bookings
   - Real-time UI updates when events occur

6. Create notification toast component

**Deliverable**: Notifications & real-time updates working.

---

## Part 7: Demo Data Strategy

### Current State
- ❌ No service data seeded
- ❌ No demo professionals created
- ❌ No demo properties for testing
- ❌ Professional jobs page uses hardcoded mockJobs

### Recommended Approach

**Phase 1: Seed Core Data** (Done in Phase 3)
```sql
-- Services (20-30 common home services)
Plumbing: pipe repair, fixture install, drain cleaning
Electrical: outlet install, light fixture, rewiring
Carpentry: shelf install, door repair, frame work
HVAC: filter change, thermostat install, inspection
Appliance: repair, installation (conditional pricing)

-- Demo Professionals (15 verified, various skills)
- Alice: Plumber, 4.8★, 120 completed
- Bob: Electrician, 4.6★, 85 completed
- Charlie: Carpenter, 4.9★, 110 completed
... etc

-- Demo Properties (5-10 for test customers)
- 123 Main St: 3BR/2BA, 1995
- 456 Oak Ave: 2BR/1BA, 1980
... etc

-- Demo Jobs (Various states for testing)
- Job 001: COMPLETED (fully worked through flow)
- Job 002: IN_PROGRESS (shows current work)
- Job 003: QUOTE_PENDING (awaiting customer approval)
- Job 004: ACCEPTED (assigned, awaiting start)
... etc
```

**Phase 2: UI Testing with Real Data**
- After Phase 5 (Booking Flow), use real booking to create jobs
- After Phase 7 (Payments), process real payment
- After Phase 8 (Verification), test admin approval workflow
- Never go back to mock data once real data flow works

**Phase 3: Production Data Separation**
- Test data marked with `is_test: true` flag (optional)
- Demo professionals in separate "demo" service area
- Can be easily cleared for production launch

---

## Part 8: Implementation Priority Matrix

### Must-Have (MVP Blockers) - 30-35 hours
1. ✅ **Phase 1**: Fix critical bugs (2-3h)
2. ✅ **Phase 3**: Seed demo data (2-3h)
3. ✅ **Phase 2**: Connect professional jobs (3-4h)
4. ✅ **Phase 4**: Implement booking flow (4-6h)
5. ✅ **Phase 5**: Job state transitions (2-3h)
6. ✅ **Phase 7**: Payment integration (6-8h)
7. ✅ **Phase 6**: Quote management (5-6h)

**Deliverable**: Complete end-to-end user journey (book → assign → quote → pay)

### Should-Have (Core Functionality) - 10-15 hours
8. ✅ **Phase 8**: Professional verification (4-5h)
9. ✅ **Phase 9**: Admin dashboard (6-8h) — Can reduce to 4-5h for MVP

**Deliverable**: Admin oversight, professional trust

### Nice-to-Have (UX Polish) - 3-4 hours
10. ✅ **Phase 10**: Notifications & real-time (3-4h)

**Deliverable**: User delight, modern UX

---

## Part 9: Risk Assessment & Mitigations

### Risk 1: Payment Provider Integration Delays

**Risk**: Stripe/Square account setup, API learning curve  
**Probability**: Medium  
**Impact**: High (blocks revenue)  
**Mitigation**:
- Choose provider immediately (Stripe recommended for simplicity)
- Create test account now (not production)
- Use provider's pre-built UI (reduces complexity)
- Implement webhook verification carefully (test locally with stripe-cli)

### Risk 2: RLS Policy Bugs Leak Data

**Risk**: Incorrectly written RLS allows unauthorized access  
**Probability**: Low (policies already reviewed)  
**Impact**: Critical (security breach)  
**Mitigation**:
- Test each policy with wrong user (should return 0 rows)
- Run through security checklist before Phase 4
- Use audit_logs to track who accessed what
- Never disable RLS for convenience

### Risk 3: Professional-Customer Assignment Matching

**Risk**: Complex logic to assign best professional  
**Probability**: Medium  
**Impact**: Medium (features don't work well)  
**Mitigation**:
- Start with simple: filter by service area + available time
- Add scoring later (rating, distance, specialty)
- Can randomize for MVP, improve after launch

### Risk 4: Booking Wizard Calendar Complexity

**Risk**: Professional availability calendar hard to build  
**Probability**: Medium  
**Impact**: Medium (UX degraded)  
**Mitigation**:
- Start with simple date picker + time slots
- Show professional's weekly availability
- Can add fancy calendar UI later
- Fallback: text description of availability

### Risk 5: Database Migration Conflicts

**Risk**: Seed data migration has typos/constraints violated  
**Probability**: Low  
**Impact**: Medium (blocks testing)  
**Mitigation**:
- Test seed migration on local/staging first
- Include rollback statements
- Verify all foreign keys before inserting
- Check for constraint violations

---

## Part 10: Success Criteria Checklist

### Backend Integration ✅
- [ ] All database migrations applied and verified
- [ ] All RLS policies tested (no data leaks)
- [ ] All server actions free of field name bugs
- [ ] All critical indexes present for performance
- [ ] Service-role key secure (not in client code)

### Frontend Connection ✅
- [ ] Professional jobs show real data (not mockJobs)
- [ ] Customer dashboard shows real bookings
- [ ] Property list shows customer properties only
- [ ] Service catalogue populated with seed data

### User Workflows ✅
- [ ] Customer can book end-to-end (select → pay)
- [ ] Professional can view, accept, transition jobs
- [ ] Customer can approve quotes and pay
- [ ] Admin can verify professionals
- [ ] Payment success creates invoice

### Security ✅
- [ ] No unencrypted sensitive data
- [ ] RLS prevents cross-customer data access
- [ ] Payment webhook signature verified
- [ ] Audit logs record all sensitive actions
- [ ] No console errors or warnings

### Performance ✅
- [ ] Dashboard loads < 1 second
- [ ] Job list loads < 1 second (with 100 jobs)
- [ ] Service search < 500ms
- [ ] Payment checkout form loads < 2 seconds

### Testing ✅
- [ ] End-to-end test: book → assign → inspect → quote → approve → pay → complete
- [ ] Authorization test: customer cannot see other customer's data
- [ ] Webhook test: payment webhook triggers correctly
- [ ] State machine test: invalid transitions blocked

---

## Part 11: Execution Checklist

### Week 1: Foundation (15-20 hours)
- [ ] **Day 1**: Phase 1 (Fix bugs) + Phase 3 (Seed data)
- [ ] **Day 2**: Phase 2 (Professional jobs)
- [ ] **Day 3**: Phase 4 (Booking flow) — Part 1 (UI)
- [ ] **Day 4**: Phase 4 (Booking flow) — Part 2 (Integration)
- [ ] **Day 5**: Phase 5 (Job state transitions)

**Checkpoint**: Customer can book, professional can manage jobs.

### Week 2: Workflow (20-25 hours)
- [ ] **Day 1**: Phase 6 (Quote management) — Part 1
- [ ] **Day 2**: Phase 6 (Quote management) — Part 2
- [ ] **Day 3**: Phase 7 (Payment integration) — Part 1
- [ ] **Day 4**: Phase 7 (Payment integration) — Part 2 (Webhook)
- [ ] **Day 5**: Phase 8 (Professional verification)

**Checkpoint**: Full revenue cycle works (book → pay).

### Week 3: Governance (15-20 hours)
- [ ] **Day 1**: Phase 9 (Admin dashboard) — Part 1
- [ ] **Day 2**: Phase 9 (Admin dashboard) — Part 2
- [ ] **Day 3**: Phase 9 (Admin dashboard) — Part 3
- [ ] **Day 4**: Phase 10 (Notifications) + Final testing
- [ ] **Day 5**: Bug fixes, security review, go-live prep

**Checkpoint**: Platform ready for MVP launch.

---

## Part 12: Next Steps & Recommendations

### Immediate (Today)
1. ✅ **Review this document** with your team
2. ✅ **Fix Phase 1 bugs** (professional/actions.ts)
3. ✅ **Create Phase 3 seed data** (demo services, professionals, properties)
4. ✅ **Set up Razorpay account** (India's leading payment processor)

### This Week
5. ✅ **Complete Phase 2** (Connect professional jobs)
6. ✅ **Complete Phase 4** (Booking wizard UI)
7. ✅ **Complete Phase 5** (Job state transitions)

### Next Week
8. ✅ **Complete Phase 6** (Quote management)
9. ✅ **Complete Phase 7** (Payment integration)
10. ✅ **Complete Phase 8** (Professional verification)

### Final Week
11. ✅ **Complete Phase 9** (Admin dashboard)
12. ✅ **Complete Phase 10** (Notifications)
13. ✅ **End-to-end testing** (full user journey)
14. ✅ **Security audit** (RLS, payment, audit logs)
15. ✅ **Production deployment prep**

---

## Part 13: Architecture Diagram (Current State)

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIXIFY SYSTEM ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ Customer App          ⚠️ Professional App    ❌ Admin Panel  │
│  ├─ Dashboard             ├─ Dashboard          ├─ (Stub)       │
│  ├─ Properties (Real)     ├─ Jobs (MOCK DATA)   ├─ (Missing)    │
│  ├─ Services (Real)       ├─ Earnings (Real)    └─ (Missing)    │
│  └─ Bookings (Partial)    └─ Profile (Real)                     │
│                                                                  │
│  Authentication: ✅ Supabase Auth (Cookie-based)                │
│  Session Mgmt:   ✅ @supabase/ssr                               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
         │                              │                    │
         │                              │                    │
         ▼                              ▼                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SERVER LAYER (Next.js)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Server Actions & Services:                                     │
│  ✅ Authentication     ✅ Properties      ❌ Quote Management   │
│  ✅ Catalogue          ⚠️ Bookings (partial)  ❌ Payment API   │
│  ⚠️ Professional (buggy) ❌ Verification   ❌ Admin Queries    │
│                        ❌ Email Notifs    ❌ Realtime Subs     │
│                                                                  │
│  Supabase Client:                                               │
│  ├─ Browser client:   @supabase/supabase-js (anon key)         │
│  └─ Server client:    @supabase/ssr + service-role key         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Schema (4 Migrations):                                         │
│  ✅ Auth Foundation        (profiles, audit_logs)              │
│  ✅ Properties & Catalogue (services, options)                 │
│  ✅ Professional Profiles  (skills, verifications)             │
│  ✅ Jobs & Payments        (bookings, jobs, quotes, payments)  │
│                                                                  │
│  RLS Policies: ✅ Applied to all customer-owned tables         │
│  Functions:    ✅ transition_job_state()                       │
│  Triggers:     ✅ handle_new_user() (create profile on signup) │
│                                                                  │
│  Tables & Status:                                              │
│  ✅ Populated:  profiles, professional_profiles, settings      │
│  ❌ Empty:      service_categories, services, professionals    │
│  ✅ Schema OK:  All tables ready, just need data               │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
         │
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│            EXTERNAL SERVICES (NOT YET INTEGRATED)                │
├──────────────────────────────────────────────────────────────────┤
│  ❌ Payment Provider       (Stripe/Square)                       │
│  ❌ Email Service          (SendGrid/Postmark)                  │
│  ❌ SMS Notifications      (Twilio)                             │
│  ❌ AI Classification      (OpenAI)                             │
│  ❌ File Storage           (Beyond Supabase Storage)            │
└──────────────────────────────────────────────────────────────────┘

```

---

## Conclusion

Fixify has a **strong database and authentication foundation** but is **missing ~60% of the frontend integration** and **90% of the revenue/admin workflows**.

**Estimated timeline to MVP completeness: 60-80 hours of focused development over 3-4 weeks.**

The roadmap above provides a clear, prioritized path to full integration. Start with **Phase 1 (bug fixes)** and **Phase 3 (seed data)** immediately, then move through phases 2-7 in order to achieve a complete, production-ready booking → payment flow.

No demo data will be needed after Phase 3, as all UI will connect to real database queries and server actions. By Phase 7, the entire revenue cycle works end-to-end with real data.

---

**Document Version**: 1.0  
**Last Updated**: October 1, 2026  
**Prepared for**: Fixify Development Team  
**Status**: Ready for Implementation
