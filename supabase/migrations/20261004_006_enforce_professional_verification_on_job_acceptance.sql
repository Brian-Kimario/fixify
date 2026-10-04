-- MIGRATION: Enforce Professional Verification on Job Acceptance
-- Goal: Add database-level check preventing unverified professionals from accepting jobs
-- Date: 2026-10-04

-- ============================================================================
-- CONTEXT
-- ============================================================================
-- PHASE_1_1.5_OWNER_DECISIONS.md requires:
--   "Server-side enforcement prevents job access. Unverified professionals cannot
--    accept marketplace jobs."
--
-- This is enforced at:
--   1. Application layer: updateJobState() checks verification_status before RPC call
--   2. Database layer: transition_job_state() RPC should validate (added here)

-- ============================================================================
-- UPDATE: transition_job_state() RPC
-- ============================================================================
-- Add a check inside the state machine: before allowing assigned → accepted,
-- verify the professional has verification_status = 'verified'.
--
-- This is defense-in-depth: prevents acceptance even if app layer is bypassed.

CREATE OR REPLACE FUNCTION public.transition_job_state(
  p_job_id uuid,
  p_new_state text,
  p_actor_user_id uuid,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_state text;
  v_professional_id uuid;
  v_professional_verification_status text;
  v_valid boolean := false;
BEGIN
  -- Get current state and professional
  SELECT current_state, professional_id INTO v_current_state, v_professional_id
  FROM public.jobs
  WHERE id = p_job_id
  FOR UPDATE;
  
  -- Defense-in-depth: Before allowing 'accepted' state, verify professional is verified
  IF p_new_state = 'accepted' THEN
    SELECT verification_status INTO v_professional_verification_status
    FROM public.professional_profiles
    WHERE user_id = v_professional_id;
    
    IF v_professional_verification_status IS NULL THEN
      RAISE EXCEPTION 'Professional not found';
    END IF;
    
    IF v_professional_verification_status != 'verified' THEN
      RAISE EXCEPTION 'Professional must be verified to accept jobs. Current status: %', v_professional_verification_status;
    END IF;
  END IF;
  
  -- Validate state transition (existing logic)
  IF (v_current_state = 'assigned' AND p_new_state IN ('accepted', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'accepted' AND p_new_state IN ('on_the_way', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'on_the_way' AND p_new_state IN ('arrived', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'arrived' AND p_new_state IN ('in_progress', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'in_progress' AND p_new_state IN ('quote_pending', 'completed', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'quote_pending' AND p_new_state IN ('in_progress', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'completed' AND p_new_state = 'closed') THEN
    v_valid := true;
  ELSIF (v_current_state = 'cancelled' AND p_new_state = 'closed') THEN
    v_valid := true;
  END IF;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_current_state, p_new_state;
  END IF;
  
  -- Update job state and timestamps
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
  
  -- Create immutable event log entry
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_current_state, p_new_state, p_actor_user_id, 'state_transition', p_metadata);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
