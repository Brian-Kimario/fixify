import { getCurrentProfile } from '@/lib/auth';
import { EditProfessionalProfileForm } from './EditProfessionalProfileForm';

export const metadata = {
  title: 'Edit Professional Profile - Fixify',
};

export default async function EditProfessionalProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink mb-2">
            Edit Your Profile
          </h1>
          <p className="text-line">
            Update your professional information and preferences
          </p>
        </div>

        <EditProfessionalProfileForm initialProfile={profile} />
      </div>
    </div>
  );
}
