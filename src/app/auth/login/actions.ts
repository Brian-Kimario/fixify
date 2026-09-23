'use server';

import { createClient } from '@/lib/supabase/server';
import { type AuthResponse } from '@/types/auth';

/**
 * Server Action: Login with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Success/error response
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Failed to authenticate. Please try again.',
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Login error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
