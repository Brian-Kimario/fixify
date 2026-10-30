'use server';

import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import { markNotificationReadSchema, type MarkNotificationReadInput } from '@/validators';

/** Mark one of the signed-in user's notifications read. Repeating it, or naming someone else's, changes nothing. */
export async function markNotificationReadAction(payload: MarkNotificationReadInput): Promise<ActionResult> {
  const parsed = parseInput(markNotificationReadSchema, payload);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { error } = await supabase.rpc('mark_notification_read', { p_id: parsed.data.notificationId });
  if (error) {
    console.error('mark_notification_read error:', error.message);
    return fail('failed', 'Could not update this notification.');
  }
  return ok();
}

/** Mark every unread notification of the signed-in user read. */
export async function markAllNotificationsReadAction(): Promise<ActionResult<{ marked: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  if (error) {
    console.error('mark_all_notifications_read error:', error.message);
    return fail('failed', 'Could not update your notifications.');
  }
  return ok({ marked: data ?? 0 });
}
