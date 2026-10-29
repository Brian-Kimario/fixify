import { getCurrentUser, getCurrentProfile } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getGreeting } from '@/lib/greeting';
import { SkeletonDashboard } from '@/components/ui/SkeletonDashboard';
import { CustomerDashboardClient } from '@/components/customer/CustomerDashboardClient';
import type { ActiveJobData } from '@/components/customer/ActiveJobPanel';
import type { QuoteApprovalData } from '@/components/customer/QuoteApprovalPanel';
import type { TimelineEvent } from '@/components/customer/PropertyMaintenanceTimeline';
import type { ActivityItem } from '@/components/customer/RecentActivityList';

export const metadata = {
  title: 'Customer Dashboard — Feasy',
  description: 'Manage active home repairs, express problem intake, and verify property maintenance history.',
};

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <Suspense fallback={<SkeletonDashboard variant="customer" className="p-6 md:p-8" />}>
      <CustomerDashboardContent user={user} profile={profile} />
    </Suspense>
  );
}

async function CustomerDashboardContent({ user, profile }: any) {
  const supabase = await createClient();

  // Parallelize all queries in a single Promise.all()
  // Properties and jobs queries are fully independent
  // Quotes query is conditioned: if there's an active job, filter by job_id; otherwise fetch empty
  // Events query relies on RLS to filter by customer's jobs (no separate query needed)
  
  const [propsResult, jobsResult, quotesResult, eventsResult] = await Promise.all([
    // Query 1: Fetch Customer Properties
    (async () => {
      try {
        const { data: propsData } = await supabase
          .from('properties')
          .select(`
            id,
            name,
            property_type,
            addresses:address_id (
              address_line_1,
              city
            )
          `)
          .eq('owner_customer_id', user.id)
          .order('created_at', { ascending: false });

        return propsData || [];
      } catch (err) {
        console.warn('Could not query properties:', err);
        return [];
      }
    })(),

    // Query 2: Fetch Active Job (non-completed / non-closed)
    (async () => {
      try {
        const { data: jobs } = await supabase
          .from('jobs')
          .select(`
            id,
            current_state,
            created_at,
            accepted_at,
            on_the_way_at,
            arrived_at,
            started_at,
            completed_at,
            booking_id,
            bookings (
              id,
              booking_reference,
              scheduled_start,
              pricing_model,
              quoted_or_base_amount,
              services (
                name,
                service_categories (
                  name
                )
              )
            ),
            properties (
              id,
              name
            ),
            professional_profiles (
              user_id,
              display_name,
              rating_average,
              completed_jobs_count,
              verification_status,
              profiles!professional_profiles_user_id_fkey (
                full_name,
                phone
              )
            )
          `)
          .eq('customer_id', user.id)
          .not('current_state', 'in', '("CLOSED","COMPLETED","cancelled")')
          .order('created_at', { ascending: false })
          .limit(1);

        return jobs || [];
      } catch (err) {
        console.warn('Could not query active job:', err);
        return [];
      }
    })(),

    // Query 3: Fetch Pending Quotes
    // Filter by status only (job_id filtering happens after we know the active job)
    // This is safe because RLS on quotes table ensures we only see quotes for our jobs
    (async () => {
      try {
        const { data: quotes } = await supabase
          .from('quotes')
          .select(`
            id,
            job_id,
            subtotal,
            taxes_or_fees,
            total,
            reason,
            status,
            quote_items (
              id,
              item_type,
              description,
              quantity,
              unit_price,
              line_total
            )
          `)
          .eq('status', 'pending_customer')
          .order('created_at', { ascending: false })
          .limit(1);

        return quotes || [];
      } catch (err) {
        console.warn('Could not query quotes:', err);
        return [];
      }
    })(),

    // Query 4: Fetch Recent Job Events
    // RLS policy on job_events already filters by customer's jobs via:
    //   job_id IN (SELECT id FROM jobs WHERE customer_id = auth.uid() OR professional_id = auth.uid())
    // No need for a separate jobs query—RLS handles filtering server-side
    (async () => {
      try {
        const { data: events } = await supabase
          .from('job_events')
          .select(`
            id,
            event_type,
            to_state,
            created_at,
            metadata,
            job_id
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        return events || [];
      } catch (err) {
        console.warn('Could not query job_events:', err);
        return [];
      }
    })(),
  ]);

  // Extract properties from parallel batch
  let userProperties: Array<{
    id: string;
    name: string;
    propertyType: string;
    addressLine1?: string;
    city?: string;
  }> = [];

  if (propsResult && Array.isArray(propsResult) && propsResult.length > 0) {
    userProperties = propsResult.map((p: any) => {
      const addr = Array.isArray(p.addresses) ? p.addresses[0] : p.addresses;
      return {
        id: p.id,
        name: p.name,
        propertyType: p.property_type || 'Residential',
        addressLine1: addr?.address_line_1,
        city: addr?.city,
      };
    });
  }

  // Extract active job data from parallel batch
  let activeJobData: ActiveJobData | null = null;
  let activeJobId: string | null = null;

  if (jobsResult && Array.isArray(jobsResult) && jobsResult.length > 0) {
    const rawJob = jobsResult[0];
    activeJobId = rawJob.id;
    const rawBooking = Array.isArray(rawJob.bookings) ? rawJob.bookings[0] : rawJob.bookings;
    const rawService = rawBooking?.services as { name?: string; service_categories?: { name?: string } | { name?: string }[] } | undefined;
    const rawCategory = Array.isArray(rawService?.service_categories)
      ? rawService?.service_categories[0]?.name
      : rawService?.service_categories?.name;
    const rawProperty = Array.isArray(rawJob.properties) ? rawJob.properties[0] : rawJob.properties;
    const rawPro = Array.isArray(rawJob.professional_profiles) ? rawJob.professional_profiles[0] : rawJob.professional_profiles;

    activeJobData = {
      id: rawJob.id,
      bookingId: rawBooking?.id,
      referenceNumber: rawBooking?.booking_reference || `FX-${rawJob.id.slice(0, 4).toUpperCase()}`,
      serviceTitle: rawService?.name || 'Home Maintenance & Repair',
      category: rawCategory || 'General Service',
      propertyName: rawProperty?.name || userProperties[0]?.name || 'Residence',
      propertyAddress: userProperties[0]?.addressLine1 || 'On file',
      currentState: rawJob.current_state,
      scheduledTime: rawBooking?.scheduled_start,
      etaMinutes: 14,
      hasPendingQuote: false,
      professional: rawPro ? {
        id: rawPro.user_id,
        name: rawPro.display_name || 'Certified Professional',
        phone: (Array.isArray(rawPro['profiles!professional_profiles_user_id_fkey']) 
          ? rawPro['profiles!professional_profiles_user_id_fkey'][0]?.phone 
          : rawPro['profiles!professional_profiles_user_id_fkey']?.phone) || undefined,
        rating: Number(rawPro.rating_average) || 0,
        completedJobs: Number(rawPro.completed_jobs_count) || 0,
        verificationStatus: (rawPro.verification_status as 'verified' | 'pending' | 'not_verified') || 'pending',
      } : undefined,
    };
  }

  // Extract pending quote from parallel batch
  // Search through quotes for one matching the active job
  let activeQuoteData: QuoteApprovalData | null = null;
  
  if (quotesResult && Array.isArray(quotesResult) && quotesResult.length > 0 && activeJobData && activeJobId) {
    // Find quote matching the active job ID
    const matchingQuote = quotesResult.find((q: any) => q.job_id === activeJobId);
    
    if (matchingQuote) {
      const q = matchingQuote;
      const lineItems = (q.quote_items && Array.isArray(q.quote_items) ? q.quote_items : []).map((item: any) => ({
        id: item.id,
        type: (item.item_type as 'labour' | 'material' | 'fee') || 'material',
        description: item.description,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unit_price) || 0,
        total: Number(item.line_total) || 0,
      }));

      activeQuoteData = {
        id: q.id,
        jobId: q.job_id,
        referenceNumber: activeJobData.referenceNumber,
        serviceTitle: activeJobData.serviceTitle,
        propertyName: activeJobData.propertyName,
        proName: activeJobData.professional?.name || 'Technician',
        reason: q.reason || 'Additional repair authorization requested.',
        lineItems,
        subtotal: Number(q.subtotal) || 65.0,
        partsTotal: lineItems.filter((i) => i.type === 'material').reduce((acc, i) => acc + i.total, 0) || 38.5,
        platformFee: Number(q.taxes_or_fees) || 4.5,
        totalAmount: Number(q.total) || 108.0,
      };

      activeJobData.hasPendingQuote = true;
      activeJobData.pendingQuoteTotal = activeQuoteData.totalAmount;
    }
  }

  // Extract recent activities from parallel batch
  let recentActivities: ActivityItem[] = [];

  if (eventsResult && Array.isArray(eventsResult) && eventsResult.length > 0) {
    recentActivities = eventsResult.map((e: any) => ({
      id: e.id,
      type: e.event_type === 'quote_approved' ? 'quote_submitted' : 'job_completed',
      title: e.event_type.replace(/_/g, ' ').toUpperCase(),
      description: `Status transitioned to ${e.to_state}`,
      timestamp: 'Recently',
    }));
  }

  // Query 5: Fetch Completed Jobs for Property Maintenance History
  // Not wrapped in unstable_cache: it is user-scoped (RLS via request cookies), which
  // cannot be read inside a cached function.
  const getCompletedJobs = async (userId: string) => {
      const { data: completedJobs, error: completedJobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          created_at,
          completed_at,
          current_state,
          booking:bookings(
            booking_reference,
            quoted_or_base_amount,
            service:services(
              name,
              category:service_categories(name)
            )
          ),
          property:properties(name),
          pro:professional_profiles(display_name, rating_average),
          inspections(findings, recommendation),
          quotes(total, status, quote_items(description, item_type))
        `)
        .eq('customer_id', userId)
        .eq('current_state', 'completed')
        .order('completed_at', { ascending: false });

      if (completedJobsError) throw completedJobsError;
      return completedJobs || [];
  };

  let timelineEvents: TimelineEvent[] = [];

  try {
    const completedJobs = await getCompletedJobs(user.id);

    if (completedJobs && completedJobs.length > 0) {
      timelineEvents = completedJobs.map((job: any) => {
        const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
        const rawService = rawBooking?.service as { name?: string; category?: { name?: string } | { name?: string }[] } | undefined;
        const rawCategory = Array.isArray(rawService?.category)
          ? rawService?.category[0]?.name
          : rawService?.category?.name;
        const rawProp = Array.isArray(job.property) ? job.property[0] : job.property;
        const rawPro = Array.isArray(job.pro) ? job.pro[0] : job.pro;
        const inspection = Array.isArray(job.inspections) ? job.inspections[0] : job.inspections;
        const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
        const approvedQuote = quotesList.find((q: { status?: string }) => q.status === 'approved');
        const quoteItems = Array.isArray(approvedQuote?.quote_items) ? approvedQuote.quote_items : [];

        const completedDate = new Date(job.completed_at || job.created_at);
        const warrantyDate = new Date(completedDate);
        warrantyDate.setFullYear(warrantyDate.getFullYear() + 1);

        const categoryMapped = (rawCategory?.includes('Plumb')
          ? 'Plumbing'
          : rawCategory?.includes('Elect')
          ? 'Electrical'
          : rawCategory?.includes('HVAC') || rawCategory?.includes('Cool') || rawCategory?.includes('Heat')
          ? 'HVAC'
          : rawCategory?.includes('Appliance')
          ? 'Appliances'
          : 'Plumbing') as TimelineEvent['category'];

        const partsReplaced = quoteItems
          .filter((i: { item_type?: string }) => i.item_type === 'material')
          .map((i: { description?: string }) => i.description || '')
          .filter(Boolean);

        return {
          id: job.id,
          date: completedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase(),
          fullDate: completedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          category: categoryMapped,
          title: rawService?.name || 'Home Maintenance & Repair',
          propertyName: rawProp?.name || userProperties[0]?.name || 'Residence',
          summary: inspection?.recommendation || `Completed verified repair work on ${completedDate.toLocaleDateString()}`,
          findings: inspection?.findings || 'Work completed per platform safety specifications and inspected on-site.',
          partsReplaced: partsReplaced.length > 0 ? partsReplaced : undefined,
          cost: Number(approvedQuote?.total ?? rawBooking?.quoted_or_base_amount ?? 0),
          proName: rawPro?.display_name || 'Verified Professional',
          proRating: Number(rawPro?.rating_average) || 0,
          warrantyValidUntil: warrantyDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          referenceNumber: rawBooking?.booking_reference || `FX-${job.id.slice(0, 4).toUpperCase()}`,
        };
      });
    }
  } catch (err) {
    console.warn('Could not query completed jobs for timeline:', err);
  }

  const displayName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const greeting = getGreeting();

  // Determine if dashboard should show empty state
  // Empty if: no properties AND no active job
  const isEmpty = userProperties.length === 0 && !activeJobData;

  return (
    <CustomerDashboardClient
      displayName={displayName}
      greeting={greeting}
      userEmail={user.email}
      activeJob={activeJobData}
      pendingQuote={activeQuoteData}
      properties={userProperties}
      timelineEvents={timelineEvents}
      recentActivities={recentActivities}
      isEmpty={isEmpty}
    />
  );
}
