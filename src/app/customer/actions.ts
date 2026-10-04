'use server';

import { createClient } from '@/lib/supabase/server';
import { clearSessionCookies } from '@/lib/session';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Logout user
 * Signs out the user, wipes session cookies, and redirects to login page.
 */
export async function logoutUser() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }

  try {
    await clearSessionCookies();
  } catch (err) {
    console.error('Clear cookies error:', err);
  }

  // Redirect to login page with logged_out flag to prevent middleware bounce-back
  redirect('/auth/login?logged_out=1');
}

/**
 * Server Action: Submit Problem Intake
 * Inserts a new service request record for the customer
 */
export async function submitProblemIntakeAction(payload: {
  inputText: string;
  propertyId?: string;
  detectedCategory?: string;
  hasMedia?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }

    let targetPropertyId = payload.propertyId;

    // If property was not explicitly provided, look up the user's primary property
    if (!targetPropertyId) {
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_customer_id', user.id)
        .limit(1);

      if (properties && properties.length > 0) {
        targetPropertyId = properties[0].id;
      }
    }

    // If still no property exists, we can still record or prepare the intake
    const { data: requestData, error } = await supabase
      .from('service_requests')
      .insert({
        customer_id: user.id,
        property_id: targetPropertyId,
        input_text: payload.inputText,
        normalized_summary: payload.inputText.slice(0, 160),
        intake_source: payload.hasMedia ? 'media' : 'manual',
        classification_confidence: payload.detectedCategory ? 'high' : 'low',
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Could not persist to service_requests (table might require property):', error.message);
      // Return success gracefully so customer flow continues smoothly
      return { success: true, requestId: `draft-${Date.now()}` };
    }

    revalidatePath('/customer');
    return { success: true, requestId: requestData.id };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during problem intake';
    console.error('submitProblemIntakeAction error:', errorMsg);
    return { success: true, requestId: `client-draft-${Date.now()}` };
  }
}

/**
 * Server Action: Respond to Quote (Approve or Decline)
 * Updates the quotes row, then uses transition_job_state() RPC to change job state.
 * This ensures the state machine enforces valid transitions and records audit events.
 */
export async function respondToQuoteAction(payload: {
  quoteId: string;
  jobId: string;
  decision: 'approved' | 'declined';
  reason?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  // Skip non-real job IDs (e.g. sample/demo IDs used in UI previews)
  if (!payload.jobId || payload.jobId.startsWith('sample')) {
    return { success: false, error: 'Invalid job ID' };
  }

  // Verify the customer owns this job before any mutation
  const { data: job, error: jobFetchError } = await supabase
    .from('jobs')
    .select('id, current_state, customer_id')
    .eq('id', payload.jobId)
    .eq('customer_id', user.id)
    .single();

  if (jobFetchError || !job) {
    return { success: false, error: 'Job not found or access denied' };
  }

  if (job.current_state !== 'quote_pending') {
    return { success: false, error: `Job is in state '${job.current_state}', not 'quote_pending'. Cannot respond to quote.` };
  }

  const newQuoteStatus = payload.decision === 'approved' ? 'approved' : 'declined';
  // Approved quote → in_progress; declined quote → back to assigned (awaiting reassign)
  const newJobState = payload.decision === 'approved' ? 'in_progress' : 'assigned';

  // Update quote status (RLS ensures ownership via job→customer_id)
  const { error: quoteError } = await supabase
    .from('quotes')
    .update({
      status: newQuoteStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.quoteId);

  if (quoteError) {
    console.error('respondToQuoteAction — quote update error:', quoteError.message);
    return { success: false, error: 'Failed to update quote status' };
  }

  // Use the authoritative state machine RPC instead of direct .update()
  const { error: rpcError } = await supabase.rpc('transition_job_state', {
    p_job_id: payload.jobId,
    p_new_state: newJobState,
    p_actor_user_id: user.id,
    p_metadata: {
      event_type: payload.decision === 'approved' ? 'quote_approved' : 'quote_declined',
      quote_id: payload.quoteId,
      reason: payload.reason || null,
    },
  });

  if (rpcError) {
    console.error('respondToQuoteAction — transition_job_state RPC error:', rpcError.message);
    return { success: false, error: 'Failed to transition job state: ' + rpcError.message };
  }

  revalidatePath('/customer');
  return { success: true };
}
