-- Run: supabase db query --linked -f supabase/tests/20261030_014_job_media_and_eta.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Fixture states are set directly so each guard can be reached.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT o.user_id FROM public.professional_profiles o
     WHERE o.user_id <> j.professional_id ORDER BY o.user_id LIMIT 1) AS other_pro,
    (SELECT k.id FROM public.jobs k WHERE k.id <> j.id ORDER BY k.id LIMIT 1) AS other_job,
    gen_random_uuid() AS file_id
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated, anon;

INSERT INTO _results SELECT 'fixture: a job, another professional and another job exist',
  count(*) = 1 AND bool_and(other_pro IS NOT NULL AND other_job IS NOT NULL) FROM _fixture;

UPDATE public.jobs SET current_state = 'accepted', eta_earliest = NULL, eta_latest = NULL
WHERE id = (SELECT job_id FROM _fixture);

-- 1. Arrival window --------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.report_job_eta(job_id, 0, 15, true) FROM _fixture;
  INSERT INTO _results VALUES ('eta: another professional is refused', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('eta: another professional is refused', true);
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.report_job_eta(job_id, 0, 15, false) FROM _fixture;
  INSERT INTO _results VALUES ('eta: a plain window needs the job on the way', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('eta: a plain window needs the job on the way', true);
END $$;
DO $$
BEGIN
  PERFORM public.report_job_eta(job_id, 30, 15, true) FROM _fixture;
  INSERT INTO _results VALUES ('eta: a backwards window is refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('eta: a backwards window is refused', true);
END $$;
DO $$
BEGIN
  PERFORM public.report_job_eta(job_id, 60, 600, true) FROM _fixture;
  INSERT INTO _results VALUES ('eta: a window past 8 hours is refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('eta: a window past 8 hours is refused', true);
END $$;
SELECT public.report_job_eta(job_id, 15, 30, true) FROM _fixture;
RESET ROLE;

INSERT INTO _results SELECT 'eta: running late before setting off stores the window',
  j.eta_earliest = now() + interval '15 minutes' AND j.eta_latest = now() + interval '30 minutes'
FROM public.jobs j JOIN _fixture f ON f.job_id = j.id;
INSERT INTO _results SELECT 'eta: running late is recorded on the timeline',
  EXISTS (SELECT 1 FROM public.job_events e JOIN _fixture f ON f.job_id = e.job_id
          WHERE e.event_type = 'running_late' AND e.actor_user_id = f.professional_id);

UPDATE public.jobs SET current_state = 'on_the_way' WHERE id = (SELECT job_id FROM _fixture);
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
SELECT public.report_job_eta(job_id, 0, 15, false) FROM _fixture;
RESET ROLE;
INSERT INTO _results SELECT 'eta: sharing a window on the way records eta_shared',
  EXISTS (SELECT 1 FROM public.job_events e JOIN _fixture f ON f.job_id = e.job_id WHERE e.event_type = 'eta_shared');

-- 2. Media upload policy and add_job_media -----------------------------------------------------
-- Before arrival nobody can upload into the job's folder.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner_id)
  SELECT 'job-media', job_id::text || '/early.jpg', professional_id::text FROM _fixture;
  INSERT INTO _results VALUES ('storage: no upload before arrival', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('storage: no upload before arrival', true);
END $$;
RESET ROLE;

UPDATE public.jobs SET current_state = 'in_progress' WHERE id = (SELECT job_id FROM _fixture);

SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  INSERT INTO storage.objects (bucket_id, name, owner_id)
  SELECT 'job-media', job_id::text || '/intruder.jpg', other_pro::text FROM _fixture;
  INSERT INTO _results VALUES ('storage: another professional cannot upload', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('storage: another professional cannot upload', true);
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO storage.objects (bucket_id, name, owner_id)
SELECT 'job-media', job_id::text || '/' || file_id::text || '.jpg', professional_id::text FROM _fixture;
INSERT INTO _results VALUES ('storage: the job''s professional can upload on site', true);

DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'selfie', job_id::text || '/' || file_id::text || '.jpg') FROM _fixture;
  INSERT INTO _results VALUES ('media: unknown kind refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('media: unknown kind refused', true);
END $$;
DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'after', job_id::text || '/missing.jpg') FROM _fixture;
  INSERT INTO _results VALUES ('media: a file that was never uploaded is refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('media: a file that was never uploaded is refused', true);
END $$;
DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'after', other_job::text || '/' || file_id::text || '.jpg') FROM _fixture;
  INSERT INTO _results VALUES ('media: a path outside the job folder is refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('media: a path outside the job folder is refused', true);
END $$;
SELECT public.add_job_media(job_id, 'after', job_id::text || '/' || file_id::text || '.jpg') FROM _fixture;
DO $$
BEGIN
  PERFORM public.add_job_media(job_id, 'after', job_id::text || '/' || file_id::text || '.jpg') FROM _fixture;
  INSERT INTO _results VALUES ('media: the same file cannot be attached twice', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('media: the same file cannot be attached twice', true);
END $$;
RESET ROLE;

INSERT INTO _results SELECT 'media: attaching records media_added',
  EXISTS (SELECT 1 FROM public.job_events e JOIN _fixture f ON f.job_id = e.job_id
          WHERE e.event_type = 'media_added' AND e.metadata->>'kind' = 'after');

-- 3. Who can read -------------------------------------------------------------------------------
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'read: the customer sees the row', count(*) = 1
  FROM public.job_media m JOIN _fixture f ON f.job_id = m.job_id;
INSERT INTO _results SELECT 'read: the customer can read the object', count(*) = 1
  FROM storage.objects o JOIN _fixture f ON o.name = f.job_id::text || '/' || f.file_id::text || '.jpg'
  WHERE o.bucket_id = 'job-media';
DO $$
BEGIN
  INSERT INTO public.job_media (job_id, uploader_id, kind, storage_path)
  SELECT job_id, customer_id, 'after', job_id::text || '/forged.jpg' FROM _fixture;
  INSERT INTO _results VALUES ('write: direct inserts are refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('write: direct inserts are refused', true);
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true) FROM _fixture;
SET LOCAL ROLE authenticated;
INSERT INTO _results SELECT 'read: another professional sees no row', count(*) = 0
  FROM public.job_media m JOIN _fixture f ON f.job_id = m.job_id;
INSERT INTO _results SELECT 'read: another professional cannot read the object', count(*) = 0
  FROM storage.objects o JOIN _fixture f ON o.name = f.job_id::text || '/' || f.file_id::text || '.jpg'
  WHERE o.bucket_id = 'job-media';
RESET ROLE;

SELECT check_name, pass FROM _results ORDER BY pass, check_name;
ROLLBACK;
