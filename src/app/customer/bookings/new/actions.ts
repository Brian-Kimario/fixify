'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ── Input shape ──────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  serviceId: string;
  propertyId: string;
  scheduledStart: string; // ISO-8601
  /** Selected service option values keyed by option id */
  selectedOptions?: Record<string, string>;
  notes?: string;
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
 *  - Authenticates via Supabase Auth (throws if not logged in)
 *  - Fetches service price from DB — never trusts client-submitted price
 *  - Verifies property ownership via RLS + explicit eq check
 *  - All amounts persisted from DB, not from form input
 */
export async function createBookingAction(
  input: CreateBookingInput
): Promise<{ bookingId: string }> {
  const supabase = await createClient();

  // ── Auth ────────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Not authenticated. Please sign in.');
  }

  // ── Validate service (fetch price server-side) ──────────────────────────────
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, pricing_model, base_price, inspection_fee, is_active, category_id')
    .eq('id', input.serviceId)
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    throw new Error('Service not found or is no longer available.');
  }

  // ── Validate property ownership ─────────────────────────────────────────────
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id, name')
    .eq('id', input.propertyId)
    .eq('owner_customer_id', user.id)
    .single();

  if (propertyError || !property) {
    throw new Error('Property not found or does not belong to your account.');
  }

  // ── Validate scheduled date (must be in the future) ─────────────────────────
  const scheduledDate = new Date(input.scheduledStart);
  if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throw new Error('Please choose a future date and time for your booking.');
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
    throw new Error(`Failed to create booking: ${bookingError?.message ?? 'Unknown error'}`);
  }

  // ── Redirect to confirmation page ───────────────────────────────────────────
  redirect(`/customer/bookings/${booking.id}?new=1`);
}
