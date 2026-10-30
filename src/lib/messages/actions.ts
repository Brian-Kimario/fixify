'use server';

import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import {
  markThreadReadSchema,
  sendMessageSchema,
  type MarkThreadReadInput,
  type SendMessageInput,
} from '@/validators';

/**
 * Send a message on a job. The sender, the professional and the timestamp are all derived
 * inside send_job_message from the session; the browser only supplies the text and a retry key.
 */
export async function sendMessageAction(payload: SendMessageInput): Promise<ActionResult<{ id: string }>> {
  const parsed = parseInput(sendMessageSchema, payload);
  if (parsed.success === false) return parsed;
  const input = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to send messages.');

  const { data, error } = await supabase.rpc('send_job_message', {
    p_job_id: input.jobId,
    p_body: input.body,
    p_client_key: input.clientKey,
  });
  if (error) {
    if (error.code === 'P0002') return fail('not_found', 'This conversation is not available to you.');
    // 22023 (closed, empty, too long) and 54000 (too fast) carry messages written for the user.
    if (error.code === '22023' || error.code === '54000') return fail('rejected', error.message);
    console.error('send_job_message error:', error.message);
    return fail('failed', 'Could not send your message. Please try again.');
  }
  if (!data) return fail('failed', 'Could not send your message. Please try again.');
  return ok({ id: data });
}

/** Record that the signed-in user has read this job's thread. */
export async function markThreadReadAction(payload: MarkThreadReadInput): Promise<ActionResult> {
  const parsed = parseInput(markThreadReadSchema, payload);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { error } = await supabase.rpc('mark_job_thread_read', { p_job_id: parsed.data.jobId });
  if (error) {
    if (error.code === 'P0002') return fail('not_found', 'This conversation is not available to you.');
    console.error('mark_job_thread_read error:', error.message);
    return fail('failed', 'Could not update read state.');
  }
  return ok();
}
