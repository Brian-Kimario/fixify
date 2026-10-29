import type { Metadata } from 'next';
import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutMenu } from '@/components/shared/SignOutMenu';
import { TopNavLinks, BottomNavLinks } from '@/components/shared/AppNavLinks';
import { Symbol } from '@/components/brand/Symbol';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: 'Professional Dashboard — Feasy',
  description: 'Manage your professional profile, jobs, bids, and earnings',
};

interface ProLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/professional', label: 'Today', exact: true, icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/></svg> },
  { href: '/professional/jobs', label: 'Jobs', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2"/></svg> },
  { href: '/professional/earnings', label: 'Earnings', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9 12h6"/></svg> },
  { href: '/professional/profile', label: 'Profile', bottomOnly: true, icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><circle cx="12" cy="8" r="3"/><path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5"/></svg> },
] as const;

export default async function ProLayout({ children }: ProLayoutProps) {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) redirect('/auth/login');

  if (profile?.role !== 'professional') redirect('/customer');

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Professional';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FFFEFA] border-b border-[#D9DED8]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 h-16">
          {/* Logo */}
          <Link href="/professional" className="inline-flex items-center gap-2 md:gap-2.5 font-bold text-sm md:text-[18px] tracking-[-0.035em] text-[#18211F] flex-shrink-0">
            <span className="w-[24px] h-[24px] md:w-[29px] md:h-[29px] flex items-center justify-center">
              <Symbol size="sm" className="w-full h-full" />
            </span>
            <span>Feasy</span>
          </Link>

          {/* Desktop Navigation */}
          <TopNavLinks items={NAV_ITEMS} />

          {/* Account menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <SignOutMenu 
              user={user} 
              displayName={displayName}
              initials={initials}
              role="professional"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="pb-20 md:pb-0 px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNavLinks items={NAV_ITEMS} />
    </div>
  );
}
