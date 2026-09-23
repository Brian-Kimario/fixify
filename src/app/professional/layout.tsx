import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProNavbar } from './ProNavbar';

/**
 * Protected Layout for Professional Dashboard
 * 
 * This layout ensures only authenticated professionals can access /pro routes.
 * Checks both authentication and professional role.
 */

export const metadata = {
  title: 'Professional Dashboard - Fixify',
  description: 'Manage your professional profile, jobs, bids, and earnings',
};

interface ProLayoutProps {
  children: React.ReactNode;
}

export default async function ProLayout({ children }: ProLayoutProps) {
  // Check authentication on the server
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  // Redirect if not a professional
  if (profile?.role !== 'professional') {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-dark">
      <ProNavbar user={user} profile={profile} />

      <main>{children}</main>
    </div>
  );
}
