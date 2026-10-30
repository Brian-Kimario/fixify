import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 3b: proof-of-work photos and the arrival estimate, from both sides of one seeded job
 * (in progress, pro.b, customer.a, one "Before" photo attached). Read-only on purpose: attached
 * files are evidence and cannot be deleted, so these runs do not add any. The shared password
 * comes from the environment; without it these skip (or fail when E2E_REQUIRED=1).
 */
const PASSWORD = process.env.E2E_TEST_PASSWORD;
test.skip(!PASSWORD, 'Set E2E_TEST_PASSWORD to run the phase 3b tests');

const JOB_ID = '3049783d-dc71-4297-85c3-5c7fc3801cbb';
const BOOKING_ID = 'b3e84727-b89b-4716-b14c-87904930afa9';

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

test.describe('professional job page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'professional', 'pro.b@fixify.dev', '/professional');
    await page.goto(`/professional/jobs/${JOB_ID}`);
  });

  test('shows attached photos and the uploader on site', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Photos and receipts' })).toBeVisible();
    await expect(page.getByText('The customer can see everything you add here.')).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'What does it show?' })).toBeVisible();
    await expect(page.getByRole('img', { name: /photo$/ }).first()).toBeVisible();
  });

  test('refuses an unsupported file before uploading', async ({ page }) => {
    await page.getByLabel('Photo or PDF, up to 10 MB').setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a photo'),
    });
    // Next's route announcer is also role=alert, so match the message itself.
    await expect(page.getByRole('alert').filter({ hasText: 'Use a JPG' })).toHaveText('Use a JPG, PNG or WebP photo, or a PDF.');
  });

  test('no arrival form once on site', async ({ page }) => {
    await expect(page.getByText('Share when you expect to arrive')).toHaveCount(0);
    await expect(page.getByText('Running late?')).toHaveCount(0);
  });

  test('fits at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Photos and receipts' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});

test.describe('customer booking page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, 'customer', 'customer.a@fixify.dev', '/customer');
    await page.goto(`/customer/bookings/${BOOKING_ID}`);
  });

  test('shows the professional\'s photos without an uploader', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Photos and receipts' })).toBeVisible();
    await expect(page.getByRole('img', { name: /photo$/ }).first()).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'What does it show?' })).toHaveCount(0);
  });

  test('records the photo on the timeline', async ({ page }) => {
    await expect(page.getByText(/^Professional added /).first()).toBeVisible();
  });

  test('fits at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Photos and receipts' })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
