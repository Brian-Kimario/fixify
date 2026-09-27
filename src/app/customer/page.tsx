import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { CustomerDashboardClient } from './CustomerDashboardClient';

export const metadata = {
  title: 'Customer Dashboard - Fixify',
  description: 'Manage property maintenance, active dispatches, and permanent passport records',
};

export default async function CustomerDashboard() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-ink">Not authenticated</p>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Customer';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CustomerDashboardClient userName={displayName} />
    </div>
  );
}
