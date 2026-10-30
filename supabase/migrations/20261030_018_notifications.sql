-- Phase 4B: durable in-app notifications with per-user read state.
--
-- * One row per (recipient, source event). The source is a job_events row or a job_messages row,
--   so a retry, a replayed trigger or a double-fired event cannot produce a second notification.
-- * Rows are written only by triggers on job_events and job_messages, in the same transaction as
--   the event itself: if a state transition rolls back, so does its notification.
-- * Only the events in the mapping below notify. Text and link are fixed per kind and carry no
--   names, phone numbers, addresses, amounts or message text.
-- * Users can read and mark read their own rows only. Nobody can insert, edit or delete through
--   the API.
-- * notification_logs (the legacy, customer-only WhatsApp queue) is not touched.
--
-- Event mapping (job_events.event_type / to_state  ->  kind, recipient):
--   state_transition -> accepted      job_accepted      customer
--   eta_shared                        eta_shared        customer
--   running_late                      running_late      customer
--   state_transition -> arrived       pro_arrived       customer
--   state_transition -> quote_pending quote_requested   customer
--   quote_approved                    quote_approved    professional
--   quote_declined                    quote_declined    professional
--   state_transition -> cancelled     job_cancelled     every participant except the actor
--   job_messages insert               new_message       the other participant
-- The actor is never notified of their own action.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'job_accepted', 'eta_shared', 'running_late', 'pro_arrived', 'quote_requested',
    'quote_approved', 'quote_declined', 'job_cancelled', 'new_message'
  )),
  title text NOT NULL,
  body text NOT NULL,
  -- An in-app path chosen by this migration, never user input.
  link text NOT NULL CHECK (link ~ '^/(customer|professional)/(bookings|jobs)/[0-9a-f-]{36}$'),
  source_type text NOT NULL CHECK (source_type IN ('job_event', 'job_message')),
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  read_at timestamptz,
  UNIQUE (user_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS notifications_user_recent_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Insert one notification. Text and link are derived here from the kind, so they are the same
-- for every caller. Not callable through the API.
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
    ('job_accepted',    'Your professional accepted the job', 'They will be in touch about the visit.'),
    ('eta_shared',      'Arrival window shared',              'Your professional shared when they expect to arrive.'),
    ('running_late',    'Your professional is running late',  'They updated their arrival window.'),
    ('pro_arrived',     'Your professional has arrived',      'Open the booking to follow the visit.'),
    ('quote_requested', 'A quote needs your approval',        'Review the quote to let the work continue.'),
    ('quote_approved',  'Your quote was approved',            'You can continue with the work.'),
    ('quote_declined',  'Your quote was declined',            'You can continue with the original scope or cancel.'),
    ('job_cancelled',   'This job was cancelled',             'Open the job to see what happened.'),
    ('new_message',     'You have a new message',             'Open the job to read and reply.')
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

-- job_events -> notifications --------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_job_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_kind text;
  v_recipient uuid;
BEGIN
  v_kind := CASE
    WHEN NEW.event_type = 'eta_shared' THEN 'eta_shared'
    WHEN NEW.event_type = 'running_late' THEN 'running_late'
    WHEN NEW.event_type = 'quote_approved' THEN 'quote_approved'
    WHEN NEW.event_type = 'quote_declined' THEN 'quote_declined'
    WHEN NEW.event_type = 'state_transition' AND NEW.to_state = 'accepted' THEN 'job_accepted'
    WHEN NEW.event_type = 'state_transition' AND NEW.to_state = 'arrived' THEN 'pro_arrived'
    WHEN NEW.event_type = 'state_transition' AND NEW.to_state = 'quote_pending' THEN 'quote_requested'
    WHEN NEW.event_type = 'state_transition' AND NEW.to_state = 'cancelled' THEN 'job_cancelled'
    ELSE NULL
  END;
  IF v_kind IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- A failed notification must never block the job event that caused it.
  BEGIN
    IF v_kind IN ('quote_approved', 'quote_declined') THEN
      v_recipient := v_job.professional_id;
      IF v_recipient IS DISTINCT FROM NEW.actor_user_id THEN
        PERFORM public._notify(v_recipient, v_job, v_kind, 'job_event', NEW.id);
      END IF;
    ELSIF v_kind = 'job_cancelled' THEN
      FOR v_recipient IN SELECT DISTINCT u FROM unnest(ARRAY[v_job.customer_id, v_job.professional_id]) AS u WHERE u IS NOT NULL LOOP
        IF v_recipient IS DISTINCT FROM NEW.actor_user_id THEN
          PERFORM public._notify(v_recipient, v_job, v_kind, 'job_event', NEW.id);
        END IF;
      END LOOP;
    ELSE
      v_recipient := v_job.customer_id;
      IF v_recipient IS DISTINCT FROM NEW.actor_user_id THEN
        PERFORM public._notify(v_recipient, v_job, v_kind, 'job_event', NEW.id);
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_on_job_event failed for event %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_on_job_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_on_job_event ON public.job_events;
CREATE TRIGGER trg_notify_on_job_event
  AFTER INSERT ON public.job_events
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_event();

-- job_messages -> notifications ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.notify_on_job_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_recipient uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- The recipient is the other side of the conversation recorded on the message itself.
  v_recipient := CASE WHEN NEW.sender_id = v_job.customer_id THEN NEW.professional_id ELSE v_job.customer_id END;

  BEGIN
    PERFORM public._notify(v_recipient, v_job, 'new_message', 'job_message', NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_on_job_message failed for message %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.notify_on_job_message() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_on_job_message ON public.job_messages;
CREATE TRIGGER trg_notify_on_job_message
  AFTER INSERT ON public.job_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_job_message();

-- Read state -------------------------------------------------------------------------------------

-- Idempotent: marking a read or missing notification changes nothing. Returns whether this call
-- changed it. Another user's id is indistinguishable from a missing one.
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_changed integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;
  UPDATE public.notifications SET read_at = clock_timestamp()
  WHERE id = p_id AND user_id = v_uid AND read_at IS NULL;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RETURN v_changed > 0;
END;
$function$;

-- Returns how many notifications this call marked.
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_changed integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;
  UPDATE public.notifications SET read_at = clock_timestamp()
  WHERE user_id = v_uid AND read_at IS NULL;
  GET DIAGNOSTICS v_changed = ROW_COUNT;
  RETURN v_changed;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
