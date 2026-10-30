'use client';

import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { markThreadReadAction, sendMessageAction } from '@/lib/messages/actions';
import type { MessageLimits, ThreadMessage } from '@/lib/services/messages';
import type { ThreadAvailability } from '@/lib/messages/rules';
import { useRouteRefreshPoll } from '@/lib/realtime/useRouteRefreshPoll';
import { formatSlot } from '@/lib/shell/rules';

/**
 * The conversation on a job. Message text is rendered as plain text nodes (React escapes it),
 * so markup in a message is shown, never executed. The server component above supplies the
 * messages the user may read; sending goes through a server action and then refreshes.
 */
export function MessageThread({
  jobId,
  currentUserId,
  otherName,
  availability,
  messages,
  unread,
  limits,
  loadFailed,
}: {
  jobId: string;
  currentUserId: string;
  otherName: string;
  availability: Exclude<ThreadAvailability, 'not_open'>;
  messages: ThreadMessage[];
  unread: number;
  limits: MessageLimits | null;
  loadFailed: boolean;
}) {
  const router = useRouter();
  const fieldId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  // One key per message being composed: a retry after a failure reuses it, so it is stored once.
  const clientKey = useRef<string | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // A nudge to refetch when this job's messages change; the thread works without it.
  useRouteRefreshPoll();

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  // Opening the thread marks it read; refresh once so counts elsewhere catch up.
  useEffect(() => {
    if (unread === 0) return;
    let cancelled = false;
    void markThreadReadAction({ jobId }).then((result) => {
      if (!cancelled && result.success) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [jobId, unread, router]);

  const open = availability === 'open' && limits != null;
  const length = body.trim().length;
  const tooLong = limits != null && length > limits.maxLength;

  function send(event?: FormEvent) {
    event?.preventDefault();
    if (!open || pending || length === 0 || tooLong) return;
    clientKey.current ??= crypto.randomUUID();
    const key = clientKey.current;
    setError(null);
    startTransition(async () => {
      const result = await sendMessageAction({ jobId, body, clientKey: key });
      if (result.success === false) {
        setError(result.error);
        return;
      }
      clientKey.current = null;
      setBody('');
      router.refresh();
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send();
  }

  return (
    <div>
      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label={`Messages with ${otherName}`}
        tabIndex={0}
        className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-line bg-porcelain p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        {loadFailed ? (
          <p className="py-6 text-center text-sm text-ink-3">Messages could not be loaded. Refresh to try again.</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-3">
            {open ? `No messages yet. Say hello to ${otherName}.` : 'There were no messages on this job.'}
          </p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === currentUserId;
            return (
              <div key={message.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-6 ${
                    mine ? 'bg-teal text-paper' : 'border border-line bg-paper text-ink'
                  }`}
                >
                  {message.body}
                </p>
                <p className="mt-1 text-xs text-ink-4">
                  {mine ? 'You' : otherName} · {formatSlot(message.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {open ? (
        <form onSubmit={send} className="mt-3">
          <label htmlFor={fieldId} className="sr-only">
            Message to {otherName}
          </label>
          <textarea
            id={fieldId}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            aria-describedby={`${fieldId}-hint`}
            placeholder={`Message ${otherName}`}
            className="w-full resize-y rounded-xl border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p id={`${fieldId}-hint`} className={`text-xs ${tooLong ? 'font-medium text-danger' : 'text-ink-3'}`}>
              {limits ? `${length} / ${limits.maxLength}` : ''}
            </p>
            <button
              type="submit"
              disabled={pending || length === 0 || tooLong}
              className="inline-flex min-h-11 items-center rounded-xl bg-teal px-5 text-sm font-semibold text-paper transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send'}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      ) : (
        <p className="mt-3 text-xs text-ink-3">
          {availability === 'read_only'
            ? 'This job has ended, so the conversation is read-only.'
            : 'Messaging is unavailable right now.'}
        </p>
      )}
    </div>
  );
}
