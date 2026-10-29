import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getJobById, getJobCustomerContact } from '@/app/professional/actions';
import { JobTimeline } from '@/components/professional/JobTimeline';
import { StateTransitionButtons } from '@/components/professional/StateTransitionButtons';
import { JobInspectionAndQuote } from '@/components/professional/JobInspectionAndQuote';
import { Badge } from '@/components/ui';
import { isTerminal } from '@/lib/jobs/states';

export const metadata = {
  title: 'Job Details - Feasy Professional',
};

// Waiting on the customer: the professional has nothing to press
const WAITING_STATES: ReadonlySet<string> = new Set(['quote_pending']);

interface JobDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  const job = await getJobById(id).catch(() => null);

  if (!job) {
    notFound();
  }

  const noActions = isTerminal(job.current_state) || WAITING_STATES.has(job.current_state);

  // Safely extract nested fields
  const serviceName = (job.booking as { service?: { name?: string } })?.service?.name ?? 'Service';
  const categoryName = (job.booking as { service?: { category?: { name?: string } } })?.service?.category?.name ?? '';
  // Name, phone and exact address are released by the database only after acceptance.
  const contact = await getJobCustomerContact(job.id);
  const customerName = contact?.full_name ?? job.customer?.full_name ?? 'Customer';
  const customerPhone = contact?.phone ?? null;
  const propertyName = job.property?.name ?? '—';
  const city = (job.property as { address?: { city?: string } })?.address?.city ?? '';
  const fullAddress = contact
    ? [contact.address_line_1, contact.address_line_2, contact.area, contact.city, contact.postal_code]
        .filter(Boolean)
        .join(', ')
    : [city].filter(Boolean).join(', ');
  const scheduledStart = (job.booking as { scheduled_start?: string })?.scheduled_start ?? null;

  return (
    <div className="pb-24 md:pb-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/professional/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A6661] hover:text-[#176B5B] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to Jobs
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column: details + timeline ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job header card */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
              <div className="min-w-0">
                {categoryName && (
                  <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                    {categoryName}
                  </p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-[#18211F] leading-snug">
                  {serviceName}
                </h1>
              </div>
              <Badge state={job.current_state} size="sm" className="flex-shrink-0" />
            </div>

            {scheduledStart && (
              <div className="flex items-center gap-2 text-sm text-[#5A6661]">
                <svg className="w-4 h-4 flex-shrink-0 text-[#7C8681]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  Scheduled:{' '}
                  {new Date(scheduledStart).toLocaleString('en-IN', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Customer & Property */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer */}
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-3">Customer</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#E2EEE9] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#176B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#18211F]">{customerName}</p>
                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="text-sm text-[#176B5B] hover:underline"
                    >
                      {customerPhone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Property */}
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-3">Property</p>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-[#E2EEE9] flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#176B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#18211F]">{propertyName}</p>
                  {fullAddress && (
                    <p className="text-sm text-[#5A6661]">{fullAddress}</p>
                  )}
                  {!contact && (
                    <p className="text-xs text-[#7C8681] mt-1">
                      Full address and phone are shared once you accept.
                    </p>
                  )}
                  {contact?.access_notes && (
                    <p className="text-xs text-[#7C8681] mt-1">Access: {contact.access_notes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* On-Site Inspection & Quote Builder */}
          <JobInspectionAndQuote
            jobId={job.id}
            currentState={job.current_state}
          />

          {/* Timeline */}
          <JobTimeline
            currentState={job.current_state}
            events={job.job_events ?? []}
          />
        </div>

        {/* ── Right column: actions ── */}
        <div className="lg:col-span-1">
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 lg:sticky lg:top-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681]">Actions</p>

            {noActions ? (
              /* Terminal state — no more transitions */
              <p className="text-sm text-[#5A6661]">
                {job.current_state === 'completed' || job.current_state === 'closed'
                  ? 'This job is complete. No further actions required.'
                  : job.current_state === 'cancelled'
                    ? 'This job has been cancelled.'
                    : job.current_state === 'quote_pending'
                      ? 'Waiting for the customer to approve your quote.'
                      : 'No actions available for the current state.'}
              </p>
            ) : (
              /* Active state — render interactive transition buttons */
              <StateTransitionButtons
                jobId={job.id}
                currentState={job.current_state}
              />
            )}

            {/* Job ID reference */}
            <div className="pt-3 border-t border-[#E8EBE7]">
              <p className="text-xs text-[#7C8681]">
                Job ID: <span className="font-mono text-[#5A6661]">{job.id.slice(0, 8)}…</span>
              </p>
              <p className="text-xs text-[#7C8681] mt-1">
                Created:{' '}
                {new Date(job.created_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
