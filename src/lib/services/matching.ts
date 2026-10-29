import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

/**
 * Customer-facing reads from matching v2. Each goes through a SECURITY DEFINER RPC that
 * checks the caller owns the booking, so these use the RLS-scoped server client.
 */

const bookingProfessionalSchema = z.object({
  professional_id: z.string(),
  display_name: z.string().nullable(),
  verified: z.boolean().nullable(),
  years_experience: z.number().nullable(),
  skills: z.array(z.string()).nullable(),
  jobs_completed: z.number().nullable(),
  median_response_seconds: z.number().nullable(),
  // Null until rating_count reaches matching_config.rating_min_reviews.
  rating_average: z.number().nullable(),
  rating_count: z.number().nullable(),
});

export interface BookingProfessional {
  id: string;
  displayName: string;
  verified: boolean;
  yearsExperience: number | null;
  skills: string[];
  jobsCompleted: number;
  medianResponseSeconds: number | null;
  rating: { average: number; count: number } | null;
}

/** The professional offered or assigned to the caller's booking, or null if there is none. */
export async function getBookingProfessional(bookingId: string): Promise<BookingProfessional | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_booking_professional', { p_booking_id: bookingId });
  if (error) {
    console.error('getBookingProfessional:', error.message);
    return null;
  }
  if (data == null) return null;

  const parsed = bookingProfessionalSchema.safeParse(data);
  if (!parsed.success) {
    console.error('getBookingProfessional: unexpected shape', parsed.error.issues[0]?.message);
    return null;
  }
  const p = parsed.data;
  return {
    id: p.professional_id,
    displayName: p.display_name || 'Your professional',
    verified: p.verified === true,
    yearsExperience: p.years_experience,
    skills: p.skills ?? [],
    jobsCompleted: p.jobs_completed ?? 0,
    medianResponseSeconds: p.median_response_seconds,
    rating:
      p.rating_average != null && p.rating_count != null
        ? { average: p.rating_average, count: p.rating_count }
        : null,
  };
}
