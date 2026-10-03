# Fixify Integration Quick Start Checklist

**Print this & check off as you go!**

---

## 🔴 PHASE 1: Fix Critical Bugs (2-3 hours) — START HERE

- [ ] **Task 1.1**: Fix field names in `src/app/professional/actions.ts`
  - [ ] Change `assigned_professional_id` → `professional_id`
  - [ ] Change `state` → `current_state`
  - [ ] Change RPC param `state` → `p_new_state`
  - [ ] Add missing `p_actor_id` parameter to RPC call
  - [ ] Verify: `npm run lint` passes

- [ ] **Task 1.2**: Add `getCurrentUser` import if missing
  - [ ] Check imports at top of file
  - [ ] Add if not present: `import { getCurrentUser } from '@/lib/auth/getCurrentUser'`

- [ ] **Task 1.3**: Test in browser
  - [ ] Run: `npm run dev`
  - [ ] Navigate to: `http://localhost:3000/pro/jobs`
  - [ ] Should load without errors
  - [ ] Check browser console (F12) for errors
  - [ ] If errors, debug and fix

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟡 PHASE 2: Connect Professional Jobs (3-4 hours)

- [ ] **Task 2.1**: Replace mockJobs in `/pro/jobs/page.tsx`
  - [ ] Remove: `const mockJobs = [...]` hardcoded data
  - [ ] Add: Real query to Supabase
  - [ ] Verify: `npm run build` succeeds

- [ ] **Task 2.2**: Create `JobCard.tsx` component
  - [ ] File: `src/components/professional/JobCard.tsx`
  - [ ] Shows: job title, customer, status, amount
  - [ ] Click navigates to detail page

- [ ] **Task 2.3**: Update `/pro/jobs/[id]/page.tsx`
  - [ ] Remove: `const mockJobDetails = {...}`
  - [ ] Add: Real query for single job
  - [ ] Display: Timeline, status, buttons

- [ ] **Task 2.4**: Create `JobTimeline.tsx` component
  - [ ] Shows: Visual timeline of job events
  - [ ] Colors: State-based coloring

- [ ] **Task 2.5**: Test
  - [ ] Navigate: `/pro/jobs`
  - [ ] Verify: Real jobs display (not mockJobs)
  - [ ] Click job: Detail page loads
  - [ ] Verify: Customer, property, timeline show

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟡 PHASE 3: Seed Demo Data (2-3 hours)

- [ ] **Task 3.1**: Create seed migration
  - [ ] File: `supabase/migrations/20261001_001_seed_demo_data.sql`
  - [ ] Include: Service categories, services, brands, materials
  - [ ] Insert ~20 services across 6 categories

- [ ] **Task 3.2**: Apply migration
  - [ ] Run: `supabase migration up`
  - [ ] Verify: Data appears in Supabase dashboard

- [ ] **Task 3.3**: Test in UI
  - [ ] Navigate: `/app/services`
  - [ ] Verify: Services display in UI
  - [ ] Verify: Multiple categories visible

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🔵 PHASE 4: Implement Booking Flow (4-6 hours)

- [ ] **Task 4.1**: Create BookingWizard component
  - [ ] File: `src/components/customer/BookingWizard.tsx`
  - [ ] Step 1: Select category & service
  - [ ] Step 2: Select date/time
  - [ ] Step 3: Review price
  - [ ] Step 4: Confirm booking

- [ ] **Task 4.2**: Create booking route
  - [ ] File: `src/app/app/bookings/new/page.tsx`
  - [ ] Mount: BookingWizard component
  - [ ] Call: `createBooking()` on submit

- [ ] **Task 4.3**: Wire "Book Service" button
  - [ ] File: `src/app/app/services/[id]/page.tsx`
  - [ ] Add: "Book Now" button
  - [ ] Navigate to: `/app/bookings/new?service={id}`

- [ ] **Task 4.4**: Test end-to-end
  - [ ] Click "Book Service" from service detail
  - [ ] Complete booking wizard
  - [ ] Verify: Booking created in database
  - [ ] Verify: Redirect to booking confirmation

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🔵 PHASE 5: Job State Transitions (2-3 hours)

- [ ] **Task 5.1**: Create StateTransitionButtons component
  - [ ] File: `src/components/professional/StateTransitionButtons.tsx`
  - [ ] Buttons: Accept, Arrived, Complete, etc.
  - [ ] Show/hide based on current state

- [ ] **Task 5.2**: Create updateJobState server action
  - [ ] File: `src/lib/services/jobs.ts`
  - [ ] Call: `transition_job_state()` RPC
  - [ ] Return: Updated job

- [ ] **Task 5.3**: Wire buttons to action
  - [ ] File: `/pro/jobs/[id]/page.tsx`
  - [ ] On click: Call updateJobState()
  - [ ] Refresh: Job detail after update
  - [ ] Show: Success toast

- [ ] **Task 5.4**: Test
  - [ ] Open job detail
  - [ ] Click "Accept Job" → state changes
  - [ ] Timeline updates
  - [ ] No errors in console

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟢 PHASE 6: Quote Management (5-6 hours)

- [ ] **Task 6.1**: Create quote server actions
  - [ ] File: `src/lib/services/quotes.ts`
  - [ ] Functions:
    - [ ] `createQuote(jobId, items, total)`
    - [ ] `approveQuote(quoteId, customerId)`
    - [ ] `declineQuote(quoteId, customerId, reason)`

- [ ] **Task 6.2**: Build QuoteBuilder component
  - [ ] File: `src/components/professional/QuoteBuilder.tsx`
  - [ ] Add items: Labor, materials, fees
  - [ ] Calculate: Total with tax
  - [ ] Submit: Creates quote record

- [ ] **Task 6.3**: Build QuoteApproval component
  - [ ] File: `src/components/customer/QuoteApproval.tsx`
  - [ ] Show: Quote details & breakdown
  - [ ] Buttons: Approve, Decline
  - [ ] On approve: Trigger payment

- [ ] **Task 6.4**: Create routes
  - [ ] `/pro/jobs/[id]/quote/create` → QuoteBuilder
  - [ ] `/app/jobs/[id]/quote` → QuoteApproval

- [ ] **Task 6.5**: Test
  - [ ] Professional creates quote
  - [ ] Customer approves/declines
  - [ ] Quotes appear in job timeline

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟢 PHASE 7: Payment Integration (Razorpay - INR) (6-8 hours) ⚠️ REQUIRES SETUP

- [ ] **Pre-work**: Setup Razorpay account (India-based, best for INR)
  - [ ] [ ] **Create account**: https://razorpay.com
  - [ ] [ ] **Get API keys**: Key ID & Key Secret (from Settings → API Keys)
  - [ ] [ ] **Enable webhooks**: Settings → Webhooks, add payment endpoint
  - [ ] [ ] **Add to .env.local**: 
    ```
    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
    RAZORPAY_KEY_SECRET=...
    RAZORPAY_WEBHOOK_SECRET=...
    ```

- [ ] **Task 7.1**: Create Razorpay payment adapter
  - [ ] File: `src/lib/payments/razorpay.ts`
  - [ ] Function: `createPaymentOrder(bookingId, amountInPaise)` — returns order
  - [ ] Function: `verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature)` — validates payment
  - [ ] Function: `getPaymentDetails(razorpayPaymentId)` — fetch payment info

- [ ] **Task 7.2**: Build PaymentCheckout component
  - [ ] File: `src/components/customer/PaymentCheckout.tsx`
  - [ ] Show: Final amount in ₹ INR
  - [ ] Embed: Razorpay Checkout modal (via CDN)
  - [ ] Handle: Payment success/failure callbacks

- [ ] **Task 7.3**: Create webhook handler
  - [ ] File: `src/app/api/webhooks/razorpay/route.ts`
  - [ ] Verify: Webhook signature (HMAC SHA256)
  - [ ] Check: Idempotency (already processed?)
  - [ ] Create: Payment record in database
  - [ ] Trigger: Job state transition to next phase
  - [ ] Send: Confirmation email with INR amount

- [ ] **Task 7.4**: Wire checkout flow
  - [ ] Route: `/app/bookings/[id]/checkout`
  - [ ] Button: "Proceed to Payment" from booking
  - [ ] After payment: Show confirmation with order ID

- [ ] **Task 7.5**: Test locally with Razorpay sandbox
  - [ ] Use: Razorpay test mode (Key ID: rzp_test_...)
  - [ ] Test card: 4111 1111 1111 1111 (any future expiry, any CVV)
  - [ ] Test successful payment
  - [ ] Test failed payment (use invalid card)
  - [ ] Test webhook delivery (use Razorpay dashboard webhook tester)

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟢 PHASE 8: Professional Verification (4-5 hours)

- [ ] **Task 8.1**: Create verification server actions
  - [ ] File: `src/lib/services/verification.ts`
  - [ ] Function: `uploadVerificationDocument(professionalId, file, docType)`
  - [ ] Function: `getUnverifiedProfessionals()`
  - [ ] Function: `approveProfessional(professionalId, adminId)`
  - [ ] Function: `rejectProfessional(professionalId, reason, adminId)`

- [ ] **Task 8.2**: Build VerificationUpload component
  - [ ] File: `src/components/professional/VerificationUpload.tsx`
  - [ ] Form: Upload ID, license, insurance, background check
  - [ ] Validation: File size, format
  - [ ] On submit: Call uploadVerificationDocument()

- [ ] **Task 8.3**: Build VerificationQueue component
  - [ ] File: `src/components/admin/VerificationQueue.tsx`
  - [ ] List: Pending professionals
  - [ ] Preview: Uploaded documents
  - [ ] Buttons: Approve, Reject with reason

- [ ] **Task 8.4**: Create admin verification route
  - [ ] `/admin/verifications` → VerificationQueue

- [ ] **Task 8.5**: Test
  - [ ] Professional uploads documents
  - [ ] Admin sees in verification queue
  - [ ] Admin approves/rejects
  - [ ] Professional status updates

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟢 PHASE 9: Admin Dashboard (6-8 hours, or 4-5 for MVP)

- [ ] **Task 9.1**: Create admin service
  - [ ] File: `src/lib/services/admin.ts`
  - [ ] Query: All jobs with filtering
  - [ ] Query: All professionals with status
  - [ ] Query: Payment metrics
  - [ ] Query: Complaint tickets

- [ ] **Task 9.2**: Build main admin dashboard
  - [ ] File: `/admin/page.tsx`
  - [ ] Show: Live metrics (jobs, pros, revenue)
  - [ ] Links: Verification queue, disputes, payments

- [ ] **Task 9.3**: Build admin jobs page
  - [ ] `/admin/jobs` → List all jobs with filtering
  - [ ] Show: Status, professional, customer
  - [ ] Actions: Reassign, cancel, refund

- [ ] **Task 9.4**: Build admin professionals page
  - [ ] `/admin/professionals` → List all professionals
  - [ ] Show: Verification status, rating, completion count
  - [ ] Actions: Suspend, reactivate

- [ ] **Task 9.5**: Build admin payments page (optional for MVP)
  - [ ] `/admin/payments` → Transaction history
  - [ ] Show: Revenue summary

- [ ] **Task 9.6**: Test
  - [ ] Admin login
  - [ ] Access dashboard (verify role check works)
  - [ ] View jobs, professionals, payments
  - [ ] Approve/reject actions work

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🟢 PHASE 10: Notifications & Real-time (3-4 hours)

- [ ] **Pre-work**: Choose email provider
  - [ ] [ ] Options: SendGrid, Postmark, AWS SES
  - [ ] [ ] Create account, get API key
  - [ ] [ ] Add to .env.local: `EMAIL_API_KEY=...`

- [ ] **Task 10.1**: Create email service
  - [ ] File: `src/lib/notifications/email.ts`
  - [ ] Function: `sendBookingConfirmation(customerId, bookingId)`
  - [ ] Function: `sendJobAssigned(professionalId, jobId)`
  - [ ] Function: `sendPaymentReceived(customerId, paymentId)`

- [ ] **Task 10.2**: Create email templates (HTML)
  - [ ] `booking-confirmation.html`
  - [ ] `job-assigned.html`
  - [ ] `payment-received.html`
  - [ ] `quote-created.html`

- [ ] **Task 10.3**: Setup database triggers for emails
  - [ ] Migration: Add trigger for booking.created → sendBookingConfirmation()
  - [ ] Migration: Add trigger for job.assigned → sendJobAssigned()

- [ ] **Task 10.4**: Setup Supabase Realtime (optional for MVP)
  - [ ] Professional subscribes to job_events for assigned jobs
  - [ ] Customer subscribes to booking_events

- [ ] **Task 10.5**: Test
  - [ ] Create booking → Email sent
  - [ ] Job assigned → Email sent
  - [ ] Payment received → Email sent

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## ✅ FINAL: Pre-Launch Testing

- [ ] **Full End-to-End Test**
  - [ ] Create customer account
  - [ ] Create professional account
  - [ ] Professional gets verified (admin approval)
  - [ ] Customer creates property
  - [ ] Customer books service
  - [ ] Professional receives job assignment
  - [ ] Professional completes inspection
  - [ ] Professional creates quote
  - [ ] Customer approves quote
  - [ ] Customer makes payment
  - [ ] Job marked complete
  - [ ] Both users receive emails

- [ ] **Security Tests**
  - [ ] Customer A cannot read Customer B's data
  - [ ] Professional A cannot modify Professional B's profile
  - [ ] Non-admin cannot access admin panel
  - [ ] Service-role key not in browser console
  - [ ] No sensitive data in logs

- [ ] **Performance Tests**
  - [ ] Dashboard loads < 1 second
  - [ ] Job list with 100 jobs < 1 second
  - [ ] Service search < 500ms
  - [ ] Payment checkout < 2 seconds

- [ ] **Browser Tests**
  - [ ] Chrome: All features working
  - [ ] Safari: All features working
  - [ ] Mobile (iOS Safari): Responsive
  - [ ] Mobile (Android Chrome): Responsive

- [ ] **Build & Deploy**
  - [ ] `npm run build` succeeds
  - [ ] `npm run lint` passes
  - [ ] All TypeScript errors resolved
  - [ ] All console warnings resolved

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 🚀 Launch Readiness

- [ ] **Pre-Launch Checklist**
  - [ ] [ ] All 10 phases complete
  - [ ] [ ] Security audit passed
  - [ ] [ ] Performance metrics met
  - [ ] [ ] End-to-end test successful
  - [ ] [ ] Mobile responsive verified
  - [ ] [ ] Staging environment tested
  - [ ] [ ] Database backups enabled
  - [ ] [ ] Monitoring configured
  - [ ] [ ] Error tracking configured
  - [ ] [ ] SSL certificate valid

- [ ] **Go-Live**
  - [ ] [ ] Deploy to production
  - [ ] [ ] Monitor for errors (first hour)
  - [ ] [ ] Verify all critical flows work
  - [ ] [ ] Send launch announcement
  - [ ] [ ] Support team standing by

**Status**: ⬜ Not started | ⏳ In progress | ✅ Complete

---

## 📊 Progress Tracking

```
Week 1 (Days 1-5):
┌─────────────────────────────────────────────────────┐
│ Phase 1 (Bugs)          ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 2 (Pro Jobs)      ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 3 (Seed Data)     ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 4 (Booking)       ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 5 (Transitions)   ░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
└─────────────────────────────────────────────────────┘
Target: 25% of 60 hours = 15 hours

Week 2 (Days 8-12):
┌─────────────────────────────────────────────────────┐
│ Phase 5 (Transitions)   ████████░░░░░░░░░░░░░░░░ 40%
│ Phase 6 (Quotes)        ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 7 (Payments)      ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 8 (Verification)  ░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
└─────────────────────────────────────────────────────┘
Target: 50% of 60 hours = 30 hours (cumulative)

Week 3 (Days 15-21):
┌─────────────────────────────────────────────────────┐
│ Phase 8 (Verification)  ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 9 (Admin)         ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Phase 10 (Notifs)       ████░░░░░░░░░░░░░░░░░░░░ 20%
│ Testing & Polish        ████░░░░░░░░░░░░░░░░░░░░ 20%
└─────────────────────────────────────────────────────┘
Target: 100% of 60 hours = 60 hours (cumulative)
```

---

## 📞 Blockers & Support

**If stuck on:**
- **Phase 1 bugs**: Check `IMPLEMENTATION_TASKS.md` Phase 1, line-by-line fix
- **Database queries**: Verify RLS policies aren't blocking (test in Supabase dashboard)
- **Supabase RPC calls**: Check parameter names match function signature exactly
- **Payment setup**: Use Stripe test cards (4242 4242 4242 4242)
- **Emails not sending**: Verify API key is correct, test with API directly

**Get help:**
1. Check `docs/SYSTEM_CHECK_INTEGRATION_ROADMAP.md` (detailed explanation)
2. Check `docs/IMPLEMENTATION_TASKS.md` (code examples)
3. Check `.kiro/steering/` files (technical constraints)
4. Search Supabase docs for RLS issues
5. Search Stripe/Square docs for payment issues

---

## 🎯 Success Criteria

- [x] Database schema ready ✅
- [x] RLS policies working ✅
- [ ] Phase 1 bugs fixed
- [ ] Phase 2 jobs connected
- [ ] Phase 3 demo data seeded
- [ ] Phase 4-10 complete
- [ ] End-to-end test passes
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Ready to launch

---

## 📝 Notes

```
Today: _______  Completed: ________
Week 1: ______  Completed: ________
Week 2: ______  Completed: ________
Week 3: ______  Completed: ________
```

---

**Print this. Check off each task as you go. Lock in. Execute. Launch. 🚀**
