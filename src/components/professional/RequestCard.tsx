import { Building2, CalendarClock } from 'lucide-react';
import type { ProJob } from '@/lib/services/shell';
import { formatSlot, propertyTypeLabel } from '@/lib/shell/rules';
import { OfferCountdown } from './OfferCountdown';
import { RequestCardActions } from './RequestCardActions';

/**
 * One job offer. Shows only what the professional is allowed to see before accepting:
 * service, category, time and property type. Customer name and address come after.
 */
export function RequestCard({ job, serverNow }: { job: ProJob; serverNow: number }) {
  const slot = formatSlot(job.scheduledStart);

  return (
    <article
      aria-label={`Request: ${job.serviceName}`}
      className="rounded-2xl border border-line bg-paper p-4 md:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-4">
            {job.categoryName ?? 'Service'}
            {job.reference ? ` · ${job.reference}` : ''}
          </p>
          <h3 className="mt-0.5 text-base font-semibold leading-snug text-ink">{job.serviceName}</h3>
        </div>
        {job.offerExpiresAt && <OfferCountdown expiresAt={job.offerExpiresAt} serverNow={serverNow} />}
      </div>

      <dl className="mt-3 grid gap-1.5 text-sm text-ink-2 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <dt>
            <CalendarClock className="h-4 w-4 text-ink-4" aria-hidden="true" />
            <span className="sr-only">When</span>
          </dt>
          <dd>{slot ?? 'Time not set'}</dd>
        </div>
        {job.propertyType && (
          <div className="flex items-center gap-2">
            <dt>
              <Building2 className="h-4 w-4 text-ink-4" aria-hidden="true" />
              <span className="sr-only">Property</span>
            </dt>
            <dd>{propertyTypeLabel(job.propertyType)}</dd>
          </div>
        )}
      </dl>

      <RequestCardActions jobId={job.id} serviceName={job.serviceName} />
    </article>
  );
}
