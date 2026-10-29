-- transition_job_state: verification on accept + caller authorization.
--
-- Brings the function in line with 20261004_006 (professional must be verified
-- to accept) and adds what that version lacked. Because it is SECURITY DEFINER,
-- RLS no longer limits who can call it, so the function checks the caller itself:
--   * a signed-in caller must be the actor, and must be the job's professional,
--     or the job's customer for quote_pending -> in_progress / cancelled;
--   * calls without a user session (service role, queue) are trusted.
-- event_type may be supplied through p_metadata (e.g. quote_approved).

CREATE OR REPLACE FUNCTION public.transition_job_state(
  p_job_id uuid,
  p_new_state text,
  p_actor_user_id uuid,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
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
    IF v_caller <> v_job.professional_id
       AND NOT (v_caller = v_job.customer_id
                AND p_new_state IN ('in_progress', 'cancelled')
                AND v_job.current_state IN ('quote_pending', 'assigned', 'accepted', 'on_the_way', 'arrived')) THEN
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

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.transition_job_state(uuid, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transition_job_state(uuid, text, uuid, jsonb) TO authenticated, service_role;
