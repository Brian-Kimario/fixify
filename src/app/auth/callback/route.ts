import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getRedirectPathByRole } from '@/app/auth/utils'
import { validateNextParam } from '@/lib/auth/validateNextParam'

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
 * 7. Redirect to application based on user role
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
      new URL(`/auth/login?error=${error}`, request.url)
    )
  }

  // Verify authorization code exists
  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url))
  }

  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
              // Handle cookie setting errors
            }
          },
        },
      }
    )

    // Exchange authorization code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError || !data.session) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', request.url))
    }

    // Auto-create or update profile for new OAuth users
    const profileData = {
      id: data.user.id,
      full_name: data.user.user_metadata?.full_name ?? null,
      avatar_url: data.user.user_metadata?.avatar_url ?? null,
      role: 'customer',
    }

    // Upsert: create if not exists, no-op if exists
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' })

    if (upsertError) {
      console.error('Profile upsert error (non-blocking):', upsertError)
      // Continue anyway—profile may already exist or trigger may have created it
    }

    // Fetch the profile to confirm role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile?.role) {
      console.error('Profile fetch error after upsert:', profileError)
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?error=missing_profile', request.url))
    }

    const role = profile.role
    let redirectPath = getRedirectPathByRole(role)
    if (!redirectPath) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?error=invalid_role', request.url))
    }

    // Validate and resolve the next parameter
    const next = searchParams.get('next')
    redirectPath = validateNextParam(next, role, redirectPath)

    // Redirect to user's dashboard or requested target
    return NextResponse.redirect(new URL(redirectPath, request.url))
  } catch (error) {
    console.error('Callback handler error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url))
  }
}
