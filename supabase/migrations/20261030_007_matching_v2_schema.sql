-- 20261030_007_matching_v2_schema
--
-- Schema for matching v2 (docs/ROLE_DASHBOARDS_REBUILD.md, Phase 2). Functions that use it
-- are in 20261030_008 and 20261030_009.
--
--   professional_service_areas  base_lat/base_lng, so radius_km can be checked by distance
--   bookings                    problem_summary, urgency, intake_options, unmatched_since
--   jobs.professional_id        nullable while the job is 'assigned' and nobody is left to
--                               offer it to, so an unmatched job is kept instead of deleted
--   matching_config             ranking weights and thresholds, one row per key
--   matching_decisions          what the matcher saw for every offer it made
--   booking_assignment_attempts reason_code, plus the decision the attempt answered

-- ── Service area coordinates ────────────────────────────────────────────────

ALTER TABLE public.professional_service_areas
  ADD COLUMN IF NOT EXISTS base_lat numeric(9, 6),
  ADD COLUMN IF NOT EXISTS base_lng numeric(9, 6);

ALTER TABLE public.professional_service_areas
  ADD CONSTRAINT professional_service_areas_base_lat_check CHECK (base_lat BETWEEN -90 AND 90),
  ADD CONSTRAINT professional_service_areas_base_lng_check CHECK (base_lng BETWEEN -180 AND 180),
  ADD CONSTRAINT professional_service_areas_base_coords_pair CHECK ((base_lat IS NULL) = (base_lng IS NULL)),
  ADD CONSTRAINT professional_service_areas_radius_check CHECK (radius_km IS NULL OR radius_km > 0);

CREATE INDEX IF NOT EXISTS professional_skills_service_idx ON public.professional_skills (service_id);
CREATE INDEX IF NOT EXISTS professional_skills_category_idx ON public.professional_skills (service_category_id);

-- ── Booking intake ──────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS problem_summary text,
  ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'flexible',
  ADD COLUMN IF NOT EXISTS intake_options jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS unmatched_since timestamptz;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_problem_summary_length CHECK (char_length(problem_summary) <= 1000),
  ADD CONSTRAINT bookings_urgency_check CHECK (urgency IN ('flexible', 'today', 'emergency')),
  ADD CONSTRAINT bookings_intake_options_array CHECK (jsonb_typeof(intake_options) = 'array');

COMMENT ON COLUMN public.bookings.problem_summary IS
  'The customer''s description of the problem. Shown to offered professionals before accepting, so it must not hold access codes.';
COMMENT ON COLUMN public.bookings.urgency IS
  '''emergency'' is refused by create_booking while matching_config.emergency_enabled = 0 (owner decision 8).';
COMMENT ON COLUMN public.bookings.intake_options IS
  'Options chosen at booking: [{option_id, option, value, label}]. Labels only; the amount is still set from the service.';
COMMENT ON COLUMN public.bookings.unmatched_since IS
  'Set when the matcher finds no eligible professional, cleared when one is offered the job.';

CREATE INDEX IF NOT EXISTS bookings_unmatched_idx ON public.bookings (unmatched_since)
  WHERE unmatched_since IS NOT NULL;

-- ── Unmatched jobs are kept ─────────────────────────────────────────────────

ALTER TABLE public.jobs ALTER COLUMN professional_id DROP NOT NULL;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_professional_required CHECK (professional_id IS NOT NULL OR current_state = 'assigned');

-- ── Config ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matching_config (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  description text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.matching_config ENABLE ROW LEVEL SECURITY;

-- Read by SECURITY DEFINER matcher functions. Only admins read it directly; changes are
-- made with SQL by the owner, so there are no write policies.
CREATE POLICY matching_config_select_admin ON public.matching_config
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::public.user_role));

-- Weights multiply components that are each scaled to 0..1, so a weight is how much that
-- component can add to a professional's score. The starting weights reproduce the old
-- ordering (closest area first, then fewest open jobs) and are meant to be tuned.
INSERT INTO public.matching_config (key, value, description) VALUES
  ('offer_window_minutes', 30, 'How long one professional holds an offer before it moves on. Was hard-coded as 30.'),
  ('w_proximity', 3, 'Weight: 1 - distance/radius_km, or 1/0 for exact area match when distance is unknown.'),
  ('w_load', 2, 'Weight: 1/(1 + open jobs), so idle professionals rank higher.'),
  ('w_service_specific', 1, 'Weight: 1 when the professional lists this exact service, 0.5 for the category only.'),
  ('w_skill_level', 1, 'Weight: skill_level expert 1, advanced 0.67, intermediate 0.33, beginner 0; unset uses metric_prior.'),
  ('w_experience', 0.5, 'Weight: years_experience / experience_cap_years, capped at 1.'),
  ('w_acceptance', 1, 'Weight: share of offers accepted (professional_metrics.acceptance_rate).'),
  ('w_response', 1, 'Weight: 1 - median response time / offer window, floored at 0.'),
  ('w_completion', 1, 'Weight: share of accepted jobs completed rather than cancelled by the professional.'),
  ('w_reliability', 1, 'Weight: 1 - share of accepted jobs the professional cancelled.'),
  ('w_rating', 1, 'Weight: rating_average / 5, used only once rating_count >= rating_min_reviews.'),
  ('rating_min_reviews', 3, 'Reviews needed before rating affects ranking or is shown. Suggested value; owner decision 7.'),
  ('metric_prior', 0.5, 'Value used for a rate the professional has no history for, so new professionals are not penalised.'),
  ('experience_cap_years', 10, 'Years of experience that earn the full experience component.'),
  ('emergency_enabled', 0, '1 allows urgency = emergency bookings. Off until owner decision 8.')
ON CONFLICT (key) DO NOTHING;

-- ── Decision log ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matching_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.professional_profiles(user_id) ON DELETE SET NULL,
  -- 'offered': professional_id was offered the job; 'unmatched': nobody was eligible.
  kind text NOT NULL CHECK (kind IN ('offered', 'unmatched')),
  pool_size int NOT NULL CHECK (pool_size >= 0),
  score numeric,
  geo_basis text CHECK (geo_basis IN ('distance', 'city')),
  distance_km numeric,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'offered') = (professional_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS matching_decisions_booking_idx ON public.matching_decisions (booking_id, created_at);
CREATE INDEX IF NOT EXISTS matching_decisions_job_pro_idx ON public.matching_decisions (job_id, professional_id);

ALTER TABLE public.matching_decisions ENABLE ROW LEVEL SECURITY;

-- Written only by SECURITY DEFINER functions. The inputs include other professionals'
-- metrics, so only admins read the log.
CREATE POLICY matching_decisions_select_admin ON public.matching_decisions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'::public.user_role));

-- ── Attempts ────────────────────────────────────────────────────────────────

ALTER TABLE public.booking_assignment_attempts
  ADD COLUMN IF NOT EXISTS reason_code text,
  ADD COLUMN IF NOT EXISTS decision_id uuid REFERENCES public.matching_decisions(id) ON DELETE SET NULL;

ALTER TABLE public.booking_assignment_attempts
  ADD CONSTRAINT booking_assignment_attempts_reason_code_check CHECK (
    reason_code IS NULL
    OR reason_code IN ('schedule_conflict', 'too_far', 'not_my_skill', 'need_more_detail', 'other')
  ),
  ADD CONSTRAINT booking_assignment_attempts_declined_reason CHECK (
    outcome <> 'declined' OR reason_code IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS booking_assignment_attempts_pro_idx
  ON public.booking_assignment_attempts (professional_id, outcome);
