'use server';

import { createClient } from '@/lib/supabase/server';
import { type AuthResponse } from '@/types/auth';

/**
 * Server Action: Register a new user with email and password
 *
 * This action:
 * 1. Creates an auth.users entry via Supabase Auth
 * 2. Trigger automatically creates a customer profile
 * 3. Returns success/error
 *
 * @param data - Customer sign-up data (email, password, full_name)
 * @returns Success/error response
 */
export async function registerWithEmail(data: { email: string; password: string; full_name: string }): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: 'customer',
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

    return {
      success: true,
    };
  } catch (err) {
    console.error('Registration error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
