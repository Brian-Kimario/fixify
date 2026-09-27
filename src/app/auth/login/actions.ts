'use server';

import { createClient } from '@/lib/supabase/server';
import { getRedirectPathByRole } from '@/app/auth/utils';
import { type AuthResponse } from '@/types/auth';

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthResponse & { redirectPath?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || 'Failed to authenticate. Please try again.',
      };
    }

    // Read through the signed-in client so this path is covered by the same RLS
    // policy used by the application, rather than bypassing authorization.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Your account is missing a valid Fixify profile. Please contact support.',
      };
    }

    const redirectPath = getRedirectPathByRole(profile.role);
    if (!redirectPath) {
      await supabase.auth.signOut();
      return { success: false, error: 'Your account has no valid access role.' };
    }

    return { success: true, redirectPath };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
