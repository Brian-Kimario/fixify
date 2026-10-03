-- MIGRATION 20261002_001: UPI Payment Fields
-- Phase 7 Sprint 1 — Razorpay UPI Intent
-- Extends the payments table with Razorpay identifiers, UPI metadata, and retry tracking.

-- ── Razorpay identifiers ──────────────────────────────────────────────────────
-- razorpay_order_id  : set when the order is created (pending state)
-- razorpay_payment_id: set when the payment is captured (via webhook)
-- Both get UNIQUE constraints so duplicate webhook processing is detectable at the DB level.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id  TEXT UNIQUE;

-- ── UPI-specific metadata ─────────────────────────────────────────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS upi_vpa    TEXT,   -- Virtual Payment Address, e.g. user@oksbi
  ADD COLUMN IF NOT EXISTS upi_app    TEXT,   -- googlepay | phonepe | paytm | other
  ADD COLUMN IF NOT EXISTS upi_ref_id TEXT,   -- UPI transaction reference from acquirer
  ADD COLUMN IF NOT EXISTS upi_rrn    TEXT;   -- Retrieval Reference Number

-- ── Payment method label ──────────────────────────────────────────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi_intent';

-- ── Timestamps ────────────────────────────────────────────────────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ── Retry tracking ────────────────────────────────────────────────────────────
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS attempt_count    INT          DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_attempt_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_retry_at    TIMESTAMPTZ;

-- ── Performance indexes ───────────────────────────────────────────────────────
-- These are the hot paths the webhook handler and checkout flow hit on every request.

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON public.payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON public.payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON public.payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_job_status
  ON public.payments (job_id, status)
  WHERE job_id IS NOT NULL;
