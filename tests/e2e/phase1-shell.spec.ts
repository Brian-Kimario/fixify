import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 1: role shells. Uses the seeded test accounts; the shared password comes from
 * the environment so it never lives in the repo. Without it these skip.
 */
const PASSWORD = process.env.E2E_TEST_PASSWORD;
test.skip(!PASSWORD, 'Set E2E_TEST_PASSWORD to run the role shell tests');

const CUSTOMER = 'customer.a@fixify.dev';
const PROFESSIONAL = 'pro.a@fixify.dev';
/** Optional: an unverified professional account. None is seeded today. */
const UNVERIFIED_PRO = process.env.E2E_UNVERIFIED_PRO_EMAIL;

async function signIn(page: Page, door: 'customer' | 'professional', email: string, home: string) {
  await page.goto(`/auth/login?as=${door}&logged_out=1`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(PASSWORD ?? '');
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(`**${home}`);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectRoutes(page: Page, nav: string, routes: [RegExp, string][]) {
  const bar = page.getByRole('navigation', { name: nav });
  for (const [name, path] of routes) {
    await bar.getByRole('link', { name }).click();
    await page.waitForURL((url) => url.pathname === path);
    await expect(bar.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
  }
}

test.describe('customer shell', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'customer', CUSTOMER, '/customer');
  });

  test('desktop nav items render and route', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expectRoutes(page, 'Customer navigation', [
      [/^Bookings/, '/customer/bookings'],
      [/^Properties/, '/customer/properties'],
      [/^Home/, '/customer'],
    ]);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Book a service' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Notifications/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible();
  });

  test('mobile bottom bar at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/customer');
    const bar = page.getByRole('navigation', { name: 'Customer navigation' });
    for (const name of [/^Home/, /Bookings/, /^Book$/, /^Properties/, /Messages/, /^Account/]) {
      await expect(bar.getByRole('link', { name })).toBeVisible();
    }
    // The tab bar has its own Book button, so the top-bar one is hidden.
    await expect(page.getByRole('banner').getByRole('link', { name: 'Book a service' })).toBeHidden();
    await expectNoHorizontalScroll(page);
  });

  test('bookings tabs switch with the URL', async ({ page }) => {
    await page.goto('/customer/bookings?tab=past');
    const tabs = page.getByRole('navigation', { name: 'Booking status' });
    await expect(tabs.getByRole('link', { name: /^Past/ })).toHaveAttribute('aria-current', 'page');
    await tabs.getByRole('link', { name: /^Upcoming/ }).click();
    await page.waitForURL(/tab=upcoming/);
    await expect(tabs.getByRole('link', { name: /^Upcoming/ })).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('professional shell', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'professional', PROFESSIONAL, '/professional');
  });

  test('desktop nav items render and route', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expectRoutes(page, 'Professional navigation', [
      [/^Requests/, '/professional/requests'],
      [/^Jobs/, '/professional/jobs'],
      [/^Earnings/, '/professional/earnings'],
      [/^Today/, '/professional'],
    ]);
    await expect(page.getByRole('heading', { name: 'Requests', exact: true })).toBeVisible();
  });

  test('mobile bottom bar at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/professional');
    const bar = page.getByRole('navigation', { name: 'Professional navigation' });
    for (const name of [/^Today/, /^Requests/, /^Jobs/, /Messages/, /^Earnings/, /^Account/]) {
      await expect(bar.getByRole('link', { name })).toBeVisible();
    }
    await expectNoHorizontalScroll(page);
  });

  test('availability switch is always in the top bar and toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const path of ['/professional', '/professional/jobs', '/professional/earnings']) {
      await page.goto(path);
      await expect(page.getByRole('banner').getByRole('switch')).toBeVisible();
    }

    const toggle = page.getByRole('banner').getByRole('switch');
    const before = await toggle.getAttribute('aria-checked');
    const after = before === 'true' ? 'false' : 'true';

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', after);
    await page.reload();
    await expect(page.getByRole('banner').getByRole('switch')).toHaveAttribute('aria-checked', after);

    // Put the account back how we found it.
    await page.getByRole('banner').getByRole('switch').click();
    await expect(page.getByRole('banner').getByRole('switch')).toHaveAttribute('aria-checked', before ?? 'false');
  });
});

test.describe('unverified professional', () => {
  test.skip(!UNVERIFIED_PRO, 'Set E2E_UNVERIFIED_PRO_EMAIL to an unverified professional account');

  test('sees the verification banner and locked requests', async ({ page }) => {
    await signIn(page, 'professional', UNVERIFIED_PRO ?? '', '/professional');
    await expect(page.getByRole('status').filter({ hasText: /verif|suspended/i }).first()).toBeVisible();
    await page.goto('/professional/requests');
    await expect(page.getByText('Requests are locked')).toBeVisible();
    // An offline unverified pro cannot switch on; an online one may still switch off.
    const toggle = page.getByRole('banner').getByRole('switch');
    if ((await toggle.getAttribute('aria-checked')) === 'false') await expect(toggle).toBeDisabled();
  });
});
