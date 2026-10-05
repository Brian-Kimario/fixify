-- MIGRATION: Add status column to properties table
-- Date: 2026-10-05
-- Purpose: Enable property lifecycle management (active, inactive, maintenance states)

ALTER TABLE public.properties
ADD COLUMN status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'maintenance'));

-- Create index for status filtering
CREATE INDEX idx_properties_status ON public.properties(status);

-- Add comment
COMMENT ON COLUMN public.properties.status IS 'Property lifecycle state: active (available for jobs), inactive (not available), maintenance (under maintenance)';
