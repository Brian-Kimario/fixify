'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface UpdateProfileInput {
  fullName: string;
  phone: string;
  bio: string;
  yearsExperience: string;
  categoryIds: string[];
}

export interface UpdateProfileResult {
  success: boolean;
  error?: string;
}

const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves the signed-in professional's own profile.
 * The user id always comes from the session; nothing identifying is read from the input.
 */
export async function updateProfessionalProfileAction(
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const bio = input.bio.trim();
  const years = input.yearsExperience.trim() === '' ? null : Number(input.yearsExperience);
  const categoryIds = Array.from(new Set(input.categoryIds));

  if (fullName.length < 2 || fullName.length > 100) {
    return { success: false, error: 'Enter your full name (2–100 characters).' };
  }
  if (phone && !PHONE_PATTERN.test(phone)) {
    return { success: false, error: 'Enter a valid phone number.' };
  }
  if (bio.length > 500) {
    return { success: false, error: 'Bio must be 500 characters or fewer.' };
  }
  if (years !== null && (!Number.isInteger(years) || years < 0 || years > 60)) {
    return { success: false, error: 'Years of experience must be a whole number from 0 to 60.' };
  }
  if (categoryIds.some((id) => !UUID_PATTERN.test(id))) {
    return { success: false, error: 'Invalid skill selection.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in again.' };

  const { data: pro } = await supabase
    .from('professional_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!pro) return { success: false, error: 'Professional profile not found.' };

  // Only accept categories that exist and are active.
  let validCategoryIds: string[] = [];
  if (categoryIds.length > 0) {
    const { data: cats, error: catError } = await supabase
      .from('service_categories')
      .select('id')
      .in('id', categoryIds)
      .eq('is_active', true);
    if (catError) return { success: false, error: 'Could not check skills. Try again.' };
    validCategoryIds = (cats ?? []).map((c) => c.id);
    if (validCategoryIds.length !== categoryIds.length) {
      return { success: false, error: 'One of the selected skills is no longer available.' };
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null })
    .eq('id', user.id);
  if (profileError) {
    console.error('updateProfessionalProfileAction profiles:', profileError.message);
    return { success: false, error: 'Could not save your details. Try again.' };
  }

  const { error: proError } = await supabase
    .from('professional_profiles')
    .update({ display_name: fullName, bio: bio || null, years_experience: years })
    .eq('user_id', user.id);
  if (proError) {
    console.error('updateProfessionalProfileAction professional_profiles:', proError.message);
    return { success: false, error: 'Could not save your profile. Try again.' };
  }

  // Sync category-level skills (service_id null). Insert new first, then remove dropped ones,
  // so a failure never leaves the professional with fewer skills than they had.
  const { data: existing, error: existingError } = await supabase
    .from('professional_skills')
    .select('id, service_category_id')
    .eq('professional_id', user.id)
    .is('service_id', null);
  if (existingError) {
    return { success: false, error: 'Details saved, but skills could not be updated.' };
  }

  const have = new Set((existing ?? []).map((s) => s.service_category_id));
  const toAdd = validCategoryIds.filter((id) => !have.has(id));
  const toRemove = (existing ?? [])
    .filter((s) => !validCategoryIds.includes(s.service_category_id))
    .map((s) => s.id);

  if (toAdd.length > 0) {
    const { error } = await supabase.from('professional_skills').insert(
      toAdd.map((service_category_id) => ({
        professional_id: user.id,
        service_category_id,
      }))
    );
    if (error) {
      console.error('updateProfessionalProfileAction add skills:', error.message);
      return { success: false, error: 'Details saved, but skills could not be updated.' };
    }
  }
  if (toRemove.length > 0) {
    const { error } = await supabase.from('professional_skills').delete().in('id', toRemove);
    if (error) {
      console.error('updateProfessionalProfileAction remove skills:', error.message);
      return { success: false, error: 'Details saved, but some skills could not be removed.' };
    }
  }

  revalidatePath('/professional/profile');
  return { success: true };
}
