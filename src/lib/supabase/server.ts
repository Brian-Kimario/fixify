import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server-side Supabase client using cookie-based SSR pattern
 * 
 * Used in:
 * - Server Components
 * - API Routes / Route Handlers
 * - Server Actions
 * - Middleware
 * 
 * Follows Supabase's recommended Next.js SSR pattern with cookie-based session management.
 * This client automatically refreshes authentication tokens between requests.
 * 
 * Rules:
 * - This client reads/writes cookies
 * - Uses publishable key (same as browser client)
 * - Does NOT use service-role key (would bypass RLS)
 * - Respects Row Level Security policies
 * - Can use service-role ONLY in specific protected Edge Functions
 */

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle errors in cookie setting (e.g., in middleware)
          }
        },
      },
    }
  )
}
