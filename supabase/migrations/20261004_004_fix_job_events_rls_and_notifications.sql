-- MIGRATION 20261004_004: Fix Job Events RLS and Add Notifications Trigger
-- Phase 3 — Critical RLS Violation Fix + Auto Notifications
-- This migration fixes the RLS blocking issue on job_events and adds automatic notifications

-- ============================================================================
-- ADD INSERT POLICY FOR JOB_EVENTS
-- ============================================================================
-- Allow professionals to insert job_events via the transition_job_state() RPC function.
-- This policy is checked when the function runs with SECURITY INVOKER (if not DEFINER).
-- With SECURITY DEFINER on the function, this policy is bypassed, but we add it for safety.

CREATE POLICY "professionals_insert_job_events"
  ON public.job_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = job_events.job_id
        AND (jobs.professional_id = auth.uid() OR jobs.customer_id = auth.uid())
    )
  );

-- ============================================================================
-- NOTIFICATION TRIGGER FUNCTION
-- ============================================================================
-- Automatically creates a notification_log entry when a job state changes.
-- This function runs with SECURITY DEFINER to bypass RLS on notification_logs.

CREATE OR REPLACE FUNCTION public.on_job_state_transition()
RETURNS TRIGGER AS $$
DECLARE
  v_job_customer_id uuid;
  v_notification_type text;
BEGIN
  -- Fetch the job's customer_id
  SELECT customer_id INTO v_job_customer_id
  FROM public.jobs
  WHERE id = NEW.job_id;
  
  -- Map state transitions to notification types
  v_notification_type := CASE NEW.to_state
    WHEN 'accepted' THEN 'job_assigned'
    WHEN 'on_the_way' THEN 'arrived'
    WHEN 'arrived' THEN 'arrived'
    WHEN 'in_progress' THEN 'arrived'
    WHEN 'completed' THEN 'job_completed'
    WHEN 'cancelled' THEN 'cancellation'
    ELSE NULL
  END;
  
  -- Only create notification if there's a mapped type
  IF v_notification_type IS NOT NULL AND v_job_customer_id IS NOT NULL THEN
    INSERT INTO public.notification_logs (
      customer_id,
      job_id,
      notification_type,
      channel_attempted,
      status
    ) VALUES (
      v_job_customer_id,
      NEW.job_id,
      v_notification_type,
      'whatsapp',
      'pending'
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the state transition
  -- This ensures job state changes are never blocked by notification failures
  RAISE WARNING 'on_job_state_transition failed for job %: %', NEW.job_id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- TRIGGER ON JOB_EVENTS
-- ============================================================================
-- Fire the notification function after each job state transition is logged

CREATE TRIGGER trg_job_state_transition_notify
AFTER INSERT ON public.job_events
FOR EACH ROW
EXECUTE FUNCTION public.on_job_state_transition();

-- ============================================================================
-- VERIFY SECURITY SETTINGS
-- ============================================================================
-- Ensure the transition_job_state RPC is callable by authenticated users
-- and has proper SECURITY DEFINER protection

-- The function is already updated in migration 004 to use SECURITY DEFINER.
-- This ensures it can INSERT into job_events even though authenticated users cannot.
-- The function validates state transitions and actor_user_id before any write.

