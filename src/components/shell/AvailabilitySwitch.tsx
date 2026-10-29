'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateAvailabilityStatus } from '@/app/professional/actions';

/**
 * Online/offline switch for professionals. Going online is refused by the server for
 * unverified profiles, so when `lockedReason` is set the switch is disabled and says why.
 */
export function AvailabilitySwitch({
  initial,
  lockedReason,
  compact = false,
}: {
  initial: boolean;
  lockedReason: string | null;
  compact?: boolean;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hintId = useId();

  // Follow the server value after a refresh (for example from another tab).
  const [serverValue, setServerValue] = useState(initial);
  if (serverValue !== initial) {
    setServerValue(initial);
    setOnline(initial);
  }

  // An offline, unverified pro cannot turn on. An online one (verification revoked)
  // can still go offline, so only block the switch-on direction.
  const disabled = pending || (lockedReason !== null && !online);

  function toggle() {
    const next = !online;
    setError(null);
    setOnline(next);
    startTransition(async () => {
      const result = await updateAvailabilityStatus(next);
      if (result.success === false) {
        setOnline(!next);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const hint = error ?? (lockedReason && !online ? lockedReason : null);

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        role="switch"
        aria-checked={online}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={toggle}
        title={hint ?? undefined}
        className={[
          'group inline-flex min-h-11 items-center gap-2.5 rounded-full border pl-1.5 pr-3 text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'disabled:cursor-not-allowed',
          online ? 'border-success/30 bg-success-soft text-success' : 'border-line bg-paper-2 text-ink-3',
          disabled && !pending ? 'opacity-70' : '',
        ].join(' ')}
      >
        <span
          className={[
            'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors',
            online ? 'bg-success' : 'bg-line-strong',
          ].join(' ')}
          aria-hidden="true"
        >
          <span
            className={[
              'inline-block h-5 w-5 rounded-full bg-paper shadow transition-transform motion-reduce:transition-none',
              online ? 'translate-x-[18px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </span>
        <span className={compact ? 'sr-only sm:not-sr-only' : ''}>
          {pending ? 'Saving…' : online ? 'Online' : 'Offline'}
        </span>
        <span className="sr-only"> — receive new job requests</span>
      </button>
      {/* The locked reason is also shown in the verification banner; errors need to be seen here. */}
      {hint && (
        <span
          id={hintId}
          role={error ? 'alert' : undefined}
          className={
            error
              ? 'absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-medium text-danger shadow-lg'
              : 'sr-only'
          }
        >
          {hint}
        </span>
      )}
    </div>
  );
}
