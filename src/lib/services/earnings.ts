import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isJobState, type JobState } from '@/lib/jobs/states';
import { one } from '@/lib/services/shell';
import { PLATFORM_TIME_ZONE } from '@/lib/shell/rules';

/**
 * Job value for a professional, read from their own jobs (RLS-scoped).
 *
 * Amounts are the agreed job price: the latest approved quote, else the booking price —
 * the same rule `_job_payment_amount()` uses to charge the customer. A quote still waiting
 * for the customer is never counted. These are gross job prices, not payouts: the app
 * does not track platform fees or payouts, so neither is shown.
 */

export type EarningsBucket = 'paid' | 'awaiting_payment' | 'in_hand';

/** `closed` means the customer paid through the app; `completed` means work done, payment due. */
const BUCKET_BY_STATE: Partial<Record<JobState, EarningsBucket>> = {
  closed: 'paid',
  completed: 'awaiting_payment',
  accepted: 'in_hand',
  on_the_way: 'in_hand',
  arrived: 'in_hand',
  in_progress: 'in_hand',
  quote_pending: 'in_hand',
};

export interface EarningsJob {
  id: string;
  serviceName: string;
  categoryName: string | null;
  state: JobState;
  bucket: EarningsBucket;
  amount: number;
  /** `unpriced`: no approved quote and no booking price, so nothing can be charged yet. */
  basis: 'approved_quote' | 'booking_price' | 'unpriced';
  hasPendingQuote: boolean;
  /** When the job reached its bucket: paid → closed_at, done → completed_at, else scheduled start. */
  date: string | null;
  completedAt: string | null;
}

export interface EarningsTotals {
  value: number;
  count: number;
}

export interface EarningsMonth {
  key: string;
  label: string;
  value: number;
  count: number;
}

export interface ProfessionalEarnings {
  paid: EarningsTotals;
  awaitingPayment: EarningsTotals;
  inHand: EarningsTotals;
  /** Finished work (paid + awaiting payment) by month of completion, oldest first. */
  months: EarningsMonth[];
  jobs: EarningsJob[];
}

const MONTHS_SHOWN = 6;

interface QuoteRow {
  total: number;
  status: string;
  created_at: string | null;
}

/** Mirrors `_job_payment_amount()`: newest approved quote with a positive total, else the booking price. */
function agreedAmount(quotes: QuoteRow[], bookingAmount: number | null) {
  const approved = quotes
    .filter((q) => q.status === 'approved' && q.total > 0)
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))[0];
  if (approved) return { amount: Number(approved.total), basis: 'approved_quote' as const };
  const price = Number(bookingAmount ?? 0);
  if (price > 0) return { amount: price, basis: 'booking_price' as const };
  return { amount: 0, basis: 'unpriced' as const };
}

/** 'YYYY-MM' in the platform time zone, so a job finished late on the 31st IST lands in that month. */
const MONTH_KEY = new Intl.DateTimeFormat('en-CA', { timeZone: PLATFORM_TIME_ZONE, year: 'numeric', month: '2-digit' });
const monthKey = (d: Date) => MONTH_KEY.format(d).slice(0, 7);

export const getProfessionalEarnings = cache(async (professionalId: string): Promise<ProfessionalEarnings | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `id, current_state, completed_at, closed_at, created_at,
       booking:bookings(quoted_or_base_amount, scheduled_start, service:services(name, category:service_categories(name))),
       quotes(total, status, created_at)`,
    )
    .eq('professional_id', professionalId)
    .order('created_at', { ascending: false });

  if (error) return null;

  const jobs: EarningsJob[] = [];
  for (const row of data ?? []) {
    if (!isJobState(row.current_state)) continue;
    const bucket = BUCKET_BY_STATE[row.current_state];
    if (!bucket) continue;

    const booking = one(row.booking);
    const service = one(booking?.service ?? null);
    const quotes: QuoteRow[] = row.quotes ?? [];
    const { amount, basis } = agreedAmount(quotes, booking?.quoted_or_base_amount ?? null);

    jobs.push({
      id: row.id,
      serviceName: service?.name ?? 'Service',
      categoryName: one(service?.category ?? null)?.name ?? null,
      state: row.current_state,
      bucket,
      amount,
      basis,
      hasPendingQuote: quotes.some((q) => q.status === 'pending_customer'),
      date:
        bucket === 'paid'
          ? (row.closed_at ?? row.completed_at)
          : bucket === 'awaiting_payment'
            ? row.completed_at
            : (booking?.scheduled_start ?? row.created_at),
      completedAt: row.completed_at ?? row.closed_at,
    });
  }

  const total = (bucket: EarningsBucket): EarningsTotals => {
    const list = jobs.filter((j) => j.bucket === bucket);
    return { value: list.reduce((sum, j) => sum + j.amount, 0), count: list.length };
  };

  const [year, month] = monthKey(new Date()).split('-').map(Number);
  const months: EarningsMonth[] = [];
  for (let i = MONTHS_SHOWN - 1; i >= 0; i--) {
    // Mid-month at noon UTC is the same calendar month in every time zone.
    const d = new Date(Date.UTC(year, month - 1 - i, 15, 12));
    months.push({
      key: monthKey(d),
      label: d.toLocaleString('en-IN', { month: 'short', timeZone: 'UTC' }),
      value: 0,
      count: 0,
    });
  }
  for (const job of jobs) {
    if (job.bucket === 'in_hand') continue;
    const finishedAt = job.completedAt;
    if (!finishedAt) continue;
    const month = months.find((m) => m.key === monthKey(new Date(finishedAt)));
    if (month) {
      month.value += job.amount;
      month.count += 1;
    }
  }

  return {
    paid: total('paid'),
    awaitingPayment: total('awaiting_payment'),
    inHand: total('in_hand'),
    months,
    jobs,
  };
});
