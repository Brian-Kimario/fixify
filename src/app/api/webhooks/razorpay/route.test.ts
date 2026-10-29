// @vitest-environment node
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: async () => ({ rpc }),
}));

const { POST } = await import('./route');

const SECRET = 'test-webhook-secret';

function sign(body: string, secret = SECRET): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function capturedEvent(event = 'payment.captured') {
  return JSON.stringify({
    event,
    payload: {
      payment: {
        entity: {
          id: 'pay_123',
          order_id: 'order_abc',
          amount: 49950,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          vpa: 'someone@okaxis',
          acquirer_data: { rrn: '998877', upi_transaction_id: 'UTX1' },
        },
      },
    },
  });
}

function request(body: string, signature = sign(body)): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/razorpay', {
    method: 'POST',
    body,
    headers: { 'x-razorpay-signature': signature },
  });
}

describe('POST /api/webhooks/razorpay', () => {
  beforeEach(() => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', SECRET);
    rpc.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects a bad signature without touching the database', async () => {
    const body = capturedEvent();
    const res = await POST(request(body, sign(body, 'wrong-secret')));
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a malformed signature', async () => {
    const res = await POST(request(capturedEvent(), 'not-hex'));
    expect(res.status).toBe(401);
  });

  it('returns 500 when the secret is not configured', async () => {
    vi.stubEnv('RAZORPAY_WEBHOOK_SECRET', '');
    const res = await POST(request(capturedEvent()));
    expect(res.status).toBe(500);
  });

  it('records a capture by order id, with the paise amount', async () => {
    rpc.mockResolvedValue({ data: 'applied', error: null });
    const res = await POST(request(capturedEvent()));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, result: 'applied' });
    expect(rpc).toHaveBeenCalledWith('transition_payment_status', {
      p_provider_reference: 'order_abc',
      p_new_status: 'paid',
      p_provider_event: 'payment.captured',
      p_provider_payment_id: 'pay_123',
      p_amount_paise: 49950,
      p_currency: 'INR',
      p_metadata: {
        method: 'upi',
        upi_vpa: 'someone@okaxis',
        upi_rrn: '998877',
        upi_transaction_id: 'UTX1',
        error_code: null,
        error_description: null,
      },
    });
  });

  it('acknowledges a replayed capture the RPC already processed', async () => {
    rpc
      .mockResolvedValueOnce({ data: 'applied', error: null })
      .mockResolvedValueOnce({ data: 'already_processed', error: null });
    const body = capturedEvent();

    const first = await POST(request(body));
    const second = await POST(request(body));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ received: true, result: 'already_processed' });
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('maps payment.failed to the failed status', async () => {
    rpc.mockResolvedValue({ data: 'applied', error: null });
    await POST(request(capturedEvent('payment.failed')));
    expect(rpc.mock.calls[0][1]).toMatchObject({ p_new_status: 'failed', p_provider_event: 'payment.failed' });
  });

  it('acknowledges payment.authorized and other events without changes', async () => {
    for (const event of ['payment.authorized', 'order.paid']) {
      const res = await POST(request(capturedEvent(event)));
      expect(res.status).toBe(200);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns 404 so Razorpay retries when no payment matches the order', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'P0002', message: 'Payment not found' } });
    const res = await POST(request(capturedEvent()));
    expect(res.status).toBe(404);
  });

  it('returns 422 when the amount or transition is rejected', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '22023', message: 'does not match' } });
    const res = await POST(request(capturedEvent()));
    expect(res.status).toBe(422);
  });

  it('returns 500 on any other database error', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '08006', message: 'connection failure' } });
    const res = await POST(request(capturedEvent()));
    expect(res.status).toBe(500);
  });

  it('rejects a payload without the fields it needs', async () => {
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } });
    const res = await POST(request(body));
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
