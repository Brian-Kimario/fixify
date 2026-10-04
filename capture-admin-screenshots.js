const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const screenshotsDir = '/Users/brian_kimario/Downloads/fixify/docs/screenshots';

async function captureScreenshots() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Ensure screenshots directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    console.log('Step 1: Navigate to test-login page...');
    await page.goto('http://localhost:3000/auth/test-login', { waitUntil: 'load', timeout: 30000 });

    console.log('Step 2: Click "Test Admin Login" button...');
    await page.click('button:has-text("Test Admin Login")');
    await page.waitForTimeout(2000);

    console.log('Step 3: Navigate to /admin...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'load', timeout: 30000 });

    // Verify we're on the admin page
    const url = page.url();
    console.log('Current URL:', url);

    if (!url.includes('/admin') || url.includes('/auth/login')) {
      console.log('⚠️  Still on login page. Admin user may not be set up.');
    }

    // Desktop: 1440×900
    console.log('\nStep 4: Capture desktop screenshot (1440×900)...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);
    const desktopPath = path.join(screenshotsDir, 'admin-desktop-before.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`✓ Desktop screenshot saved: ${desktopPath}`);

    // Mobile: 390×844
    console.log('\nStep 5: Capture mobile screenshot (390×844)...');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobilePath = path.join(screenshotsDir, 'admin-mobile-before.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`✓ Mobile screenshot saved: ${mobilePath}`);

    console.log('\n✓ All screenshots captured successfully');

  } catch (error) {
    console.error('Error during screenshot capture:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
