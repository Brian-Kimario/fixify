import { createClient } from '@/lib/supabase/server';
import { isNotificationKind, safeNotificationLink, type NotificationKind } from '@/lib/inapp-notifications/rules';

/**
 * Persisted in-app notifications for the signed-in user. The RLS-scoped client is used on purpose:
 * the notifications policy returns only the caller's own rows, so no user id is passed in or trusted.
 */

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** In-app path, or null if the stored link failed validation. */
  href: string | null;
  jobId: string;
  createdAt: string;
  read: boolean;
}

/** Newest first. Rows with an unrecognised kind are skipped rather than shown half-understood. */
export async function getNotifications(limit = 30): Promise<AppNotification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, kind, title, body, link, job_id, created_at, read_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('getNotifications:', error.message);
    return [];
  }
  return (data ?? []).flatMap((row) =>
    isNotificationKind(row.kind)
      ? [
          {
            id: row.id,
            kind: row.kind,
            title: row.title,
            body: row.body,
            href: safeNotificationLink(row.link),
            jobId: row.job_id,
            createdAt: row.created_at,
            read: row.read_at != null,
          },
        ]
      : [],
  );
}

/** Unread notifications, counted from the stored read state. Null if the count could not be read. */
export async function getUnreadNotificationCount(): Promise<number | null> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) {
    console.error('getUnreadNotificationCount:', error.message);
    return null;
  }
  return count ?? 0;
}

export interface NotificationFeed {
  items: AppNotification[];
  /** Unread notifications in total (can exceed what is listed). Null if it could not be read. */
  unread: number | null;
  /** True when the list or the count could not be read; the bell then says so instead of showing "nothing". */
  failed: boolean;
}

export async function getNotificationFeed(limit = 30): Promise<NotificationFeed> {
  const supabase = await createClient();
  const [list, count] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, kind, title, body, link, job_id, created_at, read_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
  ]);
  if (list.error) console.error('getNotificationFeed list:', list.error.message);
  if (count.error) console.error('getNotificationFeed count:', count.error.message);

  const items = (list.data ?? []).flatMap((row) =>
    isNotificationKind(row.kind)
      ? [
          {
            id: row.id,
            kind: row.kind,
            title: row.title,
            body: row.body,
            href: safeNotificationLink(row.link),
            jobId: row.job_id,
            createdAt: row.created_at,
            read: row.read_at != null,
          },
        ]
      : [],
  );
  return { items, unread: count.error ? null : (count.count ?? 0), failed: Boolean(list.error || count.error) };
}
