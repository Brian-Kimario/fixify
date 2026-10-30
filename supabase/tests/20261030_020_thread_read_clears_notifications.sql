-- Reading a thread reads only the caller's own new_message notifications for that job.
-- Uses any existing job that has both parties (reading a thread is allowed in every state); all writes are rolled back.
BEGIN;
CREATE TEMP TABLE _f AS
SELECT j.id AS job_id, j.customer_id, j.professional_id
FROM public.jobs j WHERE j.professional_id IS NOT NULL ORDER BY j.id LIMIT 1;
CREATE TEMP TABLE _r (check_name text, ok boolean);
GRANT ALL ON _f, _r TO authenticated;

-- Each party gets one unread new_message and one unread event notification (service-side inserts).
INSERT INTO public.notifications (user_id, job_id, kind, title, body, link, source_type, source_id)
SELECT u, f.job_id, k, 't', 'b', '/customer/bookings/' || f.job_id, 'job_message', gen_random_uuid()
FROM _f f, LATERAL (VALUES (f.customer_id, 'new_message'), (f.professional_id, 'new_message'), (f.customer_id, 'job_accepted')) v(u, k);

SELECT set_config('request.jwt.claims', json_build_object('sub', (SELECT customer_id FROM _f), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT public.mark_job_thread_read((SELECT job_id FROM _f));

RESET ROLE;
INSERT INTO _r
SELECT 'customer: own new_message read', bool_and(read_at IS NOT NULL) FROM public.notifications n, _f f
  WHERE n.job_id = f.job_id AND n.user_id = f.customer_id AND n.kind = 'new_message' AND n.title = 't';
INSERT INTO _r
SELECT 'customer: other kinds stay unread', bool_and(read_at IS NULL) FROM public.notifications n, _f f
  WHERE n.job_id = f.job_id AND n.user_id = f.customer_id AND n.kind = 'job_accepted' AND n.title = 't';
INSERT INTO _r
SELECT 'professional: not touched by the customer reading', bool_and(read_at IS NULL) FROM public.notifications n, _f f
  WHERE n.job_id = f.job_id AND n.user_id = f.professional_id AND n.kind = 'new_message' AND n.title = 't';

SELECT count(*) AS checks, count(*) FILTER (WHERE ok) AS passed,
  coalesce(string_agg(check_name, '; ') FILTER (WHERE NOT ok), 'none') AS failed FROM _r;
ROLLBACK;
