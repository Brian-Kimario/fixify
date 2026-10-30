-- Run: supabase db query --linked -f supabase/tests/20261030_018_notifications.sql
-- Runs inside a transaction that is rolled back. Each check writes a row to _results. The
-- final SELECT returns the totals and the names of any failed checks (the CLI shows only the
-- last statement's result).
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT p.id FROM public.profiles p
     WHERE p.role::text = 'customer' AND p.id <> j.customer_id ORDER BY p.id LIMIT 1) AS other_customer
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
CREATE TEMP TABLE _ids (label text, id uuid) ON COMMIT DROP;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results, _ids TO authenticated, anon;

CREATE FUNCTION pg_temp._as(u uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  IF u IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
  END IF;
END $$;

-- Notifications for (user, kind) on the fixture job, counted as the owner.
CREATE FUNCTION pg_temp._n(u uuid, k text) RETURNS integer LANGUAGE sql AS $$
  SELECT count(*)::integer FROM public.notifications
  WHERE user_id = u AND kind = k AND job_id = (SELECT job_id FROM _fixture)
$$;

-- Insert a job event as the owner (what a server-side RPC would do).
CREATE FUNCTION pg_temp._event(p_type text, p_to text, p_actor uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES ((SELECT job_id FROM _fixture), p_to, p_to, p_actor, p_type, '{}') RETURNING id INTO v;
  RETURN v;
END $$;

INSERT INTO _results SELECT 'fixture: a job and another customer exist',
  count(*) = 1 AND bool_and(other_customer IS NOT NULL) FROM _fixture;

UPDATE public.jobs SET current_state = 'in_progress' WHERE id = (SELECT job_id FROM _fixture);

-- 1. Mapping: each approved event reaches the right person ---------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._event('state_transition', 'accepted', f.professional_id);
  PERFORM pg_temp._event('eta_shared', 'on_the_way', f.professional_id);
  PERFORM pg_temp._event('running_late', 'on_the_way', f.professional_id);
  PERFORM pg_temp._event('state_transition', 'arrived', f.professional_id);
  PERFORM pg_temp._event('state_transition', 'quote_pending', f.professional_id);
  PERFORM pg_temp._event('quote_approved', 'in_progress', f.customer_id);
  PERFORM pg_temp._event('quote_declined', 'in_progress', f.customer_id);

  INSERT INTO _results VALUES
    ('map: accepted -> customer', pg_temp._n(f.customer_id, 'job_accepted') = 1),
    ('map: eta_shared -> customer', pg_temp._n(f.customer_id, 'eta_shared') = 1),
    ('map: running_late -> customer', pg_temp._n(f.customer_id, 'running_late') = 1),
    ('map: arrived -> customer', pg_temp._n(f.customer_id, 'pro_arrived') = 1),
    ('map: quote_pending -> customer', pg_temp._n(f.customer_id, 'quote_requested') = 1),
    ('map: quote_approved -> professional', pg_temp._n(f.professional_id, 'quote_approved') = 1),
    ('map: quote_declined -> professional', pg_temp._n(f.professional_id, 'quote_declined') = 1),
    ('map: the actor is never notified of their own action',
      (SELECT count(*) FROM public.notifications WHERE user_id = f.professional_id
         AND kind IN ('job_accepted','eta_shared','running_late','pro_arrived','quote_requested')) = 0
      AND (SELECT count(*) FROM public.notifications WHERE user_id = f.customer_id
         AND kind IN ('quote_approved','quote_declined')) = 0);
END $$;

-- 2. Events outside the mapping do not notify ---------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; before_n integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  SELECT count(*) INTO before_n FROM public.notifications;
  PERFORM pg_temp._event('assigned', 'assigned', f.customer_id);
  PERFORM pg_temp._event('media_added', 'in_progress', f.professional_id);
  PERFORM pg_temp._event('state_transition', 'on_the_way', f.professional_id);
  PERFORM pg_temp._event('state_transition', 'in_progress', f.professional_id);
  PERFORM pg_temp._event('state_transition', 'closed', f.professional_id);
  INSERT INTO _results VALUES ('map: unmapped events create no notifications',
    (SELECT count(*) FROM public.notifications) = before_n);
END $$;

-- 3. Cancellation: everyone except the actor ----------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; e uuid;
BEGIN
  SELECT * INTO f FROM _fixture;
  e := pg_temp._event('state_transition', 'cancelled', f.customer_id);
  INSERT INTO _results VALUES ('cancel by customer: professional notified, customer not',
    (SELECT count(*) FROM public.notifications WHERE source_id = e AND user_id = f.professional_id) = 1
    AND (SELECT count(*) FROM public.notifications WHERE source_id = e AND user_id = f.customer_id) = 0);
  e := pg_temp._event('state_transition', 'cancelled', f.professional_id);
  INSERT INTO _results VALUES ('cancel by professional: customer notified, professional not',
    (SELECT count(*) FROM public.notifications WHERE source_id = e AND user_id = f.customer_id) = 1
    AND (SELECT count(*) FROM public.notifications WHERE source_id = e AND user_id = f.professional_id) = 0);
  e := pg_temp._event('state_transition', 'cancelled', f.other_customer);
  INSERT INTO _results VALUES ('cancel by a non-participant (for example an admin): both notified',
    (SELECT count(*) FROM public.notifications WHERE source_id = e) = 2);
END $$;

-- 4. Content and link are fixed and carry no private data ----------------------------------------
INSERT INTO _results SELECT 'content: customer link is the booking, professional link is the job',
  (SELECT bool_and(link = '/customer/bookings/' || j.booking_id::text)
     FROM public.notifications n JOIN public.jobs j ON j.id = n.job_id
     WHERE n.user_id = j.customer_id AND n.job_id = (SELECT job_id FROM _fixture))
  AND (SELECT bool_and(link = '/professional/jobs/' || j.id::text)
     FROM public.notifications n JOIN public.jobs j ON j.id = n.job_id
     WHERE n.user_id = j.professional_id AND n.job_id = (SELECT job_id FROM _fixture));

-- 5. Idempotency --------------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; e uuid; n1 integer; j public.jobs;
BEGIN
  SELECT * INTO f FROM _fixture;
  SELECT * INTO j FROM public.jobs WHERE id = f.job_id;
  e := pg_temp._event('eta_shared', 'on_the_way', f.professional_id);
  n1 := (SELECT count(*) FROM public.notifications WHERE source_id = e);
  PERFORM public._notify(f.customer_id, j, 'eta_shared', 'job_event', e);
  PERFORM public._notify(f.customer_id, j, 'eta_shared', 'job_event', e);
  INSERT INTO _results VALUES ('idempotent: replaying one event identity adds nothing',
    n1 = 1 AND (SELECT count(*) FROM public.notifications WHERE source_id = e) = 1);
  INSERT INTO _results VALUES ('idempotent: two separate events are two notifications',
    pg_temp._n(f.customer_id, 'eta_shared') = 2);
END $$;

-- 6. Messages -----------------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; k1 uuid := gen_random_uuid(); k2 uuid := gen_random_uuid(); m uuid;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.customer_id);
  m := public.send_job_message(f.job_id, 'private words 555-1234', k1);
  PERFORM public.send_job_message(f.job_id, 'private words 555-1234', k1);  -- client retry
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES
    ('message: customer message notifies the professional once, even on retry',
      pg_temp._n(f.professional_id, 'new_message') = 1 AND pg_temp._n(f.customer_id, 'new_message') = 0),
    ('message: the notification does not contain the message text',
      NOT EXISTS (SELECT 1 FROM public.notifications WHERE kind = 'new_message'
                  AND (title || body || link) LIKE '%private%'));
  PERFORM pg_temp._as(f.professional_id);
  PERFORM public.send_job_message(f.job_id, 'reply', k2);
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES ('message: professional reply notifies the customer',
    pg_temp._n(f.customer_id, 'new_message') = 1);
END $$;

-- 7. Transaction boundary: a failed transition leaves no notification ----------------------------
DO $$
DECLARE f _fixture%ROWTYPE; before_n integer; refused boolean := false;
BEGIN
  SELECT * INTO f FROM _fixture;
  UPDATE public.jobs SET current_state = 'accepted' WHERE id = f.job_id;
  SELECT count(*) INTO before_n FROM public.notifications;
  PERFORM pg_temp._as(f.professional_id);
  BEGIN
    PERFORM public.transition_job_state(f.job_id, 'quote_pending', f.professional_id, '{}');  -- not allowed from accepted
  EXCEPTION WHEN OTHERS THEN
    refused := true;
  END;
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES ('boundary: an invalid transition is refused and notifies no one',
    refused AND (SELECT count(*) FROM public.notifications) = before_n);

  PERFORM pg_temp._as(f.professional_id);
  PERFORM public.transition_job_state(f.job_id, 'on_the_way', f.professional_id, '{}');
  PERFORM public.transition_job_state(f.job_id, 'arrived', f.professional_id, '{}');
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES ('boundary: a real transition through the RPC notifies the customer',
    (SELECT count(*) FROM public.notifications WHERE user_id = f.customer_id AND kind = 'pro_arrived') = 2);

  -- A transaction that rolls back takes its notifications with it.
  BEGIN
    PERFORM pg_temp._event('state_transition', 'arrived', f.professional_id);
    RAISE EXCEPTION 'force rollback';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  INSERT INTO _results VALUES ('boundary: rolled-back event leaves no notification',
    (SELECT count(*) FROM public.notifications WHERE user_id = f.customer_id AND kind = 'pro_arrived') = 2);
END $$;

-- 8. Row-level security --------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; seen integer; mine integer; theirs integer; denied boolean;
BEGIN
  SELECT * INTO f FROM _fixture;
  SELECT count(*) INTO mine FROM public.notifications WHERE user_id = f.customer_id;
  SELECT count(*) INTO theirs FROM public.notifications WHERE user_id = f.professional_id;
  INSERT INTO _results VALUES ('fixture: both participants have notifications', mine > 0 AND theirs > 0);

  PERFORM pg_temp._as(f.customer_id);
  SELECT count(*) INTO seen FROM public.notifications;
  INSERT INTO _results VALUES ('rls: customer sees exactly their own', seen = mine);
  PERFORM pg_temp._as(f.professional_id);
  SELECT count(*) INTO seen FROM public.notifications;
  INSERT INTO _results VALUES ('rls: professional sees exactly their own', seen = theirs);
  PERFORM pg_temp._as(f.other_customer);
  SELECT count(*) INTO seen FROM public.notifications WHERE job_id = f.job_id;
  INSERT INTO _results VALUES ('rls: an unrelated user sees none of this job', seen = 0);

  -- No direct writes of any kind.
  PERFORM pg_temp._as(f.customer_id);
  denied := false;
  BEGIN
    INSERT INTO public.notifications (user_id, job_id, kind, title, body, link, source_type, source_id)
    VALUES (f.professional_id, f.job_id, 'new_message', 'x', 'y', '/professional/jobs/' || f.job_id::text, 'job_message', gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: forging a notification is refused', denied);
  denied := false;
  BEGIN
    UPDATE public.notifications SET read_at = now() WHERE user_id = f.customer_id;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: direct UPDATE is refused', denied);
  denied := false;
  BEGIN
    DELETE FROM public.notifications WHERE user_id = f.customer_id;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: DELETE is refused', denied);
  denied := false;
  BEGIN
    PERFORM public._notify(f.customer_id, (SELECT j FROM public.jobs j WHERE id = f.job_id), 'new_message', 'job_message', gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: the internal writer is not callable', denied);

  PERFORM pg_temp._as(NULL);
  EXECUTE 'SET LOCAL ROLE anon';
  denied := false;
  BEGIN
    PERFORM count(*) FROM public.notifications;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: anonymous cannot read', denied);
  denied := false;
  BEGIN
    PERFORM public.mark_all_notifications_read();
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  INSERT INTO _results VALUES ('rls: anonymous cannot mark read', denied);
  PERFORM pg_temp._as(NULL);
END $$;

-- 9. Read state ---------------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; nid uuid; r1 boolean; r2 boolean; r3 boolean; unread_before integer; total integer; changed integer; again integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  SELECT id INTO nid FROM public.notifications WHERE user_id = f.customer_id ORDER BY created_at LIMIT 1;
  SELECT count(*) INTO total FROM public.notifications WHERE user_id = f.customer_id;

  -- Another user cannot alter it.
  PERFORM pg_temp._as(f.other_customer);
  r1 := public.mark_notification_read(nid);
  PERFORM pg_temp._as(f.professional_id);
  r2 := public.mark_notification_read(nid);
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES ('read: others cannot mark my notification',
    NOT r1 AND NOT r2 AND (SELECT read_at IS NULL FROM public.notifications WHERE id = nid));

  PERFORM pg_temp._as(f.customer_id);
  r1 := public.mark_notification_read(nid);
  r2 := public.mark_notification_read(nid);
  r3 := public.mark_notification_read(gen_random_uuid());
  SELECT count(*) INTO unread_before FROM public.notifications WHERE read_at IS NULL;
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES
    ('read: first mark changes it, repeat and unknown id change nothing', r1 AND NOT r2 AND NOT r3),
    ('read: unread count follows the stored state', unread_before = total - 1);
  INSERT INTO _results VALUES ('read: read_at is not overwritten by a repeat',
    (SELECT read_at FROM public.notifications WHERE id = nid) IS NOT NULL);

  PERFORM pg_temp._as(f.customer_id);
  changed := public.mark_all_notifications_read();
  again := public.mark_all_notifications_read();
  SELECT count(*) INTO unread_before FROM public.notifications WHERE read_at IS NULL;
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES
    ('read: mark-all marks exactly the unread ones, then nothing', changed = total - 1 AND again = 0 AND unread_before = 0),
    ('read: mark-all leaves the other user unread',
      (SELECT count(*) FROM public.notifications WHERE user_id = f.professional_id AND read_at IS NULL) > 0);
END $$;

-- 10. The legacy log is untouched by the new tables ----------------------------------------------
INSERT INTO _results SELECT 'legacy: notification_logs has no notification kinds from this phase',
  NOT EXISTS (SELECT 1 FROM public.notification_logs WHERE notification_type IN ('new_message','job_cancelled','quote_approved'));

SELECT count(*) AS checks, count(*) FILTER (WHERE NOT pass) AS failed,
  string_agg(check_name, '; ') FILTER (WHERE NOT pass) AS failures
FROM _results;
ROLLBACK;
