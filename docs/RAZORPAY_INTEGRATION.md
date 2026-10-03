# Razorpay Integration Guide for Fixify

**Date**: October 1, 2026  
**Payment Processor**: Razorpay  
**Currency**: Indian Rupees (INR)  
**Phase**: Phase 7 of Implementation

---

## Why Razorpay?

### Advantages
✅ **India-Based**: Built for Indian market  
✅ **INR Support**: Native rupee currency support  
✅ **Multiple Payment Methods**: Cards, UPI, NetBanking, Wallets  
✅ **Lowest Fees**: ~2% (competitive in India)  
✅ **Easy Integration**: Modal-based checkout (simple)  
✅ **Great Webhooks**: Reliable webhook delivery  
✅ **Excellent Sandbox**: Complete test environment  
✅ **Fast Support**: Responsive developer support  

### Alternatives Considered
- **Stripe**: International-focused, higher fees (2.9% + 30 INR), complex local compliance
- **Square**: Limited in India, not primary focus
- **PayU**: Works but Razorpay is simpler
- **Instamojo**: Micro-transactions focused, limited features

---

## Account Setup (30 minutes)

### Step 1: Create Razorpay Account
1. Go to https://razorpay.com
2. Click "Sign Up"
3. Enter email and password
4. Verify email
5. Complete business details (name, website, contact)

### Step 2: Get API Keys
1. Login to dashboard
2. Navigate to **Settings → API Keys**
3. You'll see:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret** (secret key)
4. Copy both (you'll need them for .env)

**Test vs Production**:
- `rzp_test_*` — Use for development/testing
- `rzp_live_*` — Use for production (after business verification)

### Step 3: Configure Webhooks
1. Go to **Settings → Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/razorpay`
3. Subscribe to events:
   - ✅ `payment.authorized`
   - ✅ `payment.captured`
   - ✅ `payment.failed`
4. Copy **Webhook Secret**

### Step 4: Update Environment
```env
# .env.local (development)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXX

# production
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
# (secrets via deployment platform secrets, not .env)
```

---

## Implementation Overview

### File Structure

```
src/
├── lib/
│   └── payments/
│       └── razorpay.ts              ← Payment adapter (create/verify)
│
├── app/
│   ├── app/bookings/[id]/
│   │   └── checkout/
│   │       └── page.tsx             ← Checkout page with PaymentCheckout
│   └── api/
│       ├── payments/razorpay/
│       │   ├── create-order/
│       │   │   └── route.ts         ← Create Razorpay order
│       │   └── verify/
│       │       └── route.ts         ← Verify payment
│       └── webhooks/razorpay/
│           └── route.ts             ← Webhook handler
│
└── components/
    └── customer/
        └── PaymentCheckout.tsx      ← UI component
```

### Key Concepts

#### 1. Amount Handling (Paise Conversion)
```
Razorpay uses PAISE (smallest unit)
1 INR = 100 paise

Example:
  Amount in rupees: ₹100
  Amount in paise: 10,000
  
Always convert: rupees × 100 → paise
Always convert back: paise ÷ 100 → rupees
```

#### 2. Payment Flow
```
Customer clicks "Pay ₹100"
  ↓
Frontend calls /api/payments/razorpay/create-order
  ↓
Server creates Razorpay order (via API)
  ↓
Frontend opens Razorpay Checkout modal
  ↓
Customer selects payment method & pays
  ↓
Razorpay processes payment
  ↓
Return to app with payment ID & signature
  ↓
Frontend calls /api/payments/razorpay/verify
  ↓
Server verifies signature & creates payment record
  ↓
Webhook confirms payment (async)
  ↓
Payment complete, send email
```

#### 3. Signature Verification
```
Server must verify every webhook and client response:

1. Create HMAC SHA256 of: orderId|paymentId
2. Use RAZORPAY_WEBHOOK_SECRET as key
3. Compare with signature from Razorpay
4. If matches → Trust the payment
5. If not → Reject as fraudulent
```

#### 4. Idempotency
```
Problem: What if webhook is sent twice?
Solution: Check if payment already recorded

1. On webhook arrival: Query database for provider_payment_id
2. If exists: Payment already processed → Return success (no duplicate)
3. If not: Process payment normally
```

---

## Code Implementation

### 1. Payment Adapter (`src/lib/payments/razorpay.ts`)

```typescript
import crypto from 'crypto'

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

/**
 * Create a payment order in Razorpay
 * @param bookingId - Booking identifier
 * @param amountInPaise - Amount in paise (rupees × 100)
 * @param customerEmail - Customer email
 * @param customerPhone - Customer phone (for pre-fill)
 * @returns Razorpay order object with order_id
 */
export async function createPaymentOrder(
  bookingId: string,
  amountInPaise: number,
  customerEmail: string,
  customerPhone: string
) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
      notes: {
        booking_id: bookingId,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Razorpay error: ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Verify webhook/client signature
 * Signature = HMAC-SHA256 of orderId|paymentId using webhook secret
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  return expected === signature
}
```

### 2. Create Order API (`src/app/api/payments/razorpay/create-order/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createPaymentOrder } from '@/lib/payments/razorpay'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amountInRupees } = await request.json()

    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify booking + amount (prevent client price manipulation)
    const supabase = createServerClient(...)
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, customer_id, amount')
      .eq('id', bookingId)
      .eq('customer_id', user.id)
      .single()

    if (!booking || booking.amount !== amountInRupees) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create Razorpay order (convert to paise)
    const order = await createPaymentOrder(
      bookingId,
      Math.round(amountInRupees * 100),
      user.email,
      user.user_metadata?.phone || ''
    )

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation failed:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
```

### 3. Webhook Handler (`src/app/api/webhooks/razorpay/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentSignature } from '@/lib/payments/razorpay'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(body)
    const { event, payload: data } = payload

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const { id: paymentId, order_id: orderId, amount } = data.payment

      // Check idempotency - already processed?
      const supabase = createServerClient(...)
      const { data: existing } = await supabase
        .from('payments')
        .select('id')
        .eq('provider_payment_id', paymentId)
        .single()

      if (existing) {
        return NextResponse.json({ received: true }) // Idempotent
      }

      // Create payment record
      await supabase.from('payments').insert({
        provider_payment_id: paymentId,
        provider_order_id: orderId,
        amount: amount / 100, // Convert paise to rupees
        currency: 'INR',
        status: 'paid',
        provider: 'razorpay',
      })

      // Mark job as completed
      // ... transition_job_state() call

      return NextResponse.json({ received: true })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

### 4. PaymentCheckout Component

```typescript
'use client'
import { useState } from 'react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function PaymentCheckout({ bookingId, amountInRupees, onSuccess }) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Create order
      const response = await fetch('/api/payments/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amountInRupees }),
      })

      const order = await response.json()

      // Open Razorpay modal
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: order.amount,
        currency: 'INR',
        handler: async (res) => {
          // Verify & create payment record
          const verifyRes = await fetch('/api/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: order.id,
              paymentId: res.razorpay_payment_id,
              signature: res.razorpay_signature,
              bookingId,
            }),
          })

          if (verifyRes.ok) {
            onSuccess()
          }
        },
      })

      razorpay.open()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handlePayment} disabled={loading}>
      Pay ₹{amountInRupees.toFixed(2)}
    </button>
  )
}
```

---

## Testing Checklist

### Development Testing (with rzp_test_* keys)

**Test Card**: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., 12/25)
- CVV: Any 3 digits

**Test Scenarios**:
- [ ] Create booking successfully
- [ ] Navigate to checkout page
- [ ] Razorpay modal opens
- [ ] Enter test card details
- [ ] Payment processes successfully
- [ ] Webhook receives payment event
- [ ] Payment record created in database with:
  - [ ] `amount` in rupees (not paise)
  - [ ] `currency: 'INR'`
  - [ ] `provider_payment_id` matches Razorpay
  - [ ] `status: 'paid'`
- [ ] Job state updated to COMPLETED
- [ ] Confirmation email sent
- [ ] Error page on failed card

### Webhook Testing (Local)

```bash
# Method 1: Use Razorpay Dashboard
1. Go to Settings → Webhooks
2. Find your webhook
3. Click "Test Webhook"
4. Check your app logs for receipt

# Method 2: Use ngrok (if local)
1. ngrok http 3000
2. Update webhook URL to ngrok URL
3. Process payment, see live webhook logs
```

### Amount Verification

```
Booking amount:    ₹500
Display to user:   ₹500.00
Create order with: 50000 (paise)
Razorpay processes: 50000 paise = ₹500
Store in DB:       500.00 (rupees)
```

---

## Deployment Checklist

### Before Going Live

- [ ] Switch from `rzp_test_*` to `rzp_live_*` keys
- [ ] Verify business with Razorpay (KYC)
- [ ] Update webhook URL to production domain
- [ ] Test payment flow end-to-end on production
- [ ] Verify webhook delivery on production
- [ ] Monitor payment success rate
- [ ] Setup alerts for failed payments
- [ ] Document payment process for support team

### Environment Variables

```env
# Production (.env or deployment secrets)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX  # Public
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX               # Secret (deployment platform)
RAZORPAY_WEBHOOK_SECRET=XXXXXXXXXXXXXXXX           # Secret (deployment platform)
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `Invalid signature` | Wrong webhook secret | Verify RAZORPAY_WEBHOOK_SECRET in .env |
| `Order not found` | Order ID doesn't exist | Check order creation response |
| `Amount mismatch` | Client sent wrong amount | Verify amount from database, not client |
| `Payment already recorded` | Duplicate webhook | Idempotency check working (good!) |
| `Webhook not triggering` | URL wrong/unreachable | Check webhook URL in Razorpay dashboard |
| `Can't open modal` | Missing Razorpay script | Ensure script loaded in component |
| `Currency error` | Wrong currency code | Use 'INR' (uppercase) |

---

## Security Best Practices

✅ **Always verify signatures** (payment + webhook)  
✅ **Never trust client for amount** (verify from database)  
✅ **Use HTTPS** (required by Razorpay)  
✅ **Keep secrets secret** (never commit keys)  
✅ **Check idempotency** (prevent duplicate records)  
✅ **Log all payments** (audit trail)  
✅ **Monitor success rate** (catch issues early)  

---

## Support Resources

- **Razorpay Docs**: https://razorpay.com/docs
- **API Reference**: https://razorpay.com/docs/api
- **Webhook Docs**: https://razorpay.com/docs/webhooks
- **Dashboard**: https://dashboard.razorpay.com
- **Support**: https://razorpay.com/support

---

## Next Steps

1. ✅ Create Razorpay account at https://razorpay.com
2. ✅ Get API keys and webhook secret
3. ✅ Add to .env.local
4. ✅ Implement payment adapter (src/lib/payments/razorpay.ts)
5. ✅ Create API routes (create-order, verify)
6. ✅ Create webhook handler
7. ✅ Build PaymentCheckout component
8. ✅ Test with test keys
9. ✅ Deploy to production with live keys

---

**Document Version**: 1.0  
**Created**: October 1, 2026  
**Status**: Ready for Implementation  
**Payment Provider**: Razorpay (India)  
**Currency**: INR (Indian Rupees)
