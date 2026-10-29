import Link from 'next/link';
import { getUnmatchedBookings } from '@/lib/services/admin';

export const metadata = {
  title: 'Unmatched bookings — Feasy Admin',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Open bookings the matcher found no eligible professional for (bookings.unmatched_since).
 * Read-only: there is no admin assign action yet.
 */
export default async function UnmatchedBookingsPage() {
  const { data: bookings, error } = await getUnmatchedBookings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <Link href="/admin/operations" className="text-sm text-ink-3 hover:text-teal">
        ← Operations
      </Link>
      <div className="mb-6 mt-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.11em] text-ink-4">Admin · Operations</p>
        <h1 className="mb-2 text-3xl font-bold text-ink">Unmatched bookings</h1>
        <p className="text-ink-3">
          Open bookings with no eligible professional, oldest first. Offers are not retried
          automatically; the assignment queue has no schedule yet.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {error}
        </p>
      ) : bookings.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper p-6 text-sm text-ink-3">
          No unmatched bookings right now.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
          {bookings.map((booking) => (
            <li key={booking.id} className="grid gap-1 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4">
              <div className="min-w-0">
                <p className="font-bold text-ink">
                  {booking.serviceName}
                  {booking.city && <span className="font-normal text-ink-3"> · {booking.city}</span>}
                </p>
                <p className="font-mono text-xs text-ink-4">{booking.reference}</p>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-xs sm:text-right">
                <div>
                  <dt className="text-ink-4">Scheduled</dt>
                  <dd className="text-ink-2">{formatDateTime(booking.scheduledStart)}</dd>
                </div>
                <div>
                  <dt className="text-ink-4">Unmatched since</dt>
                  <dd className="text-ink-2">{formatDateTime(booking.unmatchedSince)}</dd>
                </div>
                <div>
                  <dt className="text-ink-4">Declined or expired</dt>
                  <dd className="text-ink-2">{booking.attempts}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
