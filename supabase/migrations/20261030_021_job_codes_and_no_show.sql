-- Phase 3C: start/finish confirmation codes and the professional no-show report.
--
-- Codes
--   * Two purposes, never interchangeable: 'start' (arrived -> in_progress) and 'finish'
--     (in_progress -> completed). The start code is issued when the job goes on_the_way, the
--     finish code when work starts; each lasts 24 hours.
--   * The code itself is never stored. It is derived on demand as HMAC-SHA256 over the issuance id
--     and a random 128-bit nonce, keyed with a pepper held in a table no client role can read, then
--     reduced to six digits. The customer can be shown it again; a dump of job_codes alone reveals
--     nothing. (The pepper lives in the same database, so a full database compromise is out of scope.)
--   * Verification is by the assigned professional only. 5 wrong attempts on one issuance lock it.
--     Attempt rows are never deleted, so a reissue does not clear the history. The customer may
--     reissue at most twice per job; after that it is a support matter.
--   * A valid code does NOT move the job. transition_job_state() refuses arrived -> in_progress and
--     in_progress -> completed until the matching code is verified, and the professional still makes
--     that transition explicitly. The customer can no longer start a job directly.
--
-- No-show
--   * The customer can report "professional didn't arrive" 30 minutes after bookings.scheduled_start,
--     judged on the database clock. It is recorded as an event and an open job_exceptions row for
--     admin review. Nothing is cancelled, reassigned, charged or re-rated automatically: the
--     assignment functions only handle jobs still in 'assigned', so an accepted job has no safe
--     automatic reassignment.

-- 1. Secrets, codes, attempts -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_code_secrets (
  id smallint PRIMARY KEY CHECK (id = 1),
  pepper bytea NOT NULL
);
ALTER TABLE public.job_code_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_code_secrets FROM PUBLIC, anon, authenticated;

INSERT INTO public.job_code_secrets (id, pepper)
VALUES (1, extensions.gen_random_bytes(32))
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.job_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('start', 'finish')),
  nonce bytea NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'locked', 'expired', 'superseded', 'invalidated')),
  is_reissue boolean NOT NULL DEFAULT false,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  locked_at timestamptz
);
CREATE INDEX IF NOT EXISTS job_codes_job_idx ON public.job_codes (job_id, purpose, issued_at DESC);
-- One live code per job and purpose: a replay needs a second row, and there can be only one.
CREATE UNIQUE INDEX IF NOT EXISTS job_codes_one_live_idx
  ON public.job_codes (job_id, purpose) WHERE status IN ('active', 'used');
ALTER TABLE public.job_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_codes FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.job_code_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.job_codes(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  purpose text NOT NULL,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  succeeded boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_code_attempts_code_idx ON public.job_code_attempts (code_id);
ALTER TABLE public.job_code_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_code_attempts FROM PUBLIC, anon, authenticated;

-- 2. Code helpers -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._job_code_value(p_code_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT lpad(
    ((('x' || encode(substring(hmac(convert_to(c.id::text, 'UTF8') || c.nonce, s.pepper, 'sha256') FROM 1 FOR 7), 'hex'))::bit(56)::bigint) % 1000000)::text,
    6, '0')
  FROM public.job_codes c CROSS JOIN public.job_code_secrets s
  WHERE c.id = p_code_id;
$function$;

CREATE OR REPLACE FUNCTION public._job_code_event(p_job_id uuid, p_type text, p_actor uuid, p_metadata jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_state text;
BEGIN
  SELECT current_state INTO v_state FROM public.jobs WHERE id = p_job_id;
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_state, v_state, p_actor, p_type, COALESCE(p_metadata, '{}'::jsonb));
END;
$function$;

-- Issues a fresh code, retiring any live one of the same purpose. The caller holds the job lock.
CREATE OR REPLACE FUNCTION public._issue_job_code(p_job_id uuid, p_purpose text, p_actor uuid, p_reissue boolean)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.job_codes SET status = 'superseded'
  WHERE job_id = p_job_id AND purpose = p_purpose AND status = 'active';

  INSERT INTO public.job_codes (job_id, purpose, nonce, is_reissue, expires_at)
  VALUES (p_job_id, p_purpose, gen_random_bytes(16), p_reissue, now() + interval '24 hours')
  RETURNING id INTO v_id;

  PERFORM public._job_code_event(p_job_id, CASE WHEN p_reissue THEN 'code_reissued' ELSE 'code_issued' END,
                                 p_actor, jsonb_build_object('purpose', p_purpose, 'code_id', v_id));
  RETURN v_id;
END;
$function$;

-- Code stage of a job: which code, if any, is relevant in its current state.
CREATE OR REPLACE FUNCTION public._job_code_purpose(p_state text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN p_state IN ('on_the_way', 'arrived') THEN 'start'
    WHEN p_state = 'in_progress' THEN 'finish'
  END;
$function$;

-- 3. transition_job_state: customer cannot start the job; codes gate start and finish ---------

CREATE OR REPLACE FUNCTION public.transition_job_state(p_job_id uuid, p_new_state text, p_actor_user_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_caller uuid := auth.uid();
  v_status text;
  v_valid boolean := false;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_caller IS NOT NULL THEN
    IF p_actor_user_id IS DISTINCT FROM v_caller THEN
      RAISE EXCEPTION 'Actor does not match the signed-in user';
    END IF;
    -- The customer may cancel, and may resume work by answering a quote. Starting a job is the
    -- professional's step, behind the start code.
    IF v_caller <> v_job.professional_id
       AND NOT (v_caller = v_job.customer_id
                AND (
                  (p_new_state = 'cancelled'
                   AND v_job.current_state IN ('quote_pending', 'assigned', 'accepted', 'on_the_way', 'arrived'))
                  OR (p_new_state = 'in_progress' AND v_job.current_state = 'quote_pending')
                )) THEN
      RAISE EXCEPTION 'Not allowed to change this job';
    END IF;
  END IF;

  IF p_new_state = 'accepted' THEN
    SELECT verification_status INTO v_status
    FROM public.professional_profiles WHERE user_id = v_job.professional_id;
    IF v_status IS NULL THEN
      RAISE EXCEPTION 'Professional not found';
    END IF;
    IF v_status <> 'verified' THEN
      RAISE EXCEPTION 'Professional must be verified to accept jobs. Current status: %', v_status;
    END IF;
  END IF;

  -- Quote guard 1: quote_pending means a quote is actually waiting for the customer.
  IF p_new_state = 'quote_pending'
     AND NOT EXISTS (SELECT 1 FROM public.quotes WHERE job_id = p_job_id AND status = 'pending_customer') THEN
    RAISE EXCEPTION 'A job can only wait on a quote that has been sent' USING ERRCODE = '22023';
  END IF;

  -- Quote guard 2: leaving quote_pending for work needs the quote answered first
  -- (respond_to_quote updates the quote before it calls this function).
  IF v_job.current_state = 'quote_pending' AND p_new_state = 'in_progress'
     AND EXISTS (SELECT 1 FROM public.quotes WHERE job_id = p_job_id AND status = 'pending_customer') THEN
    RAISE EXCEPTION 'The customer has not answered the quote yet' USING ERRCODE = '22023';
  END IF;

  IF (v_job.current_state = 'assigned' AND p_new_state IN ('accepted', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'accepted' AND p_new_state IN ('on_the_way', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'on_the_way' AND p_new_state IN ('arrived', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'arrived' AND p_new_state IN ('in_progress', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'in_progress' AND p_new_state IN ('quote_pending', 'completed', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'quote_pending' AND p_new_state IN ('in_progress', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'completed' AND p_new_state = 'closed') THEN v_valid := true;
  ELSIF (v_job.current_state = 'cancelled' AND p_new_state = 'closed') THEN v_valid := true;
  END IF;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_job.current_state, p_new_state;
  END IF;

  -- Code gates. Backend callers (no signed-in user: service role, support tooling) are not gated.
  IF v_caller IS NOT NULL THEN
    IF v_job.current_state = 'arrived' AND p_new_state = 'in_progress'
       AND NOT EXISTS (SELECT 1 FROM public.job_codes
                       WHERE job_id = p_job_id AND purpose = 'start' AND status = 'used') THEN
      RAISE EXCEPTION 'Enter the start code from the customer before starting work' USING ERRCODE = '22023';
    END IF;
    IF v_job.current_state = 'in_progress' AND p_new_state = 'completed'
       AND NOT EXISTS (SELECT 1 FROM public.job_codes
                       WHERE job_id = p_job_id AND purpose = 'finish' AND status = 'used') THEN
      RAISE EXCEPTION 'Enter the finish code from the customer before completing the job' USING ERRCODE = '22023';
    END IF;
  END IF;

  UPDATE public.jobs
  SET
    current_state = p_new_state,
    updated_at = now(),
    accepted_at = CASE WHEN p_new_state = 'accepted' THEN now() ELSE accepted_at END,
    on_the_way_at = CASE WHEN p_new_state = 'on_the_way' THEN now() ELSE on_the_way_at END,
    arrived_at = CASE WHEN p_new_state = 'arrived' THEN now() ELSE arrived_at END,
    started_at = CASE WHEN p_new_state = 'in_progress' THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_new_state = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_state = 'cancelled' THEN now() ELSE cancelled_at END,
    closed_at = CASE WHEN p_new_state IN ('completed', 'cancelled') THEN now() ELSE closed_at END
  WHERE id = p_job_id;

  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_job.current_state, p_new_state, p_actor_user_id,
          COALESCE(p_metadata->>'event_type', 'state_transition'), p_metadata);

  -- Code lifecycle follows the state.
  IF p_new_state = 'on_the_way' THEN
    PERFORM public._issue_job_code(p_job_id, 'start', p_actor_user_id, false);
  ELSIF p_new_state = 'in_progress' AND NOT EXISTS (
          SELECT 1 FROM public.job_codes
          WHERE job_id = p_job_id AND purpose = 'finish' AND status IN ('active', 'used')) THEN
    PERFORM public._issue_job_code(p_job_id, 'finish', p_actor_user_id, false);
  ELSIF p_new_state = 'quote_pending' THEN
    -- Work is paused for a quote: a finish code verified before it must not complete the job later.
    UPDATE public.job_codes SET status = 'invalidated'
    WHERE job_id = p_job_id AND purpose = 'finish' AND status IN ('active', 'used');
  ELSIF p_new_state IN ('cancelled', 'completed', 'closed') THEN
    UPDATE public.job_codes SET status = 'invalidated'
    WHERE job_id = p_job_id AND status = 'active';
  END IF;

  RETURN true;
END;
$function$;

-- 4. Customer: see and reissue the current code -----------------------------------------------

-- Both parties may ask where the code stage stands; only the customer is given the digits.
CREATE OR REPLACE FUNCTION public.get_job_code_state(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_purpose text;
  v_code public.job_codes%ROWTYPE;
  v_status text;
  v_failed integer;
  v_reissues integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND OR (v_uid <> v_job.customer_id AND v_uid IS DISTINCT FROM v_job.professional_id) THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  v_purpose := public._job_code_purpose(v_job.current_state);
  IF v_purpose IS NULL THEN
    RETURN jsonb_build_object('purpose', NULL);
  END IF;

  SELECT * INTO v_code FROM public.job_codes
  WHERE job_id = p_job_id AND purpose = v_purpose
  ORDER BY issued_at DESC LIMIT 1;

  SELECT count(*) INTO v_reissues FROM public.job_codes WHERE job_id = p_job_id AND is_reissue;

  IF v_code.id IS NULL THEN
    RETURN jsonb_build_object('purpose', v_purpose, 'status', 'none', 'reissues_left', GREATEST(0, 2 - v_reissues));
  END IF;

  v_status := CASE WHEN v_code.status = 'active' AND v_code.expires_at <= now() THEN 'expired' ELSE v_code.status END;
  SELECT count(*) INTO v_failed FROM public.job_code_attempts WHERE code_id = v_code.id AND NOT succeeded;

  RETURN jsonb_build_object(
    'purpose', v_purpose,
    'status', v_status,
    'expires_at', v_code.expires_at,
    'attempts_left', GREATEST(0, 5 - v_failed),
    'reissues_left', GREATEST(0, 2 - v_reissues),
    'code', CASE WHEN v_uid = v_job.customer_id AND v_status = 'active'
                 THEN public._job_code_value(v_code.id) END
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.reissue_job_code(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_purpose text;
  v_reissues integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.customer_id <> v_uid THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  v_purpose := public._job_code_purpose(v_job.current_state);
  IF v_purpose IS NULL THEN
    RAISE EXCEPTION 'There is no code to reissue at this stage of the job' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.job_codes WHERE job_id = p_job_id AND purpose = v_purpose AND status = 'used') THEN
    RAISE EXCEPTION 'This code has already been used' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_reissues FROM public.job_codes WHERE job_id = p_job_id AND is_reissue;
  IF v_reissues >= 2 THEN
    RAISE EXCEPTION 'You have used both code reissues for this job. Please contact support.' USING ERRCODE = '22023';
  END IF;

  PERFORM public._issue_job_code(p_job_id, v_purpose, v_uid, true);
  RETURN public.get_job_code_state(p_job_id);
END;
$function$;

-- 5. Professional: verify the customer's code -------------------------------------------------

-- Wrong, locked and expired codes come back as ordinary results rather than exceptions: an
-- exception would roll back the attempt that was just recorded.
CREATE OR REPLACE FUNCTION public.verify_job_code(p_job_id uuid, p_purpose text, p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_code public.job_codes%ROWTYPE;
  v_failed integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_purpose NOT IN ('start', 'finish') OR p_code IS NULL OR p_code !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'Enter the 6-digit code' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.professional_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF public._job_code_purpose(v_job.current_state) IS DISTINCT FROM p_purpose
     OR (p_purpose = 'start' AND v_job.current_state <> 'arrived') THEN
    RAISE EXCEPTION 'This job is not at the stage for that code' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_code FROM public.job_codes
  WHERE job_id = p_job_id AND purpose = p_purpose
  ORDER BY issued_at DESC LIMIT 1
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_code');
  END IF;

  IF v_code.status = 'used' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used');
  ELSIF v_code.status = 'locked' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'attempts_left', 0);
  ELSIF v_code.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_code');
  END IF;

  IF v_code.expires_at <= now() THEN
    UPDATE public.job_codes SET status = 'expired' WHERE id = v_code.id;
    PERFORM public._job_code_event(p_job_id, 'code_expired', v_uid, jsonb_build_object('purpose', p_purpose, 'code_id', v_code.id));
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;

  IF p_code = public._job_code_value(v_code.id) THEN
    INSERT INTO public.job_code_attempts (code_id, job_id, purpose, actor_user_id, succeeded)
    VALUES (v_code.id, p_job_id, p_purpose, v_uid, true);
    UPDATE public.job_codes SET status = 'used', used_at = now(), used_by = v_uid WHERE id = v_code.id;
    PERFORM public._job_code_event(p_job_id, p_purpose || '_code_verified', v_uid,
                                   jsonb_build_object('purpose', p_purpose, 'code_id', v_code.id));
    RETURN jsonb_build_object('ok', true);
  END IF;

  INSERT INTO public.job_code_attempts (code_id, job_id, purpose, actor_user_id, succeeded)
  VALUES (v_code.id, p_job_id, p_purpose, v_uid, false);
  SELECT count(*) INTO v_failed FROM public.job_code_attempts WHERE code_id = v_code.id AND NOT succeeded;

  PERFORM public._job_code_event(p_job_id, 'code_attempt_failed', v_uid,
                                 jsonb_build_object('purpose', p_purpose, 'code_id', v_code.id, 'failed_attempts', v_failed));

  IF v_failed >= 5 THEN
    UPDATE public.job_codes SET status = 'locked', locked_at = now() WHERE id = v_code.id;
    PERFORM public._job_code_event(p_job_id, 'code_locked', v_uid,
                                   jsonb_build_object('purpose', p_purpose, 'code_id', v_code.id));
    RETURN jsonb_build_object('ok', false, 'reason', 'locked', 'attempts_left', 0);
  END IF;

  RETURN jsonb_build_object('ok', false, 'reason', 'incorrect', 'attempts_left', 5 - v_failed);
END;
$function$;

-- 6. No-show reports --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('professional_no_show')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  preference text NOT NULL CHECK (preference IN ('reassign', 'support')),
  reported_by uuid NOT NULL REFERENCES public.profiles(id),
  professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_start timestamptz NOT NULL,
  reported_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  resolution_note text,
  UNIQUE (job_id, kind)
);
CREATE INDEX IF NOT EXISTS job_exceptions_open_idx ON public.job_exceptions (reported_at) WHERE status = 'open';
ALTER TABLE public.job_exceptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_exceptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_exceptions TO authenticated;

CREATE POLICY job_exceptions_select_customer ON public.job_exceptions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_exceptions.job_id AND j.customer_id = auth.uid()));

CREATE POLICY job_exceptions_select_admin ON public.job_exceptions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'::user_role));

CREATE OR REPLACE FUNCTION public.report_professional_no_show(p_job_id uuid, p_preference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.jobs%ROWTYPE;
  v_start timestamptz;
  v_opens timestamptz;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_preference NOT IN ('reassign', 'support') THEN
    RAISE EXCEPTION 'Choose how you would like us to help' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.customer_id <> v_uid THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_job.current_state IN ('arrived', 'in_progress', 'quote_pending', 'completed', 'closed')
     OR v_job.arrived_at IS NOT NULL THEN
    RAISE EXCEPTION 'The professional has already arrived, so this cannot be reported as a no-show' USING ERRCODE = '22023';
  END IF;
  IF v_job.current_state = 'cancelled' THEN
    RAISE EXCEPTION 'This job was cancelled' USING ERRCODE = '22023';
  END IF;
  IF v_job.current_state = 'assigned' THEN
    RAISE EXCEPTION 'No professional has accepted this job yet' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.job_exceptions WHERE job_id = p_job_id AND kind = 'professional_no_show') THEN
    RAISE EXCEPTION 'You have already reported this. Our team is reviewing it.' USING ERRCODE = '22023';
  END IF;

  SELECT scheduled_start INTO v_start FROM public.bookings WHERE id = v_job.booking_id;
  v_opens := v_start + interval '30 minutes';
  IF now() < v_opens THEN
    RAISE EXCEPTION 'You can report a no-show 30 minutes after the scheduled start' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.job_exceptions
    (job_id, kind, preference, reported_by, professional_id, scheduled_start)
  VALUES (p_job_id, 'professional_no_show', p_preference, v_uid, v_job.professional_id, v_start)
  RETURNING id INTO v_id;

  PERFORM public._job_code_event(p_job_id, 'no_show_reported', v_uid, jsonb_build_object(
    'exception_id', v_id,
    'preference', p_preference,
    'scheduled_start', v_start,
    'reported_at', now(),
    'professional_id', v_job.professional_id,
    'note', 'Customer report; an allegation, not a finding'));

  RETURN jsonb_build_object('exception_id', v_id, 'reported_at', now());
END;
$function$;

-- Admin closes a report. Changes no job state, fee or rating.
CREATE OR REPLACE FUNCTION public.resolve_job_exception(p_exception_id uuid, p_status text, p_note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_ex public.job_exceptions%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid AND role = 'admin'::user_role) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_status NOT IN ('resolved', 'dismissed') OR NULLIF(btrim(p_note), '') IS NULL THEN
    RAISE EXCEPTION 'Choose an outcome and add a note' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_ex FROM public.job_exceptions WHERE id = p_exception_id FOR UPDATE;
  IF NOT FOUND OR v_ex.status <> 'open' THEN
    RAISE EXCEPTION 'Report not found or already closed' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.job_exceptions
  SET status = p_status, resolved_by = v_uid, resolved_at = now(), resolution_note = left(btrim(p_note), 1000)
  WHERE id = p_exception_id;

  PERFORM public._job_code_event(v_ex.job_id, 'no_show_' || p_status, v_uid,
                                 jsonb_build_object('exception_id', p_exception_id));
END;
$function$;

-- 7. Grants -----------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public._job_code_value(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._job_code_event(uuid, text, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._issue_job_code(uuid, text, uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._job_code_purpose(text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_job_code_state(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reissue_job_code(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_job_code(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.report_professional_no_show(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_job_exception(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_code_state(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reissue_job_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_job_code(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.report_professional_no_show(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_job_exception(uuid, text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.transition_job_state(uuid, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_job_state(uuid, text, uuid, jsonb) TO authenticated, service_role;

-- 8. Backfill: jobs already in flight get the code they now need -------------------------------

DO $backfill$
DECLARE
  v_job record;
BEGIN
  FOR v_job IN
    SELECT id, current_state, customer_id FROM public.jobs WHERE current_state IN ('on_the_way', 'arrived', 'in_progress')
  LOOP
    PERFORM public._issue_job_code(v_job.id, public._job_code_purpose(v_job.current_state), v_job.customer_id, false);
  END LOOP;
END
$backfill$;
