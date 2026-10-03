import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { UPIIntentCheckout } from '@/components/customer/UPIIntentCheckout';

export const metadata = {
  title: 'Booking Confirmed — Fixify',
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending:      'Pending',
  accepted:     'Accepted',
  in_progress:  'In Progress',
  completed:    'Completed',
  cancelled:    'Cancelled',
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
  pending:     'bg-[#FFF4E0] text-[#9B6700] border-[#E8D5A3]',
  accepted:    'bg-[#E2EEE9] text-[#176B5B] border-[#B8D5CB]',
  in_progress: 'bg-[#FFF4E0] text-[#9B6700] border-[#E8D5A3]',
  completed:   'bg-[#E3F0E8] text-[#2F7D5B] border-[#C7DCCF]',
  cancelled:   'bg-[#F5E6E6] text-[#9B3535] border-[#DFC0C0]',
};

const PRICING_MODEL_NOTE: Record<string, string> = {
  fixed:                 'Fixed price — amount confirmed at booking.',
  inspection:            'Inspection fee collected on visit. Additional work quoted separately and approved by you.',
  quote_after_inspection:'Professional will visit and provide a quote. No work starts without your approval.',
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function BookingDetailPage({ params, searchParams }: BookingDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) notFound();

  const { id } = await params;
  const { new: isNew } = await searchParams;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_reference,
      scheduled_start,
      pricing_model,
      quoted_or_base_amount,
      booking_status,
      created_at,
      service:services (
        id, name, description, pricing_model,
        category:service_categories ( name )
      ),
      property:properties (
        id, name, property_type,
        address:addresses ( address_line_1, city, area )
      ),
      jobs (
        id,
        current_state,
        payments ( id, status )
      )
    `)
    .eq('id', id)
    .eq('customer_id', user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const booking = data;
  const service  = booking.service as unknown as { id: string; name: string; description: string | null; pricing_model: string; category: { name: string } | null } | null;
  const property = booking.property as unknown as { id: string; name: string; property_type: string; address: { address_line_1: string; city: string; area?: string } | null } | null;

  // ── Payment state ─────────────────────────────────────────────────────────
  // jobs is 1:1 with booking (UNIQUE constraint on booking_id)
  const jobRow = Array.isArray(booking.jobs)
    ? booking.jobs[0]
    : (booking.jobs as { id: string; current_state: string; payments: { id: string; status: string }[] } | null);

  const existingPayments = (jobRow?.payments ?? []) as { id: string; status: string }[];
  const alreadyPaid      = existingPayments.some((p) => p.status === 'paid');

  // Show the Pay section only when:
  //  - The job is complete (professional finished work)
  //  - There's no existing paid payment
  //  - There's a known amount to charge
  const showPaySection =
    jobRow?.current_state === 'completed' &&
    !alreadyPaid &&
    booking.quoted_or_base_amount != null &&
    Number(booking.quoted_or_base_amount) > 0;

  // ── Display values ────────────────────────────────────────────────────────
  const statusLabel = BOOKING_STATUS_LABEL[booking.booking_status] ?? booking.booking_status;
  const statusStyle = BOOKING_STATUS_STYLE[booking.booking_status] ?? BOOKING_STATUS_STYLE['pending'];

  const formattedDate = new Date(booking.scheduled_start).toLocaleString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = booking.quoted_or_base_amount != null
    ? `₹${Number(booking.quoted_or_base_amount).toLocaleString('en-IN')}`
    : 'Quote after inspection';

  const pricingNote = PRICING_MODEL_NOTE[booking.pricing_model] ?? '';

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-24">
      <div className="px-4 md:px-8 pt-6 max-w-2xl">

        {/* Back link */}
        <Link
          href="/customer"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A6661] hover:text-[#176B5B] transition-colors mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to dashboard
        </Link>

        {/* Confirmation banner — only on fresh bookings */}
        {isNew === '1' && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-[#E2EEE9] border border-[#B8D5CB] rounded-2xl">
            <span className="text-2xl" aria-hidden="true">🎉</span>
            <div>
              <p className="font-bold text-[#176B5B] text-sm">Booking confirmed!</p>
              <p className="text-sm text-[#2F7D5B] mt-0.5">
                Your booking <span className="font-mono">{booking.booking_reference}</span> is submitted.
                We&apos;ll notify you once a professional is assigned.
              </p>
            </div>
          </div>
        )}

        {/* Paid banner */}
        {alreadyPaid && (
          <div className="mb-6 flex items-start gap-3 px-4 py-4 bg-[#E3F0E8] border border-[#C7DCCF] rounded-2xl">
            <span className="text-2xl" aria-hidden="true">✅</span>
            <div>
              <p className="font-bold text-[#2F7D5B] text-sm">Payment received</p>
              <p className="text-sm text-[#2F7D5B] mt-0.5">
                This job has been paid. Your invoice is being generated.
              </p>
            </div>
          </div>
        )}

        {/* Page heading */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
            BOOKING DETAIL
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#18211F]">
              {service?.name ?? 'Booking'}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs font-mono text-[#7C8681] mt-1">{booking.booking_reference}</p>
        </div>

        {/* Detail cards */}
        <div className="space-y-3">

          {/* Service */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-2">Service</p>
            <p className="font-bold text-[#18211F]">{service?.name}</p>
            {service?.category && (
              <p className="text-xs text-[#5A6661] mt-0.5">{service.category.name}</p>
            )}
            {service?.description && (
              <p className="text-sm text-[#5A6661] mt-2 leading-relaxed">{service.description}</p>
            )}
          </div>

          {/* Scheduled time */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-2">Scheduled for</p>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#176B5B] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              <p className="font-bold text-[#18211F] text-sm">{formattedDate}</p>
            </div>
          </div>

          {/* Property */}
          {property && (
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-2">Property</p>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[#176B5B] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <div>
                  <p className="font-bold text-[#18211F]">{property.name}</p>
                  <p className="text-xs text-[#5A6661] capitalize">{property.property_type}</p>
                  {property.address && (
                    <p className="text-xs text-[#5A6661] mt-1">
                      {property.address.address_line_1}
                      {property.address.area ? `, ${property.address.area}` : ''}
                      {`, ${property.address.city}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-2">Price</p>
            <p className="font-bold text-[#18211F] text-lg">{formattedAmount}</p>
            {pricingNote && (
              <p className="text-xs text-[#5A6661] mt-1">{pricingNote}</p>
            )}
          </div>

          {/* ── Pay section — only shown when job is complete and unpaid ── */}
          {showPaySection && jobRow && (
            <div className="bg-[#FFFEFA] border border-[#176B5B] rounded-xl p-5 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#176B5B] mb-0.5">
                  Payment due
                </p>
                <p className="text-2xl font-bold text-[#18211F]">{formattedAmount}</p>
                <p className="text-xs text-[#5A6661] mt-1">
                  Work has been completed. Pay securely via UPI to close this job.
                </p>
              </div>
              <UPIIntentCheckout
                jobId={jobRow.id}
                displayAmountRupees={Number(booking.quoted_or_base_amount)}
              />
            </div>
          )}

          {/* Booking created */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C8681] mb-1">Booked on</p>
            <p className="text-sm text-[#18211F]">
              {new Date(booking.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>

        </div>

        {/* What happens next */}
        {!showPaySection && !alreadyPaid && (
          <div className="mt-6 bg-[#F1F7F4] border border-[#C5D8CF] rounded-xl p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#176B5B] mb-3">What happens next?</p>
            <ol className="space-y-2 text-sm text-[#18211F]">
              <li className="flex gap-2">
                <span className="font-bold text-[#176B5B] flex-shrink-0">1.</span>
                We match your booking with a verified professional in your area.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#176B5B] flex-shrink-0">2.</span>
                You&apos;ll receive a notification when they&apos;re assigned and confirmed.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-[#176B5B] flex-shrink-0">3.</span>
                {booking.pricing_model === 'quote_after_inspection'
                  ? 'The professional will inspect and send you a quote for approval before starting.'
                  : 'The professional will arrive at your scheduled time and complete the service.'}
              </li>
            </ol>
          </div>
        )}

        {/* CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/customer/bookings/new"
            className="flex-1 text-center px-4 py-3 border border-[#D9DED8] text-[#176B5B] font-bold text-sm rounded-xl hover:bg-[#F1F7F4] transition"
          >
            Book another service
          </Link>
          <Link
            href="/customer"
            className="flex-1 text-center px-4 py-3 bg-[#176B5B] text-white font-bold text-sm rounded-xl hover:bg-[#0D5144] transition"
          >
            Go to dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
