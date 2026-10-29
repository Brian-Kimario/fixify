-- Run the assignment queue every minute, and stop offering visits whose start has passed.
--
--   * _offer_next no longer offers a booking once scheduled_start has passed (it is marked
--     unmatched instead), and an offer never stays open past the visit's start.
--   * process_assignment_queue takes a transaction advisory lock so overlapping runs skip
--     instead of competing, and isolates each booking so one failure doesn't stop the rest.
--   * pg_cron runs it every minute as the database owner; no API key is involved.
--   * get_assignment_queue_status gives admins the last runs from cron.job_run_details.
--
-- The offer window itself is still matching_config.offer_window_minutes.

CREATE OR REPLACE FUNCTION public._offer_next(p_booking_id uuid, p_actor uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_pick record;
  v_decision uuid;
  v_found boolean := false;
  v_window interval := make_interval(mins => COALESCE(public._matching_setting('offer_window_minutes'), 30)::int);
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE booking_id = p_booking_id FOR UPDATE;
  IF FOUND AND v_job.current_state <> 'assigned' THEN
    RAISE EXCEPTION 'Booking % already has a job in state %', p_booking_id, v_job.current_state;
  END IF;

  -- Nobody can accept a visit whose start has passed, so that counts as an empty pool.
  IF v_booking.scheduled_start > now() THEN
    SELECT r.*, count(*) OVER () AS pool_size INTO v_pick
    FROM public._rank_professionals(p_booking_id) r
    LIMIT 1;
    v_found := FOUND;
  END IF;

  IF NOT v_found THEN
    -- Log the empty pool once per unmatched spell, not on every queue run.
    IF v_booking.unmatched_since IS NULL THEN
      INSERT INTO public.matching_decisions (booking_id, job_id, kind, pool_size, inputs)
      VALUES (p_booking_id, v_job.id, 'unmatched', 0,
              jsonb_build_object('reason', CASE WHEN v_booking.scheduled_start > now()
                                                   THEN 'no eligible professional'
                                                   ELSE 'start time passed' END));
    END IF;

    IF v_job.id IS NOT NULL AND v_job.professional_id IS NOT NULL THEN
      UPDATE public.jobs
      SET professional_id = NULL, offer_expires_at = NULL, updated_at = now()
      WHERE id = v_job.id;

      INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
      VALUES (v_job.id, 'assigned', 'assigned', p_actor, 'unmatched',
              jsonb_build_object('from_professional_id', v_job.professional_id));
    END IF;

    UPDATE public.bookings
    SET professional_id = NULL, unmatched_since = COALESCE(unmatched_since, now()), updated_at = now()
    WHERE id = p_booking_id;

    RETURN NULL;
  END IF;

  INSERT INTO public.matching_decisions
    (booking_id, job_id, professional_id, kind, pool_size, score, geo_basis, distance_km, inputs)
  VALUES
    (p_booking_id, v_job.id, v_pick.professional_id, 'offered', v_pick.pool_size, v_pick.score,
     v_pick.geo_basis, v_pick.distance_km, v_pick.inputs)
  RETURNING id INTO v_decision;

  IF v_job.id IS NOT NULL THEN
    UPDATE public.jobs
    SET professional_id = v_pick.professional_id, offer_expires_at = LEAST(now() + v_window, v_booking.scheduled_start), updated_at = now()
    WHERE id = v_job.id;

    INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
    VALUES (v_job.id, 'assigned', 'assigned', p_actor, 'reassigned',
            jsonb_build_object('from_professional_id', v_job.professional_id,
                               'to_professional_id', v_pick.professional_id));
  ELSE
    INSERT INTO public.jobs (booking_id, customer_id, property_id, professional_id, current_state, offer_expires_at)
    VALUES (p_booking_id, v_booking.customer_id, v_booking.property_id, v_pick.professional_id,
            'assigned', LEAST(now() + v_window, v_booking.scheduled_start))
    RETURNING * INTO v_job;

    UPDATE public.matching_decisions SET job_id = v_job.id WHERE id = v_decision;

    INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
    VALUES (v_job.id, 'none', 'assigned', p_actor, 'assigned',
            jsonb_build_object('professional_id', v_pick.professional_id));
  END IF;

  UPDATE public.bookings
  SET professional_id = v_pick.professional_id, unmatched_since = NULL, updated_at = now()
  WHERE id = p_booking_id;

  RETURN v_pick.professional_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_assignment_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job record;
  v_booking record;
  v_expired int := 0;
  v_matched int := 0;
  v_failed int := 0;
  v_unmatched int;
BEGIN
  -- One run at a time; a run that overlaps the previous one does nothing.
  IF NOT pg_try_advisory_xact_lock(hashtext('public.process_assignment_queue')) THEN
    RETURN jsonb_build_object('skipped', true);
  END IF;

  FOR v_job IN
    SELECT id, professional_id FROM public.jobs
    WHERE current_state = 'assigned'
      AND professional_id IS NOT NULL
      AND offer_expires_at IS NOT NULL
      AND offer_expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      PERFORM public._release_offer(v_job.id, 'expired', NULL, NULL, v_job.professional_id);
      v_expired := v_expired + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE WARNING 'process_assignment_queue: releasing job % failed: %', v_job.id, SQLERRM;
    END;
  END LOOP;

  FOR v_booking IN
    SELECT b.id, b.customer_id FROM public.bookings b
    LEFT JOIN public.jobs j ON j.booking_id = b.id
    WHERE b.booking_status = 'pending'
      AND b.scheduled_start > now()
      AND (j.id IS NULL OR (j.current_state = 'assigned' AND j.professional_id IS NULL))
  LOOP
    BEGIN
      IF public._assign_booking_internal(v_booking.id, v_booking.customer_id) IS NOT NULL THEN
        v_matched := v_matched + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
      RAISE WARNING 'process_assignment_queue: offering booking % failed: %', v_booking.id, SQLERRM;
    END;
  END LOOP;

  SELECT count(*) INTO v_unmatched FROM public.bookings
  WHERE booking_status = 'pending' AND unmatched_since IS NOT NULL;

  RETURN jsonb_build_object('expired_offers', v_expired, 'newly_matched', v_matched,
                            'failed', v_failed, 'still_unmatched', v_unmatched);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public._offer_next(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_assignment_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_assignment_queue() TO service_role;

-- ── Schedule ────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'process-assignment-queue';
SELECT cron.schedule('process-assignment-queue', '* * * * *', 'SELECT public.process_assignment_queue()');

-- ── Queue health for admins ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_assignment_queue_status()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'scheduled', EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-assignment-queue' AND active),
    'last_run_at', (SELECT max(d.start_time) FROM cron.job_run_details d
                    JOIN cron.job j ON j.jobid = d.jobid
                    WHERE j.jobname = 'process-assignment-queue'),
    'last_status', (SELECT d.status FROM cron.job_run_details d
                    JOIN cron.job j ON j.jobid = d.jobid
                    WHERE j.jobname = 'process-assignment-queue'
                    ORDER BY d.start_time DESC LIMIT 1),
    'failures_24h', (SELECT count(*) FROM cron.job_run_details d
                     JOIN cron.job j ON j.jobid = d.jobid
                     WHERE j.jobname = 'process-assignment-queue'
                       AND d.status = 'failed' AND d.start_time > now() - interval '24 hours')
  );
$function$;

-- Read through the service-role client after the admin check in src/lib/services/admin.ts.
REVOKE EXECUTE ON FUNCTION public.get_assignment_queue_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_assignment_queue_status() TO service_role;
