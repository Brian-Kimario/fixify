-- MIGRATION: Phase 3B — Booking Events Audit Table
-- Goal: Record all booking state transitions with authorization context
-- Date: 2026-10-04

-- ============================================================================
-- BOOKING_EVENTS TABLE (Immutable Audit Log)
-- ============================================================================

CREATE TABLE public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  from_status text NOT NULL,
  to_status text NOT NULL,
  
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role text,
  -- 'customer', 'professional', 'admin'
  
  reason text,
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_booking_events_booking ON public.booking_events(booking_id);
CREATE INDEX idx_booking_events_status ON public.booking_events(to_status);
CREATE INDEX idx_booking_events_created_at ON public.booking_events(created_at);

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional/admin can view events of relevant bookings
CREATE POLICY booking_events_select_own ON public.booking_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE id = booking_id AND (customer_id = auth.uid() OR professional_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- FUNCTION: Transition Booking Status (server-side state machine)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transition_booking_state(
  p_booking_id uuid,
  p_new_status text,
  p_actor_user_id uuid,
  p_actor_role text DEFAULT 'customer',
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status text;
  v_valid boolean := false;
  v_customer_id uuid;
  v_job_id uuid;
BEGIN
  -- Get current status and customer
  SELECT booking_status, customer_id INTO v_current_status, v_customer_id
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;
  
  -- Validate state transition
  -- Allowed: pending → accepted → in_progress → completed
  --          any_active → cancelled
  IF (v_current_status = 'pending' AND p_new_status IN ('accepted', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_status = 'accepted' AND p_new_status IN ('in_progress', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_status = 'in_progress' AND p_new_status IN ('completed', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_status = 'completed' AND p_new_status = 'cancelled') THEN
    v_valid := true;
  END IF;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid booking status transition from % to %', v_current_status, p_new_status;
  END IF;
  
  -- Update booking status
  UPDATE public.bookings
  SET 
    booking_status = p_new_status,
    updated_at = now()
  WHERE id = p_booking_id;
  
  -- If cancelling, also cancel associated job if it exists
  IF p_new_status = 'cancelled' THEN
    SELECT id INTO v_job_id
    FROM public.jobs
    WHERE booking_id = p_booking_id
    AND current_state NOT IN ('completed', 'cancelled', 'closed');
    
    IF v_job_id IS NOT NULL THEN
      -- Cancel the job through the state machine
      PERFORM public.transition_job_state(
        v_job_id,
        'cancelled',
        p_actor_user_id,
        jsonb_build_object('triggered_by_booking_cancellation', true)
      );
    END IF;
  END IF;
  
  -- Create immutable audit event
  INSERT INTO public.booking_events (
    booking_id, 
    from_status, 
    to_status, 
    actor_user_id, 
    actor_role,
    reason,
    metadata
  )
  VALUES (
    p_booking_id, 
    v_current_status, 
    p_new_status, 
    p_actor_user_id, 
    p_actor_role,
    p_reason,
    p_metadata
  );
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.transition_booking_state TO authenticated;
