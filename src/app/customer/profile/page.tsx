import { getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import { VerificationBadge } from '@/components/customer/VerificationBadge';
import { MobileSignOutButton } from '@/components/shared/MobileSignOutButton';
import Link from 'next/link';

export const metadata = {
  title: 'Profile - Fixify',
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();

  const memberSinceDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Back Navigation */}
      <Link
        href="/customer"
        className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1"
      >
        ← Back to Residence Console
      </Link>

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-br from-paper to-paper-2">
        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-teal/10 border-2 border-teal/20 flex items-center justify-center flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'Profile'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-display font-bold text-teal">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                )}
              </div>
            </div>

            {/* Name and Status */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink truncate">
                {profile?.full_name || 'Customer'}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <VerificationBadge status="not_verified" size="sm" />
                <span className="text-xs text-ink-4 font-mono uppercase tracking-wider">
                  Member since {memberSinceDate}
                </span>
              </div>
            </div>

            {/* Edit Button */}
            <Link href="/customer/profile/edit" className="w-full sm:w-auto">
              <Button variant="primary" size="sm" className="w-full sm:w-auto">
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-line" />

          {/* Contact Information Grid */}
          <div>
            <h2 className="font-display font-bold text-sm text-ink-4 uppercase tracking-wider mb-4">
              Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-medium text-ink">
                  {profile?.id ? `customer@${profile.id.substring(0, 8)}...fixify.local` : 'Loading...'}
                </p>
                <p className="text-xs text-ink-4">Primary contact email</p>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider">
                  Phone
                </p>
                <p className="text-sm font-medium text-ink">
                  {profile?.phone || 'Not set'}
                </p>
                <p className="text-xs text-ink-4">Used for service updates</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">
              Personal Information
            </h2>
            <Link href="/customer/profile/edit">
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {/* Role */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <span className="font-medium text-ink-3">Account Role</span>
              <span className="font-semibold text-ink capitalize">
                {profile?.role || 'Customer'}
              </span>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <span className="font-medium text-ink-3">Member Since</span>
              <span className="font-semibold text-ink">{memberSinceDate}</span>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink-3">Verification Status</span>
              <VerificationBadge status="not_verified" size="sm" />
            </div>
          </div>
        </div>
      </Card>

      {/* Account Settings Link */}
      <Card className="bg-teal-soft/30 border-teal/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-ink mb-1">
              Account Settings
            </h3>
            <p className="text-sm text-ink-3">
              Manage email, privacy, security, and communication preferences
            </p>
          </div>
          <Link href="/customer/settings" className="w-full sm:w-auto flex-shrink-0">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              Go to Settings →
            </Button>
          </Link>
        </div>
      </Card>

      {/* Sign Out — shown on mobile since the header SignOutMenu is desktop-only */}
      <div className="md:hidden">
        <Card>
          <div className="space-y-3">
            <h3 className="font-display font-bold text-ink">Session</h3>
            <p className="text-sm text-[#5A6661]">
              Sign out of your account on this device.
            </p>
            <MobileSignOutButton />
          </div>
        </Card>
      </div>
    </div>
  );
}
