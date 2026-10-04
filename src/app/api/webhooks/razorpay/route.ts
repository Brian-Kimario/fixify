import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Tell Next.js this route reads the raw body (required for HMAC) ────────────
export const dynamic = 'force-dynamic';

// ── Razorpay webhook payload types ────────────────────────────────────────────

interface RazorpayPaymentEntity {
  id:            string;   // pay_XXXXX
  order_id:      string;   // order_XXXXX
  amount:        number;   // paise
  currency:      string;
  status:        'authorized' | 'captured' | 'failed' | 'refunded';
  method:        string;
  vpa?:          string;   // UPI Virtual Payment Address
  error_code?:   string;
  error_description?: string;
  acquirer_data?: {
    rrn?:                 string;
    upi_transaction_id?:  string;
    auth_code?:           string;
  };
}

interface RazorpayWebhookBody {
  event:   string;
  payload: {
    payment?: { entity: RazorpayPaymentEntity };
  };
}

// ── Signature verification ────────────────────────────────────────────────────

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    // timingSafeEqual prevents timing-attack leakage
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    // Buffer length mismatch → definitely not equal
    return false;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Read raw body as text BEFORE parsing — HMAC is computed on the raw string
  const rawBody = await request.text();

  const signature     = request.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // 2. Reject any request that fails signature verification
  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn('[razorpay/webhook] Signature verification failed — rejecting');
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  // 3. Parse body
  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody) as RazorpayWebhookBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { event, payload } = body;
  console.log(`[razorpay/webhook] Received event: ${event}`);

  // 4. Dispatch events — always return 200 after verification so Razorpay
  //    doesn't endlessly retry events that hit a transient processing error.
  try {
    if (event === 'payment.authorized' || event === 'payment.captured') {
      const entity = payload.payment?.entity;
      if (!entity) {
        console.error('[razorpay/webhook] Missing payment entity in payload');
      } else {
        await handlePaymentSuccess(entity);
      }
    } else if (event === 'payment.failed') {
      const entity = payload.payment?.entity;
      if (entity) await handlePaymentFailed(entity);
    } else {
      // Unknown / unhandled events are acknowledged but not acted on
      console.log(`[razorpay/webhook] Unhandled event type: ${event}`);
    }
  } catch (err) {
    // Log but do NOT return 5xx — that would cause Razorpay to retry indefinitely
    console.error('[razorpay/webhook] Processing error (returning 200 to prevent retry):', err);
  }

  return NextResponse.json({ received: true });
}

// ── payment.authorized / payment.captured ─────────────────────────────────────

async function handlePaymentSuccess(payment: RazorpayPaymentEntity): Promise<void> {
  // Admin client — no user session in webhook context
  const supabase: any = await createAdminClient();

  // ── Idempotency check (by razorpay_payment_id) ─────────────────────────────
  const { data: byPaymentId } = await supabase
    .from('payments')
    .select('id, status')
    .eq('razorpay_payment_id', payment.id)
    .maybeSingle();

  if (byPaymentId?.status === 'paid') {
    console.log(`[razorpay/webhook] Already processed payment ${payment.id} — skipping`);
    return;
  }

  // ── Find the pending payment record by order_id ────────────────────────────
  const { data: record, error: fetchErr } = await supabase
    .from('payments')
    .select('id, job_id, customer_id, status')
    .eq('razorpay_order_id', payment.order_id)
    .maybeSingle();

  if (fetchErr || !record) {
    throw new Error(
      `Payment record not found for order_id=${payment.order_id}: ${fetchErr?.message ?? 'not found'}`
    );
  }

  // Second idempotency check via order_id path
  if (record.status === 'paid') {
    console.log(`[razorpay/webhook] Payment record ${record.id} already paid — skipping`);
    return;
  }

  // ── 1. Mark payment as paid via state machine ──────────────────────────────
  // Use transition_payment_status RPC to record payment with authorization and audit
  // @ts-ignore - New RPC function not yet in generated types
  const { error: transitionErr } = await supabase.rpc('transition_payment_status' as any, {
    p_payment_id: record.id,
    p_new_status: 'paid',
    p_actor_user_id: record.customer_id,  // Actor is the customer who owns the payment
    p_actor_role: 'webhook',  // Mark as webhook-triggered action
    p_reason: `Payment received via Razorpay: ${payment.id}`,
    p_metadata: {
      razorpay_payment_id: payment.id,
      upi_vpa: payment.vpa ?? null,
      upi_rrn: payment.acquirer_data?.rrn ?? null,
      upi_ref_id: payment.acquirer_data?.upi_transaction_id ?? null,
    },
  });

  if (transitionErr) {
    throw new Error(
      `Failed to record payment via state machine for payment ${record.id}: ${transitionErr.message}`
    );
  }

  // Update payment record with additional Razorpay metadata
  const { error: updateErr } = await supabase
    .from('payments')
    .update({
      razorpay_payment_id: payment.id,
      provider_reference: payment.id,  // Was order_id, now update to actual payment_id
      upi_vpa: payment.vpa ?? null,
      upi_rrn: payment.acquirer_data?.rrn ?? null,
      upi_ref_id: payment.acquirer_data?.upi_transaction_id ?? null,
    })
    .eq('id', record.id);

  if (updateErr) {
    throw new Error(`Failed to update payment metadata for payment ${record.id}: ${updateErr.message}`);
  }

  // ── 2. Transition job to 'closed' via the DB state machine ─────────────────
  // The professional already set the job to 'completed' in Phase 5.
  // State machine allows: completed → closed.
  if (record.job_id) {
    const { error: rpcErr } = await supabase.rpc('transition_job_state', {
      p_job_id:        record.job_id,
      p_new_state:     'closed',
      p_actor_user_id: record.customer_id,
      p_metadata:      JSON.stringify({
        triggered_by:          'razorpay_webhook',
        razorpay_payment_id:   payment.id,
      }),
    });

    if (rpcErr) {
      // Non-fatal: log and continue — job may already be closed, or state
      // transition guards prevent it. Don't throw and block invoice creation.
      console.warn(
        `[razorpay/webhook] Job state transition failed for job ${record.job_id}: ${rpcErr.message}`
      );
    }
  }

  // ── 3. Create invoice ──────────────────────────────────────────────────────
  if (record.job_id) {
    const { error: invoiceErr } = await supabase
      .from('invoices')
      .insert({
        job_id:      record.job_id,
        customer_id: record.customer_id,
        payment_id:  record.id,
        amount:      payment.amount / 100,   // paise → rupees
        currency:    payment.currency,
        status:      'issued',
        issued_at:   new Date().toISOString(),
      });

    if (invoiceErr) {
      // Non-fatal: invoice can be re-created manually if needed. Log and continue.
      console.error(
        `[razorpay/webhook] Invoice creation failed for payment ${record.id}: ${invoiceErr.message}`
      );
    }
  }

  console.log(`[razorpay/webhook] ✓ Payment ${payment.id} processed successfully`);
}

// ── payment.failed ────────────────────────────────────────────────────────────

async function handlePaymentFailed(payment: RazorpayPaymentEntity): Promise<void> {
  const supabase: any = await createAdminClient();

  const { error } = await supabase
    .from('payments')
    .update({
      status:              'failed',
      razorpay_payment_id: payment.id,
    })
    .eq('razorpay_order_id', payment.order_id);

  if (error) {
    console.error(`[razorpay/webhook] Failed to mark payment as failed: ${error.message}`);
  } else {
    console.log(
      `[razorpay/webhook] Payment ${payment.id} marked failed: ${payment.error_description ?? payment.error_code ?? 'unknown'}`
    );
  }
}
