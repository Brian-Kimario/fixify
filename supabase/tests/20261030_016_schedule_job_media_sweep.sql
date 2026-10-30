-- Run: supabase db query --linked -f supabase/tests/20261030_016_schedule_job_media_sweep.sql
-- Everything runs inside a transaction that is rolled back, including the test Vault secrets and
-- the queued pg_net request, so nothing is sent. Each check returns one row with a pass flag.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.professional_id,
    j.id::text || '/' || gen_random_uuid()::text || '.jpg' AS old_path,
    j.id::text || '/' || gen_random_uuid()::text || '.jpg' AS fresh_path
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated, service_role;
GRANT ALL ON _results TO authenticated, service_role;

INSERT INTO _results SELECT 'fixture: a job with a professional exists', count(*) = 1 FROM _fixture;

-- 1. Schedule ----------------------------------------------------------------------------------
INSERT INTO _results SELECT 'schedule: job-media-sweep runs at 0 */6 * * *',
  EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'job-media-sweep' AND schedule = '0 */6 * * *'
          AND command = 'SELECT public.request_job_media_sweep()' AND active);

-- 2. Who can trigger it ------------------------------------------------------------------------
INSERT INTO _results SELECT 'trigger: anon, authenticated and service_role cannot call it',
  NOT has_function_privilege('anon', 'public.request_job_media_sweep()', 'execute')
  AND NOT has_function_privilege('authenticated', 'public.request_job_media_sweep()', 'execute')
  AND NOT has_function_privilege('service_role', 'public.request_job_media_sweep()', 'execute');

-- 3. Configuration -----------------------------------------------------------------------------
-- Only meaningful before the owner adds the real secrets; afterwards this check is skipped.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name IN ('app_url', 'cron_secret')) THEN
    INSERT INTO _results VALUES ('config: (skipped, Vault secrets already exist)', true);
    RETURN;
  END IF;
  PERFORM public.request_job_media_sweep();
  INSERT INTO _results VALUES ('config: missing Vault secrets fail loudly', false);
EXCEPTION WHEN object_not_in_prerequisite_state THEN
  INSERT INTO _results VALUES ('config: missing Vault secrets fail loudly', true);
END $$;

SELECT vault.create_secret('http://sweep.example.invalid', 'app_url');
SELECT vault.create_secret(encode(gen_random_bytes(32), 'hex'), 'cron_secret');
DO $$
BEGIN
  PERFORM public.request_job_media_sweep();
  INSERT INTO _results VALUES ('config: the secret is never sent over plain http', false);
EXCEPTION WHEN object_not_in_prerequisite_state THEN
  INSERT INTO _results VALUES ('config: the secret is never sent over plain http', true);
END $$;

SELECT vault.update_secret(id, 'https://sweep.example.invalid/') FROM vault.decrypted_secrets WHERE name = 'app_url';
-- Separate statement: the queue row is not visible to the statement that inserts it.
CREATE TEMP TABLE _request ON COMMIT DROP AS SELECT public.request_job_media_sweep() AS id;
INSERT INTO _results SELECT 'config: with both secrets a request is queued to the sweep route',
  EXISTS (SELECT 1 FROM net.http_request_queue q JOIN _request r ON q.id = r.id
          WHERE q.url = 'https://sweep.example.invalid/api/cron/job-media-sweep'
            AND q.method = 'POST'
            AND q.headers->>'Authorization' LIKE 'Bearer %');

-- 4. Attach/sweep race -------------------------------------------------------------------------
UPDATE public.jobs SET current_state = 'in_progress' WHERE id = (SELECT job_id FROM _fixture);
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO storage.objects (bucket_id, name, owner_id, metadata)
SELECT 'job-media', p, professional_id::text, '{"mimetype": "image/jpeg"}'::jsonb
FROM _fixture, LATERAL (VALUES (old_path), (fresh_path)) v(p);
RESET ROLE;

UPDATE storage.objects SET created_at = now() - interval '61 minutes'
WHERE bucket_id = 'job-media' AND name = (SELECT old_path FROM _fixture);

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'after', old_path) FROM _fixture;
  INSERT INTO _results VALUES ('race: an upload over an hour old cannot be attached', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('race: an upload over an hour old cannot be attached',
    SQLERRM = 'This upload has expired. Upload the file again.');
END $$;
INSERT INTO _results SELECT 'race: a fresh upload still attaches',
  public.add_job_media(job_id, 'after', fresh_path) IS NOT NULL FROM _fixture;
RESET ROLE;

-- Past the sweep window, only the unattached upload is listed.
UPDATE storage.objects SET created_at = now() - interval '25 hours'
WHERE bucket_id = 'job-media' AND name IN (SELECT old_path FROM _fixture UNION SELECT fresh_path FROM _fixture);
SET LOCAL ROLE service_role;
INSERT INTO _results SELECT 'race: the sweep lists the expired upload but not the attached one',
  EXISTS (SELECT 1 FROM public.list_orphan_job_media() n JOIN _fixture f ON n = f.old_path)
  AND NOT EXISTS (SELECT 1 FROM public.list_orphan_job_media() n JOIN _fixture f ON n = f.fresh_path);
RESET ROLE;

SELECT check_name, pass FROM _results ORDER BY pass, check_name;
ROLLBACK;
