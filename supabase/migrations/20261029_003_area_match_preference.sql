-- Matching: city is required, neighbourhood is a ranking preference.
--
-- Areas are free text on both sides ("Residency Road" vs "Bangalore Central"),
-- so requiring an exact area match left most bookings unmatched. A pro who
-- serves the customer's city is now eligible; one who also lists the exact
-- area is ranked first.

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
    AND EXISTS (
      SELECT 1 FROM public.professional_skills ps
      WHERE ps.professional_id = pp.user_id
        AND (ps.service_id = v_service_id OR ps.service_category_id = v_category_id)
    )
    AND EXISTS (
      SELECT 1 FROM public.professional_service_areas psa
      WHERE psa.professional_id = pp.user_id
        AND COALESCE(psa.is_active, true)
        AND lower(psa.city) = lower(v_city)
    )
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
  ORDER BY
    EXISTS (
      SELECT 1 FROM public.professional_service_areas psa
      WHERE psa.professional_id = pp.user_id
        AND COALESCE(psa.is_active, true)
        AND lower(psa.city) = lower(v_city)
        AND v_area IS NOT NULL
        AND lower(psa.area) = lower(v_area)
    ) DESC,
    (SELECT count(*) FROM public.jobs aj
      WHERE aj.professional_id = pp.user_id
        AND aj.current_state IN ('assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending')) ASC,
    pp.rating_average DESC NULLS LAST,
    pp.user_id
  LIMIT 1;

  RETURN v_pro;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
