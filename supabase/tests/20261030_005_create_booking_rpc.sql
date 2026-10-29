-- Run: supabase db query --linked -f supabase/tests/20261030_005_create_booking_rpc.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Uses an existing customer with a property, one active service
-- per pricing model, and a property owned by someone else.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT
    p.owner_customer_id AS customer_id,
    p.id AS property_id,
    (SELECT o.id FROM public.properties o
     WHERE o.owner_customer_id <> p.owner_customer_id ORDER BY o.id LIMIT 1) AS other_property_id,
    (SELECT s.id FROM public.services s
     WHERE s.is_active AND s.pricing_model = 'fixed' ORDER BY s.id LIMIT 1) AS fixed_service,
    (SELECT s.id FROM public.services s
     WHERE s.is_active AND s.pricing_model = 'inspection' ORDER BY s.id LIMIT 1) AS inspection_service,
    (SELECT s.id FROM public.services s
     WHERE s.is_active AND s.pricing_model = 'quote_after_inspection' ORDER BY s.id LIMIT 1) AS quote_service,
    (SELECT s.id FROM public.services s WHERE NOT s.is_active ORDER BY s.id LIMIT 1) AS inactive_service
  FROM public.properties p
  JOIN public.profiles pr ON pr.id = p.owner_customer_id AND pr.role = 'customer'::user_role
  ORDER BY p.id LIMIT 1;
CREATE TEMP TABLE _created (booking_id uuid, booking_reference text, kind text) ON COMMIT DROP;
GRANT SELECT ON _fixture TO authenticated, anon;
GRANT ALL ON _results, _created TO authenticated, anon;

INSERT INTO _results SELECT 'fixture: customer, properties and services exist',
  count(*) = 1 AND bool_and(other_property_id IS NOT NULL AND fixed_service IS NOT NULL
    AND inspection_service IS NOT NULL AND quote_service IS NOT NULL)
FROM _fixture;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;

-- 1. A direct insert from the customer's client is refused, even with their own id.
DO $$
BEGIN
  INSERT INTO public.bookings (customer_id, property_id, service_id, scheduled_start,
    pricing_model, quoted_or_base_amount, booking_status)
  SELECT customer_id, property_id, fixed_service, now() + interval '2 days', 'fixed', 1, 'pending'
  FROM _fixture;
  INSERT INTO _results VALUES ('direct insert refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('direct insert refused', true);
END $$;

-- 2. One booking per pricing model through the RPC.
INSERT INTO _created
SELECT b.booking_id, b.booking_reference, 'fixed'
FROM _fixture f, public.create_booking(f.fixed_service, f.property_id, now() + interval '2 days') b;
INSERT INTO _created
SELECT b.booking_id, b.booking_reference, 'inspection'
FROM _fixture f, public.create_booking(f.inspection_service, f.property_id, now() + interval '2 days') b;
INSERT INTO _created
SELECT b.booking_id, b.booking_reference, 'quote_after_inspection'
FROM _fixture f, public.create_booking(f.quote_service, f.property_id, now() + interval '2 days') b;

-- 3. Another customer's property, a past date and an inactive or unknown service are refused.
DO $$
BEGIN
  PERFORM public.create_booking(fixed_service, other_property_id, now() + interval '2 days') FROM _fixture;
  INSERT INTO _results VALUES ('other customer''s property refused', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other customer''s property refused', true);
END $$;

DO $$
BEGIN
  PERFORM public.create_booking(fixed_service, property_id, now() - interval '1 hour') FROM _fixture;
  INSERT INTO _results VALUES ('past date refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('past date refused', true);
END $$;

DO $$
BEGIN
  PERFORM public.create_booking(COALESCE(inactive_service, gen_random_uuid()), property_id,
    now() + interval '2 days') FROM _fixture;
  INSERT INTO _results VALUES ('inactive or unknown service refused', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('inactive or unknown service refused', true);
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

-- 4. Amounts come from the service row; status, owner and professional are fixed.
INSERT INTO _results SELECT 'three bookings created with references',
  count(*) = 3 AND bool_and(booking_reference IS NOT NULL) FROM _created;

INSERT INTO _results SELECT 'fixed booking charges base_price',
  b.quoted_or_base_amount = s.base_price AND b.pricing_model = 'fixed'
FROM _created c JOIN public.bookings b ON b.id = c.booking_id JOIN public.services s ON s.id = b.service_id
WHERE c.kind = 'fixed';

INSERT INTO _results SELECT 'inspection booking charges inspection_fee',
  b.quoted_or_base_amount = s.inspection_fee AND b.pricing_model = 'inspection'
FROM _created c JOIN public.bookings b ON b.id = c.booking_id JOIN public.services s ON s.id = b.service_id
WHERE c.kind = 'inspection';

INSERT INTO _results SELECT 'quote_after_inspection booking has no amount yet',
  b.quoted_or_base_amount IS NULL AND b.pricing_model = 'quote_after_inspection'
FROM _created c JOIN public.bookings b ON b.id = c.booking_id
WHERE c.kind = 'quote_after_inspection';

INSERT INTO _results SELECT 'bookings are pending, unassigned and owned by the caller',
  bool_and(b.booking_status = 'pending' AND b.professional_id IS NULL AND b.customer_id = f.customer_id)
FROM _created c JOIN public.bookings b ON b.id = c.booking_id CROSS JOIN _fixture f;

-- 5. Anonymous callers cannot execute it.
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.create_booking(fixed_service, property_id, now() + interval '2 days') FROM _fixture;
  INSERT INTO _results VALUES ('anon cannot execute', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('anon cannot execute', true);
END $$;
RESET ROLE;

SELECT check_name, pass FROM _results;
ROLLBACK;
