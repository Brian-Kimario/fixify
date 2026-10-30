'use client';

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { reissueJobCodeAction } from '@/lib/job-codes/actions';
import { CODE_MAX_ATTEMPTS } from '@/lib/job-codes/rules';
import { formatSlot } from '@/lib/shell/rules';
import type { JobCodeState } from '@/lib/services/job-codes';

const COPY = {
  start: { title: 'Start code', body: 'Give this code to the professional when they arrive. They cannot start work without it.' },
  finish: { title: 'Finish code', body: 'Give this code to the professional only when you are happy the work is done.' },
} as const;

/** The customer's own code for this stage. Only the customer is sent the digits. */
export function JobCodeCard({ jobId, state }: { jobId: string; state: JobCodeState }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[state.purpose];

  function reissue() {
    setError(null);
    startTransition(async () => {
      const result = await reissueJobCodeAction({ jobId });
      if (result.success === false) setError(result.error);
    });
  }

  const canReissue = state.status !== 'used' && state.reissuesLeft > 0;

  return (
    <div className="rounded-2xl border border-teal/30 bg-paper p-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink">{copy.title}</p>
          {state.status === 'active' && state.code ? (
            <>
              <p
                className="mt-2 font-mono text-3xl font-semibold tracking-[0.3em] text-ink"
                aria-label={`${copy.title}: ${state.code.split('').join(' ')}`}
              >
                {state.code}
              </p>
              <p className="mt-2 text-ink-2">{copy.body}</p>
              <p className="mt-1 text-xs text-ink-3">
                {state.expiresAt ? `Valid until ${formatSlot(state.expiresAt)}. ` : ''}
                {state.attemptsLeft != null && state.attemptsLeft < CODE_MAX_ATTEMPTS
                  ? `${state.attemptsLeft} wrong ${state.attemptsLeft === 1 ? 'try' : 'tries'} left before it locks.`
                  : ''}
              </p>
            </>
          ) : state.status === 'used' ? (
            <p className="mt-1 text-ink-2">The professional entered this code. Thank you.</p>
          ) : (
            <p className="mt-1 text-ink-2">
              {state.status === 'locked'
                ? 'Too many wrong attempts locked this code.'
                : state.status === 'expired'
                  ? 'This code has expired.'
                  : 'There is no active code.'}{' '}
              {canReissue ? 'Request a new one below.' : 'Contact support if you still need one.'}
            </p>
          )}
          {state.status !== 'used' && (
            <div className="mt-3">
              {canReissue ? (
                <button
                  type="button"
                  onClick={reissue}
                  disabled={pending}
                  aria-busy={pending}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal px-4 text-sm font-semibold text-teal transition-colors hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50"
                >
                  {pending ? 'Issuing…' : 'Get a new code'}
                </button>
              ) : (
                <p className="text-xs text-ink-3">New codes used up for this job. Contact support if you need help.</p>
              )}
              {canReissue && (
                <p className="mt-1 text-xs text-ink-3">
                  {state.reissuesLeft} new {state.reissuesLeft === 1 ? 'code' : 'codes'} left for this job.
                </p>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
