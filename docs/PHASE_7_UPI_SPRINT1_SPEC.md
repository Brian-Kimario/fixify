# Fixify Phase 7-UPI Sprint 1: UPI Intent Payment Integration

**Status**: Ready for implementation  
**Deadline**: February 28, 2026 (UPI Collect deprecated by NPCI)  
**Estimated effort**: 4–5 hours  
**References**: `docs/UPI_QUICK_START.md`, `docs/UPI_INTEGRATION_GUIDE.md`

---

## Context

Fixify serves the India market. UPI is ~60% of Indian digital payments. Razorpay's UPI Intent method (92–95% success rate) is the target. The UPI Collect method is deprecated by NPCI on **Feb 28, 2026** — this is a hard technical deadline, not a feature priority.

Sprint 1 covers one complete, vertically sliced flow: customer pays a job via UPI Intent, webhook processes the event, job transitions to `completed`, invoice is created. No QR codes, Turbo UPI, or Google Pay yet — those are Sprint 2/3.

---

## Pre-conditions

These must be true before implementation starts:

1. Job `current_state` is `completed` (professional has already marked it complete via Phase 5).
2. An approved `quote` record exists for the job with `status = 'approved'` (Phase 6 pre-condition; Sprint 1 must handle the absence gracefully until Phase 6 is done — see Amount Resolution section).
3. `transition_job_state()` DB function exists. ✅ (Migration 004)
4. `payments` table exists with RLS. ✅ (Migration 004)
5. Razorpay test account and keys are available.

---

## Architecture: Data Flow

```
Customer visits /customer/bookings/[id]
         │
         │  clicks "Pay Now" (only shown when booking_status = 'completed' 
         │  and no paid payment exists)
         ▼
createUPIIntentPayment() — server action
         │  1. authenticates user
         │  2. loads job + quote amount from DB (NEVER from client)
         │  3. verifies customer owns the job
         │  4. calls Razorpay Orders API
         │  5. inserts payment record (status = 'pending')
         │  6. returns { order_id, key_id, payment_db_id, amount }
         ▼
UPIIntentCheckout — client component
         │  loads Razorpay checkout.js on demand
         │  opens checkout with method: { upi: true }
         │  on dismiss → shows error state
         ▼
Customer completes payment in UPI app
         ▼
Razorpay fires webhook → POST /api/webhooks/razorpay
         │  1. verifies HMAC-SHA256 signature
         │  2. checks idempotency (already processed?)
         │  3. updates payment status → 'paid'
         │  4. transitions job → 'closed' via RPC
         │  5. creates invoice record
         │  6. returns 200 OK
         ▼
Customer redirected to /customer/payments/result/[payment_db_id]
         │  polls or reads payment status from DB
         │  shows success or failure
```

---

## Task Breakdown

### Task 1 — Environment Setup (10 min)

Add to `.env.local`:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

**Important**: `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must **never** have the `NEXT_PUBLIC_` prefix. They are server-only. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is publishable (it only identifies the merchant, not authorizes requests).

---

### Task 2 — Database Migration (20 min)

**File**: `supabase/migrations/20261002_001_upi_payment_fields.sql`

Extend the `payments` table with UPI-specific tracking columns. Also add the missing Razorpay reference columns the rest of the flow depends on, and the performance indexes from the integration guide.

```sql
-- MIGRATION: Add UPI payment fields and Razorpay tracking columns
-- Sprint 1: UPI Intent Flow

-- Razorpay order/payment identifiers (used for idempotency and webhook matching)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT UNIQUE;

-- UPI-specific fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS upi_vpa           TEXT,   -- e.g. user@oksbi
  ADD COLUMN IF NOT EXISTS upi_app           TEXT,   -- googlepay | phonepe | paytm
  ADD COLUMN IF NOT EXISTS upi_ref_id        TEXT,   -- UPI transaction reference
  ADD COLUMN IF NOT EXISTS upi_rrn           TEXT;   -- Retrieval Reference Number (from acquirer_data)

-- Retry tracking
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS attempt_count     INT  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_retry_at     TIMESTAMPTZ;

-- Payment method label (differentiates upi_intent from future card, netbanking, etc.)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method    TEXT DEFAULT 'upi_intent',
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

-- Indexes for webhook handler lookups (O(1) on incoming webhook)
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON public.payments (razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON public.payments (razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON public.payments (status, created_at DESC);
```

**After creating the file**, apply it:

```bash
supabase db push
# or
supabase migration up
```

Verify in the Supabase dashboard → Table Editor → `payments` that the new columns exist.

---

### Task 3 — Install Razorpay SDK (5 min)

```bash
pnpm add razorpay@2.9.2
pnpm add -D @types/razorpay@1.1.0
```

Pin exact versions. The `razorpay` package is the official Razorpay Node.js SDK.

---

### Task 4 — Server Action: createUPIIntentPayment (45 min)

**File**: `src/lib/payments/createUPIIntentPayment.ts`

```typescript
'use server';

import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_SECRET     ? process.env.RAZORPAY_KEY_ID!  : (() => { throw new Error('RAZORPAY_KEY_ID missing') })(),
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? (() => { throw new Error('RAZORPAY_KEY_SECRET missing') })(),
});
```

Wait — initialize outside the function so it fails at startup, not at runtime:

```typescript
'use server';

import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

// Fail loudly at startup if secrets are missing — not silently at payment time
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// ── Types ──

export interface CreateUPIIntentResult {
  success: true;
  order_id: string;
  amount: number;       // paise
  currency: 'INR';
  key_id: string;
  payment_db_id: string;
  customer_name: string;
  customer_phone: string | null;
}

export interface CreateUPIIntentError {
  success: false;
  error: string;
}

export type CreateUPIIntentResponse = CreateUPIIntentResult | CreateUPIIntentError;

// ── Amount resolution ──────────────────────────────────────────────────────────
//
// Amount priority (server-authoritative, per security.md §1.1 and §4):
//   1. Approved quote total (Phase 6 — quote_after_inspection pricing model)
//   2. booking.quoted_or_base_amount (fixed / inspection pricing models)
//   3. Error — never proceed without a server-verified amount
//
async function resolvePayableAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string
): Promise<{ amountPaise: number; sourceDescription: string }> {
  // Try approved quote first
  const { data: quote } = await supabase
    .from('quotes')
    .select('total, status')
    .eq('job_id', jobId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (quote) {
    const amountPaise = Math.round(Number(quote.total) * 100);
    if (amountPaise <= 0) throw new Error('Quote total must be greater than zero.');
    return { amountPaise, sourceDescription: 'approved quote' };
  }

  // Fall back to booking base amount (fixed/inspection pricing models)
  const { data: booking } = await supabase
    .from('bookings')
    .select('quoted_or_base_amount, pricing_model')
    .eq('id', (
      await supabase
        .from('jobs')
        .select('booking_id')
        .eq('id', jobId)
        .single()
    ).data?.booking_id ?? '')
    .single();

  if (booking?.quoted_or_base_amount && Number(booking.quoted_or_base_amount) > 0) {
    const amountPaise = Math.round(Number(booking.quoted_or_base_amount) * 100);
    return { amountPaise, sourceDescription: `booking base amount (${booking.pricing_model})` };
  }

  throw new Error(
    'No payable amount found. The job must have either an approved quote or a fixed booking amount.'
  );
}

// ── Main action ────────────────────────────────────────────────────────────────

export async function createUPIIntentPayment(
  jobId: string
): Promise<CreateUPIIntentResponse> {
  const supabase = await createClient();

  // 1. Authenticate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated. Please sign in.' };
  }

  // 2. Load job — verify customer ownership (never trust client-submitted id alone)
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, current_state, customer_id, booking_id')
    .eq('id', jobId)
    .single();

  if (jobError || !job) {
    return { success: false, error: 'Job not found or access denied.' };
  }

  if (job.customer_id !== user.id) {
    return { success: false, error: 'You are not authorized to pay for this job.' };
  }

  // 3. Check job state — payment is only valid for completed jobs
  if (job.current_state !== 'completed') {
    return {
      success: false,
      error: `Payment is only available for completed jobs. Current state: ${job.current_state}.`,
    };
  }

  // 4. Check idempotency — don't create a second order if one already exists for this job
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status, razorpay_order_id')
    .eq('job_id', jobId)
    .in('status', ['pending', 'paid'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingPayment?.status === 'paid') {
    return { success: false, error: 'This job has already been paid.' };
  }

  // If a pending order already exists and it has an order_id, reuse it
  if (existingPayment?.status === 'pending' && existingPayment.razorpay_order_id) {
    const profile = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();
    // Resolve amount for display
    let amountPaise: number;
    try {
      ({ amountPaise } = await resolvePayableAmount(supabase, jobId));
    } catch {
      amountPaise = 0;
    }
    return {
      success: true,
      order_id:       existingPayment.razorpay_order_id,
      amount:         amountPaise,
      currency:       'INR',
      key_id:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      payment_db_id:  existingPayment.id,
      customer_name:  profile.data?.full_name  ?? 'Customer',
      customer_phone: profile.data?.phone      ?? null,
    };
  }

  // 5. Resolve authoritative amount from DB
  let amountPaise: number;
  try {
    ({ amountPaise } = await resolvePayableAmount(supabase, jobId));
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not determine payment amount.',
    };
  }

  // RBI limit: single UPI transaction ≤ ₹1,00,000
  const RBI_MAX_PAISE = 100_000 * 100;
  if (amountPaise > RBI_MAX_PAISE) {
    return {
      success: false,
      error: 'Amount exceeds the RBI per-transaction UPI limit of ₹1,00,000. Please contact support.',
    };
  }

  // 6. Load customer profile for Razorpay prefill
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, email:auth_user_email')
    .eq('id', user.id)
    .single();

  // 7. Create Razorpay order
  let razorpayOrder: Awaited<ReturnType<typeof razorpay.orders.create>>;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `job_${jobId.slice(0, 24)}`,  // receipt ≤ 40 chars
      notes: {
        job_id:      jobId,
        customer_id: user.id,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Razorpay order creation failed.';
    return { success: false, error: `Payment provider error: ${msg}` };
  }

  // 8. Persist payment record (pending) — this is the idempotency anchor
  const { data: payment, error: paymentInsertError } = await supabase
    .from('payments')
    .insert({
      customer_id:       user.id,
      job_id:            jobId,
      payment_type:      'service',
      payment_method:    'upi_intent',
      amount:            amountPaise / 100,   // store in rupees (schema is numeric(10,2))
      currency:          'INR',
      provider:          'razorpay',
      provider_reference: razorpayOrder.id,   // Razorpay order_id as initial reference
      razorpay_order_id: razorpayOrder.id,
      status:            'pending',
      attempt_count:     1,
      last_attempt_at:   new Date().toISOString(),
    })
    .select('id')
    .single();

  if (paymentInsertError || !payment) {
    return {
      success: false,
      error: `Failed to record payment: ${paymentInsertError?.message ?? 'unknown error'}`,
    };
  }

  return {
    success:        true,
    order_id:       razorpayOrder.id,
    amount:         amountPaise,
    currency:       'INR',
    key_id:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    payment_db_id:  payment.id,
    customer_name:  profile?.full_name  ?? 'Customer',
    customer_phone: profile?.phone      ?? null,
  };
}
```

**Key decisions in this file**:
- Amount is always resolved from DB (quote → booking), never from client params.
- Existing pending order with a valid `razorpay_order_id` is reused (idempotency for page refreshes).
- A payment with `status = 'paid'` blocks a second order.
- RBI ₹1,00,000 per-transaction limit is checked server-side.
- `provider_reference` column (which the existing schema requires to be `UNIQUE`) is set to the Razorpay `order_id` initially; the webhook updates it to the `payment_id` once captured.

---

### Task 5 — Client Component: UPIIntentCheckout (45 min)

**File**: `src/components/customer/UPIIntentCheckout.tsx`

This is a `'use client'` component. It never calls Razorpay directly — it calls the server action to get an order, then opens the Razorpay checkout JS SDK.

```typescript
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { createUPIIntentPayment } from '@/lib/payments/createUPIIntentPayment';
import type { CreateUPIIntentResult } from '@/lib/payments/createUPIIntentPayment';

// Minimal Razorpay window type — avoid importing third-party types in a client bundle
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { name?: string; contact?: string };
  method?: { upi?: boolean; card?: boolean; netbanking?: boolean; wallet?: boolean };
  theme?: { color?: string };
  timeout?: number;
  redirect?: boolean;
  callback_url?: string;
  modal?: { ondismiss?: () => void; escape?: boolean };
}

interface UPIIntentCheckoutProps {
  jobId: string;
  /** Display amount in rupees — for showing to the user while the server action runs */
  displayAmountRupees: number;
}

type CheckoutState =
  | { phase: 'idle' }
  | { phase: 'creating' }           // calling server action
  | { phase: 'awaiting_payment' }   // Razorpay modal open
  | { phase: 'error'; message: string }
  | { phase: 'dismissed' };         // user closed modal without paying

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === 'function') {
      resolve();
      return;
    }
    const existing = document.getElementById('razorpay-checkout-js');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK. Check your connection.'));
    document.head.appendChild(script);
  });
}

export function UPIIntentCheckout({ jobId, displayAmountRupees }: UPIIntentCheckoutProps) {
  const [state, setState] = useState<CheckoutState>({ phase: 'idle' });
  const [isPending, startTransition] = useTransition();
  // Track the last successful order so we can reuse it on retry without re-calling the server action
  const orderRef = useRef<CreateUPIIntentResult | null>(null);

  // Pre-load the Razorpay script on mount (not on click) to reduce latency at payment time
  useEffect(() => {
    loadRazorpayScript().catch(() => {
      // Non-fatal: will retry on click
    });
  }, []);

  function openRazorpayModal(order: CreateUPIIntentResult) {
    orderRef.current = order;
    setState({ phase: 'awaiting_payment' });

    const options: RazorpayOptions = {
      key:         order.key_id,
      order_id:    order.order_id,
      amount:      order.amount,
      currency:    order.currency,
      name:        'Fixify',
      description: `Payment for Job #${jobId.slice(0, 8)}`,
      prefill: {
        name:    order.customer_name,
        contact: order.customer_phone ?? undefined,
      },
      method: {
        upi:        true,
        card:       false,
        netbanking: false,
        wallet:     false,
      },
      theme: { color: '#176B5B' },
      timeout: 300,   // 5 minutes — UPI Intent needs time for app redirect
      redirect: true,
      callback_url: `/customer/payments/result/${order.payment_db_id}`,
      modal: {
        escape: true,
        ondismiss: () => setState({ phase: 'dismissed' }),
      },
    };

    try {
      new window.Razorpay(options).open();
    } catch {
      setState({ phase: 'error', message: 'Could not open payment screen. Please try again.' });
    }
  }

  async function handlePayNow() {
    setState({ phase: 'creating' });

    try {
      await loadRazorpayScript();
    } catch (err) {
      setState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Could not load payment SDK.',
      });
      return;
    }

    startTransition(async () => {
      const result = await createUPIIntentPayment(jobId);

      if (!result.success) {
        setState({ phase: 'error', message: result.error });
        return;
      }

      openRazorpayModal(result);
    });
  }

  function handleRetry() {
    // If we already have a valid order (e.g., user dismissed and wants to retry),
    // reopen the same order without hitting the server again
    if (orderRef.current) {
      openRazorpayModal(orderRef.current);
    } else {
      setState({ phase: 'idle' });
    }
  }

  const formattedAmount = displayAmountRupees.toLocaleString('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const isLoading = state.phase === 'creating' || isPending || state.phase === 'awaiting_payment';

  return (
    <div className="space-y-3">
      {/* Error state */}
      {state.phase === 'error' && (
        <div
          role="alert"
          className="flex items-start gap-2.5 px-4 py-3 bg-[#F5E6E6] border border-[#DFC0C0] rounded-xl text-sm text-[#9B3535]"
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{state.phase === 'error' ? state.message : ''}</span>
        </div>
      )}

      {/* Dismissed state */}
      {state.phase === 'dismissed' && (
        <div
          role="status"
          className="flex items-start gap-2.5 px-4 py-3 bg-[#FFF4E0] border border-[#E8D5A3] rounded-xl text-sm text-[#9B6700]"
        >
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Payment was not completed. Tap the button below to try again.
        </div>
      )}

      {/* CTA button */}
      {state.phase === 'dismissed' ? (
        <button
          type="button"
          onClick={handleRetry}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#176B5B] hover:bg-[#0D5144] text-white font-bold text-sm rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
        >
          Try Again — {formattedAmount}
        </button>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={handlePayNow}
          aria-busy={isLoading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#176B5B] hover:bg-[#0D5144] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B5B] focus-visible:ring-offset-2"
        >
          {state.phase === 'creating' || isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path className="opacity-25" d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                <path className="opacity-75" d="M12 2a10 10 0 0 0-10 10" strokeLinecap="round"/>
              </svg>
              Creating order…
            </>
          ) : state.phase === 'awaiting_payment' ? (
            <>
              <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path className="opacity-25" d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                <path className="opacity-75" d="M12 2a10 10 0 0 0-10 10" strokeLinecap="round"/>
              </svg>
              Waiting for payment…
            </>
          ) : (
            <>
              <UPIIcon />
              Pay {formattedAmount} via UPI
            </>
          )}
        </button>
      )}

      <p className="text-xs text-[#7C8681] text-center">
        You will be redirected to your UPI app (GPay, PhonePe, Paytm&hellip;) to authenticate.
      </p>
    </div>
  );
}

function UPIIcon() {
  // Simple UPI text badge — replace with actual UPI logo SVG if available
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-extrabold tracking-wider">
      UPI
    </span>
  );
}
```

---

### Task 6 — Webhook Handler (45 min)

**File**: `src/app/api/webhooks/razorpay/route.ts`

This is a Next.js Route Handler (not a server action). It must be **unauthenticated** (no session cookie from Razorpay), but **must** verify the HMAC-SHA256 signature on every call.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Razorpay sends the raw body as JSON; we need the raw string for HMAC
// Next.js 15 App Router lets us read request.text() before .json()

// ── Webhook payload types (minimal, add more as needed) ──

interface RazorpayPayment {
  id:    string;   // pay_XXXXX
  entity: string;
  amount: number;  // paise
  currency: string;
  order_id: string;
  status: 'authorized' | 'captured' | 'failed' | 'refunded';
  method: string;
  vpa?: string;    // UPI VPA
  error_code?: string;
  error_description?: string;
  acquirer_data?: {
    rrn?: string;
    auth_code?: string;
    upi_transaction_id?: string;
  };
}

interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment?: { entity: RazorpayPayment };
  };
}

// ── Signature verification ──

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return false;  // Buffer lengths differ → definitely not equal
  }
}

// ── Route handler ──

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // 1. Verify signature — reject everything that doesn't match
  if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
    console.warn('[razorpay/webhook] Signature verification failed');
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { event, payload } = body;

  // 2. Route events
  try {
    if (event === 'payment.authorized' || event === 'payment.captured') {
      const payment = payload.payment?.entity;
      if (!payment) {
        return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
      }
      await handlePaymentSuccess(payment);

    } else if (event === 'payment.failed') {
      const payment = payload.payment?.entity;
      if (payment) {
        await handlePaymentFailed(payment);
      }

    } else {
      // Unknown event — acknowledge it so Razorpay doesn't retry indefinitely
      // Log for observability
      console.log(`[razorpay/webhook] Unhandled event: ${event}`);
    }

  } catch (err) {
    // Log but return 200 so Razorpay doesn't retry successful events
    // that failed due to our processing bug
    console.error('[razorpay/webhook] Processing error:', err);
    // For genuine idempotency-safe operations, returning 500 would cause Razorpay
    // to retry. Only return 500 for catastrophic/setup failures.
  }

  // 3. Always return 200 to acknowledge receipt
  return NextResponse.json({ received: true });
}

// ── Event handlers ──

async function handlePaymentSuccess(payment: RazorpayPayment): Promise<void> {
  // Use admin client — no user session in webhook context
  const supabase = createAdminClient();

  // Idempotency check: has this razorpay_payment_id already been processed?
  const { data: existing } = await supabase
    .from('payments')
    .select('id, status')
    .eq('razorpay_payment_id', payment.id)
    .maybeSingle();

  if (existing?.status === 'paid') {
    console.log(`[razorpay/webhook] Already processed payment ${payment.id}, skipping.`);
    return;
  }

  // Locate the pending payment record by razorpay_order_id
  const { data: paymentRecord, error: fetchError } = await supabase
    .from('payments')
    .select('id, job_id, customer_id, status')
    .eq('razorpay_order_id', payment.order_id)
    .single();

  if (fetchError || !paymentRecord) {
    throw new Error(`Payment record not found for order_id ${payment.order_id}: ${fetchError?.message}`);
  }

  // Idempotency check (by order_id path, in case payment_id was already set)
  if (paymentRecord.status === 'paid') {
    console.log(`[razorpay/webhook] Payment record ${paymentRecord.id} already paid, skipping.`);
    return;
  }

  // 1. Mark payment as paid
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status:             'paid',
      razorpay_payment_id: payment.id,
      provider_reference: payment.id,  // update to actual payment id
      upi_vpa:            payment.vpa ?? null,
      upi_rrn:            payment.acquirer_data?.rrn ?? null,
      upi_ref_id:         payment.acquirer_data?.upi_transaction_id ?? null,
      paid_at:            new Date().toISOString(),
    })
    .eq('id', paymentRecord.id);

  if (updateError) {
    throw new Error(`Failed to update payment record: ${updateError.message}`);
  }

  // 2. Transition job to 'closed' via the DB function
  //    The job should already be in 'completed' (professional set it in Phase 5).
  //    The state machine allows completed → closed.
  if (paymentRecord.job_id) {
    const { error: rpcError } = await supabase.rpc('transition_job_state', {
      p_job_id:        paymentRecord.job_id,
      p_new_state:     'closed',
      p_actor_user_id: paymentRecord.customer_id,  // customer is the actor in payment context
      p_metadata:      { triggered_by: 'razorpay_webhook', razorpay_payment_id: payment.id },
    });

    if (rpcError) {
      // Non-fatal: job may already be closed, or in an unexpected state
      console.warn(`[razorpay/webhook] Job state transition failed for job ${paymentRecord.job_id}: ${rpcError.message}`);
    }
  }

  // 3. Create invoice record
  if (paymentRecord.job_id) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        job_id:          paymentRecord.job_id,
        customer_id:     paymentRecord.customer_id,
        payment_id:      paymentRecord.id,
        amount:          payment.amount / 100,  // convert paise to rupees
        currency:        payment.currency,
        status:          'issued',
        issued_at:       new Date().toISOString(),
      });

    if (invoiceError) {
      // Non-fatal: invoice can be recreated later; don't throw and trigger retries
      console.error(`[razorpay/webhook] Invoice creation failed: ${invoiceError.message}`);
    }
  }

  console.log(`[razorpay/webhook] Payment ${payment.id} processed successfully.`);
}

async function handlePaymentFailed(payment: RazorpayPayment): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('payments')
    .update({
      status:      'failed',
      razorpay_payment_id: payment.id,
    })
    .eq('razorpay_order_id', payment.order_id);

  console.log(`[razorpay/webhook] Payment ${payment.id} failed: ${payment.error_description}`);
}
```

---

### Task 7 — Payment Result Page (30 min)

**File**: `src/app/customer/payments/result/[paymentId]/page.tsx`

The Razorpay `callback_url` redirects here after the UPI app completes or fails. This page reads payment status from the DB (not from Razorpay's redirect params, which are client-controlled).

```typescript
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

interface PaymentResultPageProps {
  params: Promise<{ paymentId: string }>;
}

export const metadata = { title: 'Payment — Fixify' };

export default async function PaymentResultPage({ params }: PaymentResultPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const { paymentId } = await params;
  const supabase = await createClient();

  // Read status from DB — never trust query params from Razorpay redirect
  const { data: payment, error } = await supabase
    .from('payments')
    .select('id, status, amount, currency, paid_at, job_id, upi_vpa')
    .eq('id', paymentId)
    .eq('customer_id', user.id)   // RLS + explicit ownership check
    .single();

  if (error || !payment) notFound();

  const isPaid    = payment.status === 'paid';
  const isFailed  = payment.status === 'failed';
  const isPending = payment.status === 'pending';

  const formattedAmount = Number(payment.amount).toLocaleString('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  });

  return (
    <div className="min-h-screen bg-[#F7F4EC] flex items-start justify-center px-4 pt-16 pb-24">
      <div className="w-full max-w-md space-y-5">

        {/* Status icon */}
        <div className="flex justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isPaid ? 'bg-[#E3F0E8]' : isFailed ? 'bg-[#F5E6E6]' : 'bg-[#FFF4E0]'
          }`}>
            {isPaid ? (
              <svg className="w-8 h-8 text-[#2F7D5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : isFailed ? (
              <svg className="w-8 h-8 text-[#9B3535]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-[#9B6700]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>
        </div>

        {/* Status message */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#18211F]">
            {isPaid ? 'Payment successful!' : isFailed ? 'Payment failed' : 'Payment pending'}
          </h1>
          {isPaid && (
            <p className="text-sm text-[#5A6661] mt-2">
              {formattedAmount} paid
              {payment.upi_vpa ? ` from ${payment.upi_vpa}` : ''}.
              Your invoice will be emailed shortly.
            </p>
          )}
          {isFailed && (
            <p className="text-sm text-[#5A6661] mt-2">
              Your payment could not be processed. No amount was deducted. Please try again.
            </p>
          )}
          {isPending && (
            <p className="text-sm text-[#5A6661] mt-2">
              Your payment is being verified. This usually takes under a minute.
              Refresh this page or check your booking status.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isFailed && payment.job_id && (
            <Link
              href={`/customer/bookings/${payment.job_id}`}
              className="block text-center w-full px-5 py-3 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] transition"
            >
              Retry Payment
            </Link>
          )}
          <Link
            href="/customer"
            className="block text-center w-full px-5 py-3 border border-[#D9DED8] text-[#5A6661] font-bold text-sm rounded-xl hover:bg-[#F4F5F3] transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 8 — Wire Pay Button into Booking Detail Page (30 min)

**File**: `src/app/customer/bookings/[id]/page.tsx`

Add a "Pay" section below the pricing card. The section is only rendered when:
- `booking_status` is `'completed'` (job is done)
- No `paid` payment record exists for this booking's job

```typescript
// Add to the query — fetch the associated job's payment status
const { data, error } = await supabase
  .from('bookings')
  .select(`
    ...,
    jobs (
      id,
      current_state,
      payments ( id, status )
    )
  `)
  .eq('id', id)
  .eq('customer_id', user.id)
  .single();

// Derive payment state
const job = Array.isArray(data?.jobs) ? data.jobs[0] : data?.jobs ?? null;
const existingPayments = Array.isArray(job?.payments) ? job.payments : [];
const isPaid = existingPayments.some((p: { status: string }) => p.status === 'paid');
const showPayButton =
  booking.booking_status === 'completed' &&
  job?.current_state === 'completed' &&
  !isPaid;

// In JSX, after the pricing card:
{showPayButton && booking.quoted_or_base_amount != null && (
  <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-3">
      Payment
    </p>
    <UPIIntentCheckout
      jobId={job.id}
      displayAmountRupees={Number(booking.quoted_or_base_amount)}
    />
  </div>
)}
```

Note: `UPIIntentCheckout` is a client component, so the booking detail page (which is currently a server component) will need to either:
1. Pass `jobId` and `amount` to a thin client wrapper, or
2. Add `'use client'` to the booking detail page.

Option 1 is preferred — keep the page as a server component and just drop in the client component.

---

### Task 9 — Invoices Table (if not yet created) (15 min)

The webhook handler inserts into `invoices`. Check if the table exists:

```bash
# In Supabase dashboard → Table Editor, look for 'invoices'
# If it doesn't exist, create a migration:
```

**File**: `supabase/migrations/20261002_002_create_invoices.sql`

```sql
CREATE TABLE IF NOT EXISTS public.invoices (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid    NOT NULL REFERENCES public.jobs(id)     ON DELETE CASCADE,
  customer_id uuid    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id  uuid    REFERENCES public.payments(id)          ON DELETE SET NULL,
  amount      numeric(10, 2) NOT NULL,
  currency    text    NOT NULL DEFAULT 'INR',
  status      text    NOT NULL DEFAULT 'issued',   -- issued | sent | void
  issued_at   timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_invoices_job      ON public.invoices (job_id);
CREATE INDEX idx_invoices_customer ON public.invoices (customer_id);
CREATE INDEX idx_invoices_status   ON public.invoices (status, issued_at DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_customer_select ON public.invoices
  FOR SELECT USING (customer_id = auth.uid());

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.invoices TO authenticated;
```

---

## Environment Variables

Add to `.env.local` (and Vercel/deployment secrets):

```bash
# Public — safe to expose in browser
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX

# Private — server-only, NEVER prefix with NEXT_PUBLIC_
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
```

Get from: Razorpay Dashboard → Settings → API Keys (test keys for now).
Get webhook secret from: Razorpay Dashboard → Webhooks → Create Webhook → copy secret.

---

## Security Checklist

Before calling any of this done, verify:

- [ ] `RAZORPAY_KEY_SECRET` is server-only (no `NEXT_PUBLIC_` prefix, not logged, not in responses)
- [ ] Payment amount is resolved server-side from DB (quote or booking record) — never from client params
- [ ] Job ownership checked in `createUPIIntentPayment` (`job.customer_id === user.id`)
- [ ] Webhook signature verified with `crypto.timingSafeEqual` before any DB operation
- [ ] Idempotency enforced: `payment.id` checked before processing; `paid` status blocks re-entry
- [ ] `transition_job_state()` RPC called via admin client in webhook (no user session)
- [ ] Payment result page reads status from DB, not from Razorpay redirect params
- [ ] RLS on `payments` table: customer can only see own payments
- [ ] RLS on `invoices` table: customer can only see own invoices
- [ ] No payment-sensitive fields (VPA, RRN) logged to console in production
- [ ] `provider_reference` uniqueness constraint on `payments` table honoured (set to `payment_id` on capture)

---

## Testing

### Razorpay Test VPAs

| VPA | Outcome |
|-----|---------|
| `success@razorpay` | Payment succeeds immediately |
| `failure@razorpay` | Payment fails |
| `otp@razorpay` | Requires PIN: `123456` |

### Manual test flow

1. Ensure a job exists in `completed` state (create via Phase 5 state transitions in `/professional/jobs/[id]`)
2. Navigate to the customer's booking detail: `/customer/bookings/[booking-id]`
3. Verify "Pay" section appears
4. Click "Pay via UPI" — Razorpay checkout should open
5. Enter test VPA `success@razorpay`
6. Complete — page redirects to `/customer/payments/result/[payment_db_id]`
7. Verify in Supabase dashboard:
   - `payments` row: `status = 'paid'`, `razorpay_payment_id` set, `paid_at` set
   - `jobs` row: `current_state = 'closed'`
   - `invoices` row: created with correct amount

### Webhook testing locally

```bash
# Install Razorpay CLI or use ngrok to expose localhost
ngrok http 3000

# Set webhook URL in Razorpay dashboard to:
# https://xxxx.ngrok.io/api/webhooks/razorpay

# Then trigger a test payment — the webhook will fire to your local server
```

---

## What This Sprint Does NOT Include

Explicitly out of scope for Sprint 1. Do not implement these yet:

- UPI QR codes (Sprint 2)
- Turbo UPI (Sprint 2, requires Razorpay approval)
- Google Pay Intent (Sprint 3)
- Payment retry UI beyond reopening the same order
- Refund flow
- Email/SMS confirmation on payment (stub in webhook is enough for now)
- Payment history page for customers
- Razorpay webhook signature rotation

---

## File Summary

```
New files to create:
  supabase/migrations/20261002_001_upi_payment_fields.sql
  supabase/migrations/20261002_002_create_invoices.sql       (if invoices table missing)
  src/lib/payments/createUPIIntentPayment.ts
  src/components/customer/UPIIntentCheckout.tsx
  src/app/api/webhooks/razorpay/route.ts
  src/app/customer/payments/result/[paymentId]/page.tsx

Modified files:
  src/app/customer/bookings/[id]/page.tsx                    (add Pay section)
  .env.local                                                 (add Razorpay keys)
  package.json / pnpm-lock.yaml                              (add razorpay package)
```
