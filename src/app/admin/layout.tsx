import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { SignOutMenu } from '@/components/shared/SignOutMenu';
import { Symbol } from '@/components/brand/Symbol';

export const metadata = {
  title: 'Admin Console — Fixify',
  description: 'Fixify operations and admin panel',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/operations', label: 'Operations', exact: false },
  { href: '/admin/jobs', label: 'Jobs', exact: false },
  { href: '/admin/professionals', label: 'Verification', exact: false },
  { href: '/admin/customers', label: 'Customers', exact: false },
] as const;

const MOBILE_NAV = [
  {
    href: '/admin',
    label: 'Overview',
    exact: true,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
        <rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" />
        <rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" />
      </svg>
    ),
  },
  {
    href: '/admin/operations',
    label: 'Operations',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
        <path d="M12 8v8M8 12h8M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      </svg>
    ),
  },
  {
    href: '/admin/jobs',
    label: 'Jobs',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
        <path d="m5 7 4-4 4 4M9 3v10M3 13h18v7H3z" />
      </svg>
    ),
  },
  {
    href: '/admin/professionals',
    label: 'Verify',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
  {
    href: '/admin/customers',
    label: 'Customers',
    exact: false,
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.65">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c1.2-3.5 3.5-5 7-5s5.8 1.5 7 5" />
      </svg>
    ),
  },
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

  if (!profile || (profile as any).role !== 'admin') redirect('/');

  const displayName = (profile as any)?.full_name || user.email?.split('@')[0] || 'Admin';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Resolve current pathname on the server for active-link highlighting
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? '';

  function isActive(href: string, exact: boolean) {
    if (!pathname) return false;
    return exact ? pathname === href : pathname.startsWith(href);
  }

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
            <span>Fixify</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {NAV_ITEMS.map(({ href, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    'relative text-sm font-semibold transition',
                    active
                      ? 'text-[#0D5144]'
                      : 'text-[#5A6661] hover:text-[#0D5144]',
                  ].join(' ')}
                >
                  {label}
                  {active && (
                    <span className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-[#0D5144] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Profile section */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFEFA] border-t border-[#D9DED8] flex items-center justify-around h-20">
        {MOBILE_NAV.map(({ href, label, exact, icon }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-col items-center justify-center gap-1 transition py-2 px-3 flex-1',
                active ? 'text-[#0D5144]' : 'text-[#5A6661] hover:text-[#0D5144]',
              ].join(' ')}
            >
              {icon}
              <span className="text-xs font-semibold">{label}</span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0D5144]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
