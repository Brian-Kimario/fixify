import { test, expect, type Page } from '@playwright/test';

/**
 * Role-based sign-in against the seeded test accounts. The shared password comes
 * from the environment so it never lives in the repo; without it these skip.
 */
const PASSWORD = process.env.E2E_TEST_PASSWORD;
test.skip(!PASSWORD, 'Set E2E_TEST_PASSWORD to run role sign-in tests');

const ACCOUNTS = {
  customer: 'customer.a@fixify.dev',
  professional: 'pro.a@fixify.dev',
  admin: 'admin.test@fixify.dev',
} as const;

const HOME = { customer: '/customer', professional: '/professional', admin: '/admin' } as const;

async function signIn(page: Page, door: 'customer' | 'professional', email: string) {
  await page.goto(`/auth/login?as=${door}&logged_out=1`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(PASSWORD ?? '');
  await page.locator('form button[type="submit"]').click();
}

async function landedPath(page: Page, path: string) {
  await page.goto(path);
  return new URL(page.url()).pathname;
}

test.describe('sign-in doors', () => {
  test('professional account is rejected at the customer door', async ({ page }) => {
    await signIn(page, 'customer', ACCOUNTS.professional);
    await expect(page.getByText('This is a professional account. Use the professional sign-in instead.')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/auth/login');
    expect(await landedPath(page, '/professional')).toBe('/auth/login');
  });

  test('customer account is rejected at the professional door', async ({ page }) => {
    await signIn(page, 'professional', ACCOUNTS.customer);
    await expect(page.getByText('This is a customer account. Use the customer sign-in instead.')).toBeVisible();
    expect(await landedPath(page, '/customer')).toBe('/auth/login');
  });

  test('admin can use either door and lands on /admin', async ({ page }) => {
    await signIn(page, 'professional', ACCOUNTS.admin);
    await page.waitForURL('**/admin');
  });
});

for (const role of ['customer', 'professional'] as const) {
  test(`${role} signs in and stays inside ${HOME[role]}`, async ({ page }) => {
    await signIn(page, role, ACCOUNTS[role]);
    await page.waitForURL(`**${HOME[role]}`);
    for (const other of Object.values(HOME).filter((p) => p !== HOME[role])) {
      expect(await landedPath(page, other)).toBe(HOME[role]);
    }
  });
}

test('admin is kept out of customer and professional areas', async ({ page }) => {
  await signIn(page, 'customer', ACCOUNTS.admin);
  await page.waitForURL('**/admin');
  for (const other of ['/customer', '/professional']) {
    expect(await landedPath(page, other)).toBe('/admin');
  }
});
