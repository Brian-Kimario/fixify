'use server';

/**
 * Payment Service — State Machine Enforcement
 * 
 * Security model:
 * - All payment status transitions MUST go through transition_payment_status() RPC
 * - Authorization: Customer owns the payment, or admin user
 * - Audit: Every transition recorded in immutable payment_events table
 * - No direct .update() calls on payment status allowed
 */

import { createClient } from '@/lib/supabase/server';

export interface PaymentStatusTransitionResult {
  success: boolean;
  error?: string;
}

/**
 * Transition a payment's status through the authorized state machine
 * 
 * Called from:
 * - Razorpay webhook (when payment confirmed)
 * - Admin dashboard (manual payment recording)
 * - Customer action (refund requests, etc.)
 * 
 * @param paymentId - UUID of the payment to transition
 * @param newStatus - Target status (e.g., 'paid', 'failed', 'refunded')
 * @param reason - Reason for transition (logged in audit)
 * @returns Success/error result
 */
export async function transitionPaymentStatus(
  paymentId: string,
  newStatus: string,
  reason: string = ''
): Promise<PaymentStatusTransitionResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Get user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'Profile not found',
      };
    }

    // Get payment to verify ownership (if not admin)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, customer_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    // Authorization: Customer owns it, or user is admin
    const isOwner = payment.customer_id === user.id;
    const isAdmin = profile.role === 'admin';

    if (!isOwner && !isAdmin) {
      return {
        success: false,
        error: 'Not authorized to modify this payment',
      };
    }

    // Call DB function to transition status with full auth context
    // @ts-ignore - New RPC function not yet in generated types
    const { error: rpcError } = await supabase.rpc('transition_payment_status', {
      p_payment_id: paymentId,
      p_new_status: newStatus,
      p_actor_user_id: user.id,
      p_actor_role: profile.role,
      p_reason: reason,
      p_metadata: {},
    });

    if (rpcError) {
      console.error(
        `[Payment Service] Status transition failed for payment ${paymentId}:`,
        rpcError
      );
      return {
        success: false,
        error: rpcError.message,
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[Payment Service] Unexpected error in transitionPaymentStatus:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Record a payment received from external source (e.g., Razorpay webhook)
 * 
 * Called ONLY from webhook context — uses admin override but still records audit event
 * 
 * @param paymentId - UUID of payment to mark as paid
 * @param razorpayPaymentId - Razorpay's payment ID
 * @param additionalMetadata - UPI/bank details, etc.
 * @returns Success/error result
 */
export async function recordPaymentReceived(
  paymentId: string,
  razorpayPaymentId: string,
  additionalMetadata?: Record<string, any>
): Promise<PaymentStatusTransitionResult> {
  try {
    const supabase = await createClient();

    // Webhook context: no authenticated user, use system actor
    // In practice, this is called from the webhook route which has admin client
    // We record "webhook" as the actor role

    const { error: rpcError } = await supabase.rpc('transition_payment_status' as any, {
      p_payment_id: paymentId,
      p_new_status: 'paid',
      p_actor_user_id: null, // System action
      p_actor_role: 'webhook',
      p_reason: `Payment received via Razorpay: ${razorpayPaymentId}`,
      p_metadata: {
        razorpay_payment_id: razorpayPaymentId,
        ...(additionalMetadata || {}),
      },
    });

    if (rpcError) {
      console.error(
        `[Payment Service] Failed to record payment received for ${paymentId}:`,
        rpcError
      );
      return {
        success: false,
        error: rpcError.message,
      };
    }

    return { success: true };
  } catch (err) {
    console.error('[Payment Service] Unexpected error in recordPaymentReceived:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
