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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                // Properly set cookie with all options including secure, httpOnly, sameSite
                cookieStore.set(name, value, {
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                })
              } catch (error) {
                // Silently suppress cookie modification errors that occur in Server Components
                // Next.js only allows cookie modification in Server Actions and Route Handlers
                // In Server Components, we catch and suppress the error to prevent console pollution
                // Session validation will continue through middleware on the next request
                if (
                  error instanceof Error &&
                  error.message.includes('Cookies can only be modified in a Server Action or Route Handler')
                ) {
                  // Expected error in Server Component context - suppress silently
                  // The session will be refreshed on the next middleware invocation
                  return
                }
                // For unexpected errors, log for debugging
                console.error('[createClient] Unexpected cookie error:', error)
              }
            })
          } catch (error) {
            // Handle any unexpected errors in the forEach loop
            console.error('[createClient] Error in setAll callback:', error)
          }
        },
      },
    }
  )
}
