-- 20261030_008_matching_v2_ranking
--
-- professional_metrics and the v2 ranking. Every metric comes from rows that record what
-- happened (jobs, job_events, booking_assignment_attempts). There is no reviews table yet
-- (Phase 6), so rating_average is NULL and rating_count is 0 for everyone, and the rating
-- component scores 0 until rating_count reaches matching_config.rating_min_reviews.
--
-- _rank_professionals keeps every hard filter of the old _pick_professional (verified,
-- available, skill for the service or category, working hours, no clash within 2 hours,
-- not already tried for this booking) and changes geography and ordering:
--   * an area with base coordinates and radius_km, and a property with coordinates,
--     qualifies by haversine distance <= radius_km (geo_basis 'distance');
--   * otherwise the area qualifies by city, as before (geo_basis 'city', the fallback);
--   * candidates are ordered by a weighted score from matching_config, then user_id.

-- ── Helpers ─────────────────────────────────────────────────────────────────

-- Not named _matching_config: that name is the array type of the matching_config table.
CREATE OR REPLACE FUNCTION public._matching_setting(p_key text)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT value FROM public.matching_config WHERE key = p_key;
$$;

CREATE OR REPLACE FUNCTION public._haversine_km(lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT CASE WHEN lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN NULL
  ELSE (2 * 6371 * asin(sqrt(
      power(sin(radians((lat2 - lat1)::float8) / 2), 2)
      + cos(radians(lat1::float8)) * cos(radians(lat2::float8))
        * power(sin(radians((lng2 - lng1)::float8) / 2), 2)
    )))::numeric
  END;
$$;

-- ── Metrics ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.professional_metrics
WITH (security_invoker = true) AS
WITH accepted AS (
  SELECT
    j.professional_id,
    j.customer_id,
    j.completed_at,
    j.current_state,
    EXISTS (
      SELECT 1 FROM public.job_events e
      WHERE e.job_id = j.id AND e.to_state = 'cancelled' AND e.actor_user_id = j.professional_id
    ) AS cancelled_by_pro,
    EXTRACT(EPOCH FROM j.accepted_at - (
      SELECT max(e.created_at) FROM public.job_events e
      WHERE e.job_id = j.id
        AND e.event_type IN ('assigned', 'reassigned')
        AND e.created_at <= j.accepted_at
        AND COALESCE(e.metadata ->> 'to_professional_id', e.metadata ->> 'professional_id')
            = j.professional_id::text
    )) AS response_seconds
  FROM public.jobs j
  WHERE j.accepted_at IS NOT NULL AND j.professional_id IS NOT NULL
),
acc AS (
  SELECT
    professional_id,
    count(*) AS accepted_count,
    count(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_count,
    count(*) FILTER (WHERE cancelled_by_pro) AS pro_cancelled_count,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY response_seconds)
      FILTER (WHERE response_seconds IS NOT NULL) AS median_response_seconds
  FROM accepted
  GROUP BY professional_id
),
repeat AS (
  SELECT professional_id, count(*) AS repeat_customer_count
  FROM (
    SELECT professional_id, customer_id FROM accepted
    WHERE completed_at IS NOT NULL
    GROUP BY professional_id, customer_id
    HAVING count(*) >= 2
  ) r
  GROUP BY professional_id
),
att AS (
  SELECT
    professional_id,
    count(*) FILTER (WHERE outcome = 'declined') AS declined_count,
    count(*) FILTER (WHERE outcome = 'expired') AS expired_count
  FROM public.booking_assignment_attempts
  GROUP BY professional_id
)
SELECT
  pp.user_id AS professional_id,
  COALESCE(acc.accepted_count, 0) AS offers_accepted,
  COALESCE(att.declined_count, 0) AS offers_declined,
  COALESCE(att.expired_count, 0) AS offers_expired,
  CASE WHEN COALESCE(acc.accepted_count, 0) + COALESCE(att.declined_count, 0) + COALESCE(att.expired_count, 0) = 0
    THEN NULL
    ELSE round(COALESCE(acc.accepted_count, 0)::numeric
      / (COALESCE(acc.accepted_count, 0) + COALESCE(att.declined_count, 0) + COALESCE(att.expired_count, 0)), 4)
  END AS acceptance_rate,
  round(acc.median_response_seconds::numeric) AS median_response_seconds,
  -- Of accepted jobs that ended with the professional (completed, or cancelled by them),
  -- the share completed. Cancellations by the customer or an admin are not held against them.
  CASE WHEN COALESCE(acc.completed_count, 0) + COALESCE(acc.pro_cancelled_count, 0) = 0 THEN NULL
    ELSE round(acc.completed_count::numeric / (acc.completed_count + acc.pro_cancelled_count), 4)
  END AS completion_rate,
  -- Share of accepted jobs the professional cancelled themselves.
  CASE WHEN COALESCE(acc.accepted_count, 0) = 0 THEN NULL
    ELSE round(acc.pro_cancelled_count::numeric / acc.accepted_count, 4)
  END AS cancel_rate,
  COALESCE(acc.completed_count, 0) AS jobs_completed,
  COALESCE(repeat.repeat_customer_count, 0) AS repeat_customer_count,
  NULL::numeric AS rating_average,
  0 AS rating_count
FROM public.professional_profiles pp
LEFT JOIN acc ON acc.professional_id = pp.user_id
LEFT JOIN att ON att.professional_id = pp.user_id
LEFT JOIN repeat ON repeat.professional_id = pp.user_id;

COMMENT ON VIEW public.professional_metrics IS
  'Outcome metrics per professional from jobs, job_events and booking_assignment_attempts. rating_* stay empty until the reviews table exists (Phase 6).';

-- Read through SECURITY DEFINER functions only.
REVOKE ALL ON public.professional_metrics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.professional_metrics TO service_role;

-- ── Ranking ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public._rank_professionals(p_booking_id uuid)
RETURNS TABLE (
  professional_id uuid,
  score numeric,
  geo_basis text,
  distance_km numeric,
  inputs jsonb
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_service_id uuid;
  v_category_id uuid;
  v_start timestamptz;
  v_city text;
  v_area text;
  v_lat numeric;
  v_lng numeric;
  v_local timestamp;
  v_dow smallint;
  c_prior numeric := COALESCE(public._matching_setting('metric_prior'), 0.5);
  c_window numeric := COALESCE(public._matching_setting('offer_window_minutes'), 30) * 60;
  c_exp_cap numeric := GREATEST(COALESCE(public._matching_setting('experience_cap_years'), 10), 1);
  c_min_reviews numeric := COALESCE(public._matching_setting('rating_min_reviews'), 3);
  w_proximity numeric := COALESCE(public._matching_setting('w_proximity'), 0);
  w_load numeric := COALESCE(public._matching_setting('w_load'), 0);
  w_specific numeric := COALESCE(public._matching_setting('w_service_specific'), 0);
  w_level numeric := COALESCE(public._matching_setting('w_skill_level'), 0);
  w_experience numeric := COALESCE(public._matching_setting('w_experience'), 0);
  w_acceptance numeric := COALESCE(public._matching_setting('w_acceptance'), 0);
  w_response numeric := COALESCE(public._matching_setting('w_response'), 0);
  w_completion numeric := COALESCE(public._matching_setting('w_completion'), 0);
  w_reliability numeric := COALESCE(public._matching_setting('w_reliability'), 0);
  w_rating numeric := COALESCE(public._matching_setting('w_rating'), 0);
BEGIN
  SELECT b.service_id, s.category_id, b.scheduled_start, a.city, a.area, a.latitude, a.longitude
    INTO v_service_id, v_category_id, v_start, v_city, v_area, v_lat, v_lng
  FROM public.bookings b
  JOIN public.services s ON s.id = b.service_id
  JOIN public.properties p ON p.id = b.property_id
  JOIN public.addresses a ON a.id = p.address_id
  WHERE b.id = p_booking_id;

  IF v_service_id IS NULL THEN
    RETURN;
  END IF;

  v_local := v_start AT TIME ZONE 'Asia/Kolkata';
  v_dow := EXTRACT(DOW FROM v_local)::smallint;

  RETURN QUERY
  WITH candidates AS (
    SELECT pp.user_id, pp.years_experience
    FROM public.professional_profiles pp
    WHERE pp.verification_status = 'verified'
      AND COALESCE(pp.is_available, true)
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
      AND NOT EXISTS (
        SELECT 1
        FROM public.jobs j
        JOIN public.bookings jb ON jb.id = j.booking_id
        WHERE j.professional_id = pp.user_id
          AND j.booking_id <> p_booking_id
          AND j.current_state IN ('assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')
          AND jb.scheduled_start BETWEEN v_start - interval '2 hours' AND v_start + interval '2 hours'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.booking_assignment_attempts att
        WHERE att.booking_id = p_booking_id AND att.professional_id = pp.user_id
      )
  ),
  skill AS (
    -- Best matching skill: an exact service beats the category, then the higher level.
    SELECT DISTINCT ON (ps.professional_id)
      ps.professional_id,
      CASE WHEN ps.service_id = v_service_id THEN 1.0 ELSE 0.5 END AS specific,
      CASE lower(ps.skill_level)
        WHEN 'expert' THEN 1.0 WHEN 'advanced' THEN 0.67
        WHEN 'intermediate' THEN 0.33 WHEN 'beginner' THEN 0.0
        ELSE NULL
      END AS level,
      ps.skill_level
    FROM public.professional_skills ps
    WHERE ps.service_id = v_service_id OR ps.service_category_id = v_category_id
    ORDER BY ps.professional_id,
      (ps.service_id = v_service_id) DESC NULLS LAST,
      CASE lower(ps.skill_level)
        WHEN 'expert' THEN 4 WHEN 'advanced' THEN 3 WHEN 'intermediate' THEN 2 WHEN 'beginner' THEN 1 ELSE 0
      END DESC
  ),
  areas AS (
    SELECT
      psa.professional_id,
      d.km,
      CASE WHEN d.km IS NOT NULL AND psa.radius_km IS NOT NULL THEN 'distance' ELSE 'city' END AS basis,
      CASE
        WHEN d.km IS NOT NULL AND psa.radius_km IS NOT NULL THEN GREATEST(0, 1 - d.km / psa.radius_km)
        WHEN v_area IS NOT NULL AND lower(psa.area) = lower(v_area) THEN 1.0
        ELSE 0.0
      END AS proximity,
      CASE
        WHEN d.km IS NOT NULL AND psa.radius_km IS NOT NULL THEN d.km <= psa.radius_km
        ELSE lower(psa.city) = lower(v_city)
      END AS qualifies
    FROM public.professional_service_areas psa
    CROSS JOIN LATERAL (SELECT public._haversine_km(v_lat, v_lng, psa.base_lat, psa.base_lng) AS km) d
    WHERE COALESCE(psa.is_active, true)
  ),
  best_area AS (
    SELECT DISTINCT ON (ar.professional_id) ar.professional_id, ar.km, ar.basis, ar.proximity
    FROM areas ar
    WHERE ar.qualifies
    ORDER BY ar.professional_id, ar.proximity DESC, ar.km ASC NULLS LAST
  ),
  load AS (
    SELECT j.professional_id, count(*) AS open_jobs
    FROM public.jobs j
    WHERE j.current_state IN ('assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')
      AND j.booking_id <> p_booking_id
      AND j.professional_id IS NOT NULL
    GROUP BY j.professional_id
  ),
  parts AS (
    SELECT
      c.user_id,
      ba.basis,
      ba.km,
      COALESCE(l.open_jobs, 0) AS open_jobs,
      sk.skill_level,
      c.years_experience,
      m.acceptance_rate,
      m.median_response_seconds,
      m.completion_rate,
      m.cancel_rate,
      m.rating_average,
      m.rating_count,
      ba.proximity AS s_proximity,
      1.0 / (1 + COALESCE(l.open_jobs, 0)) AS s_load,
      sk.specific AS s_specific,
      COALESCE(sk.level, c_prior) AS s_level,
      LEAST(COALESCE(c.years_experience, 0)::numeric / c_exp_cap, 1) AS s_experience,
      COALESCE(m.acceptance_rate, c_prior) AS s_acceptance,
      CASE WHEN m.median_response_seconds IS NULL THEN c_prior
        ELSE GREATEST(0, 1 - m.median_response_seconds / c_window) END AS s_response,
      COALESCE(m.completion_rate, c_prior) AS s_completion,
      CASE WHEN m.cancel_rate IS NULL THEN c_prior ELSE 1 - m.cancel_rate END AS s_reliability,
      CASE WHEN m.rating_count >= c_min_reviews AND m.rating_average IS NOT NULL
        THEN m.rating_average / 5 ELSE 0 END AS s_rating
    FROM candidates c
    JOIN skill sk ON sk.professional_id = c.user_id
    JOIN best_area ba ON ba.professional_id = c.user_id
    LEFT JOIN load l ON l.professional_id = c.user_id
    LEFT JOIN public.professional_metrics m ON m.professional_id = c.user_id
  )
  SELECT
    p.user_id,
    round(
      w_proximity * p.s_proximity + w_load * p.s_load + w_specific * p.s_specific
      + w_level * p.s_level + w_experience * p.s_experience + w_acceptance * p.s_acceptance
      + w_response * p.s_response + w_completion * p.s_completion
      + w_reliability * p.s_reliability + w_rating * p.s_rating,
      4
    ) AS score,
    p.basis,
    round(p.km, 2),
    jsonb_build_object(
      'raw', jsonb_build_object(
        'distance_km', round(p.km, 2),
        'geo_basis', p.basis,
        'open_jobs', p.open_jobs,
        'skill_level', p.skill_level,
        'years_experience', p.years_experience,
        'acceptance_rate', p.acceptance_rate,
        'median_response_seconds', p.median_response_seconds,
        'completion_rate', p.completion_rate,
        'cancel_rate', p.cancel_rate,
        'rating_average', p.rating_average,
        'rating_count', p.rating_count
      ),
      'components', jsonb_build_object(
        'proximity', round(p.s_proximity, 4),
        'load', round(p.s_load, 4),
        'service_specific', p.s_specific,
        'skill_level', p.s_level,
        'experience', round(p.s_experience, 4),
        'acceptance', p.s_acceptance,
        'response', round(p.s_response, 4),
        'completion', p.s_completion,
        'reliability', p.s_reliability,
        'rating', round(p.s_rating, 4)
      ),
      'weights', jsonb_build_object(
        'proximity', w_proximity, 'load', w_load, 'service_specific', w_specific,
        'skill_level', w_level, 'experience', w_experience, 'acceptance', w_acceptance,
        'response', w_response, 'completion', w_completion, 'reliability', w_reliability,
        'rating', w_rating
      ),
      'rating_min_reviews', c_min_reviews
    )
  FROM parts p
  ORDER BY 2 DESC, p.user_id;
END;
$function$;

-- Kept for callers of the old name; returns the top-ranked professional.
CREATE OR REPLACE FUNCTION public._pick_professional(p_booking_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT r.professional_id FROM public._rank_professionals(p_booking_id) r LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public._matching_setting(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._rank_professionals(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._pick_professional(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._rank_professionals(uuid) TO service_role;
