-- Run: supabase db query --linked -f supabase/tests/20261030_015_job_media_cleanup.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. storage.allow_delete_query is set for this transaction only, so
-- the DELETE policy can be exercised the way the Storage API does it.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT o.user_id FROM public.professional_profiles o
     WHERE o.user_id <> j.professional_id ORDER BY o.user_id LIMIT 1) AS other_pro,
    j.id::text || '/' || gen_random_uuid()::text || '.jpg' AS loose_path,
    j.id::text || '/' || gen_random_uuid()::text || '.jpg' AS kept_path,
    j.id::text || '/' || gen_random_uuid()::text || '.png' AS wrong_type_path
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated, service_role;
GRANT ALL ON _results TO authenticated, anon, service_role;

INSERT INTO _results SELECT 'fixture: a job and another professional exist',
  count(*) = 1 AND bool_and(other_pro IS NOT NULL) FROM _fixture;

UPDATE public.jobs SET current_state = 'in_progress' WHERE id = (SELECT job_id FROM _fixture);
SELECT set_config('storage.allow_delete_query', 'true', true);

-- The professional uploads three files and attaches one.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
SELECT 'job-media', p, professional_id::text, '{"mimetype": "image/jpeg"}'::jsonb
FROM _fixture, LATERAL (VALUES (loose_path), (kept_path), (wrong_type_path)) v(p);
SELECT public.add_job_media(job_id, 'after', kept_path) FROM _fixture;

-- 1. File type ---------------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'after', wrong_type_path) FROM _fixture;
  INSERT INTO _results VALUES ('media: a JPEG stored under .png is refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('media: a JPEG stored under .png is refused', true);
END $$;
RESET ROLE;

-- 2. Who can discard ---------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
WITH d AS (DELETE FROM storage.objects o USING _fixture f
           WHERE o.bucket_id = 'job-media' AND o.name = f.loose_path RETURNING 1)
INSERT INTO _results SELECT 'discard: the customer cannot delete an upload', count(*) = 0 FROM d;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
WITH d AS (DELETE FROM storage.objects o USING _fixture f
           WHERE o.bucket_id = 'job-media' AND o.name = f.loose_path RETURNING 1)
INSERT INTO _results SELECT 'discard: another professional cannot delete an upload', count(*) = 0 FROM d;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
WITH d AS (DELETE FROM storage.objects o USING _fixture f
           WHERE o.bucket_id = 'job-media' AND o.name = f.kept_path RETURNING 1)
INSERT INTO _results SELECT 'discard: an attached file cannot be deleted', count(*) = 0 FROM d;
WITH d AS (DELETE FROM storage.objects o USING _fixture f
           WHERE o.bucket_id = 'job-media' AND o.name = f.loose_path RETURNING 1)
INSERT INTO _results SELECT 'discard: the uploader can delete an unattached upload', count(*) = 1 FROM d;

-- 3. Orphan listing ----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM public.list_orphan_job_media(interval '0 seconds');
  INSERT INTO _results VALUES ('sweep: signed-in users cannot list orphans', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('sweep: signed-in users cannot list orphans', true);
END $$;
RESET ROLE;

-- Back-date the uploads so they fall outside the window.
UPDATE storage.objects SET created_at = now() - interval '2 days'
WHERE bucket_id = 'job-media' AND name IN (SELECT kept_path FROM _fixture UNION SELECT wrong_type_path FROM _fixture);
SET LOCAL ROLE service_role;
INSERT INTO _results SELECT 'sweep: an old unattached upload is listed',
  EXISTS (SELECT 1 FROM public.list_orphan_job_media() n JOIN _fixture f ON n = f.wrong_type_path);
INSERT INTO _results SELECT 'sweep: an attached file is never listed',
  NOT EXISTS (SELECT 1 FROM public.list_orphan_job_media(interval '0 seconds') n JOIN _fixture f ON n = f.kept_path);
RESET ROLE;

SELECT check_name, pass FROM _results ORDER BY pass, check_name;
ROLLBACK;
