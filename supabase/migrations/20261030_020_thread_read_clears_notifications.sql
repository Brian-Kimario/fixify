-- Reading a conversation also reads its message notifications, so the bell and the thread agree.
-- Only the caller's own rows are touched (user_id = auth.uid()); signature and access are unchanged.
CREATE OR REPLACE FUNCTION public.mark_job_thread_read(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in' USING ERRCODE = '28000';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id AND (j.customer_id = v_uid OR j.professional_id = v_uid)
  ) THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.job_message_reads (job_id, user_id, last_read_at)
  VALUES (p_job_id, v_uid, clock_timestamp())
  ON CONFLICT (job_id, user_id) DO UPDATE SET last_read_at = EXCLUDED.last_read_at;

  UPDATE public.notifications
  SET read_at = clock_timestamp()
  WHERE user_id = v_uid AND job_id = p_job_id AND kind = 'new_message' AND read_at IS NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_job_thread_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_job_thread_read(uuid) TO authenticated;
