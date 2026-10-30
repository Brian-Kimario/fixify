-- Phase 4A: job-scoped messaging between a job's customer and its assigned professional.
--
-- * A conversation is (job, professional): every message records the professional who was
--   assigned when it was sent. If a job is ever reassigned, the new professional cannot read
--   what the previous one was told, and the previous professional can neither read nor send.
--   (Today no accepted job can be reassigned; _release_offer deletes the job before accept.)
-- * Messages open once the professional accepts and stay open through quote_pending. They are
--   read-only from `completed` onwards, including `cancelled` and `closed`.
-- * No INSERT/UPDATE/DELETE policies: messages are written only by send_job_message, which
--   derives the sender from the session, stamps the time on the server, rate-limits in the
--   database and de-duplicates retries on a client-generated key.
-- * Admin read access is deliberately not granted here; it needs an audited workflow.

-- 1. Limits (abuse guards, not business rules; edited in the table, not in code) --------------

CREATE TABLE IF NOT EXISTS public.messaging_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messaging_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messaging_config_select_authenticated ON public.messaging_config;
CREATE POLICY messaging_config_select_authenticated ON public.messaging_config
  FOR SELECT TO authenticated USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.messaging_config FROM anon, authenticated;

INSERT INTO public.messaging_config (key, value, description) VALUES
  ('message_max_length', 2000, 'Longest message body, in characters'),
  ('messages_per_minute', 10, 'Most messages one sender may post on one job in a rolling minute')
ON CONFLICT (key) DO NOTHING;

-- 2. Messages ---------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  -- The professional assigned to the job when this was sent; the conversation boundary.
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) >= 1),
  client_key uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, client_key)
);

CREATE INDEX IF NOT EXISTS job_messages_job_idx ON public.job_messages (job_id, created_at);
CREATE INDEX IF NOT EXISTS job_messages_rate_idx ON public.job_messages (sender_id, job_id, created_at DESC);

ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.job_messages FROM anon, authenticated;

-- The customer reads the whole job's thread. The professional reads only messages from their
-- own assignment, and only while they are still the assigned professional.
DROP POLICY IF EXISTS job_messages_select_participants ON public.job_messages;
CREATE POLICY job_messages_select_participants ON public.job_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_messages.job_id
        AND (
          j.customer_id = auth.uid()
          OR (j.professional_id = auth.uid() AND job_messages.professional_id = auth.uid())
        )
    )
  );

-- 3. Read state -------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_message_reads (
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, user_id)
);

ALTER TABLE public.job_message_reads ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE ON public.job_message_reads FROM anon, authenticated;

DROP POLICY IF EXISTS job_message_reads_select_own ON public.job_message_reads;
CREATE POLICY job_message_reads_select_own ON public.job_message_reads
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Send -------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_job_message(
  p_job_id uuid,
  p_body text,
  p_client_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_body text := btrim(coalesce(p_body, ''));
  v_max integer;
  v_per_minute integer;
  v_id uuid;
  v_existing public.job_messages%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;
  IF p_client_key IS NULL THEN
    RAISE EXCEPTION 'Missing message key' USING ERRCODE = '22023';
  END IF;

  -- Shared lock: a transition to a terminal state waits for this insert, so a message cannot
  -- slip in after the job has ended.
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR SHARE;
  IF NOT FOUND OR (v_job.customer_id IS DISTINCT FROM v_uid AND v_job.professional_id IS DISTINCT FROM v_uid) THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  -- A retry of a message already stored returns it rather than posting twice.
  SELECT * INTO v_existing FROM public.job_messages WHERE sender_id = v_uid AND client_key = p_client_key;
  IF FOUND THEN
    IF v_existing.job_id <> p_job_id THEN
      RAISE EXCEPTION 'Message key already used' USING ERRCODE = '22023';
    END IF;
    RETURN v_existing.id;
  END IF;

  IF v_job.current_state NOT IN ('accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending') THEN
    RAISE EXCEPTION 'Messages are open from when the professional accepts until the job ends (state: %)',
      v_job.current_state USING ERRCODE = '22023';
  END IF;

  SELECT value::integer INTO v_max FROM public.messaging_config WHERE key = 'message_max_length';
  SELECT value::integer INTO v_per_minute FROM public.messaging_config WHERE key = 'messages_per_minute';
  IF v_max IS NULL OR v_per_minute IS NULL THEN
    RAISE EXCEPTION 'Messaging is not configured' USING ERRCODE = '55000';
  END IF;

  IF v_body = '' THEN
    RAISE EXCEPTION 'Write a message first' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_body) > v_max THEN
    RAISE EXCEPTION 'Messages can be up to % characters', v_max USING ERRCODE = '22023';
  END IF;

  -- Serialise this sender's sends on this job so concurrent calls cannot overshoot the limit.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_job_id::text || v_uid::text, 0));
  IF (SELECT count(*) FROM public.job_messages
      WHERE job_id = p_job_id AND sender_id = v_uid AND created_at > clock_timestamp() - interval '1 minute') >= v_per_minute THEN
    RAISE EXCEPTION 'You are sending messages too fast. Wait a moment and try again.' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.job_messages (job_id, professional_id, sender_id, body, client_key, created_at)
  VALUES (p_job_id, v_job.professional_id, v_uid, v_body, p_client_key, clock_timestamp())
  RETURNING id INTO v_id;

  -- clock_timestamp(), not now(): ordering stays right when calls share a transaction.
  -- Sending a message means the sender has read the thread up to now.
  INSERT INTO public.job_message_reads (job_id, user_id, last_read_at)
  VALUES (p_job_id, v_uid, clock_timestamp())
  ON CONFLICT (job_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.send_job_message(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_job_message(uuid, text, uuid) TO authenticated;

-- 5. Mark read --------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_job_thread_read(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id AND (j.customer_id = v_uid OR j.professional_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.job_message_reads (job_id, user_id, last_read_at)
  VALUES (p_job_id, v_uid, clock_timestamp())
  ON CONFLICT (job_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_job_thread_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_job_thread_read(uuid) TO authenticated;

-- 6. Inbox ------------------------------------------------------------------------------------

-- One row per job the caller can read messages on. SECURITY INVOKER: job_messages RLS decides
-- what is counted, so the numbers cannot include another party's conversation.
CREATE OR REPLACE FUNCTION public.get_message_threads()
RETURNS TABLE (
  job_id uuid,
  last_message_at timestamptz,
  last_sender_id uuid,
  last_body text,
  unread_count integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT
    m.job_id,
    max(m.created_at) AS last_message_at,
    (array_agg(m.sender_id ORDER BY m.created_at DESC))[1] AS last_sender_id,
    (array_agg(left(m.body, 160) ORDER BY m.created_at DESC))[1] AS last_body,
    count(*) FILTER (
      WHERE m.sender_id <> auth.uid()
        AND m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
    )::integer AS unread_count
  FROM public.job_messages m
  LEFT JOIN public.job_message_reads r ON r.job_id = m.job_id AND r.user_id = auth.uid()
  GROUP BY m.job_id, r.last_read_at
  ORDER BY max(m.created_at) DESC;
$function$;

REVOKE ALL ON FUNCTION public.get_message_threads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_message_threads() TO authenticated;
