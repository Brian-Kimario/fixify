'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { fail, ok, parseInput, type ActionResult } from '@/lib/actions/result';
import {
  reissueJobCodeSchema,
  reportNoShowSchema,
  verifyJobCodeSchema,
  type ReissueJobCodeInput,
  type ReportNoShowInput,
  type VerifyJobCodeInput,
} from '@/validators';
import { parseJobCodeState } from '@/lib/services/job-codes';
import { verifyFailureMessage, type VerifyReason } from './rules';

function refresh(jobId: string) {
  revalidatePath(`/professional/jobs/${jobId}`);
  revalidatePath(`/customer/bookings`, 'layout');
}

export type VerifyOutcome =
  | { verified: true }
  | { verified: false; reason: VerifyReason; attemptsLeft: number | null; message: string };

/**
 * The assigned professional enters the customer's code. A wrong code is an expected outcome, not an
 * error: the database records the attempt and may lock the code. A right code does not move the
 * job; the professional still makes the transition, which the database refuses without it.
 */
export async function verifyJobCodeAction(payload: VerifyJobCodeInput): Promise<ActionResult<VerifyOutcome>> {
  const parsed = parseInput(verifyJobCodeSchema, payload);
  if (parsed.success === false) return parsed;
  const { jobId, purpose, code } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { data, error } = await supabase.rpc('verify_job_code', { p_job_id: jobId, p_purpose: purpose, p_code: code });
  if (error) {
    if (error.code === 'P0002') return fail('not_found', 'This job is not available to you.');
    if (error.code === '22023') return fail('rejected', error.message);
    console.error('verify_job_code error:', error.message);
    return fail('failed', 'Could not check the code. Please try again.');
  }

  const result = data as { ok?: boolean; reason?: VerifyReason; attempts_left?: number } | null;
  refresh(jobId);
  if (result?.ok) return ok({ verified: true });
  const reason = result?.reason ?? 'no_code';
  const attemptsLeft = typeof result?.attempts_left === 'number' ? result.attempts_left : null;
  return ok({ verified: false, reason, attemptsLeft, message: verifyFailureMessage(reason, attemptsLeft) });
}

/** The customer asks for a new code (at most twice per job; the database counts). */
export async function reissueJobCodeAction(payload: ReissueJobCodeInput): Promise<ActionResult> {
  const parsed = parseInput(reissueJobCodeSchema, payload);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { data, error } = await supabase.rpc('reissue_job_code', { p_job_id: parsed.data.jobId });
  if (error) {
    if (error.code === 'P0002') return fail('not_found', 'This job is not available to you.');
    if (error.code === '22023') return fail('rejected', error.message);
    console.error('reissue_job_code error:', error.message);
    return fail('failed', 'Could not issue a new code. Please try again.');
  }
  if (!parseJobCodeState(data)) return fail('failed', 'Could not issue a new code. Please try again.');
  refresh(parsed.data.jobId);
  return ok();
}

/** The customer reports that the professional did not arrive. Recorded for review; nothing automatic follows. */
export async function reportNoShowAction(payload: ReportNoShowInput): Promise<ActionResult> {
  const parsed = parseInput(reportNoShowSchema, payload);
  if (parsed.success === false) return parsed;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail('unauthenticated', 'Sign in to continue.');

  const { error } = await supabase.rpc('report_professional_no_show', {
    p_job_id: parsed.data.jobId,
    p_preference: parsed.data.preference,
  });
  if (error) {
    if (error.code === 'P0002') return fail('not_found', 'This job is not available to you.');
    if (error.code === '22023') return fail('rejected', error.message);
    console.error('report_professional_no_show error:', error.message);
    return fail('failed', 'Could not send your report. Please try again.');
  }
  refresh(parsed.data.jobId);
  return ok();
}
