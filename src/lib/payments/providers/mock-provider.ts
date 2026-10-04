/**
 * Mock Payment Provider
 *
 * Simulates payment processing for development and testing.
 * Clearly labeled as "Demo Payment — No real money will be charged".
 *
 * Environment gate: Only enabled when MOCK_PAYMENTS=true AND NODE_ENV !== 'production'
 */

import {
  PaymentProvider,
  Quote,
  Customer,
  OrderResponse,
  VerificationResult,
  RefundResult,
  WebhookEvent,
} from '../provider';

export class MockProvider implements PaymentProvider {
  constructor() {
    // Defensive: Fail at construction time if in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock payments disabled in production');
    }
  }

  getType(): 'mock' | 'razorpay' {
    return 'mock';
  }

  async createOrder(quote: Quote, customer: Customer): Promise<OrderResponse> {
    // Generate mock order ID
    const orderId = `mock_order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      orderId,
      metadata: {
        simulated: true,
        mockCreatedAt: new Date().toISOString(),
        amount: quote.total,
        currency: quote.currency,
      },
    };
  }

  async verifyPayment(orderId: string, paymentId: string): Promise<VerificationResult> {
    // Mock verification always succeeds unless explicitly configured to fail
    const shouldFail = process.env.MOCK_PAYMENT_FAIL === 'true';

    if (shouldFail) {
      throw new Error('Mock payment verification failed (MOCK_PAYMENT_FAIL=true)');
    }

    return {
      verified: true,
      paymentId: `mock_payment_${Date.now()}`,
      amount: 0, // Mock amount
      metadata: {
        simulated: true,
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // Mock provider doesn't actually send webhooks, but this is here for interface compliance
    console.log('[MockProvider.handleWebhook]', event.event);
  }

  async refundPayment(paymentId: string, amount: number): Promise<RefundResult> {
    // Mock refund always succeeds
    const refundId = `mock_refund_${Date.now()}`;

    return {
      success: true,
      refundId,
      amount,
      metadata: {
        simulated: true,
        refundedAt: new Date().toISOString(),
      },
    };
  }
}
