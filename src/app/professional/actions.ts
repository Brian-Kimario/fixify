"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Job,
  ProfessionalProfile,
  ServiceCatalogueItem,
  Verification,
  Availability,
  Skill,
} from "./types";

/**
 * Get all jobs for the authenticated professional
 * RLS ensures only assigned jobs are returned
 */
export async function getProfessionalJobs(options?: {
  state?: string;
  includeCompleted?: boolean;
}): Promise<Job[]> {
  // Create authenticated Supabase client (respects RLS)
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Get jobs assigned to this professional
  let query = supabase
    .from("jobs")
    .select(
      `
      id,
      current_state,
      created_at,
      completed_at,
      customer:profiles!jobs_customer_id_fkey(id, full_name, phone),
      property:properties(id, name, address:addresses(id, city, label, address_line_1)),
      booking:bookings(id, scheduled_start, service:services(id, name, category:service_categories(id, name)))
    `
    )
    .eq("professional_id", user.id);

  if (options?.state && options.state !== 'all') {
    query = query.eq("current_state", options.state);
  } else {
    // Include all active lifecycle states + quote_pending + completed
    query = query.in("current_state", [
      "assigned",
      "accepted",
      "on_the_way",
      "arrived",
      "in_progress",
      "quote_pending",
      "completed",
    ]);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }

  return (data || []) as unknown as Job[];
}

/**
 * Get a single job by ID for the authenticated professional
 * Includes job events timeline, customer, property, and booking info
 * RLS ensures only assigned jobs are returned
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      current_state,
      created_at,
      accepted_at,
      on_the_way_at,
      arrived_at,
      started_at,
      completed_at,
      cancelled_at,
      customer:profiles!jobs_customer_id_fkey(id, full_name, phone),
      property:properties(id, name, address:addresses(id, city, label, address_line_1)),
      booking:bookings(id, scheduled_start, service:services(id, name, category:service_categories(id, name))),
      job_events(id, from_state, to_state, actor_user_id, event_type, metadata, created_at)
    `
    )
    .eq("id", jobId)
    .eq("professional_id", user.id)
    .order("created_at", { referencedTable: "job_events", ascending: true })
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  return data as unknown as Job;
}

/**
 * Get professional profile info (for header)
 * RLS ensures only own profile can be read
 */
export async function getProfessionalProfile(): Promise<ProfessionalProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
      user_id,
      display_name,
      rating_average,
      completed_jobs_count,
      verification_status,
      is_available
    `
    )
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch professional profile: ${error.message}`);
  }

  return data;
}

/**
 * Get service catalogue (public, no auth required)
 */
export async function getServiceCatalogue(): Promise<ServiceCatalogueItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select(
      `
      id,
      name,
      slug,
      description,
      services(id, name, slug, description, pricing_model, base_price)
    `
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error(`Failed to fetch service catalogue: ${error.message}`);
  }

  return (data || []) as unknown as ServiceCatalogueItem[];
}

/**
 * Transition a job state (accept/decline/complete, etc.)
 * Calls the RPC function that enforces valid state transitions
 * RLS ensures only assigned professional can transition
 */
export async function transitionJobState(
  jobId: string,
  newState: "accepted" | "declined" | "on_the_way" | "arrived" | "in_progress" | "completed" | "closed"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Call RPC function to validate and transition state
  const { data, error } = await supabase.rpc("transition_job_state", {
    p_job_id: jobId,
    p_new_state: newState,
    p_actor_user_id: user.id,
  });

  if (error) {
    throw new Error(`Failed to transition job: ${error.message}`);
  }

  return data;
}

/**
 * Get earnings data for the last 6 weeks
 * Calculated from completed jobs and approved quotes/bookings
 */
export async function getEarningsData(): Promise<{weeklyEarnings: number[], total: number}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const sixWeeksAgo = new Date();
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);

  try {
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select(`
        id,
        completed_at,
        created_at,
        current_state,
        booking:bookings(quoted_or_base_amount),
        quotes(total, status)
      `)
      .eq("professional_id", user.id)
      .eq("current_state", "completed")
      .gte("completed_at", sixWeeksAgo.toISOString());

    if (error) {
      console.warn("Could not fetch completed jobs for earnings:", error.message);
      return { weeklyEarnings: [0, 0, 0, 0, 0, 0], total: 0 };
    }

    const weeklyEarnings = Array(6).fill(0);
    let total = 0;

    (jobs || []).forEach((job) => {
      const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
      const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
      const approvedQuote = quotesList.find((q: { status?: string }) => q.status === 'approved');

      const jobAmount = Number(approvedQuote?.total ?? rawBooking?.quoted_or_base_amount ?? 0);
      const dateStr = job.completed_at || job.created_at;
      const jobDate = new Date(dateStr);
      const daysAgo = Math.floor(
        (new Date().getTime() - jobDate.getTime()) / (24 * 60 * 60 * 1000)
      );
      const weekIndex = Math.min(5, Math.max(0, Math.floor(daysAgo / 7)));

      weeklyEarnings[5 - weekIndex] += jobAmount;
      total += jobAmount;
    });

    return { weeklyEarnings, total };
  } catch (err) {
    console.warn("Error calculating earnings:", err);
    return { weeklyEarnings: [0, 0, 0, 0, 0, 0], total: 0 };
  }
}

export interface EarningsLedger {
  totalEarned: number;
  completedJobsCount: number;
  averageRate: number;
  thisMonthEarned: number;
  thisWeekEarned: number;
  pendingPayouts: number;
  monthlyBreakdown: Array<{
    month: string;
    earned: number;
    jobs: number;
    rate: string;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    jobTitle: string;
    customerName: string;
    amount: number;
    date: string;
    status: 'completed' | 'pending' | 'in_progress';
  }>;
}

/**
 * Get comprehensive professional earnings ledger from real database records
 */
export async function getProfessionalEarningsLedger(): Promise<EarningsLedger> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(`
      id,
      current_state,
      created_at,
      completed_at,
      customer:profiles!jobs_customer_id_fkey(full_name),
      booking:bookings(
        quoted_or_base_amount,
        scheduled_start,
        service:services(name)
      ),
      quotes(total, status)
    `)
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Error fetching ledger jobs:", error.message);
  }

  const allJobs = jobs || [];
  const completedJobs = allJobs.filter((j) => j.current_state === 'completed');

  let totalEarned = 0;
  let thisMonthEarned = 0;
  let thisWeekEarned = 0;
  let pendingPayouts = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Map of month key 'YYYY-MM' -> { monthName, earned, jobs }
  const monthsMap = new Map<string, { month: string; earned: number; jobs: number }>();
  
  // Pre-seed last 4 months chronologically
  for (let i = 3; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    monthsMap.set(key, { month: monthName, earned: 0, jobs: 0 });
  }

  completedJobs.forEach((job) => {
    const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
    const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
    const approvedQuote = quotesList.find((q: { status?: string }) => q.status === 'approved');
    const amount = Number(approvedQuote?.total ?? rawBooking?.quoted_or_base_amount ?? 0);

    totalEarned += amount;

    const dateStr = job.completed_at || job.created_at;
    const jobDate = new Date(dateStr);

    if (jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear) {
      thisMonthEarned += amount;
    }

    const daysAgo = (now.getTime() - jobDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysAgo <= 7) {
      thisWeekEarned += amount;
    }

    const key = `${jobDate.getFullYear()}-${String(jobDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthsMap.has(key)) {
      const b = monthsMap.get(key)!;
      b.earned += amount;
      b.jobs += 1;
    }
  });

  allJobs
    .filter((j) => ['in_progress', 'quote_pending', 'arrived'].includes(j.current_state))
    .forEach((job) => {
      const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
      const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
      const pendingQuote = quotesList.find((q: { status?: string }) => q.status === 'pending_customer');
      const amount = Number(pendingQuote?.total ?? rawBooking?.quoted_or_base_amount ?? 0);
      pendingPayouts += amount;
    });

  const maxMonthEarned = Math.max(...Array.from(monthsMap.values()).map((m) => m.earned), 1);
  const monthlyBreakdown = Array.from(monthsMap.values()).map((m) => ({
    month: m.month,
    earned: m.earned,
    jobs: m.jobs,
    rate: m.jobs > 0 ? `₹${Math.round(m.earned / m.jobs)} avg` : '₹0 avg',
    percentage: Math.round((m.earned / maxMonthEarned) * 100),
  }));

  const recentTransactions = allJobs.slice(0, 10).map((job) => {
    const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
    const serviceName = (rawBooking?.service as { name?: string })?.name || 'Home Maintenance';
    const customer = Array.isArray(job.customer) ? job.customer[0] : job.customer;
    const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
    const quote = quotesList[0];
    const amount = Number(quote?.total ?? rawBooking?.quoted_or_base_amount ?? 0);
    const dateStr = job.completed_at || job.created_at;

    const status: 'completed' | 'pending' | 'in_progress' = 
      job.current_state === 'completed'
        ? 'completed'
        : job.current_state === 'quote_pending'
        ? 'pending'
        : 'in_progress';

    return {
      id: job.id,
      jobTitle: serviceName,
      customerName: (customer as { full_name?: string })?.full_name || 'Homeowner',
      amount,
      date: new Date(dateStr).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      status,
    };
  });

  const completedJobsCount = completedJobs.length;
  const averageRate = completedJobsCount > 0 ? totalEarned / completedJobsCount : 0;

  return {
    totalEarned,
    completedJobsCount,
    averageRate,
    thisMonthEarned,
    thisWeekEarned,
    pendingPayouts,
    monthlyBreakdown,
    recentTransactions,
  };
}

/**
 * Get professional verification status
 * RLS ensures only own verification records are returned
 */
export async function getVerificationStatus(): Promise<Verification[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("professional_verifications")
    .select("id, verification_type, status, verified_at")
    .eq("professional_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch verification status: ${error.message}`
    );
  }

  return data || [];
}

/**
 * Get professional availability
 * RLS ensures only own availability is returned
 */
export async function getProfessionalAvailability(): Promise<Availability[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("professional_availability")
    .select("id, day_of_week, start_time, end_time, is_active")
    .eq("professional_id", user.id)
    .order("day_of_week", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch availability: ${error.message}`);
  }

  return data || [];
}

/**
 * Update professional availability status (online/offline)
 * RLS ensures only own profile can be updated
 */
export async function updateAvailabilityStatus(isAvailable: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("professional_profiles")
    .update({ is_available: isAvailable })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update availability: ${error.message}`);
  }

  return data;
}

/**
 * Get professional skills/specializations
 * RLS ensures only own skills are returned
 */
export async function getProfessionalSkills(): Promise<Skill[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("professional_skills")
    .select(
      `
      id,
      service_category_id,
      service_id,
      skill_level,
      verified,
      category:service_categories(id, name, slug),
      service:services(id, name, slug)
    `
    )
    .eq("professional_id", user.id)
    .order("category:service_categories(name)");

  if (error) {
    throw new Error(`Failed to fetch skills: ${error.message}`);
  }

  return (data || []) as unknown as Skill[];
}

/**
 * Submit an on-site inspection report
 */
export async function submitInspectionAction(payload: {
  jobId: string;
  findings: string;
  recommendation?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      job_id: payload.jobId,
      professional_id: user.id,
      findings: payload.findings,
      recommendation: payload.recommendation || null,
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Record audit event in job_events
  await supabase.from('job_events').insert({
    job_id: payload.jobId,
    from_state: 'arrived',
    to_state: 'in_progress',
    actor_user_id: user.id,
    event_type: 'inspection_recorded',
    metadata: { findings: payload.findings.slice(0, 100) },
  });

  revalidatePath(`/professional/jobs/${payload.jobId}`);
  revalidatePath('/professional');
  return { success: true, inspectionId: data.id };
}

/**
 * Submit an additional/variable quote for customer approval
 */
export async function createQuoteAction(payload: {
  jobId: string;
  reason: string;
  lineItems: Array<{
    itemType: 'labour' | 'material' | 'fee';
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const subtotal = payload.lineItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
  const taxesOrFees = Number((subtotal * 0.05).toFixed(2)); // 5% platform/tax fee
  const total = Number((subtotal + taxesOrFees).toFixed(2));

  // 1. Insert Quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      job_id: payload.jobId,
      professional_id: user.id,
      reason: payload.reason,
      subtotal,
      taxes_or_fees: taxesOrFees,
      total,
      status: 'pending_customer',
    })
    .select('id')
    .single();

  if (quoteError || !quote) {
    return { success: false, error: quoteError?.message || 'Could not create quote' };
  }

  // 2. Insert Quote Items
  if (payload.lineItems.length > 0) {
    const itemsToInsert = payload.lineItems.map((item) => ({
      quote_id: quote.id,
      item_type: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: Number((item.quantity * item.unitPrice).toFixed(2)),
    }));

    const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);
    if (itemsError) {
      console.warn('Error inserting quote items:', itemsError.message);
    }
  }

  // 3. Move job to quote_pending via the authoritative state machine RPC.
  //    This validates the transition, prevents race conditions, and records the audit event.
  const { error: rpcError } = await supabase.rpc('transition_job_state', {
    p_job_id: payload.jobId,
    p_new_state: 'quote_pending',
    p_actor_user_id: user.id,
    p_metadata: {
      event_type: 'quote_submitted',
      quote_id: quote.id,
      total,
      reason: payload.reason,
    },
  });

  if (rpcError) {
    console.error('createQuoteAction — transition_job_state RPC error:', rpcError.message);
    // Quote was already inserted; return partial success with the error so caller can decide
    return { success: false, error: 'Quote created but job state transition failed: ' + rpcError.message };
  }

  revalidatePath(`/professional/jobs/${payload.jobId}`);
  revalidatePath('/professional');
  return { success: true, quoteId: quote.id };
}
