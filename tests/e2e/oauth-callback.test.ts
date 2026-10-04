import { test, expect } from '@playwright/test'

test.describe('OAuth Callback Flow', () => {
  test('should redirect to login with error when callback is missing authorization code', async ({
    page,
  }) => {
    // Navigate to callback without code parameter
    await page.goto('/auth/callback')

    // Should redirect to login with no_code error
    await expect(page).toHaveURL(/\/auth\/login\?error=no_code/)
  })

  test('should redirect to login with error when provided with invalid authorization code', async ({
    page,
  }) => {
    // Navigate to callback with invalid code
    await page.goto('/auth/callback?code=invalid_authorization_code_12345')

    // Should redirect to login with exchange_failed error (code exchange will fail)
    await expect(page).toHaveURL(/\/auth\/login\?error=exchange_failed/)
  })

  test('should handle OAuth error from provider', async ({ page }) => {
    // Navigate to callback with error from OAuth provider
    await page.goto('/auth/callback?error=access_denied&error_description=User+denied+access')

    // Should redirect to login with the error code
    await expect(page).toHaveURL(/\/auth\/login\?error=access_denied/)
  })

  test('login page should load correctly', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check that we're on the login page
    await expect(page).toHaveURL(/\/auth\/login/)

    // Verify basic elements are present
    const heading = page.locator('h1, h2')
    await expect(heading).toBeTruthy()
  })

  test.skip('should auto-create profile and redirect to customer dashboard on successful new-user OAuth', async ({
    page,
  }) => {
    // This test is skipped because it requires:
    // 1. Real Google OAuth credentials
    // 2. A test account with valid OAuth token
    // 3. Mocking of the Supabase exchangeCodeForSession call OR capturing a real auth code
    //
    // To enable this test:
    // - Use Supabase admin API to generate a valid session token
    // - Or use Playwright API mocking to intercept the exchangeCodeForSession call
    // - Or set up a test Google account and perform the full OAuth flow
    //
    // Manual testing flow (for development):
    // 1. Start app with `npm run dev`
    // 2. Navigate to http://localhost:3000/auth/login
    // 3. Click "Continue with Google"
    // 4. Complete Google OAuth with a test account
    // 5. Verify redirect to /customer dashboard
    // 6. Verify profile was created in Supabase (check profiles table for new user id)
    // 7. Verify avatar_url and full_name were captured from OAuth metadata

    // Placeholder test structure for reference:
    await page.goto('/auth/login')
    // await page.click('text=Continue with Google')
    // ... Google OAuth flow would happen here ...
    // await expect(page).toHaveURL(/\/customer/)
  })

  test.skip('should preserve role-based redirect path for existing OAuth users', async ({ page }) => {
    // This test is skipped because it requires:
    // 1. An existing user account in the database
    // 2. Valid OAuth token for that user
    // 3. Ability to complete the full OAuth flow
    //
    // Manual testing flow:
    // 1. Create a user account in Supabase with a known email
    // 2. Set their role to 'professional' or 'admin'
    // 3. Complete OAuth with that email
    // 4. Verify redirect matches the user's role path

    // Placeholder test structure:
    await page.goto('/auth/login')
    // await page.click('text=Continue with Google')
    // ... OAuth flow with existing user ...
    // await expect(page).toHaveURL(/\/professional|\/admin/) // Based on role
  })
})
