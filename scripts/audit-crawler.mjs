#!/usr/bin/env node
/**
 * Fixify Automated Full-System Audit Crawler
 * Captures visual screenshots, clean DOM structures, console errors,
 * and network failures across all Fixify routes for ChatGPT/Codex audit.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_URL = process.env.TARGET_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.resolve(process.cwd(), 'audit-results');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const DOM_DIR = path.join(OUTPUT_DIR, 'dom');

// Ensure directories exist
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(DOM_DIR, { recursive: true });

const PUBLIC_ROUTES = [
  { name: '01_homepage', path: '/' },
  { name: '02_help_center', path: '/help' },
  { name: '03_support_intake', path: '/support' },
  { name: '04_auth_login', path: '/auth/login' },
  { name: '05_auth_register_customer', path: '/auth/register' },
  { name: '06_auth_register_pro', path: '/auth/register/professional' },
  { name: '07_auth_forgot_password', path: '/auth/forgot-password' },
];

const CUSTOMER_ROUTES = [
  { name: '10_customer_dashboard', path: '/customer' },
  { name: '11_customer_properties', path: '/customer/properties' },
  { name: '12_customer_support', path: '/customer/support' },
  { name: '13_customer_settings', path: '/customer/settings' },
];

const PRO_ROUTES = [
  { name: '20_pro_today_workspace', path: '/professional' },
  { name: '21_pro_jobs_queue', path: '/professional/jobs' },
  { name: '22_pro_bids', path: '/professional/bids' },
  { name: '23_pro_earnings', path: '/professional/earnings' },
  { name: '24_pro_profile', path: '/professional/profile' },
  { name: '25_pro_onboarding', path: '/professional/onboarding' },
];

const ADMIN_ROUTES = [
  { name: '30_admin_operations', path: '/admin' },
  { name: '31_admin_jobs_review', path: '/admin/jobs' },
  { name: '32_admin_professionals', path: '/admin/professionals' },
  { name: '33_admin_customers', path: '/admin/customers' },
];

function cleanDom(html) {
  // Strip huge inline scripts, styles, base64 images to keep payload concise for LLM
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/data:image\/[^;]+;base64,[^"'\s]+/gi, '[BASE64_IMAGE_OMITTED]')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, (match) => {
      const aria = match.match(/aria-label="([^"]+)"/)?.[1] || 'icon';
      return `<svg aria-label="${aria}">[SVG_ICON]</svg>`;
    });
}

async function runAudit() {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Fixify Full-System Audit Crawler`);
  console.log(`🌐 Target: ${TARGET_URL}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    headless: true, // Fully automated headless execution
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // Retina resolution
  });

  const page = await context.newPage();
  const manifest = {
    targetUrl: TARGET_URL,
    timestamp: new Date().toISOString(),
    routesAudited: [],
    errorsCaptured: [],
  };

  // Listen for console and network errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const err = `[Console Error] ${msg.text()}`;
      manifest.errorsCaptured.push({ url: page.url(), error: err });
    }
  });

  page.on('pageerror', (err) => {
    manifest.errorsCaptured.push({ url: page.url(), error: `[Page Error] ${err.message}` });
  });

  page.on('response', (res) => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      manifest.errorsCaptured.push({
        url: page.url(),
        error: `[HTTP ${res.status()}] ${res.url()}`,
      });
    }
  });

  async function auditRoute(item) {
    const fullUrl = `${TARGET_URL}${item.path}`;
    console.log(`🔍 Auditing [${item.name}] -> ${item.path}`);
    try {
      const res = await page.goto(fullUrl, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1000); // Allow animations & fonts to settle

      // Screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Clean DOM
      const rawHtml = await page.content();
      const domPath = path.join(DOM_DIR, `${item.name}_dom.txt`);
      fs.writeFileSync(domPath, cleanDom(rawHtml), 'utf8');

      manifest.routesAudited.push({
        name: item.name,
        path: item.path,
        actualUrl: page.url(),
        status: res?.status() || 200,
        screenshot: `${item.name}.png`,
        dom: `${item.name}_dom.txt`,
      });
    } catch (err) {
      console.warn(`⚠️ Failed to capture ${item.path}:`, err.message);
      manifest.errorsCaptured.push({ url: fullUrl, error: err.message });
    }
  }

  async function tryLogin(email, password, roleName) {
    console.log(`\n🔑 Attempting automated login as ${roleName} (${email})...`);
    try {
      await context.clearCookies();
      await page.goto(`${TARGET_URL}/auth/login`, { waitUntil: 'load', timeout: 15000 });
      await page.waitForSelector('#email', { timeout: 5000 });
      await page.fill('#email', email);
      await page.fill('#password', password);
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ timeout: 8000 }).catch(() => {}),
      ]);
      await page.waitForTimeout(1000);
      console.log(`📍 Post-login URL: ${page.url()}`);
    } catch (e) {
      console.log(`⚠️ Note on login for ${roleName}: ${e.message}`);
    }
  }

  // 1. Audit Public Pages
  console.log(`\n--- Step 1: Auditing Public & Auth Pages ---`);
  for (const r of PUBLIC_ROUTES) {
    await auditRoute(r);
  }

  // 2. Audit Customer Portal
  console.log(`\n--- Step 2: Customer Authenticated Routes ---`);
  await tryLogin('customer.a@fixify.dev', 'Test@123456', 'Customer');
  for (const r of CUSTOMER_ROUTES) {
    await auditRoute(r);
  }

  // 3. Audit Professional Portal
  console.log(`\n--- Step 3: Professional Authenticated Routes ---`);
  await tryLogin('pro.a@fixify.dev', 'Test@123456', 'Professional');
  for (const r of PRO_ROUTES) {
    await auditRoute(r);
  }

  // 4. Audit Admin Operations
  console.log(`\n--- Step 4: Admin Console Routes ---`);
  await tryLogin('admin.test@fixify.dev', 'Test@123456', 'Admin');
  for (const r of ADMIN_ROUTES) {
    await auditRoute(r);
  }

  // Save Manifest
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'AUDIT_MANIFEST.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  // Generate a consolidated single text summary for ChatGPT
  let promptContext = `# FIXIFY DEPLOYMENT AUDIT DATA DUMP\n\n`;
  promptContext += `- **Target URL:** ${TARGET_URL}\n`;
  promptContext += `- **Audit Date:** ${manifest.timestamp}\n`;
  promptContext += `- **Routes Captured:** ${manifest.routesAudited.length}\n`;
  promptContext += `- **Detected Runtime/Network Errors:** ${manifest.errorsCaptured.length}\n\n`;

  if (manifest.errorsCaptured.length > 0) {
    promptContext += `## ⚠️ Runtime & Network Errors Detected During Crawl\n\`\`\`json\n${JSON.stringify(manifest.errorsCaptured, null, 2)}\n\`\`\`\n\n`;
  }

  promptContext += `## Captured Route DOM Structures\n\n`;
  for (const item of manifest.routesAudited) {
    const domFile = path.join(DOM_DIR, item.dom);
    if (fs.existsSync(domFile)) {
      const snippet = fs.readFileSync(domFile, 'utf8').slice(0, 3000); // 3kb snippet per route
      promptContext += `### Route: \`${item.path}\` (${item.name}) - Status: ${item.status}\n\`\`\`html\n${snippet}\n...\n\`\`\`\n\n`;
    }
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'CHATGPT_AUDIT_INPUT.md'), promptContext, 'utf8');

  console.log(`\n======================================================`);
  console.log(`✅ Audit capture complete!`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log(`📄 Clean DOMs saved to: ${DOM_DIR}`);
  console.log(`📋 ChatGPT Consolidated Payload: ${path.join(OUTPUT_DIR, 'CHATGPT_AUDIT_INPUT.md')}`);
  console.log(`======================================================\n`);

  await browser.close();
}

runAudit().catch(console.error);
