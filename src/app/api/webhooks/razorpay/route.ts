import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

// Only the fields this handler reads. Razorpay sends more; Zod strips the rest.
const paymentEntitySchema = z.object({
  id: z.string().min(1), // pay_XXXX
  order_id: z.string().min(1), // order_XXXX, stored as payments.provider_reference
  amount: z.number().int().nonnegative(), // paise
  currency: z.string().min(1),
  method: z.string().nullish(),
  vpa: z.string().nullish(),
  error_code: z.string().nullish(),
  error_description: z.string().nullish(),
  acquirer_data: z
    .object({
      rrn: z.string().nullish(),
      upi_transaction_id: z.string().nullish(),
    })
    .nullish(),
});

const webhookBodySchema = z.object({
  event: z.string().min(1),
  payload: z.object({
    payment: z.object({ entity: paymentEntitySchema }).optional(),
  }),
});

type PaymentEntity = z.infer<typeof paymentEntitySchema>;

// Events that change payment status. `payment.authorized` is not money received, so it is
// acknowledged without changes; the order is created with payment_capture so a capture follows.
const STATUS_FOR_EVENT: Record<string, 'paid' | 'failed'> = {
  'payment.captured': 'paid',
  'payment.failed': 'failed',
};

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), 'hex');
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(expected, given);
}

function json(status: number, body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status });
}

/**
 * Razorpay webhook. Every non-2xx response makes Razorpay retry, which is what we want when a
 * payment cannot be matched or recorded: the event is not lost. The RPC is idempotent, so
 * retries and duplicate deliveries are safe.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
    return json(500, { error: 'Server misconfiguration' });
  }

  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return json(401, { error: 'Signature verification failed' });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const parsed = webhookBodySchema.safeParse(raw);
  if (parsed.success === false) {
    return json(400, { error: 'Unexpected payload shape' });
  }

  const { event, payload } = parsed.data;
  const newStatus = STATUS_FOR_EVENT[event];
  if (!newStatus) {
    return json(200, { received: true, ignored: event });
  }

  const entity = payload.payment?.entity;
  if (!entity) {
    return json(400, { error: 'Missing payment entity' });
  }

  return recordPaymentStatus(event, newStatus, entity);
}

async function recordPaymentStatus(
  event: string,
  newStatus: 'paid' | 'failed',
  entity: PaymentEntity,
): Promise<NextResponse> {
  // The shared admin client is created without the Database generic; type it here so the
  // RPC arguments are checked against the generated signature.
  const supabase = (await createAdminClient()) as unknown as SupabaseClient<Database>;

  const { data, error } = await supabase.rpc('transition_payment_status', {
    p_provider_reference: entity.order_id,
    p_new_status: newStatus,
    p_provider_event: event,
    p_provider_payment_id: entity.id,
    p_amount_paise: entity.amount,
    p_currency: entity.currency,
    p_metadata: {
      method: entity.method ?? null,
      upi_vpa: entity.vpa ?? null,
      upi_rrn: entity.acquirer_data?.rrn ?? null,
      upi_transaction_id: entity.acquirer_data?.upi_transaction_id ?? null,
      error_code: entity.error_code ?? null,
      error_description: entity.error_description ?? null,
    },
  });

  if (error) {
    // P0002: no payment row for this order. 22023: amount, currency or transition rejected.
    const status = error.code === 'P0002' ? 404 : error.code === '22023' ? 422 : 500;
    console.error(`[razorpay/webhook] ${event} for ${entity.order_id} not recorded: ${error.message}`);
    return json(status, { error: 'Payment not recorded' });
  }

  // TODO(Phase 5): issue an invoice once an invoices table exists. There is none today.
  return json(200, { received: true, result: data });
}
