-- 20261030_009_matching_v2_offers
--
-- Offer flow on top of _rank_professionals (20261030_008):
--   * every offer, and the first time a booking finds nobody, writes matching_decisions;
--   * attempts link to the decision they answered and carry a reason code;
--   * an empty pool never deletes the job. The job stays 'assigned' with no professional,
--     the booking gets unmatched_since, and process_assignment_queue keeps retrying it;
--   * the offer window comes from matching_config.offer_window_minutes;
--   * decline_job requires a reason code;
--   * create_booking stores problem_summary, urgency and the chosen option labels;
--   * get_offer_localities and get_booking_professional expose only what each side may see.

-- ── Offer the booking to the next professional ──────────────────────────────

CREATE OR REPLACE FUNCTION public._offer_next(p_booking_id uuid, p_actor uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_pick record;
  v_decision uuid;
  v_window interval := make_interval(mins => COALESCE(public._matching_setting('offer_window_minutes'), 30)::int);
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE booking_id = p_booking_id FOR UPDATE;
  IF FOUND AND v_job.current_state <> 'assigned' THEN
    RAISE EXCEPTION 'Booking % already has a job in state %', p_booking_id, v_job.current_state;
  END IF;

  SELECT r.*, count(*) OVER () AS pool_size INTO v_pick
  FROM public._rank_professionals(p_booking_id) r
  LIMIT 1;

  IF NOT FOUND THEN
    -- Log the empty pool once per unmatched spell, not on every queue run.
    IF v_booking.unmatched_since IS NULL THEN
      INSERT INTO public.matching_decisions (booking_id, job_id, kind, pool_size, inputs)
      VALUES (p_booking_id, v_job.id, 'unmatched', 0,
              jsonb_build_object('reason', 'no eligible professional'));
    END IF;

    IF v_job.id IS NOT NULL AND v_job.professional_id IS NOT NULL THEN
      UPDATE public.jobs
      SET professional_id = NULL, offer_expires_at = NULL, updated_at = now()
      WHERE id = v_job.id;

      INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
      VALUES (v_job.id, 'assigned', 'assigned', p_actor, 'unmatched',
              jsonb_build_object('from_professional_id', v_job.professional_id));
    END IF;

    UPDATE public.bookings
    SET professional_id = NULL, unmatched_since = COALESCE(unmatched_since, now()), updated_at = now()
    WHERE id = p_booking_id;

    RETURN NULL;
  END IF;

  INSERT INTO public.matching_decisions
    (booking_id, job_id, professional_id, kind, pool_size, score, geo_basis, distance_km, inputs)
  VALUES
    (p_booking_id, v_job.id, v_pick.professional_id, 'offered', v_pick.pool_size, v_pick.score,
     v_pick.geo_basis, v_pick.distance_km, v_pick.inputs)
  RETURNING id INTO v_decision;

  IF v_job.id IS NOT NULL THEN
    UPDATE public.jobs
    SET professional_id = v_pick.professional_id, offer_expires_at = now() + v_window, updated_at = now()
    WHERE id = v_job.id;

    INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
    VALUES (v_job.id, 'assigned', 'assigned', p_actor, 'reassigned',
            jsonb_build_object('from_professional_id', v_job.professional_id,
                               'to_professional_id', v_pick.professional_id));
  ELSE
    INSERT INTO public.jobs (booking_id, customer_id, property_id, professional_id, current_state, offer_expires_at)
    VALUES (p_booking_id, v_booking.customer_id, v_booking.property_id, v_pick.professional_id,
            'assigned', now() + v_window)
    RETURNING * INTO v_job;

    UPDATE public.matching_decisions SET job_id = v_job.id WHERE id = v_decision;

    INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
    VALUES (v_job.id, 'none', 'assigned', p_actor, 'assigned',
            jsonb_build_object('professional_id', v_pick.professional_id));
  END IF;

  UPDATE public.bookings
  SET professional_id = v_pick.professional_id, unmatched_since = NULL, updated_at = now()
  WHERE id = p_booking_id;

  RETURN v_pick.professional_id;
END;
$function$;

-- ── Assign and release ──────────────────────────────────────────────────────

-- Returns the job id when a professional was offered the job, otherwise NULL.
CREATE OR REPLACE FUNCTION public._assign_booking_internal(p_booking_id uuid, p_actor uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_job public.jobs%ROWTYPE;
  v_job_id uuid;
BEGIN
  SELECT booking_status INTO v_status FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'pending' THEN
    RETURN NULL;
  END IF;

  -- Only a booking with no job, or one kept unmatched, can be offered again here.
  SELECT * INTO v_job FROM public.jobs WHERE booking_id = p_booking_id;
  IF FOUND AND (v_job.current_state <> 'assigned' OR v_job.professional_id IS NOT NULL) THEN
    RETURN NULL;
  END IF;

  IF public._offer_next(p_booking_id, p_actor) IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_job_id FROM public.jobs WHERE booking_id = p_booking_id;
  RETURN v_job_id;
END;
$function$;

DROP FUNCTION IF EXISTS public._release_offer(uuid, text, text, uuid);

CREATE FUNCTION public._release_offer(
  p_job_id uuid,
  p_outcome text,
  p_reason_code text,
  p_note text,
  p_actor uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_decision uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs
  WHERE id = p_job_id AND current_state = 'assigned' AND professional_id IS NOT NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job is no longer awaiting a response';
  END IF;

  SELECT id INTO v_decision FROM public.matching_decisions
  WHERE job_id = p_job_id AND professional_id = v_job.professional_id AND kind = 'offered'
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.booking_assignment_attempts
    (booking_id, professional_id, outcome, reason_code, reason, decision_id)
  VALUES
    (v_job.booking_id, v_job.professional_id, p_outcome, p_reason_code, left(p_note, 500), v_decision);

  RETURN public._offer_next(v_job.booking_id, p_actor) IS NOT NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_assignment_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job record;
  v_booking record;
  v_expired int := 0;
  v_matched int := 0;
  v_unmatched int;
BEGIN
  FOR v_job IN
    SELECT id, professional_id FROM public.jobs
    WHERE current_state = 'assigned'
      AND professional_id IS NOT NULL
      AND offer_expires_at IS NOT NULL
      AND offer_expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public._release_offer(v_job.id, 'expired', NULL, NULL, v_job.professional_id);
    v_expired := v_expired + 1;
  END LOOP;

  FOR v_booking IN
    SELECT b.id, b.customer_id FROM public.bookings b
    LEFT JOIN public.jobs j ON j.booking_id = b.id
    WHERE b.booking_status = 'pending'
      AND b.scheduled_start > now()
      AND (j.id IS NULL OR (j.current_state = 'assigned' AND j.professional_id IS NULL))
  LOOP
    IF public._assign_booking_internal(v_booking.id, v_booking.customer_id) IS NOT NULL THEN
      v_matched := v_matched + 1;
    END IF;
  END LOOP;

  SELECT count(*) INTO v_unmatched FROM public.bookings
  WHERE booking_status = 'pending' AND unmatched_since IS NOT NULL;

  RETURN jsonb_build_object('expired_offers', v_expired, 'newly_matched', v_matched,
                            'still_unmatched', v_unmatched);
END;
$function$;

-- ── Decline with a reason code ──────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.decline_job(uuid, text);

CREATE FUNCTION public.decline_job(p_job_id uuid, p_reason_code text, p_note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pro uuid;
  v_note text := NULLIF(btrim(p_note), '');
BEGIN
  IF p_reason_code IS NULL
     OR p_reason_code NOT IN ('schedule_conflict', 'too_far', 'not_my_skill', 'need_more_detail', 'other') THEN
    RAISE EXCEPTION 'Choose a reason for declining' USING ERRCODE = '22023';
  END IF;
  IF p_reason_code = 'other' AND v_note IS NULL THEN
    RAISE EXCEPTION 'Add a short note when the reason is Other' USING ERRCODE = '22023';
  END IF;

  SELECT professional_id INTO v_pro
  FROM public.jobs
  WHERE id = p_job_id AND current_state = 'assigned';

  IF v_pro IS NULL OR v_pro <> auth.uid() THEN
    RAISE EXCEPTION 'Job not found or no longer awaiting your response' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'reassigned', public._release_offer(p_job_id, 'declined', p_reason_code, v_note, auth.uid())
  );
END;
$function$;

-- ── Booking intake ──────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.create_booking(uuid, uuid, timestamptz);

CREATE FUNCTION public.create_booking(
  p_service_id      uuid,
  p_property_id     uuid,
  p_scheduled_start timestamptz,
  p_problem_summary text DEFAULT NULL,
  p_urgency         text DEFAULT 'flexible',
  p_options         jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (booking_id uuid, booking_reference text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer uuid := auth.uid();
  v_service  public.services%ROWTYPE;
  v_amount   numeric;
  v_summary  text := NULLIF(btrim(p_problem_summary), '');
  v_urgency  text := COALESCE(p_urgency, 'flexible');
  v_options  jsonb := '[]'::jsonb;
  v_given    int;
BEGIN
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles
                 WHERE id = v_customer AND role = 'customer'::user_role) THEN
    RAISE EXCEPTION 'Only customers can create bookings' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_service
  FROM public.services
  WHERE id = p_service_id AND is_active IS TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found or no longer available' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.properties
                 WHERE id = p_property_id AND owner_customer_id = v_customer) THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'P0002';
  END IF;

  IF p_scheduled_start IS NULL OR p_scheduled_start <= now() THEN
    RAISE EXCEPTION 'Scheduled start must be in the future' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_summary) > 1000 THEN
    RAISE EXCEPTION 'Problem description is too long' USING ERRCODE = '22023';
  END IF;

  IF v_urgency NOT IN ('flexible', 'today', 'emergency')
     OR (v_urgency = 'emergency' AND COALESCE(public._matching_setting('emergency_enabled'), 0) <> 1) THEN
    RAISE EXCEPTION 'Urgency % is not available', v_urgency USING ERRCODE = '22023';
  END IF;

  -- Options arrive as {option_id: value}. Keep only active values of this service's
  -- options and store their labels; any id or value that doesn't match is refused.
  IF p_options IS NOT NULL AND jsonb_typeof(p_options) = 'object' AND p_options <> '{}'::jsonb THEN
    SELECT count(*) INTO v_given FROM jsonb_object_keys(p_options);

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'option_id', so.id, 'option', so.name, 'value', sov.value, 'label', sov.label)
             ORDER BY so.sort_order NULLS LAST, so.name), '[]'::jsonb)
      INTO v_options
    FROM jsonb_each_text(p_options) given
    JOIN public.service_options so
      ON so.id::text = given.key AND so.service_id = v_service.id
    JOIN public.service_option_values sov
      ON sov.service_option_id = so.id AND sov.value = given.value AND COALESCE(sov.is_active, true);

    IF jsonb_array_length(v_options) <> v_given THEN
      RAISE EXCEPTION 'One of the chosen options is not available' USING ERRCODE = '22023';
    END IF;
  ELSIF p_options IS NOT NULL AND jsonb_typeof(p_options) <> 'object' THEN
    RAISE EXCEPTION 'Options must be an object' USING ERRCODE = '22023';
  END IF;

  v_amount := CASE v_service.pricing_model
    WHEN 'fixed' THEN v_service.base_price
    WHEN 'inspection' THEN v_service.inspection_fee
    WHEN 'quote_after_inspection' THEN NULL
  END;

  IF v_service.pricing_model NOT IN ('fixed', 'inspection', 'quote_after_inspection')
     OR (v_service.pricing_model <> 'quote_after_inspection' AND v_amount IS NULL) THEN
    RAISE EXCEPTION 'Service % has no price for pricing model %', v_service.id, v_service.pricing_model
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.bookings AS b
    (customer_id, property_id, service_id, scheduled_start, pricing_model,
     quoted_or_base_amount, booking_status, problem_summary, urgency, intake_options)
  VALUES
    (v_customer, p_property_id, v_service.id, p_scheduled_start, v_service.pricing_model,
     v_amount, 'pending', v_summary, v_urgency, v_options)
  RETURNING b.id, b.booking_reference;
END;
$function$;

-- ── What each side may see ──────────────────────────────────────────────────

-- Area, city and distance for the caller's open offers. No street address: that comes
-- from get_job_customer_contact after accepting.
CREATE OR REPLACE FUNCTION public.get_offer_localities(p_job_ids uuid[])
RETURNS TABLE (job_id uuid, area text, city text, distance_km numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    j.id,
    a.area,
    a.city,
    (SELECT md.distance_km FROM public.matching_decisions md
     WHERE md.job_id = j.id AND md.professional_id = j.professional_id AND md.kind = 'offered'
     ORDER BY md.created_at DESC LIMIT 1)
  FROM public.jobs j
  JOIN public.properties p ON p.id = j.property_id
  JOIN public.addresses a ON a.id = p.address_id
  WHERE j.id = ANY (p_job_ids)
    AND j.professional_id = auth.uid()
    AND j.current_state = 'assigned';
$$;

-- The public card for the professional on a booking, for that booking's customer.
-- Rating is returned only once rating_count reaches rating_min_reviews. No phone or address.
CREATE OR REPLACE FUNCTION public.get_booking_professional(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pro uuid;
  v_category uuid;
  v_min_reviews numeric := COALESCE(public._matching_setting('rating_min_reviews'), 3);
  v_result jsonb;
BEGIN
  SELECT j.professional_id, s.category_id INTO v_pro, v_category
  FROM public.bookings b
  JOIN public.jobs j ON j.booking_id = b.id
  JOIN public.services s ON s.id = b.service_id
  WHERE b.id = p_booking_id AND b.customer_id = auth.uid();

  IF v_pro IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'professional_id', pp.user_id,
    'display_name', pp.display_name,
    'verified', pp.verification_status = 'verified',
    'years_experience', pp.years_experience,
    'skills', COALESCE((
      SELECT jsonb_agg(DISTINCT COALESCE(sv.name, sc.name))
      FROM public.professional_skills ps
      JOIN public.service_categories sc ON sc.id = ps.service_category_id
      LEFT JOIN public.services sv ON sv.id = ps.service_id
      WHERE ps.professional_id = pp.user_id AND ps.service_category_id = v_category
    ), '[]'::jsonb),
    'jobs_completed', m.jobs_completed,
    'median_response_seconds', m.median_response_seconds,
    'rating_average', CASE WHEN m.rating_count >= v_min_reviews THEN m.rating_average END,
    'rating_count', CASE WHEN m.rating_count >= v_min_reviews THEN m.rating_count END
  )
  INTO v_result
  FROM public.professional_profiles pp
  JOIN public.professional_metrics m ON m.professional_id = pp.user_id
  WHERE pp.user_id = v_pro;

  RETURN v_result;
END;
$function$;

-- ── Grants ──────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public._offer_next(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._assign_booking_internal(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._release_offer(uuid, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_assignment_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_assignment_queue() TO service_role;

REVOKE EXECUTE ON FUNCTION public.decline_job(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_job(uuid, text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz, text, text, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_offer_localities(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_offer_localities(uuid[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_booking_professional(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_professional(uuid) TO authenticated;
