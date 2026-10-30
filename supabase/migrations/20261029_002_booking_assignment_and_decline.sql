-- MIGRATION: Booking → professional assignment, decline/timeout reassignment,
-- atomic quote response, and customer contact release.
-- Date: 2026-10-29
--
-- Before this migration a booking was inserted as 'pending' and nothing ever
-- created a job, so no professional could see it. Declining a quote moved the
-- job to an invalid state. Professionals could not read the customer's profile.

-- ============================================================================
-- Schema additions
-- ============================================================================

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS offer_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_jobs_offer_expires
  ON public.jobs(offer_expires_at)
  WHERE current_state = 'assigned';

-- Who has already been offered a booking and did not take it, so the same
-- professional is not offered it again.
CREATE TABLE IF NOT EXISTS public.booking_assignment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  outcome text NOT NULL CHECK (outcome IN ('declined', 'expired')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_attempts_booking
  ON public.booking_assignment_attempts(booking_id);

ALTER TABLE public.booking_assignment_attempts ENABLE ROW LEVEL SECURITY;

-- Written only by the SECURITY DEFINER functions below.
-- A professional may see their own history.
CREATE POLICY booking_attempts_select_own ON public.booking_assignment_attempts
  FOR SELECT
  USING (professional_id = auth.uid());

-- ============================================================================
-- Internal: choose the best available professional for a booking
-- ============================================================================

CREATE OR REPLACE FUNCTION public._pick_professional(p_booking_id uuid)
RETURNS uuid AS $$
DECLARE
  v_service_id uuid;
  v_category_id uuid;
  v_start timestamptz;
  v_city text;
  v_area text;
  v_local timestamp;
  v_dow smallint;
  v_pro uuid;
BEGIN
  SELECT b.service_id, s.category_id, b.scheduled_start, a.city, a.area
    INTO v_service_id, v_category_id, v_start, v_city, v_area
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  JOIN public.properties p ON p.id = b.property_id
  JOIN public.addresses a ON a.id = p.address_id
  WHERE b.id = p_booking_id;

  IF v_service_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_local := v_start AT TIME ZONE 'Asia/Kolkata';
  v_dow := EXTRACT(DOW FROM v_local)::smallint;

  SELECT pp.user_id INTO v_pro
  FROM public.professional_profiles pp
  WHERE pp.verification_status = 'verified'
    AND COALESCE(pp.is_available, true)
    -- offers the service (or its whole category)
    AND EXISTS (
      SELECT 1 FROM public.professional_skills ps
      WHERE ps.professional_id = pp.user_id
        AND (ps.service_id = v_service_id OR ps.service_category_id = v_category_id)
    )
    -- covers the customer's city (and area, when both sides specify one)
    AND EXISTS (
      SELECT 1 FROM public.professional_service_areas psa
      WHERE psa.professional_id = pp.user_id
        AND COALESCE(psa.is_active, true)
        AND lower(psa.city) = lower(v_city)
        AND (psa.area IS NULL OR v_area IS NULL OR lower(psa.area) = lower(v_area))
    )
    -- working hours: no schedule set means no restriction
    AND (
      NOT EXISTS (
        SELECT 1 FROM public.professional_availability pa
        WHERE pa.professional_id = pp.user_id AND COALESCE(pa.is_active, true)
      )
      OR EXISTS (
        SELECT 1 FROM public.professional_availability pa
        WHERE pa.professional_id = pp.user_id
          AND COALESCE(pa.is_active, true)
          AND pa.day_of_week = v_dow
          AND v_local::time BETWEEN pa.start_time AND pa.end_time
      )
    )
    -- no other active job within 2 hours of this one
    AND NOT EXISTS (
      SELECT 1
      FROM public.jobs j
      JOIN public.bookings jb ON jb.id = j.booking_id
      WHERE j.professional_id = pp.user_id
        AND j.booking_id <> p_booking_id
        AND j.current_state IN ('assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')
        AND jb.scheduled_start BETWEEN v_start - interval '2 hours' AND v_start + interval '2 hours'
    )
    -- has not already declined or timed out on this booking
    AND NOT EXISTS (
      SELECT 1 FROM public.booking_assignment_attempts att
      WHERE att.booking_id = p_booking_id AND att.professional_id = pp.user_id
    )
  ORDER BY
    (SELECT count(*) FROM public.jobs aj
      WHERE aj.professional_id = pp.user_id
        AND aj.current_state IN ('assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')) ASC,
    pp.rating_average DESC NULLS LAST,
    pp.user_id
  LIMIT 1;

  RETURN v_pro;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Internal: create (or hand over) the job for a booking
-- ============================================================================

CREATE OR REPLACE FUNCTION public._assign_booking_internal(p_booking_id uuid, p_actor uuid)
RETURNS uuid AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_pro uuid;
  v_job_id uuid;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND OR v_booking.booking_status <> 'pending' THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.jobs WHERE booking_id = p_booking_id) THEN
    RETURN NULL;
  END IF;

  v_pro := public._pick_professional(p_booking_id);
  IF v_pro IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.jobs (booking_id, customer_id, property_id, professional_id, current_state, offer_expires_at)
  VALUES (p_booking_id, v_booking.customer_id, v_booking.property_id, v_pro, 'assigned', now() + interval '30 minutes')
  RETURNING id INTO v_job_id;

  UPDATE public.bookings SET professional_id = v_pro, updated_at = now() WHERE id = p_booking_id;

  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (v_job_id, 'none', 'assigned', p_actor, 'assigned', jsonb_build_object('professional_id', v_pro));

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Internal: move an unanswered offer to the next professional, or withdraw it
-- ============================================================================

CREATE OR REPLACE FUNCTION public._release_offer(
  p_job_id uuid,
  p_outcome text,
  p_reason text,
  p_actor uuid
) RETURNS boolean AS $$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_next uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id AND current_state = 'assigned' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job is no longer awaiting a response';
  END IF;

  INSERT INTO public.booking_assignment_attempts (booking_id, professional_id, outcome, reason)
  VALUES (v_job.booking_id, v_job.professional_id, p_outcome, p_reason);

  v_next := public._pick_professional(v_job.booking_id);

  IF v_next IS NOT NULL THEN
    UPDATE public.jobs
    SET professional_id = v_next,
        offer_expires_at = now() + interval '30 minutes',
        updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.bookings SET professional_id = v_next, updated_at = now() WHERE id = v_job.booking_id;

    INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
    VALUES (p_job_id, 'assigned', 'assigned', p_actor, 'reassigned',
            jsonb_build_object('from_professional_id', v_job.professional_id,
                               'to_professional_id', v_next,
                               'outcome', p_outcome));
    RETURN true;
  END IF;

  -- Nobody left: withdraw the job so the booking goes back to "finding a professional".
  -- (jobs.professional_id is NOT NULL, so the job cannot stay unassigned.)
  UPDATE public.bookings SET professional_id = NULL, updated_at = now() WHERE id = v_job.booking_id;
  DELETE FROM public.jobs WHERE id = p_job_id;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Public: customer asks for a professional for their pending booking
-- ============================================================================

CREATE OR REPLACE FUNCTION public.assign_booking(p_booking_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_customer uuid;
  v_job_id uuid;
BEGIN
  SELECT customer_id INTO v_customer FROM public.bookings WHERE id = p_booking_id;
  IF v_customer IS NULL OR v_customer <> auth.uid() THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_job_id := public._assign_booking_internal(p_booking_id, auth.uid());

  RETURN jsonb_build_object('matched', v_job_id IS NOT NULL, 'job_id', v_job_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Public: assigned professional declines the offer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.decline_job(p_job_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  v_pro uuid;
  v_reassigned boolean;
BEGIN
  SELECT professional_id INTO v_pro
  FROM public.jobs
  WHERE id = p_job_id AND current_state = 'assigned';

  IF v_pro IS NULL OR v_pro <> auth.uid() THEN
    RAISE EXCEPTION 'Job not found or no longer awaiting your response';
  END IF;

  v_reassigned := public._release_offer(p_job_id, 'declined', left(p_reason, 500), auth.uid());

  RETURN jsonb_build_object('reassigned', v_reassigned);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Service-role only: sweep expired offers and retry unmatched bookings
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_assignment_queue()
RETURNS jsonb AS $$
DECLARE
  v_job record;
  v_booking record;
  v_expired int := 0;
  v_matched int := 0;
BEGIN
  FOR v_job IN
    SELECT id, professional_id FROM public.jobs
    WHERE current_state = 'assigned' AND offer_expires_at IS NOT NULL AND offer_expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public._release_offer(v_job.id, 'expired', 'No response within 30 minutes', v_job.professional_id);
    v_expired := v_expired + 1;
  END LOOP;

  FOR v_booking IN
    SELECT b.id, b.customer_id FROM public.bookings b
    WHERE b.booking_status = 'pending'
      AND b.scheduled_start > now()
      AND NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.booking_id = b.id)
  LOOP
    IF public._assign_booking_internal(v_booking.id, v_booking.customer_id) IS NOT NULL THEN
      v_matched := v_matched + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('expired_offers', v_expired, 'newly_matched', v_matched);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Public: customer approves or declines a quote (atomic)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.respond_to_quote(
  p_quote_id uuid,
  p_decision text,
  p_reason text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_job public.jobs%ROWTYPE;
BEGIN
  IF p_decision NOT IN ('approved', 'declined') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_quote.job_id FOR UPDATE;
  IF NOT FOUND OR v_job.customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Quote not found';
  END IF;

  IF v_quote.status <> 'pending_customer' THEN
    RAISE EXCEPTION 'This quote has already been answered';
  END IF;

  IF v_job.current_state <> 'quote_pending' THEN
    RAISE EXCEPTION 'Job is not waiting on a quote (state: %)', v_job.current_state;
  END IF;

  IF v_quote.expires_at IS NOT NULL AND v_quote.expires_at < now() THEN
    RAISE EXCEPTION 'This quote has expired';
  END IF;

  UPDATE public.quotes SET status = p_decision, updated_at = now() WHERE id = p_quote_id;

  -- Approving authorises the extra work; declining sends the job back to the
  -- professional to continue (or cancel) the original scope. Both resume work.
  PERFORM public.transition_job_state(
    v_job.id,
    'in_progress',
    auth.uid(),
    jsonb_build_object(
      'event_type', CASE WHEN p_decision = 'approved' THEN 'quote_approved' ELSE 'quote_declined' END,
      'quote_id', p_quote_id,
      'reason', left(p_reason, 500)
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Public: assigned professional reads the customer's contact + address
-- Released only after the professional has accepted the job.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_job_customer_contact(p_job_id uuid)
RETURNS TABLE (
  full_name text,
  phone text,
  address_line_1 text,
  address_line_2 text,
  area text,
  city text,
  postal_code text,
  access_notes text
) AS $$
BEGIN
  RETURN QUERY
  SELECT pr.full_name, pr.phone, a.address_line_1, a.address_line_2, a.area, a.city, a.postal_code, a.access_notes
  FROM public.jobs j
  JOIN public.profiles pr ON pr.id = j.customer_id
  JOIN public.properties p ON p.id = j.property_id
  JOIN public.addresses a ON a.id = p.address_id
  WHERE j.id = p_job_id
    AND j.professional_id = auth.uid()
    AND j.current_state NOT IN ('assigned', 'closed');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Grants
-- ============================================================================

REVOKE ALL ON FUNCTION public._pick_professional(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._assign_booking_internal(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._release_offer(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_assignment_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_assignment_queue() TO service_role;

REVOKE ALL ON FUNCTION public.assign_booking(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.decline_job(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.respond_to_quote(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_job_customer_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_booking(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_job(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_quote(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_customer_contact(uuid) TO authenticated;
