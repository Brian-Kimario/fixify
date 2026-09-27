/**
 * Session Management
 * 
 * Provides utilities for accessing and managing user sessions
 * across Server Components, Route Handlers, and Server Actions.
 */

import { createClient } from '@/lib/supabase/server';
import { type User } from '@supabase/supabase-js';
import { type Profile } from '@/types/auth';

/**
 * Get current authenticated user
 * 
 * Returns null if not authenticated.
 * Safe to use in Server Components, Route Handlers, Server Actions.
 * 
 * @returns User object with email, id, or null
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Convert error to plain object for serialization
    const errorObj = {
      message: String(error.message || 'Unknown error'),
      code: String(error.code || 'UNKNOWN'),
      details: String(error.details || ''),
      hint: String(error.hint || ''),
      userId: user.id,
      timestamp: new Date().toISOString(),
    };

    console.warn('Profile fetch error details:', errorObj);

    // PGRST116 = record not found, PGRST201 = policy violation
    if (error.code === 'PGRST116') {
      console.warn('Profile record not found, attempting to create');

      // Use service role to bypass RLS for profile creation (system operation)
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = await createAdminClient();

      const { data: newProfile, error: createError } = await adminClient
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'customer',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (createError) {
        const createErrorObj = {
          message: String(createError.message || 'Unknown error'),
          code: String(createError.code || 'UNKNOWN'),
          details: String(createError.details || ''),
          userId: user.id,
        };
        console.error('Failed to create profile:', createErrorObj);
        return null;
      }

      console.info('Profile created successfully for user:', user.id);
      return newProfile as Profile;
    } else if (error.code === 'PGRST201') {
      console.warn('Profile access denied by RLS policy, attempting to create via admin');

      // Use service role to bypass RLS
      const { createAdminClient } = await import('@/lib/supabase/admin');
      const adminClient = await createAdminClient();

      const { data: newProfile, error: createError } = await adminClient
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'customer',
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();

      if (createError) {
        const createErrorObj = {
          message: String(createError.message || 'Unknown error'),
          code: String(createError.code || 'UNKNOWN'),
          details: String(createError.details || ''),
          userId: user.id,
        };
        console.error('Failed to create profile via admin:', createErrorObj);
        return null;
      }

      console.info('Profile created via admin client for user:', user.id);
      return newProfile as Profile;
    }

    // For any other error, try fetching as admin to get the profile
    console.warn('Trying to fetch profile as admin due to error:', errorObj.code);
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = await createAdminClient();

    const { data: adminData, error: adminError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError) {
      const adminErrorObj = {
        message: String(adminError.message || 'Unknown error'),
        code: String(adminError.code || 'UNKNOWN'),
        details: String(adminError.details || ''),
        userId: user.id,
      };
      console.error('Failed to fetch profile even as admin:', adminErrorObj);
      return null;
    }

    console.info('Successfully fetched profile as admin for user:', user.id);
    return adminData as Profile;
  }

  return data as Profile;
}

/**
 * Check if user has a specific role
 * 
 * @param role - Role to check against
 * @returns true if user has the role, false otherwise
 */
export async function hasRole(role: string): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === role;
}

/**
 * Sign out current user
 * 
 * Clears session and redirects to login page
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
