-- Run: supabase db query --linked -f supabase/tests/20261030_008_matching_v2_ranking.sql
-- Everything runs inside a transaction that is rolled back. Each check returns one row with a
-- pass flag; all must be true.
--
-- Uses an active service with two verified professionals (A < B by user_id) and an existing
-- customer property. Inside the transaction it takes control of everything the ranking reads
-- for those two: their availability rows and service areas are replaced, the property gets
-- fixed coordinates, and matching_config weights are set per check. The booking is scheduled
-- a year out so no existing job clashes.
BEGIN;

CREATE TEMP TABLE _results (check_name text, pass boolean) ON COMMIT DROP;

CREATE TEMP TABLE _fixture ON COMMIT DROP AS
WITH svc AS (
  SELECT s.id AS service_id, array_agg(DISTINCT pp.user_id ORDER BY pp.user_id) AS pros
  FROM public.services s
  JOIN public.professional_skills ps ON ps.service_id = s.id OR ps.service_category_id = s.category_id
  JOIN public.professional_profiles pp ON pp.user_id = ps.professional_id AND pp.verification_status = 'verified'
  WHERE s.is_active
  GROUP BY s.id
  HAVING count(DISTINCT pp.user_id) >= 2
  ORDER BY s.id
  LIMIT 1
)
SELECT
  svc.service_id,
  svc.pros[1] AS pro_a,
  svc.pros[2] AS pro_b,
  p.id AS property_id,
  p.owner_customer_id AS customer_id,
  p.address_id
FROM svc
CROSS JOIN LATERAL (
  SELECT pr.id, pr.owner_customer_id, pr.address_id
  FROM public.properties pr
  JOIN public.profiles c ON c.id = pr.owner_customer_id AND c.role = 'customer'::user_role
  WHERE pr.address_id IS NOT NULL
  ORDER BY pr.id LIMIT 1
) p;

INSERT INTO _results SELECT 'fixture: service with two verified pros and a property', count(*) = 1 FROM _fixture;

-- Only A and B can be candidates: everyone else loses the skill for this service.
DELETE FROM public.professional_skills ps
USING _fixture f, public.services s
WHERE s.id = f.service_id
  AND (ps.service_id = f.service_id OR ps.service_category_id = s.category_id)
  AND ps.professional_id NOT IN (f.pro_a, f.pro_b);

-- No availability rows means always available.
DELETE FROM public.professional_availability pa USING _fixture f WHERE pa.professional_id IN (f.pro_a, f.pro_b);
DELETE FROM public.professional_service_areas psa USING _fixture f WHERE psa.professional_id IN (f.pro_a, f.pro_b);
UPDATE public.professional_profiles pp SET is_available = true, years_experience = 0
FROM _fixture f WHERE pp.user_id IN (f.pro_a, f.pro_b);

UPDATE public.addresses a SET latitude = 12.900000, longitude = 77.600000, city = 'Testcity', area = 'Testarea'
FROM _fixture f WHERE a.id = f.address_id;

CREATE TEMP TABLE _booking ON COMMIT DROP AS
WITH ins AS (
  INSERT INTO public.bookings (customer_id, property_id, service_id, scheduled_start, pricing_model, booking_status)
  SELECT f.customer_id, f.property_id, f.service_id, date_trunc('hour', now()) + interval '365 days', s.pricing_model, 'pending'
  FROM _fixture f JOIN public.services s ON s.id = f.service_id
  RETURNING id
)
SELECT id FROM ins;

-- Isolate one component at a time.
CREATE OR REPLACE FUNCTION pg_temp.only_weight(p_key text) RETURNS void LANGUAGE sql AS $$
  UPDATE public.matching_config SET value = CASE WHEN key = p_key THEN 1 ELSE 0 END WHERE key LIKE 'w\_%';
$$;

-- ── 1. City fallback ────────────────────────────────────────────────────────
-- Areas with no coordinates qualify by city; an area in another city does not.
INSERT INTO public.professional_service_areas (professional_id, city, area)
SELECT f.pro_a, 'Testcity', 'Elsewhere' FROM _fixture f
UNION ALL SELECT f.pro_b, 'Testcity', 'Testarea' FROM _fixture f;

INSERT INTO _results
SELECT 'city fallback: both qualify with geo_basis city', count(*) = 2 AND bool_and(r.geo_basis = 'city')
FROM _booking b, public._rank_professionals(b.id) r;

SELECT pg_temp.only_weight('w_proximity');
INSERT INTO _results
SELECT 'city fallback: exact area match ranks first', array_agg(r.professional_id ORDER BY ord) = ARRAY[f.pro_b, f.pro_a]
FROM _booking b, _fixture f, public._rank_professionals(b.id) WITH ORDINALITY AS r(professional_id, score, geo_basis, distance_km, inputs, ord)
GROUP BY f.pro_a, f.pro_b;

-- ── 2. Score is the weighted sum it reports ─────────────────────────────────
UPDATE public.matching_config SET value = v.value
FROM (VALUES ('w_proximity', 3), ('w_load', 2), ('w_service_specific', 1), ('w_skill_level', 1),
             ('w_experience', 0.5), ('w_acceptance', 1), ('w_response', 1), ('w_completion', 1),
             ('w_reliability', 1), ('w_rating', 1)) AS v(key, value)
WHERE matching_config.key = v.key;

INSERT INTO _results
SELECT 'score equals sum of weight x component', bool_and(abs(r.score - (
    SELECT sum((r.inputs -> 'weights' ->> k)::numeric * (r.inputs -> 'components' ->> k)::numeric)
    FROM jsonb_object_keys(r.inputs -> 'weights') AS k
  )) < 0.001)
FROM _booking b, public._rank_professionals(b.id) r;

INSERT INTO _results
SELECT 'rating scores 0 below rating_min_reviews', bool_and((r.inputs -> 'components' ->> 'rating')::numeric = 0)
FROM _booking b, public._rank_professionals(b.id) r;

-- ── 3. Tie-break ────────────────────────────────────────────────────────────
UPDATE public.matching_config SET value = 0 WHERE key LIKE 'w\_%';
INSERT INTO _results
SELECT 'equal scores order by user_id', array_agg(r.professional_id ORDER BY ord) = ARRAY[f.pro_a, f.pro_b]
FROM _booking b, _fixture f, public._rank_professionals(b.id) WITH ORDINALITY AS r(professional_id, score, geo_basis, distance_km, inputs, ord)
GROUP BY f.pro_a, f.pro_b;

-- ── 4. Distance ─────────────────────────────────────────────────────────────
-- 0.018 deg latitude is about 2 km, 0.072 about 8 km, 0.18 about 20 km.
DELETE FROM public.professional_service_areas psa USING _fixture f WHERE psa.professional_id IN (f.pro_a, f.pro_b);
INSERT INTO public.professional_service_areas (professional_id, city, base_lat, base_lng, radius_km)
SELECT f.pro_a, 'Othercity', 12.972000, 77.600000, 10 FROM _fixture f
UNION ALL SELECT f.pro_b, 'Othercity', 12.918000, 77.600000, 10 FROM _fixture f;

SELECT pg_temp.only_weight('w_proximity');
INSERT INTO _results
SELECT 'distance: inside radius qualifies regardless of city', count(*) = 2 AND bool_and(r.geo_basis = 'distance')
FROM _booking b, public._rank_professionals(b.id) r;

INSERT INTO _results
SELECT 'distance: closer professional ranks first', array_agg(r.professional_id ORDER BY ord) = ARRAY[f.pro_b, f.pro_a]
FROM _booking b, _fixture f, public._rank_professionals(b.id) WITH ORDINALITY AS r(professional_id, score, geo_basis, distance_km, inputs, ord)
GROUP BY f.pro_a, f.pro_b;

INSERT INTO _results
SELECT 'distance: reported km is right', bool_and(
    (r.professional_id = f.pro_b AND r.distance_km BETWEEN 1.9 AND 2.1)
    OR (r.professional_id = f.pro_a AND r.distance_km BETWEEN 7.9 AND 8.1))
FROM _booking b, _fixture f, public._rank_professionals(b.id) r;

UPDATE public.professional_service_areas psa SET base_lat = 13.080000
FROM _fixture f WHERE psa.professional_id = f.pro_a;
INSERT INTO _results
SELECT 'distance: outside radius is excluded', array_agg(r.professional_id) = ARRAY[f.pro_b]
FROM _booking b, _fixture f, public._rank_professionals(b.id) r
GROUP BY f.pro_b;

UPDATE public.professional_service_areas psa SET base_lat = 12.972000
FROM _fixture f WHERE psa.professional_id = f.pro_a;

-- ── 5. Experience weight ────────────────────────────────────────────────────
SELECT pg_temp.only_weight('w_experience');
UPDATE public.professional_profiles pp SET years_experience = 10 FROM _fixture f WHERE pp.user_id = f.pro_b;
INSERT INTO _results
SELECT 'experience weight reorders', (array_agg(r.professional_id ORDER BY ord))[1] = f.pro_b
FROM _booking b, _fixture f, public._rank_professionals(b.id) WITH ORDINALITY AS r(professional_id, score, geo_basis, distance_km, inputs, ord)
GROUP BY f.pro_b;

-- ── 6. Hard filters ─────────────────────────────────────────────────────────
INSERT INTO public.booking_assignment_attempts (booking_id, professional_id, outcome, reason_code)
SELECT b.id, f.pro_b, 'declined', 'too_far' FROM _booking b, _fixture f;
INSERT INTO _results
SELECT 'a professional who declined is not offered again', array_agg(r.professional_id) = ARRAY[f.pro_a]
FROM _booking b, _fixture f, public._rank_professionals(b.id) r
GROUP BY f.pro_a;
DELETE FROM public.booking_assignment_attempts att USING _booking b WHERE att.booking_id = b.id;

UPDATE public.professional_profiles pp SET verification_status = 'pending' FROM _fixture f WHERE pp.user_id = f.pro_a;
INSERT INTO _results
SELECT 'unverified professional is excluded', array_agg(r.professional_id) = ARRAY[f.pro_b]
FROM _booking b, _fixture f, public._rank_professionals(b.id) r
GROUP BY f.pro_b;
UPDATE public.professional_profiles pp SET verification_status = 'verified' FROM _fixture f WHERE pp.user_id = f.pro_a;

UPDATE public.professional_profiles pp SET is_available = false FROM _fixture f WHERE pp.user_id = f.pro_b;
INSERT INTO _results
SELECT 'unavailable professional is excluded', array_agg(r.professional_id) = ARRAY[f.pro_a]
FROM _booking b, _fixture f, public._rank_professionals(b.id) r
GROUP BY f.pro_a;
UPDATE public.professional_profiles pp SET is_available = true FROM _fixture f WHERE pp.user_id = f.pro_b;

-- ── 7. Offering logs the decision ───────────────────────────────────────────
SELECT public._offer_next(b.id, f.customer_id) FROM _booking b, _fixture f;

INSERT INTO _results
SELECT 'offer goes to the top-ranked professional', j.professional_id = f.pro_b AND j.current_state = 'assigned'
FROM _booking b, _fixture f, public.jobs j WHERE j.booking_id = b.id;

INSERT INTO _results
SELECT 'offer is logged with pool size and score', count(*) = 1
  AND bool_and(d.kind = 'offered' AND d.professional_id = f.pro_b AND d.pool_size = 2 AND d.score IS NOT NULL)
FROM _booking b, _fixture f, public.matching_decisions d WHERE d.booking_id = b.id
GROUP BY f.pro_b;

-- ── 8. Nobody eligible ──────────────────────────────────────────────────────
UPDATE public.professional_profiles pp SET is_available = false FROM _fixture f WHERE pp.user_id IN (f.pro_a, f.pro_b);
INSERT INTO public.booking_assignment_attempts (booking_id, professional_id, outcome, reason_code)
SELECT b.id, f.pro_b, 'declined', 'other' FROM _booking b, _fixture f;
SELECT public._offer_next(b.id, f.customer_id) FROM _booking b, _fixture f;

INSERT INTO _results
SELECT 'empty pool keeps the job unassigned and marks the booking', j.professional_id IS NULL
  AND j.current_state = 'assigned' AND bk.unmatched_since IS NOT NULL
FROM _booking b JOIN public.bookings bk ON bk.id = b.id JOIN public.jobs j ON j.booking_id = b.id;

INSERT INTO _results
SELECT 'empty pool is logged once', count(*) FILTER (WHERE d.kind = 'unmatched') = 1
FROM _booking b, public.matching_decisions d WHERE d.booking_id = b.id;

SELECT check_name, pass FROM _results;

ROLLBACK;
