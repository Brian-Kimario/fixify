# Phase 1/1.5 Testing Guide — Legal Pages & Payment Flow

**Last Updated:** October 4, 2026  
**Status:** Ready for testing

---

## Quick Start

### 1. Start the Development Server

```bash
cd /Users/brian_kimario/Downloads/fixify
npm run dev
```

Wait for:
```
✓ Ready in XXXms
```

The app will be available at: **http://localhost:3000**

---

## Part A: Testing Legal Pages in Browser

Legal pages are **already created and live**. They don't require authentication.

### Test 1: Terms of Service

1. Open browser: http://localhost:3000/terms
2. You should see:
   - Title: "Terms of Service"
   - Yellow banner: "This policy is provisional and marked for legal review"
   - Content sections with professional typography
   - Last updated: October 4, 2026
   - Links to other policies (e.g., /refund-policy)

### Test 2: Privacy Policy

1. Open browser: http://localhost:3000/privacy
2. You should see:
   - Title: "Privacy Policy"
   - Provisional banner
   - Data collection, usage, access model sections
   - Lists actual cookies (no fabricated claims)
   - Last updated: October 4, 2026

### Test 3: Cookie Policy

1. Open browser: http://localhost:3000/cookies
2. You should see:
   - Title: "Cookie Policy"
   - Provisional banner
   - Lists ONLY actual cookies:
     - sb-access-token (Supabase)
     - sb-refresh-token (Supabase)
     - fixify-session-id (App)
     - fixify-session-metadata (App)
     - fixify-csrf-token (CSRF)
   - States: "We do NOT use Google Analytics, Meta Pixel, or third-party tracking"

### Test 4: Refund Policy

1. Open browser: http://localhost:3000/refund-policy
2. You should see:
   - Title: "Refund Policy"
   - Provisional banner
   - Refund rules (100% before/after acceptance)
   - Processing timeline (5-7 business days)
   - Contact support email

---

## Part B: Testing Payment Flow

### Setup: Configure Mock Payments

```bash
# In your .env.local, ensure these are set:
MOCK_PAYMENTS=true
```

This enables MockProvider for development.

### Test 1: Create a Test Customer Account

You need an authenticated user to test payments.

```bash
# Via the UI:
1. Navigate to http://localhost:3000/auth/signup
2. Create account with any email/password
3. Complete signup flow
4. You'll be logged in
```

### Test 2: Create a Test Quote

Payments require a quote to exist. Via the database or UI:

```bash
# If using Supabase Studio:
1. Navigate to http://localhost:3001 (Supabase local studio)
2. Go to quotes table
3. Create a quote with:
   - job_id: (valid job UUID)
   - total: 5000
   - status: approved
```

### Test 3: Call Payment Endpoint

```bash
# Option A: Using curl (from terminal)

# First, get your session token from browser
# Developer Tools → Application → Cookies → find Supabase session

# Then call endpoint:
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "quote_id": "QUOTE_UUID_HERE"
  }'

# Expected response:
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440111",
  "orderId": "mock_order_1728057600000_a1b2c3d4e5",
  "metadata": {
    "isDemoPayment": true,
    "simulated": true,
    "amount": 5000,
    "currency": "INR"
  }
}
```

```bash
# Option B: Using Postman
1. New request → POST
2. URL: http://localhost:3000/api/payments/create
3. Headers:
   - Content-Type: application/json
   - Cookie: sb-access-token=YOUR_TOKEN
4. Body (JSON):
   {
     "quote_id": "QUOTE_UUID_HERE"
   }
5. Send
6. Check response for paymentId and orderId
```

### Test 4: Verify Payment Record in Database

```bash
# Check Supabase Studio (http://localhost:5432):
# Select payments table
# You should see a new row with:
# - customer_id: your user ID
# - quote_id: the quote you used
# - status: "pending"
# - provider: "mock"
# - provider_reference: "mock_order_..."
# - amount: 5000
# - currency: "INR"
```

### Test 5: Verify Error Handling

#### Test 5a: Unauthenticated Request (should fail with 401)

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "quote_id": "QUOTE_UUID_HERE"
  }'

# Expected response:
{
  "error": "Unauthenticated"
}

# Status: 401
```

#### Test 5b: Invalid Quote ID (should fail with 404)

```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "quote_id": "00000000-0000-0000-0000-000000000000"
  }'

# Expected response:
{
  "error": "Quote not found"
}

# Status: 404
```

#### Test 5c: Quote Not Owned (should fail with 403)

Create two user accounts:
- User A: Account 1
- User B: Account 2

Create a quote as User A, then try to pay as User B:

```bash
# Get User A's session token, create a quote
# Then get User B's session token

curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=USER_B_TOKEN" \
  -d '{
    "quote_id": "USER_A_QUOTE_UUID"
  }'

# Expected response:
{
  "error": "Unauthorized"
}

# Status: 403
```

### Test 6: Verify Idempotency

Call payment creation twice with the same quote:

```bash
# First call
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "quote_id": "QUOTE_UUID_HERE"
  }'

# Response 1:
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440111",
  "orderId": "mock_order_1728057600000_a1b2c3d4e5",
  "metadata": {
    "isDemoPayment": true,
    "simulated": true
  }
}

# Second call (same quote)
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "quote_id": "QUOTE_UUID_HERE"
  }'

# Response 2 (should reuse same payment):
{
  "paymentId": "550e8400-e29b-41d4-a716-446655440111",  # SAME as Response 1
  "orderId": "mock_order_1728057600000_a1b2c3d4e5",    # SAME as Response 1
  "metadata": {
    "idempotent": true,  # Indicates reused payment
    "isDemoPayment": true
  }
}

# This is correct! Safe for page refreshes and retries.
```

---

## Part C: Understanding the Payment Flow

### What Happens Behind the Scenes

1. **Authentication Check**
   - Endpoint verifies user is logged in
   - Returns 401 if not

2. **Quote Validation**
   - Loads quote from database
   - Verifies quote exists
   - Returns 404 if not found

3. **Ownership Check**
   - Loads job associated with quote
   - Verifies current user is the customer
   - Returns 403 if not owner

4. **Idempotency Check**
   - Checks for existing pending/processing payment
   - Returns existing payment if already created
   - Prevents duplicate charges

5. **Payment Record Creation**
   - Creates payment record in database with status="pending"
   - Generates database payment ID (UUID)

6. **Provider Order Creation**
   - Calls MockProvider.createOrder() (or RazorpayProvider later)
   - MockProvider generates mock order ID with timestamp
   - Returns order details

7. **Update Payment Reference**
   - Updates payment record with provider_reference
   - Payment ready for confirmation

8. **Response**
   - Returns paymentId, orderId, and metadata
   - Frontend uses this for payment confirmation

### Why Backend Owns State

```
WRONG (Frontend owns state):
  Frontend: "I'm paying now"
  Frontend: "Update payment status to PAID"
  ← INSECURE: Frontend can fake payments

CORRECT (Backend owns state):
  Frontend: "Create payment for quote X"
  Backend: "OK, here's a payment record"
  Provider: "Payment received"
  Backend: "Update payment to PAID"
  ← SECURE: Only backend can confirm payment
```

---

## Part D: MockProvider Details

### When MockProvider is Used

MockProvider is selected when:
- `MOCK_PAYMENTS=true` environment variable is set
- `NODE_ENV !== 'production'` (development or staging)

### MockProvider Features

#### createOrder()
- Generates mock order ID: `mock_order_{timestamp}_{randomString}`
- Returns immediately (no network call)
- Safe for development/testing

#### verifyPayment()
- Succeeds by default
- Fails if `MOCK_PAYMENT_FAIL=true` environment variable is set
- Used for testing failure scenarios

#### refundPayment()
- Simulates successful refund
- Returns mock refund ID
- Used for testing refund flows

#### Production Safety

```typescript
constructor() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock payments disabled in production');
  }
}
```

This ensures MockProvider **cannot accidentally be used in production**. If someone tries:

```bash
# In production
NODE_ENV=production npm run dev

# Error on startup:
# Error: Mock payments disabled in production
```

---

## Part E: Transitioning to Razorpay

When Razorpay onboarding is complete:

### Step 1: Set Environment Variables

```bash
# .env.production.local (do NOT commit)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# DO NOT set MOCK_PAYMENTS in production
```

### Step 2: Provider Factory Automatically Selects Razorpay

```typescript
// In src/lib/payments/get-provider.ts
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  return new RazorpayProvider();  // ← Automatically selected
}
```

### Step 3: No Other Changes Needed

- Payment endpoint continues to work
- Frontend code unchanged
- Database schema unchanged
- RLS policies unchanged
- Only payment processing changes (mock → real)

---

## Troubleshooting

### Dev Server Won't Start

```bash
# Error: Port 3000 already in use

# Solution: Kill existing process
kill -9 $(lsof -t -i:3000)

# Then start again
npm run dev
```

### Legal Pages Show 404

```bash
# Solution: Restart dev server and wait for compilation
npm run dev
# Wait for "✓ Ready in XXXms" message
# Then reload browser
```

### Payment Endpoint Returns 500

```bash
# Check terminal output for error details
# Common issues:
# 1. MOCK_PAYMENTS not set → set to "true"
# 2. Quote doesn't exist → use valid quote_id
# 3. Not authenticated → login first

# Fix and retry
```

### Payment Endpoint Returns 401 Even When Logged In

```bash
# Solution: Check session cookie

# Developer Tools → Application → Cookies
# Look for: sb-access-token
# If missing or expired, logout and login again

# Or pass token in Authorization header:
curl -X POST http://localhost:3000/api/payments/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quote_id": "..."}'
```

---

## Verification Checklist

- [ ] Dev server starts successfully
- [ ] http://localhost:3000/terms loads (legal page visible)
- [ ] http://localhost:3000/privacy loads
- [ ] http://localhost:3000/cookies loads
- [ ] http://localhost:3000/refund-policy loads
- [ ] All pages show provisional banner
- [ ] Authenticated user can create payment (201 response)
- [ ] Unauthenticated request returns 401
- [ ] Invalid quote returns 404
- [ ] Payment record appears in database
- [ ] Multiple calls are idempotent (same payment returned)

---

## What's Working

✅ **Legal Pages:** All 4 pages created, accessible, properly formatted, provisional notice included  
✅ **Payment Endpoint:** Full validation (auth, quote ownership, idempotency)  
✅ **MockProvider:** Simulates payment flow, production-safe  
✅ **Database:** Payments table exists with proper schema  
✅ **Architecture:** Provider abstraction ready for Razorpay  

---

## What Needs Phase 2

Phase 2 will add:
- Professional verification submission endpoint
- Admin review dashboard
- Footer links to legal pages
- Auth flow integration
- Job acceptance enforcement (unverified → 403)

---

## Questions?

- Legal page content: See files in `src/app/(marketing)/{terms,privacy,cookies,refund-policy}/`
- Payment logic: See `src/app/api/payments/create/route.ts`
- Provider abstraction: See `src/lib/payments/`
- Database schema: Check Supabase migrations in `supabase/migrations/`
