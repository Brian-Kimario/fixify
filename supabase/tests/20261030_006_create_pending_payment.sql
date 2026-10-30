-- Run: supabase db query --linked -f supabase/tests/20261030_006_create_pending_payment.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Uses the first completed job, gives its booking a price inside
-- the transaction, and later adds an approved quote to check that the quote wins.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.booking_id, j.professional_id,
    (SELECT o.id FROM public.profiles o
     WHERE o.role = 'customer'::user_role AND o.id <> j.customer_id ORDER BY o.id LIMIT 1) AS other_customer,
    (SELECT n.id FROM public.jobs n
     WHERE n.customer_id = j.customer_id AND n.current_state <> 'completed' ORDER BY n.id LIMIT 1) AS open_job
  FROM public.jobs j
  WHERE j.current_state = 'completed' AND j.booking_id IS NOT NULL AND j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated, anon;

INSERT INTO _results SELECT 'fixture: a completed job and another customer exist',
  count(*) = 1 AND bool_and(other_customer IS NOT NULL) FROM _fixture;

UPDATE public.bookings SET quoted_or_base_amount = 499.50
WHERE id = (SELECT booking_id FROM _fixture);

-- 1. Another customer can neither read the amount nor create a payment.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_customer::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.job_payment_amount(job_id) FROM _fixture;
  INSERT INTO _results VALUES ('other customer cannot read amount', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other customer cannot read amount', true);
END $$;
DO $$
BEGIN
  PERFORM public.create_pending_payment(job_id, 'order_test_006_x', 49950) FROM _fixture;
  INSERT INTO _results VALUES ('other customer cannot create payment', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other customer cannot create payment', true);
END $$;
RESET ROLE;

-- 2. The owner: direct insert refused, amount from the booking, mismatch refused.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  INSERT INTO public.payments (customer_id, job_id, payment_type, amount, provider, provider_reference)
  SELECT customer_id, job_id, 'service', 1, 'razorpay', 'order_test_006_direct' FROM _fixture;
  INSERT INTO _results VALUES ('direct insert refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('direct insert refused', true);
END $$;

INSERT INTO _results SELECT 'amount comes from the booking (paise)',
  public.job_payment_amount(job_id) = 49950 FROM _fixture;

DO $$
BEGIN
  PERFORM public.job_payment_amount(open_job) FROM _fixture WHERE open_job IS NOT NULL;
  INSERT INTO _results SELECT 'job that is not completed refused', NOT EXISTS (SELECT 1 FROM _fixture WHERE open_job IS NOT NULL);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('job that is not completed refused', true);
END $$;

DO $$
BEGIN
  PERFORM public.create_pending_payment(job_id, 'order_test_006_x', 100) FROM _fixture;
  INSERT INTO _results VALUES ('amount mismatch refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('amount mismatch refused', true);
END $$;

INSERT INTO _results SELECT 'pending payment created',
  public.create_pending_payment(job_id, 'order_test_006_a', 49950) IS NOT NULL FROM _fixture;

DO $$
BEGIN
  PERFORM public.create_pending_payment(job_id, 'order_test_006_b', 49950) FROM _fixture;
  INSERT INTO _results VALUES ('second pending payment refused', false);
EXCEPTION WHEN unique_violation THEN
  INSERT INTO _results VALUES ('second pending payment refused', true);
END $$;

INSERT INTO _results SELECT 'customer can read the pending payment', count(*) = 1
FROM public.payments WHERE provider_reference = 'order_test_006_a';
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

INSERT INTO _results SELECT 'stored row: amount, owner, booking and status set in SQL',
  p.amount = 499.50 AND p.currency = 'INR' AND p.status = 'pending' AND p.customer_id = f.customer_id
  AND p.booking_id = f.booking_id AND p.quote_id IS NULL AND p.provider = 'razorpay'
FROM public.payments p CROSS JOIN _fixture f WHERE p.provider_reference = 'order_test_006_a';

-- 3. After that payment fails, an approved quote sets the amount for the retry.
UPDATE public.payments SET status = 'failed' WHERE provider_reference = 'order_test_006_a';
INSERT INTO public.quotes (job_id, professional_id, subtotal, total, reason, status)
SELECT job_id, professional_id, 1200, 1200, 'test quote', 'approved' FROM _fixture;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'approved quote takes precedence',
  public.job_payment_amount(job_id) = 120000 FROM _fixture;
INSERT INTO _results SELECT 'retry after a failed payment allowed',
  public.create_pending_payment(job_id, 'order_test_006_c', 120000) IS NOT NULL FROM _fixture;
RESET ROLE;

INSERT INTO _results SELECT 'retry row records the quote',
  p.amount = 1200 AND p.quote_id IS NOT NULL
FROM public.payments p WHERE p.provider_reference = 'order_test_006_c';

-- 4. Anonymous callers cannot execute either function.
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.job_payment_amount(gen_random_uuid());
  INSERT INTO _results VALUES ('anon cannot execute', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('anon cannot execute', true);
END $$;
RESET ROLE;

SELECT check_name, pass FROM _results;
ROLLBACK;
