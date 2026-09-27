import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware helper for session refresh
 * Called from middleware.ts
 * 
 * This ensures that:
 * 1. The session is refreshed on every request
 * 2. Expired access tokens are renewed
 * 3. Updated cookies are propagated to the response
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Force session refresh at start of middleware
  // This ensures access token is valid and refreshed if expired
  await supabase.auth.getSession();

  return response;
}
