# Fixify Security Rules

**Inclusion:** auto  
**Name:** security-rules  
**Description:** Security constraints, guardrails, and audit requirements for Fixify implementation.

---

## Core Security Principles

```
The frontend requests.
The backend validates.
The database enforces.
The audit log records.
```

If security depends only on frontend code or configuration, it is not security.

---

## 1. Never Trust Client Input

### 1.1 Prices

```javascript
// ❌ WRONG
const total = req.body.total  // client submitted
await payment.charge(total)

// ✅ RIGHT
const quote = await db.quotes.findById(quoteId)
const total = quote.total  // from database
await payment.charge(total)
```

### 1.2 Roles

```javascript
// ❌ WRONG
if (req.body.role === 'admin') {
  // grant admin access
}

// ✅ RIGHT
const profile = await db.profiles.findById(userId)
if (profile.role === 'admin') {
  // grant admin access
}
```

### 1.3 Job states

```javascript
// ❌ WRONG
await db.jobs.update(jobId, { current_state: req.body.state })

// ✅ RIGHT
await transition_job_state(jobId, userId, newState)  // function validates transition
```

### 1.4 Ownership

```javascript
// ❌ WRONG
const property = await db.properties.findById(propertyId)

// ✅ RIGHT
const property = await db.properties.findById(propertyId)
if (property.owner_customer_id !== userId) {
  throw new Error('Unauthorized')
}
```

---

## 2. Enforce Row Level Security (RLS)

### 2.1 Every protected table requires RLS

Customers/professionals own:
- `profiles` (partly)
- `customer_profiles`
- `professional_profiles`
- `addresses`
- `properties`
- `service_requests`
- `bookings`
- `jobs`
- `payments`
- `invoices`
- `reviews`
- `complaints`
- `property_service_history`

RLS policies must ensure:
- Customer A cannot read Customer B's data.
- Professional A cannot read Professional B's private data.
- Customer cannot modify professional verification.

### 2.2 Test RLS policies

```sql
-- Test as customer A
SELECT * FROM properties WHERE id = <customer-b-property>  -- Should return 0 rows

-- Test as professional
SELECT * FROM professional_profiles WHERE user_id != auth.uid()  -- Should return 0 rows
```

---

## 3. Protect Sensitive Server Operations

### 3.1 Role assignment

```sql
-- Only admin can change roles (via service-role key on server)
-- Never expose this to client
-- Example: admin server action
async function assignRole(userId, newRole) {
  // Server-side check: actor is admin
  // Audit log the change
  // Use service-role client
  await supabaseAdmin.from('profiles').update({ role: newRole }).eq('id', userId)
  await recordAuditLog('role_assigned', userId, { newRole })
}
```

### 3.2 Professional verification

```sql
-- Professional cannot set own verification_status
-- Only admin/support can verify
async function verifyProfessional(professionalId, admin_user_id) {
  // Server check: actor is admin
  // Update verification_status
  // Audit log
}
```

### 3.3 Job state transitions

```sql
-- Never UPDATE current_state directly
-- Use transition_job_state() function
CREATE OR REPLACE FUNCTION transition_job_state(
  p_job_id UUID,
  p_new_state TEXT,
  p_actor_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Validate actor authorization
  -- Validate state transition is allowed
  -- Update job.current_state
  -- Insert job_event record
  -- Return TRUE or raise error
END;
$$ LANGUAGE plpgsql;

-- Application calls function, never direct UPDATE
await supabase.rpc('transition_job_state', {
  p_job_id: jobId,
  p_new_state: 'ARRIVED',
  p_actor_id: userId
})
```

### 3.4 Quote approval

```sql
-- Quote approval is transactional
-- Quote cannot be modified after approval
-- Approval creates audit record
CREATE OR REPLACE FUNCTION approve_quote(
  p_quote_id UUID,
  p_customer_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check quote.job belongs to customer
  -- Check quote.status is 'pending_customer_approval'
  -- Check quote is not expired
  -- UPDATE quote.status = 'approved'
  -- INSERT job_event
  -- INSERT audit_log
  -- RETURN TRUE
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Payment Security

### 4.1 Never trust client payment status

```javascript
// ❌ WRONG
const { success } = req.body  // from client redirect
if (success) {
  await createPaymentRecord(orderId, 'paid')
}

// ✅ RIGHT
// Wait for payment provider webhook
// Verify webhook signature
// Check payment status with provider
// Only then create payment record
```

### 4.2 Webhook idempotency

```javascript
const handlePaymentWebhook = async (webhookData) => {
  // Verify signature
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(webhookData)
    .digest()
  
  if (signature !== req.headers['x-signature']) {
    throw new Error('Invalid signature')
  }
  
  // Check for duplicate webhook
  const existing = await db.webhookLogs.findOne({
    provider_event_id: webhookData.id
  })
  if (existing) {
    return { already_processed: true }  // idempotent
  }
  
  // Process payment
  await createPaymentRecord(webhookData)
  await recordWebhookLog(webhookData)
}
```

### 4.3 Financial calculations server-side

```javascript
// ❌ WRONG
const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.qty)
const total = subtotal + tax

// ✅ RIGHT (database)
const calculated = await db.raw(`
  SELECT
    SUM(line_total) AS subtotal,
    COALESCE(SUM(line_total) * tax_rate, 0) AS tax,
    SUM(line_total) * (1 + tax_rate) AS total
  FROM quote_items
  WHERE quote_id = $1
`, [quoteId])
```

---

## 5. Verification Document Access

### 5.1 Professional verification documents are private

```sql
-- verification_documents table requires RLS
-- Only professional who uploaded + admin can read
CREATE POLICY professional_read_own_verification ON verification_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM professional_profiles 
      WHERE user_id = <document owner>
    )
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

### 5.2 Never expose verification documents to other users

```javascript
// ❌ WRONG
const allDocuments = await supabase
  .from('verification_documents')
  .select('*')

// ✅ RIGHT (RLS blocks unauthorized access; further check on server)
const document = await supabase
  .from('verification_documents')
  .select('*')
  .eq('id', docId)
  .single()

if (document.verification_id.professional_id !== actor_id && actor_role !== 'admin') {
  throw new Error('Unauthorized')
}
```

---

## 6. Customer/Professional Data Isolation

### 6.1 Customer data access

```
Customer A can access:
- Own profile
- Own addresses
- Own properties
- Own service requests
- Own bookings
- Own jobs (as customer)
- Own invoices
- Own reviews
- Own complaints

Customer A cannot access:
- Customer B's anything
- Professional earnings
- Admin configurations
- Verification documents
```

### 6.2 Professional data access

```
Professional A can access:
- Own profile
- Own professional profile
- Own skills/availability/service areas
- Own assigned jobs
- Relevant customer/property info for assigned jobs
- Own quotes
- Own earnings records

Professional A cannot access:
- Professional B's data
- Customer B's unrelated properties
- Customer data outside own jobs
- Admin configurations
- Unrelated professional verification
```

---

## 7. Audit Logging Requirements

### 7.1 Log all sensitive actions

```sql
INSERT INTO audit_logs (
  actor_user_id, actor_role, action, entity_type, entity_id,
  old_value, new_value, metadata, created_at
) VALUES (...)
```

Actions to log:
- `role_assigned`
- `role_changed`
- `professional_verified`
- `professional_rejected`
- `professional_suspended`
- `booking_created`
- `job_assigned`
- `job_state_changed`
- `quote_created`
- `quote_approved`
- `quote_declined`
- `payment_received`
- `payment_failed`
- `refund_created`
- `invoice_issued`
- `complaint_created`
- `complaint_resolved`
- `admin_override`

### 7.2 Make audit immutable

```sql
-- No one can modify audit_logs (append-only)
-- No DELETE, UPDATE, or direct manipulation
CREATE POLICY audit_logs_immutable ON audit_logs
  FOR ALL
  USING (FALSE);

-- Only insert via trigger or trusted function
```

---

## 8. Service-Role Key Rules

### 8.1 Server-side only

```javascript
// ❌ WRONG (in client code or exposed in browser)
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY  // ← Never in browser
)

// ✅ RIGHT (in server action or API handler)
const supabaseAdmin = createServerClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,  // ← Server-only
  ...
)

// Use only for privileged operations
await supabaseAdmin.from('profiles').update({ role: 'admin' }).eq('id', userId)
```

### 8.2 Minimize service-role usage

- Use service-role only when operation genuinely requires elevated access.
- Prefer authenticated user operations with RLS policies where possible.
- Document why service-role is needed for each use case.

---

## 9. Authorization Testing Checklist

Test that these **fail** (are blocked):

```
[ ] Customer A reads Customer B's property
[ ] Customer A reads Customer B's booking
[ ] Customer A reads Customer B's invoice
[ ] Customer reads Professional A's earnings
[ ] Customer reads Professional A's verification documents
[ ] Professional A reads Professional B's profile
[ ] Professional A reads unrelated job
[ ] Professional approves Customer's quote (customer role only)
[ ] Professional sets own verification_status to VERIFIED
[ ] Unverified professional accepts job
[ ] Customer directly updates job.current_state
[ ] Customer sets payment.status to 'paid'
[ ] Customer approves another customer's quote
[ ] Support cancels job (admin role only)
[ ] Anyone modifies audit_logs
```

Test that these **pass** (are allowed):

```
[ ] Customer reads own property
[ ] Customer approves own quote
[ ] Professional reads assigned job
[ ] Admin reads any profile
[ ] Admin approves professional verification
[ ] Admin assigns job
[ ] Audit log records role change
[ ] RLS prevents unauthorized query
```

---

## 10. Encryption

### 10.1 TLS in transit

- All communication is HTTPS (enforced).
- All Supabase communication is encrypted.

### 10.2 At rest

- Database encryption: Supabase default.
- Sensitive fields: Consider column-level encryption for PII/payment info where applicable.
- Storage: Supabase Storage buckets are private by default.

---

## 11. Secrets Management

### 11.1 Environment variables

```env
# PUBLIC (safe)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# PRIVATE (server-only)
SUPABASE_SERVICE_ROLE_KEY=...
PAYMENT_PROVIDER_API_KEY=...
PAYMENT_WEBHOOK_SECRET=...
AI_PROVIDER_API_KEY=...
EMAIL_PROVIDER_API_KEY=...
```

Never use `NEXT_PUBLIC_` prefix for secret keys.

### 11.2 Deployment

- Use environment variable management (Vercel Secrets, etc.).
- Never commit `.env.local` to Git.
- Rotate secrets periodically.

---

## 12. Code Review Security Checklist

Before merging any PR:

- [ ] No client-side price calculations become authoritative.
- [ ] No client-side role checks are security decisions.
- [ ] Server validates all inputs.
- [ ] RLS policies applied to protected tables.
- [ ] Audit logs created for sensitive actions.
- [ ] Service-role key not exposed to client.
- [ ] Payment webhook is idempotent and verified.
- [ ] Job state transitions use controlled function.
- [ ] Authorization tests exist and pass.
- [ ] No secrets in code or logs.

