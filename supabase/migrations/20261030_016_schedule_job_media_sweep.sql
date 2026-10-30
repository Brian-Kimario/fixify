-- Phase 3b: run the job-media sweep every 6 hours, and close the attach/sweep race.
--
-- Unattached uploads are removed by POST /api/cron/job-media-sweep, because rows in
-- storage.objects cannot be deleted with SQL and the stored file must go too. pg_cron already
-- runs the assignment queue (20261030_011); here it calls the sweep route through pg_net.
--  * The app URL and the shared secret are read from Vault at call time, never stored in this
--    file or in cron.job. Until both exist the scheduled run fails with a clear error in
--    cron.job_run_details instead of doing nothing quietly. Add them once per project:
--      SELECT vault.create_secret('https://<deployed app host>', 'app_url');
--      SELECT vault.create_secret('<same value as CRON_SECRET in the app>', 'cron_secret');
--  * The secret is only sent over https.
--  * add_job_media refuses uploads more than an hour old. The sweep only lists uploads more than
--    24 hours old, so a file it is about to remove can no longer be attached.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Asking the app to sweep -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_job_media_sweep()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'app_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_url IS NULL OR v_secret IS NULL OR length(v_secret) = 0 THEN
    RAISE EXCEPTION 'job-media sweep is not configured: add the app_url and cron_secret Vault secrets'
      USING ERRCODE = '55000';
  END IF;
  IF v_url NOT LIKE 'https://%' THEN
    RAISE EXCEPTION 'job-media sweep: app_url must start with https://' USING ERRCODE = '55000';
  END IF;

  RETURN net.http_post(
    url := rtrim(v_url, '/') || '/api/cron/job-media-sweep',
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    timeout_milliseconds := 60000
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.request_job_media_sweep() FROM PUBLIC, anon, authenticated, service_role;

-- 2. The schedule (UTC) ----------------------------------------------------------------------------

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'job-media-sweep';
SELECT cron.schedule('job-media-sweep', '0 */6 * * *', 'SELECT public.request_job_media_sweep()');

-- 3. add_job_media: uploads more than an hour old cannot be attached -------------------------------
-- Same as 20261030_015 apart from the created_at check.

CREATE OR REPLACE FUNCTION public.add_job_media(
  p_job_id uuid,
  p_kind text,
  p_storage_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_mimetype text;
  v_created_at timestamptz;
  v_expected text;
  v_id uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.professional_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_job.current_state NOT IN ('arrived', 'in_progress', 'quote_pending', 'completed') THEN
    RAISE EXCEPTION 'Photos can be added once you arrive and until the job is closed (state: %)',
      v_job.current_state USING ERRCODE = '22023';
  END IF;

  IF p_kind IS NULL OR p_kind NOT IN ('before', 'after', 'part', 'receipt') THEN
    RAISE EXCEPTION 'Unknown photo type' USING ERRCODE = '22023';
  END IF;

  IF p_storage_path IS NULL OR p_storage_path NOT LIKE p_job_id::text || '/%' THEN
    RAISE EXCEPTION 'The uploaded file was not found' USING ERRCODE = '22023';
  END IF;

  SELECT o.metadata->>'mimetype', o.created_at INTO v_mimetype, v_created_at
  FROM storage.objects o
  WHERE o.bucket_id = 'job-media' AND o.name = p_storage_path AND o.owner_id = auth.uid()::text;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The uploaded file was not found' USING ERRCODE = '22023';
  END IF;

  -- Keeps attaching well clear of the 24-hour sweep (list_orphan_job_media).
  IF v_created_at < now() - interval '1 hour' THEN
    RAISE EXCEPTION 'This upload has expired. Upload the file again.' USING ERRCODE = '22023';
  END IF;

  -- Same mapping as JOB_MEDIA_TYPES in src/validators/professional.ts.
  v_expected := CASE lower(substring(p_storage_path FROM '\.([^./]+)$'))
    WHEN 'jpg' THEN 'image/jpeg'
    WHEN 'png' THEN 'image/png'
    WHEN 'webp' THEN 'image/webp'
    WHEN 'pdf' THEN 'application/pdf'
  END;
  IF v_expected IS NULL OR v_mimetype IS DISTINCT FROM v_expected THEN
    RAISE EXCEPTION 'Use a JPG, PNG or WebP photo, or a PDF' USING ERRCODE = '22023';
  END IF;

  -- Abuse guard, not a business rule.
  IF (SELECT count(*) FROM public.job_media WHERE job_id = p_job_id) >= 50 THEN
    RAISE EXCEPTION 'This job already has 50 files' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.job_media (job_id, uploader_id, kind, storage_path)
  VALUES (p_job_id, auth.uid(), p_kind, p_storage_path)
  ON CONFLICT (storage_path) DO NOTHING
  RETURNING id INTO v_id;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'This file is already attached' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_job.current_state, v_job.current_state, auth.uid(), 'media_added',
          jsonb_build_object('media_id', v_id, 'kind', p_kind));

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.add_job_media(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_job_media(uuid, text, text) TO authenticated;
