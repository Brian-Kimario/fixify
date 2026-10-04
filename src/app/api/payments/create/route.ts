/**
 * POST /api/payments/create
 *
 * Creates a payment record and initiates payment with the configured provider.
 *
 * Request body:
 *   - quote_id: string (UUID of approved quote)
 *
 * Response:
 *   - paymentId: string (database payment ID)
 *   - orderId: string (provider order/intent ID)
 *   - paymentUrl?: string (optional URL for checkout)
 *   - metadata: Record (provider-specific data)
 *
 * Security:
 *   - Amount is ALWAYS sourced from database quote.total (never from request)
 *   - Quote ownership verified (must belong to authenticated customer)
 *   - Payment record persisted before returning to frontend (idempotent)
 *   - Frontend cannot set payment status (database RLS prevents it)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentProvider } from '@/lib/payments/get-provider';

interface CreatePaymentRequest {
  quote_id: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ────────────────────────────────────────────────────────────────────────
    // 1. Authenticate user
    // ────────────────────────────────────────────────────────────────────────

    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 2. Parse request body
    // ────────────────────────────────────────────────────────────────────────

    let body: CreatePaymentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!body.quote_id) {
      return NextResponse.json(
        { error: 'quote_id is required' },
        { status: 400 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. Load quote and verify ownership
    // ────────────────────────────────────────────────────────────────────────

    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .select('id, total, job_id')
      .eq('id', body.quote_id)
      .maybeSingle();

    if (quoteErr || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Verify customer owns the job that this quote is for
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('customer_id')
      .eq('id', quote.job_id)
      .maybeSingle();

    if (jobErr || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. Check for existing payment (idempotency)
    // ────────────────────────────────────────────────────────────────────────

    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status, provider_reference, amount')
      .eq('quote_id', body.quote_id)
      .in('status', ['pending', 'processing', 'paid'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPayment?.status === 'paid') {
      return NextResponse.json(
        { error: 'This quote has already been paid' },
        { status: 400 }
      );
    }

    if (existingPayment?.status === 'pending' && existingPayment.provider_reference) {
      // Return existing payment — safe for page refresh / retry
      return NextResponse.json(
        {
          paymentId: existingPayment.id,
          orderId: existingPayment.provider_reference,
          metadata: { idempotent: true },
        },
        { status: 200 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. Load customer profile for provider metadata
    // ────────────────────────────────────────────────────────────────────────

    const { data: customer } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    // ────────────────────────────────────────────────────────────────────────
    // 6. Create payment record with status=pending
    // ────────────────────────────────────────────────────────────────────────

    const { data: payment, error: insertErr } = await supabase
      .from('payments')
      .insert({
        customer_id: user.id,
        quote_id: body.quote_id,
        job_id: quote.job_id,
        payment_type: 'service',
        amount: Number(quote.total),
        currency: 'INR', // Default currency
        provider: 'razorpay', // Will be 'mock' in dev if configured
        provider_reference: '', // Will be updated after provider creates order
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertErr || !payment) {
      console.error('[api/payments/create] Failed to create payment record:', insertErr);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 7. Get payment provider and create order
    // ────────────────────────────────────────────────────────────────────────

    let provider;
    try {
      provider = getPaymentProvider();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[api/payments/create] Provider factory error:', msg);
      return NextResponse.json(
        { error: 'Payment provider not configured' },
        { status: 500 }
      );
    }

    let orderResponse;
    try {
      orderResponse = await provider.createOrder(
        {
          id: body.quote_id,
          total: Number(quote.total),
          currency: 'INR',
          job_id: quote.job_id,
        },
        {
          id: user.id,
          email: customer?.email,
          full_name: customer?.full_name,
          phone: customer?.phone,
        }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[api/payments/create] Provider createOrder failed:', msg);

      // Clean up failed payment record
      await supabase.from('payments').delete().eq('id', payment.id);

      return NextResponse.json(
        { error: `Payment provider error: ${msg}` },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 8. Update payment record with provider reference
    // ────────────────────────────────────────────────────────────────────────

    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        provider_reference: orderResponse.orderId,
      })
      .eq('id', payment.id);

    if (updateErr) {
      console.error('[api/payments/create] Failed to update payment reference:', updateErr);
      return NextResponse.json(
        { error: 'Failed to store order reference' },
        { status: 500 }
      );
    }

    // ────────────────────────────────────────────────────────────────────────
    // 9. Return response to frontend
    // ────────────────────────────────────────────────────────────────────────

    return NextResponse.json(
      {
        paymentId: payment.id,
        orderId: orderResponse.orderId,
        paymentUrl: orderResponse.paymentUrl,
        metadata: {
          ...orderResponse.metadata,
          isDemoPayment: process.env.MOCK_PAYMENTS === 'true',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[api/payments/create] Unhandled error:', msg);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
