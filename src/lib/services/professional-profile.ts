import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getProfessionalCompletedCount, one } from '@/lib/services/shell';

/**
 * The signed-in professional's own profile, as shown on /professional/profile and its edit
 * page. RLS limits every query to the professional's own rows.
 */

export interface ProfessionalProfileView {
  fullName: string | null;
  displayName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  memberSince: string | null;
  bio: string | null;
  yearsExperience: number | null;
  verificationStatus: string | null;
  isAvailable: boolean;
  /** Only meaningful when greater than zero; nothing writes it yet besides admin tooling. */
  ratingAverage: number | null;
  /** Counted from `jobs` (completed or paid); null when the count failed. */
  completedJobs: number | null;
  skills: { categoryId: string; name: string }[];
  error: boolean;
}

export const getProfessionalProfileView = cache(async (userId: string): Promise<ProfessionalProfileView> => {
  const supabase = await createClient();
  const [profileResult, proResult, skillsResult, completedJobs] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, avatar_url, created_at').eq('id', userId).maybeSingle(),
    supabase
      .from('professional_profiles')
      .select('display_name, bio, years_experience, verification_status, is_available, rating_average, created_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('professional_skills')
      .select('service_category_id, category:service_categories(name)')
      .eq('professional_id', userId),
    getProfessionalCompletedCount(userId),
  ]);

  const profile = profileResult.data;
  const pro = proResult.data;

  const skills = new Map<string, string>();
  for (const row of skillsResult.data ?? []) {
    const name = one(row.category)?.name;
    if (name && !skills.has(row.service_category_id)) skills.set(row.service_category_id, name);
  }

  const rating = pro?.rating_average == null ? null : Number(pro.rating_average);

  return {
    fullName: profile?.full_name ?? null,
    displayName: pro?.display_name ?? null,
    phone: profile?.phone ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    memberSince: pro?.created_at ?? profile?.created_at ?? null,
    bio: pro?.bio ?? null,
    yearsExperience: pro?.years_experience ?? null,
    verificationStatus: pro?.verification_status ?? null,
    isAvailable: pro?.is_available ?? false,
    ratingAverage: rating !== null && rating > 0 ? rating : null,
    completedJobs,
    skills: Array.from(skills, ([categoryId, name]) => ({ categoryId, name })).sort((a, b) => a.name.localeCompare(b.name)),
    error: Boolean(profileResult.error || proResult.error || skillsResult.error),
  };
});
