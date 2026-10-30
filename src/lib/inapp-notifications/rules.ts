/**
 * Kinds of in-app notification written by the database; supabase/migrations/20261030_018_notifications.sql
 * owns the event mapping and the fixed text for each. (src/lib/notifications is the older external-delivery
 * module and is unrelated.)
 */
export const NOTIFICATION_KINDS = [
  'job_accepted',
  'eta_shared',
  'running_late',
  'pro_arrived',
  'quote_requested',
  'quote_approved',
  'quote_declined',
  'job_cancelled',
  'new_message',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export function isNotificationKind(value: string): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

const SAFE_LINK = /^\/(customer|professional)\/(bookings|jobs)\/[0-9a-f-]{36}$/;

/** The stored link is chosen by the database, but a link is only rendered if it is an in-app case path. */
export function safeNotificationLink(link: string): string | null {
  return SAFE_LINK.test(link) ? link : null;
}
