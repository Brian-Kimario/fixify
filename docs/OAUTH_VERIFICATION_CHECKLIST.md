# Supabase OAuth Configuration Verification Checklist

This document guides you through verifying that Supabase OAuth is correctly configured for the Fixify application, specifically for the Google OAuth provider.

## Overview

The OAuth callback flow works as follows:
1. User clicks "Continue with Google" on the login page
2. Browser redirected to Google OAuth consent screen
3. User authenticates with Google and grants permission
4. Google redirects back to your app's callback URL with an authorization code
5. The callback route (`/auth/callback`) exchanges the code for a session
6. The route auto-creates a profile (if new user) and redirects based on role

For this flow to work, the redirect URL must be registered in both Supabase and Google OAuth.

## Prerequisites

- Access to your Supabase project dashboard
- .env.local file with Supabase credentials
- Vercel deployment URL (e.g., `https://fixify-brian-kimarios-projects.vercel.app`)
- Local development environment (http://localhost:3000)

---

## Verification Steps

### 1. Verify Supabase Environment Variables

Check `/Users/brian_kimario/Downloads/fixify/.env.local`:

```bash
# These should be present and filled in:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

If missing:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the project URL and anon key
3. Add to `.env.local`

---

### 2. Configure Supabase OAuth Provider

In the Supabase Dashboard:

1. **Navigate to Authentication**
   - Go to https://app.supabase.com
   - Select your project
   - Click **Authentication** in the left menu

2. **Configure Google Provider**
   - Click **Providers** → **Google**
   - Verify the provider is **Enabled** (toggle should be on)
   - You should see:
     - **Client ID**: (provided by Google OAuth credentials)
     - **Client Secret**: (provided by Google OAuth credentials)

3. **Register Redirect URLs**
   - Under **Redirect URLs** (or in the Auth settings), ensure these URLs are registered:
     - `https://fixify-brian-kimarios-projects.vercel.app/auth/callback` (Vercel production)
     - `http://localhost:3000/auth/callback` (local development)
   - The app's code dynamically constructs the callback URL based on the request origin, so it must match one of these registered URLs

4. **Verify Configuration**
   - Note the **Google Client ID** and **Client Secret**
   - These are provided by the Google Cloud Console and configured in Supabase
   - The Supabase SDK handles them automatically; you don't need to store them in `.env.local`

---

### 3. Verify Google OAuth Credentials (External to Supabase)

Google OAuth credentials should already be set in Supabase. To verify or update them:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com

2. **Select Your Project**
   - Choose the project where OAuth credentials are stored

3. **Locate OAuth 2.0 Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Find the OAuth 2.0 Client ID labeled "Web application" or similar

4. **Verify Authorized Redirect URLs**
   - In the credential details, check **Authorized redirect URIs**
   - Ensure both are present:
     - `https://fixify-brian-kimarios-projects.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
   - If missing, add them:
     1. Click the credential to open details
     2. Edit **Authorized redirect URIs**
     3. Add the URLs and save

5. **Copy Client ID and Secret (if needed for manual configuration)**
   - In Supabase Dashboard, paste them in the Google provider settings

---

### 4. Verify Code Configuration

Check `src/app/auth/actions.ts` to ensure the callback URL is constructed dynamically:

```typescript
// Should have code like:
const redirectUrl = `${origin}/auth/callback`
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl,
  },
})
```

This dynamically uses the request origin (localhost or Vercel URL) to construct the redirect URL.

---

### 5. Verify OAuth Callback Route

Check `src/app/auth/callback/route.ts`:

- [ ] Route handles missing `code` parameter → redirects to `/auth/login?error=no_code`
- [ ] Route handles OAuth errors → redirects to `/auth/login?error={error_code}`
- [ ] Route exchanges code for session
- [ ] Route **auto-creates profile** for new users (upsert with full_name, avatar_url, role)
- [ ] Route **does not sign out** new users; instead redirects based on role
- [ ] Route fetches user profile and redirects to role-based path (e.g., `/customer`, `/professional`)

---

### 6. Test the Flow Locally

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Navigate to login page**
   ```
   http://localhost:3000/auth/login
   ```

3. **Click "Continue with Google"**
   - You should be redirected to Google's consent screen
   - Authenticate with a test Google account

4. **Verify Callback**
   - After authentication, you should be redirected back to the app
   - You should NOT see an error or be signed out
   - You should land on the dashboard (e.g., `/customer` for new users)

5. **Verify Profile Created**
   - In Supabase Dashboard, go to **SQL Editor** and run:
     ```sql
     SELECT id, full_name, avatar_url, role FROM profiles
     WHERE id = 'the-user-id-from-google-oauth'
     ORDER BY created_at DESC LIMIT 1;
     ```
   - Verify:
     - `full_name` is populated from Google profile
     - `avatar_url` is populated from Google profile
     - `role` is set to 'customer'

---

### 7. Test on Vercel Deployment

1. **Ensure Vercel protection is disabled** (per user setup)
   - Navigate to https://fixify-brian-kimarios-projects.vercel.app
   - You should not see a Vercel login screen

2. **Test the OAuth flow on Vercel**
   - Navigate to https://fixify-brian-kimarios-projects.vercel.app/auth/login
   - Click "Continue with Google"
   - Complete authentication
   - Verify redirect to dashboard (should match local behavior)

3. **Verify in Supabase**
   - Check that the new profile was created (see Step 6, Verify Profile Created)

---

## Troubleshooting

### Issue: Redirected back to login with `error=exchange_failed`

**Possible Causes:**
- Authorization code is invalid or expired
- Callback URL does not match registered URL in Supabase/Google

**Fix:**
1. Verify the callback URL in the browser matches one of the registered URLs
2. Check Supabase logs for code exchange errors
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### Issue: Redirected to login with `error=missing_profile` (after callback is fixed)

**This should no longer happen** because the callback route now auto-creates profiles. If it does:
1. Check the callback route logs for upsert errors
2. Verify the `profiles` table exists and is accessible
3. Run the migration: `supabase migration up`

### Issue: Profile created but `full_name` or `avatar_url` are null

**Possible Causes:**
- Google OAuth provider is not returning metadata
- Metadata is stored in a different field in `raw_user_meta_data`

**Fix:**
1. In Supabase Dashboard, check the user's metadata:
   - Go to **Authentication** → **Users**
   - Click the user to view metadata
   - Note where `full_name` and `avatar_url` are stored
2. If stored elsewhere, update the callback route to extract from the correct field
3. Example: If stored in `user_metadata` instead of `raw_user_meta_data`, update:
   ```typescript
   full_name: data.user.user_metadata?.full_name ?? null,
   avatar_url: data.user.user_metadata?.avatar_url ?? null,
   ```

### Issue: User signs out after OAuth callback

**This should no longer happen** because the callback route now auto-creates profiles. If it does:
1. Check the callback route logs for errors
2. Verify the upsert query is not failing
3. Run the Playwright test to confirm the route is working:
   ```bash
   PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/oauth-callback.test.ts
   ```

---

## Verification Checklist Summary

- [ ] NEXT_PUBLIC_SUPABASE_URL is set in .env.local
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set in .env.local
- [ ] Supabase Google provider is enabled
- [ ] Callback URL is registered in Supabase (both localhost and Vercel)
- [ ] Google OAuth credentials are configured (Client ID and Secret)
- [ ] Callback URL is registered in Google Cloud Console
- [ ] Code dynamically constructs callback URL from request origin
- [ ] Callback route auto-creates profile (no sign-out on missing profile)
- [ ] Local OAuth flow works: login → Google → callback → dashboard
- [ ] Vercel OAuth flow works: login → Google → callback → dashboard
- [ ] Profile created with full_name, avatar_url, and role set to 'customer'

---

## Next Steps

Once verified, run the E2E tests:

```bash
# Test against local dev server
npm run test:e2e

# Test against Vercel deployment
PLAYWRIGHT_TEST_BASE_URL=https://fixify-brian-kimarios-projects.vercel.app npm run test:e2e
```

See `tests/e2e/oauth-callback.test.ts` for the full test suite.

