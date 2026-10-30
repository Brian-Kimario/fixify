'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { verifyJobCodeAction } from '@/lib/job-codes/actions';
import { verifyFailureMessage } from '@/lib/job-codes/rules';
import type { JobCodeState } from '@/lib/services/job-codes';

const COPY = {
  start: {
    heading: 'Start code',
    help: 'Ask the customer for the 6-digit start code shown in their app. Work cannot begin without it.',
    done: 'Start code verified. You can start work.',
  },
  finish: {
    heading: 'Finish code',
    help: 'When the work is done, ask the customer for the 6-digit finish code. Marking the job complete needs it.',
    done: 'Finish code verified. You can mark the job complete.',
  },
} as const;

/**
 * The assigned professional types in the code the customer reads out. The code itself is never sent
 * to this component; the database checks it, counts wrong tries and locks after five.
 */
export function JobCodeEntry({ jobId, state }: { jobId: string; state: JobCodeState }) {
  const router = useRouter();
  const inputId = useId();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const copy = COPY[state.purpose];

  if (state.status === 'used') {
    return (
      <p role="status" className="rounded-xl bg-teal-soft px-4 py-3 text-sm font-semibold text-teal-deep">
        {copy.done}
      </p>
    );
  }

  const blocked = state.status === 'locked' || state.status === 'expired' || state.status === 'none';
  const blockedReason =
    state.status === 'locked' ? 'locked' : state.status === 'expired' ? 'expired' : 'no_code';

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await verifyJobCodeAction({ jobId, purpose: state.purpose, code: value });
      if (result.success === false) {
        setError(result.error);
        return;
      }
      setValue('');
      if (result.data.verified === false) setError(result.data.message);
      router.refresh();
    });
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {copy.heading}
      </label>
      <p className="mt-0.5 text-xs text-ink-3">{copy.help}</p>
      {blocked ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {verifyFailureMessage(blockedReason, null)}
        </p>
      ) : (
        <form
          className="mt-2 flex flex-wrap items-start gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            id={inputId}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={value}
            disabled={pending}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className="min-h-11 w-36 rounded-xl border border-line bg-paper px-3 text-center font-mono text-lg tracking-[0.3em] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={pending || value.length !== 6}
            aria-busy={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-teal px-4 text-sm font-semibold text-teal transition-colors hover:bg-teal-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-50"
          >
            {pending ? 'Checking…' : 'Verify code'}
          </button>
        </form>
      )}
      {!blocked && state.attemptsLeft != null && state.attemptsLeft < 5 && !error && (
        <p className="mt-2 text-xs text-ink-3">
          {state.attemptsLeft} {state.attemptsLeft === 1 ? 'try' : 'tries'} left on this code.
        </p>
      )}
      {error && (
        <p id={`${inputId}-err`} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
