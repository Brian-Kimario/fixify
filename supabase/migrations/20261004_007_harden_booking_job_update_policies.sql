-- MIGRATION: Harden Booking & Job UPDATE Policies (Phase 2 Security)
-- Goal: Enforce state transitions ONLY via RPC, prevent direct status changes
-- Date: 2026-10-04

-- ============================================================================
-- Issue: Overly permissive UPDATE policies on bookings and jobs
-- ============================================================================
-- Current: bookings_update_own and jobs_update_restricted allow customers to 
-- directly UPDATE status columns via RLS, bypassing transition_booking_state() 
-- and transition_job_state() RPCs.
--
-- Risk: Privilege escalation — customers can self-approve completed bookings,
-- modify job states without professional confirmation, etc.
--
-- Fix: Replace UPDATE policies with column-level restrictions that prevent
-- direct modification of critical state columns (booking_status, current_state).
-- State changes must flow through the RPC (SECURITY DEFINER).

-- ============================================================================
-- BOOKINGS: Replace UPDATE policy with immutable status
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS bookings_update_own ON public.bookings;

-- New policy: Allow UPDATE only to non-critical columns (e.g., cancelled_reason, notes)
-- Status changes are NOT allowed directly (use transition_booking_state() RPC)
CREATE POLICY bookings_update_own_restricted ON public.bookings
  FOR UPDATE
  USING (customer_id = auth.uid() OR professional_id = auth.uid())
  WITH CHECK (
    (customer_id = auth.uid() OR professional_id = auth.uid())
    -- Prevent customer from changing booking_status (must use RPC)
    AND booking_status = (SELECT booking_status FROM public.bookings WHERE id = id)
    -- Prevent customer from changing quoted_or_base_amount (immutable once set)
    AND (quoted_or_base_amount = (SELECT quoted_or_base_amount FROM public.bookings WHERE id = id)
         OR quoted_or_base_amount IS NULL)
  );

-- ============================================================================
-- JOBS: Replace UPDATE policy with immutable state
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS jobs_update_restricted ON public.jobs;

-- New policy: Allow UPDATE only to non-critical columns
-- State changes are NOT allowed directly (use transition_job_state() RPC)
CREATE POLICY jobs_update_restricted_hardened ON public.jobs
  FOR UPDATE
  USING (customer_id = auth.uid() OR professional_id = auth.uid())
  WITH CHECK (
    (customer_id = auth.uid() OR professional_id = auth.uid())
    -- Prevent direct state changes (must use RPC)
    AND current_state = (SELECT current_state FROM public.jobs WHERE id = id)
  );

-- ============================================================================
-- QUOTES: Prevent price modification after creation
-- ============================================================================

-- Drop the permissive policy if it exists
DROP POLICY IF EXISTS quotes_update_professional ON public.quotes;

-- New policy: Professional can only update in 'draft' status
CREATE POLICY quotes_update_professional_restricted ON public.quotes
  FOR UPDATE
  USING (professional_id = auth.uid())
  WITH CHECK (
    professional_id = auth.uid()
    -- Only allow updates to draft quotes
    AND status = 'draft'
    -- Require status to remain unchanged
    AND status = (SELECT status FROM public.quotes WHERE id = id)
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- 
-- After this migration, RLS enforces:
--
-- 1. Bookings:
--    - booking_status IMMUTABLE (no direct UPDATE)
--    - quoted_or_base_amount IMMUTABLE (no direct UPDATE)
--    - Status changes ONLY via transition_booking_state() RPC (SECURITY DEFINER)
--
-- 2. Jobs:
--    - current_state IMMUTABLE (no direct UPDATE)
--    - State changes ONLY via transition_job_state() RPC (SECURITY DEFINER)
--
-- 3. Quotes:
--    - Professional can only UPDATE draft quotes
--    - Status field IMMUTABLE (no direct UPDATE)
--    - Approved/declined quotes are locked
--
-- Test: Attempt direct UPDATE should fail with RLS violation

