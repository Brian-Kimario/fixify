# UPI Payment Compliance & Security Checklist

**Status**: Phase 7 (Post-MVP) | **Last Updated**: October 1, 2026  
**Audience**: Developers, Security Team, Compliance Officer

---

## Table of Contents

1. [Pre-Launch Checklist](#pre-launch-checklist)
2. [NPCI/RBI Guidelines](#ncpirbi-guidelines)
3. [PCI DSS v4.0.1 Compliance](#pci-dss-v401-compliance)
4. [DPDP Act Compliance](#dpdp-act-compliance)
5. [Security Implementation Checklist](#security-implementation-checklist)
6. [Testing & Validation](#testing--validation)
7. [Monitoring & Audit](#monitoring--audit)
8. [Incident Response](#incident-response)

---

## Pre-Launch Checklist

### Before Phase 7 Release

- [ ] **Razorpay Account Verification**
  - [ ] Account fully verified with MSME documents
  - [ ] KYC/AML approval from Razorpay
  - [ ] Webhook credentials configured
  - [ ] Test & production keys separated
  - [ ] IP whitelisting configured (if applicable)

- [ ] **Payment Infrastructure**
  - [ ] UPI Intent Flow implemented and tested
  - [ ] Webhook endpoint secured and monitored
  - [ ] Error handling for all failure scenarios
  - [ ] Retry logic implemented
  - [ ] Fallback payment methods configured
  - [ ] Rate limiting implemented (50 requests/min per user)

- [ ] **Database & Security**
  - [ ] Migrations applied (UPI fields, indexes)
  - [ ] RLS policies verified on payments table
  - [ ] Audit logging implemented
  - [ ] Encryption at rest verified
  - [ ] HTTPS only enforced
  - [ ] Database backups tested

- [ ] **Environment & Configuration**
  - [ ] Razorpay keys in environment (not hardcoded)
  - [ ] Webhook secret configured
  - [ ] .env.local not committed
  - [ ] .env.example updated with UPI variables
  - [ ] Service-role key never in NEXT_PUBLIC_*
  - [ ] API keys rotated before launch

- [ ] **Documentation & Runbooks**
  - [ ] UPI_INTEGRATION_GUIDE.md complete
  - [ ] UPI_QR_CODES.md complete
  - [ ] Incident response guide created
  - [ ] Webhook payload documentation
  - [ ] Error codes documented
  - [ ] Support playbook created

- [ ] **Testing Completed**
  - [ ] Unit tests for payment logic (>90% coverage)
  - [ ] Integration tests for webhook handling
  - [ ] E2E tests for complete payment flows
  - [ ] RLS security tests
  - [ ] Authorization tests
  - [ ] Load tests (100+ concurrent payments)
  - [ ] Failover tests

- [ ] **Compliance Review**
  - [ ] Legal review completed
  - [ ] DPDP Act compliance verified
  - [ ] PCI DSS requirements met
  - [ ] RBI guidelines followed
  - [ ] NPCI guidelines implemented
  - [ ] Privacy policy updated

- [ ] **Monitoring & Alerting**
  - [ ] Payment success rate monitoring
  - [ ] Error rate tracking
  - [ ] Webhook lag monitoring
  - [ ] Database query performance verified
  - [ ] Security alerts configured
  - [ ] Alerting on payment anomalies (>10% failure rate, unusual amounts)

- [ ] **Customer Communication**
  - [ ] UPI payment option visible on checkout
  - [ ] Help documentation created
  - [ ] FAQ updated
  - [ ] Support team trained
  - [ ] Error messages user-friendly
  - [ ] Success confirmation clear

---

## NPCI/RBI Guidelines

### 1. UPI Payment Method Compliance

**Deadline**: February 28, 2026 (UPI Collect Deprecation)

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| **UPI Intent must be primary method** | REQUIRED | ✅ Implemented in UPI_INTEGRATION_GUIDE.md |
| **QR Code support (alternative)** | REQUIRED | ✅ Implemented in UPI_QR_CODES.md |
| **No UPI Collect method** | REQUIRED | ✅ Explicitly excluded; Intent only |
| **Support Google Pay Intent** | RECOMMENDED | ⏳ Phase 7 - Sprint 3 |
| **Turbo UPI support (if approved)** | OPTIONAL | ⏳ Phase 7 - Sprint 2 (pending approval) |

**Verification**:
```sql
-- Verify no UPI Collect in production
SELECT COUNT(*) FROM payments 
WHERE method = 'upi_collect' AND created_at > '2026-02-28'::date;
-- Should return 0
```

### 2. Transaction Limits Enforcement

**Per RBI Guidelines**:

```sql
-- Transaction limit check: ₹1,00,000 max per transaction
CREATE OR REPLACE FUNCTION validate_upi_transaction_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.method IN ('upi_intent', 'upi_qr', 'turbo_upi')
    AND NEW.amount > 10000000 THEN -- 10000000 paise = ₹1,00,000
    RAISE EXCEPTION 'UPI transaction exceeds ₹1,00,000 limit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_upi_limits
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION validate_upi_transaction_limit();
```

**Daily Limit**: Depends on bank/customer; Razorpay enforces on customer side. Fixify enforces at UI level.

### 3. Two-Factor Authentication (Mandatory April 2026)

⚠️ **CRITICAL**: RBI mandates 2FA for all digital payments from April 1, 2026

```typescript
// src/lib/auth/enforce2FA.ts

export async function require2FAForPayment(userId: string) {
  const user = await supabaseServer
    .from('profiles')
    .select('two_fa_enabled')
    .eq('id', userId)
    .single()

  if (!user.data?.two_fa_enabled) {
    throw new Error('2FA required for payments. Please enable in security settings.')
  }

  return true
}

// In payment flow:
export async function processUPIPayment(...args) {
  await require2FAForPayment(customerId) // Will throw if 2FA not enabled
  // Continue with payment
}
```

**Implementation Checklist**:
- [ ] 2FA setup in user profile
- [ ] TOTP support (Google Authenticator, Microsoft Authenticator)
- [ ] SMS OTP as backup
- [ ] Recovery codes generated
- [ ] Enforcement after April 1, 2026

### 4. Settlement Timeline

| Channel | Settlement | Responsibility |
|---------|-----------|-----------------|
| **UPI** | Real-time (T+0) | Razorpay handles; Fixify receives webhook |
| **Refunds** | Within 24 hours | Both parties coordinate |
| **Disputes** | 180-day window | Razorpay/Banks handle |

**Verification**:
- Monitor settlement time in dashboard
- Alert if settlement delayed >2 hours
- Track refund processing time

### 5. Dispute Handling

```sql
-- Dispute tracking
CREATE TABLE payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id),
  razorpay_dispute_id TEXT UNIQUE,
  amount INT,
  reason TEXT,
  status TEXT CHECK(status IN ('open', 'under_review', 'won', 'lost', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS: Customers see their own disputes
CREATE POLICY disputes_customer_read ON payment_disputes
  FOR SELECT
  USING (
    payment_id IN (
      SELECT id FROM payments WHERE customer_id = auth.uid()
    )
  );
```

---

## PCI DSS v4.0.1 Compliance

**Mandatory Compliance Date**: March 31, 2025 (Compliance Date NOW)

### 1. Never Store Payment Card Data

**VIOLATION**: Storing card numbers, CVV, expiry

```typescript
// ❌ NEVER DO THIS
const payment = {
  card_number: '4532123412341234', // ❌ VIOLATION
  cvv: '123', // ❌ VIOLATION
}

// ✅ CORRECT: Use Razorpay token
const payment = {
  razorpay_token_id: 'token_abc123', // ✅ Razorpay handles storage
}
```

**Verification**:
```sql
-- Check no card data in database
SELECT column_name FROM information_schema.columns
WHERE table_name = 'payments' AND column_name ILIKE '%card%'
  AND column_name NOT IN ('card_provider', 'card_network');
-- Should return empty result
```

### 2. Tokenization for Recurring Payments

For future Phase 8 (recurring services):

```typescript
// src/lib/payments/tokenization.ts

export async function createTokenizedPayment(
  customerId: string,
  amount: number
) {
  // Use stored Razorpay token, never fetch raw payment data
  const token = await getCustomerToken(customerId)
  
  if (!token) {
    throw new Error('No saved payment method')
  }

  const payment = await razorpay.payments.create({
    amount,
    currency: 'INR',
    customer_notify: true,
    token: token.razorpay_token_id, // Token, not card data
  })

  return payment
}
```

### 3. Strong Encryption

**Status**: ✅ Implemented via Supabase

```sql
-- Supabase provides encryption at rest
-- Verify in Supabase dashboard: Settings → Database

-- For PII in payments table:
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  customer_phone_encrypted TEXT ENCRYPTED;

-- All transmission over HTTPS (enforced by Next.js)
```

**Verification**:
- [ ] All database traffic uses SSL/TLS
- [ ] HTTPS enforced (HSTS headers)
- [ ] No unencrypted payment data in transit
- [ ] Encryption keys rotated yearly

### 4. Secure Payment Gateway Configuration

```typescript
// src/lib/supabase/server.ts

// ✅ CORRECT: Use authenticated session only
export const supabaseServer = createServerClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY, // Server-only
  {
    cookies: {
      getAll() { /* */ },
      setAll() { /* */ },
    },
  }
)

// Never expose service-role key to client
```

### 5. Vulnerability Scanning

**Requirement**: Monthly security scanning

```bash
# Run OWASP dependency check
npm audit --audit-level=high

# Run SonarQube static analysis
sonar-scanner \
  -Dsonar.projectKey=fixify \
  -Dsonar.projectName=Fixify \
  -Dsonar.sources=src
```

**Schedule**: Monthly automated scans, monthly manual review

### 6. Access Control & Logging

**Requirement**: Restrict payment data access

```sql
-- Only admins and support can view full payment details
CREATE POLICY payments_admin_only ON payments
  FOR SELECT
  USING (
    (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
    OR (auth.uid() IN (SELECT id FROM profiles WHERE role = 'support'))
  );

-- Audit all access
CREATE OR REPLACE FUNCTION audit_payment_access() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (action, entity_type, entity_id, actor_user_id)
  VALUES ('view_payment', 'payment', NEW.id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## DPDP Act Compliance

**Data Protection**: India's privacy law (effective immediately)

### 1. Data Localization (Mandatory)

**Requirement**: All personal data must be stored in India

```sql
-- Track data location
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  data_location TEXT DEFAULT 'India' CHECK(data_location = 'India');

-- 24-hour purge for foreign data (if any)
CREATE OR REPLACE FUNCTION purge_foreign_data() RETURNS void AS $$
BEGIN
  DELETE FROM payments
  WHERE data_location != 'India'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule: Run daily via cron
```

**Verification**:
- Supabase region: Asia-Southeast (Singapore) is closest to India
- Request India region if available from Supabase
- Document data center location in privacy policy

### 2. Consent Management

**Requirement**: Explicit consent for payment processing

```typescript
// src/components/customer/PaymentConsent.tsx

export function PaymentConsent({ onConsent }: { onConsent: () => void }) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="space-y-4">
      <label className="flex items-start space-x-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">
          I consent to process my payment using UPI. I understand my data will be
          processed according to Fixify's Privacy Policy and DPDP Act guidelines.
          <a href="/privacy-policy" className="text-blue-600 underline">
            {' '}
            Read more
          </a>
        </span>
      </label>

      <Button onClick={onConsent} disabled={!agreed} className="w-full">
        Continue to Payment
      </Button>
    </div>
  )
}
```

**Store Consent**:
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMP,
  consent_version TEXT;
```

### 3. Right to Data Deletion

**Requirement**: Customer can request data deletion after 90 days

```typescript
// src/lib/gdpr/deletePaymentData.ts

export async function deleteCustomerPaymentData(customerId: string) {
  // Mark for deletion (don't hard delete for audit trail)
  await supabaseServer
    .from('payments')
    .update({ marked_for_deletion: true, deletion_requested_at: new Date() })
    .eq('customer_id', customerId)

  // Hard delete after 90 days (scheduled job)
  // This complies with DPDP Act
}

// Scheduled job (runs daily)
export async function hardDeleteMarkedPayments() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  await supabaseServer
    .from('payments')
    .delete()
    .eq('marked_for_deletion', true)
    .lt('deletion_requested_at', ninetyDaysAgo)
}
```

---

## Security Implementation Checklist

### Webhook Security

- [ ] **Signature verification** (HMAC-SHA256)
  ```typescript
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex')
  
  if (expectedSignature !== receivedSignature) {
    throw new Error('Signature verification failed')
  }
  ```

- [ ] **Idempotency** (no duplicate processing)
  ```typescript
  const existing = await db.webhookLogs.findOne({
    provider_event_id: event.id
  })
  if (existing) return { status: 'already_processed' }
  ```

- [ ] **Rate limiting** (prevent abuse)
  ```typescript
  // 100 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: (req) => req.ip,
  })
  ```

### Payment Flow Security

- [ ] **Amount verification** (server-side only)
  ```typescript
  const quote = await db.quotes.findById(quoteId)
  if (quote.total * 100 !== amount) {
    throw new Error('Amount mismatch')
  }
  ```

- [ ] **Authorization checks** (customer owns job)
  ```typescript
  const job = await db.jobs.findById(jobId)
  if (job.customer_id !== auth.uid()) {
    throw new Error('Unauthorized')
  }
  ```

- [ ] **Status machine validation** (only valid transitions)
  ```typescript
  const validTransitions = {
    PENDING: ['PAYMENT_PROCESSING'],
    PAYMENT_PROCESSING: ['COMPLETED', 'FAILED'],
  }
  if (!validTransitions[currentState]?.includes(newState)) {
    throw new Error('Invalid state transition')
  }
  ```

- [ ] **2FA enforcement** (after April 1, 2026)
  ```typescript
  if (Date.now() > new Date('2026-04-01').getTime()) {
    await require2FA(userId)
  }
  ```

### Logging & Audit

- [ ] **Never log payment amounts** (except last 4 digits)
- [ ] **Never log card data** (not applicable for UPI)
- [ ] **Audit sensitive actions** (role changes, payment processing)
- [ ] **Mask PII** in logs (phone, email partially)
- [ ] **Log retention** (90 days for development, 1 year for audit)

```typescript
// ✅ CORRECT
console.log({
  action: 'payment_processed',
  payment_id: paymentId,
  last_4_vpa: vpa.slice(-4), // masked
  amount: amount, // OK for non-sensitive
  status: 'completed',
})

// ❌ WRONG
console.log({
  full_vpa: vpa, // Don't log full VPA
  card_number: '4532...', // Never
  cvv: '***', // Never
})
```

### Database Security

- [ ] **RLS enabled** on `payments`, `invoices`, `upi_qr_codes`
- [ ] **No direct UPI payment data access** from client
- [ ] **Encryption at rest** enabled
- [ ] **Backup encryption** verified
- [ ] **Connection SSL/TLS** enforced

```sql
-- Verify RLS is enabled
SELECT * FROM pg_tables
WHERE tablename = 'payments' AND rowsecurity = true;
```

---

## Testing & Validation

### Unit Tests

```typescript
// tests/payments.unit.test.ts

describe('Payment Security', () => {
  it('should reject payment if amount exceeds ₹1,00,000', async () => {
    expect(() => {
      validateUPIAmount(10000001) // ₹1,00,000.01
    }).toThrow('Amount exceeds limit')
  })

  it('should reject payment if customer does not own job', async () => {
    const payment = await createUPIPayment(
      'job_123', // belongs to customer A
      50000,
      'customer_b_id' // trying to pay as customer B
    )
    expect(payment.success).toBe(false)
  })

  it('should enforce 2FA after April 1, 2026', async () => {
    MockDate.set('2026-04-02')
    expect(() => {
      processPaymentWithout2FA()
    }).toThrow('2FA required')
  })

  it('should not process duplicate webhooks', async () => {
    await handleWebhook(event1)
    const result = await handleWebhook(event1) // Same event
    expect(result.message).toBe('already_processed')
  })

  it('should verify Razorpay signature', async () => {
    const validSignature = generateSignature(payload, secret)
    expect(() => {
      handleWebhookWithSignature(payload, 'invalid_signature')
    }).toThrow('Signature verification failed')
  })
})
```

### Integration Tests

```typescript
// tests/payments.integration.test.ts

describe('UPI Payment Flow', () => {
  it('should complete end-to-end UPI Intent payment', async () => {
    const job = await createTestJob()
    const quote = await createTestQuote(job.id, 50000)

    const orderResult = await createUPIIntentPayment(
      job.id,
      50000,
      job.customer_id
    )
    expect(orderResult.success).toBe(true)

    // Simulate Razorpay webhook
    await simulateWebhook('payment.authorized', {
      razorpay_order_id: orderResult.order_id,
      razorpay_payment_id: 'pay_test_123',
    })

    // Verify job state changed to COMPLETED
    const updatedJob = await getJob(job.id)
    expect(updatedJob.current_state).toBe('COMPLETED')
  })

  it('should create invoice after payment', async () => {
    await processPaymentWebhook(webhookData)
    const invoice = await getInvoiceByPaymentId(webhookData.payment_id)
    expect(invoice).toBeDefined()
    expect(invoice.status).toBe('issued')
  })
})
```

### Security Scanning

```bash
# Run weekly security scans
npm audit
npm audit fix

# Run monthly vulnerability scanning
snyk test

# Run static code analysis
eslint src/ --ext .ts,.tsx
```

---

## Monitoring & Audit

### Dashboard Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Payment Success Rate** | >95% | <85% |
| **UPI Method Share** | >60% of payments | <40% |
| **Average Payment Time** | <3 minutes | >10 minutes |
| **Webhook Success Rate** | >99% | <95% |
| **Error Rate** | <1% | >5% |
| **Avg Dispute Rate** | <0.1% | >0.5% |

### Audit Logging

```sql
-- All payment actions logged
INSERT INTO audit_logs (
  action, entity_type, entity_id, actor_user_id,
  old_value, new_value, metadata, created_at
) VALUES (
  'payment_completed', 'payment', payment_id, customer_id,
  NULL, '{"status":"completed"}',
  '{"method":"upi_intent","amount":50000}',
  NOW()
);

-- Query audit trail
SELECT * FROM audit_logs
WHERE entity_type = 'payment'
AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

### Compliance Reports

**Monthly Compliance Report** (run automatically):
```typescript
export async function generateComplianceReport() {
  return {
    period: '2026-09',
    metrics: {
      total_payments: 12345,
      upi_payments: 8234, // 66.7%
      success_rate: 0.9652,
      failed_payments: 422,
      disputes: 8, // 0.065%
      security_incidents: 0,
      data_deletion_requests: 2,
      gdpr_violations: 0,
    },
    compliance_status: 'COMPLIANT',
    certification: 'PCI DSS v4.0.1, DPDP Act, NPCI Guidelines',
  }
}
```

---

## Incident Response

### Payment System Down

**Steps**:
1. Immediate: Disable UPI payments, enable card/netbanking fallback
2. Notify customers via UI banner
3. Page on-call engineer
4. Start incident channel
5. Investigate root cause
6. Communicate ETA
7. Restore and verify
8. Post-mortem within 24 hours

```typescript
// src/lib/payments/emergencyFallback.ts

export async function enableEmergencyFallback() {
  await supabaseServer.from('system_config').update({
    payment_methods: ['card', 'netbanking'], // UPI disabled
    fallback_enabled: true,
    fallback_reason: 'UPI system maintenance',
  })

  // Notify customers
  await broadcastNotification(
    'UPI temporarily unavailable. Other payment methods are ready.'
  )
}
```

### Webhook Failures

**Detection**:
- Track webhook lag (should be <10 seconds)
- Alert if any webhook fails 3 times
- Automatic retry with exponential backoff

```typescript
export async function handleWebhookFailure(webhookId: string) {
  const retryCount = await incrementRetryCount(webhookId)

  if (retryCount > 3) {
    // Manual intervention needed
    await escalateToSupport({
      issue: `Webhook ${webhookId} failed 3 times`,
      severity: 'HIGH',
    })
  } else {
    // Retry with exponential backoff
    const delay = Math.pow(2, retryCount) * 1000
    setTimeout(() => retryWebhook(webhookId), delay)
  }
}
```

### Fraud Detected

**Actions**:
1. Block customer account
2. Disable payment processing
3. Alert compliance team
4. Lock transaction
5. Investigation
6. Restore or reject payment

---

## Sign-Off

**Document Owner**: Security/Compliance Team  
**Last Reviewed**: October 1, 2026  
**Next Review**: January 1, 2027

**Compliance Officer Sign-Off**: _________________ Date: _______

---

**Document Version**: 1.0  
**Status**: Ready for compliance review
