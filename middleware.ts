import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware for Supabase SSR Cookie Refresh
 * 
 * Purpose:
 * - Refreshes authentication session on every request
 * - Updates session cookies automatically
 * - Prevents session expiration during active use
 * 
 * Pattern: Supabase SSR with Next.js
 * Reference: https://supabase.com/docs/guides/auth/server-side-rendering
 * 
 * This runs on every request to the application.
 * Keep it lightweight; avoid expensive operations here.
 */

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session - this updates access token if expired
  await supabase.auth.getSession()

  return response
}

/**
 * Configure which routes should trigger middleware.
 * 
 * We run middleware on protected routes to maintain sessions.
 * Public routes like /auth/login don't need it.
 */
export const config = {
  matcher: [
    // Protected customer routes
    '/app/:path*',
    // Protected professional routes
    '/pro/:path*',
    // Protected admin routes
    '/admin/:path*',
    // API routes that handle auth
    '/api/:path*',
  ],
}
