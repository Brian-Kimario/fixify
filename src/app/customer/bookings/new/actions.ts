'use server';

import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import { createBookingSchema, type CreateBookingInput } from '@/validators';

export type { CreateBookingInput };

// ── Output shape ────────────────────────────────────────────────────────────

export interface CreateBookingOutput {
  bookingId: string;
  bookingReference: string;
  /** True when a professional has already been offered the job. */
  matched: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateBookingReference(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `BK-${now}-${rand}`;
}

// ── Server action ─────────────────────────────────────────────────────────────

/**
 * createBookingAction
 *
 * Security:
 *  - Validates input with createBookingSchema; expected failures return a typed result
 *  - Fetches service price from DB — never trusts client-submitted price
 *  - Verifies property ownership via RLS + explicit eq check
 *  - All amounts persisted from DB, not from form input
 */
export async function createBookingAction(
  payload: CreateBookingInput
): Promise<ActionResult<CreateBookingOutput>> {
  const parsed = parseInput(createBookingSchema, payload);
  if (parsed.success === false) return parsed;
  const input = parsed.data;

  const supabase = await createClient();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail('unauthenticated', 'Not authenticated. Please sign in.');
  }

  // ── Validate service (fetch price server-side) ──────────────────────────────
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, pricing_model, base_price, inspection_fee, is_active, category_id')
    .eq('id', input.serviceId)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    return fail('not_found', 'Service not found or is no longer available.');
  }

  // ── Validate property ownership ─────────────────────────────────────────────
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', input.propertyId)
    .eq('owner_customer_id', user.id)
    .single();

  if (propertyError || !property) {
    return fail('not_found', 'Property not found or does not belong to your account.');
  }

  // ── Validate scheduled date (must be in the future) ─────────────────────────
  const scheduledDate = new Date(input.scheduledStart);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return fail('invalid_input', 'Please choose a future date and time for your booking.');
  }

  // ── Derive authoritative price from DB (never from client) ─────────────────
  const pricingModel = service.pricing_model as
    | 'fixed'
    | 'inspection'
    | 'quote_after_inspection';

  const authoritative_amount: number | null =
    pricingModel === 'fixed'
      ? service.base_price
      : pricingModel === 'inspection'
        ? service.inspection_fee
        : null; // quote_after_inspection — amount determined post-inspection

  // ── Create booking ──────────────────────────────────────────────────────────
  const bookingReference = generateBookingReference();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_reference: bookingReference,
      customer_id: user.id,
      property_id: property.id,
      service_id: service.id,
      scheduled_start: scheduledDate.toISOString(),
      pricing_model: pricingModel,
      quoted_or_base_amount: authoritative_amount,
      booking_status: 'pending',
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    console.error('Booking insert error:', bookingError);
    return fail('failed', 'We could not create your booking. Please try again.');
  }

  // ── Offer the job to the best-matching professional ─────────────────────────
  // A failure here must not fail the booking: unmatched bookings are retried
  // by the assignment queue (/api/cron/assignment-queue).
  let matched = false;
  const { data: assignment, error: assignError } = await supabase.rpc('assign_booking', {
    p_booking_id: booking.id,
  });
  if (assignError) {
    console.error('assign_booking error:', assignError.message);
  } else {
    matched = Boolean((assignment as unknown as { matched?: boolean } | null)?.matched);
  }

  // Client will handle navigation after showing success state
  return ok({
    bookingId: booking.id,
    bookingReference,
    matched,
  });
}
