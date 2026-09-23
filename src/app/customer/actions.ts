'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server Action: Logout user
 *
 * Signs out the user and redirects to login page.
 */
export async function logoutUser() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Always redirect to login page
  redirect('/auth/login');
}
