import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { Button } from '@/components/ui';
import { SettingsSection } from '@/components/customer/SettingsSection';
import { SettingToggleClient } from '@/components/customer/SettingToggleClient';
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
          <Link
            href="/customer/profile"
            className="text-xs font-semibold text-teal hover:underline inline-flex items-center gap-1 mb-4"
          >
            ← Back to Profile
          </Link>
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
              <p className="text-xs text-ink-4 mt-2">Your primary login email. Contact support to change it.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Button variant="outline" size="md" className="w-full cursor-not-allowed opacity-60" disabled>
                🔒 Change Email Address
              </Button>
              <Button variant="outline" size="md" className="w-full cursor-not-allowed opacity-60" disabled>
                🔑 Change Password
              </Button>
              <p className="text-xs text-ink-3">
                Need help?{' '}
                <Link href="/customer/support" className="text-teal font-semibold hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Profile Information Section */}
        <SettingsSection title="Profile Information">
          <div className="space-y-3">
            <div className="p-3 bg-porcelain rounded-lg border border-line">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">
                Full Name
              </label>
              <p className="text-sm font-semibold text-ink">{profile?.full_name || 'Not set'}</p>
              <p className="text-xs text-ink-4 mt-1">This name is visible on your service requests and profile.</p>
            </div>

            <div className="p-3 bg-porcelain rounded-lg border border-line">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">
                Phone Number
              </label>
              <p className="text-sm font-semibold text-ink">{profile?.phone || 'Not set'}</p>
              <p className="text-xs text-ink-4 mt-1">Used to contact you about service appointments.</p>
            </div>

            <div className="p-3 bg-porcelain rounded-lg border border-line">
              <label className="block text-xs font-medium text-ink-3 mb-1.5">
                Account Type
              </label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center text-xs font-bold">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-ink capitalize">
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Customer'}
                </span>
              </div>
              <p className="text-xs text-ink-4 mt-1">Your account role on the Fixify platform.</p>
            </div>

            <Link href="/customer/profile/edit" className="block pt-2">
              <Button variant="primary" size="md" className="w-full">
                ✎ Edit Profile Information
              </Button>
            </Link>
          </div>
        </SettingsSection>

        {/* Communication Preferences Section */}
        <SettingsSection title="Communication Preferences">
          <div className="space-y-4">
            <SettingToggleClient
              id="email-notifications"
              label="Email notifications"
              description="Receive updates about your account, bookings, and services"
              defaultChecked={(profile?.notification_preferences as any)?.email_notifications !== false}
              settingKey="email_notifications"
            />
            <div className="border-t border-line"></div>
            <SettingToggleClient
              id="marketing-emails"
              label="Marketing emails"
              description="Receive tips, updates, and offers from Fixify"
              defaultChecked={(profile?.notification_preferences as any)?.marketing_emails === true}
              settingKey="marketing_emails"
            />
            <div className="border-t border-line"></div>
            <SettingToggleClient
              id="sms-notifications"
              label="SMS notifications"
              description="Receive service updates and reminders via text message"
              defaultChecked={(profile?.notification_preferences as any)?.sms_notifications === true}
              settingKey="sms_notifications"
            />
            <div className="border-t border-line"></div>
            <SettingToggleClient
              id="push-notifications"
              label="Push notifications"
              description="Receive notifications on your device"
              defaultChecked={(profile?.notification_preferences as any)?.push_notifications === true}
              settingKey="push_notifications"
            />
          </div>
          <p className="text-xs text-ink-3 pt-4 border-t border-line mt-4">
            ✓ Your preferences are saved to your account. Essential account notifications remain enabled by default.
          </p>
        </SettingsSection>

        {/* Privacy & Data Section */}
        <SettingsSection title="Privacy & Data">
          <div className="space-y-4">
            <SettingToggleClient
              id="data-collection"
              label="Usage analytics"
              description="Allow us to analyze usage patterns to improve Fixify"
              defaultChecked={(profile?.notification_preferences as any)?.data_collection === true}
              settingKey="data_collection"
            />
            <div className="border-t border-line"></div>
            <SettingToggleClient
              id="data-sharing"
              label="Service optimization"
              description="Share data with service providers to improve matching"
              defaultChecked={(profile?.notification_preferences as any)?.data_sharing === true}
              settingKey="data_sharing"
            />
            <div className="border-t border-line"></div>
            <SettingToggleClient
              id="profile-visibility"
              label="Public profile"
              description="Allow professionals to see your profile and rating"
              defaultChecked={(profile?.notification_preferences as any)?.profile_visibility !== false}
              settingKey="profile_visibility"
            />
          </div>
          <p className="text-xs text-ink-3 pt-4 border-t border-line mt-4">
            You can request your data or ask for deletion at any time by contacting support.
          </p>
        </SettingsSection>

        {/* Sessions & Security Section */}
        <SettingsSection title="Sessions & Security">
          <div className="space-y-3">
            <div className="p-3 bg-porcelain rounded-lg border border-line">
              <p className="text-sm font-semibold text-ink-3 mb-2">
                ✓ You're logged in on this device.
              </p>
              <p className="text-xs text-ink-4">
                You have an active session. Your security is managed through your email and password.
              </p>
            </div>
            <Button variant="outline" size="md" className="w-full cursor-not-allowed opacity-60" disabled>
              View All Active Sessions (Coming Soon)
            </Button>
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
              className="w-full border-danger/30 text-danger hover:bg-danger/5 cursor-not-allowed opacity-60"
              disabled
            >
              🗑️ Delete Account (Coming Soon)
            </Button>
            <p className="text-xs text-ink-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              size="md"
              className="w-full border-line text-ink hover:bg-porcelain cursor-not-allowed opacity-60"
              disabled
            >
              📥 Export My Data (Coming Soon)
            </Button>
            <p className="text-xs text-ink-3">
              Download all your data in a portable format (CSV, JSON).
            </p>
          </div>
        </SettingsSection>

        {/* Help Footer */}
        <div className="text-center pt-6 border-t border-line">
          <p className="text-sm text-ink-3 mb-3">
            Have questions about your account or need assistance?
          </p>
          <Link href="/customer/support" className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal text-paper rounded-lg font-semibold hover:bg-teal-dark transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
