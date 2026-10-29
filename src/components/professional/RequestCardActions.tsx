'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { acceptRequest, declineJobAction } from '@/app/professional/actions';

const REASON_MAX = 500;

/**
 * Accept or decline an offer. Accepting opens the job; declining asks for confirmation
 * (with an optional reason) and passes the offer on through the `decline_job` RPC.
 */
export function RequestCardActions({ jobId, serviceName }: { jobId: string; serviceName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const reasonId = useId();
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

  function decline() {
    setError(null);
    setBusy('decline');
    startTransition(async () => {
      const trimmed = reason.trim();
      const result = await declineJobAction(jobId, trimmed || undefined);
      if (result.success === false) {
        setError(result.error);
        setBusy(null);
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
        <label htmlFor={reasonId} className="mt-3 block text-sm font-medium text-ink-2">
          Reason <span className="font-normal text-ink-4">(optional)</span>
        </label>
        <textarea
          id={reasonId}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={REASON_MAX}
          rows={2}
          disabled={pending}
          aria-describedby={error ? errorId : undefined}
          placeholder="For example, I’m booked at that time"
          className="mt-1.5 w-full resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-4 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-60"
        />
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
            disabled={pending}
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
