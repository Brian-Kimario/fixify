import { Building2, CalendarClock, IndianRupee, MapPin } from 'lucide-react';
import type { ProJob } from '@/lib/services/shell';
import { formatSlot, offerLocalityLabel, offerPayBasis, propertyTypeLabel } from '@/lib/shell/rules';
import { OfferCountdown } from './OfferCountdown';
import { RequestCardActions } from './RequestCardActions';

/**
 * One job offer. Shows only what the professional is allowed to see before accepting:
 * service, time, area and city, property type, how it is priced and the customer's own
 * description. Customer name, street address and access notes come after acceptance.
 */
export function RequestCard({ job, serverNow }: { job: ProJob; serverNow: number }) {
  const slot = formatSlot(job.scheduledStart);
  const place = offerLocalityLabel(job.locality);
  const pay = offerPayBasis(job);

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
        {place && (
          <div className="flex items-center gap-2">
            <dt>
              <MapPin className="h-4 w-4 text-ink-4" aria-hidden="true" />
              <span className="sr-only">Area</span>
            </dt>
            <dd>{place}</dd>
          </div>
        )}
        {pay && (
          <div className="flex items-center gap-2">
            <dt>
              <IndianRupee className="h-4 w-4 text-ink-4" aria-hidden="true" />
              <span className="sr-only">{pay.label}</span>
            </dt>
            <dd>{pay.detail}</dd>
          </div>
        )}
      </dl>

      {(job.problemSummary || job.intakeOptions.length > 0) && (
        <div className="mt-3 rounded-xl bg-porcelain px-3.5 py-3">
          <p className="text-xs font-medium text-ink-4">From the customer</p>
          {job.problemSummary ? (
            <p className="mt-1 whitespace-pre-line break-words text-sm text-ink">{job.problemSummary}</p>
          ) : null}
          {job.intakeOptions.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Options chosen">
              {job.intakeOptions.map((o) => (
                <li key={o} className="rounded-md border border-line bg-paper px-2 py-0.5 text-xs text-ink-2">
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RequestCardActions jobId={job.id} serviceName={job.serviceName} />
    </article>
  );
}
