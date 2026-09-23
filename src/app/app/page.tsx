import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';

export const metadata = {
  title: 'Dashboard - Fixify',
};

export default async function DashboardPage() {
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
            Manage your properties, bookings, and service requests
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Active Requests</div>
              <p className="text-line text-sm">Service requests in progress</p>
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
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Properties</div>
              <p className="text-line text-sm">Properties registered</p>
            </div>
          </Card>

          <Card>
            <div className="space-y-3">
              <div className="text-3xl font-display font-bold text-mint">0</div>
              <div className="text-ink font-medium">Pending Quotes</div>
              <p className="text-line text-sm">Awaiting your decision</p>
            </div>
          </Card>
        </div>

        {/* Main CTA */}
        <Card className="bg-gradient-to-r from-mint/10 to-mint/5 border-mint/30">
          <div className="space-y-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-ink mb-2">
                Need a service?
              </h2>
              <p className="text-line">
                Describe what you need and get connected with vetted professionals
              </p>
            </div>
            <Button variant="primary" size="lg">
              Request a Service
            </Button>
          </div>
        </Card>

        {/* Profile Info */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">Profile</h2>
            <div className="space-y-2 text-line">
              <div>
                <span className="font-medium">Email:</span> {user?.email}
              </div>
              <div>
                <span className="font-medium">Full Name:</span>{' '}
                {profile?.full_name || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Role:</span>{' '}
                {profile?.role || 'customer'}
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
      </div>
    </div>
  );
}
