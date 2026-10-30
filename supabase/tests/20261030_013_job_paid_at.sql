-- Run: supabase db query --linked -f supabase/tests/20261030_013_job_paid_at.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Uses the first completed job and marks a payment paid inside
-- the transaction.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.booking_id, j.professional_id,
    (SELECT o.user_id FROM public.professional_profiles o
     WHERE o.user_id <> j.professional_id ORDER BY o.user_id LIMIT 1) AS other_pro
  FROM public.jobs j
  WHERE j.current_state = 'completed' AND j.professional_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.payments p WHERE p.job_id = j.id AND p.status = 'paid')
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated, anon;

INSERT INTO _results SELECT 'fixture: an unpaid completed job and another professional exist',
  count(*) = 1 AND bool_and(other_pro IS NOT NULL) FROM _fixture;

-- 1. Unpaid: both parties get null.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'unpaid job returns null', public.job_paid_at(job_id) IS NULL FROM _fixture;
RESET ROLE;

INSERT INTO public.payments (customer_id, booking_id, job_id, payment_type, amount, provider, provider_reference, status, paid_at)
SELECT customer_id, booking_id, job_id, 'service', 1, 'razorpay', 'order_test_013', 'paid', now() FROM _fixture;

-- 2. Paid: professional and customer both see the time.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'professional sees paid time', public.job_paid_at(job_id) = now() FROM _fixture;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'customer sees paid time', public.job_paid_at(job_id) = now() FROM _fixture;
RESET ROLE;

-- 3. Anyone else is refused.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.job_paid_at(job_id) FROM _fixture;
  INSERT INTO _results VALUES ('other professional refused', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other professional refused', true);
END $$;
RESET ROLE;

SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.job_paid_at(gen_random_uuid());
  INSERT INTO _results VALUES ('anon cannot execute', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('anon cannot execute', true);
END $$;
RESET ROLE;

SELECT check_name, pass FROM _results;
ROLLBACK;
