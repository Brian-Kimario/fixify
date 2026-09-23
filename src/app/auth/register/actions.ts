'use server';

import { createClient } from '@/lib/supabase/server';
import { type SignUpData, type AuthResponse } from '@/types/auth';

/**
 * Server Action: Register a new user with email and password
 *
 * This action:
 * 1. Creates an auth.users entry via Supabase Auth
 * 2. Trigger automatically creates profiles entry with role
 * 3. Returns success/error
 *
 * @param data - Sign up data (email, password, full_name, role)
 * @returns Success/error response
 */
export async function registerWithEmail(data: SignUpData): Promise<AuthResponse> {
  try {
    const supabase = await createClient();

    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
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
