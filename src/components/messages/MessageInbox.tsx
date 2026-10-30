import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { EmptyState, Panel } from '@/components/shell/primitives';
import { notificationAge } from '@/lib/inapp-notifications/rules';
import { formatSlot } from '@/lib/shell/rules';
import { stateLabel } from '@/lib/jobs/states';
import type { InboxThread } from '@/lib/services/messages';

/**
 * One row per job conversation the viewer can read. Each row opens the case page at its Messages card,
 * where the same MessageThread used everywhere else shows the history. Only what the database
 * returned is shown: no row exists for a job that never had an open conversation.
 */
export function MessageInbox({
  threads,
  error,
  emptyBody,
}: {
  threads: InboxThread[];
  error: boolean;
  emptyBody: string;
}) {
  if (error) {
    return (
      <p role="alert" className="rounded-2xl border border-line bg-paper px-5 py-8 text-center text-sm text-ink-3">
        Your conversations could not be loaded. Refresh the page to try again.
      </p>
    );
  }
  if (threads.length === 0) {
    return <EmptyState icon={MessageSquare} title="No conversations yet" body={emptyBody} />;
  }

  const now = new Date();
  return (
    <Panel>
      <ul className="divide-y divide-line">
        {threads.map((thread) => (
          <li key={thread.jobId}>
            <Link
              href={`${thread.href}#messages`}
              className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-porcelain focus-visible:bg-porcelain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal"
            >
              <span
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${thread.unread > 0 ? 'bg-teal' : 'bg-transparent'}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className={`truncate text-[15px] text-ink ${thread.unread > 0 ? 'font-semibold' : 'font-medium'}`}>
                    {thread.counterpartName}
                  </span>
                  {thread.lastMessageAt && (
                    <span className="shrink-0 text-xs text-ink-4">
                      {notificationAge(thread.lastMessageAt, now, formatSlot)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-3">
                  {thread.serviceName} · {thread.reference}
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <span
                    className={`min-w-0 flex-1 truncate text-sm ${thread.unread > 0 ? 'font-medium text-ink' : 'text-ink-3'}`}
                  >
                    {thread.preview
                      ? `${thread.lastFromMe ? 'You: ' : ''}${thread.preview}`
                      : 'No messages yet. Say hello.'}
                  </span>
                  {thread.unread > 0 && (
                    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-clay px-1.5 text-[11px] font-semibold leading-5 text-paper">
                      <span className="sr-only">{thread.unread} unread</span>
                      <span aria-hidden="true">{thread.unread > 9 ? '9+' : thread.unread}</span>
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-x-2 text-xs text-ink-4">
                  <span>{stateLabel(thread.jobState)}</span>
                  {thread.availability === 'read_only' && <span>· Read only, this job is closed</span>}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
