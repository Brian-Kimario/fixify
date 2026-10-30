'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Popover } from './Popover';
import { markAllNotificationsReadAction, markNotificationReadAction } from '@/lib/inapp-notifications/actions';
import { notificationAge, notificationTarget, type NotificationKind } from '@/lib/inapp-notifications/rules';
import { useRealtimeRefresh } from '@/lib/realtime/useRealtimeRefresh';
import { formatSlot } from '@/lib/shell/rules';

export interface BellNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Validated in-app path, or null if the stored link was not a case path. */
  href: string | null;
  createdAt: string;
  read: boolean;
}

/**
 * The signed-in user's stored notifications. The list and unread count come from the database
 * on every render; marking read goes through server actions that only touch the caller's own
 * rows. Realtime (see useRealtimeRefresh) just asks the route to refetch.
 */
export function NotificationBell({
  userId,
  items,
  unread,
  failed,
}: {
  userId: string;
  items: BellNotification[];
  /** Total unread, or null if it could not be read. */
  unread: number | null;
  failed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Ids marked read in this browser before the refreshed list arrives, so the badge responds at once.
  const [locallyRead, setLocallyRead] = useState<ReadonlySet<string>>(new Set());

  useRealtimeRefresh({
    channel: `notifications:${userId}`,
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  });

  // The server list is the truth again as soon as it changes (state adjusted during render, not in an effect).
  const [seen, setSeen] = useState({ items, unread });
  if (seen.items !== items || seen.unread !== unread) {
    setSeen({ items, unread });
    setLocallyRead(new Set());
  }

  const visible = useMemo(
    () => items.map((item) => ({ ...item, read: item.read || locallyRead.has(item.id) })),
    [items, locallyRead],
  );
  const optimisticallyRead = items.filter((item) => !item.read && locallyRead.has(item.id)).length;
  const count = unread == null ? null : Math.max(0, unread - optimisticallyRead);
  const hasUnreadListed = visible.some((item) => !item.read);

  function markRead(id: string) {
    setLocallyRead((prev) => new Set(prev).add(id));
    void markNotificationReadAction({ notificationId: id }).then((result) => {
      if (result.success === false) {
        setLocallyRead((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function markAll() {
    setError(null);
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.success === false) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const label = failed
    ? 'Notifications, could not be loaded'
    : count
      ? `Notifications, ${count} unread`
      : 'Notifications';

  return (
    <Popover
      triggerLabel={label}
      triggerClassName="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      trigger={
        <>
          <Bell className="h-5 w-5" aria-hidden="true" />
          {count != null && count > 0 && (
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
      {(close) => {
        const now = new Date();
        return (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Notifications</p>
              {hasUnreadListed && (
                <button
                  type="button"
                  onClick={markAll}
                  disabled={pending}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-teal-deep transition-colors hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  {pending ? 'Marking…' : 'Mark all read'}
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="border-b border-line px-4 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            {failed ? (
              <p role="alert" className="px-4 py-6 text-center text-sm text-ink-3">
                Notifications could not be loaded. Try again in a moment.
              </p>
            ) : visible.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-3">No notifications yet.</p>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
                {visible.map((item) => {
                  const target = notificationTarget(item.kind, item.href);
                  const content = (
                    <>
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-teal'}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm text-ink ${item.read ? 'font-normal' : 'font-semibold'}`}>
                          {!item.read && <span className="sr-only">Unread: </span>}
                          {item.title}
                        </span>
                        <span className="block text-xs text-ink-3">{item.body}</span>
                        <span className="mt-0.5 block text-xs text-ink-4">
                          {notificationAge(item.createdAt, now, formatSlot)}
                        </span>
                      </span>
                    </>
                  );
                  const rowClass =
                    'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-porcelain focus-visible:bg-porcelain focus-visible:outline-none';
                  return (
                    <li key={item.id} className={item.read ? '' : 'bg-teal-soft/40'}>
                      {target ? (
                        <Link
                          href={target}
                          onClick={() => {
                            if (!item.read) markRead(item.id);
                            close();
                          }}
                          className={rowClass}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!item.read) markRead(item.id);
                          }}
                          className={rowClass}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        );
      }}
    </Popover>
  );
}
