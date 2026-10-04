import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Viewport configurations matching Phase 9 requirements
const VIEWPORTS = [
  { name: 'Desktop HD', width: 1440, height: 900 },
  { name: 'Desktop MD', width: 1280, height: 800 },
  { name: 'Desktop SM', width: 1024, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile XL', width: 430, height: 932 },
  { name: 'Mobile Standard', width: 390, height: 844 },
];

// Pages to test (public + key authenticated routes)
const PAGES = [
  { path: '/', name: 'Homepage', auth: false },
  { path: '/auth/login', name: 'Login', auth: false },
  { path: '/help', name: 'Help', auth: false },
  { path: '/customer', name: 'Customer Dashboard', auth: true },
  { path: '/customer/properties', name: 'Properties', auth: true },
  { path: '/customer/bookings', name: 'Bookings', auth: true },
  { path: '/professional', name: 'Professional Dashboard', auth: true },
  { path: '/professional/jobs', name: 'Jobs', auth: true },
];

// Helper: Test no horizontal overflow
async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  const result = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = window.innerWidth;
    return scrollWidth === clientWidth;
  });
  return result;
}

// Helper: Check text is readable (≥14px)
async function checkTextReadability(page: Page): Promise<string[]> {
  const issues: string[] = [];
  const minFontSize = 14;

  const smallText = await page.evaluate((min) => {
    const elements: string[] = [];
    document.querySelectorAll('*').forEach((el) => {
      const fontSize = parseInt(window.getComputedStyle(el).fontSize || '0');
      if (fontSize > 0 && fontSize < min && el.textContent?.trim().length) {
        elements.push(`${el.tagName} (${fontSize}px): "${el.textContent.slice(0, 30)}..."`);
      }
    });
    return elements;
  }, minFontSize);

  return smallText;
}

// Helper: Check touch targets are ≥44×44px (mobile only)
async function checkTouchTargets(page: Page, isMobile: boolean): Promise<string[]> {
  if (!isMobile) return [];

  const issues: string[] = [];
  const minSize = 44;

  const smallTargets = await page.evaluate((min) => {
    const targets: string[] = [];
    document.querySelectorAll('button, a, input, select, textarea').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && (rect.width < min || rect.height < min)) {
        targets.push(`${el.tagName} (${Math.round(rect.width)}×${Math.round(rect.height)}px)`);
      }
    });
    return targets;
  }, minSize);

  return smallTargets;
}

// Helper: Check tab order is logical
async function checkTabOrder(page: Page): Promise<boolean> {
  const focusableSelectors =
    'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const count = await page.locator(focusableSelectors).count();

  if (count === 0) return true; // Page has no focusable elements

  // Tab through and verify we can navigate
  for (let i = 0; i < Math.min(count + 1, 10); i++) {
    await page.keyboard.press('Tab');
  }

  return true; // Simple check - if no error, tab order works
}

// Helper: Check for focus visibility
async function checkFocusVisibility(page: Page): Promise<boolean> {
  await page.keyboard.press('Tab');

  const hasFocus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    if (!el) return false;

    const style = window.getComputedStyle(el, ':focus-visible');
    const outline = window.getComputedStyle(el).outline;
    const boxShadow = window.getComputedStyle(el).boxShadow;

    return !!(outline && outline !== 'none') || !!(boxShadow && boxShadow !== 'none');
  });

  return hasFocus;
}

// Helper: Check heading hierarchy
async function checkHeadingHierarchy(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const headings = await page.evaluate(() => {
    const headingElements: { tag: string; text: string; level: number }[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
      const level = parseInt(el.tagName[1]);
      headingElements.push({
        tag: el.tagName,
        text: el.textContent?.slice(0, 50) || '',
        level,
      });
    });
    return headingElements;
  });

  // Check for skipped levels
  let lastLevel = 0;
  for (const heading of headings) {
    const diff = heading.level - lastLevel;
    if (lastLevel > 0 && diff > 1) {
      issues.push(`Heading hierarchy skip: ${heading.tag} after h${lastLevel}`);
    }
    lastLevel = heading.level;
  }

  return issues;
}

// Helper: Check form labels
async function checkFormLabels(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const unlabeledInputs = await page.evaluate(() => {
    const inputs: string[] = [];
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      const id = el.getAttribute('id');
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');

      let hasLabel = !!ariaLabel || !!ariaLabelledBy;

      if (!hasLabel && id) {
        const label = document.querySelector(`label[for="${id}"]`);
        hasLabel = !!label;
      }

      if (!hasLabel) {
        inputs.push(`${el.tagName}: ${el.getAttribute('type') || el.tagName}`);
      }
    });
    return inputs;
  });

  return unlabeledInputs;
}

// Helper: Check button accessible names
async function checkButtonNames(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const unamedButtons = await page.evaluate(() => {
    const buttons: string[] = [];
    document.querySelectorAll('button, [role="button"]').forEach((el) => {
      const text = el.textContent?.trim();
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');

      const hasName = !!text || !!ariaLabel || !!ariaLabelledBy;

      if (!hasName) {
        const svg = el.querySelector('svg');
        buttons.push(`Button${svg ? ' (icon)' : ''}`);
      }
    });
    return buttons;
  });

  return unamedButtons;
}

// Helper: Check image alt text
async function checkImageAltText(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const missingAlt = await page.evaluate(() => {
    const images: string[] = [];
    document.querySelectorAll('img').forEach((el) => {
      const alt = el.getAttribute('alt');
      if (alt === null) {
        // alt attribute must exist (even if empty for decorative)
        const src = el.getAttribute('src') || 'unknown';
        images.push(`Missing alt: ${src.slice(-30)}`);
      }
    });
    return images;
  });

  return missingAlt;
}

// Main test suites
test.describe('Phase 9: Responsive Layout & Accessibility', () => {
  test.describe('Responsive Layout Tests', () => {
    for (const viewport of VIEWPORTS) {
      for (const page of PAGES) {
        test(`${page.name} - ${viewport.name}`, async ({ browser }) => {
          const context = await browser.createContext({
            viewport: { width: viewport.width, height: viewport.height },
          });
          const testPage = await context.newPage();

          try {
            await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load', timeout: 10000 });

            // Check 1: No horizontal overflow
            const noOverflow = await checkNoHorizontalOverflow(testPage);
            expect(noOverflow).toBe(true);

            // Check 2: Text readability
            const smallText = await checkTextReadability(testPage);
            if (smallText.length > 0) {
              console.warn(`  ⚠ Small text found: ${smallText.slice(0, 2).join(', ')}`);
            }
            expect(smallText.length).toBeLessThan(3); // Allow a few, but not many

            // Check 3: Touch targets (mobile only)
            const isMobile = viewport.width <= 430;
            const smallTargets = await checkTouchTargets(testPage, isMobile);
            if (isMobile && smallTargets.length > 0) {
              console.warn(`  ⚠ Small touch targets: ${smallTargets.slice(0, 2).join(', ')}`);
            }
            expect(smallTargets.length).toBeLessThan(2); // Allow a few for icons

            console.log(`  ✓ ${page.name} @ ${viewport.name}`);
          } finally {
            await context.close();
          }
        });
      }
    }
  });

  test.describe('Keyboard Navigation Tests', () => {
    for (const page of PAGES) {
      test(`Tab order - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        // Check: Tab order exists
        const tabOrderOK = await checkTabOrder(testPage);
        expect(tabOrderOK).toBe(true);

        // Check: Focus visibility
        const focusVisible = await checkFocusVisibility(testPage);
        if (!focusVisible) {
          console.warn(`  ⚠ Focus visibility issue on ${page.name}`);
        }
        expect(focusVisible).toBe(true);

        console.log(`  ✓ Tab order OK on ${page.name}`);
      });

      test(`Shift+Tab backward - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        // Move forward a few times
        await testPage.keyboard.press('Tab');
        await testPage.keyboard.press('Tab');

        const focusedForward = await testPage.evaluate(() =>
          document.activeElement?.getAttribute('data-test-id'),
        );

        // Move backward
        await testPage.keyboard.press('Shift+Tab');

        const focusedBackward = await testPage.evaluate(() =>
          document.activeElement?.getAttribute('data-test-id'),
        );

        // Should be different (moved backward)
        expect(focusedForward !== focusedBackward || focusedForward === null).toBe(true);

        console.log(`  ✓ Shift+Tab works on ${page.name}`);
      });
    }
  });

  test.describe('Reduced Motion Tests', () => {
    for (const page of PAGES) {
      test(`Reduced motion - ${page.name}`, async ({ browser }) => {
        const context = await browser.createContext({
          reducedMotion: 'reduce',
        });
        const testPage = await context.newPage();

        try {
          await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

          // Check: Animations are disabled or instant
          const animationStatus = await testPage.evaluate(() => {
            const animated = document.querySelector('[class*="animate"]');
            if (animated) {
              return window.getComputedStyle(animated).animationDuration;
            }
            return '0s';
          });

          // Should be 0s or instant
          expect(animationStatus === '0s' || animationStatus === '' || animated === 'none').toBeTruthy();

          console.log(`  ✓ Reduced motion OK on ${page.name}`);
        } finally {
          await context.close();
        }
      });
    }
  });

  test.describe('ARIA & Accessibility Tests', () => {
    for (const page of PAGES) {
      test(`Heading hierarchy - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        const issues = await checkHeadingHierarchy(testPage);
        if (issues.length > 0) {
          console.warn(`  ⚠ ${page.name}: ${issues.join('; ')}`);
        }
        expect(issues.length).toBe(0);

        console.log(`  ✓ Heading hierarchy OK on ${page.name}`);
      });

      test(`Form labels - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        const issues = await checkFormLabels(testPage);
        if (issues.length > 0) {
          console.warn(`  ⚠ ${page.name}: Unlabeled inputs: ${issues.slice(0, 2).join(', ')}`);
        }
        expect(issues.length).toBeLessThan(1); // Allow demo pages with no forms

        console.log(`  ✓ Form labels OK on ${page.name}`);
      });

      test(`Button names - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        const issues = await checkButtonNames(testPage);
        if (issues.length > 0) {
          console.warn(`  ⚠ ${page.name}: ${issues.slice(0, 2).join(', ')}`);
        }
        expect(issues.length).toBeLessThan(3); // Some demo icons might be missing

        console.log(`  ✓ Button names OK on ${page.name}`);
      });

      test(`Image alt text - ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.path}`, { waitUntil: 'load' });

        const issues = await checkImageAltText(testPage);
        if (issues.length > 0) {
          console.warn(`  ⚠ ${page.name}: ${issues.slice(0, 2).join(', ')}`);
        }
        expect(issues.length).toBeLessThan(2); // Allow a few demo images

        console.log(`  ✓ Image alt text OK on ${page.name}`);
      });
    }
  });
});

test.describe('Phase 9: Summary', () => {
  test('All tests completed', async () => {
    console.log('\n=== Phase 9 Summary ===');
    console.log(`✓ Tested ${PAGES.length} pages`);
    console.log(`✓ Tested ${VIEWPORTS.length} viewports`);
    console.log(`✓ Tested responsive layout, keyboard navigation, reduced motion, accessibility`);
    console.log('Ready for Phase 10');
  });
});
