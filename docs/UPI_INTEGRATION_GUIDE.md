# UPI Payment Integration Guide

**Status**: Phase 7 (Post-MVP) | **Priority**: Critical for India market  
**Payment Provider**: Razorpay | **Currency**: INR  
**Last Updated**: October 1, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [UPI Payment Methods](#upi-payment-methods)
3. [UPI Intent Flow (Recommended)](#upi-intent-flow-recommended)
4. [Turbo UPI (In-App)](#turbo-upi-in-app)
5. [UPI QR Codes](#upi-qr-codes)
6. [Google Pay Intent](#google-pay-intent)
7. [Compliance & Security](#compliance--security)
8. [Webhook Handling](#webhook-handling)
9. [Testing Strategy](#testing-strategy)
10. [Error Handling & Fallbacks](#error-handling--fallbacks)
11. [Performance Considerations](#performance-considerations)

---

## Overview

UPI (Unified Payments Interface) is India's real-time payment system operated by NPCI. It processes 185+ billion transactions annually and is the **preferred payment method for Indian consumers** (~60% of digital payments).

### Why UPI?

| Factor | Impact |
|--------|--------|
| **Market Share** | 60% of Indian digital payments |
| **Success Rate** | 92-95% (UPI Intent), vs 70-75% for cards |
| **User Experience** | One-tap payment, no OTP friction |
| **Availability** | Pre-installed on 95%+ of Indian phones |
| **Cost** | 0% to 2% (vs 2-3% for card) |
| **Speed** | Real-time settlement, no fraud holds |

### Critical Timeline

⚠️ **URGENT**: UPI Collect Method Deprecated Feb 28, 2026  
✅ **MANDATORY**: UPI Intent or QR Code flow by March 2026

---

## UPI Payment Methods

### Priority Matrix

```
┌─────────────────────────────────────────────────────┐
│ PRIORITY │ METHOD          │ SUCCESS  │ USE CASE    │
├─────────────────────────────────────────────────────┤
│ 1 (MUST) │ UPI Intent      │ 92-95%   │ All flows   │
│ 2 (SHOULD) │ Turbo UPI      │ 95%+     │ In-app      │
│ 3 (NICE) │ UPI QR Codes    │ 90%      │ Invoices    │
│ 4 (OPT)  │ Google Pay      │ 94%      │ Mobile web  │
│ 5 (NO)   │ UPI Collect     │ 75%      │ DEPRECATED  │
└─────────────────────────────────────────────────────┘
```

### Implementation Roadmap

**Phase 7 - Sprint 1**: UPI Intent Flow (mandatory by Feb 2026)  
**Phase 7 - Sprint 2**: Turbo UPI + QR Codes  
**Phase 7 - Sprint 3**: Google Pay Intent  
**Phase 8+**: Advanced features (auto-recurring, link-based payments)

---

## UPI Intent Flow (Recommended)

### Overview

UPI Intent redirects the customer to their preferred UPI app (Google Pay, PhonePe, Paytm, etc.), provides a smooth payment experience, and returns to Fixify after completion.

**Success Rate**: 92-95%  
**User Experience**: Native app experience, fast  
**Implementation**: Medium complexity

### Architecture

```
Customer ──→ Razorpay Order API
                    ↓
         Razorpay generates order_id
                    ↓
Customer ──→ Razorpay Create Payment (UPI Intent)
                    ↓
         Razorpay redirects to UPI App
         (Google Pay, PhonePe, Paytm, etc.)
                    ↓
Customer ──→ UPI App ──→ Customer's Bank
         (authenticates with PIN/FaceID/fingerprint)
                    ↓
Bank processes payment → NPCI settlement
                    ↓
Razorpay Webhook ──→ Fixify Backend
         (payment.authorized / payment.failed)
                    ↓
Fixify Webhook Handler ──→ Update Order Status
         (verify signature, check idempotency)
                    ↓
Customer redirected back to Fixify
         (success page or retry)
```

### Database Schema Updates

```sql
-- Add UPI-specific fields to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  upi_vpa TEXT,  -- Virtual Payment Address (e.g., user@bank)
  upi_app TEXT,  -- App used (googlepay, phonepe, paytm)
  upi_ref_id TEXT,  -- UPI transaction reference
  upi_rrn TEXT;  -- Retrieval Reference Number

-- Add retry tracking
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  attempt_count INT DEFAULT 1,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP;
```

### Server Action: Create UPI Intent Payment

```typescript
// src/lib/payments/createUPIIntentPayment.ts

import { supabaseServer } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createUPIIntentPayment(
  jobId: string,
  amount: number, // in paise
  customerId: string
) {
  try {
    // 1. Validate job and amount server-side
    const { data: job, error: jobError } = await supabaseServer
      .from('jobs')
      .select('id, status, quote_id, customer_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job || job.customer_id !== customerId) {
      throw new Error('Unauthorized or invalid job')
    }

    const { data: quote } = await supabaseServer
      .from('quotes')
      .select('total, status')
      .eq('id', job.quote_id)
      .single()

    if (!quote || quote.total * 100 !== amount) {
      throw new Error('Amount mismatch')
    }

    // 2. Create Razorpay order
    const order = await razorpay.orders.create({
      amount, // in paise
      currency: 'INR',
      receipt: `job_${jobId}`,
      notes: {
        job_id: jobId,
        customer_id: customerId,
      },
    })

    // 3. Save order to database (idempotency tracking)
    const { data: payment, error: paymentError } = await supabaseServer
      .from('payments')
      .insert({
        job_id: jobId,
        customer_id: customerId,
        amount,
        currency: 'INR',
        method: 'upi_intent',
        status: 'pending',
        razorpay_order_id: order.id,
        attempt_count: 1,
        last_attempt_at: new Date(),
      })
      .select('id')
      .single()

    if (paymentError) {
      throw new Error(`Failed to save payment record: ${paymentError.message}`)
    }

    // 4. Return order details for client
    return {
      success: true,
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      customer_name: 'Fixify Customer', // fetch from profile in production
      customer_email: '', // fetch from auth in production
      customer_contact: '', // fetch from profile in production
      payment_db_id: payment.id,
    }
  } catch (error) {
    console.error('UPI Intent Payment Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment creation failed',
    }
  }
}
```

### Client Component: UPI Intent Checkout

```typescript
// src/components/professional/UPIIntentCheckout.tsx

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createUPIIntentPayment } from '@/lib/payments/createUPIIntentPayment'

interface UPIIntentCheckoutProps {
  jobId: string
  customerId: string
  amount: number // in rupees
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
}

export function UPIIntentCheckout({
  jobId,
  customerId,
  amount,
  onSuccess,
  onError,
}: UPIIntentCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Create order on backend
      const result = await createUPIIntentPayment(jobId, amount * 100, customerId)

      if (!result.success) {
        throw new Error(result.error)
      }

      // 2. Open Razorpay UPI Intent
      const options = {
        key: result.key_id,
        order_id: result.order_id,
        amount: result.amount,
        currency: result.currency,
        name: 'Fixify',
        description: `Payment for Job #${jobId}`,
        customer_email: result.customer_email,
        customer_contact: result.customer_contact,
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
        },
        timeout: 120,
        callback_url: `/app/payments/callback/${result.payment_db_id}`,
        redirect: true,
        theme: {
          color: '#2563eb', // Fixify brand blue
        },
        handler: function (response: any) {
          // Note: This is for fallback; callback_url is primary
          onSuccess?.(response.razorpay_payment_id)
        },
        modal: {
          ondismiss: function () {
            setError('Payment cancelled by user')
          },
        },
      }

      // 3. Load Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        new (window as any).Razorpay(options).open()
      }
      document.body.appendChild(script)
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
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        You will be redirected to your UPI app to complete payment
      </p>
    </div>
  )
}
```

### Server Action: Handle Payment Callback

```typescript
// src/lib/payments/handleUPICallback.ts

import { supabaseServer } from '@/lib/supabase/server'
import Razorpay from 'razorpay'
import crypto from 'crypto'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function handleUPICallback(
  paymentId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  try {
    // 1. Verify signature (CRITICAL for security)
    const signatureBody = `${razorpayOrderId}|${razorpayPaymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(signatureBody)
      .digest('hex')

    if (expectedSignature !== razorpaySignature) {
      throw new Error('Signature verification failed')
    }

    // 2. Fetch payment from Razorpay (verify on provider side)
    const payment = await razorpay.payments.fetch(razorpayPaymentId)

    if (payment.status !== 'authorized' && payment.status !== 'captured') {
      throw new Error(`Invalid payment status: ${payment.status}`)
    }

    // 3. Check for duplicate processing (idempotency)
    const { data: existingPayment } = await supabaseServer
      .from('payments')
      .select('id, status')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .single()

    if (existingPayment && existingPayment.status === 'completed') {
      return {
        success: true,
        message: 'Payment already processed',
        payment_id: existingPayment.id,
      }
    }

    // 4. Update payment record
    const { error: updateError } = await supabaseServer
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
        upi_vpa: payment.vpa || null,
        upi_ref_id: payment.acquirer_data?.rrn || null,
        completed_at: new Date(),
      })
      .eq('id', paymentId)

    if (updateError) {
      throw new Error(`Failed to update payment: ${updateError.message}`)
    }

    // 5. Transition job state to COMPLETED
    const { data: paymentData } = await supabaseServer
      .from('payments')
      .select('job_id')
      .eq('id', paymentId)
      .single()

    if (paymentData?.job_id) {
      await supabaseServer.rpc('transition_job_state', {
        p_job_id: paymentData.job_id,
        p_new_state: 'COMPLETED',
        p_actor_id: 'system',
      })
    }

    // 6. Create invoice
    await createInvoiceForPayment(paymentId)

    // 7. Send confirmation email/SMS
    await notifyCustomerPaymentSuccess(paymentId)

    return {
      success: true,
      payment_id: paymentId,
      message: 'Payment processed successfully',
    }
  } catch (error) {
    console.error('UPI Callback Error:', error)

    // Log failed attempt
    await supabaseServer.from('audit_logs').insert({
      action: 'upi_callback_error',
      entity_type: 'payment',
      entity_id: paymentId,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    }
  }
}

async function createInvoiceForPayment(paymentId: string) {
  // Implementation: create invoice record
}

async function notifyCustomerPaymentSuccess(paymentId: string) {
  // Implementation: send email/SMS
}
```

---

## Turbo UPI (In-App)

### Overview

Turbo UPI is Razorpay's in-app payment flow where UPI payment happens without redirecting the user to another app.

**Success Rate**: 95%+  
**User Experience**: Fastest, no app switching  
**Status**: Requires Razorpay approval  
**Implementation**: Medium complexity (after approval)

### Requirements

1. **Merchant Eligibility**: High transaction volume, low dispute rate
2. **Technical Setup**: Razorpay mandate + special API endpoints
3. **Approval Timeline**: 2-4 weeks from Razorpay
4. **Compliance**: Enhanced fraud monitoring

### Implementation (Post-Approval)

```typescript
// src/lib/payments/createTurboUPIPayment.ts

export async function createTurboUPIPayment(
  jobId: string,
  amount: number,
  customerId: string
) {
  // Similar to UPI Intent, but with Turbo-specific parameters
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `job_${jobId}`,
    method_preferences: {
      // Turbo UPI specific
      turbo_upi: true,
    },
  })

  return {
    success: true,
    order_id: order.id,
    payment_method: 'turbo_upi',
  }
}
```

**Status for Fixify**: Will be implemented in Phase 7 - Sprint 2 after Razorpay approval.

---

## UPI QR Codes

See dedicated guide: `docs/UPI_QR_CODES.md`

**Use Cases**:
- Invoice display (customer scans to pay)
- Email invoices
- SMS receipts
- Printed receipts
- Marketing materials

---

## Google Pay Intent

### Overview

Google Pay Intent allows payment directly through Google Pay on mobile web browsers.

**Supported Devices**: Android Chrome v56+, iOS not supported  
**Success Rate**: 94%  
**User Experience**: Native payment sheet  

### Implementation

```typescript
// src/lib/payments/createGooglePayIntent.ts

export async function createGooglePayIntent(
  jobId: string,
  amount: number,
  customerId: string
) {
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `job_${jobId}`,
  })

  return {
    success: true,
    order_id: order.id,
    method: 'google_pay',
    // Client will use:
    // window.Razorpay(options) with method: { googleplay: true }
  }
}
```

**Detection**:
```typescript
function isGooglePayAvailable(): boolean {
  return (
    /Android/.test(navigator.userAgent) &&
    /Chrome/.test(navigator.userAgent)
  )
}
```

---

## Compliance & Security

### NPCI/RBI Guidelines

| Requirement | Implementation |
|-------------|-----------------|
| **UPI Collect Deprecated** | Use Intent/QR by Feb 28, 2026 |
| **Transaction Limit** | ₹1,00,000 per transaction (per RBI) |
| **Daily Limit** | ₹5,00,000 per day (per bank) |
| **2FA Mandatory** | All UPI payments require PIN/biometric |
| **Merchant Category Code** | MCC 6211 for SEBI registration |
| **Data Localization** | 100% data in India; delete foreign within 24h |
| **Dispute Window** | 180 days for UPI transaction disputes |
| **Settlement** | Real-time (T+0) for UPI payments |

### PCI DSS v4.0.1 (Mandatory March 31, 2025)

| Requirement | Fixify Implementation |
|-------------|----------------------|
| **Never log payment data** | Use Razorpay API; no card/VPA in logs |
| **Tokenization** | Razorpay handles tokenization |
| **Encryption** | All transit is HTTPS; database encryption enabled |
| **Multi-factor auth** | Server actions require session auth + webhook signature |
| **Vulnerability scanning** | Monthly scanning required |

### DPDP Act Compliance (Data Protection)

```sql
-- Data retention policy
ALTER TABLE payments ADD COLUMN deleted_at TIMESTAMP;

-- 24-hour purge for foreign data
CREATE OR REPLACE FUNCTION purge_foreign_payment_data() RETURNS void AS $$
BEGIN
  DELETE FROM payments
  WHERE created_at < NOW() - INTERVAL '24 hours'
    AND metadata ->> 'data_location' != 'India';
END;
$$ LANGUAGE plpgsql;
```

### Security Checklist

- [ ] Webhook signature verification (HMAC-SHA256)
- [ ] Idempotency checks (no duplicate processing)
- [ ] Amount verification server-side
- [ ] Authorization checks (customer owns job)
- [ ] RLS policies on payments table
- [ ] Audit logging for payment transitions
- [ ] 2FA for sensitive payment actions
- [ ] No payment data in logs/error messages
- [ ] Service-role key never exposed to client
- [ ] Rate limiting on payment endpoints

---

## Webhook Handling

### Setup

```typescript
// src/app/api/webhooks/razorpay/route.ts

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { handlePaymentWebhook } from '@/lib/payments/handlePaymentWebhook'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 1. Verify webhook signature
    const signature = request.headers.get('x-razorpay-signature')
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET!

    const hash = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex')

    if (hash !== signature) {
      console.error('Webhook signature verification failed')
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      )
    }

    // 2. Handle webhook event
    const { event, payload } = body

    if (event === 'payment.authorized' || event === 'payment.captured') {
      await handlePaymentWebhook(payload.payment)
    } else if (event === 'payment.failed') {
      await handlePaymentFailureWebhook(payload.payment)
    }

    // 3. Return 200 to acknowledge receipt
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentWebhook(payment: any) {
  // Implementation: process payment.authorized
}

async function handlePaymentFailureWebhook(payment: any) {
  // Implementation: handle payment.failed
}
```

### Webhook Events to Monitor

| Event | Action |
|-------|--------|
| `payment.authorized` | Payment successful, update order |
| `payment.captured` | Funds captured, complete job |
| `payment.failed` | Retry payment flow |
| `refund.created` | Process refund |
| `refund.processed` | Send confirmation |

---

## Testing Strategy

### Test VPAs (Virtual Payment Addresses)

```
success@razorpay    → Always succeeds
failure@razorpay    → Always fails
otp@razorpay        → Requires OTP (test PIN: 123456)
timeout@razorpay    → Simulates timeout
decline@razorpay    → Always declines
```

### Test Amounts

| Amount | Scenario |
|--------|----------|
| ₹1 | Minimum amount |
| ₹5,000 | Standard checkout |
| ₹1,00,000 | Maximum single transaction |
| ₹1,00,001 | Exceeds limit (should fail) |

### Test Flow

```typescript
// src/lib/payments/test-helpers.ts

export const UPI_TEST_SCENARIOS = {
  success: {
    vpa: 'success@razorpay',
    amount: 50000, // ₹500
    expectedStatus: 'completed',
  },
  failure: {
    vpa: 'failure@razorpay',
    amount: 50000,
    expectedStatus: 'failed',
  },
  otp: {
    vpa: 'otp@razorpay',
    amount: 50000,
    testPin: '123456',
    expectedStatus: 'pending_otp',
  },
  timeout: {
    vpa: 'timeout@razorpay',
    amount: 50000,
    expectedStatus: 'timeout',
  },
}

export async function testUPIFlow(scenario: keyof typeof UPI_TEST_SCENARIOS) {
  const testCase = UPI_TEST_SCENARIOS[scenario]
  // Implementation
}
```

### E2E Test Example

```typescript
// tests/upi-payment.e2e.test.ts

describe('UPI Payment Flow', () => {
  it('should complete UPI Intent payment with success VPA', async () => {
    const job = await createTestJob()
    const quote = await createTestQuote(job.id, 50000) // ₹500

    const payment = await createUPIIntentPayment(
      job.id,
      50000,
      job.customer_id
    )

    expect(payment.success).toBe(true)
    expect(payment.order_id).toBeDefined()

    // Simulate webhook
    await simulateRazorpayWebhook('payment.authorized', {
      order_id: payment.order_id,
      payment_id: 'pay_test_123',
      vpa: 'success@razorpay',
    })

    const updatedPayment = await supabaseServer
      .from('payments')
      .select('status')
      .eq('razorpay_order_id', payment.order_id)
      .single()

    expect(updatedPayment.data?.status).toBe('completed')
  })

  it('should handle payment failure gracefully', async () => {
    // Test failure scenario
  })

  it('should retry failed payments', async () => {
    // Test retry logic
  })
})
```

---

## Error Handling & Fallbacks

### Common Error Scenarios

```typescript
// src/lib/payments/upi-errors.ts

export const UPI_ERROR_SCENARIOS = {
  network_timeout: {
    code: 'RAZORPAY_TIMEOUT',
    userMessage: 'Request timed out. Please try again.',
    action: 'retry',
  },
  insufficient_funds: {
    code: 'RAZORPAY_INSUFFICIENT_FUNDS',
    userMessage: 'Insufficient balance in your UPI account.',
    action: 'change_method',
  },
  otp_invalid: {
    code: 'RAZORPAY_OTP_INVALID',
    userMessage: 'Incorrect OTP. Please try again.',
    action: 'retry_otp',
  },
  upi_unavailable: {
    code: 'RAZORPAY_UPI_UNAVAILABLE',
    userMessage: 'UPI service temporarily unavailable. Try again later.',
    action: 'retry',
  },
  merchant_declined: {
    code: 'RAZORPAY_MERCHANT_DECLINED',
    userMessage: 'Payment declined by merchant. Contact support.',
    action: 'contact_support',
  },
  limit_exceeded: {
    code: 'RAZORPAY_LIMIT_EXCEEDED',
    userMessage: 'Transaction exceeds daily limit. Try tomorrow.',
    action: 'change_method',
  },
}

export async function handleUPIError(razorpayError: any) {
  const scenario = Object.values(UPI_ERROR_SCENARIOS).find(
    (s) => s.code === razorpayError.code
  )

  if (!scenario) {
    return {
      userMessage: 'Payment failed. Please try again or contact support.',
      action: 'contact_support',
    }
  }

  return scenario
}
```

### Retry Logic

```typescript
// src/lib/payments/retryPayment.ts

export async function shouldRetryPayment(payment: any): Promise<boolean> {
  const { status, attempt_count, last_attempt_at } = payment

  // Don't retry if already completed
  if (status === 'completed') return false

  // Max 3 retry attempts
  if (attempt_count >= 3) return false

  // Wait 5 minutes between retries
  const lastAttempt = new Date(last_attempt_at)
  const timeSinceAttempt = Date.now() - lastAttempt.getTime()
  if (timeSinceAttempt < 5 * 60 * 1000) return false

  return true
}

export async function retryUPIPayment(paymentId: string) {
  const payment = await supabaseServer
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (!shouldRetryPayment(payment.data)) {
    throw new Error('Payment cannot be retried')
  }

  // Increment attempt counter
  await supabaseServer
    .from('payments')
    .update({
      attempt_count: payment.data.attempt_count + 1,
      last_attempt_at: new Date(),
    })
    .eq('id', paymentId)

  // Re-open payment form
  return createUPIIntentPayment(
    payment.data.job_id,
    payment.data.amount,
    payment.data.customer_id
  )
}
```

### Fallback Methods

```typescript
// If UPI fails after 3 attempts, offer alternatives
const PAYMENT_FALLBACK_METHODS = [
  'upi_intent',
  'google_pay', // Mobile only
  'card', // Falls back to card payment
  'netbanking', // For other scenarios
]

export async function getAvailablePaymentMethods(
  customerContext: any
): Promise<string[]> {
  const methods = ['upi_intent']

  if (customerContext.isAndroidChrome) {
    methods.push('google_pay')
  }

  methods.push('card', 'netbanking')

  return methods
}
```

---

## Performance Considerations

### Optimization Strategies

| Optimization | Implementation |
|--------------|-----------------|
| **Lazy load Razorpay** | Load checkout.js only when needed |
| **Cache order IDs** | Store recently created orders in Redis |
| **Webhook optimization** | Use event streams, not polling |
| **Database indexes** | Index on `razorpay_order_id`, `razorpay_payment_id` |
| **CDN for QR codes** | Cache generated QR codes |
| **Async processing** | Send confirmations asynchronously |

### Database Indexes

```sql
-- Add indexes for payment queries
CREATE INDEX idx_payments_razorpay_order_id 
  ON payments(razorpay_order_id);

CREATE INDEX idx_payments_razorpay_payment_id 
  ON payments(razorpay_payment_id);

CREATE INDEX idx_payments_status_created 
  ON payments(status, created_at DESC);

CREATE INDEX idx_payments_job_id 
  ON payments(job_id);

CREATE INDEX idx_payments_customer_id 
  ON payments(customer_id);
```

### Performance Metrics to Track

```typescript
// src/lib/analytics/paymentMetrics.ts

export async function trackPaymentMetric(
  method: 'upi_intent' | 'turbo_upi' | 'qr_code' | 'google_pay',
  metric: {
    duration_ms: number
    success: boolean
    attempt: number
  }
) {
  // Log to analytics service (Posthog, Mixpanel, etc.)
  // Track success rates by method, average completion time, etc.
}
```

---

## Next Steps

1. **Environment Setup** (see `.env.example` updates)
2. **Database Migrations** (UPI fields, indexes)
3. **Implement UPI Intent Flow** (Phase 7 - Sprint 1)
4. **Testing & Validation** (with test VPAs)
5. **QR Code Integration** (Phase 7 - Sprint 2)
6. **Turbo UPI Approval** (Razorpay submission)
7. **Monitoring & Observability** (payment dashboards)

---

## References

- [Razorpay UPI Intent Documentation](https://razorpay.com/docs/payments/upi/)
- [NPCI UPI Guidelines](https://www.npci.org.in/upi-guidelines)
- [RBI Payment System Guidelines](https://www.rbi.org.in/scripts/PaymentSystem.aspx)
- [PCI DSS v4.0.1 Compliance](https://www.pcisecuritystandards.org/)
- [DPDP Act 2023](https://www.meity.gov.in/data-protection)

---

**Document Version**: 1.0  
**Last Updated**: October 1, 2026  
**Status**: Ready for implementation
