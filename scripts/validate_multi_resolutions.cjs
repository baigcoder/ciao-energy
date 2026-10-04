const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/00718c83-3a45-47e1-8fd1-edbb1aa1223e');

const RESOLUTIONS = [
  { width: 1920, height: 1080, name: '1920x1080' },
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1024, height: 768, name: '1024x768' },
  { width: 768, height: 1024, name: '768x1024' },
  { width: 390, height: 844, name: '390x844_mobile', isMobile: true },
];

async function safeScroll(page, id) {
  try {
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }, id);
  } catch (e) {
    // If navigation happened, wait a second and retry
    await page.waitForTimeout(1000);
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    }, id);
  }
}

async function runMultiRes() {
  const browser = await chromium.launch({ headless: true });

  for (const res of RESOLUTIONS) {
    console.log(`Testing ${res.name}...`);
    const context = await browser.newContext({
      viewport: { width: res.width, height: res.height },
      isMobile: !!res.isMobile,
    });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(3000);

    // 1. Hero
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `res_${res.name}_01_hero.png`) });

    // 2. Profile
    await safeScroll(page, 'profile');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `res_${res.name}_02_profile.png`) });

    // 3. Benefit 02 (Matches Image 2)
    await safeScroll(page, 'benefits-2');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `res_${res.name}_05_benefit_02.png`) });

    // 4. Argument
    await safeScroll(page, 'argument');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `res_${res.name}_08_argument.png`) });

    // 5. Full Range
    await safeScroll(page, 'full-gamme');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, `res_${res.name}_09_full_range.png`) });

    await context.close();
  }

  await browser.close();
  console.log('Multi-resolution verification complete!');
}

runMultiRes().catch(console.error);
