-- Phase 3b hardening: uploads that never get attached, and file type checks.
--
-- An upload is two steps: the file goes into the job-media bucket, then add_job_media attaches
-- it. If the second step fails, the file is left behind with no job_media row. That missing row
-- is the orphan signal, so no extra tracking column is needed.
--  * The uploader may delete their own file while it is unattached. Attached files are evidence
--    and stay; there is still no policy that deletes them.
--  * list_orphan_job_media() lets a service-role sweep find files that stayed unattached.
--    Rows in storage.objects cannot be deleted with SQL, so the sweep removes them through the
--    Storage API (src/app/api/cron/job-media-sweep).
--  * add_job_media now also checks that the stored content type matches the file extension.

-- 1. Discarding an unattached upload -------------------------------------------------------------

DROP POLICY IF EXISTS job_media_professional_discard ON storage.objects;
CREATE POLICY job_media_professional_discard ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'job-media'
    AND owner_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.professional_id = auth.uid()
    )
    AND NOT EXISTS (SELECT 1 FROM public.job_media m WHERE m.storage_path = name)
  );

-- 2. Finding uploads that were never attached ------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_orphan_job_media(p_older_than interval DEFAULT interval '24 hours')
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'job-media'
    AND o.created_at < now() - p_older_than
    AND NOT EXISTS (SELECT 1 FROM public.job_media m WHERE m.storage_path = o.name)
  ORDER BY o.created_at
  LIMIT 1000;
$function$;

REVOKE ALL ON FUNCTION public.list_orphan_job_media(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_orphan_job_media(interval) TO service_role;

-- 3. add_job_media: the content type must match the extension --------------------------------------

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

  SELECT o.metadata->>'mimetype' INTO v_mimetype
  FROM storage.objects o
  WHERE o.bucket_id = 'job-media' AND o.name = p_storage_path AND o.owner_id = auth.uid()::text;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The uploaded file was not found' USING ERRCODE = '22023';
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
