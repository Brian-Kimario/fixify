-- Run: supabase db query --linked -f supabase/tests/20261030_019_notification_reliability_realtime.sql
-- Runs inside a transaction that is rolled back. Each check writes a row to _results. The
-- final SELECT returns the totals and the names of any failed checks (the CLI shows only the
-- last statement's result).
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT p.id FROM public.profiles p
     WHERE p.role::text = 'customer' AND p.id <> j.customer_id ORDER BY p.id LIMIT 1) AS other_customer,
    (SELECT pp.user_id FROM public.professional_profiles pp
     WHERE pp.user_id <> j.professional_id ORDER BY pp.user_id LIMIT 1) AS other_pro
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated, anon;

CREATE FUNCTION pg_temp._as(u uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  IF u IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
  END IF;
END $$;

CREATE FUNCTION pg_temp._event(p_type text, p_to text, p_actor uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v uuid;
BEGIN
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES ((SELECT job_id FROM _fixture), p_to, p_to, p_actor, p_type, '{}') RETURNING id INTO v;
  RETURN v;
END $$;

-- SQLSTATE a statement fails with, or 'ok'.
CREATE FUNCTION pg_temp._state(p_sql text) RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN 'ok';
EXCEPTION WHEN OTHERS THEN
  RETURN SQLSTATE;
END $$;

INSERT INTO _results SELECT 'fixture: a job, another customer and another professional exist',
  count(*) = 1 AND bool_and(other_customer IS NOT NULL) AND bool_and(other_pro IS NOT NULL) FROM _fixture;

UPDATE public.jobs SET current_state = 'in_progress' WHERE id = (SELECT job_id FROM _fixture);

-- 1. completed -> customer -----------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; e uuid; n public.notifications%ROWTYPE; c integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  e := pg_temp._event('state_transition', 'completed', f.professional_id);
  SELECT * INTO n FROM public.notifications WHERE source_id = e AND user_id = f.customer_id;
  INSERT INTO _results VALUES
    ('completed: customer gets one job_completed notification', n.kind = 'job_completed'),
    ('completed: wording claims only that the professional marked it completed',
      n.title = 'Your professional has marked the work as completed'
      AND n.title || ' ' || n.body !~* '(confirm|paid|payment|dispute|resolved|refund)'),
    ('completed: link goes to the customer booking', n.link ~ '^/customer/bookings/[0-9a-f-]{36}$'),
    ('completed: the professional (actor) is not notified',
      (SELECT count(*) FROM public.notifications WHERE source_id = e AND user_id = f.professional_id) = 0);
  -- Re-running delivery for the same event creates nothing new.
  PERFORM public._notify_for_event(e);
  PERFORM public._notify_for_event(e);
  SELECT count(*) INTO c FROM public.notifications WHERE source_id = e;
  INSERT INTO _results VALUES ('completed: repeated delivery is idempotent', c = 1);
  -- Other terminal-ish transitions still do not notify.
  INSERT INTO _results VALUES ('completed: closed still notifies nobody', (
    SELECT count(*) FROM public.notifications WHERE source_id = pg_temp._event('state_transition', 'closed', f.professional_id)) = 0);
END $$;

-- 2. Event failure is recorded, not lost, and reconciles -----------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; e uuid; fr public.notification_failures%ROWTYPE; r1 integer; r2 integer; c integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  -- Force every notification insert to fail (NOT VALID still checks new rows).
  ALTER TABLE public.notifications ADD CONSTRAINT zz_block CHECK (false) NOT VALID;

  e := pg_temp._event('state_transition', 'accepted', f.professional_id);
  SELECT * INTO fr FROM public.notification_failures WHERE source_type = 'job_event' AND source_id = e;
  INSERT INTO _results VALUES
    ('failure: the event itself still succeeds', EXISTS (SELECT 1 FROM public.job_events WHERE id = e)),
    ('failure: no partial notification is left', NOT EXISTS (SELECT 1 FROM public.notifications WHERE source_id = e)),
    ('failure: it is recorded with the SQLSTATE', fr.error_code = '23514' AND fr.resolved_at IS NULL AND fr.attempts = 1);

  -- Still failing: reconcile resolves nothing and counts the attempt.
  r1 := public.reconcile_notifications();
  SELECT * INTO fr FROM public.notification_failures WHERE source_id = e;
  INSERT INTO _results VALUES ('reconcile: a still-failing source stays open and counts the attempt',
    r1 = 0 AND fr.resolved_at IS NULL AND fr.attempts = 2);

  ALTER TABLE public.notifications DROP CONSTRAINT zz_block;
  r1 := public.reconcile_notifications();
  r2 := public.reconcile_notifications();
  SELECT count(*) INTO c FROM public.notifications WHERE source_id = e;
  SELECT * INTO fr FROM public.notification_failures WHERE source_id = e;
  INSERT INTO _results VALUES
    ('reconcile: once the cause is gone the notification is delivered', c = 1 AND fr.resolved_at IS NOT NULL),
    ('reconcile: it resolves the failure once; a second run does nothing', r1 >= 1 AND r2 = 0),
    ('reconcile: the recipient is the customer', (SELECT user_id FROM public.notifications WHERE source_id = e) = f.customer_id);
END $$;

-- 3. Message failure: recorded without the message text; the message is kept ---------------------
DO $$
DECLARE f _fixture%ROWTYPE; m uuid; fr public.notification_failures%ROWTYPE;
  secret text := 'private-text-9f3a'; r integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  ALTER TABLE public.notifications ADD CONSTRAINT zz_block CHECK (false) NOT VALID;

  PERFORM pg_temp._as(f.customer_id);
  m := public.send_job_message(f.job_id, secret, gen_random_uuid());
  PERFORM pg_temp._as(NULL);

  SELECT * INTO fr FROM public.notification_failures WHERE source_type = 'job_message' AND source_id = m;
  INSERT INTO _results VALUES
    ('failure: the message is still stored', EXISTS (SELECT 1 FROM public.job_messages WHERE id = m)),
    ('failure: message failure is recorded', fr.error_code = '23514'),
    ('failure: the record holds no message text', to_jsonb(fr)::text NOT LIKE '%' || secret || '%');

  ALTER TABLE public.notifications DROP CONSTRAINT zz_block;
  r := public.reconcile_notifications();
  INSERT INTO _results VALUES
    ('reconcile: the message notification reaches the professional',
      (SELECT count(*) FROM public.notifications WHERE source_id = m AND user_id = f.professional_id AND kind = 'new_message') = 1),
    ('reconcile: the sender is not notified of their own message',
      (SELECT count(*) FROM public.notifications WHERE source_id = m AND user_id = f.customer_id) = 0),
    ('reconcile: stored notification text holds no message text',
      NOT EXISTS (SELECT 1 FROM public.notifications WHERE (title || body) LIKE '%' || secret || '%'));
END $$;

-- 4. A failure whose source is gone resolves instead of looping ----------------------------------
DO $$
DECLARE r integer;
BEGIN
  INSERT INTO public.notification_failures (source_type, source_id, error_code)
  VALUES ('job_event', gen_random_uuid(), '23514'), ('job_message', gen_random_uuid(), '23514');
  r := public.reconcile_notifications();
  INSERT INTO _results VALUES ('reconcile: failures whose source no longer exists are resolved',
    r >= 2 AND NOT EXISTS (SELECT 1 FROM public.notification_failures WHERE resolved_at IS NULL));
END $$;

-- 5. Nobody but the owner and service role can touch the failure log or reconcile ---------------
DO $$
DECLARE f _fixture%ROWTYPE; s_sel text; s_rec text; s_ins text; s_anon_rec text;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.customer_id);
  s_sel := pg_temp._state('SELECT 1 FROM public.notification_failures LIMIT 1');
  s_rec := pg_temp._state('SELECT public.reconcile_notifications()');
  s_ins := pg_temp._state($q$INSERT INTO public.notification_failures (source_type, source_id, error_code) VALUES ('job_event', gen_random_uuid(), 'x')$q$);
  PERFORM pg_temp._as(NULL);
  EXECUTE 'SET LOCAL ROLE anon';
  s_anon_rec := pg_temp._state('SELECT public.reconcile_notifications()');
  EXECUTE 'RESET ROLE';
  INSERT INTO _results VALUES
    ('access: an authenticated user cannot read the failure log', s_sel = '42501'),
    ('access: an authenticated user cannot write the failure log', s_ins = '42501'),
    ('access: an authenticated user cannot run reconcile', s_rec = '42501'),
    ('access: anon cannot run reconcile', s_anon_rec = '42501'),
    ('access: service_role can run reconcile',
      has_function_privilege('service_role', 'public.reconcile_notifications()', 'EXECUTE')),
    ('access: the trigger helpers are not callable through the API',
      NOT has_function_privilege('authenticated', 'public._notify_for_event(uuid)', 'EXECUTE')
      AND NOT has_function_privilege('authenticated', 'public._notify_for_message(uuid)', 'EXECUTE')
      AND NOT has_function_privilege('authenticated', 'public._record_notification_failure(text, uuid, text)', 'EXECUTE'));
END $$;

-- 6. Realtime publication is exactly what the inbox needs ----------------------------------------
INSERT INTO _results SELECT 'realtime: job_messages and notifications are published',
  (SELECT count(*) FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename IN ('job_messages', 'notifications')) = 2;
INSERT INTO _results SELECT 'realtime: nothing else is published',
  NOT EXISTS (SELECT 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND NOT (schemaname = 'public' AND tablename IN ('job_messages', 'notifications')));
INSERT INTO _results SELECT 'realtime: both published tables enforce RLS',
  (SELECT bool_and(relrowsecurity) FROM pg_class WHERE oid IN ('public.job_messages'::regclass, 'public.notifications'::regclass));

-- 7. Recipient isolation (what a subscriber's JWT can see is what RLS lets it select) ------------
DO $$
DECLARE f _fixture%ROWTYPE; n_other integer; m_other integer; n_own integer; m_pro integer; m_cust integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.other_customer);
  SELECT count(*) INTO n_other FROM public.notifications WHERE job_id = f.job_id;
  SELECT count(*) INTO m_other FROM public.job_messages WHERE job_id = f.job_id;
  PERFORM pg_temp._as(f.customer_id);
  SELECT count(*) INTO n_own FROM public.notifications WHERE user_id <> f.customer_id;
  SELECT count(*) INTO m_cust FROM public.job_messages WHERE job_id = f.job_id;
  PERFORM pg_temp._as(f.professional_id);
  SELECT count(*) INTO m_pro FROM public.job_messages WHERE job_id = f.job_id;
  PERFORM pg_temp._as(NULL);
  INSERT INTO _results VALUES
    ('isolation: another customer sees none of this job''s notifications or messages', n_other = 0 AND m_other = 0),
    ('isolation: a user never sees someone else''s notifications', n_own = 0),
    ('isolation: both participants see the stored message', m_cust >= 1 AND m_pro >= 1);
END $$;

-- 8. Reassignment: the assignment-scoped model holds ---------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; old_sees integer; new_sees integer;
  s_send text; s_read text; s_new_send text; new_msg uuid;
BEGIN
  SELECT * INTO f FROM _fixture;
  UPDATE public.jobs SET professional_id = f.other_pro WHERE id = f.job_id;

  PERFORM pg_temp._as(f.professional_id);
  SELECT count(*) INTO old_sees FROM public.job_messages WHERE job_id = f.job_id;
  s_send := pg_temp._state(format('SELECT public.send_job_message(%L, ''hi'', gen_random_uuid())', f.job_id));
  s_read := pg_temp._state(format('SELECT public.mark_job_thread_read(%L)', f.job_id));

  PERFORM pg_temp._as(f.other_pro);
  SELECT count(*) INTO new_sees FROM public.job_messages WHERE job_id = f.job_id;
  PERFORM pg_temp._as(NULL);

  INSERT INTO _results VALUES
    ('reassign: the previous professional reads no messages', old_sees = 0),
    ('reassign: the previous professional cannot send', s_send = 'P0002'),
    ('reassign: the previous professional cannot mark the thread read', s_read = 'P0002'),
    ('reassign: the new professional does not inherit the old conversation', new_sees = 0),
    ('reassign: the customer still sees the whole thread',
      (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) >= 1);
END $$;

SELECT count(*) AS checks, count(*) FILTER (WHERE NOT pass) AS failed,
  string_agg(check_name, '; ') FILTER (WHERE NOT pass) AS failures
FROM _results;
ROLLBACK;
