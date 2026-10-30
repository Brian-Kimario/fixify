-- Run against a database with the Feasy seed accounts: supabase db query --linked -f supabase/tests/job_codes_and_no_show.sql
-- Everything happens in one transaction that is rolled back, so nothing persists. Any failed check raises.
BEGIN;

DO $test$
DECLARE
  v_job   uuid := '3049783d-dc71-4297-85c3-5c7fc3801cbb';
  v_cust  uuid := '9b681bca-520d-462a-bd50-521c42f2b098';
  v_other uuid := '70738ef6-019e-4c3c-877f-8e6490d0399e';
  v_pro   uuid := '3e86d907-43e8-4b5f-80a3-fd17da3932bd';
  v_pro2  uuid := '12307078-87f0-4cd2-90b4-e88426a1011b';
  v_booking uuid;
  v_code text; v_real text; v_wrong text; v_res jsonb; v_n int; v_failed boolean;

BEGIN
  SELECT booking_id INTO v_booking FROM jobs WHERE id = v_job;

  -- Fixture: put the job back at 'accepted' with no codes, as the owner of the tables.
  DELETE FROM job_code_attempts WHERE job_id = v_job;
  DELETE FROM job_codes WHERE job_id = v_job;
  DELETE FROM job_exceptions WHERE job_id = v_job;
  UPDATE jobs SET current_state = 'accepted', on_the_way_at = NULL, arrived_at = NULL, started_at = NULL WHERE id = v_job;

  ---------- helpers as local statements: switch identity ----------
  -- (each block below sets claims then role, and resets role afterwards)

  -- 1. Professional leaves: start code is issued.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM transition_job_state(v_job, 'on_the_way', v_pro, '{}');
  RESET ROLE;
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND purpose = 'start' AND status = 'active';
  ASSERT v_n = 1, 'start code issued at on_the_way';

  -- 2. Visibility: customer sees digits; the professional and another customer do not.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_res := get_job_code_state(v_job);
  RESET ROLE;
  v_real := v_res ->> 'code';
  ASSERT v_real ~ '^\d{6}$', 'customer receives a 6-digit code';
  ASSERT (v_res ->> 'purpose') = 'start', 'purpose is start';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_res := get_job_code_state(v_job);
  RESET ROLE;
  ASSERT (v_res ->> 'code') IS NULL, 'professional never receives the digits';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN v_res := get_job_code_state(v_job); IF (v_res ->> 'code') IS NOT NULL THEN RAISE EXCEPTION 'leaked'; END IF;
  EXCEPTION WHEN OTHERS THEN IF SQLERRM = 'leaked' THEN RESET ROLE; RAISE; END IF; v_failed := true; END;
  RESET ROLE;

  -- 3. No-show: only after scheduled_start + 30 minutes (database clock), not once arrived, not twice.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE bookings SET scheduled_start = now() - interval '29 minutes 30 seconds' WHERE id = v_booking;
  RESET ROLE;
  -- bookings are not customer-writable here; adjust as owner instead
  UPDATE bookings SET scheduled_start = now() - interval '29 minutes 30 seconds' WHERE id = v_booking;
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN PERFORM report_professional_no_show(v_job, 'support'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'report at 29m30s is rejected';

  UPDATE bookings SET scheduled_start = now() - interval '31 minutes' WHERE id = v_booking;

  -- wrong party
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_other, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN PERFORM report_professional_no_show(v_job, 'support'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'another customer cannot report';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM report_professional_no_show(v_job, 'reassign');
  v_failed := false;
  BEGIN PERFORM report_professional_no_show(v_job, 'reassign'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'duplicate report is rejected';
  SELECT count(*) INTO v_n FROM job_events WHERE job_id = v_job AND event_type = 'no_show_reported';
  ASSERT v_n = 1, 'report is recorded as a job event';
  SELECT count(*) INTO v_n FROM jobs WHERE id = v_job AND current_state = 'on_the_way' AND professional_id = v_pro;
  ASSERT v_n = 1, 'report changes neither state nor assignment';

  -- 4. Professional arrives; the gate refuses work without a verified start code.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM transition_job_state(v_job, 'arrived', v_pro, '{}');
  v_failed := false;
  BEGIN PERFORM transition_job_state(v_job, 'in_progress', v_pro, '{}'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  ASSERT v_failed, 'cannot start without a verified code';

  -- 5. Wrong attempts lock at 5, atomically recorded (a wrong result does not roll back).
  v_wrong := CASE WHEN v_real = '000000' THEN '000001' ELSE '000000' END;
  FOR i IN 1..4 LOOP
    v_res := verify_job_code(v_job, 'start', v_wrong);
    ASSERT (v_res ->> 'ok')::boolean IS NOT TRUE AND (v_res ->> 'reason') = 'incorrect', 'wrong code is incorrect, attempt ' || i;
  END LOOP;
  v_res := verify_job_code(v_job, 'start', v_wrong);
  ASSERT (v_res ->> 'reason') IN ('locked', 'incorrect'), 'fifth wrong attempt result';
  v_res := verify_job_code(v_job, 'start', v_real);
  ASSERT (v_res ->> 'ok')::boolean IS NOT TRUE AND (v_res ->> 'reason') = 'locked', 'the right code is refused once locked';
  RESET ROLE;
  SELECT count(*) INTO v_n FROM job_code_attempts WHERE job_id = v_job AND NOT succeeded;
  ASSERT v_n = 5, 'five failed attempts recorded, none beyond the lock; got ' || v_n;
  SELECT count(*) INTO v_n FROM job_events WHERE job_id = v_job AND event_type = 'code_locked';
  ASSERT v_n = 1, 'lockout recorded';

  -- 6. Reissue: attempt history is kept; limit of 2 per job.
  UPDATE job_codes SET issued_at = issued_at - interval '1 hour' WHERE job_id = v_job;  -- one transaction shares now(); keep issuance order distinct
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  PERFORM reissue_job_code(v_job);
  RESET ROLE;
  SELECT count(*) INTO v_n FROM job_code_attempts WHERE job_id = v_job AND NOT succeeded;
  ASSERT v_n = 5, 'reissue does not erase failed attempts';
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND purpose = 'start' AND status = 'locked';
  ASSERT v_n = 1, 'the locked code stays locked';

  -- another customer / the professional cannot reissue
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN PERFORM reissue_job_code(v_job); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'professional cannot reissue';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_code := (get_job_code_state(v_job) ->> 'code');
  ASSERT v_code ~ '^\d{6}$', 'new code visible to customer';
  RESET ROLE;
  UPDATE job_codes SET issued_at = issued_at - interval '1 hour' WHERE job_id = v_job;  -- one transaction shares now(); keep issuance order distinct
  SET LOCAL ROLE authenticated;
  PERFORM reissue_job_code(v_job);
  v_failed := false;
  BEGIN PERFORM reissue_job_code(v_job); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  ASSERT v_failed, 'third reissue is refused';
  v_code := (get_job_code_state(v_job) ->> 'code');
  RESET ROLE;

  -- 7. Right code verifies for the assigned pro only; then start is allowed; replay is refused.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro2, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN PERFORM verify_job_code(v_job, 'start', v_code); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'a different professional cannot verify';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_res := verify_job_code(v_job, 'start', v_code);
  ASSERT (v_res ->> 'ok')::boolean, 'correct code verifies';
  v_res := verify_job_code(v_job, 'start', v_code);
  ASSERT (v_res ->> 'ok')::boolean IS NOT TRUE, 'a used code cannot be replayed';
  ASSERT (SELECT current_state FROM jobs WHERE id = v_job) = 'arrived', 'verifying does not move the job';
  PERFORM transition_job_state(v_job, 'in_progress', v_pro, '{}');
  RESET ROLE;
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND purpose = 'finish' AND status = 'active';
  ASSERT v_n = 1, 'finish code issued when work starts';

  -- start code cannot be used for finish
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_failed := false;
  BEGIN PERFORM transition_job_state(v_job, 'completed', v_pro, '{}'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  ASSERT v_failed, 'cannot complete without the finish code';
  v_res := verify_job_code(v_job, 'finish', v_code);
  ASSERT (v_res ->> 'ok')::boolean IS NOT TRUE, 'the start code does not satisfy the finish code';
  RESET ROLE;

  -- 8. Quote cycle: entering quote_pending invalidates the finish code; returning issues a fresh one.
  PERFORM set_config('request.jwt.claims', NULL, true);
  UPDATE job_codes SET issued_at = issued_at - interval '1 hour' WHERE job_id = v_job;  -- one transaction shares now(); keep issuance order distinct
  INSERT INTO quotes (job_id, professional_id, subtotal, taxes_or_fees, discount, total, reason, status)
  VALUES (v_job, v_pro, 100, 0, 0, 100, 'test quote', 'pending_customer');
  PERFORM transition_job_state(v_job, 'quote_pending', v_pro, '{}');   -- no jwt: service-path
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND purpose = 'finish' AND status = 'active';
  ASSERT v_n = 0, 'finish code invalidated on quote_pending';
  UPDATE quotes SET status = 'approved' WHERE job_id = v_job;
  UPDATE job_codes SET issued_at = issued_at - interval '1 hour' WHERE job_id = v_job;
  PERFORM transition_job_state(v_job, 'in_progress', v_cust, '{}');
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND purpose = 'finish' AND status = 'active';
  ASSERT v_n = 1, 'fresh finish code after the quote is approved';

  -- 9. A valid finish code does not complete the job; completion is the professional's explicit step.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_code := (get_job_code_state(v_job) ->> 'code');
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_pro, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  v_res := verify_job_code(v_job, 'finish', v_code);
  ASSERT (v_res ->> 'ok')::boolean, 'finish code verifies';
  ASSERT (SELECT current_state FROM jobs WHERE id = v_job) = 'in_progress', 'verified finish code does not auto-complete';
  PERFORM transition_job_state(v_job, 'completed', v_pro, '{}');
  RESET ROLE;

  RAISE NOTICE 'job_codes_and_no_show: all checks passed';
END
$test$;

-- A customer cannot start the work themselves, and cancelling invalidates the live code.
DO $test$
DECLARE
  v_job  uuid := '3049783d-dc71-4297-85c3-5c7fc3801cbb';
  v_cust uuid := '9b681bca-520d-462a-bd50-521c42f2b098';
  v_failed boolean := false; v_n int;
BEGIN
  UPDATE jobs SET current_state = 'arrived', completed_at = NULL WHERE id = v_job;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_cust, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN PERFORM transition_job_state(v_job, 'in_progress', v_cust, '{}'); EXCEPTION WHEN OTHERS THEN v_failed := true; END;
  RESET ROLE;
  ASSERT v_failed, 'customer cannot start the job';
  DELETE FROM job_codes WHERE job_id = v_job;
  PERFORM _issue_job_code(v_job, 'start', v_cust, false);
  SET LOCAL ROLE authenticated;
  PERFORM transition_job_state(v_job, 'cancelled', v_cust, '{}');
  RESET ROLE;
  SELECT count(*) INTO v_n FROM job_codes WHERE job_id = v_job AND status = 'active';
  ASSERT v_n = 0, 'no code stays active after cancellation';
END
$test$;

ROLLBACK;
