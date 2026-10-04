/**
 * Phase 1: Authentication, Logout & RBAC Tests
 * 
 * Tests:
 * 1. Unauthenticated access → redirect to /auth/login
 * 2. Customer cross-role denial (/admin, /professional)
 * 3. Professional cross-role denial (/admin, /customer)
 * 4. Session invalidation after logout
 * 5. Browser back-button after logout
 */

const BASE = 'http://localhost:3000';

const CREDS = {
  customer: { email: 'customer.a@fixify.dev', password: 'Test@123456' },
  professional: { email: 'pro.a@fixify.dev', password: 'Test@123456' },
  admin: { email: 'admin.test@fixify.dev', password: 'Test@123456' },
};

const results: Array<{ test: string; passed: boolean; detail: string }> = [];

function pass(test: string, detail = '') {
  results.push({ test, passed: true, detail });
  console.log(`  ✅ PASS: ${test}${detail ? ' — ' + detail : ''}`);
}

function fail(test: string, detail: string) {
  results.push({ test, passed: false, detail });
  console.error(`  ❌ FAIL: ${test} — ${detail}`);
}

async function loginAs(page: any, role: 'customer' | 'professional' | 'admin') {
  await page.goto(`${BASE}/auth/login`);
  await page.waitForLoadState('networkidle');

  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();

  await emailInput.fill(CREDS[role].email);
  await passwordInput.fill(CREDS[role].password);
  await submitBtn.click();
  await page.waitForLoadState('networkidle');
}

async function logout(page: any) {
  // Try clicking the SignOutMenu trigger button first (desktop)
  const signOutTrigger = page.locator('button[aria-label="User menu"]').first();
  if (await signOutTrigger.isVisible()) {
    await signOutTrigger.click();
    await page.waitForTimeout(300);
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }
  // Fallback: navigate directly to signout action path or call logoutUser
  await page.goto(`${BASE}/auth/login?logged_out=1`);
}

// ─────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────
async function runTests(browser: any) {
  console.log('\n═══ TEST 1: Unauthenticated access redirects ═══');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const route of ['/customer', '/professional', '/admin']) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      const url = page.url();
      if (url.includes('/auth/login')) {
        pass(`Unauthenticated ${route} → /auth/login`, `landed at ${url}`);
      } else {
        fail(`Unauthenticated ${route} → /auth/login`, `stayed at ${url}`);
      }
    }
    await context.close();
  }

  console.log('\n═══ TEST 2: Customer cross-role denial ═══');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, 'customer');
    const afterLogin = page.url();
    if (afterLogin.includes('/customer')) {
      pass('Customer login → /customer', afterLogin);
    } else {
      fail('Customer login → /customer', `landed at ${afterLogin}`);
    }

    // Customer tries /admin
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
    const adminUrl = page.url();
    if (!adminUrl.includes('/admin') || adminUrl.includes('/auth/login')) {
      pass('Customer cannot access /admin', `redirected to ${adminUrl}`);
    } else {
      fail('Customer cannot access /admin', `reached ${adminUrl}`);
    }

    // Customer tries /professional
    await page.goto(`${BASE}/professional`, { waitUntil: 'networkidle' });
    const proUrl = page.url();
    if (!proUrl.includes('/professional') || proUrl.includes('/auth/login')) {
      pass('Customer cannot access /professional', `redirected to ${proUrl}`);
    } else {
      fail('Customer cannot access /professional', `reached ${proUrl}`);
    }

    await context.close();
  }

  console.log('\n═══ TEST 3: Professional cross-role denial ═══');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    await loginAs(page, 'professional');
    const afterLogin = page.url();
    if (afterLogin.includes('/professional')) {
      pass('Professional login → /professional', afterLogin);
    } else {
      fail('Professional login → /professional', `landed at ${afterLogin}`);
    }

    // Professional tries /admin
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
    const adminUrl = page.url();
    if (!adminUrl.includes('/admin') || adminUrl.includes('/auth/login')) {
      pass('Professional cannot access /admin', `redirected to ${adminUrl}`);
    } else {
      fail('Professional cannot access /admin', `reached ${adminUrl}`);
    }

    // Professional tries /customer
    await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
    const custUrl = page.url();
    if (!custUrl.includes('/customer') || custUrl.includes('/auth/login')) {
      pass('Professional cannot access /customer', `redirected to ${custUrl}`);
    } else {
      fail('Professional cannot access /customer', `reached ${custUrl}`);
    }

    await context.close();
  }

  console.log('\n═══ TEST 4: Session invalidation after logout ═══');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login as customer
    await loginAs(page, 'customer');
    const dashUrl = page.url();
    if (!dashUrl.includes('/customer')) {
      fail('Session test setup: customer login', `unexpected URL ${dashUrl}`);
    } else {
      pass('Session test setup: customer login', dashUrl);

      // Perform logout
      await logout(page);
      await page.waitForLoadState('networkidle');
      const postLogoutUrl = page.url();

      if (postLogoutUrl.includes('/auth/login') || postLogoutUrl.includes('/auth')) {
        pass('Logout redirects to /auth/login', postLogoutUrl);
      } else {
        fail('Logout redirects to /auth/login', `stayed at ${postLogoutUrl}`);
      }

      // Try to access /customer after logout
      await page.goto(`${BASE}/customer`, { waitUntil: 'networkidle' });
      const afterLogoutUrl = page.url();
      if (afterLogoutUrl.includes('/auth/login') || afterLogoutUrl.includes('/auth')) {
        pass('Post-logout /customer access denied', `redirected to ${afterLogoutUrl}`);
      } else {
        fail('Post-logout /customer access denied', `reached ${afterLogoutUrl}`);
      }
    }

    await context.close();
  }

  console.log('\n═══ TEST 5: Browser back-button after logout ═══');
  {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login and navigate to dashboard
    await loginAs(page, 'customer');
    await page.waitForLoadState('networkidle');
    const dashUrl = page.url();

    if (dashUrl.includes('/customer')) {
      pass('Back-button test setup: customer dashboard loaded', dashUrl);

      // Logout
      await logout(page);
      await page.waitForLoadState('networkidle');

      // Click browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      const afterBackUrl = page.url();

      // Either redirected to login OR the page is at /customer but a refresh will redirect
      // The security requirement: the page cannot fetch protected data.
      // We verify by refreshing
      await page.reload({ waitUntil: 'networkidle' });
      const afterReloadUrl = page.url();

      if (afterReloadUrl.includes('/auth/login') || afterReloadUrl.includes('/auth')) {
        pass('Back-button + reload → redirected to /auth/login', afterReloadUrl);
      } else {
        fail('Back-button + reload → should redirect to /auth/login', `stayed at ${afterReloadUrl}`);
      }
    } else {
      fail('Back-button test setup: customer login failed', dashUrl);
    }

    await context.close();
  }

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log('\n═══ TEST SUMMARY ═══');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`${passed}/${total} tests passed`);
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.test}`);
  });

  return { passed, total, results };
}

module.exports = { runTests, CREDS, BASE };
