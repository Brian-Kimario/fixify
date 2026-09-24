-- MIGRATION 003: Professionals and Verification Schema
-- Phase 2A: Foundation
-- Created: 2026-09-24

-- ============================================================================
-- PROFESSIONAL_PROFILES TABLE
-- ============================================================================

CREATE TABLE public.professional_profiles (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  display_name text NOT NULL,
  bio text,
  years_experience integer,
  
  rating_average numeric(3, 2) DEFAULT 0,
  completed_jobs_count integer DEFAULT 0,
  
  verification_status text NOT NULL DEFAULT 'pending',
  -- pending, documents_submitted, under_review, verified, rejected, suspended
  
  is_available boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Professional reads own; public can see verified professionals
CREATE POLICY professional_profiles_select_own ON public.professional_profiles
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR verification_status = 'verified'
  );

-- INSERT: Professional creates own profile
CREATE POLICY professional_profiles_insert_own ON public.professional_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Professional can only update specific fields
CREATE POLICY professional_profiles_update_own ON public.professional_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- PROFESSIONAL_SKILLS TABLE
-- ============================================================================

CREATE TABLE public.professional_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  service_category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  
  skill_level text,
  -- beginner, intermediate, advanced, expert
  
  verified boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_professional_skills_professional ON public.professional_skills(professional_id);
CREATE INDEX idx_professional_skills_category ON public.professional_skills(service_category_id);
CREATE INDEX idx_professional_skills_service ON public.professional_skills(service_id);
CREATE INDEX idx_professional_skills_verified ON public.professional_skills(verified);

ALTER TABLE public.professional_skills ENABLE ROW LEVEL SECURITY;

-- RLS: Professional reads own; public sees verified skills
CREATE POLICY professional_skills_select_own ON public.professional_skills
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR (
      verified = true
      AND professional_id IN (
        SELECT user_id FROM public.professional_profiles WHERE verification_status = 'verified'
      )
    )
  );

-- INSERT: Professional adds own skills
CREATE POLICY professional_skills_insert_own ON public.professional_skills
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- ============================================================================
-- PROFESSIONAL_VERIFICATIONS TABLE
-- ============================================================================

CREATE TABLE public.professional_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  status text NOT NULL DEFAULT 'pending',
  -- pending, documents_submitted, under_review, verified, rejected, suspended
  
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  rejection_reason text,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_professional_verifications_professional ON public.professional_verifications(professional_id);
CREATE INDEX idx_professional_verifications_status ON public.professional_verifications(status);

ALTER TABLE public.professional_verifications ENABLE ROW LEVEL SECURITY;

-- RLS: Professional reads own; admin reads all
CREATE POLICY professional_verifications_select_own ON public.professional_verifications
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- PROFESSIONAL_VERIFICATION_DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE public.professional_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.professional_verifications(id) ON DELETE CASCADE,
  
  document_type text NOT NULL,
  -- license, insurance, id, background_check, other
  
  storage_path text NOT NULL,
  status text DEFAULT 'pending',
  -- pending, accepted, rejected
  
  uploaded_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_notes text
);

CREATE INDEX idx_verification_documents_verification ON public.professional_verification_documents(verification_id);
CREATE INDEX idx_verification_documents_type ON public.professional_verification_documents(document_type);
CREATE INDEX idx_verification_documents_status ON public.professional_verification_documents(status);

ALTER TABLE public.professional_verification_documents ENABLE ROW LEVEL SECURITY;

-- RLS: Professional reads own; admin reads all
CREATE POLICY verification_documents_select_own ON public.professional_verification_documents
  FOR SELECT
  USING (
    verification_id IN (
      SELECT id FROM public.professional_verifications WHERE professional_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- INSERT: Professional uploads own documents
CREATE POLICY verification_documents_insert_own ON public.professional_verification_documents
  FOR INSERT
  WITH CHECK (
    verification_id IN (
      SELECT id FROM public.professional_verifications WHERE professional_id = auth.uid()
    )
  );

-- ============================================================================
-- PROFESSIONAL_AVAILABILITY TABLE
-- ============================================================================

CREATE TABLE public.professional_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  day_of_week smallint NOT NULL,
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  start_time time NOT NULL,
  end_time time NOT NULL,
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_professional_availability_professional ON public.professional_availability(professional_id);
CREATE INDEX idx_professional_availability_day ON public.professional_availability(day_of_week);

ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;

-- RLS: Professional manages own; public sees active
CREATE POLICY professional_availability_select_own ON public.professional_availability
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR (
      is_active = true
      AND professional_id IN (
        SELECT user_id FROM public.professional_profiles WHERE verification_status = 'verified'
      )
    )
  );

-- INSERT: Professional adds own
CREATE POLICY professional_availability_insert_own ON public.professional_availability
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- UPDATE: Professional modifies own
CREATE POLICY professional_availability_update_own ON public.professional_availability
  FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- DELETE: Professional deletes own
CREATE POLICY professional_availability_delete_own ON public.professional_availability
  FOR DELETE
  USING (professional_id = auth.uid());

-- ============================================================================
-- PROFESSIONAL_SERVICE_AREAS TABLE
-- ============================================================================

CREATE TABLE public.professional_service_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  city text NOT NULL,
  area text,
  radius_km numeric(5, 2),
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_professional_service_areas_professional ON public.professional_service_areas(professional_id);
CREATE INDEX idx_professional_service_areas_city ON public.professional_service_areas(city);

ALTER TABLE public.professional_service_areas ENABLE ROW LEVEL SECURITY;

-- RLS: Professional manages own; public sees active for verified professionals
CREATE POLICY professional_service_areas_select_own ON public.professional_service_areas
  FOR SELECT
  USING (
    professional_id = auth.uid()
    OR (
      is_active = true
      AND professional_id IN (
        SELECT user_id FROM public.professional_profiles WHERE verification_status = 'verified'
      )
    )
  );

-- INSERT: Professional adds own
CREATE POLICY professional_service_areas_insert_own ON public.professional_service_areas
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- UPDATE: Professional modifies own
CREATE POLICY professional_service_areas_update_own ON public.professional_service_areas
  FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- DELETE: Professional deletes own
CREATE POLICY professional_service_areas_delete_own ON public.professional_service_areas
  FOR DELETE
  USING (professional_id = auth.uid());

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Update updated_at on professional_profiles
CREATE TRIGGER update_professional_profiles_updated_at
  BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on professional_skills
CREATE TRIGGER update_professional_skills_updated_at
  BEFORE UPDATE ON public.professional_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on professional_verifications
CREATE TRIGGER update_professional_verifications_updated_at
  BEFORE UPDATE ON public.professional_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on professional_availability
CREATE TRIGGER update_professional_availability_updated_at
  BEFORE UPDATE ON public.professional_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update updated_at on professional_service_areas
CREATE TRIGGER update_professional_service_areas_updated_at
  BEFORE UPDATE ON public.professional_service_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

GRANT ALL ON public.professional_profiles TO authenticated;
GRANT ALL ON public.professional_skills TO authenticated;
GRANT ALL ON public.professional_verifications TO authenticated;
GRANT ALL ON public.professional_verification_documents TO authenticated;
GRANT ALL ON public.professional_availability TO authenticated;
GRANT ALL ON public.professional_service_areas TO authenticated;

GRANT SELECT ON public.professional_profiles TO anon;
GRANT SELECT ON public.professional_skills TO anon;
GRANT SELECT ON public.professional_availability TO anon;
GRANT SELECT ON public.professional_service_areas TO anon;
