import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Button } from '@/components/ui';
import { SettingsSection } from '@/components/customer/SettingsSection';
import { SettingToggle } from '@/components/customer/SettingToggle';
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
          <p className="text-ink-3">Manage your account preferences and security</p>
        </div>

        {/* Email & Authentication Section */}
        <SettingsSection title="Email & Authentication">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1.5">
                Email Address
              </label>
              <div className="text-sm bg-porcelain p-3 rounded-lg border border-line font-mono">
                {user?.email}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button variant="outline" size="md" className="w-full">
                Change Email Address
              </Button>
              <Button variant="outline" size="md" className="w-full">
                Change Password
              </Button>
              <p className="text-xs text-ink-3">
                Need help?{' '}
                <Link href="/help" className="text-teal hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Profile Information Section */}
        <SettingsSection title="Profile Information">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1">
                Full Name
              </label>
              <p className="text-sm text-ink">{profile?.full_name || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1">
                Phone
              </label>
              <p className="text-sm text-ink">{profile?.phone || 'Not set'}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-3 mb-1">
                Account Type
              </label>
              <p className="text-sm text-ink capitalize">{profile?.role}</p>
            </div>

            <Link href="/customer/profile/edit" className="block pt-2">
              <Button variant="primary" size="md" className="w-full">
                Edit Profile
              </Button>
            </Link>
          </div>
        </SettingsSection>

        {/* Communication Preferences Section */}
        <SettingsSection title="Communication Preferences">
          <div className="space-y-1">
            <SettingToggle
              id="email-notifications"
              label="Email notifications"
              description="Receive updates about your account"
              defaultChecked={true}
              disabled={true}
            />
            <SettingToggle
              id="marketing-emails"
              label="Marketing emails"
              description="Receive tips and updates about Fixify"
              defaultChecked={true}
              disabled={true}
            />
            <SettingToggle
              id="sms-notifications"
              label="SMS notifications"
              description="Receive service updates via text"
              defaultChecked={false}
              disabled={true}
            />
            <SettingToggle
              id="push-notifications"
              label="Push notifications"
              description="Receive notifications on your device"
              defaultChecked={false}
              disabled={true}
            />
          </div>
          <p className="text-xs text-ink-3 pt-2 border-t border-line">
            Preferences are not connected in this preview. Essential account notifications remain enabled by default.
          </p>
        </SettingsSection>

        {/* Privacy & Data Section */}
        <SettingsSection title="Privacy & Data">
          <div className="space-y-1">
            <SettingToggle
              id="data-collection"
              label="Usage analytics"
              description="Allow us to analyze usage patterns to improve Fixify"
              defaultChecked={false}
              disabled={true}
            />
            <SettingToggle
              id="data-sharing"
              label="Service optimization"
              description="Share data with service providers to improve matching"
              defaultChecked={false}
              disabled={true}
            />
            <SettingToggle
              id="profile-visibility"
              label="Public profile"
              description="Allow professionals to see your profile and rating"
              defaultChecked={true}
              disabled={true}
            />
          </div>
          <p className="text-xs text-ink-3 pt-2 border-t border-line">
            You can always request your data or ask for deletion at any time.
          </p>
        </SettingsSection>

        {/* Sessions & Security Section */}
        <SettingsSection title="Sessions & Security">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-ink-3 mb-2">
                You're currently logged in on this device.
              </p>
              <Button variant="outline" size="md" className="w-full" disabled>
                View All Active Sessions
              </Button>
            </div>
            <div className="text-xs text-ink-3 pt-2 border-t border-line">
              Sessions feature coming soon. You can manually sign out using the menu.
            </div>
          </div>
        </SettingsSection>

        {/* Danger Zone Section */}
        <SettingsSection
          title="Danger Zone"
          description="These actions cannot be undone. Please be careful."
          isDanger={true}
        >
          <div className="space-y-3">
            <Button
              variant="outline"
              size="md"
              className="w-full border-danger/30 text-danger hover:bg-danger/5 disabled:opacity-50"
              disabled
            >
              Delete Account
            </Button>
            <p className="text-xs text-ink-3">
              Account deletion will be available soon. For assistance, contact support.
            </p>
            <Button
              variant="outline"
              size="md"
              className="w-full border-line text-ink hover:bg-porcelain disabled:opacity-50"
              disabled
            >
              Export My Data
            </Button>
            <p className="text-xs text-ink-3">
              Download all your data in a portable format (CSV, JSON).
            </p>
          </div>
        </SettingsSection>

        {/* Help Footer */}
        <div className="text-center pt-4 border-t border-line">
          <p className="text-sm text-ink-3 mb-3">
            Have questions about your account?
          </p>
          <Link href="/help" className="inline-flex items-center gap-1 text-teal font-medium hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
