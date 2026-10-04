const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '430x932', width: 430, height: 932 },
  { name: '390x844', width: 390, height: 844 },
  { name: '375x812', width: 375, height: 812 },
];

const SECTIONS = [
  { id: 'hero', name: '01_hero', selector: '#gamme', scrollFactor: 0 },
  { id: 'profile', name: '02_profile', selector: '#profile', scrollFactor: 0.95 },
  { id: 'benefits-1', name: '03_benefit_1', selector: '#benefits-1', scrollFactor: 2.1 },
  { id: 'benefits-2', name: '04_benefit_2', selector: '#benefits-2', scrollFactor: 3.1 },
  { id: 'benefits-3', name: '05_benefit_3', selector: '#benefits-3', scrollFactor: 4.1 },
  { id: 'benefits-4', name: '06_benefit_4', selector: '#benefits-4', scrollFactor: 5.1 },
  { id: 'argument', name: '07_zero_bullshit', selector: '#argument', scrollFactor: 6.2 },
  { id: 'full-gamme', name: '08_full_gamme', selector: '#full-gamme', scrollFactor: 7.2 },
  { id: 'faq', name: '09_faq', selector: '#FAQ', scrollFactor: null },
  { id: 'newsletter', name: '10_newsletter', selector: '#newsletter', scrollFactor: null },
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
    await page.waitForTimeout(150); // Preloader in flight
    const preloaderShot = path.join(vpDir, '00_preloader.png');
    await page.screenshot({ path: preloaderShot });
    console.log(`✓ Captured Preloader: ${preloaderShot}`);

    // Wait for preloader to complete and WebGL to mount
    await page.waitForSelector('.loader-stage.is-hidden', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(600); // 3D render settle

    // 2. Iterate through sections
    for (const sec of SECTIONS) {
      if (sec.scrollFactor !== null) {
        await page.evaluate((factor) => {
          const vh = window.innerHeight;
          window.scrollTo(0, factor * vh);
        }, sec.scrollFactor);
      } else {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ behavior: 'instant' });
        }, sec.selector);
      }

      await page.waitForTimeout(400); // Allow RAF lerp & GSAP timeline to seek

      const shotPath = path.join(vpDir, `${sec.name}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`✓ Captured ${sec.name} at ${vp.name}`);
    }

    // Inspect diagnostic state from 3D scene
    const diag = await page.evaluate(() => {
      const w = window;
      if (w.__CIAO_SCENE__) {
        return w.__CIAO_SCENE__.getDiagnosticReport();
      }
      return null;
    });

    results.push({
      viewport: vp.name,
      consoleErrors: consoleLogs.filter((l) => l.includes('[error]')),
      diagnostics: diag,
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
