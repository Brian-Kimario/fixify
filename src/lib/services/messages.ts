import { createClient } from '@/lib/supabase/server';
import { threadAvailability, type ThreadAvailability } from '@/lib/messages/rules';

/**
 * Job messaging reads. Every query uses the RLS-scoped server client: job_messages policies
 * decide what a user can see, so these loaders cannot return another party's conversation.
 */

export interface ThreadMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface MessageLimits {
  maxLength: number;
  perMinute: number;
}

export interface JobThread {
  availability: ThreadAvailability;
  messages: ThreadMessage[];
  /** Messages from the other party newer than the user's last read. */
  unread: number;
  limits: MessageLimits | null;
  error: boolean;
}

/** Newest messages shown in a case file; older ones are not loaded. */
const THREAD_PAGE = 200;

async function getMessageLimits(): Promise<MessageLimits | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messaging_config')
    .select('key, value')
    .in('key', ['message_max_length', 'messages_per_minute']);
  if (error) {
    console.error('getMessageLimits:', error.message);
    return null;
  }
  const maxLength = data?.find((row) => row.key === 'message_max_length')?.value;
  const perMinute = data?.find((row) => row.key === 'messages_per_minute')?.value;
  if (maxLength == null || perMinute == null) return null;
  return { maxLength: Number(maxLength), perMinute: Number(perMinute) };
}

/** The thread for one job as the signed-in user may read it. */
export async function getJobThread(userId: string, jobId: string, jobState: string): Promise<JobThread> {
  const availability = threadAvailability(jobState);
  if (availability === 'not_open') {
    return { availability, messages: [], unread: 0, limits: null, error: false };
  }

  const supabase = await createClient();
  const [messagesResult, readResult, limits] = await Promise.all([
    supabase
      .from('job_messages')
      .select('id, sender_id, body, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(THREAD_PAGE),
    supabase.from('job_message_reads').select('last_read_at').eq('job_id', jobId).eq('user_id', userId).maybeSingle(),
    availability === 'open' ? getMessageLimits() : Promise.resolve(null),
  ]);

  if (messagesResult.error) console.error('getJobThread:', messagesResult.error.message);
  if (readResult.error) console.error('getJobThread reads:', readResult.error.message);

  const messages = (messagesResult.data ?? [])
    .map((row) => ({ id: row.id, senderId: row.sender_id, body: row.body, createdAt: row.created_at }))
    .reverse();
  const lastRead = readResult.data?.last_read_at ? Date.parse(readResult.data.last_read_at) : Number.NEGATIVE_INFINITY;
  const unread = messages.filter((m) => m.senderId !== userId && Date.parse(m.createdAt) > lastRead).length;

  return { availability, messages, unread, limits, error: Boolean(messagesResult.error) };
}
