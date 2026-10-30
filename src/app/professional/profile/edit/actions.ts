'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import { professionalProfileSchema, type ProfessionalProfileInput } from '@/validators';

/**
 * Saves the signed-in professional's own profile.
 * The user id always comes from the session; nothing identifying is read from the input.
 */
export async function updateProfessionalProfileAction(input: ProfessionalProfileInput): Promise<ActionResult> {
  const parsed = parseInput(professionalProfileSchema, input);
  if (parsed.success === false) return parsed;
  const { fullName, phone, bio, yearsExperience, categoryIds } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Please sign in again.');

  const { data: pro } = await supabase
    .from('professional_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!pro) return fail('not_found', 'Professional profile not found.');

  // Only accept categories that exist and are active.
  if (categoryIds.length > 0) {
    const { data: cats, error: catError } = await supabase
      .from('service_categories')
      .select('id')
      .in('id', categoryIds)
      .eq('is_active', true);
    if (catError) return fail('failed', 'Could not check skills. Try again.');
    if ((cats ?? []).length !== categoryIds.length) {
      return fail('rejected', 'One of the selected skills is no longer available.');
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone })
    .eq('id', user.id);
  if (profileError) return fail('failed', 'Could not save your details. Try again.');

  const { error: proError } = await supabase
    .from('professional_profiles')
    .update({ display_name: fullName, bio, years_experience: yearsExperience })
    .eq('user_id', user.id);
  if (proError) return fail('failed', 'Could not save your profile. Try again.');

  // Matching treats any skill row in a category as covering the whole category, so the form
  // edits categories: a new one gets a category-level row, a dropped one loses every row in it
  // (service-level rows included). Insert first, then remove, so a failure never leaves the
  // professional with fewer skills than they had.
  const { data: existing, error: existingError } = await supabase
    .from('professional_skills')
    .select('id, service_category_id')
    .eq('professional_id', user.id);
  if (existingError) return fail('failed', 'Details saved, but skills could not be updated.');

  const have = new Set((existing ?? []).map((s) => s.service_category_id));
  const toAdd = categoryIds.filter((id) => !have.has(id));
  const toRemove = (existing ?? []).filter((s) => !categoryIds.includes(s.service_category_id)).map((s) => s.id);

  if (toAdd.length > 0) {
    const { error } = await supabase
      .from('professional_skills')
      .insert(toAdd.map((service_category_id) => ({ professional_id: user.id, service_category_id })));
    if (error) return fail('failed', 'Details saved, but skills could not be updated.');
  }
  if (toRemove.length > 0) {
    const { error } = await supabase.from('professional_skills').delete().in('id', toRemove);
    if (error) return fail('failed', 'Details saved, but some skills could not be removed.');
  }

  revalidatePath('/professional/profile');
  revalidatePath('/professional', 'layout');
  return ok();
}
