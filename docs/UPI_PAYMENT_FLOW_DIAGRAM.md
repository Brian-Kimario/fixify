# UPI Payment Flow Diagrams

**Status**: Phase 7 (Post-MVP) | **Last Updated**: October 1, 2026

---

## Table of Contents

1. [UPI Intent Flow](#upi-intent-flow)
2. [Turbo UPI Flow](#turbo-upi-flow)
3. [UPI QR Code Flow](#upi-qr-code-flow)
4. [Google Pay Intent Flow](#google-pay-intent-flow)
5. [Webhook Processing Flow](#webhook-processing-flow)
6. [Payment Error Recovery Flow](#payment-error-recovery-flow)
7. [Sequence Diagrams](#sequence-diagrams)

---

## UPI Intent Flow

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UPI INTENT FLOW                          │
│           (Primary payment method for Fixify)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Fixify     │      │   Razorpay       │      │ UPI App      │
│  Frontend   │      │                  │      │ (Google Pay, │
│             │      │                  │      │  PhonePe,    │
└─────────────┘      └──────────────────┘      │  Paytm, etc)│
      │                     │                    └──────────────┘
      │                     │
      │  1. Customer clicks │
      │     "Pay via UPI"   │
      │─────────────────────→
      │                     │
      │     2. Razorpay API Call
      │     ─────────────────→
      │     (Create Order)
      │                     │
      │                     │ 2b. Generate Order ID + Payment URL
      │     3. Order Details←─────
      │     ←─────────────────
      │                     │
      │  4. Open Checkout   │
      │  (Razorpay Modal)   │
      │                     │
      │  ┌─────────────────────────────────────┐
      │  │ Razorpay Checkout Modal             │
      │  │  [UPI Only] [Amount: ₹5000]         │
      │  │  ┌─────────────────────────────────┐│
      │  │  │ Select UPI App →                ││
      │  │  │ ❌ Google Pay ✓                 ││
      │  │  │ ❌ PhonePe                      ││
      │  │  │ ❌ Paytm                        ││
      │  │  └─────────────────────────────────┘│
      │  └─────────────────────────────────────┘
      │
      │  5. Redirect to UPI App
      │  ────────────────────────────→
      │                               │
      │                               │ 6. User enters PIN/FaceID/Fingerprint
      │                               │
      │               7. Bank processes payment
      │               (NPCI Settlement)
      │               
      │               8. Payment Success/Failure
      │  ←────────────────────────────
      │
      │  9. Redirect back to Fixify
      │  ←────────────────────────────
      │
      │  10. Show Success Page
      │      (Pending webhook confirmation)

Parallel: Razorpay Backend
─────────────────────────────────────
             │
    11. Payment Hook Event
    ────────────────────────→
             │
    12. Send Webhook (payment.authorized)
    ────────────────────────→ Fixify Backend

Fixify Backend
─────────────────────────────────────
             │
    13. Verify Webhook Signature
    14. Check Idempotency (no duplicate)
    15. Fetch Payment from Razorpay (verify)
    16. Update Payment Status → COMPLETED
    17. Transition Job → COMPLETED
    18. Create Invoice
    19. Send Confirmation Email/SMS

Result: ✅ Payment Complete
        ✅ Job completed
        ✅ Invoice issued
        ✅ Customer notified
```

### Data Flow

```
Customer Browser              Razorpay                Bank/UPI        Fixify Backend
       │                         │                       │                   │
       ├──Create Order Request───→                      │                   │
       │                         │                       │                   │
       │←─Order Details──────────┤                       │                   │
       │                         │                       │                   │
       │  User selects UPI + Amount                      │                   │
       │                         │                       │                   │
       ├─Create Payment Request──→                      │                   │
       │                         │                       │                   │
       │←─Redirect to UPI App────┤                       │                   │
       │                         │                       │                   │
       ├─Open UPI App───────────────→                   │                   │
       │                         │                       │                   │
       │                         │    ←UPI Intent───────│                   │
       │                         │                       │                   │
       │  [User approves payment in UPI app]            │                   │
       │                         │    ←UPI Request──────│                   │
       │                         │                       │                   │
       │                         │    Payment Response→ │                   │
       │                         │                       │                   │
       │←─Redirect back to Fixify                       │                   │
       │                         │                       │                   │
       │ (Page shows "Processing...")                    │                   │
       │                         │                       │                   │
       │                         │◄──Webhook Event───────┴─────────────────→│
       │                         │                       │                   │
       │                         │                       │   Verify + Process
       │                         │                       │   Update DB
       │                         │                       │   Send Confirmation
       │                         │                       │
       │←─Show Success Page──────────────────────────────┤
       │                         │                       │
       └──Email Confirmation─────────────────────────────→ Customer
```

---

## Turbo UPI Flow

### Turbo UPI (In-App Payment)

```
┌─────────────────────────────────────────────────────────────┐
│                    TURBO UPI FLOW                           │
│    (Fastest UPI method - no app switching required)         │
│     Status: Requires Razorpay approval (Phase 7 - Sprint 2) │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐                 ┌──────────────────┐
│  Fixify     │                 │   Razorpay       │
│  Frontend   │                 │  (Turbo API)     │
└─────────────┘                 └──────────────────┘
      │                              │
      │ 1. Click "Pay with UPI"      │
      │──────────────────────────────→
      │                              │
      │ 2. Razorpay Turbo Dialog     │
      │    (in-app payment sheet)    │
      │ ┌──────────────────────────┐ │
      │ │ Enter UPI Address/Phone  │ │
      │ │ [________@bank_____]     │ │
      │ │  OR                       │ │
      │ │ [__________________]     │ │
      │ │  [Pay Now] [Cancel]      │ │
      │ └──────────────────────────┘ │
      │                              │
      │ 3. User enters UPI address   │
      │ 4. UPI app auto-launches     │
      │    (if installed)            │
      │                              │
      │ 5. User enters PIN           │
      │                              │
      │ 6. Payment confirmed         │
      │←───────────────────────────←─┤
      │                              │
      │ 7. Razorpay callback         │
      │←──────────────────────────────
      │
      │ 8. Show Success
      │    (within 2-5 seconds)
      │    No redirect to external app!

Advantages over Standard UPI Intent:
─────────────────────────────────────
✓ 5x faster (no app switching)
✓ Lower abandonment rates
✓ Better user experience
✓ Single-tap payment
✓ Higher success rates (95%+)

⚠️  Requirements:
   • Razorpay approval needed
   • Enhanced fraud monitoring
   • Higher compliance requirements
   • Application to Razorpay required
```

---

## UPI QR Code Flow

### Static QR (Merchant VPA)

```
┌─────────────────────────────────────────────────────────────┐
│               STATIC UPI QR CODE FLOW                       │
│        (Customer scans, enters amount, pays)                │
└─────────────────────────────────────────────────────────────┘

Generate (One-time Setup)
─────────────────────────
Razorpay.qrCode.create({
  upi_link: true,
  amount: null,  ← No fixed amount
  description: "Fixify - Pay for Services"
})
         │
         ↓
    ┌────────────────┐
    │   QR Code ID   │
    │   Image URL    │
    │   UPI Link     │
    └────────────────┘
         │
         ↓
    Cache in Fixify
    (reuse for multiple customers)

Usage Flow
──────────
┌─────────────┐              ┌──────────┐         ┌─────────┐
│ Fixify Web  │              │ Customer │         │ UPI App │
│             │              │ Mobile   │         │         │
└─────────────┘              └──────────┘         └─────────┘
      │                           │                    │
      │ 1. Display QR Code        │                    │
      │────────────────────────→  │                    │
      │                           │                    │
      │                    2. Customer scans QR        │
      │                           │──UPI Intent───────→
      │                           │                    │
      │                    3. Opens UPI app            │
      │                           │                    │
      │                    4. Shows amount screen      │
      │                    ┌──────────────────────┐    │
      │                    │ Amount (₹): [____]   │    │
      │                    │ To: fixify@razorpay  │    │
      │                    │ [Pay] [Cancel]       │    │
      │                    └──────────────────────┘    │
      │                           │                    │
      │                    5. User enters ₹5,000       │
      │                    6. Enters PIN               │
      │                    7. Payment processed        │
      │                           │←───Response────────
      │                           │                    │
      │ 8. Webhook (payment received)←────────────────
      │←────────────────────────────                   │
      │
      │ 9. Show Success
      │    Amount confirmed: ₹5,000

Advantages:
───────────
✓ Reusable QR code
✓ No database lookup needed
✓ Customer controls amount
✓ Works on all UPI apps
✓ No app switching needed
✓ 88-90% completion rate

Use Cases:
──────────
• Website checkout page
• Marketing materials
• Social media
• Point of sale
• Email campaigns
```

### Dynamic QR (Invoice-Specific)

```
┌─────────────────────────────────────────────────────────────┐
│              DYNAMIC UPI QR CODE FLOW                       │
│      (Fixed amount per invoice, automated workflow)         │
└─────────────────────────────────────────────────────────────┘

Trigger: Job Completed
───────────────────────
Fixify Backend
     │
     ├─ 1. Calculate final amount
     │      (from quote/invoice)
     │
     ├─ 2. Create invoice record
     │      (invoice_id: INV-001234)
     │
     ├─ 3. Generate Dynamic QR
     │      Razorpay.qrCode.create({
     │        amount: 500000,  ← ₹5,000
     │        single_use: true,
     │        invoice_id: "INV-001234"
     │      })
     │
     ├─ 4. Store QR metadata
     │      (razorpay_qr_id, image_url)
     │
     ├─ 5. Generate invoice PDF
     │      (with embedded QR image)
     │
     ├─ 6. Send email to customer
     │      (with QR attachment)
     │
     └─→ Workflow Complete

Customer Receives Email
───────────────────────
┌────────────────────────────────────┐
│ Invoice #INV-001234                │
│ Fixify - Home Repair Service       │
├────────────────────────────────────┤
│ Amount: ₹5,000                     │
│ Date: Oct 1, 2026                  │
├────────────────────────────────────┤
│  [QR CODE IMAGE]                   │
│                                    │
│  Pay instantly with any UPI app    │
│                                    │
│  Scan with: Google Pay, PhonePe,   │
│             Paytm, BHIM            │
└────────────────────────────────────┘

Customer Scans QR
─────────────────
UPI App receives:
  • Fixed amount: ₹5,000
  • Merchant: fixify@razorpay
  • Reference: INV-001234
  
Customer sees:
┌──────────────────────┐
│ Invoice INV-001234   │
│ Amount: ₹5,000       │
│ To: Fixify           │
│ [Pay] [Cancel]       │
└──────────────────────┘

After Payment
─────────────
✓ QR marked as "paid"
✓ Single-use prevents duplicate
✓ Webhook triggers
✓ Invoice status → PAID
✓ Confirmation email sent
✓ QR closed (cannot reuse)

Advantages over Static:
──────────────────────
✓ Amount pre-filled (no entry errors)
✓ Automation-friendly
✓ Single-use option
✓ Higher completion (90-92%)
✓ Prevents duplicate payments
✓ Better for email delivery
```

---

## Google Pay Intent Flow

### Mobile Web Payment

```
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE PAY INTENT FLOW                         │
│  (Mobile web only - Android Chrome v56+)                   │
└─────────────────────────────────────────────────────────────┘

Prerequisites
─────────────
✓ Android device
✓ Chrome browser (v56+)
✓ Google Pay installed
✓ UPI account linked in Google Pay

Flow
────
Fixify Mobile Web
        │
        ├─ 1. Detect device capability
        │      (Android + Chrome)
        │
        ├─ 2. Show "Google Pay" button
        │      ┌─────────────────────┐
        │      │  💳 Google Pay      │
        │      │  Pay ₹5,000         │
        │      └─────────────────────┘
        │
        ├─ 3. Customer taps Google Pay
        │
        ├─ 4. Create Razorpay order
        │      (same as UPI Intent)
        │
        ├─ 5. Open Google Pay sheet
        │      ┌──────────────────────────┐
        │      │ Google Pay               │
        │      │ Fixify - Home Service    │
        │      │ Amount: ₹5,000           │
        │      │                          │
        │      │ [Google Account: user@]  │
        │      │ [Use saved UPI]          │
        │      │                          │
        │      │ [Verify] [Cancel]        │
        │      └──────────────────────────┘
        │
        ├─ 6. Customer verifies in Google Pay
        │      (UPI PIN / Biometric)
        │
        ├─ 7. Payment processed
        │      (real-time settlement)
        │
        ├─ 8. Return to Fixify
        │      (success callback)
        │
        └─ 9. Show confirmation

Advantages
──────────
✓ Integrated payment experience
✓ No additional app launch
✓ Saved payment methods
✓ Fast checkout (2-tap)
✓ High trust (Google backing)

Limitations
───────────
✗ Android only (no iOS)
✗ Desktop not supported
✗ Requires Chrome (no Safari)
✗ Lower market share vs UPI Intent

Implementation
───────────────
if (isAndroid() && isChrome()) {
  showGooglePayButton()  // Show option
} else {
  showUPIIntentButton()  // Fallback
}
```

---

## Webhook Processing Flow

### Event Processing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  WEBHOOK FLOW                               │
│            (Payment event processing)                       │
└─────────────────────────────────────────────────────────────┘

Razorpay Backend (When payment completes)
──────────────────────────────────────────
Payment → Bank Settlement
     │
     ├─ Match customer + amount
     ├─ Create razorpay_payment_id
     ├─ Trigger webhook event
     │
     └─→ Send HTTP POST to Fixify webhook endpoint

Fixify Webhook Endpoint
───────────────────────
POST /api/webhooks/razorpay
Headers:
  • x-razorpay-signature: <HMAC-SHA256>
  • content-type: application/json

Body:
{
  "event": "payment.authorized",
  "created_at": 1727779200,
  "payload": {
    "payment": {
      "id": "pay_1234567890",
      "order_id": "order_0987654321",
      "amount": 500000,
      "currency": "INR",
      "status": "authorized",
      "vpa": "user@okhdfcbank",
      "method": "upi",
      "acquirer_data": {
        "rrn": "100000000000"
      }
    }
  }
}

Processing Steps
────────────────

1. VERIFY SIGNATURE
   ├─ Compute HMAC-SHA256(payload, secret)
   ├─ Compare with x-razorpay-signature
   └─ Fail if mismatch → Return 401

2. CHECK IDEMPOTENCY
   ├─ Query: SELECT * FROM webhook_logs
   │  WHERE razorpay_payment_id = 'pay_123'
   ├─ If exists: Return 200 (already processed)
   └─ If new: Continue

3. VERIFY WITH RAZORPAY
   ├─ Call: Razorpay.payments.fetch(payment_id)
   ├─ Check: status = 'authorized' or 'captured'
   └─ Fail if mismatch → Return 422

4. FETCH PAYMENT RECORD
   ├─ Query: SELECT * FROM payments
   │  WHERE razorpay_order_id = 'order_123'
   ├─ Get: job_id, customer_id, amount
   └─ Fail if not found → Return 404

5. VERIFY AUTHORIZATION
   ├─ Check: payment.amount == stored_amount
   ├─ Check: customer owns job
   └─ Fail if unauthorized → Return 403

6. UPDATE DATABASE
   ├─ UPDATE payments SET
   │    status = 'completed',
   │    razorpay_payment_id = 'pay_123',
   │    vpa = 'user@okhdfcbank',
   │    completed_at = NOW()
   └─ INSERT audit_log entry

7. TRANSITION JOB STATE
   ├─ Call: transition_job_state(
   │    job_id = 'job_123',
   │    new_state = 'COMPLETED'
   │  )
   └─ Creates: job_event record

8. CREATE INVOICE
   ├─ Generate: invoice_id
   ├─ Link to: payment_id
   ├─ Set: status = 'issued'
   └─ Calculate: tax, totals

9. SEND CONFIRMATIONS
   ├─ Email: Payment confirmation
   ├─ SMS: "Payment received. Thank you!"
   ├─ In-app: Push notification
   └─ Dashboard: Update real-time

10. LOG EVENT
    ├─ INSERT webhook_logs
    ├─ INSERT audit_logs
    └─ Track: processing_time_ms

Return 200 OK ✓


Error Handling in Webhook
─────────────────────────

┌─────────────────────────────────────┐
│ Webhook received                    │
└─────────────────────────────────────┘
             │
             ├─→ Signature invalid
             │   └─→ Return 401 (reject)
             │       Alert: potential spoofing
             │
             ├─→ Duplicate event
             │   └─→ Return 200 (idempotent)
             │       Log: already processed
             │
             ├─→ Payment not found in DB
             │   └─→ Return 404 (failed)
             │       Alert: reconciliation needed
             │
             ├─→ Amount mismatch
             │   └─→ Return 422 (failed)
             │       Alert: fraud check
             │
             ├─→ Database error
             │   └─→ Return 500 (failed)
             │       Retry: exponential backoff
             │
             └─→ All checks pass
                 └─→ Return 200 ✓
                     Process: complete


Retry Strategy
──────────────

If webhook processing fails:

Retry 1: Wait 5 seconds → Retry
         ├─ Transient DB error?
         └─ Timeout?

Retry 2: Wait 30 seconds → Retry
         ├─ Still failing?
         └─ Escalate

Retry 3: Wait 5 minutes → Retry
         ├─ Database now recovered?
         └─ Last chance

After 3 attempts:
├─ Log as CRITICAL
├─ Alert ops team
├─ Halt further retries
└─ Manual investigation required
```

---

## Payment Error Recovery Flow

### Error Recovery Path

```
┌─────────────────────────────────────────────────────────────┐
│              ERROR RECOVERY FLOW                            │
│         (What happens when payment fails)                   │
└─────────────────────────────────────────────────────────────┘

Payment Failure Reasons
───────────────────────

1. CUSTOMER-SIDE ERRORS
   ├─ Insufficient funds
   ├─ Invalid UPI ID
   ├─ Incorrect PIN
   ├─ OTP expired
   ├─ Transaction limit exceeded
   └─ Account locked

2. PROVIDER-SIDE ERRORS
   ├─ Bank temporarily unavailable
   ├─ UPI gateway timeout
   ├─ Razorpay error
   └─ Network connectivity

3. MERCHANT-SIDE ERRORS
   ├─ Invalid amount
   ├─ Order expired
   ├─ Webhook processing error
   └─ Database error

Recovery Strategy
─────────────────

Payment Failed (any reason)
        │
        ├─ Customer-side error
        │   ├─→ Show specific message
        │   │   "Insufficient funds in your UPI account"
        │   ├─→ Suggest solutions
        │   │   "Add money or use another UPI ID"
        │   ├─→ Offer retry
        │   │   [Try Again] [Use Different Method] [Cancel]
        │   └─→ Wait 5 minutes before retry
        │
        ├─ Provider-side error (temporary)
        │   ├─→ Show: "Please try again in a moment"
        │   ├─→ Auto-retry after 30 seconds
        │   ├─→ If still fails: manual retry (max 3x)
        │   └─→ Fallback to card payment
        │
        ├─ Merchant-side error
        │   ├─→ Auto-recovery (if possible)
        │   ├─→ Log incident
        │   ├─→ Escalate to support
        │   └─→ Offer alternative method

User Flow After Failure
───────────────────────

Customer sees:
┌──────────────────────────────────────────────┐
│ ❌ Payment Failed                            │
│                                              │
│ Reason: Insufficient balance in your UPI    │
│ account (Razorpay error code: 40013)         │
│                                              │
│ What to do:                                  │
│ • Add money to your UPI account              │
│ • Try a different UPI ID                     │
│ • Use another payment method                 │
│                                              │
│ [Try Again]  [Use Card]  [Contact Support]   │
└──────────────────────────────────────────────┘

Database State After Failure
─────────────────────────────

UPDATE payments SET
  status = 'failed',
  razorpay_error_code = 'RAZORPAY_40013',
  razorpay_error_message = 'Insufficient funds',
  failed_at = NOW(),
  failure_reason = 'insufficient_balance'
WHERE razorpay_order_id = 'order_123';

INSERT INTO payment_failures (
  payment_id, reason, error_code, customer_message,
  recovery_action, retry_allowed, retry_count
) VALUES (
  'pay_456',
  'insufficient_balance',
  '40013',
  'Insufficient balance in your UPI account',
  'retry_after_5_min',
  true,
  0
);

Retry Logic
───────────

Maximum Retries: 3 per payment
Retry Window: 1 hour from initial attempt
Retry Delay:
  • Attempt 1: Wait 5 minutes
  • Attempt 2: Wait 15 minutes
  • Attempt 3: Wait 30 minutes
  • After 3x: Offer alternative methods

if (payment.failure_reason in ['network', 'timeout', 'bank_unavailable']
    && payment.retry_count < 3
    && time_since_attempt < 1_hour) {
  offer_retry()
  schedule_auto_retry()
} else if (payment.failure_reason in ['insufficient_funds', 'invalid_upi']) {
  offer_manual_retry()
  show_alternative_methods()
} else {
  escalate_to_support()
}

Webhook for Failed Payment
──────────────────────────

Razorpay sends: payment.failed

{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "id": "pay_1234567890",
      "order_id": "order_0987654321",
      "status": "failed",
      "error": {
        "code": "BAD_REQUEST_ERROR",
        "source": "razorpay",
        "step": "authorization",
        "reason": "invalid_vpa",
        "description": "Provided UPI address is invalid"
      }
    }
  }
}

Fixify processes:
1. Verify webhook signature
2. Update payment status → FAILED
3. Log failure reason
4. Check retry eligibility
5. Either:
   ├─ Schedule auto-retry
   ├─ Show manual retry button
   └─ Offer fallback methods
6. Send notification to customer

Customer Recovery Path (Ideal)
──────────────────────────────

Payment Failed (Step 1)
        │
        ├─ Show failure reason
        ├─ Suggest solution
        │
        ↓
Customer fixes issue (Step 2)
        │
        ├─ Adds money to UPI account
        │
        ↓
Customer retries (Step 3)
        │
        ├─ [Try Again] button clicked
        ├─ New order created
        ├─ Payment succeeds ✓
        │
        ↓
Job Completed (Step 4)
        │
        ├─ Invoice issued
        ├─ Confirmation sent
        └─ Success


Alternative: Fallback Method
────────────────────────────

If payment fails after 3 retries:
Show available alternatives:
✓ Card Payment (Visa/MasterCard)
✓ Net Banking
✓ Wallet (Paytm, Airtel Money)
✓ BNPL (PayLater)

Customer selects → New payment flow initiated
```

---

## Sequence Diagrams

### Complete UPI Intent Payment Sequence

```
Customer          Frontend           Backend           Razorpay          Bank
   │                 │                  │                 │               │
   ├─ Click Pay ────→ │                  │                 │               │
   │                 │                  │                 │               │
   │                 ├─ createUPIPayment→                │               │
   │                 │                  │                 │               │
   │                 │              order←─ orders.create─│               │
   │                 │                  │←─────────────────               │
   │                 │                  │                 │               │
   │                 ├──── order_id ────│                 │               │
   │                 │                  │                 │               │
   │◄─ Show Checkout ├─────────────────→                 │               │
   │  Modal          │                  │                 │               │
   │                 │                  │                 │               │
   │ Select UPI      │                  │                 │               │
   │ Enter Amount    │                  │                 │               │
   │ Click Pay       │                  │                 │               │
   │                 │                  │                 │               │
   │◄────────────────├─ Redirect to UPI─│                 │               │
   │ Open UPI App    │                  │                 │               │
   │                 │                  │                 │               │
   ├─ Select Account─|                  │                 │               │
   │ Enter PIN       │                  │                 │               │
   │ Approve         │                  │                 │               │
   │                 │                  │                 ├─ UPI Request ─→
   │                 │                  │                 │                │
   │                 │                  │                 │     Process   │
   │                 │                  │                 │     PIN Check │
   │                 │                  │                 │     Bank Req  │
   │                 │                  │                 │    ←─────────┤
   │                 │                  │                 │                │
   │                 │                  │           ← Payment OK ────     │
   │                 │                  │                 │                │
   │◄─────────────────┼──Redirect Back──┤                 │               │
   │  Show           │                  │                 │               │
   │  Processing     │                  │                 │               │
   │                 │                  │                 │               │
   │                 │                  │              Webhook ────────→  │
   │                 │                  ├─ payment.authorized             │
   │                 │                  │ │                              │
   │                 │                  │ Verify → Update DB             │
   │                 │                  │ ├─ Check RLS                   │
   │                 │                  │ ├─ Verify Amount               │
   │                 │                  │ ├─ Transition Job State        │
   │                 │                  │ └─ Create Invoice              │
   │                 │                  │                 │               │
   │                 │◄────── Success ──┤                 │               │
   │◄──────────────────────────────────┤                 │               │
   │  Show Success   │                  │                 │               │
   │  Invoice Link   │                  │                 │               │
   │  Download       │                  │                 │               │
   │                 │                  │                 │               │
   │◄─────────────────┼─ Confirmation ──┤                 │               │
   │  Email          │  Email/SMS       │                 │               │
   │  SMS            │                  │                 │               │
   │                 │                  │                 │               │
   └─────────────────└──────────────────└─────────────────┴───────────────┘
```

---

**Document Version**: 1.0  
**Status**: Reference guide for implementation  
**Last Updated**: October 1, 2026
