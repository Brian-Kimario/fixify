-- Case-file integrity: the shared job timeline must only contain facts the system recorded.
--
-- Before this migration:
--   * the job's customer or professional could INSERT any job_events row (fake history);
--   * a professional could INSERT inspections, quotes and quote_items against any job,
--     and UPDATE a pending quote's total after sending it;
--   * a job could move to quote_pending with no quote, or out of quote_pending without the
--     customer answering the quote.
--
-- After it, inspections and quotes are written only through submit_inspection and
-- create_quote (which check the caller is the job's professional and the job's state), and
-- job_events are written only by SECURITY DEFINER functions.

-- 1. Inspection report -------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_inspection(
  p_job_id uuid,
  p_findings text,
  p_recommendation text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_findings text := btrim(COALESCE(p_findings, ''));
  v_recommendation text := NULLIF(btrim(COALESCE(p_recommendation, '')), '');
  v_id uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.professional_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_job.current_state NOT IN ('arrived', 'in_progress') THEN
    RAISE EXCEPTION 'An inspection can only be recorded on site (state: %)', v_job.current_state
      USING ERRCODE = '22023';
  END IF;

  IF length(v_findings) < 1 OR length(v_findings) > 5000 THEN
    RAISE EXCEPTION 'Findings must be 1 to 5000 characters' USING ERRCODE = '22023';
  END IF;
  IF v_recommendation IS NOT NULL AND length(v_recommendation) > 5000 THEN
    RAISE EXCEPTION 'Recommendation must be at most 5000 characters' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.inspections (job_id, professional_id, findings, recommendation)
  VALUES (p_job_id, v_job.professional_id, v_findings, v_recommendation)
  RETURNING id INTO v_id;

  -- Audit record only; the job state does not change on inspection.
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_job.current_state, v_job.current_state, auth.uid(), 'inspection_submitted',
          jsonb_build_object('inspection_id', v_id));

  RETURN v_id;
END;
$function$;

-- 2. Quote ---------------------------------------------------------------------------------
-- No tax or platform fee is configured anywhere, so the total is the sum of the line items.

CREATE OR REPLACE FUNCTION public.create_quote(
  p_job_id uuid,
  p_reason text,
  p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_reason text := btrim(COALESCE(p_reason, ''));
  v_item jsonb;
  v_type text;
  v_description text;
  v_quantity numeric;
  v_unit_price numeric;
  v_total numeric := 0;
  v_quote_id uuid;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR v_job.professional_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_job.current_state <> 'in_progress' THEN
    RAISE EXCEPTION 'A quote can only be sent while the job is in progress (state: %)', v_job.current_state
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.quotes WHERE job_id = p_job_id AND status = 'pending_customer') THEN
    RAISE EXCEPTION 'This job already has a quote waiting for the customer' USING ERRCODE = '22023';
  END IF;

  IF length(v_reason) < 1 OR length(v_reason) > 1000 THEN
    RAISE EXCEPTION 'Reason must be 1 to 1000 characters' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'A quote needs 1 to 50 line items' USING ERRCODE = '22023';
  END IF;

  -- Validate every item before writing anything.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_type := v_item->>'item_type';
    v_description := btrim(COALESCE(v_item->>'description', ''));
    BEGIN
      v_quantity := (v_item->>'quantity')::numeric;
      v_unit_price := (v_item->>'unit_price')::numeric;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Quantity and unit price must be numbers' USING ERRCODE = '22023';
    END;
    IF v_type IS NULL OR v_type NOT IN ('labour', 'material', 'fee') THEN
      RAISE EXCEPTION 'Invalid line item type' USING ERRCODE = '22023';
    END IF;
    IF length(v_description) < 1 OR length(v_description) > 300 THEN
      RAISE EXCEPTION 'Line item description must be 1 to 300 characters' USING ERRCODE = '22023';
    END IF;
    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 10000 THEN
      RAISE EXCEPTION 'Line item quantity must be above 0 and at most 10000' USING ERRCODE = '22023';
    END IF;
    IF v_unit_price IS NULL OR v_unit_price <= 0 OR v_unit_price > 1000000 THEN
      RAISE EXCEPTION 'Line item unit price must be above 0 and at most 1000000' USING ERRCODE = '22023';
    END IF;
    v_total := v_total + round(v_quantity * v_unit_price, 2);
  END LOOP;

  INSERT INTO public.quotes (job_id, professional_id, subtotal, taxes_or_fees, discount, total, reason, status)
  VALUES (p_job_id, v_job.professional_id, v_total, 0, 0, v_total, v_reason, 'pending_customer')
  RETURNING id INTO v_quote_id;

  INSERT INTO public.quote_items (quote_id, item_type, description, quantity, unit_price, line_total)
  SELECT v_quote_id, e->>'item_type', btrim(e->>'description'), (e->>'quantity')::numeric,
         (e->>'unit_price')::numeric, round((e->>'quantity')::numeric * (e->>'unit_price')::numeric, 2)
  FROM jsonb_array_elements(p_items) AS e;

  PERFORM public.transition_job_state(
    p_job_id, 'quote_pending', auth.uid(),
    jsonb_build_object('event_type', 'quote_submitted', 'quote_id', v_quote_id, 'total', v_total)
  );

  RETURN v_quote_id;
END;
$function$;

-- 3. State machine: quote guards -----------------------------------------------------------
-- Unchanged from the live definition except for the two quote checks marked below.

CREATE OR REPLACE FUNCTION public.transition_job_state(p_job_id uuid, p_new_state text, p_actor_user_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_caller uuid := auth.uid();
  v_status text;
  v_valid boolean := false;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF v_caller IS NOT NULL THEN
    IF p_actor_user_id IS DISTINCT FROM v_caller THEN
      RAISE EXCEPTION 'Actor does not match the signed-in user';
    END IF;
    IF v_caller <> v_job.professional_id
       AND NOT (v_caller = v_job.customer_id
                AND p_new_state IN ('in_progress', 'cancelled')
                AND v_job.current_state IN ('quote_pending', 'assigned', 'accepted', 'on_the_way', 'arrived')) THEN
      RAISE EXCEPTION 'Not allowed to change this job';
    END IF;
  END IF;

  IF p_new_state = 'accepted' THEN
    SELECT verification_status INTO v_status
    FROM public.professional_profiles WHERE user_id = v_job.professional_id;
    IF v_status IS NULL THEN
      RAISE EXCEPTION 'Professional not found';
    END IF;
    IF v_status <> 'verified' THEN
      RAISE EXCEPTION 'Professional must be verified to accept jobs. Current status: %', v_status;
    END IF;
  END IF;

  -- Quote guard 1: quote_pending means a quote is actually waiting for the customer.
  IF p_new_state = 'quote_pending'
     AND NOT EXISTS (SELECT 1 FROM public.quotes WHERE job_id = p_job_id AND status = 'pending_customer') THEN
    RAISE EXCEPTION 'A job can only wait on a quote that has been sent' USING ERRCODE = '22023';
  END IF;

  -- Quote guard 2: leaving quote_pending for work needs the quote answered first
  -- (respond_to_quote updates the quote before it calls this function).
  IF v_job.current_state = 'quote_pending' AND p_new_state = 'in_progress'
     AND EXISTS (SELECT 1 FROM public.quotes WHERE job_id = p_job_id AND status = 'pending_customer') THEN
    RAISE EXCEPTION 'The customer has not answered the quote yet' USING ERRCODE = '22023';
  END IF;

  IF (v_job.current_state = 'assigned' AND p_new_state IN ('accepted', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'accepted' AND p_new_state IN ('on_the_way', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'on_the_way' AND p_new_state IN ('arrived', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'arrived' AND p_new_state IN ('in_progress', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'in_progress' AND p_new_state IN ('quote_pending', 'completed', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'quote_pending' AND p_new_state IN ('in_progress', 'cancelled')) THEN v_valid := true;
  ELSIF (v_job.current_state = 'completed' AND p_new_state = 'closed') THEN v_valid := true;
  ELSIF (v_job.current_state = 'cancelled' AND p_new_state = 'closed') THEN v_valid := true;
  END IF;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_job.current_state, p_new_state;
  END IF;

  UPDATE public.jobs
  SET
    current_state = p_new_state,
    updated_at = now(),
    accepted_at = CASE WHEN p_new_state = 'accepted' THEN now() ELSE accepted_at END,
    on_the_way_at = CASE WHEN p_new_state = 'on_the_way' THEN now() ELSE on_the_way_at END,
    arrived_at = CASE WHEN p_new_state = 'arrived' THEN now() ELSE arrived_at END,
    started_at = CASE WHEN p_new_state = 'in_progress' THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_new_state = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_state = 'cancelled' THEN now() ELSE cancelled_at END,
    closed_at = CASE WHEN p_new_state IN ('completed', 'cancelled') THEN now() ELSE closed_at END
  WHERE id = p_job_id;

  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_job.current_state, p_new_state, p_actor_user_id,
          COALESCE(p_metadata->>'event_type', 'state_transition'), p_metadata);

  RETURN true;
END;
$function$;

-- 4. Remove direct writes --------------------------------------------------------------------

DROP POLICY IF EXISTS professionals_insert_job_events ON public.job_events;
DROP POLICY IF EXISTS inspections_insert_own ON public.inspections;
DROP POLICY IF EXISTS quotes_insert_professional ON public.quotes;
DROP POLICY IF EXISTS quotes_update_professional_pending ON public.quotes;
DROP POLICY IF EXISTS quote_items_insert_professional ON public.quote_items;

REVOKE INSERT, UPDATE, DELETE ON public.job_events, public.inspections, public.quotes, public.quote_items
  FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.submit_inspection(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_quote(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_inspection(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote(uuid, text, jsonb) TO authenticated;
