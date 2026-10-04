/**
 * Razorpay Payment Provider
 *
 * Implements PaymentProvider interface using Razorpay SDK.
 * Handles UPI intent payments, order creation, and verification.
 */

import Razorpay from 'razorpay';
import {
  PaymentProvider,
  Quote,
  Customer,
  OrderResponse,
  VerificationResult,
  RefundResult,
  WebhookEvent,
} from '../provider';

export class RazorpayProvider implements PaymentProvider {
  private razorpay: Razorpay;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        'Razorpay credentials are not configured. ' +
        'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
      );
    }

    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  getType(): 'mock' | 'razorpay' {
    return 'razorpay';
  }

  async createOrder(quote: Quote, customer: Customer): Promise<OrderResponse> {
    try {
      const amountPaise = Math.round(quote.total * 100);

      // RBI per-transaction UPI ceiling: ₹1,00,000
      if (amountPaise > 100_000 * 100) {
        throw new Error(
          'Amount exceeds the RBI per-transaction UPI limit of ₹1,00,000. ' +
          'Please contact support.'
        );
      }

      const razorpayOrder = await (this.razorpay.orders as any).create({
        amount: amountPaise,
        currency: quote.currency || 'INR',
        receipt: `order_${quote.id?.replace(/-/g, '').slice(0, 30) || Date.now()}`,
        notes: {
          quote_id: quote.id,
          customer_id: customer.id,
        },
      });

      return {
        orderId: razorpayOrder.id,
        metadata: {
          razorpayOrderId: razorpayOrder.id,
          amount: amountPaise,
          currency: quote.currency || 'INR',
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Razorpay error';
      throw new Error(`Failed to create Razorpay order: ${message}`);
    }
  }

  async verifyPayment(orderId: string, paymentId: string): Promise<VerificationResult> {
    try {
      // Fetch order from Razorpay to verify payment completion
      const order = await (this.razorpay.orders as any).fetch(orderId);

      if (order.status !== 'paid') {
        return {
          verified: false,
          paymentId,
          amount: 0,
          metadata: {
            orderStatus: order.status,
          },
        };
      }

      return {
        verified: true,
        paymentId,
        amount: order.amount / 100, // paise to rupees
        metadata: {
          orderId,
          orderStatus: order.status,
          razorpayOrderId: order.id,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Razorpay error';
      throw new Error(`Failed to verify Razorpay payment: ${message}`);
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // Webhook handling is done in /api/webhooks/razorpay/route.ts
    // This method is here for interface compliance
    console.log('[RazorpayProvider.handleWebhook] Event:', event.event);
  }

  async refundPayment(paymentId: string, amount: number): Promise<RefundResult> {
    try {
      const amountPaise = Math.round(amount * 100);

      const refund = await (this.razorpay.payments as any).refund(paymentId, {
        amount: amountPaise,
      });

      return {
        success: refund.status === 'processed' || refund.status === 'pending',
        refundId: refund.id,
        amount: refund.amount / 100,
        metadata: {
          razorpayRefundId: refund.id,
          refundStatus: refund.status,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Razorpay error';
      throw new Error(`Failed to refund Razorpay payment: ${message}`);
    }
  }
}
