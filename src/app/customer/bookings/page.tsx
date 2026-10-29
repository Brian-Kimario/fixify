import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'My Bookings — Feasy',
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-[#FFF4E0] text-[#9B6700] border-[#E8D5A3]',
  accepted: 'bg-[#E2EEE9] text-[#176B5B] border-[#B8D5CB]',
  in_progress: 'bg-[#FFF4E0] text-[#9B6700] border-[#E8D5A3]',
  completed: 'bg-[#E3F0E8] text-[#2F7D5B] border-[#C7DCCF]',
  cancelled: 'bg-[#F5E6E6] text-[#9B3535] border-[#DFC0C0]',
};

interface BookingsPageProps {
  searchParams: Promise<{ property_id?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login?next=/customer/bookings');

  const { property_id } = await searchParams;

  const supabase = await createClient();

  // Build query for bookings
  let query = supabase
    .from('bookings')
    .select(
      `
      id,
      booking_reference,
      scheduled_start,
      booking_status,
      created_at,
      service:services ( id, name, description ),
      property:properties ( id, name, property_type ),
      quoted_or_base_amount
    `
    )
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  // Filter by property_id if provided
  if (property_id) {
    query = query.eq('property_id', property_id);
  }

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    notFound();
  }

  // If property_id filter is set, verify the property belongs to the user
  let propertyName: string | null = null;
  if (property_id) {
    const { data: property } = await supabase
      .from('properties')
      .select('id, name')
      .eq('id', property_id)
      .eq('owner_customer_id', user.id)
      .single();

    if (!property) {
      notFound();
    }
    propertyName = property.name;
  }

  const displayBookings = (bookings || []).map((booking: any) => ({
    id: booking.id,
    booking_reference: booking.booking_reference,
    scheduled_start: booking.scheduled_start,
    booking_status: booking.booking_status,
    created_at: booking.created_at,
    service_name: booking.service?.name || 'Service',
    property_name: booking.property?.name || 'Property',
    amount: booking.quoted_or_base_amount,
  }));

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <div className="px-4 md:px-6 py-8 md:py-10">
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">
          SERVICE HISTORY
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">
          {propertyName ? `Bookings for ${propertyName}` : 'All Bookings'}
        </h1>
        <p className="text-[#5A6661] max-w-2xl">
          {propertyName
            ? `View all service bookings for this property.`
            : 'View all service bookings across your properties.'}
        </p>
      </div>

      {/* Bookings List */}
      <div className="px-4 md:px-6 mb-8">
        {propertyName && (
          <div className="mb-6">
            <Link
              href="/customer/bookings"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#176B5B] hover:text-[#0D5144] transition"
            >
              ← Back to All Bookings
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#18211F]">
              {propertyName ? 'Property Bookings' : 'Bookings'}
            </h2>
            <p className="text-xs text-[#7C8681] mt-1">
              {displayBookings.length} booking{displayBookings.length === 1 ? '' : 's'} found
            </p>
          </div>
          <Link
            href="/customer/bookings/new"
            className="px-4 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition"
          >
            + New Booking
          </Link>
        </div>

        {displayBookings.length === 0 ? (
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#E2EEE9] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 text-[#176B5B]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2m-4-1v2m-4 0v2" />
                  <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
                  <line x1="4" y1="9" x2="20" y2="9" />
                </svg>
              </div>
            </div>
            <p className="text-[#18211F] font-bold text-lg mb-1">
              {propertyName ? 'No bookings for this property' : 'No bookings yet'}
            </p>
            <p className="text-[#5A6661] text-sm mb-4">
              {propertyName
                ? 'Service bookings for this property will appear here.'
                : 'Create your first booking to get started with professional services.'}
            </p>
            <Link
              href="/customer/bookings/new"
              className="inline-block px-6 py-2.5 bg-[#176B5B] text-white text-sm font-bold rounded-lg hover:bg-[#0D5144] transition"
            >
              Create a Booking
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayBookings.map((booking: any) => (
              <Link
                key={booking.id}
                href={`/customer/bookings/${booking.id}`}
                className="block bg-[#FFFEFA] border border-[#D9DED8] rounded-lg p-5 md:p-6 hover:border-[#176B5B] hover:shadow-sm transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-[#18211F]">{booking.service_name}</h3>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                          BOOKING_STATUS_STYLE[booking.booking_status] || BOOKING_STATUS_STYLE.pending
                        }`}
                      >
                        {BOOKING_STATUS_LABEL[booking.booking_status] || booking.booking_status}
                      </span>
                    </div>
                    <p className="text-sm text-[#5A6661]">
                      Property: <span className="font-bold">{booking.property_name}</span>
                    </p>
                    {booking.scheduled_start && (
                      <p className="text-sm text-[#5A6661] mt-1">
                        Scheduled:{' '}
                        <span className="font-bold">
                          {new Date(booking.scheduled_start).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="md:text-right flex-shrink-0">
                    {booking.amount && (
                      <p className="text-lg font-bold text-[#18211F]">
                        ₹{booking.amount.toLocaleString('en-IN')}
                      </p>
                    )}
                    <p className="text-xs text-[#7C8681] mt-1">Ref: {booking.booking_reference}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
