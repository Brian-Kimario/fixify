'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timer } from 'lucide-react';
import { formatCountdown } from '@/lib/shell/rules';

/** Under this, the countdown turns urgent. */
const URGENT_MS = 5 * 60 * 1000;

/**
 * Time left to answer an offer, from `jobs.offer_expires_at`. Starts from the server's
 * clock so the first paint matches, then ticks locally. At zero it refreshes the page
 * once so the server drops the expired offer.
 */
export function OfferCountdown({ expiresAt, serverNow }: { expiresAt: string; serverNow: number }) {
  const router = useRouter();
  const deadline = new Date(expiresAt).getTime();
  const [now, setNow] = useState(serverNow);
  const refreshed = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = deadline - now;

  useEffect(() => {
    if (left <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [left, router]);

  if (Number.isNaN(deadline)) return null;

  const expired = left <= 0;
  const urgent = !expired && left < URGENT_MS;
  const minutesLeft = Math.max(0, Math.ceil(left / 60000));

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 tabular-nums ${
        expired ? 'bg-paper-2 text-ink-3' : urgent ? 'bg-clay-soft text-clay' : 'bg-teal-soft text-teal-deep'
      }`}
    >
      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
      <span aria-hidden="true">{expired ? 'Expired' : formatCountdown(left)}</span>
      {/* Announce minutes, not every second. */}
      <span className="sr-only">
        {expired ? 'Offer expired' : `${minutesLeft} ${minutesLeft === 1 ? 'minute' : 'minutes'} left to answer`}
      </span>
    </span>
  );
}
