-- Phase 4C: notification completeness, failure observability, and Realtime for the inbox.
--
-- * `completed` now notifies the customer ("marked the work as completed"). It says nothing about
--   confirmation, payment or disputes. No other customer-facing event covers `completed`; the
--   legacy notification_logs trigger is a separate, untouched delivery log.
-- * The triggers already run in the transaction of the event/message, so a rolled-back event takes
--   its notification with it. A notification failure is still swallowed so it cannot block the job
--   or the message, but it is now recorded in notification_failures (source and SQLSTATE only: no
--   message text, no user data) and retried by reconcile_notifications(). Retrying is idempotent
--   because (user_id, source_type, source_id) is unique.
-- * Realtime publishes job_messages and notifications. Subscribers only receive rows their own JWT
--   can SELECT under RLS. The app treats an event as a hint to refetch, never as the data.

-- 1. New kind ---------------------------------------------------------------------------------

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind IN (
  'job_accepted', 'eta_shared', 'running_late', 'pro_arrived', 'quote_requested',
  'quote_approved', 'quote_declined', 'job_cancelled', 'job_completed', 'new_message'
));

CREATE OR REPLACE FUNCTION public._notify(
  p_user uuid,
  p_job public.jobs,
  p_kind text,
  p_source_type text,
  p_source_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_title text;
  v_body text;
  v_link text;
BEGIN
  IF p_user IS NULL THEN
    RETURN;
  END IF;

  SELECT t.title, t.body INTO v_title, v_body FROM (VALUES
    ('job_accepted',    'Your professional accepted the job',          'They will be in touch about the visit.'),
    ('eta_shared',      'Arrival window shared',                       'Your professional shared when they expect to arrive.'),
    ('running_late',    'Your professional is running late',           'They updated their arrival window.'),
    ('pro_arrived',     'Your professional has arrived',               'Open the booking to follow the visit.'),
    ('quote_requested', 'A quote needs your approval',                 'Review the quote to let the work continue.'),
    ('quote_approved',  'Your quote was approved',                     'You can continue with the work.'),
    ('quote_declined',  'Your quote was declined',                     'You can continue with the original scope or cancel.'),
    ('job_cancelled',   'This job was cancelled',                      'Open the job to see what happened.'),
    ('job_completed',   'Your professional has marked the work as completed', 'Open the booking to see the details.'),
    ('new_message',     'You have a new message',                      'Open the job to read and reply.')
  ) AS t(kind, title, body) WHERE t.kind = p_kind;

  IF v_title IS NULL THEN
    RAISE EXCEPTION 'Unknown notification kind %', p_kind USING ERRCODE = '22023';
  END IF;

  v_link := CASE WHEN p_user = p_job.customer_id
    THEN '/customer/bookings/' || p_job.booking_id::text
    ELSE '/professional/jobs/' || p_job.id::text END;

  INSERT INTO public.notifications (user_id, job_id, kind, title, body, link, source_type, source_id)
  VALUES (p_user, p_job.id, p_kind, v_title, v_body, v_link, p_source_type, p_source_id)
  ON CONFLICT (user_id, source_type, source_id) DO NOTHING;
END;
$function$;

REVOKE ALL ON FUNCTION public._notify(uuid, public.jobs, text, text, uuid) FROM PUBLIC, anon, authenticated;

-- 2. Failure log ------------------------------------------------------------------------------

-- Deliberately holds no text from the message or event: only which source failed and the SQLSTATE.
CREATE TABLE IF NOT EXISTS public.notification_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('job_event', 'job_message')),
  source_id uuid NOT NULL,
  error_code text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  resolved_at timestamptz,
  UNIQUE (source_type, source_id)
);

CREATE INDEX IF NOT EXISTS notification_failures_open_idx
  ON public.notification_failures (created_at) WHERE resolved_at IS NULL;

-- RLS on with no policies: only the database owner and service_role (which bypasses RLS) can read.
ALTER TABLE public.notification_failures ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_failures FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._record_notification_failure(
  p_source_type text,
  p_source_id uuid,
  p_error_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notification_failures (source_type, source_id, error_code)
  VALUES (p_source_type, p_source_id, p_error_code)
  ON CONFLICT (source_type, source_id) DO UPDATE
    SET error_code = EXCLUDED.error_code,
        attempts = notification_failures.attempts + 1,
        last_attempt_at = clock_timestamp(),
        resolved_at = NULL;
EXCEPTION WHEN OTHERS THEN
  -- The log must not be able to fail the transaction either.
  RAISE WARNING 'could not record notification failure for % %: %', p_source_type, p_source_id, SQLSTATE;
END;
$function$;

REVOKE ALL ON FUNCTION public._record_notification_failure(text, uuid, text) FROM PUBLIC, anon, authenticated;

-- 3. Per-source delivery (callable by the trigger and by reconcile) --------------------------

CREATE OR REPLACE FUNCTION public._notify_for_event(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event public.job_events%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_kind text;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_event FROM public.job_events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_kind := CASE
    WHEN v_event.event_type = 'eta_shared' THEN 'eta_shared'
    WHEN v_event.event_type = 'running_late' THEN 'running_late'
    WHEN v_event.event_type = 'quote_approved' THEN 'quote_approved'
    WHEN v_event.event_type = 'quote_declined' THEN 'quote_declined'
    WHEN v_event.event_type = 'state_transition' AND v_event.to_state = 'accepted' THEN 'job_accepted'
    WHEN v_event.event_type = 'state_transition' AND v_event.to_state = 'arrived' THEN 'pro_arrived'
    WHEN v_event.event_type = 'state_transition' AND v_event.to_state = 'quote_pending' THEN 'quote_requested'
    WHEN v_event.event_type = 'state_transition' AND v_event.to_state = 'completed' THEN 'job_completed'
    WHEN v_event.event_type = 'state_transition' AND v_event.to_state = 'cancelled' THEN 'job_cancelled'
    ELSE NULL
  END;
  IF v_kind IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_event.job_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_kind IN ('quote_approved', 'quote_declined') THEN
    IF v_job.professional_id IS DISTINCT FROM v_event.actor_user_id THEN
      PERFORM public._notify(v_job.professional_id, v_job, v_kind, 'job_event', v_event.id);
    END IF;
  ELSIF v_kind = 'job_cancelled' THEN
    FOR v_recipient IN
      SELECT DISTINCT u FROM unnest(ARRAY[v_job.customer_id, v_job.professional_id]) AS u WHERE u IS NOT NULL
    LOOP
      IF v_recipient IS DISTINCT FROM v_event.actor_user_id THEN
        PERFORM public._notify(v_recipient, v_job, v_kind, 'job_event', v_event.id);
      END IF;
    END LOOP;
  ELSE
    IF v_job.customer_id IS DISTINCT FROM v_event.actor_user_id THEN
      PERFORM public._notify(v_job.customer_id, v_job, v_kind, 'job_event', v_event.id);
    END IF;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public._notify_for_message(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_msg public.job_messages%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_msg FROM public.job_messages WHERE id = p_message_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = v_msg.job_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- The recipient is the other side of the conversation recorded on the message itself.
  v_recipient := CASE WHEN v_msg.sender_id = v_job.customer_id THEN v_msg.professional_id ELSE v_job.customer_id END;
  PERFORM public._notify(v_recipient, v_job, 'new_message', 'job_message', v_msg.id);
END;
$function$;

REVOKE ALL ON FUNCTION public._notify_for_event(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._notify_for_message(uuid) FROM PUBLIC, anon, authenticated;

-- 4. Triggers: never block the source, always leave a trace -----------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_job_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public._notify_for_event(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    -- The block is a savepoint: its partial work is rolled back, the event itself is kept.
    PERFORM public._record_notification_failure('job_event', NEW.id, SQLSTATE);
    RAISE WARNING 'notification for job_event % failed (SQLSTATE %)', NEW.id, SQLSTATE;
  END;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_job_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  BEGIN
    PERFORM public._notify_for_message(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    PERFORM public._record_notification_failure('job_message', NEW.id, SQLSTATE);
    RAISE WARNING 'notification for job_message % failed (SQLSTATE %)', NEW.id, SQLSTATE;
  END;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_on_job_event() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_job_message() FROM PUBLIC, anon, authenticated;

-- 5. Reconcile --------------------------------------------------------------------------------

-- Retries every unresolved failure. Safe to run any number of times: a notification that already
-- exists is left alone. Returns how many failures this run resolved.
CREATE OR REPLACE FUNCTION public.reconcile_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.notification_failures%ROWTYPE;
  v_resolved integer := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM public.notification_failures WHERE resolved_at IS NULL ORDER BY created_at LIMIT 500
  LOOP
    BEGIN
      IF v_row.source_type = 'job_event' THEN
        PERFORM public._notify_for_event(v_row.source_id);
      ELSE
        PERFORM public._notify_for_message(v_row.source_id);
      END IF;
      UPDATE public.notification_failures
         SET resolved_at = clock_timestamp(), last_attempt_at = clock_timestamp(), attempts = attempts + 1
       WHERE id = v_row.id;
      v_resolved := v_resolved + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.notification_failures
         SET error_code = SQLSTATE, last_attempt_at = clock_timestamp(), attempts = attempts + 1
       WHERE id = v_row.id;
    END;
  END LOOP;
  RETURN v_resolved;
END;
$function$;

REVOKE ALL ON FUNCTION public.reconcile_notifications() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_notifications() TO service_role;

-- Runs inside the database as its owner: no key or URL involved.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'reconcile-notifications';
SELECT cron.schedule('reconcile-notifications', '*/10 * * * *', 'SELECT public.reconcile_notifications()');

-- 6. Realtime ---------------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'job_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.job_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END
$$;
