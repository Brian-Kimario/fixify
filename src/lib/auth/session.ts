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

/**
 * Get current user's profile
 * 
 * Returns the profiles table entry with role, full_name, etc.
 * Includes RLS enforcement (can only read own profile unless admin).
 * 
 * @returns Profile object or null if not authenticated
 */
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
    console.error('Failed to fetch profile:', error);
    return null;
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
