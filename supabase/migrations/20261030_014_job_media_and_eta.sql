-- MIGRATION 20261030_014: proof-of-work photos and the professional's arrival window
-- Phase 3b (ROLE_DASHBOARDS_REBUILD §Phase 3).
--
-- 1. jobs.eta_earliest / eta_latest: an arrival window the professional states, written only by
--    report_job_eta. It is the professional's estimate; nothing tracks location.
-- 2. job_media: photos and receipts the job's professional attaches on site. Files live in the
--    private job-media bucket under <job_id>/; rows are written only by add_job_media, which
--    checks the uploaded object exists and belongs to the caller.
-- Start/finish codes, cancellation fees and no-show handling wait on owner decisions
-- (OPEN_DECISIONS 4 and 9) and are not part of this migration.

-- 1. Arrival window ---------------------------------------------------------------------------

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS eta_earliest timestamptz,
  ADD COLUMN IF NOT EXISTS eta_latest timestamptz;

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_eta_window_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_eta_window_check
  CHECK ((eta_earliest IS NULL) = (eta_latest IS NULL) AND (eta_latest IS NULL OR eta_latest > eta_earliest));

CREATE OR REPLACE FUNCTION public.report_job_eta(
  p_job_id uuid,
  p_earliest_minutes integer,
  p_latest_minutes integer,
  p_running_late boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_earliest timestamptz;
  v_latest timestamptz;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.professional_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  -- An arrival window belongs to the trip. Running late can also be said before setting off.
  IF NOT (v_job.current_state = 'on_the_way'
          OR (p_running_late AND v_job.current_state = 'accepted')) THEN
    RAISE EXCEPTION 'An arrival time can only be shared before you arrive (state: %)', v_job.current_state
      USING ERRCODE = '22023';
  END IF;

  IF p_earliest_minutes IS NULL OR p_latest_minutes IS NULL
     OR p_earliest_minutes < 0 OR p_latest_minutes <= p_earliest_minutes OR p_latest_minutes > 480 THEN
    RAISE EXCEPTION 'Choose an arrival window within the next 8 hours' USING ERRCODE = '22023';
  END IF;

  v_earliest := now() + make_interval(mins => p_earliest_minutes);
  v_latest := now() + make_interval(mins => p_latest_minutes);

  UPDATE public.jobs
  SET eta_earliest = v_earliest, eta_latest = v_latest, updated_at = now()
  WHERE id = p_job_id;

  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_job.current_state, v_job.current_state, auth.uid(),
          CASE WHEN p_running_late THEN 'running_late' ELSE 'eta_shared' END,
          jsonb_build_object('eta_earliest', v_earliest, 'eta_latest', v_latest));
END;
$function$;

REVOKE ALL ON FUNCTION public.report_job_eta(uuid, integer, integer, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_job_eta(uuid, integer, integer, boolean) TO authenticated;

-- 2. Proof-of-work media ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id),
  kind text NOT NULL CHECK (kind IN ('before', 'after', 'part', 'receipt')),
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_media_job_id_idx ON public.job_media (job_id, created_at);

ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;

-- The job's customer and professional, and admin/support, can read. No write policies:
-- rows are inserted only by add_job_media.
DROP POLICY IF EXISTS job_media_select_participants ON public.job_media;
CREATE POLICY job_media_select_participants ON public.job_media
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_media.job_id AND (j.customer_id = auth.uid() OR j.professional_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support'))
  );

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-media',
  'job-media',
  false,
  10485760,  -- 10 MB per file, as for verification documents
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- The job's professional uploads into <job_id>/ while on site or after finishing, until closed.
DROP POLICY IF EXISTS job_media_professional_upload ON storage.objects;
CREATE POLICY job_media_professional_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-media'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id::text = (storage.foldername(name))[1]
        AND j.professional_id = auth.uid()
        AND j.current_state IN ('arrived', 'in_progress', 'quote_pending', 'completed')
    )
  );

DROP POLICY IF EXISTS job_media_participants_read ON storage.objects;
CREATE POLICY job_media_participants_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'job-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id::text = (storage.foldername(name))[1]
          AND (j.customer_id = auth.uid() OR j.professional_id = auth.uid())
      )
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'support'))
    )
  );

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

  IF p_storage_path IS NULL OR p_storage_path NOT LIKE p_job_id::text || '/%'
     OR NOT EXISTS (
       SELECT 1 FROM storage.objects o
       WHERE o.bucket_id = 'job-media' AND o.name = p_storage_path AND o.owner_id = auth.uid()::text
     ) THEN
    RAISE EXCEPTION 'The uploaded file was not found' USING ERRCODE = '22023';
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
