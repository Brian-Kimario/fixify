'use server';

import { createClient } from '@/lib/supabase/server';
import { clearSessionCookies } from '@/lib/session';
import { redirect } from 'next/navigation';

/**
 * Server Action: Logout user
 *
 * Signs out the user, wipes session cookies, and redirects to login page.
 */
export async function logoutUser() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }

  try {
    await clearSessionCookies();
  } catch (err) {
    console.error('Clear cookies error:', err);
  }

  // Redirect to login page with logged_out flag to prevent middleware bounce-back
  redirect('/auth/login?logged_out=1');
}
