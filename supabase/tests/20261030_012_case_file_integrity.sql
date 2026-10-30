-- Run: supabase db query --linked -f supabase/tests/20261030_012_case_file_integrity.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true. Uses the first in-progress job with no quote waiting, and a
-- different professional as the outsider.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;
CREATE TEMP TABLE _fixture ON COMMIT DROP AS
  SELECT j.id AS job_id, j.customer_id, j.professional_id,
    (SELECT o.user_id FROM public.professional_profiles o
     WHERE o.user_id <> j.professional_id ORDER BY o.user_id LIMIT 1) AS other_pro
  FROM public.jobs j
  WHERE j.current_state = 'in_progress' AND j.professional_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.quotes q WHERE q.job_id = j.id AND q.status = 'pending_customer')
  ORDER BY j.id LIMIT 1;
GRANT SELECT ON _fixture TO authenticated;
GRANT ALL ON _results TO authenticated, anon;

INSERT INTO _results SELECT 'fixture: an in-progress job and another professional exist',
  count(*) = 1 AND bool_and(other_pro IS NOT NULL) FROM _fixture;

-- 1. Another professional cannot record anything on the job.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', other_pro::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  PERFORM public.submit_inspection(job_id, 'outsider findings') FROM _fixture;
  INSERT INTO _results VALUES ('other professional cannot inspect', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other professional cannot inspect', true);
END $$;
DO $$
BEGIN
  PERFORM public.create_quote(job_id, 'outsider',
    '[{"item_type":"labour","description":"x","quantity":1,"unit_price":100}]'::jsonb) FROM _fixture;
  INSERT INTO _results VALUES ('other professional cannot quote', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('other professional cannot quote', true);
END $$;
DO $$
BEGIN
  INSERT INTO public.quotes (job_id, professional_id, subtotal, total, reason)
  SELECT job_id, other_pro, 1, 1, 'direct' FROM _fixture;
  INSERT INTO _results VALUES ('direct quote insert refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('direct quote insert refused', true);
END $$;
RESET ROLE;

-- 2. The assigned professional.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', professional_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type)
  SELECT job_id, 'in_progress', 'completed', professional_id, 'state_transition' FROM _fixture;
  INSERT INTO _results VALUES ('direct job_events insert refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('direct job_events insert refused', true);
END $$;

DO $$
BEGIN
  INSERT INTO public.inspections (job_id, professional_id, findings)
  SELECT job_id, professional_id, 'direct' FROM _fixture;
  INSERT INTO _results VALUES ('direct inspection insert refused', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('direct inspection insert refused', true);
END $$;

DO $$
BEGIN
  PERFORM public.transition_job_state(job_id, 'quote_pending', professional_id) FROM _fixture;
  INSERT INTO _results VALUES ('quote_pending without a quote refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('quote_pending without a quote refused', true);
END $$;

DO $$
BEGIN
  PERFORM public.create_quote(job_id, 'bad item',
    '[{"item_type":"labour","description":"x","quantity":1,"unit_price":0}]'::jsonb) FROM _fixture;
  INSERT INTO _results VALUES ('zero unit price refused', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('zero unit price refused', true);
END $$;

INSERT INTO _results SELECT 'inspection recorded',
  public.submit_inspection(job_id, '  Leaking trap under the sink  ', NULL) IS NOT NULL FROM _fixture;

CREATE TEMP TABLE _quote ON COMMIT DROP AS
  SELECT public.create_quote(job_id, 'Trap needs replacing',
    '[{"item_type":"material","description":"PVC trap","quantity":2,"unit_price":149.5},
      {"item_type":"labour","description":"Fitting","quantity":1,"unit_price":300}]'::jsonb) AS quote_id
  FROM _fixture;

DO $$
BEGIN
  PERFORM public.create_quote(job_id, 'second',
    '[{"item_type":"labour","description":"x","quantity":1,"unit_price":100}]'::jsonb) FROM _fixture;
  INSERT INTO _results VALUES ('second quote refused while one is waiting', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('second quote refused while one is waiting', true);
END $$;

DO $$
BEGIN
  PERFORM public.transition_job_state(job_id, 'in_progress', professional_id) FROM _fixture;
  INSERT INTO _results VALUES ('professional cannot skip the quote answer', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('professional cannot skip the quote answer', true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

INSERT INTO _results SELECT 'quote total is the sum of its items, computed in SQL',
  q.total = 599 AND q.subtotal = 599 AND q.taxes_or_fees = 0 AND q.status = 'pending_customer'
  AND (SELECT count(*) FROM public.quote_items i WHERE i.quote_id = q.id) = 2
FROM public.quotes q JOIN _quote ON q.id = _quote.quote_id;

INSERT INTO _results SELECT 'job is waiting on the quote', j.current_state = 'quote_pending'
FROM public.jobs j JOIN _fixture f ON j.id = f.job_id;

INSERT INTO _results SELECT 'events: inspection then quote, no findings in metadata',
  array_agg(e.event_type ORDER BY e.created_at, e.event_type) FILTER (WHERE e.created_at = now())
    @> ARRAY['inspection_submitted', 'quote_submitted']
  AND bool_and(NOT (e.metadata ? 'findings'))
FROM public.job_events e JOIN _fixture f ON e.job_id = f.job_id WHERE e.created_at = now();

-- 3. The customer must answer through respond_to_quote.
SELECT set_config('request.jwt.claims',
  json_build_object('sub', customer_id::text, 'role', 'authenticated')::text, true)
FROM _fixture;
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  PERFORM public.transition_job_state(job_id, 'in_progress', customer_id) FROM _fixture;
  INSERT INTO _results VALUES ('customer cannot skip the quote answer', false);
EXCEPTION WHEN invalid_parameter_value THEN
  INSERT INTO _results VALUES ('customer cannot skip the quote answer', true);
END $$;

DO $$
BEGIN
  PERFORM public.submit_inspection(job_id, 'customer findings') FROM _fixture;
  INSERT INTO _results VALUES ('customer cannot inspect', false);
EXCEPTION WHEN no_data_found THEN
  INSERT INTO _results VALUES ('customer cannot inspect', true);
END $$;

INSERT INTO _results SELECT 'customer approves the quote',
  public.respond_to_quote(quote_id, 'approved', NULL) FROM _quote;
RESET ROLE;
SELECT set_config('request.jwt.claims', '', true);

INSERT INTO _results SELECT 'approval resumes work and is on the timeline',
  j.current_state = 'in_progress'
  AND EXISTS (SELECT 1 FROM public.job_events e WHERE e.job_id = j.id AND e.event_type = 'quote_approved')
FROM public.jobs j JOIN _fixture f ON j.id = f.job_id;

-- 4. Anonymous callers cannot execute either function.
SET LOCAL ROLE anon;
DO $$
BEGIN
  PERFORM public.create_quote(gen_random_uuid(), 'x', '[]'::jsonb);
  INSERT INTO _results VALUES ('anon cannot execute', false);
EXCEPTION WHEN insufficient_privilege THEN
  INSERT INTO _results VALUES ('anon cannot execute', true);
END $$;
RESET ROLE;

SELECT check_name, pass FROM _results;
ROLLBACK;
