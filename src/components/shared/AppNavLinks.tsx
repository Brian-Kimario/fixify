'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AppNavItem {
  href: string;
  label: string;
  /** Match the path exactly (use for section roots like /customer). */
  exact?: boolean;
  /** Shorter label for the mobile bottom bar. */
  shortLabel?: string;
  icon?: React.ReactNode;
  /** Only show in the mobile bottom bar (desktop reaches it via the account menu). */
  bottomOnly?: boolean;
}

function isActive(pathname: string, item: AppNavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function TopNavLinks({ items }: { items: readonly AppNavItem[] }) {
  const pathname = usePathname() ?? '';
  return (
    <nav className="hidden md:flex items-center gap-1 flex-1 justify-center" aria-label="Main">
      {items.filter((item) => !item.bottomOnly).map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              active ? 'bg-teal-soft text-teal-deep' : 'text-ink-3 hover:text-teal-deep hover:bg-paper-2'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNavLinks({ items }: { items: readonly AppNavItem[] }) {
  const pathname = usePathname() ?? '';
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-line flex items-stretch justify-around h-16 pb-[env(safe-area-inset-bottom)]"
      aria-label="Main"
    >
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-teal-deep' : 'text-ink-3 hover:text-teal-deep'
            }`}
          >
            {active && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-teal" />}
            {item.icon}
            <span className="text-[11px] font-semibold">{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
