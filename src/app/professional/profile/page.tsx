import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import { MobileSignOutButton } from '@/components/shared/MobileSignOutButton';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Professional Profile - Feasy',
};

export default async function ProfessionalProfilePage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  const supabase = await createClient();
  const { data: proProfile } = user
    ? await supabase
        .from('professional_profiles')
        .select('display_name, bio, years_experience, rating_average, completed_jobs_count, verification_status')
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  const { data: skillRows } = user
    ? await supabase
        .from('professional_skills')
        .select('id, category:service_categories(name)')
        .eq('professional_id', user.id)
    : { data: null };

  const skills = Array.from(
    new Set(
      (skillRows ?? [])
        .map((r) => (Array.isArray(r.category) ? r.category[0]?.name : r.category?.name))
        .filter((n): n is string => Boolean(n))
    )
  );

  const completedJobs = proProfile?.completed_jobs_count ?? 0;
  const rating = Number(proProfile?.rating_average ?? 0);
  const isVerified = proProfile?.verification_status === 'verified';
  const bio = proProfile?.bio;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-display font-bold text-3xl text-ink mb-2">
                    {proProfile?.display_name || profile?.full_name || 'Your Profile'}
                  </h1>
                  <p className="text-ink-3">
                    {isVerified ? 'Verified professional' : 'Verification pending'}
                    {proProfile?.years_experience ? ` · ${proProfile.years_experience} yrs experience` : ''}
                  </p>
                </div>
                <Link href="/professional/profile/edit">
                  <Button variant="secondary" size="sm">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* About Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">About</h2>
              <p className="text-ink-3 leading-relaxed">
                {bio ||
                  'Add a short bio so customers know your experience before you arrive.'}
              </p>
            </div>
          </Card>

          {/* Skills Section */}
          <Card>
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl text-ink">Skills</h2>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {skills.length === 0 && (
                    <p className="text-ink-3 text-sm">No skills added yet.</p>
                  )}
                  {skills.map((name) => (
                    <span
                      key={name}
                      className="inline-block px-3 py-1 bg-teal-soft text-teal rounded-lg text-sm font-medium"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <p className="text-ink-3 text-sm">
                  The skills you add decide which jobs are assigned to you.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Stats */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-ink">Profile Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-ink-3 text-sm">Rating</p>
                  {completedJobs > 0 && rating > 0 ? (
                    <p className="text-ink font-bold text-xl mt-1">{rating.toFixed(1)} ★</p>
                  ) : (
                    <p className="text-ink-3 text-sm mt-1">No ratings yet</p>
                  )}
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-ink-3 text-sm">Jobs Completed</p>
                  <p className="text-ink font-bold text-xl mt-1">{completedJobs}</p>
                </div>
                <p className="text-ink-3 text-xs border-t border-line pt-3">
                  Earnings are on the{' '}
                  <Link href="/professional/earnings" className="text-teal hover:text-teal-deep">
                    Earnings page
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Card>

          {/* Contact Info */}
          <Card>
            <div className="space-y-4">
              <h3 className="font-display font-bold text-lg text-ink">Contact Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-ink-3 text-sm">Email</p>
                  <p className="text-ink text-sm break-all">{user?.email}</p>
                </div>
                <div className="border-t border-line pt-3">
                  <p className="text-ink-3 text-sm">Phone</p>
                  <p className="text-ink text-sm">{profile?.phone || 'Not set'}</p>
                </div>
              </div>
              <Link href="/professional/profile/edit">
                <Button variant="secondary" size="sm" className="w-full">
                  Update Contact Info
                </Button>
              </Link>
            </div>
          </Card>

          {/* Verify Profile */}
          {!isVerified && (
            <Card className="bg-teal-soft border-teal/30">
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg text-ink">Verify Your Profile</h3>
                <p className="text-ink-3 text-sm">
                  You need to be verified before you can accept jobs.
                </p>
                <Link
                  href="/professional/onboarding"
                  className="text-teal hover:text-teal-deep text-sm font-medium"
                >
                  Continue verification
                </Link>
              </div>
            </Card>
          )}

          {/* Sign Out — visible on mobile since the header SignOutMenu is desktop-only */}
          <div className="md:hidden">
            <Card>
              <div className="space-y-3">
                <h3 className="font-display font-bold text-ink">Session</h3>
                <p className="text-sm text-[#5A6661]">Sign out of your account on this device.</p>
                <MobileSignOutButton />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
