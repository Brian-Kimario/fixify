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
        ← Back to Dashboard
      </Link>

      {/* Profile Header Card with gradient */}
      <Card className="bg-gradient-to-br from-teal-soft to-paper border border-teal/20">
        <div className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <div className="w-24 h-24 rounded-full bg-teal text-paper border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile?.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-display font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-teal border-2 border-white rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-paper" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
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
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                ✎ Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Contact Information Card */}
      <Card>
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="p-4 bg-porcelain rounded-lg border border-line">
              <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider mb-1">
                Email Address
              </p>
              <p className="text-sm font-medium text-ink mb-1">
                {profile?.id ? `customer@${profile.id.substring(0, 8)}...fixify.local` : 'Loading...'}
              </p>
              <p className="text-xs text-ink-4">Primary contact for account updates</p>
            </div>

            {/* Phone */}
            <div className="p-4 bg-porcelain rounded-lg border border-line">
              <p className="text-xs font-semibold text-ink-4 uppercase tracking-wider mb-1">
                Phone Number
              </p>
              <p className="text-sm font-medium text-ink mb-1">
                {profile?.phone || '—'}
              </p>
              <p className="text-xs text-ink-4">Used for service notifications</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/customer/profile/edit" className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Update Contact Info
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Account Details
            </h2>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="font-medium text-ink-3">Full Name</span>
                <p className="text-xs text-ink-4 mt-0.5">Your registered name</p>
              </div>
              <span className="font-semibold text-ink text-right">{profile?.full_name || '—'}</span>
            </div>

            {/* Role */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="font-medium text-ink-3">Account Type</span>
                <p className="text-xs text-ink-4 mt-0.5">Your account role</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-teal-soft text-teal text-xs font-semibold rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Customer'}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div>
                <span className="font-medium text-ink-3">Member Since</span>
                <p className="text-xs text-ink-4 mt-0.5">Account creation date</p>
              </div>
              <span className="font-semibold text-ink">{memberSinceDate}</span>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-ink-3">Verification Status</span>
                <p className="text-xs text-ink-4 mt-0.5">Your identity verification</p>
              </div>
              <VerificationBadge status="not_verified" size="sm" />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Links Card */}
      <Card className="bg-gradient-to-br from-teal/5 to-paper border border-teal/20">
        <div className="space-y-4">
          <h3 className="font-display font-bold text-ink">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/customer/profile/edit" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            </Link>
            <Link href="/customer/settings" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </Link>
            <Link href="/customer/properties" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                My Properties
              </Button>
            </Link>
            <Link href="/customer/support" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Support
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Sign Out — shown on mobile since the header SignOutMenu is desktop-only */}
      <div className="md:hidden">
        <Card>
          <div className="space-y-3">
            <h3 className="font-display font-bold text-ink">Session</h3>
            <p className="text-sm text-ink-3">
              Sign out of your account on this device.
            </p>
            <MobileSignOutButton />
          </div>
        </Card>
      </div>
    </div>
  );
}
