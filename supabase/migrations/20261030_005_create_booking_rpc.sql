-- 20261030_005_create_booking_rpc
--
-- Customers create bookings only through create_booking(). The old INSERT policy checked
-- customer_id alone, so a customer could insert a booking from the browser with any
-- quoted_or_base_amount, professional_id or booking_status, and checkout charges
-- quoted_or_base_amount when there is no approved quote.
--
-- The function takes the caller from auth.uid(), checks the property belongs to them and the
-- service is active, and sets the amount from the service row, matching what
-- createBookingAction did before:
--   fixed                  -> services.base_price
--   inspection             -> services.inspection_fee
--   quote_after_inspection -> NULL (the approved quote sets the amount later)

DROP POLICY IF EXISTS bookings_insert_customer ON public.bookings;

CREATE OR REPLACE FUNCTION public.create_booking(
  p_service_id      uuid,
  p_property_id     uuid,
  p_scheduled_start timestamptz
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
     quoted_or_base_amount, booking_status)
  VALUES
    (v_customer, p_property_id, v_service.id, p_scheduled_start, v_service.pricing_model,
     v_amount, 'pending')
  RETURNING b.id, b.booking_reference;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, uuid, timestamptz) TO authenticated, service_role;
