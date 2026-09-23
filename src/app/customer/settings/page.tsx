import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';

export const metadata = {
  title: 'Account Settings - Fixify',
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-3xl text-ink mb-2">
            Account Settings
          </h1>
          <p className="text-line">Manage your account preferences and security</p>
        </div>

        {/* Email Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Email & Authentication
            </h2>

            <div className="space-y-2 text-line">
              <div>
                <span className="font-medium">Email Address:</span>
              </div>
              <div className="text-sm bg-panel p-3 rounded-lg border border-line">
                {user?.email}
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" size="md" className="w-full">
                Change Email Address
              </Button>
              <Button variant="outline" size="md" className="w-full">
                Change Password
              </Button>
              <p className="text-xs text-line">
                Need help? <a href="/help" className="text-mint hover:underline">Contact support</a>
              </p>
            </div>
          </div>
        </Card>

        {/* Profile Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Profile Information
            </h2>

            <div className="space-y-2 text-line">
              <div>
                <span className="font-medium">Full Name:</span> {profile?.full_name || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {profile?.phone || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Role:</span> {profile?.role}
              </div>
            </div>

            <Link href="/app/profile/edit">
              <Button variant="primary" size="md" className="w-full">
                Edit Profile Information
              </Button>
            </Link>
          </div>
        </Card>

        {/* Privacy Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Privacy & Preferences
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-mint"
                  disabled
                />
                <span className="text-sm">
                  <div className="font-medium text-ink">Email notifications</div>
                  <div className="text-xs text-line">Receive updates about your account</div>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-mint"
                  disabled
                />
                <span className="text-sm">
                  <div className="font-medium text-ink">Marketing emails</div>
                  <div className="text-xs text-line">Receive tips and updates about Fixify</div>
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-mint"
                  disabled
                />
                <span className="text-sm">
                  <div className="font-medium text-ink">Data collection</div>
                  <div className="text-xs text-line">Allow us to analyze usage patterns</div>
                </span>
              </label>
            </div>

            <p className="text-xs text-line pt-2">
              ⚠️ Preferences coming soon. For now, you'll receive essential account notifications.
            </p>
          </div>
        </Card>

        {/* Sessions Section */}
        <Card>
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-ink">
              Sessions
            </h2>

            <div className="space-y-2">
              <p className="text-sm text-line">
                You're currently logged in to this device. Sessions will be managed here in the future.
              </p>
              <Button variant="outline" size="md" className="w-full" disabled>
                View All Sessions
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/30 bg-red-500/5">
          <div className="space-y-4">
            <h2 className="font-display font-bold text-xl text-red-500">
              Danger Zone
            </h2>

            <p className="text-sm text-line">
              These actions cannot be undone. Please be careful.
            </p>

            <Button variant="outline" size="md" className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10" disabled>
              Delete Account
            </Button>

            <p className="text-xs text-line">
              Account deletion will be available soon. For assistance, contact support.
            </p>
          </div>
        </Card>

        {/* Help */}
        <div className="text-center pt-4">
          <p className="text-sm text-line mb-3">
            Have questions? We're here to help.
          </p>
          <a href="/help" className="text-mint font-medium hover:underline">
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
}
