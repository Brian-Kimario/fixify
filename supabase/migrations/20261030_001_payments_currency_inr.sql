-- Payments are INR-only (Razorpay UPI). The live default was 'USD'; payments had 0 rows when
-- this was written, so no backfill is needed.
ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'INR';
