-- Professional sign-ups were silently created as customers because the signup
-- trigger hard-coded role = 'customer'. Honour the requested role, but only for
-- the two self-service roles. admin/support can never be chosen at signup, and
-- professionals stay unverified (professional_profiles.verification_status =
-- 'pending') until an admin approves them; transition_job_state already blocks
-- unverified professionals from accepting work.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
  assigned_role  text := CASE WHEN requested_role = 'professional' THEN 'professional' ELSE 'customer' END;
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', assigned_role, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE public.profiles.email IS NULL;
  RETURN NEW;
END;
$$;
