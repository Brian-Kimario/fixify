import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Protected Layout for Customer Dashboard
 * 
 * This layout ensures only authenticated users can access /app routes.
 * Server-side check happens before rendering.
 */

export const metadata = {
  title: 'Dashboard - Fixify',
  description: 'Manage your property and bookings',
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Check authentication on the server
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-dark">
      <nav className="border-b border-line bg-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-mint font-display font-bold text-xl">Fixify</div>
            <div className="text-ink text-sm">{user.email}</div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
