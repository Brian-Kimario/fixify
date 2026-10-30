import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
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
  title: 'Admin Console — Feasy',
  description: 'Feasy operations and admin panel',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', exact: true, icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg> },
  { href: '/admin/operations', label: 'Operations', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><path d="M12 8v8M8 12h8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /></svg> },
  { href: '/admin/jobs', label: 'Jobs', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><path d="m5 7 4-4 4 4M9 3v10M3 13h18v7H3z" /></svg> },
  { href: '/admin/professionals', label: 'Verification', shortLabel: 'Verify', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg> },
  { href: '/admin/customers', label: 'Customers', icon: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65"><circle cx="12" cy="8" r="3" /><path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5" /></svg> },
] as const;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/');

  const displayName = profile.full_name || user.email?.split('@')[0] || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();


  return (
    <div className="min-h-screen bg-[#F7F4EC]">
      {/* ── Top header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFEFA] border-b border-[#D9DED8]">
        <div className="flex items-center justify-between px-4 md:px-6 py-3.5 h-16">
          {/* Logo */}
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 md:gap-2.5 font-bold text-sm md:text-[18px] tracking-[-0.035em] text-[#18211F] flex-shrink-0"
          >
            <span className="w-[24px] h-[24px] md:w-[29px] md:h-[29px] flex items-center justify-center">
              <Symbol size="sm" className="w-full h-full" />
            </span>
            <span>Feasy</span>
          </Link>

          {/* Desktop nav */}
          <TopNavLinks items={NAV_ITEMS} />

          {/* Account menu */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <SignOutMenu
              user={user}
              displayName={displayName}
              initials={initials}
              role="admin"
            />
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────── */}
      <main id="main-content" className="pb-20 md:pb-0">{children}</main>

      {/* ── Mobile bottom nav ──────────────────────────────────────── */}
      <BottomNavLinks items={NAV_ITEMS} />
    </div>
  );
}
