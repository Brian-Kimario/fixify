import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ProfessionalNavbar } from './ProfessionalNavbar';

/**
 * Protected Layout for Professional Dashboard
 * 
 * This layout ensures only authenticated professionals can access /professional routes.
 * Checks both authentication and professional role.
 */

export const metadata = {
  title: 'Professional Dashboard - Fixify',
  description: 'Manage your professional profile, jobs, bids, and earnings',
};

interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

export default async function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  // Check authentication on the server
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  // Redirect if not a professional
  if (profile?.role !== 'professional') {
    redirect('/customer');
  }

  return (
    <div className="min-h-screen bg-dark">
      <ProfessionalNavbar user={user} profile={profile} />

      <main>{children}</main>
    </div>
  );
}
