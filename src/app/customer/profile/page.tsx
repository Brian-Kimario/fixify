import { getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Profile - Fixify',
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-3xl text-ink mb-2">
            Your Profile
          </h1>
          <p className="text-line">Manage your account information</p>
        </div>

        {/* Profile Information */}
        <Card>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-bold text-xl text-ink">
                Personal Information
              </h2>
              <Link href="/app/profile/edit">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
            </div>

            <div className="space-y-3 text-line">
              <div>
                <span className="font-medium">Full Name:</span>{' '}
                {profile?.full_name || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Phone:</span>{' '}
                {profile?.phone || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Role:</span> {profile?.role}
              </div>
              <div>
                <span className="font-medium">Member Since:</span>{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Today'}
              </div>
            </div>
          </div>
        </Card>

        {/* Account Settings Link */}
        <Card className="bg-mint/5 border-mint/30">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-bold text-ink mb-1">
                Account Settings
              </h3>
              <p className="text-sm text-line">
                Manage email, privacy, and other account preferences
              </p>
            </div>
            <Link href="/app/settings">
              <Button variant="outline" size="sm">
                Go to Settings
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
