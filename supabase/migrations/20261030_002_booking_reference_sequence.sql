-- Booking references come from a sequence instead of Date.now() + Math.random() in the app.
-- Existing rows keep their BK-/TEST- references; new rows get FS-000001, FS-000002, ...
CREATE SEQUENCE IF NOT EXISTS public.booking_reference_seq AS bigint START 1;

-- Customers insert bookings directly (RLS bookings_insert_customer), so the column default
-- runs as the authenticated role and needs USAGE on the sequence.
GRANT USAGE ON SEQUENCE public.booking_reference_seq TO authenticated, service_role;

ALTER TABLE public.bookings
  ALTER COLUMN booking_reference
  SET DEFAULT 'FS-' || lpad(nextval('public.booking_reference_seq')::text, 6, '0');
