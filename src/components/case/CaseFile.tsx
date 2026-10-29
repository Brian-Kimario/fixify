import type { ReactNode } from 'react';
import { Check, CircleAlert, FileText } from 'lucide-react';
import type { JobStateTone } from '@/lib/jobs/states';
import type { CaseRole, ProgressStep, TimelineEntry } from '@/lib/jobs/progress';
import type { CaseInspection, CaseMedia, CaseQuote } from '@/lib/services/job-case';
import { formatSlot, formatTime } from '@/lib/shell/rules';
import { JOB_MEDIA_KIND_LABEL, type JobMediaKind } from '@/validators';
import { formatCurrency } from '@/lib/currency';
import { Panel, StatusPill } from '@/components/shell/primitives';

/* Server-rendered parts of the case file shared by the customer and professional job pages. */

const DOT_TONE: Record<JobStateTone, string> = {
  neutral: 'bg-ink-4',
  teal: 'bg-teal',
  blue: 'bg-blue',
  clay: 'bg-clay',
  ochre: 'bg-ochre',
  success: 'bg-success',
  danger: 'bg-danger',
};

export function CaseCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Panel className="p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </Panel>
  );
}

export function IncompleteNotice() {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl border border-ochre/30 bg-ochre-soft px-4 py-3 text-sm text-ink-2">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ochre" aria-hidden="true" />
      Part of this job&apos;s history could not be loaded. Refresh the page to try again.
    </div>
  );
}

/** Steps from booking to payment, as a vertical list. */
export function CaseProgress({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="space-y-0" aria-label="Job progress">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const time = step.status === 'done' ? formatSlot(step.at) : null;
        return (
          <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0" aria-current={step.status === 'current' ? 'step' : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[11px] top-6 bottom-0 w-px ${step.status === 'done' ? 'bg-teal/40' : 'bg-line'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                step.status === 'done'
                  ? step.tone === 'danger'
                    ? 'bg-danger text-paper'
                    : 'bg-teal text-paper'
                  : step.status === 'current'
                    ? 'border-2 border-teal bg-paper'
                    : 'border border-line-strong bg-paper'
              }`}
            >
              {step.status === 'done' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {step.status === 'current' && <span className="h-2 w-2 rounded-full bg-teal" />}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={`text-sm leading-5 ${
                  step.status === 'current' ? 'font-semibold text-ink' : step.status === 'done' ? 'text-ink' : 'text-ink-4'
                }`}
              >
                {step.label}
                {step.status === 'current' && <span className="sr-only"> (current step)</span>}
              </p>
              {time && <p className="text-xs text-ink-4">{time}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Everything recorded on the job, oldest first. */
export function CaseTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-ink-3">Nothing has happened on this job yet.</p>;
  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3">
          <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_TONE[entry.tone]}`} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <p className="text-sm text-ink">{entry.title}</p>
            <time dateTime={entry.at} className="shrink-0 text-xs text-ink-4">
              {formatSlot(entry.at)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}

const QUOTE_STATUS: Record<string, { tone: JobStateTone; customer: string; professional: string }> = {
  pending_customer: { tone: 'clay', customer: 'Waiting for you', professional: 'Waiting for the customer' },
  approved: { tone: 'success', customer: 'Approved', professional: 'Approved' },
  declined: { tone: 'danger', customer: 'Declined', professional: 'Declined' },
  expired: { tone: 'neutral', customer: 'Expired', professional: 'Expired' },
};

const ITEM_TYPE_LABEL: Record<string, string> = { labour: 'Labour', material: 'Material', fee: 'Fee' };

function quoteStatus(status: string, role: CaseRole, open: boolean): { tone: JobStateTone; label: string } {
  // A pending quote can only be answered while its job sits in quote_pending.
  if (status.startsWith('pending') && !open) return { tone: 'neutral', label: 'Not answered' };
  const known = QUOTE_STATUS[status];
  if (!known) return { tone: 'neutral', label: status.replace(/_/g, ' ') };
  return { tone: known.tone, label: role === 'customer' ? known.customer : known.professional };
}

/** One quote with its line items and totals, exactly as stored. */
export function QuoteSummary({
  quote,
  role,
  jobState,
  action,
}: {
  quote: CaseQuote;
  role: CaseRole;
  jobState: string | null;
  action?: ReactNode;
}) {
  const status = quoteStatus(quote.status, role, jobState === 'quote_pending');
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {quote.createdAt && <span className="text-xs text-ink-4">Sent {formatSlot(quote.createdAt)}</span>}
        </div>
        <p className="text-base font-semibold tabular-nums text-ink">{formatCurrency(quote.total)}</p>
      </div>
      {quote.reason && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink-2">{quote.reason}</p>}
      {quote.items.length > 0 && (
        <ul className="mt-3 divide-y divide-line border-t border-line">
          {quote.items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-ink">{item.description}</p>
                <p className="text-xs text-ink-4">
                  {ITEM_TYPE_LABEL[item.itemType] ?? item.itemType} · {item.quantity} × {formatCurrency(item.unitPrice)}
                </p>
              </div>
              <p className="shrink-0 tabular-nums text-ink-2">{formatCurrency(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      )}
      {(quote.discount > 0 || quote.taxesOrFees > 0) && (
        <dl className="mt-2 space-y-1 border-t border-line pt-2 text-xs text-ink-3">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatCurrency(quote.subtotal)}</dd>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between">
              <dt>Discount</dt>
              <dd className="tabular-nums">−{formatCurrency(quote.discount)}</dd>
            </div>
          )}
          {quote.taxesOrFees > 0 && (
            <div className="flex justify-between">
              <dt>Taxes and fees</dt>
              <dd className="tabular-nums">{formatCurrency(quote.taxesOrFees)}</dd>
            </div>
          )}
        </dl>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function InspectionList({ inspections }: { inspections: CaseInspection[] }) {
  return (
    <ul className="space-y-3">
      {inspections.map((inspection) => (
        <li key={inspection.id} className="rounded-xl border border-line bg-paper p-4">
          {inspection.createdAt && <p className="text-xs text-ink-4">{formatSlot(inspection.createdAt)}</p>}
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink">{inspection.findings}</p>
          {inspection.recommendation && (
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-2">
              <span className="font-medium text-ink">Recommendation: </span>
              {inspection.recommendation}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** A labelled row of facts: "Scheduled", "Property" and so on. */
export function FactList({ facts }: { facts: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.label} className="min-w-0">
          <dt className="text-xs text-ink-4">{fact.label}</dt>
          <dd className="mt-0.5 text-sm text-ink">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function mediaLabel(kind: string): string {
  return JOB_MEDIA_KIND_LABEL[kind as JobMediaKind] ?? 'File';
}

/** Photos and receipts attached to the job, opened in a new tab through short-lived links. */
export function MediaGallery({ media }: { media: CaseMedia[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((item) => {
        const label = mediaLabel(item.kind);
        return (
          <li key={item.id} className="min-w-0">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-line bg-porcelain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                {item.isPdf ? (
                  <span className="flex aspect-square flex-col items-center justify-center gap-1 text-ink-3">
                    <FileText className="h-8 w-8" aria-hidden="true" />
                    <span className="text-xs">PDF</span>
                  </span>
                ) : (
                  // Signed, expiring URLs from private storage; not worth routing through the image optimiser.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={`${label} photo`} loading="lazy" className="aspect-square w-full object-cover" />
                )}
              </a>
            ) : (
              <span className="flex aspect-square items-center justify-center rounded-xl border border-line bg-porcelain px-2 text-center text-xs text-ink-4">
                Could not load
              </span>
            )}
            <p className="mt-1 text-xs font-medium text-ink-2">{label}</p>
            {item.createdAt && <p className="text-xs text-ink-4">{formatSlot(item.createdAt)}</p>}
          </li>
        );
      })}
    </ul>
  );
}

/** "Between 3:10 pm and 3:40 pm": the professional's own estimate. */
export function arrivalWindowText(eta: { earliest: string; latest: string }): string {
  return `Between ${formatTime(eta.earliest) ?? '—'} and ${formatTime(eta.latest) ?? '—'}`;
}
