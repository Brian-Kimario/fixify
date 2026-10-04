# OAuth Vercel Deployment Test Guide

## Overview
This guide provides step-by-step instructions to test the OAuth flow on your Vercel deployment after disabling Deployment Protection.

## Prerequisites

- [ ] Vercel Deployment Protection is **disabled** ✓ (already done)
- [ ] Supabase project is configured with Google OAuth provider
- [ ] Local environment has `.env.local` with correct Supabase credentials
- [ ] Node.js 18+ is installed

## Verification Status

✓ **OAuth Configuration**: 5/5 checks passed
- `.env.local` configured
- Supabase credentials valid
- Profiles table exists with role column
- App URL matches Vercel deployment
- All auth files in place

## Test Scenarios

### Scenario 1: Manual Test on Local Dev

**Prerequisites:**
- Local dev server running

**Steps:**
1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/auth/login

3. Click "Continue with Google"

4. Sign in with your Google account

5. Grant permission to Fixify (if prompted)

**Expected Result:**
- ✓ No "You Need Access" page
- ✓ Redirected directly to `/customer` dashboard
- ✓ User profile auto-created in Supabase (check profiles table)
- ✓ Page shows customer dashboard (bookings/services)

**If it fails:**
- Check browser console (F12) for error messages
- Check Network tab to see if callback completes or gets blocked
- Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` is correct

---

### Scenario 2: Manual Test on Vercel Production

**Prerequisites:**
- Vercel deployment is accessible
- Google Account for testing

**Steps:**
1. Visit https://fixify-brian-kimarios-projects.vercel.app/auth/login

2. Click "Continue with Google"

3. Sign in with your Google account

4. Grant permission to Fixify

**Expected Result:**
- ✓ No "You Need Access" page from Vercel
- ✓ Redirected to `/customer` dashboard
- ✓ No redirect loops or repeated login prompts
- ✓ Refresh page → still on dashboard (session persisted)

**If it fails:**
- Deployment Protection may still be enabled → check Vercel Dashboard
- Callback URL may not be configured in Supabase → see Supabase Config section
- Check Vercel deployment logs for errors

---

### Scenario 3: Automated Test (New User Profile Creation)

**Prerequisites:**
- Local dev server running

**Steps:**
1. Run the e2e test suite:
   ```bash
   npm run test:oauth:local
   ```

2. Watch for test output

**Expected Result:**
- ✓ Tests for error cases pass (invalid code, missing code)
- ✓ No Vercel access gate shown in any test
- ✓ Auth routes are accessible
- ✓ Test report generated in `playwright-report/`

**View detailed test report:**
```bash
npx playwright show-report
```

---

### Scenario 4: Test Against Vercel Deployment

**Prerequisites:**
- Vercel deployment is accessible
- Node.js environment set up

**Steps:**
1. Run the production test:
   ```bash
   PLAYWRIGHT_TEST_BASE_URL=https://fixify-brian-kimarios-projects.vercel.app npm run test:oauth:prod
   ```

2. Wait for test completion

**Expected Result:**
- ✓ All tests pass against Vercel URL
- ✓ No 401/403 errors
- ✓ No Vercel access gate
- ✓ OAuth callback route is accessible

---

## Supabase OAuth Configuration Checklist

Before testing, verify these settings in your Supabase project:

### 1. Google Provider Configuration
- [ ] Go to: https://supabase.co/dashboard
- [ ] Select your project: `azmajqztvcuwajaaldqm`
- [ ] Navigate to: **Authentication** → **Providers** → **Google**
- [ ] Confirm Google provider is **Enabled**

### 2. Redirect URLs
- [ ] In Google provider settings, find "Redirect URLs" section
- [ ] Verify it includes:
  - `https://fixify-brian-kimarios-projects.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
- [ ] (Supabase auto-adds these from your app configuration)

### 3. Credentials
- [ ] Google Client ID is set (check Supabase Dashboard)
- [ ] Google Client Secret is set (not visible, but configured)

### 4. Test
- [ ] Create a test profile with `role='customer'` in Supabase (optional)
- [ ] Or test OAuth will auto-create the profile (should work with fix)

---

## Debugging Guide

### Issue: "You Need Access" Page on Vercel

**Cause:** Deployment Protection is still enabled

**Solution:**
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Deployment Protection
4. Toggle **OFF** or switch to Password Protection
5. Wait 2-3 minutes for deployment to update
6. Retry the flow

---

### Issue: Redirect Loop / Repeated Login Prompts

**Cause:** OAuth callback not completing or session not being set

**Solution:**
1. Check browser console (F12):
   - Look for Supabase errors
   - Check for CORS issues
   - Verify no JavaScript errors

2. Check Network tab:
   - Filter to XHR requests
   - Look for `/auth/callback` request
   - Check response status (should be 307 redirect)
   - Verify session cookies are set (Application tab → Cookies)

3. Verify environment:
   - Check `.env.local` has correct URLs
   - Confirm `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify `NEXT_PUBLIC_APP_URL` matches your deployment domain

---

### Issue: Profile Not Created / "missing_profile" Error

**Cause:** Auto-upsert logic not implemented or profile insert failing

**Solution:**
1. Check that the callback route has the upsert code (should be implemented by workflow)
2. In Supabase Dashboard:
   - Go to SQL Editor
   - Run: `SELECT * FROM profiles WHERE id = '<user_id>';`
   - Profile should exist after OAuth completes

3. Check Supabase logs for errors:
   - Go to Logs → Query Performance
   - Look for failed upsert operations

---

### Issue: "Continue with Google" Button Not Working

**Cause:** JavaScript error or misconfigured OAuth

**Solution:**
1. Check browser console for errors
2. Verify Google OAuth provider is enabled in Supabase
3. Check that `signInWithGoogle` is being called (should send to Google)
4. If nothing happens, check network requests in DevTools

---

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://azmajqztvcuwajaaldqm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public auth key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side auth key | `eyJhbGc...` |
| `NEXT_PUBLIC_APP_URL` | App deployment URL | `https://fixify.vercel.app` OR `https://fixify-brian-kimarios-projects.vercel.app` |

**Note:** For Vercel deployment, `NEXT_PUBLIC_APP_URL` should match the actual deployed domain to ensure OAuth callback URL is constructed correctly.

---

## Success Indicators

When OAuth is working correctly, you should see:

1. **On Login Page:**
   - "Continue with Google" button is clickable
   - No console errors

2. **During OAuth:**
   - Redirected to Google login (or shown Google auth prompt if already logged in)
   - User grants permission to Fixify
   - Redirected back to app WITHOUT "You Need Access" page

3. **After Auth:**
   - Redirected to `/customer` dashboard
   - Page shows customer-specific content
   - Refresh page → stays on dashboard (session valid)

4. **In Browser DevTools (Application tab):**
   - Cookies include `sb-*` session cookies
   - Session cookie value is not empty

5. **In Supabase Dashboard:**
   - New user appears in `auth.users` table
   - New user row appears in `profiles` table with `role='customer'`
   - Profile was created automatically (not manually added)

---

## Rollback Procedure

If something breaks and you need to revert:

1. **If callback route was modified:**
   ```bash
   git checkout src/app/auth/callback/route.ts
   ```

2. **If migrations were applied:**
   - Go to Supabase Dashboard
   - Check migrations table
   - (Rollback must be done via Supabase CLI or Dashboard)

3. **If tests were added:**
   ```bash
   rm -rf e2e/ playwright.config.ts
   ```

---

## Performance Expectations

- **OAuth callback:** 2-3 seconds
- **Profile auto-upsert:** <100ms
- **Total flow:** 3-5 seconds (including network latency)

If significantly slower, check:
- Supabase project performance
- Network latency to Google servers
- Browser console for slow operations

---

## Next Steps After Successful Testing

1. ✓ Test OAuth locally (manual)
2. ✓ Test OAuth on Vercel (manual)
3. ✓ Run e2e test suite
4. ✓ Verify profile auto-creation in Supabase
5. Deploy to production (if tests pass)
6. Monitor error logs for any OAuth failures

---

## Support & Troubleshooting

For issues, check:
1. Supabase logs: https://supabase.co/dashboard → Logs
2. Vercel deployment logs: https://vercel.com/dashboard
3. Browser DevTools (F12): Console and Network tabs
4. GitHub issues or Supabase documentation

---

## Test Results Log

| Test | Environment | Date | Status | Notes |
|------|-------------|------|--------|-------|
| Manual OAuth | Local | - | - | Pending |
| Manual OAuth | Vercel | - | - | Pending |
| E2E Test Suite | Local | - | - | Pending |
| E2E Test Suite | Vercel | - | - | Pending |

Keep this table updated as you run tests.
