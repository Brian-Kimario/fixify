'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { NAV_ICONS, activeNavHref, type NavItem } from './nav';

function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span
      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-semibold leading-5 text-paper"
      aria-label={`${count} ${label}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Desktop navigation in the top bar. */
export function TopNavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const current = activeNavHref(usePathname() ?? '', items);

  return (
    <nav aria-label={label} className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = item.href === current;
          const Icon = NAV_ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
                  active ? 'bg-teal-soft text-teal-deep' : 'text-ink-3 hover:bg-paper-2 hover:text-ink',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.locked && <Lock className="h-3.5 w-3.5 text-ink-3" aria-label="locked" />}
                {!item.locked && item.count ? <CountBadge count={item.count} label={item.countLabel ?? 'waiting'} /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile tab bar, fixed to the bottom of the viewport. */
export function BottomNavLinks({ items, label }: { items: NavItem[]; label: string }) {
  const current = activeNavHref(usePathname() ?? '', items);

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = item.href === current;
          const Icon = NAV_ICONS[item.icon];

          if (item.primary) {
            return (
              <li key={item.href} className="flex items-center justify-center">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className="-mt-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal text-paper shadow-lg shadow-teal/25 ring-4 ring-paper transition-colors hover:bg-teal-deep">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="sr-only">{item.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal',
                  active ? 'text-teal-deep' : 'text-ink-3',
                ].join(' ')}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-teal" aria-hidden="true" />}
                <span className="relative">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {item.locked && (
                    <Lock className="absolute -right-2 -top-1 h-3 w-3 rounded-full bg-paper text-ink-3" aria-label="locked" />
                  )}
                  {!item.locked && item.count ? (
                    <span
                      className="absolute -right-2.5 -top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-semibold leading-4 text-paper"
                      aria-label={`${item.count} ${item.countLabel ?? 'waiting'}`}
                    >
                      {item.count > 9 ? '9+' : item.count}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
