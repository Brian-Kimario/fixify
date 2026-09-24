-- MIGRATION 004: Bookings and Jobs Schema
-- Phase 2A: Foundation
-- Created: 2026-09-24

-- ============================================================================
-- SERVICE_REQUESTS TABLE (for future AI intake; optional for MVP)
-- ============================================================================

CREATE TABLE public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  input_text text,
  normalized_summary text,
  suggested_category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL,
  suggested_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  
  classification_confidence text,
  -- low, moderate, high
  
  intake_source text,
  -- manual, ai, voice, media
  
  status text DEFAULT 'draft',
  -- draft, ready, converted, cancelled
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_requests_customer ON public.service_requests(customer_id);
CREATE INDEX idx_service_requests_property ON public.service_requests(property_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Customer owns their service requests
CREATE POLICY service_requests_select_own ON public.service_requests
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY service_requests_insert_own ON public.service_requests
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY service_requests_update_own ON public.service_requests
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text NOT NULL UNIQUE,
  
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  service_request_id uuid REFERENCES public.service_requests(id) ON DELETE SET NULL,
  
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  professional_id uuid REFERENCES public.professional_profiles(user_id) ON DELETE SET NULL,
  
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz,
  
  pricing_model text NOT NULL,
  -- fixed, inspection, quote_after_inspection
  
  quoted_or_base_amount numeric(10, 2),
  
  booking_status text NOT NULL DEFAULT 'pending',
  -- pending, accepted, in_progress, completed, cancelled
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_property ON public.bookings(property_id);
CREATE INDEX idx_bookings_professional ON public.bookings(professional_id);
CREATE INDEX idx_bookings_service ON public.bookings(service_id);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_reference ON public.bookings(booking_reference);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional see own bookings
CREATE POLICY bookings_select_own ON public.bookings
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR professional_id = auth.uid()
  );

-- INSERT: Customer creates booking
CREATE POLICY bookings_insert_customer ON public.bookings
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- UPDATE: Customer/professional can update (app layer validates what can be updated)
CREATE POLICY bookings_update_own ON public.bookings
  FOR UPDATE
  USING (customer_id = auth.uid() OR professional_id = auth.uid())
  WITH CHECK (customer_id = auth.uid() OR professional_id = auth.uid());

-- ============================================================================
-- JOBS TABLE
-- ============================================================================

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  current_state text NOT NULL DEFAULT 'assigned',
  -- assigned, accepted, on_the_way, arrived, in_progress, quote_pending, completed, cancelled
  
  accepted_at timestamptz,
  on_the_way_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  
  closed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_jobs_customer ON public.jobs(customer_id);
CREATE INDEX idx_jobs_professional ON public.jobs(professional_id);
CREATE INDEX idx_jobs_booking ON public.jobs(booking_id);
CREATE INDEX idx_jobs_state ON public.jobs(current_state);
CREATE INDEX idx_jobs_completed_at ON public.jobs(completed_at);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional see own jobs
CREATE POLICY jobs_select_own ON public.jobs
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR professional_id = auth.uid()
  );

-- UPDATE: Restricted to state machine function (app layer enforces)
CREATE POLICY jobs_update_restricted ON public.jobs
  FOR UPDATE
  USING (
    customer_id = auth.uid()
    OR professional_id = auth.uid()
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR professional_id = auth.uid()
  );

-- ============================================================================
-- JOB_EVENTS TABLE (Immutable Log)
-- ============================================================================

CREATE TABLE public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  from_state text NOT NULL,
  to_state text NOT NULL,
  
  actor_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_events_job ON public.job_events(job_id);
CREATE INDEX idx_job_events_state ON public.job_events(to_state);
CREATE INDEX idx_job_events_created_at ON public.job_events(created_at);

ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional view events of own jobs
CREATE POLICY job_events_select_own ON public.job_events
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE customer_id = auth.uid() OR professional_id = auth.uid()
    )
  );

-- ============================================================================
-- INSPECTIONS TABLE
-- ============================================================================

CREATE TABLE public.inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  findings text NOT NULL,
  recommendation text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_inspections_job ON public.inspections(job_id);
CREATE INDEX idx_inspections_professional ON public.inspections(professional_id);

ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional view own
CREATE POLICY inspections_select_own ON public.inspections
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE customer_id = auth.uid() OR professional_id = auth.uid()
    )
  );

-- INSERT: Professional creates
CREATE POLICY inspections_insert_own ON public.inspections
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- ============================================================================
-- QUOTES TABLE
-- ============================================================================

CREATE TABLE public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professional_profiles(user_id) ON DELETE CASCADE,
  
  subtotal numeric(10, 2) NOT NULL,
  taxes_or_fees numeric(10, 2) DEFAULT 0,
  discount numeric(10, 2) DEFAULT 0,
  total numeric(10, 2) NOT NULL,
  
  reason text NOT NULL,
  
  status text NOT NULL DEFAULT 'pending_customer',
  -- draft, pending_customer, approved, declined, expired, cancelled
  
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quotes_job ON public.quotes(job_id);
CREATE INDEX idx_quotes_professional ON public.quotes(professional_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_expires_at ON public.quotes(expires_at);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional view own
CREATE POLICY quotes_select_own ON public.quotes
  FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.jobs WHERE customer_id = auth.uid() OR professional_id = auth.uid()
    )
  );

-- INSERT: Professional creates
CREATE POLICY quotes_insert_professional ON public.quotes
  FOR INSERT
  WITH CHECK (professional_id = auth.uid());

-- UPDATE: Professional updates draft; customer approves/declines
CREATE POLICY quotes_update_professional ON public.quotes
  FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (professional_id = auth.uid());

-- ============================================================================
-- QUOTE_ITEMS TABLE
-- ============================================================================

CREATE TABLE public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  
  item_type text NOT NULL,
  -- labour, material, service, fee
  
  description text NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  line_total numeric(10, 2) NOT NULL,
  
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- RLS: Customer/professional view items of own quotes
CREATE POLICY quote_items_select_own ON public.quote_items
  FOR SELECT
  USING (
    quote_id IN (
      SELECT id FROM public.quotes WHERE job_id IN (
        SELECT id FROM public.jobs WHERE customer_id = auth.uid() OR professional_id = auth.uid()
      )
    )
  );

-- INSERT: Professional adds items
CREATE POLICY quote_items_insert_professional ON public.quote_items
  FOR INSERT
  WITH CHECK (
    quote_id IN (
      SELECT id FROM public.quotes WHERE professional_id = auth.uid()
    )
  );

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL,
  
  payment_type text NOT NULL,
  -- inspection, service, material, additional_work, subscription
  
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  
  provider text NOT NULL,
  provider_reference text NOT NULL UNIQUE,
  
  status text NOT NULL DEFAULT 'pending',
  -- pending, processing, paid, failed, refunded, partially_refunded
  
  paid_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_customer ON public.payments(customer_id);
CREATE INDEX idx_payments_job ON public.payments(job_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_provider_ref ON public.payments(provider_reference);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS: Customer views own; admin views all
CREATE POLICY payments_select_own ON public.payments
  FOR SELECT
  USING (
    customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support')
    )
  );

-- ============================================================================
-- STATE MACHINE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.transition_job_state(
  p_job_id uuid,
  p_new_state text,
  p_actor_user_id uuid,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_state text;
  v_valid boolean := false;
BEGIN
  -- Get current state
  SELECT current_state INTO v_current_state
  FROM public.jobs
  WHERE id = p_job_id
  FOR UPDATE;
  
  -- Validate state transition
  IF (v_current_state = 'assigned' AND p_new_state IN ('accepted', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'accepted' AND p_new_state IN ('on_the_way', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'on_the_way' AND p_new_state IN ('arrived', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'arrived' AND p_new_state IN ('in_progress', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'in_progress' AND p_new_state IN ('quote_pending', 'completed', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'quote_pending' AND p_new_state IN ('in_progress', 'cancelled')) THEN
    v_valid := true;
  ELSIF (v_current_state = 'completed' AND p_new_state = 'closed') THEN
    v_valid := true;
  ELSIF (v_current_state = 'cancelled' AND p_new_state = 'closed') THEN
    v_valid := true;
  END IF;
  
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid state transition from % to %', v_current_state, p_new_state;
  END IF;
  
  -- Update job state and timestamps
  UPDATE public.jobs
  SET 
    current_state = p_new_state,
    updated_at = now(),
    accepted_at = CASE WHEN p_new_state = 'accepted' THEN now() ELSE accepted_at END,
    on_the_way_at = CASE WHEN p_new_state = 'on_the_way' THEN now() ELSE on_the_way_at END,
    arrived_at = CASE WHEN p_new_state = 'arrived' THEN now() ELSE arrived_at END,
    started_at = CASE WHEN p_new_state = 'in_progress' THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_new_state = 'completed' THEN now() ELSE completed_at END,
    cancelled_at = CASE WHEN p_new_state = 'cancelled' THEN now() ELSE cancelled_at END,
    closed_at = CASE WHEN p_new_state IN ('completed', 'cancelled') THEN now() ELSE closed_at END
  WHERE id = p_job_id;
  
  -- Create immutable event log entry
  INSERT INTO public.job_events (job_id, from_state, to_state, actor_user_id, event_type, metadata)
  VALUES (p_job_id, v_current_state, p_new_state, p_actor_user_id, 'state_transition', p_metadata);
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.job_events TO authenticated;
GRANT ALL ON public.inspections TO authenticated;
GRANT ALL ON public.quotes TO authenticated;
GRANT ALL ON public.quote_items TO authenticated;
GRANT ALL ON public.payments TO authenticated;

GRANT EXECUTE ON FUNCTION public.transition_job_state TO authenticated;
