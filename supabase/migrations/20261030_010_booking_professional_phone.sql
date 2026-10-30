-- Customer can see the professional's phone once the job is accepted.
--
-- profiles RLS is own-row only, so the booking page's profiles embed always came back
-- empty. Rather than widening profiles RLS, get_booking_professional (which already checks
-- the caller owns the booking) returns the phone for the accepted-to-quote states.

CREATE OR REPLACE FUNCTION public.get_booking_professional(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pro uuid;
  v_state text;
  v_category uuid;
  v_min_reviews numeric := COALESCE(public._matching_setting('rating_min_reviews'), 3);
  v_result jsonb;
BEGIN
  SELECT j.professional_id, j.current_state::text, s.category_id INTO v_pro, v_state, v_category
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
    'rating_count', CASE WHEN m.rating_count >= v_min_reviews THEN m.rating_count END,
    -- Shared only once the professional has accepted and until the visit's work is done.
    'phone', CASE WHEN v_state IN ('accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')
                  THEN pr.phone END
  )
  INTO v_result
  FROM public.professional_profiles pp
  JOIN public.professional_metrics m ON m.professional_id = pp.user_id
  LEFT JOIN public.profiles pr ON pr.id = pp.user_id
  WHERE pp.user_id = v_pro;

  RETURN v_result;
END;
$function$;
