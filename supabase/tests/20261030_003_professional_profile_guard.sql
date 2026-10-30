-- Run: supabase db query --linked -f supabase/tests/20261030_003_professional_profile_guard.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
GRANT ALL ON _results TO authenticated;

-- Act as the first verified professional.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', user_id::text, 'role', 'authenticated')::text, true)
FROM public.professional_profiles WHERE verification_status = 'verified' ORDER BY user_id LIMIT 1;
SET LOCAL ROLE authenticated;

-- 1. A professional cannot change their own verification status.
DO $$
BEGIN
  UPDATE public.professional_profiles SET verification_status = 'rejected' WHERE user_id = auth.uid();
  INSERT INTO _results VALUES ('pro cannot change verification_status', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('pro cannot change verification_status', true);
END $$;

-- 2. A professional can still change unprotected columns.
DO $$
DECLARE n int;
BEGIN
  UPDATE public.professional_profiles SET is_available = NOT COALESCE(is_available, false) WHERE user_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO _results VALUES ('pro can toggle is_available', n = 1);
END $$;

-- 3. A professional can no longer update jobs or bookings directly.
DO $$
DECLARE n int;
BEGIN
  UPDATE public.jobs SET current_state = 'closed' WHERE professional_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO _results VALUES ('pro cannot update jobs', n = 0);
  UPDATE public.bookings SET quoted_or_base_amount = 1 WHERE professional_id = auth.uid();
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO _results VALUES ('pro cannot update bookings', n = 0);
END $$;

-- 4. The booking reference sequence is usable by authenticated.
INSERT INTO _results SELECT 'authenticated can use booking_reference_seq',
  has_sequence_privilege('public.booking_reference_seq', 'USAGE');

RESET ROLE;
SELECT check_name, pass FROM _results;
ROLLBACK;
