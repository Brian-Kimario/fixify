'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { type AuthResponse } from '@/types/auth';

interface UpdateProfileData {
  fullName: string;
  phone: string;
}

/**
 * Server Action: Update user profile
 *
 * @param data - Updated profile data
 * @returns Success/error response
 */
export async function updateProfile(
  data: UpdateProfileData,
): Promise<AuthResponse> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      };
    }

    // Validate input
    if (!data.fullName || data.fullName.trim().length === 0) {
      return {
        success: false,
        error: 'Full name is required',
      };
    }

    if (data.fullName.length > 255) {
      return {
        success: false,
        error: 'Full name is too long',
      };
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName.trim(),
        phone: data.phone?.trim() || null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: 'Failed to update profile. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Update profile error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
