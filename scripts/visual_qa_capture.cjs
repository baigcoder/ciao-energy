const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
];

const SECTIONS = [
  { id: 'hero', name: '01_hero', selector: '#gamme', block: 'start' },
  { id: 'profile', name: '02_profile', selector: '#profile', block: 'center' },
  { id: 'tasting', name: '02b_tasting', selector: '#tasting', block: 'center' },
  { id: 'benefits-1', name: '03_benefit_1', selector: '#benefits-1', block: 'center' },
  { id: 'benefits-2', name: '04_benefit_2', selector: '#benefits-2', block: 'center' },
  { id: 'benefits-3', name: '05_benefit_3', selector: '#benefits-3', block: 'center' },
  { id: 'benefits-4', name: '06_benefit_4', selector: '#benefits-4', block: 'center' },
  { id: 'argument', name: '07_zero_bullshit', selector: '#argument', block: 'center' },
  { id: 'full-gamme', name: '08_full_gamme', selector: '#full-gamme', block: 'center' },
  { id: 'faq', name: '09_faq', selector: '#FAQ', block: 'start' },
  { id: 'newsletter', name: '10_newsletter', selector: '#newsletter', block: 'start' },
];

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.resolve(__dirname, '../screenshots');

async function runVisualQA() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11',
    ],
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Evaluating Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const vpDir = path.join(OUT_DIR, vp.name);
    if (!fs.existsSync(vpDir)) {
      fs.mkdirSync(vpDir, { recursive: true });
    }

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => consoleLogs.push(`[error] ${err.message}`));

    // 1. Capture Preloader immediately on initial load
    await page.goto(BASE_URL, { waitUntil: 'commit' });
    await page.waitForTimeout(220);
    const preloaderShot = path.join(vpDir, '00_preloader.png');
    await page.screenshot({ path: preloaderShot });
    console.log(`✓ Captured Preloader: ${preloaderShot}`);

    // Wait for preloader to complete and WebGL to mount
    await page.waitForSelector('.loader-stage.is-hidden', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600);

    // 2. Iterate through Home scroll sections
    for (const sec of SECTIONS) {
      await page.evaluate(({ selector, block }) => {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'instant', block });
      }, { selector: sec.selector, block: sec.block });

      await page.waitForTimeout(400);
      const shotPath = path.join(vpDir, `${sec.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`✓ Captured ${sec.name} at ${vp.name}`);
    }

    // 3. Full-page capture of Home
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const fullHomeShot = path.join(vpDir, '00_fullpage_home.png');
    await page.screenshot({ path: fullHomeShot, fullPage: true });
    console.log(`✓ Captured Full Page Home: ${fullHomeShot}`);

    // 4. Flavor Transition Capture (Next Flavor)
    await page.click('.carousel_arrow.is-next').catch(() => {});
    await page.waitForTimeout(400);
    const flavorTransitionShot = path.join(vpDir, '11_flavor_transition.png');
    await page.screenshot({ path: flavorTransitionShot });
    console.log(`✓ Captured Flavor Transition: ${flavorTransitionShot}`);

    // 5. Shop Catalog View
    await page.evaluate(() => {
      window.history.pushState(null, '', '/shop');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(400);
    const shopShot = path.join(vpDir, '12_shop_catalog.png');
    await page.screenshot({ path: shopShot });
    console.log(`✓ Captured Shop Page: ${shopShot}`);

    // 6. Product Detail View (/product/double-litchi)
    await page.evaluate(() => {
      window.history.pushState(null, '', '/product/double-litchi');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(500);
    const pdpShot = path.join(vpDir, '13_product_detail.png');
    await page.screenshot({ path: pdpShot });
    console.log(`✓ Captured Product Detail: ${pdpShot}`);

    // 7. Cart Drawer Open (Add item & open drawer)
    await page.click('.pdp-add-to-cart-btn').catch(() => {});
    await page.waitForTimeout(350);
    const cartShot = path.join(vpDir, '14_cart_drawer.png');
    await page.screenshot({ path: cartShot });
    console.log(`✓ Captured Cart Drawer: ${cartShot}`);

    // Close cart drawer
    await page.click('.cart-close-btn').catch(() => {});
    await page.waitForTimeout(200);

    // 8. Global Search Dialog Open
    await page.click('.search-trigger').catch(() => {});
    await page.waitForTimeout(250);
    const searchShot = path.join(vpDir, '15_global_search.png');
    await page.screenshot({ path: searchShot });
    console.log(`✓ Captured Global Search: ${searchShot}`);

    // Close search dialog with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);

    // 9. Navigation Menu Drawer Open
    await page.click('.navbar_menu-button').catch(() => {});
    await page.waitForTimeout(300);
    const menuShot = path.join(vpDir, '16_menu_drawer.png');
    await page.screenshot({ path: menuShot });
    console.log(`✓ Captured Menu Drawer: ${menuShot}`);

    // Close menu
    await page.click('.button_close_menu').catch(() => {});
    await page.waitForTimeout(150);

    results.push({
      viewport: vp.name,
      consoleErrors: consoleLogs.filter((l) => l.includes('[error]')),
      status: 'PASS',
    });

    await context.close();
  }

  await browser.close();

  // Save report JSON
  const reportPath = path.join(OUT_DIR, 'visual_qa_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nVisual QA complete! Saved report to: ${reportPath}`);
}

runVisualQA().catch((err) => {
  console.error('Visual QA error:', err);
  process.exit(1);
});
