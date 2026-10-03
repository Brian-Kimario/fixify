# Fixify Integration Implementation Tasks

**Status**: Ready for Execution  
**Total Estimated Hours**: 60-80 hours  
**Target Completion**: 3-4 weeks  
**Team Size**: 1-2 developers recommended

---

## PHASE 1: Fix Critical Bugs (2-3 hours) ⚠️ BLOCKER

### Task 1.1: Fix Professional Actions Field Names
**File**: `src/app/professional/actions.ts`  
**Time**: 30 minutes

**Current Code (BROKEN)**:
```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    id,
    assigned_professional_id,  // ❌ WRONG
    state,                       // ❌ WRONG
    customer_id,
    property_id,
    service_id
  `)
  .eq('assigned_professional_id', professionalId)  // ❌ WRONG

for (const job of jobs) {
  if (job.state !== newState) {  // ❌ WRONG
    await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      state: newState  // ❌ WRONG param name
    })
  }
}
```

**Fix (CORRECT)**:
```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    id,
    professional_id,  // ✅ CORRECT
    current_state,     // ✅ CORRECT
    customer_id,
    property_id,
    service_id
  `)
  .eq('professional_id', professionalId)  // ✅ CORRECT

for (const job of jobs) {
  if (job.current_state !== newState) {  // ✅ CORRECT
    const userId = (await getCurrentUser())?.id
    await supabase.rpc('transition_job_state', {
      p_job_id: job.id,
      p_new_state: newState,      // ✅ CORRECT param name
      p_actor_id: userId           // ✅ REQUIRED param
    })
  }
}
```

**Verification**:
- [ ] Fix applied to `src/app/professional/actions.ts`
- [ ] Command: `npm run lint` — Should pass
- [ ] Test in browser: Professional can load jobs page without error
- [ ] Check network tab: Job query succeeds

---

### Task 1.2: Add Missing getCurrentUser Import
**File**: `src/app/professional/actions.ts`  
**Time**: 10 minutes

**Current**: `getCurrentUser()` may not be imported  
**Fix**: Add to imports if missing:
```typescript
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
```

---

### Task 1.3: Test Professional Actions Locally
**Time**: 45 minutes

**Manual Test**:
1. Navigate to `/pro/jobs` in browser
2. Check browser console for errors
3. Network tab: `jobs` query should succeed
4. Should see job list (not mockJobs)
5. Click job → should navigate to `/pro/jobs/[id]`
6. Job detail should load (not mockJobDetails)

**Error Handling**:
- If query fails: Check Supabase RLS policies
- If 404: Ensure professional_id in database matches auth.uid()
- If type errors: Check field names again

---

## PHASE 2: Connect Professional Jobs to Database (3-4 hours)

### Task 2.1: Replace mockJobs with Real Query
**File**: `src/app/professional/jobs/page.tsx`  
**Time**: 1 hour

**Current Code (BROKEN)**:
```typescript
'use client'
import { useState } from 'react'

const mockJobs = [
  { id: 'job-001', customer: 'John Doe', ... },
  { id: 'job-002', customer: 'Jane Smith', ... },
  // ... 15 more hardcoded jobs
]

export default function JobsPage() {
  const [jobs] = useState(mockJobs)
  // ... render mockJobs
}
```

**Fix (CORRECT)**:
```typescript
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { JobCard } from '@/components/professional/JobCard'
import { Alert } from '@/components/ui/alert'

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          setError('Not authenticated')
          return
        }

        const { data, error: err } = await supabase
          .from('jobs')
          .select(`
            id,
            current_state,
            created_at,
            customer_id,
            property_id,
            service_id,
            professional_id,
            amount,
            profiles!jobs_customer_id_fkey(id, email),
            properties(id, address),
            services(id, name, description)
          `)
          .eq('professional_id', user.id)
          .order('created_at', { ascending: false })

        if (err) throw err
        setJobs(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  if (loading) {
    return <div className="p-8">Loading jobs...</div>
  }

  if (error) {
    return <Alert variant="destructive">{error}</Alert>
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p>No jobs assigned yet</p>
        <p className="text-sm text-gray-600">Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Assigned Jobs</h1>
      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
```

**Note**: Remove `'use client'` if fetching server-side via Server Component (preferred).

---

### Task 2.2: Create JobCard Component
**File**: `src/components/professional/JobCard.tsx`  
**Time**: 45 minutes

```typescript
import Link from 'next/link'
import { formatDate } from '@/lib/utils/date'
import { STATE_CONFIG } from '@/lib/jobs/state-machine'
import { Badge } from '@/components/ui/badge'

interface JobCardProps {
  job: {
    id: string
    current_state: string
    created_at: string
    amount: number
    profiles: { id: string; email: string }
    properties: { id: string; address: string }
    services: { id: string; name: string }
  }
}

export function JobCard({ job }: JobCardProps) {
  const stateConfig = STATE_CONFIG[job.current_state]

  return (
    <Link href={`/pro/jobs/${job.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-lg transition cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-lg">{job.services.name}</p>
            <p className="text-sm text-gray-600">{job.properties.address}</p>
          </div>
          <Badge style={{ background: stateConfig.color }}>
            {stateConfig.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-600">Customer</p>
            <p className="font-medium">{job.profiles.email}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Amount</p>
            <p className="font-medium">${job.amount.toFixed(2)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          {formatDate(job.created_at)}
        </p>
      </div>
    </Link>
  )
}
```

---

### Task 2.3: Update Job Detail Page
**File**: `src/app/professional/jobs/[id]/page.tsx`  
**Time**: 1 hour

**Replace mockJobDetails with real query**:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { JobTimeline } from '@/components/professional/JobTimeline'
import { StateTransitionButtons } from '@/components/professional/StateTransitionButtons'

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as string
  const [job, setJob] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadJob = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) {
          setError('Not authenticated')
          return
        }

        // Fetch job
        const { data: jobData, error: jobErr } = await supabase
          .from('jobs')
          .select(`
            id,
            current_state,
            created_at,
            amount,
            customer_id,
            property_id,
            professional_id,
            service_id,
            profiles!jobs_customer_id_fkey(email, display_name),
            properties(address, description),
            services(name, description),
            inspections(id, findings, photos_url)
          `)
          .eq('id', jobId)
          .eq('professional_id', user.id)
          .single()

        if (jobErr) throw jobErr
        if (!jobData) {
          setError('Job not found')
          return
        }

        // Fetch events (immutable timeline)
        const { data: eventsData, error: eventsErr } = await supabase
          .from('job_events')
          .select('*')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true })

        if (eventsErr) throw eventsErr

        setJob(jobData)
        setEvents(eventsData || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job')
      } finally {
        setLoading(false)
      }
    }

    loadJob()
  }, [jobId])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!job) return <div className="p-8">Job not found</div>

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">{job.services.name}</h1>
        <p className="text-gray-600">{job.properties.address}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <p className="text-gray-600 text-sm">Customer</p>
          <p className="font-semibold">{job.profiles.display_name}</p>
          <p className="text-sm text-gray-500">{job.profiles.email}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-gray-600 text-sm">Amount</p>
          <p className="font-semibold text-lg">${job.amount.toFixed(2)}</p>
        </div>
      </div>

      <JobTimeline events={events} currentState={job.current_state} />

      <StateTransitionButtons jobId={job.id} currentState={job.current_state} />

      {job.inspections && job.inspections.length > 0 && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Inspection</h3>
          <p>{job.inspections[0].findings}</p>
        </div>
      )}
    </div>
  )
}
```

---

### Task 2.4: Create JobTimeline Component
**File**: `src/components/professional/JobTimeline.tsx`  
**Time**: 45 minutes

```typescript
import { STATE_CONFIG } from '@/lib/jobs/state-machine'
import { formatDate } from '@/lib/utils/date'

interface JobTimelineProps {
  events: Array<{
    id: string
    current_state: string
    created_at: string
    actor_id: string
    metadata?: Record<string, any>
  }>
  currentState: string
}

export function JobTimeline({ events, currentState }: JobTimelineProps) {
  return (
    <div className="border rounded p-4">
      <h3 className="font-semibold mb-4">Timeline</h3>
      <div className="space-y-4">
        {events.map((event, index) => {
          const config = STATE_CONFIG[event.current_state]
          const isLast = index === events.length - 1

          return (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: config.color }}
                />
                {!isLast && <div className="w-0.5 h-12 bg-gray-200 my-2" />}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{config.label}</p>
                <p className="text-sm text-gray-600">
                  {formatDate(event.created_at)}
                </p>
                {event.metadata?.note && (
                  <p className="text-sm mt-2">{event.metadata.note}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

### Task 2.5: Verification
**Time**: 30 minutes

- [ ] `npm run build` succeeds
- [ ] `/pro/jobs` loads and displays real jobs
- [ ] Click job → `/pro/jobs/[id]` loads with real data
- [ ] Job detail shows customer, property, timeline
- [ ] No console errors

---

## PHASE 3: Seed Demo Data (2-3 hours) ⚠️ BLOCKER FOR TESTING

### Task 3.1: Create Seed Migration File
**File**: `supabase/migrations/20261001_001_seed_demo_data.sql`  
**Time**: 2 hours

```sql
-- ────────────────────────────────────────────────────────────────
-- DEMO DATA SEED SCRIPT
-- ────────────────────────────────────────────────────────────────
-- This script populates demo services, professionals, and test data
-- for MVP testing. Can be safely deleted after production launch.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. SERVICE CATEGORIES
-- ────────────────────────────────────────────────────────────────

INSERT INTO service_categories (name, description, icon_url, is_active)
VALUES
  ('Plumbing', 'Pipe repairs, fixtures, drainage, water heater', 'plumbing.svg', true),
  ('Electrical', 'Wiring, outlets, lighting, circuit breaker', 'electrical.svg', true),
  ('Carpentry', 'Wood repairs, shelving, doors, framing', 'carpentry.svg', true),
  ('HVAC', 'Heating, cooling, air conditioning, thermostat', 'hvac.svg', true),
  ('Appliance Repair', 'Refrigerator, washer, dryer, dishwasher', 'appliance.svg', true),
  ('Drywall & Painting', 'Drywall repair, patching, painting', 'painting.svg', true)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 2. SERVICES (with pricing models)
-- ────────────────────────────────────────────────────────────────

-- Plumbing services
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Pipe Repair', id, 'Fix or replace damaged pipes', 'inspection', 75.00, 75.00, true
FROM service_categories WHERE name = 'Plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Fixture Installation', id, 'Install new faucet, sink, or toilet', 'inspection', 150.00, 75.00, true
FROM service_categories WHERE name = 'Plumbing'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Drain Cleaning', id, 'Clear clogged drains', 'fixed', 125.00, NULL, true
FROM service_categories WHERE name = 'Plumbing'
ON CONFLICT DO NOTHING;

-- Electrical services
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Outlet Installation', id, 'Install new electrical outlets', 'inspection', 200.00, 100.00, true
FROM service_categories WHERE name = 'Electrical'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Light Fixture Installation', id, 'Install ceiling or wall lights', 'inspection', 180.00, 80.00, true
FROM service_categories WHERE name = 'Electrical'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Circuit Breaker Repair', id, 'Fix or replace circuit breakers', 'inspection', 150.00, 150.00, true
FROM service_categories WHERE name = 'Electrical'
ON CONFLICT DO NOTHING;

-- Carpentry services
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Shelf Installation', id, 'Install floating or bracket shelves', 'inspection', 120.00, 60.00, true
FROM service_categories WHERE name = 'Carpentry'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Door Repair', id, 'Fix squeaky, stuck, or damaged doors', 'inspection', 100.00, 60.00, true
FROM service_categories WHERE name = 'Carpentry'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Door Installation', id, 'Install new interior or exterior doors', 'quote_after_inspection', NULL, 80.00, true
FROM service_categories WHERE name = 'Carpentry'
ON CONFLICT DO NOTHING;

-- HVAC services
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'AC Filter Change', id, 'Replace air conditioner filter', 'fixed', 40.00, NULL, true
FROM service_categories WHERE name = 'HVAC'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'AC Tune-up', id, 'Full air conditioning system inspection and tune-up', 'fixed', 150.00, NULL, true
FROM service_categories WHERE name = 'HVAC'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Thermostat Installation', id, 'Install new programmable or smart thermostat', 'inspection', 180.00, 80.00, true
FROM service_categories WHERE name = 'HVAC'
ON CONFLICT DO NOTHING;

-- Appliance services
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Washing Machine Repair', id, 'Repair or replace washing machine parts', 'inspection', 120.00, 80.00, true
FROM service_categories WHERE name = 'Appliance Repair'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Refrigerator Service', id, 'Repair ice maker, compressor, or thermostat', 'inspection', 150.00, 100.00, true
FROM service_categories WHERE name = 'Appliance Repair'
ON CONFLICT DO NOTHING;

-- Drywall & Painting
INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Drywall Patch', id, 'Repair small to medium drywall holes', 'inspection', 100.00, 50.00, true
FROM service_categories WHERE name = 'Drywall & Painting'
ON CONFLICT DO NOTHING;

INSERT INTO services (name, category_id, description, pricing_model, fixed_price, inspection_price, is_active)
SELECT 'Interior Painting', id, 'Paint interior walls and ceilings', 'quote_after_inspection', NULL, 100.00, true
FROM service_categories WHERE name = 'Drywall & Painting'
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 3. SERVICE OPTIONS (for professional/customer selection)
-- ────────────────────────────────────────────────────────────────

-- Urgency option (available for all services)
INSERT INTO service_options (name, type, option_group, is_required, display_order)
VALUES ('Priority Level', 'select', 'urgency', false, 1)
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 4. BRANDS & MATERIALS (for quote building)
-- ────────────────────────────────────────────────────────────────

INSERT INTO brands (name, description, price_category, is_active)
VALUES
  ('Standard', 'Budget-friendly options', 'budget', true),
  ('Premium', 'High-quality products', 'premium', true),
  ('Delta', 'Faucet brand', 'premium', true),
  ('Moen', 'Plumbing fixtures', 'premium', true),
  ('Kohler', 'Luxury fixtures', 'luxury', true)
ON CONFLICT DO NOTHING;

INSERT INTO materials (name, category, unit, price, brand_id, is_active)
SELECT 'PVC Pipe', 'plumbing', 'foot', 2.50, id, true
FROM brands WHERE name = 'Standard'
ON CONFLICT DO NOTHING;

INSERT INTO materials (name, category, unit, price, brand_id, is_active)
SELECT 'Copper Pipe', 'plumbing', 'foot', 5.00, id, true
FROM brands WHERE name = 'Premium'
ON CONFLICT DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 5. DEMO PROFESSIONALS
-- ────────────────────────────────────────────────────────────────
-- Note: These will be linked to actual auth.users created in signup flow
-- For now, using placeholder data that can be updated after auth users created

-- INSERT INTO professional_profiles (user_id, display_name, bio, rating, completed_jobs_count, verification_status)
-- VALUES
--   (... will be populated after creating auth users ...)
-- For MVP, professionals are created via signup flow

-- ────────────────────────────────────────────────────────────────
-- 6. DEMO PROPERTIES & ADDRESSES
-- ────────────────────────────────────────────────────────────────
-- These will be linked to actual auth.users (customers) created in signup
-- For now, placeholder data

-- INSERT INTO addresses (customer_id, street, city, state, zip_code, country)
-- INSERT INTO properties (customer_id, address_id, name, description)
-- For MVP, properties created via property form in UI

COMMIT;
```

**Note**: Full seed data is complex. This is the template. Execute these manually or expand as needed:

```bash
# After migration created, run:
supabase migration up
```

---

### Task 3.2: Populate via Supabase Studio UI
**Time**: 1 hour (Alternative if SQL feels risky)

1. Login to Supabase dashboard
2. Go to SQL Editor
3. Create new query for each table (services, brands, materials)
4. Insert demo data manually
5. Verify data appears in Table view

**Advantage**: Safer, visual feedback  
**Disadvantage**: Manual, slower

---

## PHASE 4: Implement Booking Flow (4-6 hours)

### Task 4.1: Create BookingWizard Component
**File**: `src/components/customer/BookingWizard.tsx`  
**Time**: 2 hours

[Full implementation will be detailed in next step]

### Task 4.2: Create /app/bookings/new Route
**File**: `src/app/app/bookings/new/page.tsx`  
**Time**: 1 hour

[Route handler and page component]

### Task 4.3: Wire "Book Service" Button
**File**: `src/app/app/services/[id]/page.tsx`  
**Time**: 30 minutes

Add button linking to `/app/bookings/new?service={id}`

### Task 4.4: Test Booking End-to-End
**Time**: 1 hour

[Manual testing checklist]

---

## PHASE 5: Job State Transitions (2-3 hours)

### Task 5.1: Create StateTransitionButtons Component
**File**: `src/components/professional/StateTransitionButtons.tsx`  
**Time**: 1 hour

### Task 5.2: Wire Buttons to updateJobState Server Action
**Time**: 45 minutes

### Task 5.3: Test State Transitions
**Time**: 30 minutes

---

## PHASE 6: Quote Management (5-6 hours)

[Detailed tasks for quote creation, approval, etc.]

---

## PHASE 7: Payment Integration with Razorpay (6-8 hours) ⚠️ REQUIRES SETUP

### Task 7.1: Setup Razorpay Account
**File**: Environment variables  
**Time**: 30 minutes

**Why Razorpay?**
- ✅ Operates in India with INR support
- ✅ Supports card, wallet, netbanking, UPI
- ✅ Lowest fees in India (~2%)
- ✅ Easy integration via Checkout modal
- ✅ Sandbox mode for testing

**Steps**:
1. Create account at https://razorpay.com
2. Verify business details
3. Navigate to **Settings → API Keys**
4. Copy **Key ID** (publishable) and **Key Secret** (private)
5. Navigate to **Settings → Webhooks**
6. Add webhook: `https://yourdomain.com/api/webhooks/razorpay`
7. Subscribe to events: `payment.authorized`, `payment.failed`
8. Copy **Webhook Secret**

**Add to .env.local**:
```env
# Razorpay (India)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXX
```

**Note**: Use `rzp_test_*` for development, `rzp_live_*` for production.

---

### Task 7.2: Create Razorpay Payment Adapter
**File**: `src/lib/payments/razorpay.ts`  
**Time**: 1.5 hours

```typescript
// src/lib/payments/razorpay.ts
import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

/**
 * Create a payment order in Razorpay
 * @param bookingId - Booking ID
 * @param amountInPaise - Amount in paise (1 INR = 100 paise)
 * @param customerEmail - Customer email
 * @param customerPhone - Customer phone
 * @returns Razorpay order object with order ID
 */
export async function createPaymentOrder(
  bookingId: string,
  amountInPaise: number,
  customerEmail: string,
  customerPhone: string
) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: amountInPaise, // in paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
      notes: {
        booking_id: bookingId,
        customer_email: customerEmail,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Razorpay API error: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Verify payment signature from Razorpay webhook
 * @param orderId - Order ID from Razorpay
 * @param paymentId - Payment ID from Razorpay
 * @param signature - Signature from webhook
 * @returns true if valid, false otherwise
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Payment ID
 * @returns Payment details object
 */
export async function getPaymentDetails(paymentId: string) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch payment: ${response.statusText}`)
  }

  return await response.json()
}
```

---

### Task 7.3: Build PaymentCheckout Component
**File**: `src/components/customer/PaymentCheckout.tsx`  
**Time**: 1.5 hours

```typescript
// src/components/customer/PaymentCheckout.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface PaymentCheckoutProps {
  bookingId: string
  amountInRupees: number
  onSuccess: () => void
  onError?: (error: string) => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentCheckout({ bookingId, amountInRupees, onSuccess, onError }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    // Fetch current user
    getCurrentUser().then(setUser)
  }, [])

  const handlePayment = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create order on server
      const orderResponse = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amountInRupees,
        }),
      })

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order')
      }

      const order = await orderResponse.json()

      // Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: 'INR',
        name: 'Fixify',
        description: `Booking #${bookingId}`,
        customer_id: user.id,
        prefill: {
          name: user.user_metadata?.full_name || '',
          email: user.email,
          contact: user.user_metadata?.phone || '',
        },
        handler: async (response: any) => {
          // Payment successful, verify on server
          try {
            const verifyResponse = await fetch('/api/payments/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId,
              }),
            })

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed')
            }

            onSuccess()
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Verification failed'
            setError(message)
            onError?.(message)
          }
        },
        modal: {
          ondismiss: () => {
            setError('Payment cancelled')
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-gray-600 text-sm">Total Amount</p>
        <p className="text-3xl font-bold">₹{amountInRupees.toFixed(2)}</p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Button onClick={handlePayment} disabled={loading} size="lg" className="w-full">
        {loading ? 'Processing...' : `Pay ₹${amountInRupees.toFixed(2)} with Razorpay`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Secure payment powered by Razorpay. Cards, UPI, NetBanking accepted.
      </p>
    </div>
  )
}
```

---

### Task 7.4: Create Webhook Handler
**File**: `src/app/api/webhooks/razorpay/route.ts`  
**Time**: 1.5 hours

```typescript
// src/app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/payments/razorpay'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, payload } = body

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature || !verifyWebhookSignature(JSON.stringify(body), signature, webhookSecret!)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle payment events
    if (event === 'payment.authorized' || event === 'payment.captured') {
      const { id: paymentId, order_id: orderId, amount, status } = payload.payment

      // Check for idempotency - has this payment already been processed?
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {},
        }
      )

      // Find booking by order receipt
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_payment_id', paymentId)
        .single()

      if (existingPayment) {
        // Already processed, return success (idempotent)
        return NextResponse.json({ received: true })
      }

      // Get payment details from Razorpay
      const paymentDetails = await getPaymentDetails(paymentId)

      // Extract booking ID from order receipt
      const bookingId = paymentDetails.receipt?.split('_')[1]

      if (!bookingId) {
        console.error('No booking ID found in payment receipt')
        return NextResponse.json({ error: 'No booking ID' }, { status: 400 })
      }

      // Create payment record
      const { error: paymentError } = await supabase.from('payments').insert({
        booking_id: bookingId,
        amount: amount / 100, // Convert from paise to rupees
        currency: 'INR',
        status: 'paid',
        provider: 'razorpay',
        provider_payment_id: paymentId,
        provider_order_id: orderId,
        provider_response: paymentDetails,
      })

      if (paymentError) {
        console.error('Error creating payment record:', paymentError)
        return NextResponse.json({ error: paymentError.message }, { status: 500 })
      }

      // Get booking to find job
      const { data: booking } = await supabase
        .from('bookings')
        .select('id, job_id, customer_id')
        .eq('id', bookingId)
        .single()

      if (booking?.job_id) {
        // Transition job state to COMPLETED
        await supabase.rpc('transition_job_state', {
          p_job_id: booking.job_id,
          p_new_state: 'COMPLETED',
          p_actor_id: booking.customer_id,
        })
      }

      // Send confirmation email
      try {
        await fetch('/api/emails/payment-received', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId,
            amount: amount / 100,
            paymentId,
          }),
        })
      } catch (emailErr) {
        console.error('Error sending email:', emailErr)
        // Don't fail webhook if email fails
      }

      return NextResponse.json({ received: true })
    }

    if (event === 'payment.failed') {
      const { id: paymentId, order_id: orderId } = payload.payment

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {},
        }
      )

      // Create payment record with failed status
      const { error: paymentError } = await supabase.from('payments').insert({
        provider_payment_id: paymentId,
        provider_order_id: orderId,
        status: 'failed',
        provider: 'razorpay',
        provider_response: payload.payment,
      })

      if (paymentError) {
        console.error('Error recording failed payment:', paymentError)
      }

      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Verify Razorpay webhook signature
 */
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}
```

---

### Task 7.5: Create Order Creation API Route
**File**: `src/app/api/payments/razorpay/create-order/route.ts`  
**Time**: 45 minutes

```typescript
// src/app/api/payments/razorpay/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createPaymentOrder } from '@/lib/payments/razorpay'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amountInRupees } = await request.json()

    if (!bookingId || !amountInRupees) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify booking belongs to user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {},
      }
    )

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_id, amount')
      .eq('id', bookingId)
      .single()

    if (!booking || booking.customer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify amount matches booking (prevent client-side price manipulation)
    if (booking.amount !== amountInRupees) {
      return NextResponse.json(
        { error: 'Amount mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Create Razorpay order (convert rupees to paise)
    const order = await createPaymentOrder(
      bookingId,
      Math.round(amountInRupees * 100), // Convert to paise
      user.email || '',
      user.user_metadata?.phone || ''
    )

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    )
  }
}
```

---

### Task 7.6: Create Payment Verification Route
**File**: `src/app/api/payments/razorpay/verify/route.ts`  
**Time**: 45 minutes

```typescript
// src/app/api/payments/razorpay/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/payments/razorpay'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature, bookingId } = await request.json()

    if (!orderId || !paymentId || !signature || !bookingId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify signature
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Get payment details from Razorpay
    const paymentDetails = await getPaymentDetails(paymentId)

    // Verify payment status is captured
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json({ error: 'Payment not captured' }, { status: 400 })
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {},
      }
    )

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_id, amount')
      .eq('id', bookingId)
      .single()

    if (!booking || booking.customer_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify amount matches (in rupees)
    const amountInRupees = paymentDetails.amount / 100
    if (booking.amount !== amountInRupees) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Check for duplicate payment (idempotency)
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_payment_id', paymentId)
      .single()

    if (existingPayment) {
      return NextResponse.json({ success: true, message: 'Payment already processed' })
    }

    // Create payment record
    const { error: paymentError, data: newPayment } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        amount: amountInRupees,
        currency: 'INR',
        status: 'paid',
        provider: 'razorpay',
        provider_payment_id: paymentId,
        provider_order_id: orderId,
        provider_response: paymentDetails,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, payment: newPayment })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
```

---

### Task 7.7: Test Razorpay Integration Locally
**Time**: 1 hour

**Test Mode** (Use `rzp_test_*` keys):
1. Create order via `/api/payments/razorpay/create-order`
2. Open Razorpay Checkout modal
3. Use test card: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., 12/25)
   - CVV: Any 3 digits (e.g., 123)
4. Complete payment
5. Verify webhook triggers
6. Check payment record in database

**Success Criteria**:
- [ ] Order created successfully
- [ ] Checkout modal displays
- [ ] Payment processed
- [ ] Webhook signature verified
- [ ] Payment record created with status "paid"
- [ ] Job state updated
- [ ] Confirmation email sent

**Common Issues**:
- `Invalid signature` → Check RAZORPAY_WEBHOOK_SECRET in .env
- `Order not found` → Verify order ID exists in Razorpay
- `Amount mismatch` → Ensure paise conversion is correct (1 INR = 100 paise)

---

## PHASE 8: Professional Verification (4-5 hours)

[Detailed tasks for document upload, admin review]

---

## PHASE 9: Admin Dashboard (6-8 hours or 4-5 for MVP)

[Detailed tasks for admin UI]

---

## PHASE 10: Notifications - Multi-Channel for India (3-4 weeks)

**Status**: India-optimized multi-channel strategy  
**Reference**: `docs/PHASE_10_NOTIFICATION_STRATEGY.md`  
**Priority**: HIGH (critical for customer retention)

### Phase 10 Strategy: WhatsApp + SMS + Email

**Market Reality for India** (Based on 2026 data):
- **WhatsApp**: 98% open rate, 850M+ users, read within 3 minutes ⭐ PRIMARY
- **SMS**: 90% open rate, universal (no app needed), ₹1-3 per message → FALLBACK
- **Email**: 20% open rate, for documents/compliance only → LAST RESORT

### Why This Approach?
- WhatsApp reaches 78% of Indian smartphone users instantly
- Email gets only 20-26% open rate in India (spam dump problem)
- SMS works universally but more expensive
- Combined = 99%+ reach with optimal cost-efficiency

### Task 10.1: WhatsApp Business Integration (2 hours)
```
□ Set up with Razorpay WhatsApp Business API
□ Register business phone number with Meta
□ Get business account verified
□ Create 5 message templates (get Meta approval):
  ├─ Job Assigned
  ├─ Professional Arrived  
  ├─ Quote Ready
  ├─ Payment Received
  └─ Job Completed
□ Set up webhook for delivery confirmation
□ Test with Razorpay test numbers
```

### Task 10.2: SMS Fallback (1.5 hours)
```
□ Choose provider (AWS SNS / MessageCentral)
□ Register with TRAI compliance (India law)
□ Register sender ID (Fixify)
□ Create urgent SMS templates:
  ├─ Payment Failed - Retry Link
  ├─ Professional Arriving Soon
  ├─ Cancellation Alert
  └─ High Priority Escalation
□ Configure DND list (automatic)
□ Test SMS delivery
```

### Task 10.3: Customer Preferences (1.5 hours)
```sql
ALTER TABLE customer_profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
  "whatsapp_enabled": true,
  "sms_enabled": true,
  "email_enabled": true,
  "do_not_disturb_start": "19:00",
  "do_not_disturb_end": "09:00"
}';
```

UI Components:
- WhatsApp toggle + verification
- SMS toggle + opt-out
- Email (required for compliance)
- Do Not Disturb time picker

### Task 10.4: Multi-Channel Service (2 hours)
```typescript
sendNotification(customerId, type, data):
  1. Get customer preferences
  2. Try channels in order:
     a) WhatsApp (if enabled & verified)
     b) SMS (if enabled & phone exists)
     c) Email (if enabled & email exists)
  3. Respect Do Not Disturb hours
  4. Log all attempts
  5. Return success/failure
```

Intelligent fallback: If WhatsApp fails, automatically tries SMS, then email.

### Task 10.5: Notification Logs Database (1 hour)
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY,
  customer_id UUID,
  notification_type TEXT, -- job_assigned, payment, etc.
  primary_channel TEXT, -- whatsapp, sms, email
  status TEXT, -- sent, failed, pending
  sent_via TEXT, -- which channel actually delivered
  external_id TEXT, -- Provider's message ID
  created_at TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP
);

-- Track every notification attempt for compliance & debugging
```

### Task 10.6: Preference UI (1 hour)
```
Customer Settings Screen:
├─ 📱 WhatsApp (Primary) - Toggle + Verified badge
├─ 📞 SMS (Backup) - Toggle + Warning if disabled
├─ 📧 Email (Required) - Fixed ON + Compliance note
├─ 🕐 Do Not Disturb - From/To time picker
└─ 🧪 Send Test Notification button
```

### Task 10.7: Templates (45 min)
```
WhatsApp Templates (Meta-approved):
1. Job Assigned: "Hi {{name}}, {{professional}} assigned to {{service}}"
2. Arrived: "{{professional}} arrived at {{address}}"
3. Quote: "Quote ready! ₹{{amount}} for {{service}}"
4. Payment: "✅ ₹{{amount}} received! Invoice: {{id}}"
5. Complete: "🎉 {{service}} complete! [Leave Review]"

SMS Templates (TRAI-compliant):
1. Payment failed: "Payment failed. Retry: {{link}}"
2. Urgent: "{{professional}} arriving in {{mins}} min"
3. Cancel: "Booking cancelled by professional"
```

### Task 10.8: Testing (1 hour)
```
□ Send WhatsApp (verify delivered in <3 min)
□ Send SMS (verify delivered)
□ Send Email (verify PDF attached)
□ Test fallback logic (one fails → tries next)
□ Test DND (no messages during 7 PM - 9 AM)
□ Test preferences (only enabled channels used)
□ Load test (100+ concurrent)
□ Monitor logs (all attempts recorded)
```

### Task 10.9: Monitoring (45 min)
```
Track Metrics:
- WhatsApp delivery rate (target: >99%)
- SMS delivery rate (target: >98%)
- Email delivery rate (target: >95%)
- Average delivery time (target: <2 sec)
- Channel usage % (WhatsApp 85%, SMS 10%, Email 5%)

Alerts:
□ Delivery rate drops below threshold
□ Lag exceeds 5 seconds
□ >1% failure rate
```

### Success Metrics for Phase 10
- ✅ 85%+ customer adoption of WhatsApp
- ✅ 3-minute average read time (vs 90+ for email)
- ✅ 10%+ SMS usage (urgent only)
- ✅ 5% email usage (documents)
- ✅ 99%+ delivery uptime
- ✅ 100% TRAI/DPDP compliance

### Implementation Timeline
```
Week 1: WhatsApp API setup + database schema
Week 2: Multi-channel service + UI
Week 3: SMS integration + testing
Week 4: Monitoring + go-live

Total: 3-4 weeks, 2-3 developers
```

---

## Testing Checklist

### Unit Tests
- [ ] `getAssignedJobs()` returns only professional's jobs
- [ ] `createBooking()` validates amount matches service
- [ ] `transition_job_state()` blocks invalid transitions
- [ ] `approveQuote()` only allowed by customer who owns property

### Integration Tests
- [ ] E2E: Signup → Create property → Browse services → Book → Accept → Complete
- [ ] E2E: Professional registers → Gets verified → Accepts job
- [ ] E2E: Payment webhook → Job marked paid → Invoice generated

### RLS Tests
- [ ] Customer A cannot read Customer B's properties
- [ ] Professional A cannot read Professional B's profile
- [ ] Customer cannot modify job state
- [ ] Audit logs cannot be modified by anyone

### Security Tests
- [ ] Service-role key not in browser console
- [ ] Payment webhook signature verified
- [ ] Prices not trusted from client input
- [ ] Admin-only operations blocked for non-admin

---

## Deployment Checklist

- [ ] All migrations applied
- [ ] RLS policies verified (no data leaks)
- [ ] Environment variables set correctly
- [ ] Payment provider webhook configured
- [ ] Email service configured
- [ ] Database backups enabled
- [ ] Logging/monitoring setup
- [ ] SSL certificate valid
- [ ] CORS correctly configured
- [ ] Rate limiting configured
- [ ] Database indexes analyzed
- [ ] Performance testing passed

---

## Rollback Plan

If a phase encounters blockers:

1. **Revert migration**: `supabase migration down`
2. **Revert code**: `git revert <commit>`
3. **Diagnose**: Check error logs, consult docs
4. **Fix**: Update code/SQL, test locally
5. **Re-apply**: `supabase migration up`, deploy code

---

## Communication Checklist

- [ ] Share roadmap with team
- [ ] Daily standup on progress
- [ ] Weekly blockers review
- [ ] Client demos after Phase 4, Phase 7, Phase 9
- [ ] Security review before launch
- [ ] Stakeholder sign-off

---

**End of Implementation Tasks**  
**Next Step**: Execute Phase 1 immediately, then follow the roadmap sequentially.


---

## PHASE 7-UPI: UPI Payment Integration (12-16 hours)

**Status**: Critical for India market (Deadline: Feb 28, 2026)  
**Prerequisite**: Phase 7 Razorpay integration complete  
**Sprint Structure**: 3 sprints (4-5 hrs each)  
**Documentation**: See `docs/UPI_INTEGRATION_GUIDE.md`, `docs/UPI_QR_CODES.md`, `docs/UPI_COMPLIANCE_CHECKLIST.md`

### Phase 7-UPI Sprint 1: UPI Intent Flow (Primary Method)
**Duration**: 4-5 hours | **Target**: Jan 15, 2026

#### Task 7-UPI-1.1: Database Migration for UPI Fields
**File**: `supabase/migrations/20261001_007_upi_payment_fields.sql`  
**Time**: 30 minutes

Add UPI-specific fields to payments table:
- `upi_vpa TEXT` — Virtual Payment Address
- `upi_app TEXT` — App used (googlepay, phonepe, paytm)
- `upi_ref_id TEXT` — UPI transaction reference
- `upi_rrn TEXT` — Retrieval Reference Number
- `attempt_count INT` — Payment retry tracking
- `last_attempt_at TIMESTAMP` — Last retry timestamp
- `next_retry_at TIMESTAMP` — Next scheduled retry

Create `upi_qr_codes` table with:
- `razorpay_qr_id TEXT UNIQUE`
- `type TEXT` — 'static' or 'dynamic'
- `image_url TEXT`
- `amount INT` — NULL for static QR
- `status TEXT` — 'active', 'closed', 'expired', 'paid'

**Verification**:
```bash
supabase migration up
# Verify columns exist
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='payments' AND column_name LIKE 'upi%';"
```

#### Task 7-UPI-1.2: Server Action - createUPIIntentPayment
**File**: `src/lib/payments/createUPIIntentPayment.ts`  
**Time**: 1 hour

Requirements:
- Validate job ownership (customer_id matches auth.uid())
- Verify amount matches quote (server-side only, not from client)
- Create Razorpay order via API
- Store payment record in database with razorpay_order_id
- Return order details + Razorpay key for client

Security Checks:
- ✅ Amount verified against database quote
- ✅ Authorization check (customer owns job)
- ✅ Error handling with no payment data in logs
- ✅ Idempotency (store order_id, don't create duplicate)

**Test Cases**:
- [ ] Payment created for valid job + customer
- [ ] Rejected if customer doesn't own job
- [ ] Rejected if amount mismatches
- [ ] Returns order_id from Razorpay

#### Task 7-UPI-1.3: Client Component - UPIIntentCheckout
**File**: `src/components/customer/UPIIntentCheckout.tsx`  
**Time**: 1 hour

Features:
- Load Razorpay checkout.js dynamically
- Set payment method: `{ upi: true }`
- Handle callback_url redirect
- Show loading state during payment
- Display clear error messages
- Success/failure callbacks

**Test Cases**:
- [ ] Checkout modal opens
- [ ] UPI method selected
- [ ] Payment button functional
- [ ] Loading state shows
- [ ] Error messages display

#### Task 7-UPI-1.4: Handle Payment Callback
**File**: `src/lib/payments/handleUPICallback.ts`  
**Time**: 45 minutes

Workflow:
1. Verify Razorpay signature (HMAC-SHA256)
2. Check idempotency (no duplicate processing)
3. Fetch payment from Razorpay (verify on provider)
4. Update payment status → COMPLETED
5. Transition job state → COMPLETED
6. Create invoice
7. Send confirmation email/SMS
8. Audit log entry

Security (Critical):
```typescript
// 1. Signature verification
const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET)
  .update(`${orderId}|${paymentId}`).digest('hex')
if (expectedSig !== receivedSig) throw Error('Invalid signature')

// 2. Idempotency
const existing = await db.payments.find({razorpay_payment_id: paymentId})
if (existing?.status === 'completed') return { already_processed: true }

// 3. Provider verification
const provider = await razorpay.payments.fetch(paymentId)
if (!['authorized', 'captured'].includes(provider.status)) throw Error('Invalid status')

// 4. Authorization
if (payment.amount !== providerAmount) throw Error('Amount mismatch')
```

**Test Cases**:
- [ ] Valid callback processes successfully
- [ ] Invalid signature rejected (401)
- [ ] Duplicate webhooks handled (idempotent)
- [ ] Amount verified
- [ ] Job state transitions
- [ ] Invoice created

#### Task 7-UPI-1.5: Webhook Endpoint
**File**: `src/app/api/webhooks/razorpay/route.ts`  
**Time**: 30 minutes

Receive Razorpay webhooks:
- POST endpoint at `/api/webhooks/razorpay`
- Verify signature header: `x-razorpay-signature`
- Process events: `payment.authorized`, `payment.captured`, `payment.failed`
- Return 200 OK immediately (async processing)
- Handle errors gracefully (return 500, let Razorpay retry)

**Test Cases**:
- [ ] Accepts POST requests
- [ ] Verifies signatures
- [ ] Rejects invalid signatures (401)
- [ ] Processes valid webhooks
- [ ] Returns 200 OK

#### Task 7-UPI-1.6: Environment Variables
**File**: `.env.example`  
**Time**: 15 minutes

Add variables:
```env
# Razorpay - UPI Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXX    # Public (safe)
RAZORPAY_KEY_SECRET=xxxxx                      # Private (SECRET)
RAZORPAY_WEBHOOK_SECRET=xxxxx                  # Webhook secret (SECRET)

# UPI Configuration
UPI_MAX_TRANSACTION_AMOUNT=10000000   # ₹1,00,000 in paise (RBI limit)
UPI_RETRY_MAX_ATTEMPTS=3
UPI_RETRY_INITIAL_DELAY_MS=300000    # 5 minutes
UPI_RETRY_BACKOFF_MULTIPLIER=2
```

**Verification**:
- [ ] .env.local has all variables
- [ ] .env.example updated
- [ ] No secrets in .env.example
- [ ] Secrets never in NEXT_PUBLIC_*

#### Task 7-UPI-1.7: Payment Method Selector UI
**File**: `src/components/customer/PaymentMethodSelector.tsx`  
**Time**: 1 hour

Display options:
1. **UPI (Recommended)** — 92-95% success, show indicator
2. **Card** — Visa/MasterCard
3. **Net Banking** — Direct transfer

Features:
- Tab-like selector
- Visual indication of recommended method
- Success rate badge
- Clear descriptions

#### Task 7-UPI-1.8: Integration Tests
**File**: `tests/upi-intent.e2e.test.ts`  
**Time**: 1 hour

Test scenarios:
- [ ] Order created successfully
- [ ] Rejected if unauthorized customer
- [ ] Rejected if amount mismatches
- [ ] Webhook processes correctly
- [ ] Idempotency works (duplicate webhooks)
- [ ] Job state transitions to COMPLETED
- [ ] Invoice created
- [ ] Confirmation email sent

Run: `npm run test -- tests/upi-intent.e2e.test.ts`

---

### Phase 7-UPI Sprint 2: QR Codes & Turbo UPI (4-5 hours)
**Target**: Jan 20 - Feb 5, 2026

#### Task 7-UPI-2.1: Generate Dynamic QR Codes
**File**: `src/lib/payments/generateDynamicQR.ts`  
**Time**: 45 minutes

For each invoice:
- Call `Razorpay.qrCode.create({ amount, single_use: true })`
- Store razorpay_qr_id + image_url in database
- Embed in invoice PDF
- Send QR image in email

See `docs/UPI_QR_CODES.md` for full implementation.

#### Task 7-UPI-2.2: QR Display Component
**File**: `src/components/payments/QRCodeDisplay.tsx`  
**Time**: 45 minutes

Display QR code image with:
- Amount (for dynamic QR)
- Instructions ("Scan with Google Pay...")
- Download QR button
- Copy UPI link button

#### Task 7-UPI-2.3: Invoice with Embedded QR
**File**: `src/lib/payments/createInvoiceWithQR.ts`  
**Time**: 1 hour

Workflow:
1. Create invoice record
2. Generate dynamic QR code
3. Upload QR image to Supabase Storage
4. Generate PDF with embedded QR
5. Send email with QR attachment/image

#### Task 7-UPI-2.4: Turbo UPI Setup (Pending Approval)
**Time**: 30 minutes (ongoing)

Steps:
1. [ ] Submit Turbo UPI application to Razorpay
2. [ ] Wait for approval (2-4 weeks)
3. [ ] Once approved, implement:
   - `src/lib/payments/createTurboUPIPayment.ts`
   - `src/components/customer/TurboUPICheckout.tsx`

---

### Phase 7-UPI Sprint 3: Google Pay & Compliance (3-4 hours)
**Target**: Feb 6 - Feb 20, 2026

#### Task 7-UPI-3.1: Google Pay Intent
**File**: `src/lib/payments/createGooglePayIntent.ts`  
**Time**: 45 minutes

Detect and show Google Pay for:
- Android devices
- Chrome browser (v56+)
- Fallback to UPI Intent for others

#### Task 7-UPI-3.2: Retry Logic & Error Recovery
**File**: `src/lib/payments/retryPayment.ts`  
**Time**: 45 minutes

Retry strategy:
- Max 3 attempts
- Delays: 5min → 15min → 30min (exponential backoff)
- Offer manual retry for customer
- Fallback to card payment after 3 failures

#### Task 7-UPI-3.3: Compliance Verification
**File**: `docs/UPI_COMPLIANCE_CHECKLIST.md` (complete verification)  
**Time**: 1 hour

Verify:
- [ ] 2FA enforcement (April 1, 2026 onwards)
- [ ] Transaction limit validation (₹1,00,000)
- [ ] NPCI/RBI guidelines implemented
- [ ] PCI DSS v4.0.1 requirements met
- [ ] DPDP Act data localization
- [ ] Webhook signature verification working
- [ ] No payment data in logs
- [ ] RLS policies verified

#### Task 7-UPI-3.4: Monitoring Setup
**File**: `src/lib/analytics/paymentMetrics.ts`  
**Time**: 45 minutes

Track metrics:
- Success rate by method (target: >95%)
- Average completion time (target: <3 min)
- Error rate (target: <1%)
- Webhook lag (target: <10 sec)
- Refund processing time

Alerts:
- Success rate drops below 85%
- Webhook lag >30 seconds
- Error rate >5%

#### Task 7-UPI-3.5: End-to-End Testing
**File**: `tests/upi-complete.e2e.test.ts`  
**Time**: 1 hour

Test all flows:
- [ ] UPI Intent: Success → Job Completed → Invoice
- [ ] UPI Intent: Failure → Retry → Success
- [ ] QR Code: Scan → Payment → Invoice
- [ ] Google Pay: Android Chrome only
- [ ] Webhook idempotency
- [ ] Limit validation
- [ ] 2FA enforcement (post-April)

---

### Phase 7-UPI Pre-Launch Checklist (Feb 27, 2026)

Security & Compliance:
- [ ] Webhook signature verification working
- [ ] Idempotency verified (no duplicate processing)
- [ ] 2FA enforcement enabled (April 1, 2026)
- [ ] Transaction limit enforced (₹1,00,000)
- [ ] RLS policies verified on payments table
- [ ] No payment data in logs/error messages
- [ ] Service-role key never in browser
- [ ] DPDP Act compliance verified
- [ ] PCI DSS v4.0.1 requirements met

Performance:
- [ ] Load test: 100+ concurrent payments
- [ ] Webhook processing: <10 seconds
- [ ] Payment creation: <100ms p99
- [ ] Database indexes optimized
- [ ] Caching strategy implemented

Operations:
- [ ] Monitoring & alerting configured
- [ ] Incident response playbook created
- [ ] Support team trained
- [ ] Runbooks documented
- [ ] Backup/restore tested

Documentation:
- [ ] UPI_INTEGRATION_GUIDE.md complete
- [ ] UPI_QR_CODES.md complete
- [ ] UPI_COMPLIANCE_CHECKLIST.md verified
- [ ] UPI_PAYMENT_FLOW_DIAGRAM.md created
- [ ] Error codes documented
- [ ] Support FAQ created

---

### Phase 7-UPI Success Metrics

**Target Performance**:
- ✅ 92-95% UPI payment success rate
- ✅ <10 second webhook processing
- ✅ <100ms payment creation latency (p99)
- ✅ 99.9% platform uptime
- ✅ Zero security incidents
- ✅ 100% NPCI/RBI compliant

**Business Metrics**:
- ✅ 60%+ of payments via UPI (vs card 30%, other 10%)
- ✅ <1% dispute rate
- ✅ <0.5% refund rate
- ✅ Customer satisfaction >4.5/5

