import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CustomerNavbar } from './CustomerNavbar';

/**
 * Protected Layout for Customer Dashboard
 * 
 * This layout ensures only authenticated users can access /customer routes.
 * Server-side check happens before rendering.
 */

export const metadata = {
  title: 'Dashboard - Fixify',
  description: 'Manage your property and bookings',
};

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default async function CustomerLayout({ children }: CustomerLayoutProps) {
  // Check authentication on the server
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-dark">
      <CustomerNavbar user={user} />

      <main>{children}</main>
    </div>
  );
}
