import { createClient } from '@/lib/supabase/server';
import { compareInbox, MESSAGING_OPEN_STATES, threadAvailability, type ThreadAvailability } from '@/lib/messages/rules';
import { getBookingProfessional } from '@/lib/services/matching';
import { getJobCustomerContact } from '@/app/professional/actions';
import { one } from '@/lib/services/shell';

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

/* ── Inbox ───────────────────────────────────────────────────────────────── */

/** Most conversations listed; the newest are kept. */
const INBOX_LIMIT = 50;

export interface InboxThread {
  jobId: string;
  /** Case page for this job, for the viewer's role. */
  href: string;
  reference: string;
  serviceName: string;
  counterpartName: string;
  jobState: string;
  availability: Exclude<ThreadAvailability, 'not_open'>;
  lastMessageAt: string | null;
  lastFromMe: boolean;
  preview: string | null;
  unread: number;
}

/** Unread messages across every conversation the user can read. Null if it could not be read. */
export async function getUnreadMessageCount(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_message_threads');
  if (error) {
    console.error('getUnreadMessageCount:', error.message);
    return null;
  }
  return (data ?? []).reduce((sum, row) => sum + row.unread_count, 0);
}

/**
 * Conversations for the signed-in user: every job they can message on now (even with no messages
 * yet) plus every job they have messages on (read-only once it has ended). Both come from
 * RLS-scoped reads; get_message_threads is SECURITY INVOKER so counts and previews are only of
 * messages this user may read.
 */
export async function getMessageInbox(userId: string, role: 'customer' | 'professional'): Promise<{ threads: InboxThread[]; error: boolean }> {
  const supabase = await createClient();
  const ownerColumn = role === 'customer' ? 'customer_id' : 'professional_id';
  const select =
    'id, booking_id, current_state, created_at, booking:bookings!jobs_booking_id_fkey ( booking_reference, service:services!bookings_service_id_fkey ( name ) )';

  const [threadsResult, openResult] = await Promise.all([
    supabase.rpc('get_message_threads'),
    supabase.from('jobs').select(select).eq(ownerColumn, userId).in('current_state', [...MESSAGING_OPEN_STATES]),
  ]);
  if (threadsResult.error) console.error('getMessageInbox threads:', threadsResult.error.message);
  if (openResult.error) console.error('getMessageInbox jobs:', openResult.error.message);
  if (threadsResult.error || openResult.error) return { threads: [], error: true };

  const threadRows = new Map((threadsResult.data ?? []).map((row) => [row.job_id, row]));
  const openJobs = openResult.data ?? [];
  const missingIds = [...threadRows.keys()].filter((id) => !openJobs.some((job) => job.id === id));

  const endedResult = missingIds.length
    ? await supabase.from('jobs').select(select).eq(ownerColumn, userId).in('id', missingIds)
    : { data: [], error: null };
  if (endedResult.error) {
    console.error('getMessageInbox ended jobs:', endedResult.error.message);
    return { threads: [], error: true };
  }

  const jobs = [...openJobs, ...(endedResult.data ?? [])];
  const base = jobs.map((job) => {
    const booking = one(job.booking);
    const thread = threadRows.get(job.id);
    return {
      job,
      thread,
      row: {
        jobId: job.id,
        href: role === 'customer' ? `/customer/bookings/${job.booking_id}` : `/professional/jobs/${job.id}`,
        reference: booking?.booking_reference ?? 'Booking',
        serviceName: one(booking?.service)?.name ?? 'Service',
        jobState: job.current_state,
        availability: threadAvailability(job.current_state) === 'open' ? ('open' as const) : ('read_only' as const),
        lastMessageAt: thread?.last_message_at ?? null,
        lastFromMe: thread?.last_sender_id === userId,
        preview: thread?.last_body ?? null,
        unread: thread?.unread_count ?? 0,
      },
    };
  });

  const ranked = base
    .sort((a, b) => compareInbox({ ...a.row, jobCreatedAt: a.job.created_at ?? '' }, { ...b.row, jobCreatedAt: b.job.created_at ?? '' }))
    .slice(0, INBOX_LIMIT);

  const names = await Promise.all(
    ranked.map(async ({ job }) => {
      if (role === 'customer') return (await getBookingProfessional(job.booking_id))?.displayName ?? 'Your professional';
      return (await getJobCustomerContact(job.id))?.full_name?.trim() || 'The customer';
    }),
  );

  return { threads: ranked.map(({ row }, i) => ({ ...row, counterpartName: names[i] })), error: false };
}
