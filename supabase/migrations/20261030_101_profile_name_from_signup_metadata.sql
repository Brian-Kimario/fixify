-- Profiles created at sign-up only read raw_user_meta_data->>'full_name', but some sign-up
-- paths (and the seeded test accounts) store the name as 'name' or 'display_name'. Those
-- customers got a profile with no name, so the assigned professional's job page showed
-- "No name on file" even though the name was known.
--
-- 1. handle_new_user falls back to 'name' and 'display_name'. Role handling and the
--    ON CONFLICT behaviour are unchanged.
-- 2. Existing profiles with no name are backfilled from the same metadata. Profiles that
--    already have a name are never touched.

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text := NEW.raw_user_meta_data->>'role';
  assigned_role  public.user_role := CASE WHEN requested_role = 'professional' THEN 'professional'::public.user_role ELSE 'customer'::public.user_role END;
  signup_name    text := NULLIF(btrim(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name'
  )), '');
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (NEW.id, left(signup_name, 100), assigned_role, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email
    WHERE public.profiles.email IS NULL;
  RETURN NEW;
END;
$function$;

UPDATE public.profiles p
SET full_name = left(m.signup_name, 100), updated_at = now()
FROM (
  SELECT u.id, NULLIF(btrim(COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'display_name'
  )), '') AS signup_name
  FROM auth.users u
) m
WHERE m.id = p.id
  AND NULLIF(btrim(p.full_name), '') IS NULL
  AND m.signup_name IS NOT NULL;
