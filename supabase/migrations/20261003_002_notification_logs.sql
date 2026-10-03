-- MIGRATION 20261003_002: Notification Logs
-- Phase 10 — India-Optimized Multi-Channel Notification System
-- Append-only audit table for every notification attempt and its outcome.

-- ── notification_logs table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id                 UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id             UUID        REFERENCES public.jobs(id) ON DELETE SET NULL,

  -- What kind of notification was triggered
  notification_type  TEXT        NOT NULL,
  -- job_assigned | arrived | quote_ready | payment_received | job_completed
  -- payment_failed | cancellation

  -- Which channel was tried first
  channel_attempted  TEXT        NOT NULL,
  -- whatsapp | sms | email

  -- Which channel actually delivered it (NULL if all failed)
  channel_delivered  TEXT,
  -- whatsapp | sms | email | NULL

  -- Final outcome
  status             TEXT        NOT NULL DEFAULT 'pending',
  -- sent | delivered | failed | skipped_dnd

  -- Provider-level reference (e.g. Razorpay WhatsApp message ID, AWS SNS message ID)
  provider_message_id TEXT,

  -- Error detail if status = failed
  error_message      TEXT,

  -- Immutable timestamp
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Constraints ───────────────────────────────────────────────────────────────
ALTER TABLE public.notification_logs
  ADD CONSTRAINT notification_logs_type_check CHECK (
    notification_type IN (
      'job_assigned',
      'arrived',
      'quote_ready',
      'payment_received',
      'job_completed',
      'payment_failed',
      'cancellation'
    )
  ),
  ADD CONSTRAINT notification_logs_channel_attempted_check CHECK (
    channel_attempted IN ('whatsapp', 'sms', 'email')
  ),
  ADD CONSTRAINT notification_logs_channel_delivered_check CHECK (
    channel_delivered IS NULL OR channel_delivered IN ('whatsapp', 'sms', 'email')
  ),
  ADD CONSTRAINT notification_logs_status_check CHECK (
    status IN ('sent', 'delivered', 'failed', 'skipped_dnd')
  );

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer
  ON public.notification_logs (customer_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_job
  ON public.notification_logs (job_id)
  WHERE job_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at
  ON public.notification_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_logs_status
  ON public.notification_logs (status);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Customers can read their own notification history.
CREATE POLICY notification_logs_select_own ON public.notification_logs
  FOR SELECT
  USING (customer_id = auth.uid());

-- Admins/support can read all logs.
CREATE POLICY notification_logs_select_admin ON public.notification_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'support')
    )
  );

-- INSERT is server-side only (service-role key).
-- No INSERT policy for authenticated role → application users cannot insert directly.
-- The notification sender (server action / edge function) uses the service-role client.

-- No UPDATE or DELETE policies → append-only, immutable audit log.

-- ── Grants ────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.notification_logs TO authenticated;
-- INSERT/UPDATE/DELETE intentionally withheld from authenticated role.
-- Service-role bypasses RLS and handles all writes server-side.
