# UPI Payment Integration - Quick Start Guide

**For**: Developers implementing Phase 7-UPI  
**Time to Read**: 10 minutes  
**Time to Setup**: 2-3 hours  
**Get Full Docs**: See `UPI_DOCUMENTATION_INDEX.md`

---

## In 30 Seconds

Fixify needs UPI payments for India (mandatory by Feb 28, 2026). Razorpay handles the infrastructure. You implement:

1. **Create payment** → `createUPIIntentPayment()` (server action)
2. **Show checkout** → `<UPIIntentCheckout />` (client component)
3. **Handle webhook** → `POST /api/webhooks/razorpay` (backend)
4. **Complete flow** → Update DB, transition job, create invoice

---

## Setup (2-3 hours)

### Step 1: Environment Setup (10 min)
```bash
# Get Razorpay keys from dashboard
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXX
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Add to .env.local
echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_..." >> .env.local
echo "RAZORPAY_KEY_SECRET=..." >> .env.local
echo "RAZORPAY_WEBHOOK_SECRET=..." >> .env.local

# Verify
grep RAZORPAY .env.local
```

### Step 2: Database Migrations (20 min)
```bash
# Create migration
supabase migration new add_upi_fields

# Add to migration file:
ALTER TABLE payments ADD COLUMN upi_vpa TEXT;
ALTER TABLE payments ADD COLUMN attempt_count INT DEFAULT 1;
ALTER TABLE payments ADD COLUMN last_attempt_at TIMESTAMP;

# Apply
supabase migration up

# Verify
psql "$DATABASE_URL" -c "SELECT column_name FROM information_schema.columns WHERE table_name='payments' LIMIT 5;"
```

### Step 3: Server Action (45 min)
Create `src/lib/payments/createUPIIntentPayment.ts`:

```typescript
import { supabaseServer } from '@/lib/supabase/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function createUPIIntentPayment(
  jobId: string,
  amount: number, // paise
  customerId: string
) {
  // 1. Validate job + amount
  const { data: job } = await supabaseServer
    .from('jobs')
    .select('id, quote_id, customer_id')
    .eq('id', jobId)
    .single()

  if (!job || job.customer_id !== customerId) {
    throw new Error('Unauthorized')
  }

  const { data: quote } = await supabaseServer
    .from('quotes')
    .select('total')
    .eq('id', job.quote_id)
    .single()

  if (quote.total * 100 !== amount) {
    throw new Error('Amount mismatch')
  }

  // 2. Create Razorpay order
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `job_${jobId}`,
  })

  // 3. Store in DB
  const { data: payment } = await supabaseServer
    .from('payments')
    .insert({
      job_id: jobId,
      customer_id: customerId,
      amount,
      method: 'upi_intent',
      status: 'pending',
      razorpay_order_id: order.id,
    })
    .select('id')
    .single()

  return {
    success: true,
    order_id: order.id,
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    payment_db_id: payment.id,
  }
}
```

### Step 4: Client Component (45 min)
Create `src/components/customer/UPIIntentCheckout.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createUPIIntentPayment } from '@/lib/payments/createUPIIntentPayment'

export function UPIIntentCheckout({ jobId, customerId, amount }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Create order on backend
      const result = await createUPIIntentPayment(jobId, amount * 100, customerId)
      if (!result.success) throw new Error(result.error)

      // 2. Open Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        new (window as any).Razorpay({
          key: result.key_id,
          order_id: result.order_id,
          amount: amount * 100,
          currency: 'INR',
          method: { upi: true }, // UPI only
          callback_url: `/app/payments/callback/${result.payment_db_id}`,
          theme: { color: '#2563eb' },
        }).open()
      }
      document.body.appendChild(script)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <Button onClick={handlePayment} disabled={loading} size="lg" className="w-full">
        {loading ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
      </Button>
    </div>
  )
}
```

### Step 5: Webhook Handler (45 min)
Create `src/app/api/webhooks/razorpay/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-razorpay-signature')!

    // 1. Verify signature
    const hash = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(JSON.stringify(body))
      .digest('hex')

    if (hash !== signature) return NextResponse.json({ error: 'Invalid' }, { status: 401 })

    // 2. Handle payment events
    if (['payment.authorized', 'payment.captured'].includes(body.event)) {
      const { id: payment_id, order_id, amount, vpa } = body.payload.payment

      // Check for duplicate
      const { data: existing } = await supabaseServer
        .from('payments')
        .select('id, status')
        .eq('razorpay_payment_id', payment_id)
        .single()

      if (existing?.status === 'completed') {
        return NextResponse.json({ success: true })
      }

      // Update payment
      const { data: payment } = await supabaseServer
        .from('payments')
        .update({
          status: 'completed',
          razorpay_payment_id: payment_id,
          upi_vpa: vpa,
          completed_at: new Date(),
        })
        .eq('razorpay_order_id', order_id)
        .select('job_id')
        .single()

      // Complete job
      if (payment?.job_id) {
        await supabaseServer.rpc('transition_job_state', {
          p_job_id: payment.job_id,
          p_new_state: 'COMPLETED',
          p_actor_id: 'system',
        })

        // Create invoice
        await supabaseServer.from('invoices').insert({
          job_id: payment.job_id,
          amount,
          status: 'issued',
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

---

## Testing (30 min)

### Test VPAs (Razorpay provides)
```
success@razorpay     → Always succeeds ✅
failure@razorpay     → Always fails ❌
otp@razorpay         → Requires PIN: 123456 🔐
```

### Manual Test
1. Navigate to `/app/checkout`
2. Click "Pay with UPI"
3. Razorpay checkout opens
4. Select UPI method
5. Enter test VPA (e.g., `success@razorpay`)
6. Complete payment
7. Check database: Payment status should be `completed`
8. Check job: Status should be `COMPLETED`
9. Check invoice: Should be created

### Automated Test
```bash
npm run test -- tests/upi-intent.e2e.test.ts
```

---

## Common Errors & Fixes

| Error | Fix |
|-------|-----|
| `RAZORPAY_KEY_ID is not defined` | Add to .env.local |
| `Signature verification failed` | Check RAZORPAY_WEBHOOK_SECRET (must match Razorpay dashboard) |
| `Amount mismatch` | Verify amount in paise (₹500 = 50000 paise) |
| `Unauthorized` | Check `job.customer_id == customerId` |
| `Checkout not opening` | Load script before calling `window.Razorpay()` |

---

## Security Checklist

Before going to production:

- [ ] Amount verified on server (not from client)
- [ ] Authorization checked (customer owns job)
- [ ] Webhook signature verified (HMAC-SHA256)
- [ ] Idempotency implemented (no duplicate processing)
- [ ] No payment data in logs
- [ ] Service-role key never in browser
- [ ] RLS policies enforced on payments table
- [ ] Error messages don't expose internal details

---

## Full Implementation vs Quick Start

**This Quick Start**: 2-3 hours, basic UPI Intent payment  
**Full Implementation**: 12-16 hours, includes QR codes, Google Pay, Turbo UPI, comprehensive testing

**For production**, follow the full docs:
- `UPI_INTEGRATION_GUIDE.md` — Complete reference
- `UPI_QR_CODES.md` — QR code details
- `UPI_COMPLIANCE_CHECKLIST.md` — Security & compliance

---

## Next Steps

1. ✅ Set up environment variables
2. ✅ Create database migrations
3. ✅ Implement server action
4. ✅ Create client component
5. ✅ Add webhook endpoint
6. ✅ Test with test VPAs
7. → Read `UPI_INTEGRATION_GUIDE.md` for advanced features (QR, Turbo, Google Pay)
8. → Read `UPI_COMPLIANCE_CHECKLIST.md` for production requirements

---

## File Structure Created

```
docs/
├── UPI_INTEGRATION_GUIDE.md          ← Full implementation guide
├── UPI_QR_CODES.md                   ← QR code details
├── UPI_PAYMENT_FLOW_DIAGRAM.md       ← Visual flows
├── UPI_COMPLIANCE_CHECKLIST.md       ← Security & compliance
├── UPI_QUICK_START.md                ← This file
├── UPI_DOCUMENTATION_INDEX.md        ← Navigation guide
├── RAZORPAY_INTEGRATION.md           ← Razorpay setup
└── IMPLEMENTATION_TASKS.md           ← Phase 7-UPI tasks

src/
├── lib/payments/
│   ├── createUPIIntentPayment.ts     ← Create order
│   ├── handleUPICallback.ts          ← Process webhook
│   ├── generateDynamicQR.ts          ← QR generation
│   └── retryPayment.ts               ← Retry logic
├── components/customer/
│   ├── UPIIntentCheckout.tsx         ← Payment UI
│   ├── PaymentMethodSelector.tsx     ← Method chooser
│   └── QRCodeDisplay.tsx             ← QR display
└── app/api/webhooks/razorpay/
    └── route.ts                      ← Webhook endpoint

supabase/migrations/
└── 20261001_007_upi_payment_fields.sql ← DB schema
```

---

## Timeline

**Phase 7-UPI Sprint 1** (Jan 1-15, 2026):
- Implement UPI Intent (using this guide)
- Basic testing

**Phase 7-UPI Sprint 2** (Jan 15-Feb 5, 2026):
- Add QR codes (see UPI_QR_CODES.md)
- Apply for Turbo UPI

**Phase 7-UPI Sprint 3** (Feb 6-20, 2026):
- Google Pay support
- Compliance verification
- Production readiness

**Go-Live**: Feb 27, 2026 (before UPI Collect deprecation on Feb 28)

---

## Support

**Stuck?** Check:
1. `UPI_DOCUMENTATION_INDEX.md` — Navigation & troubleshooting
2. `UPI_INTEGRATION_GUIDE.md` — Detailed reference
3. Razorpay Dashboard → Documentation
4. This file's "Common Errors & Fixes" section

**Questions?** Ask:
- Senior developer on team
- Razorpay support (support@razorpay.com)
- Check Razorpay test dashboard for webhook logs

---

**Good luck! 🚀**

**Deadline**: February 28, 2026 (UPI Collect Deprecated)  
**Estimated Time**: 2-3 weeks (3 sprints)  
**Team**: 1-2 developers
