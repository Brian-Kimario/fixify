'use server';

import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';

// ── SDK initialisation ────────────────────────────────────────────────────────
// Instantiated at module load so a missing secret fails at startup, not at
// the moment a customer tries to pay.
function getRazorpayClient() {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error(
      'Razorpay credentials are not configured. ' +
      'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
    );
  }
  return new Razorpay({ key_id, key_secret });
}

// ── Return types ──────────────────────────────────────────────────────────────

export interface UPIIntentPaymentCreated {
  success: true;
  order_id:       string;   // Razorpay order id
  amount:         number;   // paise
  currency:       'INR';
  key_id:         string;   // publishable key for checkout.js
  payment_db_id:  string;   // our payments.id — used for callback_url
  customer_name:  string;
  customer_phone: string | null;
}

export interface UPIIntentPaymentError {
  success: false;
  error: string;
}

export type CreateUPIIntentResult = UPIIntentPaymentCreated | UPIIntentPaymentError;

// ── Amount resolution ─────────────────────────────────────────────────────────
// Amount is ALWAYS read from the database. Never from client input.
// Priority: approved quote total → booking base/fixed amount → error.

async function resolveAmountPaise(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  bookingId: string,
): Promise<number> {
  // 1. Approved quote (quote_after_inspection or additional-work flow)
  const { data: quote } = await supabase
    .from('quotes')
    .select('total')
    .eq('job_id', jobId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (quote && Number(quote.total) > 0) {
    return Math.round(Number(quote.total) * 100);
  }

  // 2. Booking base amount (fixed / inspection pricing models)
  const { data: booking } = await supabase
    .from('bookings')
    .select('quoted_or_base_amount')
    .eq('id', bookingId)
    .maybeSingle();

  if (booking && Number(booking.quoted_or_base_amount) > 0) {
    return Math.round(Number(booking.quoted_or_base_amount) * 100);
  }

  throw new Error(
    'Unable to determine payment amount. ' +
    'The job requires either an approved quote or a fixed booking price.'
  );
}

// ── Main server action ────────────────────────────────────────────────────────

/**
 * createUPIIntentPayment
 *
 * Creates a Razorpay order for a completed job and persists a pending
 * payment record. Returns the order details the client needs to open
 * Razorpay checkout.
 *
 * Security guarantees:
 *  - Amount resolved from DB (quote → booking), never from client.
 *  - Ownership verified: job.customer_id must match authenticated user.
 *  - Job must be in `completed` state before payment is accepted.
 *  - Idempotent: reuses a pending Razorpay order if one already exists.
 *  - RBI limit (₹1,00,000 per transaction) enforced server-side.
 */
export async function createUPIIntentPayment(
  jobId: string,
): Promise<CreateUPIIntentResult> {
  const supabase = await createClient();

  // ── 1. Authenticate ─────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { success: false, error: 'Not authenticated. Please sign in.' };
  }

  // ── 2. Load job — verify ownership ─────────────────────────────────────────
  const { data: job, error: jobErr } = await supabase
    .from('jobs')
    .select('id, current_state, customer_id, booking_id')
    .eq('id', jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return { success: false, error: 'Job not found or access denied.' };
  }
  if (job.customer_id !== user.id) {
    return { success: false, error: 'You are not authorised to pay for this job.' };
  }

  // ── 3. Guard: only pay completed jobs ───────────────────────────────────────
  if (job.current_state !== 'completed') {
    return {
      success: false,
      error: `Payment is only available once the job is complete. Current status: ${job.current_state}.`,
    };
  }

  // ── 4. Idempotency — reuse existing pending order ───────────────────────────
  const { data: existing } = await supabase
    .from('payments')
    .select('id, status, razorpay_order_id, amount')
    .eq('job_id', jobId)
    .in('status', ['pending', 'paid'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status === 'paid') {
    return { success: false, error: 'This job has already been paid.' };
  }

  if (existing?.status === 'pending' && existing.razorpay_order_id) {
    // Return existing order — safe for page refresh / back-button scenarios
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    return {
      success:        true,
      order_id:       existing.razorpay_order_id,
      amount:         Math.round(Number(existing.amount) * 100),
      currency:       'INR',
      key_id:         process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      payment_db_id:  existing.id,
      customer_name:  profile?.full_name  ?? 'Customer',
      customer_phone: profile?.phone      ?? null,
    };
  }

  // ── 5. Resolve authoritative amount ─────────────────────────────────────────
  let amountPaise: number;
  try {
    amountPaise = await resolveAmountPaise(supabase, job.id, job.booking_id);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Could not determine payment amount.',
    };
  }

  // RBI per-transaction UPI ceiling: ₹1,00,000
  if (amountPaise > 100_000 * 100) {
    return {
      success: false,
      error: 'Amount exceeds the RBI per-transaction UPI limit of ₹1,00,000. Please contact support.',
    };
  }

  // ── 6. Load customer profile for Razorpay prefill ───────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .maybeSingle();

  // ── 7. Create Razorpay order ─────────────────────────────────────────────────
  let razorpayOrder: any;
  try {
    const rzp = getRazorpayClient();
    razorpayOrder = await (rzp.orders as any).create({
      amount:   amountPaise,
      currency: 'INR',
      // receipt must be ≤ 40 chars
      receipt:  `job_${jobId.replace(/-/g, '').slice(0, 30)}`,
      notes: {
        job_id:      jobId,
        customer_id: user.id,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown provider error';
    return { success: false, error: `Payment provider error: ${msg}` };
  }

  // ── 8. Persist pending payment record ───────────────────────────────────────
  // provider_reference has a UNIQUE constraint — use the Razorpay order_id as
  // the initial value; the webhook will update it to the payment_id on capture.
  const { data: payment, error: insertErr } = await supabase
    .from('payments')
    .insert({
      customer_id:        user.id,
      job_id:             jobId,
      payment_type:       'service',
      payment_method:     'upi_intent',
      amount:             amountPaise / 100,   // schema stores rupees (numeric 10,2)
      currency:           'INR',
      provider:           'razorpay',
      provider_reference: razorpayOrder.id,    // unique; updated to payment_id on capture
      razorpay_order_id:  razorpayOrder.id,
      status:             'pending',
      attempt_count:      1,
      last_attempt_at:    new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertErr || !payment) {
    return {
      success: false,
      error: `Failed to record payment: ${insertErr?.message ?? 'unknown error'}`,
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
