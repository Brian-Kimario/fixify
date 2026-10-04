const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to test-login page and click "Test Customer Login"
    console.log('Navigating to test-login...');
    await page.goto('http://localhost:3000/auth/test-login', { waitUntil: 'networkidle' });
    
    // Click the first button (Test Customer Login)
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);
    if (buttons.length > 0) {
      console.log('Clicking first button (Test Customer Login)...');
      await buttons[0].click();
      // Wait for redirect to customer page
      try {
        await page.waitForURL('**/customer**', { timeout: 5000 });
        console.log('Redirected to customer page');
      } catch (e) {
        console.log('Timeout waiting for redirect, continuing anyway...');
      }
    }

    // Wait a bit for page to fully load
    await page.waitForTimeout(1500);

    // Get current URL for debugging
    console.log('Current URL:', page.url());

    // Desktop screenshot (1440x900)
    console.log('Taking desktop screenshot (AFTER)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: '/Users/brian_kimario/Downloads/fixify/docs/screenshots/customer-desktop-after.png', fullPage: true });
    console.log('✓ Desktop screenshot (AFTER) saved');

    // Mobile screenshot (390x844)
    console.log('Taking mobile screenshot (AFTER)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: '/Users/brian_kimario/Downloads/fixify/docs/screenshots/customer-mobile-after.png', fullPage: true });
    console.log('✓ Mobile screenshot (AFTER) saved');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
