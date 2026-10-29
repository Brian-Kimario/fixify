-- 1. Professionals could UPDATE any column of their jobs and bookings (current_state,
--    quoted_or_base_amount, customer_id ...) from the browser, bypassing transition_job_state().
--    No app code relies on these policies; state changes go through SECURITY DEFINER RPCs and
--    admin writes use the service role.
DROP POLICY IF EXISTS jobs_update_professional_own ON public.jobs;
DROP POLICY IF EXISTS bookings_update_professional_own ON public.bookings;

-- 2. professional_profiles insert/update policies have no column guard, so a professional could
--    mark themselves verified or set their own rating. Only admins, the service role and
--    database-internal calls (no auth.uid()) may set the protected columns.
CREATE OR REPLACE FUNCTION public.guard_professional_profile_protected_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_privileged boolean;
BEGIN
  v_privileged :=
    COALESCE(auth.jwt() ->> 'role', '') = 'service_role'
    OR auth.uid() IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles AS actor
      WHERE actor.id = auth.uid() AND actor.role = 'admin'::public.user_role
    );

  IF v_privileged THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Self-registration always starts unverified with no history.
    NEW.verification_status := 'pending';
    NEW.rating_average := 0;
    NEW.completed_jobs_count := 0;
    RETURN NEW;
  END IF;

  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.rating_average IS DISTINCT FROM OLD.rating_average
     OR NEW.completed_jobs_count IS DISTINCT FROM OLD.completed_jobs_count THEN
    RAISE EXCEPTION 'Only administrators can change verification status, rating or completed job count'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_professional_profile_protected_columns() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS professional_profiles_guard_protected_columns ON public.professional_profiles;
CREATE TRIGGER professional_profiles_guard_protected_columns
  BEFORE INSERT OR UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_professional_profile_protected_columns();
