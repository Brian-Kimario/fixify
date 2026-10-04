/**
 * Payment Provider Factory
 *
 * Selects the appropriate payment provider based on environment and configuration.
 * Environment gates prevent production from accidentally using mock.
 */

import { PaymentProvider } from './provider';
import { MockProvider } from './providers/mock-provider';
import { RazorpayProvider } from './providers/razorpay-provider';

export function getPaymentProvider(): PaymentProvider {
  // Mock provider: enabled explicitly for development/testing
  if (process.env.MOCK_PAYMENTS === 'true' && process.env.NODE_ENV !== 'production') {
    return new MockProvider();
  }

  // Razorpay provider: use if credentials are configured
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return new RazorpayProvider();
  }

  // No provider configured
  throw new Error(
    'No payment provider configured. ' +
    'Set MOCK_PAYMENTS=true for development, or configure Razorpay credentials for production.'
  );
}
