'use client';

import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import { Popover } from './Popover';

export interface BellItem {
  id: string;
  href: string;
  title: string;
  detail: string;
  /** Right-aligned figure, already formatted (for example an amount). */
  meta?: string;
  tone: 'clay' | 'ochre' | 'blue' | 'danger';
}

const DOT: Record<BellItem['tone'], string> = {
  clay: 'bg-clay',
  ochre: 'bg-ochre',
  blue: 'bg-blue',
  danger: 'bg-danger',
};

/**
 * Things waiting on the signed-in user, derived from live rows on each request.
 * There is no notifications table yet, so nothing here can be "read" or dismissed:
 * an item disappears when the underlying work is done.
 */
export function NotificationBell({ items, emptyText }: { items: BellItem[]; emptyText: string }) {
  const count = items.length;

  return (
    <Popover
      triggerLabel={count ? `Notifications, ${count} waiting` : 'Notifications'}
      triggerClassName="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      trigger={
        <>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count > 0 && (
            <span
              className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-semibold leading-4 text-paper ring-2 ring-paper"
              aria-hidden="true"
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <>
          <p className="border-b border-line px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-3">
            Waiting on you
          </p>
          {count === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-3">{emptyText}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-porcelain focus-visible:bg-porcelain focus-visible:outline-none"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.tone]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">{item.title}</span>
                      <span className="block truncate text-xs text-ink-3">{item.detail}</span>
                    </span>
                    {item.meta && <span className="shrink-0 text-sm font-semibold text-ink">{item.meta}</span>}
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Popover>
  );
}
