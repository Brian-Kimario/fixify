"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, parseInput, type ActionResult } from "@/lib/actions/result";
import {
  createQuoteSchema,
  declineJobSchema,
  inspectionSchema,
  jobIdSchema,
  type CreateQuoteInput,
  type InspectionInput,
} from "@/validators";
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

  const allJobs = (jobs || []).filter((j) => j.current_state !== 'cancelled');
  // closed = completed and paid; both count as finished work
  const completedJobs = allJobs.filter((j) => j.current_state === 'completed' || j.current_state === 'closed');

  // Agreed price: the approved quote, else the booking's base amount. Gross job value, not a payout.
  const jobAmount = (job: (typeof allJobs)[number]): number => {
    const rawBooking = Array.isArray(job.booking) ? job.booking[0] : job.booking;
    const quotesList = Array.isArray(job.quotes) ? job.quotes : (job.quotes ? [job.quotes] : []);
    const approvedQuote = quotesList.find((q: { status?: string }) => q.status === 'approved');
    const pendingQuote = quotesList.find((q: { status?: string }) => q.status === 'pending_customer');
    return Number(approvedQuote?.total ?? pendingQuote?.total ?? rawBooking?.quoted_or_base_amount ?? 0);
  };

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
    const amount = jobAmount(job);

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

  // Value of work started but not yet completed (not money owed by the platform)
  allJobs
    .filter((j) => ['arrived', 'in_progress', 'quote_pending'].includes(j.current_state))
    .forEach((job) => {
      pendingPayouts += jobAmount(job);
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
    const amount = jobAmount(job);
    const dateStr = job.completed_at || job.created_at;

    const status: 'completed' | 'pending' | 'in_progress' =
      job.current_state === 'completed' || job.current_state === 'closed'
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

  return (data || []) as unknown as Verification[];
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
 * Update professional availability status (online/offline).
 *
 * A direct update rather than an RPC: RLS limits the row to the caller, and the
 * professional_profiles guard trigger (20261030_003) blocks changes to verification status,
 * rating and job count, so is_available is the only meaningful column this can change.
 * Going online requires a verified profile, matching transition_job_state(), which only lets
 * verified professionals accept jobs.
 */
export async function updateAvailabilityStatus(
  isAvailable: boolean
): Promise<ActionResult<{ isAvailable: boolean }>> {
  const parsed = parseInput(z.boolean(), isAvailable);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthenticated", "Not authenticated");

  const { data: profile, error: profileError } = await supabase
    .from("professional_profiles")
    .select("verification_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("updateAvailabilityStatus profile fetch error:", profileError.message);
    return fail("failed", "Could not update your status. Please try again.");
  }
  if (!profile) return fail("not_found", "Professional profile not found");
  if (parsed.data && profile.verification_status !== "verified") {
    return fail("rejected", "Your profile must be verified before you can go online.");
  }

  const { error } = await supabase
    .from("professional_profiles")
    .update({ is_available: parsed.data })
    .eq("user_id", user.id);
  if (error) {
    console.error("updateAvailabilityStatus update error:", error.message);
    return fail("failed", "Could not update your status. Please try again.");
  }

  revalidatePath("/professional");
  return ok({ isAvailable: parsed.data });
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
 * Fetch eligible (unreviewed) requests for the professional
 * Returns jobs in 'assigned' state that are assigned to this professional
 */
export async function fetchEligibleRequests(): Promise<Job[]> {
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
      customer:profiles!jobs_customer_id_fkey(id, full_name, phone),
      property:properties(id, name, address:addresses(id, city, label, address_line_1)),
      booking:bookings(id, scheduled_start, service:services(id, name, category:service_categories(id, name)))
    `
    )
    .eq("professional_id", user.id)
    .eq("current_state", "assigned")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch eligible requests: ${error.message}`);
  }

  return (data || []) as unknown as Job[];
}

/**
 * Accept a request (transition from 'assigned' to 'accepted').
 * Ownership and the allowed transition are enforced by transition_job_state().
 */
export async function acceptRequest(
  jobId: string
): Promise<ActionResult<{ jobId: string }>> {
  const parsed = parseInput(jobIdSchema, jobId);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthenticated", "Not authenticated");

  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", parsed.data)
    .eq("professional_id", user.id)
    .eq("current_state", "assigned")
    .maybeSingle();

  if (fetchError) {
    console.error("acceptRequest fetch error:", fetchError.message);
    return fail("failed", "Could not load this request. Please try again.");
  }
  if (!job) {
    return fail(
      "not_found",
      "Request not found, already accepted, or you are not assigned to it"
    );
  }

  const { error: transitionError } = await supabase.rpc("transition_job_state", {
    p_job_id: parsed.data,
    p_new_state: "accepted",
    p_actor_user_id: user.id,
  });
  if (transitionError) {
    return fail("rejected", `Failed to accept request: ${transitionError.message}`);
  }

  revalidatePath("/professional");
  revalidatePath(`/professional/jobs/${parsed.data}`);
  return ok({ jobId: parsed.data });
}

/**
 * Decline an assigned job. The offer moves to the next eligible professional,
 * or the booking returns to "finding a professional" if there is none.
 */
export async function declineJobAction(
  jobId: string,
  reason?: string
): Promise<ActionResult> {
  const parsed = parseInput(declineJobSchema, { jobId, reason });
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthenticated", "Not authenticated");

  const { error } = await supabase.rpc("decline_job", {
    p_job_id: parsed.data.jobId,
    p_reason: parsed.data.reason || null,
  });
  if (error) return fail("rejected", error.message);

  revalidatePath("/professional");
  return ok();
}

export interface JobCustomerContact {
  full_name: string | null;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  area: string | null;
  city: string;
  postal_code: string | null;
  access_notes: string | null;
}

/**
 * Customer name, phone and full address. The database releases these only to the
 * assigned professional once the job has been accepted.
 */
export async function getJobCustomerContact(
  jobId: string
): Promise<JobCustomerContact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_job_customer_contact", {
    p_job_id: jobId,
  });
  if (error) {
    console.error("getJobCustomerContact error:", error.message);
    return null;
  }
  const rows = (data ?? []) as JobCustomerContact[];
  return rows[0] ?? null;
}

/**
 * Fetch full job detail with ownership check
 * Returns comprehensive job data for the job detail page
 */
export async function fetchJobDetail(jobId: string): Promise<{
  data: Job | null;
  error: string | null;
}> {
  try {
    const job = await getJobById(jobId);
    if (!job) {
      return {
        data: null,
        error: "Job not found or access denied",
      };
    }
    return { data: job, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { data: null, error: message };
  }
}

/**
 * Submit an on-site inspection report
 */
export async function submitInspectionAction(
  payload: InspectionInput
): Promise<ActionResult<{ inspectionId: string }>> {
  const parsed = parseInput(inspectionSchema, payload);
  if (parsed.success === false) return parsed;
  const input = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Not authenticated');

  // getJobById filters by professional_id = user.id, so null means not assigned to this user.
  const job = await getJobById(input.jobId);
  if (!job) return fail('not_found', 'Job not found or not assigned to you');

  const { data, error } = await supabase
    .from('inspections')
    .insert({
      job_id: input.jobId,
      professional_id: user.id,
      findings: input.findings,
      recommendation: input.recommendation || null,
    })
    .select('id')
    .single();

  if (error) return fail('failed', error.message);

  // Audit record only; the job state does not change on inspection.
  const { error: eventError } = await supabase.from('job_events').insert({
    job_id: input.jobId,
    from_state: job.current_state,
    to_state: job.current_state,
    actor_user_id: user.id,
    event_type: 'inspection_submitted',
    metadata: { findings: input.findings.slice(0, 100), inspection_id: data.id },
  });
  if (eventError) {
    console.error('submitInspectionAction job_events insert failed:', eventError.message);
  }

  revalidatePath(`/professional/jobs/${input.jobId}`);
  revalidatePath('/professional');
  return ok({ inspectionId: data.id });
}

/**
 * Submit an additional/variable quote for customer approval.
 * No platform fee or tax is added: none is configured (see ROLE_DASHBOARDS_REBUILD §5.1),
 * so the quote total is the sum of its line items.
 */
export async function createQuoteAction(
  payload: CreateQuoteInput
): Promise<ActionResult<{ quoteId: string }>> {
  const parsed = parseInput(createQuoteSchema, payload);
  if (parsed.success === false) return parsed;
  const input = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Not authenticated');

  // getJobById filters by professional_id = user.id, so null means not assigned to this user.
  const job = await getJobById(input.jobId);
  if (!job) return fail('not_found', 'Job not found or not assigned to you');

  const items = input.lineItems.map((item) => ({
    ...item,
    lineTotal: Number((item.quantity * item.unitPrice).toFixed(2)),
  }));
  const subtotal = Number(items.reduce((acc, i) => acc + i.lineTotal, 0).toFixed(2));
  const total = subtotal;

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      job_id: input.jobId,
      professional_id: user.id,
      reason: input.reason,
      subtotal,
      taxes_or_fees: 0,
      total,
      status: 'pending_customer',
    })
    .select('id')
    .single();

  if (quoteError || !quote) {
    return fail('failed', quoteError?.message || 'Could not create quote');
  }

  const { error: itemsError } = await supabase.from('quote_items').insert(
    items.map((item) => ({
      quote_id: quote.id,
      item_type: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }))
  );
  if (itemsError) {
    console.error('createQuoteAction quote_items insert failed:', itemsError.message);
    return fail('failed', 'Quote created but its line items could not be saved: ' + itemsError.message);
  }

  // Move job to quote_pending via the state machine RPC (validates and records the event).
  const { error: rpcError } = await supabase.rpc('transition_job_state', {
    p_job_id: input.jobId,
    p_new_state: 'quote_pending',
    p_actor_user_id: user.id,
    p_metadata: {
      event_type: 'quote_submitted',
      quote_id: quote.id,
      total,
      reason: input.reason,
    },
  });

  if (rpcError) {
    console.error('createQuoteAction transition_job_state error:', rpcError.message);
    return fail('rejected', 'Quote created but job state transition failed: ' + rpcError.message);
  }

  revalidatePath(`/professional/jobs/${input.jobId}`);
  revalidatePath('/professional');
  return ok({ quoteId: quote.id });
}
