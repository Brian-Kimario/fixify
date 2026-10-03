'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { type AuthResponse } from '@/types/auth';

/**
 * Server Action: Register a new professional
 *
 * This action:
 * 1. Creates an auth.users entry via Supabase Auth with role='professional'
 * 2. Trigger automatically creates a customer profile with role='professional'
 * 3. Creates a professional_profiles record with verification_status='pending'
 * 4. Returns success/error
 *
 * Professional accounts start in a pending verification state.
 * They cannot accept jobs until verified by admin.
 *
 * @param data - Professional sign-up data (email, password, full_name, display_name, years_experience)
 * @returns Success/error response
 */
export async function registerProfessional(data: {
  email: string;
  password: string;
  full_name: string;
  display_name: string;
  years_experience?: number;
}): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    // Sign up via Supabase Auth with professional role in metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: 'professional', // Set role in metadata
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      };
    }

    // Use admin client to create professional_profiles record
    // (must bypass RLS since authenticated user just signed up and might not have permissions yet)
    const adminClient = await createAdminClient();

    const { error: profileError } = await (adminClient as any)
      .from('professional_profiles')
      .insert({
        user_id: authData.user.id,
        display_name: data.display_name,
        years_experience: data.years_experience || 0,
        verification_status: 'pending',
        is_available: false,
      });

    if (profileError) {
      console.error('[Professional Registration] Failed to create professional profile:', profileError);
      // Don't fail the entire signup; the profile can be created later
      // But log it for debugging
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[Professional Registration] Unexpected error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check professional verification status
 *
 * Returns the current verification status of an authenticated professional user
 *
 * @returns verification_status or null if not a professional or error
 */
export async function getProfessionalVerificationStatus(): Promise<{
  status: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        status: null,
        error: 'Not authenticated',
      };
    }

    // Get professional profile
    const { data: professional, error } = await supabase
      .from('professional_profiles')
      .select('verification_status')
      .eq('user_id', user.id)
      .single();

    if (error) {
      return {
        status: null,
        error: error.message,
      };
    }

    return {
      status: professional?.verification_status || null,
      error: null,
    };
  } catch (err) {
    console.error('[Professional Verification] Error checking status:', err);
    return {
      status: null,
      error: 'Failed to check verification status',
    };
  }
}
