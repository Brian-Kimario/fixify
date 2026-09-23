import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Professional Dashboard - Fixify',
};

export default async function ProfessionalDashboardPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="font-display font-bold text-4xl text-ink mb-2">
            Welcome back, {profile?.full_name || user?.email}
          </h1>
          <p className="text-line text-lg">
            Manage your jobs, bids, and earnings
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Active Bids</div>
              <p className="text-line text-sm">Pending proposals</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Active Jobs</div>
              <p className="text-line text-sm">Jobs in progress</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Completed</div>
              <p className="text-line text-sm">Jobs completed this month</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">$0</div>
              <div className="text-ink font-medium">This Month</div>
              <p className="text-line text-sm">Earnings this month</p>
            </div>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="bg-gradient-to-r from-mint/10 to-mint/5 border-mint/30">
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-ink mb-2">
                Ready to find work?
              </h2>
              <p className="text-line">
                Browse available jobs and submit bids to start earning
              </p>
            </div>
            <Link href="/professional/jobs">
              <Button variant="primary" size="lg">
                Browse Jobs
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">Getting Started</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-mint"></div>
                </div>
                <div>
                  <p className="text-ink font-medium">Complete Your Profile</p>
                  <p className="text-line text-sm">Add a professional photo and description to increase bid acceptance</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-mint"></div>
                </div>
                <div>
                  <p className="text-ink font-medium">Browse Available Jobs</p>
                  <p className="text-line text-sm">Check out jobs that match your skills and expertise</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="w-2 h-2 rounded-full bg-mint"></div>
                </div>
                <div>
                  <p className="text-ink font-medium">Submit Your First Bid</p>
                  <p className="text-line text-sm">Send a proposal with your price and timeline</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">Your Professional Info</h2>
            <div className="space-y-2 text-line">
              <div>
                <span className="font-medium">Email:</span> {user?.email}
              </div>
              <div>
                <span className="font-medium">Full Name:</span>{' '}
                {profile?.full_name || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Role:</span> Professional
              </div>
              <div>
                <span className="font-medium">Member Since:</span>{' '}
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Today'}
              </div>
            </div>
            <Link href="/professional/profile">
              <Button variant="secondary" size="sm">
                View Profile
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
