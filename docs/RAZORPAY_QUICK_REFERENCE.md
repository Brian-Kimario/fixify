# Razorpay Quick Reference Card

**Payment Provider**: Razorpay  
**Currency**: ₹ INR (Indian Rupees)  
**Use Case**: Phase 7 Integration  
**Documentation**: See `docs/RAZORPAY_INTEGRATION.md` for full guide

---

## 🚀 Quick Setup (30 minutes)

```bash
# 1. Create account
Open: https://razorpay.com → Sign Up

# 2. Get API Keys
Dashboard → Settings → API Keys
Copy: Key ID (rzp_test_*) and Key Secret

# 3. Get Webhook Secret
Dashboard → Settings → Webhooks
Add: https://yourdomain.com/api/webhooks/razorpay
Copy: Webhook Secret

# 4. Update .env.local
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

---

## 💰 Amount Handling

```
IMPORTANT: Razorpay uses PAISE (not rupees)

1 INR = 100 paise

Examples:
  ₹100    →  10,000 paise
  ₹50.50  →  5,050 paise
  ₹1      →  100 paise

Conversion:
  To paise:   amount_in_rupees × 100
  To rupees:  amount_in_paise ÷ 100
```

---

## 📁 Files to Create

```
✓ src/lib/payments/razorpay.ts
  - createPaymentOrder()
  - verifyPaymentSignature()
  - getPaymentDetails()

✓ src/app/api/payments/razorpay/create-order/route.ts
  - Endpoint: POST /api/payments/razorpay/create-order

✓ src/app/api/payments/razorpay/verify/route.ts
  - Endpoint: POST /api/payments/razorpay/verify

✓ src/app/api/webhooks/razorpay/route.ts
  - Endpoint: POST /api/webhooks/razorpay (from Razorpay servers)

✓ src/components/customer/PaymentCheckout.tsx
  - Component: Displays ₹ amount, opens Razorpay modal
```

---

## 🔑 Key Functions

### Create Order
```typescript
await createPaymentOrder(bookingId, amountInPaise, email, phone)
// Returns: { id, amount, currency, receipt, ... }
```

### Verify Signature
```typescript
const isValid = verifyPaymentSignature(orderId, paymentId, signature)
// Returns: boolean
```

### Get Payment Details
```typescript
await getPaymentDetails(paymentId)
// Returns: { id, amount, status, ... }
```

---

## 🧪 Testing

### Test Card
```
Number:  4111 1111 1111 1111
Expiry:  12/25 (any future date)
CVV:     123 (any 3 digits)
```

### Test Flow
1. Process payment with test card
2. Verify webhook fires (check logs)
3. Verify payment record created
4. Verify job state changed
5. Verify email sent

---

## 🔐 Security Checklist

- [ ] Verify webhook signature on every webhook
- [ ] Verify client payment signature on every response
- [ ] Never trust client for amount (verify from DB)
- [ ] Check idempotency (prevent duplicate records)
- [ ] Use HMAC-SHA256 for signatures
- [ ] Store secrets in .env (never commit)
- [ ] Use HTTPS (required by Razorpay)

---

## 🚨 Common Mistakes

❌ **Using rupees instead of paise**
   → Always multiply by 100 when sending to Razorpay

❌ **Trusting client amount**
   → Always verify amount from booking in database

❌ **Not verifying signatures**
   → Webhook could be from attacker

❌ **Processing duplicate webhooks**
   → Check if payment already recorded (idempotency)

❌ **Committing API keys**
   → Use .env.local (add to .gitignore)

❌ **Missing webhook endpoint**
   → Razorpay can't confirm payment

---

## 📊 Payment Flow Diagram

```
Customer
  ↓
  clicks "Pay ₹500"
  ↓
PaymentCheckout component
  ↓
  POST /api/payments/razorpay/create-order
  ↓
Server (checks amount from DB)
  ↓
  calls Razorpay API (₹500 = 50,000 paise)
  ↓
Razorpay creates order
  ↓
returns order_id to client
  ↓
Frontend opens Razorpay modal
  ↓
Customer fills payment details
  ↓
Razorpay processes (checks card, auth, etc.)
  ↓
Payment successful
  ↓
Razorpay returns: paymentId + signature
  ↓
  POST /api/payments/razorpay/verify
  ↓
Server verifies signature
  ↓
  POST /api/webhooks/razorpay (from Razorpay)
  ↓
Server receives payment.captured event
  ↓
Create payment record (₹500 stored as rupees in DB)
  ↓
Update job state
  ↓
Send confirmation email
  ↓
✅ Payment Complete
```

---

## 🔗 Links

| Resource | Link |
|----------|------|
| Razorpay Docs | https://razorpay.com/docs |
| API Reference | https://razorpay.com/docs/api |
| Dashboard | https://dashboard.razorpay.com |
| Testing Docs | https://razorpay.com/docs/payments/testing |

---

## ⏱️ Estimated Time

- Account setup: 15 minutes
- API key configuration: 5 minutes
- Payment adapter code: 45 minutes
- API routes: 45 minutes
- Webhook handler: 45 minutes
- Component: 30 minutes
- Testing: 1 hour

**Total**: 4-5 hours coding + account setup

---

## ✅ Success Criteria

- [ ] Razorpay account created
- [ ] API keys obtained
- [ ] Webhook secret copied
- [ ] .env.local updated
- [ ] Payment adapter implemented
- [ ] API routes created
- [ ] Webhook handler working
- [ ] PaymentCheckout component renders
- [ ] Test payment processes successfully
- [ ] Webhook fires on payment
- [ ] Payment record in database
- [ ] Confirmation email sent
- [ ] Job state updated
- [ ] Ready for Phase 8

---

## 🚀 Production Deployment

```
1. Switch keys from rzp_test_* to rzp_live_*
2. Pass KYC verification with Razorpay
3. Update webhook URL to production
4. Deploy code with live keys
5. Test with real transaction
6. Monitor payment success rate
```

---

## 📞 Support

- **Razorpay Support**: https://razorpay.com/support
- **Documentation**: https://razorpay.com/docs
- **Integration Examples**: https://razorpay.com/docs/payments/integration-guides

---

**Quick Reference Version**: 1.0  
**Created**: October 1, 2026  
**Status**: Ready for Implementation
