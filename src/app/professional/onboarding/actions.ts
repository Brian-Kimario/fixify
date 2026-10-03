'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type VerificationStatus = 'pending' | 'documents_submitted' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export interface ProfessionalVerificationData {
  user_id: string;
  display_name: string;
  years_experience: number;
  verification_status: VerificationStatus;
  is_available: boolean;
  created_at: string;
  verification_details: {
    status: VerificationStatus;
    submitted_at: string | null;
    reviewed_at: string | null;
    rejection_reason: string | null;
  } | null;
}

/**
 * Get professional verification status and details
 */
export async function getProfessionalVerificationData(): Promise<{
  data: ProfessionalVerificationData | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        data: null,
        error: 'Not authenticated',
      };
    }

    // Get professional profile
    const { data: profile, error: profileError } = await supabase
      .from('professional_profiles')
      .select('user_id, display_name, years_experience, verification_status, is_available, created_at')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return {
        data: null,
        error: profileError.message,
      };
    }

    // Get verification details
    const { data: verification, error: verificationError } = await supabase
      .from('professional_verifications')
      .select('status, submitted_at, reviewed_at, rejection_reason')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (verificationError && verificationError.code !== 'PGRST116') {
      console.warn('Error fetching verification details:', verificationError);
    }

    return {
      data: {
        ...profile,
        verification_details: verification,
      },
      error: null,
    };
  } catch (err) {
    console.error('[Onboarding] Error fetching verification data:', err);
    return {
      data: null,
      error: 'Failed to load verification status',
    };
  }
}

/**
 * Submit verification documents
 * Creates or updates professional_verifications record
 */
export async function submitVerificationDocuments(data: {
  rejection_reason?: string;
}): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const adminClient = await createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Check if verification record exists
    const { data: existingVerification } = await supabase
      .from('professional_verifications')
      .select('id')
      .eq('professional_id', user.id)
      .maybeSingle();

    if (existingVerification) {
      // Update existing verification
      const { error } = await (adminClient as any)
        .from('professional_verifications')
        .update({
          status: 'documents_submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existingVerification.id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    } else {
      // Create new verification record
      const { error } = await (adminClient as any)
        .from('professional_verifications')
        .insert({
          professional_id: user.id,
          status: 'documents_submitted',
          submitted_at: new Date().toISOString(),
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    // Update professional profile status
    const { error: updateError } = await (adminClient as any)
      .from('professional_profiles')
      .update({
        verification_status: 'documents_submitted',
      })
      .eq('user_id', user.id);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    console.error('[Onboarding] Error submitting verification:', err);
    return {
      success: false,
      error: 'Failed to submit verification',
    };
  }
}

/**
 * Get verification status description for UI
 */
export function getVerificationStatusDescription(status: VerificationStatus): {
  title: string;
  description: string;
  icon: string;
} {
  switch (status) {
    case 'pending':
      return {
        title: 'Verification Pending',
        description: 'Complete your professional profile and submit required documents to start accepting jobs.',
        icon: '⏳',
      };
    case 'documents_submitted':
      return {
        title: 'Documents Under Review',
        description: 'We\'re verifying your credentials. This usually takes 1-2 business days. We\'ll notify you when verification is complete.',
        icon: '📋',
      };
    case 'under_review':
      return {
        title: 'Under Review',
        description: 'Our team is reviewing your credentials to ensure quality and safety standards.',
        icon: '👀',
      };
    case 'verified':
      return {
        title: 'Verified Professional',
        description: 'Your account is verified and ready to accept jobs.',
        icon: '✓',
      };
    case 'rejected':
      return {
        title: 'Verification Rejected',
        description: 'Unfortunately, we were unable to verify your account at this time. Please contact support for more information.',
        icon: '❌',
      };
    case 'suspended':
      return {
        title: 'Account Suspended',
        description: 'Your account has been suspended. Please contact support.',
        icon: '⛔',
      };
    default:
      return {
        title: 'Unknown Status',
        description: 'Unable to determine verification status.',
        icon: '❓',
      };
  }
}
