-- MIGRATION 20261002_002: Create Invoices Table
-- Phase 7 Sprint 1 — generated on payment capture via Razorpay webhook

CREATE TABLE IF NOT EXISTS public.invoices (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID         NOT NULL REFERENCES public.jobs(id)     ON DELETE CASCADE,
  customer_id UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_id  UUID         REFERENCES public.payments(id)          ON DELETE SET NULL,
  amount      NUMERIC(10,2) NOT NULL,
  currency    TEXT         NOT NULL DEFAULT 'INR',
  status      TEXT         NOT NULL DEFAULT 'issued',
  -- issued | sent | void
  issued_at   TIMESTAMPTZ  DEFAULT now(),
  created_at  TIMESTAMPTZ  DEFAULT now(),
  updated_at  TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_job      ON public.invoices (job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment  ON public.invoices (payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status   ON public.invoices (status, issued_at DESC);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Customer reads own invoices
CREATE POLICY invoices_select_own ON public.invoices
  FOR SELECT
  USING (customer_id = auth.uid());

-- Admin / support reads all
CREATE POLICY invoices_select_admin ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- Only service-role (webhook) inserts — no direct client inserts
-- INSERT is intentionally not granted to authenticated; the webhook uses service-role.

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.invoices TO authenticated;
