import { getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EditProfileForm } from './EditProfileForm';
import { Card } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Edit Profile - Fixify',
};

export default async function EditProfilePage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display font-bold text-3xl text-ink mb-2">
              Edit Profile
            </h1>
            <p className="text-line">Update your personal information</p>
          </div>
          <Link href="/app/profile" className="text-mint hover:underline text-sm font-medium">
            ← Back
          </Link>
        </div>

        {/* Form Card */}
        <Card>
          <EditProfileForm initialProfile={profile} />
        </Card>

        {/* Info Note */}
        <div className="p-4 rounded-lg bg-line/10 border border-line/30">
          <p className="text-sm text-line">
            💡 Your email address cannot be changed here. To change your email, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
