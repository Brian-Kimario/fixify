-- MIGRATION 002: Properties and Services Schema
-- Phase 2A: Foundation
-- Created: 2026-09-24

-- ============================================================================
-- ADDRESSES TABLE (referenced by properties)
-- ============================================================================

CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  label text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  area text,
  city text NOT NULL,
  state_region text,
  postal_code text,
  
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  access_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_addresses_customer ON public.addresses(customer_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- RLS: Customer owns their addresses
CREATE POLICY addresses_select_own ON public.addresses
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY addresses_insert_own ON public.addresses
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY addresses_update_own ON public.addresses
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY addresses_delete_own ON public.addresses
  FOR DELETE
  USING (customer_id = auth.uid());

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  property_type text NOT NULL,
  -- house, apartment, office, shop, rental, other
  
  address_id uuid NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_properties_customer ON public.properties(owner_customer_id);
CREATE INDEX idx_properties_address ON public.properties(address_id);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS: Customer owns their properties
CREATE POLICY properties_select_own ON public.properties
  FOR SELECT
  USING (owner_customer_id = auth.uid());

CREATE POLICY properties_insert_own ON public.properties
  FOR INSERT
  WITH CHECK (owner_customer_id = auth.uid());

CREATE POLICY properties_update_own ON public.properties
  FOR UPDATE
  USING (owner_customer_id = auth.uid())
  WITH CHECK (owner_customer_id = auth.uid());

CREATE POLICY properties_delete_own ON public.properties
  FOR DELETE
  USING (owner_customer_id = auth.uid());

-- ============================================================================
-- PROPERTY_ASSETS TABLE (Optional/Future)
-- ============================================================================

CREATE TABLE public.property_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  category text NOT NULL,
  name text NOT NULL,
  brand text,
  model text,
  serial_number text,
  
  installed_at date,
  warranty_expires_at date,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_assets_property ON public.property_assets(property_id);

ALTER TABLE public.property_assets ENABLE ROW LEVEL SECURITY;

-- RLS: Owner can manage own property assets
CREATE POLICY property_assets_select_own ON public.property_assets
  FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_customer_id = auth.uid()
    )
  );

CREATE POLICY property_assets_insert_own ON public.property_assets
  FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_customer_id = auth.uid()
    )
  );

CREATE POLICY property_assets_update_own ON public.property_assets
  FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_customer_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_customer_id = auth.uid()
    )
  );

CREATE POLICY property_assets_delete_own ON public.property_assets
  FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_customer_id = auth.uid()
    )
  );

-- ============================================================================
-- SERVICE CATEGORIES TABLE
-- ============================================================================

CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon_key text,
  
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_categories_slug ON public.service_categories(slug);
CREATE INDEX idx_service_categories_active ON public.service_categories(is_active);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY service_categories_select_public ON public.service_categories
  FOR SELECT
  USING (true);

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  
  pricing_model text NOT NULL,
  -- fixed, inspection, quote_after_inspection
  
  base_price numeric(10, 2),
  inspection_fee numeric(10, 2),
  
  estimated_duration_minutes integer,
  requires_inspection boolean DEFAULT false,
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_services_category ON public.services(category_id);
CREATE INDEX idx_services_slug ON public.services(slug);
CREATE INDEX idx_services_active ON public.services(is_active);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY services_select_public ON public.services
  FOR SELECT
  USING (true);

-- ============================================================================
-- SERVICE_OPTIONS TABLE
-- ============================================================================

CREATE TABLE public.service_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  
  name text NOT NULL,
  option_type text NOT NULL,
  -- choice, text_input, number_slider
  
  is_required boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_options_service ON public.service_options(service_id);

ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY service_options_select_public ON public.service_options
  FOR SELECT
  USING (true);

-- ============================================================================
-- SERVICE_OPTION_VALUES TABLE
-- ============================================================================

CREATE TABLE public.service_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_option_id uuid NOT NULL REFERENCES public.service_options(id) ON DELETE CASCADE,
  
  label text NOT NULL,
  value text NOT NULL,
  price_modifier numeric(10, 2),
  
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_service_option_values_option ON public.service_option_values(service_option_id);

ALTER TABLE public.service_option_values ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY service_option_values_select_public ON public.service_option_values
  FOR SELECT
  USING (true);

-- ============================================================================
-- BRANDS TABLE
-- ============================================================================

CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY brands_select_public ON public.brands
  FOR SELECT
  USING (true);

-- ============================================================================
-- MATERIALS TABLE
-- ============================================================================

CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  
  specification text,
  unit text NOT NULL,
  -- piece, meter, kg, etc.
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_materials_brand ON public.materials(brand_id);
CREATE INDEX idx_materials_active ON public.materials(is_active);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY materials_select_public ON public.materials
  FOR SELECT
  USING (true);

-- ============================================================================
-- SERVICE_MATERIALS TABLE
-- ============================================================================

CREATE TABLE public.service_materials (
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  
  is_customer_selectable boolean DEFAULT false,
  is_professional_selectable boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (service_id, material_id)
);

CREATE INDEX idx_service_materials_service ON public.service_materials(service_id);
CREATE INDEX idx_service_materials_material ON public.service_materials(material_id);

ALTER TABLE public.service_materials ENABLE ROW LEVEL SECURITY;

-- RLS: Public read-only
CREATE POLICY service_materials_select_public ON public.service_materials
  FOR SELECT
  USING (true);

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.service_categories TO authenticated, anon;
GRANT SELECT ON public.services TO authenticated, anon;
GRANT SELECT ON public.service_options TO authenticated, anon;
GRANT SELECT ON public.service_option_values TO authenticated, anon;
GRANT SELECT ON public.brands TO authenticated, anon;
GRANT SELECT ON public.materials TO authenticated, anon;
GRANT SELECT ON public.service_materials TO authenticated, anon;

GRANT ALL ON public.addresses TO authenticated;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.property_assets TO authenticated;

-- Trigger for updated_at on addresses
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on properties
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on property_assets
CREATE TRIGGER update_property_assets_updated_at
  BEFORE UPDATE ON public.property_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on service_categories
CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on services
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on materials
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
