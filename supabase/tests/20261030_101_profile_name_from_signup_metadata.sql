-- Run: supabase db query --linked -f supabase/tests/20261030_101_profile_name_from_signup_metadata.sql
-- Creates throwaway auth users inside a transaction that is rolled back. One row per check.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _users ON COMMIT DROP AS
  SELECT gen_random_uuid() AS id, v.key, v.meta
  FROM (VALUES
    ('full_name',    '{"full_name": "Asha Rao"}'::jsonb),
    ('display_name', '{"display_name": "Vikram Iyer"}'::jsonb),
    ('name',         '{"name": "Meera Das", "role": "professional"}'::jsonb),
    ('blank',        '{"full_name": "   "}'::jsonb),
    ('none',         '{}'::jsonb)
  ) v(key, meta);

INSERT INTO auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
SELECT id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       key || '-' || id::text || '@example.invalid', meta, now(), now()
FROM _users;

INSERT INTO _results SELECT 'trigger: full_name is used',
  (SELECT full_name FROM public.profiles WHERE id = (SELECT id FROM _users WHERE key = 'full_name')) = 'Asha Rao';
INSERT INTO _results SELECT 'trigger: display_name is used when full_name is missing',
  (SELECT full_name FROM public.profiles WHERE id = (SELECT id FROM _users WHERE key = 'display_name')) = 'Vikram Iyer';
INSERT INTO _results SELECT 'trigger: name is used, role still honoured',
  (SELECT full_name = 'Meera Das' AND role = 'professional' FROM public.profiles
   WHERE id = (SELECT id FROM _users WHERE key = 'name'));
INSERT INTO _results SELECT 'trigger: a blank name is stored as null',
  (SELECT full_name IS NULL FROM public.profiles WHERE id = (SELECT id FROM _users WHERE key = 'blank'));
INSERT INTO _results SELECT 'trigger: no name metadata gives a null name',
  (SELECT full_name IS NULL FROM public.profiles WHERE id = (SELECT id FROM _users WHERE key = 'none'));

INSERT INTO _results SELECT 'backfill: no profile is left nameless when its auth metadata has a name',
  NOT EXISTS (
    SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id = p.id
    WHERE NULLIF(btrim(p.full_name), '') IS NULL
      AND NULLIF(btrim(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name',
                                u.raw_user_meta_data->>'display_name')), '') IS NOT NULL
  );

SELECT check_name, pass FROM _results ORDER BY pass, check_name;
ROLLBACK;
