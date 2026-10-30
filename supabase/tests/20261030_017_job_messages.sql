-- Run: supabase db query --linked -f supabase/tests/20261030_017_job_messages.sql
-- Everything runs inside a transaction that is rolled back. Each check writes one row to
-- _results; all must be true. Fixture job states and assignments are set directly (as the
-- migration owner) so each guard can be reached.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT p.id FROM public.profiles p
     WHERE p.role::text = 'customer' AND p.id <> j.customer_id ORDER BY p.id LIMIT 1) AS other_customer,
    (SELECT o.user_id FROM public.professional_profiles o
     WHERE o.user_id <> j.professional_id ORDER BY o.user_id LIMIT 1) AS other_pro
  FROM public.jobs j
  WHERE j.professional_id IS NOT NULL
  ORDER BY j.id LIMIT 1;
CREATE TEMP TABLE _ids (label text, id uuid) ON COMMIT DROP;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results, _ids TO authenticated, anon;

-- Switch identity; NULL returns to the owner. Runs in the same transaction.
CREATE FUNCTION pg_temp._as(u uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE 'RESET ROLE';
  IF u IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('sub', u::text, 'role', 'authenticated')::text, true);
    EXECUTE 'SET LOCAL ROLE authenticated';
  END IF;
END $$;

INSERT INTO _results SELECT 'fixture: a job, another customer and another professional exist',
  count(*) = 1 AND bool_and(other_customer IS NOT NULL AND other_pro IS NOT NULL) FROM _fixture;

INSERT INTO _results SELECT 'config: limits are 2000 characters and 10 per minute',
  (SELECT value FROM public.messaging_config WHERE key = 'message_max_length') = 2000
  AND (SELECT value FROM public.messaging_config WHERE key = 'messages_per_minute') = 10;

UPDATE public.jobs SET current_state = 'assigned' WHERE id = (SELECT job_id FROM _fixture);

-- 1. Gate on job state ------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.customer_id);
  BEGIN
    PERFORM public.send_job_message(f.job_id, 'hello', gen_random_uuid());
    INSERT INTO _results VALUES ('send: refused before the professional accepts', false);
  EXCEPTION WHEN invalid_parameter_value THEN
    INSERT INTO _results VALUES ('send: refused before the professional accepts', true);
  END;
  PERFORM pg_temp._as(NULL);
END $$;

UPDATE public.jobs SET current_state = 'accepted' WHERE id = (SELECT job_id FROM _fixture);

-- 2. Who may send -----------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; v uuid;
BEGIN
  SELECT * INTO f FROM _fixture;

  PERFORM pg_temp._as(f.customer_id);
  v := public.send_job_message(f.job_id, '  Hello from the customer  ', gen_random_uuid());
  INSERT INTO _ids VALUES ('customer_msg', v);
  INSERT INTO _results VALUES ('send: the job''s customer can send once accepted', v IS NOT NULL);

  PERFORM pg_temp._as(f.professional_id);
  v := public.send_job_message(f.job_id, 'Hello from the professional', gen_random_uuid());
  INSERT INTO _ids VALUES ('pro_msg', v);
  INSERT INTO _results VALUES ('send: the assigned professional can send', v IS NOT NULL);

  PERFORM pg_temp._as(f.other_customer);
  BEGIN
    PERFORM public.send_job_message(f.job_id, 'intruder', gen_random_uuid());
    INSERT INTO _results VALUES ('send: another customer is refused', false);
  EXCEPTION WHEN no_data_found THEN
    INSERT INTO _results VALUES ('send: another customer is refused', true);
  END;

  PERFORM pg_temp._as(f.other_pro);
  BEGIN
    PERFORM public.send_job_message(f.job_id, 'intruder', gen_random_uuid());
    INSERT INTO _results VALUES ('send: another professional is refused', false);
  EXCEPTION WHEN no_data_found THEN
    INSERT INTO _results VALUES ('send: another professional is refused', true);
  END;
  PERFORM pg_temp._as(NULL);
END $$;

-- The body is trimmed, and the stored sender and professional come from the session and job.
INSERT INTO _results SELECT 'send: body is trimmed and sender/professional are server-derived',
  m.body = 'Hello from the customer' AND m.sender_id = f.customer_id AND m.professional_id = f.professional_id
FROM public.job_messages m, _fixture f WHERE m.id = (SELECT id FROM _ids WHERE label = 'customer_msg');

-- 3. Direct writes are impossible (so sender_id cannot be forged) -----------------------------
DO $$
DECLARE f _fixture%ROWTYPE;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.customer_id);
  BEGIN
    INSERT INTO public.job_messages (job_id, professional_id, sender_id, body, client_key)
    VALUES (f.job_id, f.professional_id, f.professional_id, 'forged', gen_random_uuid());
    INSERT INTO _results VALUES ('write: a direct insert (forged sender) is refused', false);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _results VALUES ('write: a direct insert (forged sender) is refused', true);
  END;
  BEGIN
    UPDATE public.job_messages SET body = 'edited' WHERE job_id = f.job_id;
    INSERT INTO _results VALUES ('write: a direct update is refused', false);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _results VALUES ('write: a direct update is refused', true);
  END;
  BEGIN
    DELETE FROM public.job_messages WHERE job_id = f.job_id;
    INSERT INTO _results VALUES ('write: a direct delete is refused', false);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _results VALUES ('write: a direct delete is refused', true);
  END;
  PERFORM pg_temp._as(NULL);
END $$;

-- 4. Validation, idempotency, anon ------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; k uuid := gen_random_uuid(); a uuid; b uuid; n_before integer; n_after integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.customer_id);

  BEGIN
    PERFORM public.send_job_message(f.job_id, '   ', gen_random_uuid());
    INSERT INTO _results VALUES ('validate: an empty message is refused', false);
  EXCEPTION WHEN invalid_parameter_value THEN
    INSERT INTO _results VALUES ('validate: an empty message is refused', true);
  END;

  BEGIN
    PERFORM public.send_job_message(f.job_id, repeat('x', 2001), gen_random_uuid());
    INSERT INTO _results VALUES ('validate: 2001 characters is refused', false);
  EXCEPTION WHEN invalid_parameter_value THEN
    INSERT INTO _results VALUES ('validate: 2001 characters is refused', true);
  END;

  PERFORM public.send_job_message(f.job_id, repeat('y', 2000), gen_random_uuid());
  INSERT INTO _results VALUES ('validate: exactly 2000 characters is accepted', true);

  SELECT count(*) INTO n_before FROM public.job_messages WHERE job_id = f.job_id;
  a := public.send_job_message(f.job_id, '<img src=x onerror=alert(1)>', k);
  b := public.send_job_message(f.job_id, '<img src=x onerror=alert(1)>', k);
  SELECT count(*) INTO n_after FROM public.job_messages WHERE job_id = f.job_id;
  INSERT INTO _results VALUES ('idempotency: a retried key returns the same message, stored once',
    a = b AND n_after = n_before + 1);
  INSERT INTO _results VALUES ('validate: markup is stored verbatim (escaped at render, never rewritten)',
    (SELECT body FROM public.job_messages WHERE id = a) = '<img src=x onerror=alert(1)>');

  PERFORM pg_temp._as(NULL);
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN
    PERFORM public.send_job_message(f.job_id, 'anon', gen_random_uuid());
    INSERT INTO _results VALUES ('anon: cannot call send_job_message', false);
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO _results VALUES ('anon: cannot call send_job_message', true);
  END;
  EXECUTE 'RESET ROLE';
END $$;

-- 5. Who may read -----------------------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; n_all integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  SELECT count(*) INTO n_all FROM public.job_messages WHERE job_id = f.job_id;

  PERFORM pg_temp._as(f.customer_id);
  INSERT INTO _results VALUES ('read: the customer sees the whole thread',
    (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) = n_all);

  PERFORM pg_temp._as(f.professional_id);
  INSERT INTO _results VALUES ('read: the assigned professional sees the thread',
    (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) = n_all);

  PERFORM pg_temp._as(f.other_customer);
  INSERT INTO _results VALUES ('read: another customer sees nothing',
    (SELECT count(*) FROM public.job_messages) = 0
    AND (SELECT count(*) FROM public.get_message_threads()) = 0);

  PERFORM pg_temp._as(f.other_pro);
  INSERT INTO _results VALUES ('read: another professional sees nothing',
    (SELECT count(*) FROM public.job_messages) = 0
    AND (SELECT count(*) FROM public.get_message_threads()) = 0);

  PERFORM pg_temp._as(NULL);
  EXECUTE 'SET LOCAL ROLE anon';
  INSERT INTO _results VALUES ('read: anon sees nothing', (SELECT count(*) FROM public.job_messages) = 0);
  EXECUTE 'RESET ROLE';
END $$;

-- 6. Read state and the inbox -----------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; u integer;
BEGIN
  SELECT * INTO f FROM _fixture;

  -- The professional wrote 1 message and then read; the customer wrote 3 since last reading
  -- (the customer's own sends mark their side read, so only the professional is behind).
  PERFORM pg_temp._as(f.professional_id);
  SELECT unread_count INTO u FROM public.get_message_threads() WHERE job_id = f.job_id;
  INSERT INTO _results VALUES ('inbox: unread counts the other party''s messages since last read', u >= 1);

  PERFORM public.mark_job_thread_read(f.job_id);
  SELECT unread_count INTO u FROM public.get_message_threads() WHERE job_id = f.job_id;
  INSERT INTO _results VALUES ('inbox: marking the thread read clears the count', u = 0);

  PERFORM pg_temp._as(f.other_customer);
  BEGIN
    PERFORM public.mark_job_thread_read(f.job_id);
    INSERT INTO _results VALUES ('read state: another user cannot mark this thread read', false);
  EXCEPTION WHEN no_data_found THEN
    INSERT INTO _results VALUES ('read state: another user cannot mark this thread read', true);
  END;
  PERFORM pg_temp._as(NULL);
END $$;

INSERT INTO _results SELECT 'read state: only the two participants have rows',
  NOT EXISTS (SELECT 1 FROM public.job_message_reads r, _fixture f
              WHERE r.job_id = f.job_id AND r.user_id NOT IN (f.customer_id, f.professional_id));

-- 7. Rate limit (the professional's earlier sends count toward the 10) ------------------------
DO $$
DECLARE f _fixture%ROWTYPE; i integer; refused boolean := false; stored integer;
BEGIN
  SELECT * INTO f FROM _fixture;
  PERFORM pg_temp._as(f.professional_id);
  FOR i IN 1..15 LOOP
    BEGIN
      PERFORM public.send_job_message(f.job_id, 'burst ' || i, gen_random_uuid());
    EXCEPTION WHEN program_limit_exceeded THEN
      refused := true;
      EXIT;
    END;
  END LOOP;
  SELECT count(*) INTO stored FROM public.job_messages WHERE job_id = f.job_id AND sender_id = f.professional_id;
  INSERT INTO _results VALUES ('rate: the 11th message in a minute is refused', refused AND stored = 10);

  -- The other participant is not affected by this sender's limit.
  PERFORM pg_temp._as(f.customer_id);
  PERFORM public.send_job_message(f.job_id, 'still fine', gen_random_uuid());
  INSERT INTO _results VALUES ('rate: the limit is per sender', true);
  PERFORM pg_temp._as(NULL);
END $$;

-- 8. Reassignment: the previous professional loses read and send; the new one starts clean ----
UPDATE public.jobs SET professional_id = (SELECT other_pro FROM _fixture) WHERE id = (SELECT job_id FROM _fixture);
DO $$
DECLARE f _fixture%ROWTYPE; v uuid;
BEGIN
  SELECT * INTO f FROM _fixture;

  PERFORM pg_temp._as(f.professional_id);
  BEGIN
    PERFORM public.send_job_message(f.job_id, 'old pro', gen_random_uuid());
    INSERT INTO _results VALUES ('reassign: the previous professional cannot send', false);
  EXCEPTION WHEN no_data_found THEN
    INSERT INTO _results VALUES ('reassign: the previous professional cannot send', true);
  END;
  INSERT INTO _results VALUES ('reassign: the previous professional cannot read',
    (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) = 0);

  PERFORM pg_temp._as(f.other_pro);
  INSERT INTO _results VALUES ('reassign: the new professional does not inherit the old conversation',
    (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) = 0);
  v := public.send_job_message(f.job_id, 'new pro', gen_random_uuid());
  INSERT INTO _results VALUES ('reassign: the new professional can send', v IS NOT NULL);

  PERFORM pg_temp._as(f.customer_id);
  INSERT INTO _results VALUES ('reassign: the customer keeps the whole history',
    (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) > 1
    AND EXISTS (SELECT 1 FROM public.job_messages WHERE job_id = f.job_id AND professional_id = f.other_pro));
  PERFORM pg_temp._as(NULL);
END $$;
UPDATE public.jobs SET professional_id = (SELECT professional_id FROM _fixture) WHERE id = (SELECT job_id FROM _fixture);

-- 9. Read-only once the job ends --------------------------------------------------------------
DO $$
DECLARE f _fixture%ROWTYPE; s text; ok_all boolean := true; refused boolean;
BEGIN
  SELECT * INTO f FROM _fixture;
  FOREACH s IN ARRAY ARRAY['completed', 'cancelled', 'closed'] LOOP
    PERFORM pg_temp._as(NULL);
    UPDATE public.jobs SET current_state = s WHERE id = f.job_id;
    PERFORM pg_temp._as(f.customer_id);
    refused := false;
    BEGIN
      PERFORM public.send_job_message(f.job_id, 'after ' || s, gen_random_uuid());
    EXCEPTION WHEN invalid_parameter_value THEN
      refused := true;
    END;
    ok_all := ok_all AND refused
      AND (SELECT count(*) FROM public.job_messages WHERE job_id = f.job_id) > 0;
  END LOOP;
  INSERT INTO _results VALUES ('lifecycle: completed, cancelled and closed are read-only but still readable', ok_all);
  PERFORM pg_temp._as(NULL);
END $$;

SELECT check_name, pass FROM _results ORDER BY pass, check_name;
SELECT bool_and(pass) AS all_passed, count(*) AS checks FROM _results;

ROLLBACK;
