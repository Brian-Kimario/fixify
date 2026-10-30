-- When a job was paid, for either party on the job.
--
-- payments RLS lets only the customer (and admin/support) read payment rows, so the
-- professional's case file could not show the "Paid" step. This returns only the time the
-- job's payment was captured (no amount, provider or reference), and only to the job's
-- customer or professional.

CREATE OR REPLACE FUNCTION public.job_paid_at(p_job_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_paid_at timestamptz;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = p_job_id AND auth.uid() IN (j.customer_id, j.professional_id)
  ) THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT max(p.paid_at) INTO v_paid_at
  FROM public.payments p
  WHERE p.job_id = p_job_id AND p.status = 'paid';

  RETURN v_paid_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.job_paid_at(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_paid_at(uuid) TO authenticated;
