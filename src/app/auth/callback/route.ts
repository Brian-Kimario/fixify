import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * OAuth Callback Route Handler
 * 
 * Handles the PKCE OAuth flow redirect from Supabase.
 * 
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Supabase Auth endpoint
 * 3. Google OAuth provider authenticates
 * 4. Supabase redirects to this endpoint with authorization code
 * 5. This route exchanges code for session
 * 6. Cookie-based session established
 * 7. Redirect to application
 * 
 * Reference: https://supabase.com/docs/guides/auth/server-side-rendering
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error:', error)
    const errorDescription = searchParams.get('error_description')
    return NextResponse.redirect(
      new URL(`/auth/error?error=${error}&description=${errorDescription}`, request.url)
    )
  }

  // Verify authorization code exists
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url))
  }

  try {
    const supabase = await createClient()

    // Exchange authorization code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        new URL(`/auth/error?error=exchange_failed&message=${exchangeError.message}`, request.url)
      )
    }

    // Session successfully established via cookies
    // Redirect to application home
    return NextResponse.redirect(new URL('/app', request.url))
  } catch (error) {
    console.error('Callback handler error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=callback_error', request.url))
  }
}
