'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser/client-side Supabase client
 * 
 * Used in Client Components for real-time subscriptions and client-side queries.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to this client.
 * 
 * This client uses the PKCE OAuth flow and public/publishable keys only.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables (URL or publishable key)')
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
