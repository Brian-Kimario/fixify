-- 20261030_006_create_pending_payment
--
-- payments has no INSERT policy, so createUPIIntentPayment could not record the pending
-- payment with the customer's client. Instead of adding a policy (which would let the
-- browser choose the amount), checkout uses two functions:
--
--   job_payment_amount(job)            -> paise the customer owes, computed here
--   create_pending_payment(job, order, paise)
--                                      -> recomputes the amount, rejects a mismatch,
--                                         and inserts the pending payment
--
-- The app calls the first, creates the Razorpay order for that amount, then calls the
-- second with the order id. The paise argument is only compared, never stored, so a
-- quote approved between the two calls fails the insert instead of charging a stale amount.
--
-- Amount, as createUPIIntentPayment resolved it before:
--   latest approved quote total for the job, if > 0
--   else bookings.quoted_or_base_amount, if > 0
--   else no payable amount (22023)

CREATE OR REPLACE FUNCTION public._job_payment_amount(
  p_job_id   uuid,
  p_customer uuid,
  OUT amount   numeric,
  OUT quote_id uuid,
  OUT booking_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job public.jobs%ROWTYPE;
BEGIN
  SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
  IF NOT FOUND OR p_customer IS NULL OR v_job.customer_id IS DISTINCT FROM p_customer THEN
    RAISE EXCEPTION 'Job not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_job.current_state <> 'completed' THEN
    RAISE EXCEPTION 'Payment is only available once the job is complete (current state: %)',
      v_job.current_state USING ERRCODE = '22023';
  END IF;

  booking_id := v_job.booking_id;

  SELECT q.id, q.total INTO quote_id, amount
  FROM public.quotes q
  WHERE q.job_id = p_job_id AND q.status = 'approved' AND q.total > 0
  ORDER BY q.created_at DESC
  LIMIT 1;

  IF amount IS NULL THEN
    quote_id := NULL;
    SELECT b.quoted_or_base_amount INTO amount
    FROM public.bookings b
    WHERE b.id = v_job.booking_id AND b.quoted_or_base_amount > 0;
  END IF;

  IF amount IS NULL THEN
    RAISE EXCEPTION 'No payable amount: the job has no approved quote or booking price'
      USING ERRCODE = '22023';
  END IF;

  amount := round(amount, 2);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public._job_payment_amount(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.job_payment_amount(p_job_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT (round(a.amount * 100))::bigint
  FROM public._job_payment_amount(p_job_id, auth.uid()) a;
$function$;

REVOKE EXECUTE ON FUNCTION public.job_payment_amount(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.job_payment_amount(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.create_pending_payment(
  p_job_id             uuid,
  p_provider_reference text,
  p_amount_paise       bigint
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_customer uuid := auth.uid();
  v_amount   record;
  v_existing text;
  v_id       uuid;
BEGIN
  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_provider_reference IS NULL OR btrim(p_provider_reference) = '' THEN
    RAISE EXCEPTION 'Provider reference is required' USING ERRCODE = '22023';
  END IF;

  -- Serialise checkouts for the same job so two tabs cannot both insert a pending payment.
  PERFORM 1 FROM public.jobs WHERE id = p_job_id AND customer_id = v_customer FOR UPDATE;

  SELECT * INTO v_amount FROM public._job_payment_amount(p_job_id, v_customer);

  IF p_amount_paise IS DISTINCT FROM round(v_amount.amount * 100)::bigint THEN
    RAISE EXCEPTION 'Amount % paise does not match the amount due (% paise)',
      p_amount_paise, round(v_amount.amount * 100)::bigint USING ERRCODE = '22023';
  END IF;

  SELECT status INTO v_existing
  FROM public.payments
  WHERE job_id = p_job_id AND status IN ('pending', 'paid')
  ORDER BY (status = 'paid') DESC
  LIMIT 1;

  IF v_existing = 'paid' THEN
    RAISE EXCEPTION 'This job has already been paid' USING ERRCODE = '23505';
  ELSIF v_existing = 'pending' THEN
    RAISE EXCEPTION 'A payment is already in progress for this job' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.payments
    (customer_id, booking_id, job_id, quote_id, payment_type, amount, currency,
     provider, provider_reference, status)
  VALUES
    (v_customer, v_amount.booking_id, p_job_id, v_amount.quote_id, 'service', v_amount.amount, 'INR',
     'razorpay', p_provider_reference, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_pending_payment(uuid, text, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pending_payment(uuid, text, bigint) TO authenticated, service_role;
