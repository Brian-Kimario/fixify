'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { acceptRequest, declineJobAction } from '@/app/professional/actions';
import type { DeclineReasonCode } from '@/validators';

const NOTE_MAX = 500;

/** Labels for the reason codes decline_job accepts. */
const DECLINE_REASONS: { code: DeclineReasonCode; label: string }[] = [
  { code: 'schedule_conflict', label: 'I’m busy at that time' },
  { code: 'too_far', label: 'Too far away' },
  { code: 'not_my_skill', label: 'Not a job I do' },
  { code: 'need_more_detail', label: 'Not enough detail' },
  { code: 'other', label: 'Other' },
];

/**
 * Accept or decline an offer. Accepting opens the job; declining asks for a reason and
 * passes the offer on through the `decline_job` RPC. `afterDeclineHref` sends the
 * professional elsewhere once they decline, for pages they lose access to.
 */
export function RequestCardActions({
  jobId,
  serviceName,
  afterDeclineHref,
}: {
  jobId: string;
  serviceName: string;
  afterDeclineHref?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reasonCode, setReasonCode] = useState<DeclineReasonCode | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const reasonId = useId();
  const noteId = useId();
  const errorId = useId();

  function accept() {
    setError(null);
    setBusy('accept');
    startTransition(async () => {
      const result = await acceptRequest(jobId);
      if (result.success === false) {
        setError(result.error);
        setBusy(null);
        router.refresh();
        return;
      }
      router.push(`/professional/jobs/${result.data.jobId}`);
    });
  }

  const noteRequired = reasonCode === 'other';
  const canDecline = reasonCode !== null && (!noteRequired || note.trim().length > 0);

  function decline() {
    if (!reasonCode) {
      setError('Choose a reason.');
      return;
    }
    setError(null);
    setBusy('decline');
    startTransition(async () => {
      const result = await declineJobAction({ jobId, reasonCode, note: note.trim() || undefined });
      if (result.success === false) {
        setError(result.error);
        setBusy(null);
        return;
      }
      if (afterDeclineHref) {
        router.push(afterDeclineHref);
        return;
      }
      setDeclined(true);
      setBusy(null);
      router.refresh();
    });
  }

  if (declined) {
    return (
      <p role="status" className="mt-4 rounded-xl bg-paper-2 px-4 py-3 text-sm text-ink-2">
        Declined. We’ll try to offer it to another professional.
      </p>
    );
  }

  const errorBox = error && (
    <p id={errorId} role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      {error}
    </p>
  );

  if (confirming) {
    return (
      <div className="mt-4 rounded-xl border border-line bg-porcelain p-4">
        <p className="text-sm font-semibold text-ink">Decline {serviceName}?</p>
        <p className="mt-0.5 text-sm text-ink-3">We’ll try to offer it to another professional.</p>
        <fieldset className="mt-3" disabled={pending} aria-describedby={error ? errorId : undefined}>
          <legend id={reasonId} className="text-sm font-medium text-ink-2">
            Why are you declining?
          </legend>
          <div role="radiogroup" aria-labelledby={reasonId} className="mt-2 grid gap-2 sm:grid-cols-2">
            {DECLINE_REASONS.map((r) => (
              <label
                key={r.code}
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-line bg-paper px-3 text-sm text-ink transition-colors hover:border-line-strong has-[:checked]:border-teal has-[:checked]:bg-teal-wash has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal/40"
              >
                <input
                  type="radio"
                  name={`decline-${jobId}`}
                  value={r.code}
                  checked={reasonCode === r.code}
                  onChange={() => {
                    setReasonCode(r.code);
                    setError(null);
                  }}
                  className="h-4 w-4 accent-teal"
                />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>
        {reasonCode !== null && (
          <>
            <label htmlFor={noteId} className="mt-3 block text-sm font-medium text-ink-2">
              Note{' '}
              <span className="font-normal text-ink-4">{noteRequired ? '(required)' : '(optional)'}</span>
            </label>
            <textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={NOTE_MAX}
              rows={2}
              disabled={pending}
              required={noteRequired}
              aria-describedby={error ? errorId : undefined}
              placeholder={noteRequired ? 'Tell us why you’re declining' : 'Anything we should know?'}
              className="mt-1.5 w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
            />
          </>
        )}
        {errorBox}
        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-60"
          >
            Keep request
          </button>
          <button
            type="button"
            onClick={decline}
            disabled={pending || !canDecline}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-danger px-4 text-sm font-semibold text-paper transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {busy === 'decline' ? 'Declining…' : 'Decline request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-paper px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-danger/30 hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Decline
        </button>
        <button
          type="button"
          onClick={accept}
          disabled={pending}
          aria-describedby={error ? errorId : undefined}
          className="inline-flex min-h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-teal px-4 text-sm font-semibold text-paper transition-colors hover:bg-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          {busy === 'accept' ? 'Accepting…' : 'Accept'}
        </button>
      </div>
      {errorBox}
    </div>
  );
}
