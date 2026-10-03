import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getProfessionalJobs, getEarningsData } from '@/app/professional/actions';
import { AvailabilityToggle } from '@/components/professional/AvailabilityToggle';
import { RequestCardActions } from '@/components/professional/RequestCardActions';
import { ActiveJobProgressRail } from '@/components/professional/ActiveJobProgressRail';
import Link from 'next/link';

export const metadata = { title: 'Professional Dashboard — Fixify' };

export default async function ProfessionalDashboard() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) return null;

  const supabase = await createClient();

  const { data: proProfile } = await supabase
    .from('professional_profiles')
    .select('display_name, rating_average, completed_jobs_count, verification_status, is_available')
    .eq('user_id', user.id)
    .single();

  const displayName = proProfile?.display_name || profile?.full_name || user.email?.split('@')[0] || 'Professional';
  const isAvailable = proProfile?.is_available ?? true;

  // 1. Fetch live jobs assigned to this professional
  let jobs: any[] = [];
  try {
    jobs = await getProfessionalJobs();
  } catch (err) {
    console.warn('Could not query professional jobs:', err);
    jobs = [];
  }

  // 2. Fetch live earnings
  let earnings = { weeklyEarnings: [0, 0, 0, 0, 0, 0], total: 0 };
  try {
    earnings = await getEarningsData();
  } catch (err) {
    console.warn('Could not query earnings data:', err);
  }

  // Filter jobs by lifecycle stage
  const requestsToReview = jobs.filter((j) => j.current_state === 'assigned');
  const activeRouteJobs = jobs.filter((j) =>
    ['accepted', 'on_the_way', 'arrived', 'in_progress', 'quote_pending'].includes(j.current_state)
  );

  // Determine current active job
  const currentActiveJob =
    activeRouteJobs.find((j) => ['in_progress', 'arrived', 'on_the_way'].includes(j.current_state)) ||
    activeRouteJobs[0] ||
    null;

  // Format earnings display
  const thisWeekEarnings = earnings.weeklyEarnings[5] || earnings.total || 0;
  const maxWeeklyEarning = Math.max(...earnings.weeklyEarnings, 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-2">
          PROFESSIONAL · TODAY
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-[#18211F] mb-2">
          Good morning, {displayName.split(' ')[0]}
        </h1>
        <p className="text-[#5A6661] max-w-2xl">
          Requests, route, active work and earnings in one operational workspace.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Availability Toggle */}
          <AvailabilityToggle initialStatus={isAvailable} />

          {/* ── Requests to Review ── */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#D9DED8] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                  REQUESTS TO REVIEW
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#18211F]">
                  Work worth responding to
                </h2>
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681]">
                {requestsToReview.length} {requestsToReview.length === 1 ? 'REQUEST' : 'REQUESTS'}
              </div>
            </div>

            <div className="divide-y divide-[#D9DED8]">
              {requestsToReview.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#E2EEE9] flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-[#176B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-[#18211F] mb-1">You're all caught up!</h3>
                  <p className="text-xs text-[#5A6661] max-w-sm mx-auto">
                    New nearby requests matching your skills will notify you here when customers book.
                  </p>
                </div>
              ) : (
                requestsToReview.map((req) => {
                  const serviceName = req.booking?.service?.name || 'General Repair';
                  const categoryName = req.booking?.service?.category?.name || 'Home Maintenance';
                  const propertyCity = req.property?.address?.city || 'Local area';
                  const propertyAddress = req.property?.address?.address_line_1 || req.property?.name || 'On file';
                  const scheduledStart = req.booking?.scheduled_start;

                  return (
                    <div key={req.id} className="px-5 md:px-6 py-4 hover:bg-[#F9FAF8] transition border-l-4 border-[#9B6A1E]">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="font-bold text-[#18211F] text-sm md:text-base">
                            {serviceName}
                          </div>
                          <div className="text-xs text-[#5A6661] mt-0.5">
                            {categoryName} · {propertyAddress}, {propertyCity}
                            {scheduledStart && (
                              <span> · Scheduled: {new Date(scheduledStart).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                        </div>
                        <span className="inline-block px-2.5 py-1 bg-[#F5EBD7] text-[#9B6A1E] text-xs font-bold rounded-full border border-[#DDCCAB] flex-shrink-0">
                          Pending
                        </span>
                      </div>

                      <div className="text-xs text-[#5A6661] mb-2">
                        Customer: <span className="font-medium text-[#18211F]">{req.customer?.full_name || 'Homeowner'}</span>
                      </div>

                      <RequestCardActions jobId={req.id} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Today's Route ── */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-[#D9DED8] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-1">
                  TODAY'S ROUTE
                </div>
                <h2 className="text-lg md:text-xl font-bold text-[#18211F]">
                  Scheduled stops
                </h2>
              </div>
              <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681]">
                {activeRouteJobs.length} {activeRouteJobs.length === 1 ? 'STOP' : 'STOPS'}
              </div>
            </div>

            <div className="divide-y divide-[#D9DED8]">
              {activeRouteJobs.length === 0 ? (
                <div className="p-8 text-center text-[#5A6661] text-xs">
                  No active route stops yet today. Accepted requests will appear here in chronological order.
                </div>
              ) : (
                activeRouteJobs.map((job, idx) => {
                  const isCurrent = job.id === currentActiveJob?.id;
                  const serviceName = job.booking?.service?.name || 'Repair Service';
                  const propertyName = job.property?.name || 'Property';
                  const address = job.property?.address?.address_line_1 || '';
                  const scheduledTime = job.booking?.scheduled_start
                    ? new Date(job.booking.scheduled_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'Today';

                  return (
                    <Link
                      key={job.id}
                      href={`/professional/jobs/${job.id}`}
                      className={`block px-5 md:px-6 py-4 transition hover:bg-[#F9FAF8] ${
                        isCurrent ? 'bg-[#E2EEE9]/50 border-l-4 border-[#176B5B]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-[#18211F] text-sm md:text-base flex items-center gap-2">
                            <span>{serviceName}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#176B5B] text-white rounded">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#5A6661] mt-1">
                            {propertyName} {address ? `· ${address}` : ''}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-bold uppercase tracking-[0.11em] text-[#176B5B] block">
                            {scheduledTime}
                          </span>
                          <span className="text-[11px] font-semibold text-[#7C8681] uppercase tracking-wider capitalize">
                            {job.current_state.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">

          {/* ── Active Job Card ── */}
          {currentActiveJob ? (
            <div className="bg-[#18211F] text-white rounded-xl p-6 relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#A3ACA6] mb-2">
                  ACTIVE JOB · {currentActiveJob.id.slice(0, 8).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold mb-1">
                  {currentActiveJob.booking?.service?.name || 'On-site Repair'}
                </h2>
                <p className="text-sm text-[#D9DED8] mb-4">
                  {currentActiveJob.property?.name || 'Client Property'} · {currentActiveJob.property?.address?.address_line_1 || ''}
                </p>

                {/* Animated Lifecycle Progress Rail */}
                <div className="mt-6 mb-2">
                  <ActiveJobProgressRail currentState={currentActiveJob.current_state} />
                </div>

                <Link
                  href={`/professional/jobs/${currentActiveJob.id}`}
                  className="mt-6 block w-full text-center px-4 py-3 bg-[#176B5B] text-white rounded-lg text-sm font-bold hover:bg-[#0D5144] transition shadow-sm"
                >
                  Open Job Workspace →
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#18211F] text-white rounded-xl p-6 shadow-md text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2A3632] flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-[#5fe3b0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-1">Standby Mode</h3>
              <p className="text-xs text-[#A3ACA6]">
                You have no job currently in progress. Select a stop from your route or review incoming requests.
              </p>
            </div>
          )}

          {/* ── Customer & Property Context ── */}
          {currentActiveJob && (
            <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681] mb-3">
                CUSTOMER & PROPERTY
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#E2EEE9] flex items-center justify-center font-bold text-[#0D5144]">
                  {(currentActiveJob.customer?.full_name || 'C')[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[#18211F] text-sm">
                    {currentActiveJob.customer?.full_name || 'Customer'}
                  </div>
                  <div className="text-xs text-[#5A6661]">
                    {currentActiveJob.property?.name || 'Property'}
                  </div>
                </div>
              </div>

              {currentActiveJob.customer?.phone && (
                <div className="pt-2 border-t border-[#D9DED8]">
                  <a
                    href={`tel:${currentActiveJob.customer.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B5B] hover:underline"
                  >
                    📞 Call Customer: {currentActiveJob.customer.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ── Earnings Card ── */}
          <div className="bg-[#FFFEFA] border border-[#D9DED8] rounded-xl p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-[0.11em] text-[#7C8681]">
                WEEKLY VALUE
              </div>
              <Link
                href="/professional/earnings"
                className="text-xs text-[#176B5B] font-semibold hover:underline"
              >
                Full Ledger →
              </Link>
            </div>

            <div className="text-2xl md:text-3xl font-bold text-[#18211F]">
              ₹{thisWeekEarnings.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-[#5A6661] mt-1">
              Total 6-week completed: ₹{earnings.total.toLocaleString('en-IN')}
            </div>

            {/* Dynamic 6-week bar visualization */}
            <div className="mt-4 flex gap-1.5 h-16 items-end">
              {earnings.weeklyEarnings.map((amount, idx) => {
                const heightPercent = maxWeeklyEarning > 0 ? Math.max(12, Math.round((amount / maxWeeklyEarning) * 100)) : 12;
                const isCurrent = idx === 5;

                return (
                  <div
                    key={idx}
                    title={`Week ${idx + 1}: ₹${amount}`}
                    className={`flex-1 rounded-t transition-all duration-300 ${
                      isCurrent ? 'bg-[#176B5B]' : 'bg-[#CFE1DB] hover:bg-[#B8D5CB]'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-[#7C8681] mt-1 font-semibold uppercase">
              <span>6 wks ago</span>
              <span>This week</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
