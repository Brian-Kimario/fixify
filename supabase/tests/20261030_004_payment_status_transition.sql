-- Run: supabase db query --linked -f supabase/tests/20261030_004_payment_status_transition.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Uses the first completed job and gives it a pending payment.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, 'order_test_004'::text AS ref
  FROM public.jobs j WHERE j.current_state = 'completed' ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated;

INSERT INTO _results SELECT 'fixture: a completed job exists', count(*) = 1 FROM _fixture;

INSERT INTO public.payments (customer_id, job_id, payment_type, amount, provider, provider_reference)
SELECT customer_id, job_id, 'service', 499.50, 'razorpay', ref FROM _fixture;

-- 1. A signed-in customer cannot call the RPC.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.transition_payment_status('order_test_004', 'paid', 'payment.captured',
    'pay_test', 49950, 'INR', '{}'::jsonb);
  INSERT INTO _results VALUES ('customer cannot execute', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('customer cannot execute', true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

-- 2. A wrong amount is rejected and changes nothing.
DO $$
BEGIN
  PERFORM public.transition_payment_status('order_test_004', 'paid', 'payment.captured',
    'pay_test', 100, 'INR', '{}'::jsonb);
  INSERT INTO _results VALUES ('amount mismatch rejected', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('amount mismatch rejected', true);
END $$;

-- 3. An unknown reference raises no_data_found.
DO $$
BEGIN
  PERFORM public.transition_payment_status('order_missing', 'paid', 'payment.captured',
    'pay_test', 49950, 'INR', '{}'::jsonb);
  INSERT INTO _results VALUES ('unknown reference rejected', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('unknown reference rejected', true);
END $$;

-- 4. The same captured event delivered twice: applied once, then a no-op.
INSERT INTO _results SELECT 'first capture applied',
  public.transition_payment_status('order_test_004', 'paid', 'payment.captured',
    'pay_test', 49950, 'INR', '{"rrn":"123"}'::jsonb) = 'applied';
INSERT INTO _results SELECT 'replayed capture is a no-op',
  public.transition_payment_status('order_test_004', 'paid', 'payment.captured',
    'pay_test', 49950, 'INR', '{"rrn":"123"}'::jsonb) = 'already_processed';

-- 5. A late failure after capture changes nothing.
INSERT INTO _results SELECT 'failure after capture ignored',
  public.transition_payment_status('order_test_004', 'failed', 'payment.failed',
    'pay_other', NULL, NULL, '{}'::jsonb) = 'already_processed';

INSERT INTO _results SELECT 'payment is paid with paid_at',
  status = 'paid' AND paid_at IS NOT NULL
FROM public.payments WHERE provider_reference = 'order_test_004';

INSERT INTO _results SELECT 'exactly one payment event', count(*) = 1
FROM public.payment_events e JOIN public.payments p ON p.id = e.payment_id
WHERE p.provider_reference = 'order_test_004';

INSERT INTO _results SELECT 'job closed in the same transaction', j.current_state = 'closed'
FROM public.jobs j JOIN _fixture f ON f.job_id = j.id;

INSERT INTO _results SELECT 'one closing job event', count(*) = 1
FROM public.job_events e JOIN _fixture f ON f.job_id = e.job_id
WHERE e.to_state = 'closed' AND e.event_type = 'payment_captured';

-- 6. The customer can read their payment event; status is constrained.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'customer can read own payment event', count(*) = 1
FROM public.payment_events;
RESET ROLE;

DO $$
BEGIN
  UPDATE public.payments SET status = 'processing' WHERE provider_reference = 'order_test_004';
  INSERT INTO _results VALUES ('payments.status check constraint', false);
EXCEPTION WHEN check_violation THEN
  INSERT INTO _results VALUES ('payments.status check constraint', true);
END $$;

SELECT check_name, pass FROM _results;
ROLLBACK;
