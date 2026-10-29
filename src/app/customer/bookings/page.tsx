import Link from 'next/link';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ArrowLeft, CalendarClock, CalendarPlus, CircleAlert, Home, Inbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCustomerDashboardExtras, getCustomerShell, type CustomerBooking } from '@/lib/services/shell';
import { formatCurrency } from '@/lib/currency';
import { STATE_META, isJobState } from '@/lib/jobs/states';
import { BOOKING_TABS, bookingStatusDisplay, formatSlot, isBookingTab, type BookingTab } from '@/lib/shell/rules';
import {
  EmptyState,
  JobProgress,
  LinkButton,
  PageContainer,
  PageHeader,
  StatusPill,
} from '@/components/shell/primitives';

export const metadata = {
  title: 'Bookings — Feasy',
};

const searchParamsSchema = z.object({
  tab: z.string().optional(),
  property_id: z.string().uuid().optional(),
});

const TAB_LABEL: Record<BookingTab, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  past: 'Past',
};

const TAB_EMPTY: Record<BookingTab, { title: string; body: string }> = {
  active: { title: 'Nothing in progress', body: 'Bookings a professional is working on show up here.' },
  upcoming: { title: 'Nothing scheduled', body: 'Bookings with a future time slot show up here.' },
  past: { title: 'No history yet', body: 'Finished and cancelled bookings show up here.' },
};

const money = (amount: number) => formatCurrency(amount, { minimumFractionDigits: 0 });

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/customer/bookings');

  const parsed = searchParamsSchema.safeParse(await searchParams);
  const params = parsed.success ? parsed.data : {};

  const [shell, extras] = await Promise.all([getCustomerShell(user.id), getCustomerDashboardExtras(user.id)]);

  // The property list is already limited to the customer's own properties.
  const property = params.property_id ? extras.properties.find((p) => p.id === params.property_id) ?? null : null;
  const propertyMissing = Boolean(params.property_id) && !property && !extras.error;

  const scoped = property ? shell.bookings.filter((b) => b.propertyId === property.id) : shell.bookings;
  const byTab: Record<BookingTab, CustomerBooking[]> = {
    active: scoped.filter((b) => b.tab === 'active'),
    upcoming: scoped
      .filter((b) => b.tab === 'upcoming')
      .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? '')),
    past: scoped.filter((b) => b.tab === 'past'),
  };

  // Without an explicit tab, open the first one that has something in it.
  const tab: BookingTab = isBookingTab(params.tab)
    ? params.tab
    : BOOKING_TABS.find((t) => byTab[t].length > 0) ?? 'active';
  const list = byTab[tab];

  const hrefFor = (t: BookingTab) => {
    const q = new URLSearchParams({ tab: t });
    if (property) q.set('property_id', property.id);
    return `/customer/bookings?${q.toString()}`;
  };

  return (
    <PageContainer>
      {property && (
        <Link
          href="/customer/bookings"
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-lg text-sm font-medium text-teal hover:text-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All bookings
        </Link>
      )}

      <PageHeader
        eyebrow={property ? 'Property' : undefined}
        title={property ? property.name : 'Bookings'}
        description={
          property
            ? 'Every service booked for this property.'
            : 'Track work in progress, see what’s coming up and look back at past jobs.'
        }
        actions={
          <LinkButton href="/customer/bookings/new">
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Book a service
          </LinkButton>
        }
      />

      {(shell.error || propertyMissing) && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {shell.error
              ? 'We couldn’t load your bookings just now. Refresh the page to try again.'
              : 'That property isn’t on your account. Showing all bookings instead.'}
          </p>
        </div>
      )}

      <nav aria-label="Booking status" className="mb-6 border-b border-line">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {BOOKING_TABS.map((t) => {
            const current = t === tab;
            return (
              <li key={t}>
                <Link
                  href={hrefFor(t)}
                  aria-current={current ? 'page' : undefined}
                  scroll={false}
                  className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal ${
                    current ? 'border-teal text-ink' : 'border-transparent text-ink-3 hover:text-ink'
                  }`}
                >
                  {TAB_LABEL[t]}
                  <span
                    className={`rounded-full px-2 text-xs leading-5 tabular-nums ${
                      current ? 'bg-teal-soft text-teal-deep' : 'bg-paper-2 text-ink-3'
                    }`}
                  >
                    {byTab[t].length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={scoped.length === 0 ? 'No bookings yet' : TAB_EMPTY[tab].title}
          body={
            scoped.length === 0
              ? property
                ? 'Services you book for this property will appear here.'
                : 'Book your first service and follow it here from start to finish.'
              : TAB_EMPTY[tab].body
          }
          action={scoped.length === 0 ? { href: '/customer/bookings/new', label: 'Book a service' } : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((b) => (
            <li key={b.id}>
              <BookingCard booking={b} showProperty={!property} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

function BookingCard({ booking, showProperty }: { booking: CustomerBooking; showProperty: boolean }) {
  const state = booking.job?.state ?? null;
  const status = bookingStatusDisplay({ bookingStatus: booking.bookingStatus, jobState: state, unmatchedSince: booking.unmatchedSince });
  const copy = state && isJobState(state) ? STATE_META[state].customerCopy : null;
  const slot = formatSlot(booking.scheduledStart);
  const live = booking.tab === 'active' && state !== null;

  return (
    <Link
      href={`/customer/bookings/${booking.id}`}
      className="block rounded-2xl border border-line bg-paper p-4 transition-colors hover:border-line-strong hover:bg-paper-2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-4">
            {booking.reference}
            {booking.categoryName ? ` · ${booking.categoryName}` : ''}
          </p>
          <h2 className="mt-0.5 truncate text-base font-semibold text-ink">{booking.serviceName}</h2>
        </div>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </div>

      {live && copy && <p className="mt-2 text-sm text-ink-2">{copy}</p>}
      {live && state && (
        <div className="mt-4">
          <JobProgress state={state} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            {slot ?? 'Time not set'}
          </span>
          {showProperty && booking.propertyName && (
            <span className="inline-flex items-center gap-1.5">
              <Home className="h-4 w-4" aria-hidden="true" />
              {booking.propertyName}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {booking.pendingQuote && <StatusPill tone="clay">Quote waiting · {money(booking.pendingQuote.total)}</StatusPill>}
          {booking.paymentDue && <StatusPill tone="ochre">Payment due</StatusPill>}
          {booking.amount != null && (
            <span className="font-semibold tabular-nums text-ink">
              <span className="sr-only">Booking amount </span>
              {money(booking.amount)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
