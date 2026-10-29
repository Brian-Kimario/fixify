import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EditProfessionalProfileForm } from './EditProfessionalProfileForm';

export const metadata = {
  title: 'Edit Professional Profile - Feasy',
};

export default async function EditProfessionalProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: pro }, { data: categories }, { data: skills }] = await Promise.all([
    supabase
      .from('professional_profiles')
      .select('display_name, bio, years_experience')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('service_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('professional_skills')
      .select('service_category_id')
      .eq('professional_id', user.id)
      .is('service_id', null),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink mb-2">Edit Your Profile</h1>
          <p className="text-line">
            Your skills decide which bookings can be assigned to you.
          </p>
        </div>

        <EditProfessionalProfileForm
          initial={{
            fullName: profile?.full_name || pro?.display_name || '',
            phone: profile?.phone ?? '',
            bio: pro?.bio ?? '',
            yearsExperience: pro?.years_experience?.toString() ?? '',
            categoryIds: (skills ?? []).map((s) => s.service_category_id),
          }}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
