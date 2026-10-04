const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/763591f7-9f68-4c75-8ed8-dc186818dbfa');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runValidation() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // 1. Desktop 1920x1080
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.message}`));

  console.log('Opening http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500); // Wait for preloader reveal

  // Screenshot 1: Default initial hero (1920x1080)
  const shot1 = path.join(ARTIFACT_DIR, 'val_1920_initial_hero.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved 1920 initial hero:', shot1);

  // Transition to Coconut Lime (flavor index 1)
  const nextBtn = page.locator('.carousel_arrow.is-next');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(1400); // Wait for transition interpolation
    const shot2 = path.join(ARTIFACT_DIR, 'val_1920_coconut_lime.png');
    await page.screenshot({ path: shot2 });
    console.log('Saved 1920 coconut lime:', shot2);

    // Transition to Kiwi Cucumber (flavor index 2)
    await nextBtn.click();
    await page.waitForTimeout(1400);
    const shot3 = path.join(ARTIFACT_DIR, 'val_1920_kiwi_cucumber.png');
    await page.screenshot({ path: shot3 });
    console.log('Saved 1920 kiwi cucumber:', shot3);

    // Transition to White Peach (flavor index 3) — the exact flavor from user screenshot
    await nextBtn.click();
    await page.waitForTimeout(1400);
    const shot4 = path.join(ARTIFACT_DIR, 'val_1920_white_peach.png');
    await page.screenshot({ path: shot4 });
    console.log('Saved 1920 white peach:', shot4);
  }

  // Open Product Detail Card
  const discoverBtn = page.locator('.carousel_title-btn');
  if (await discoverBtn.isVisible()) {
    await discoverBtn.click();
    await page.waitForTimeout(900);
    const shotDetail = path.join(ARTIFACT_DIR, 'val_1920_product_detail.png');
    await page.screenshot({ path: shotDetail });
    console.log('Saved product detail:', shotDetail);

    // Close detail card
    const closeBtn = page.locator('.product-card-close');
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(600);
    }
  }

  await context.close();

  // 2. Desktop 1440x900
  const context1440 = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page1440 = await context1440.newPage();
  await page1440.goto('http://localhost:3000/#flavor=coco-citron-vert', { waitUntil: 'networkidle' });
  await page1440.waitForTimeout(3000);
  const shot1440 = path.join(ARTIFACT_DIR, 'val_1440_coconut_lime.png');
  await page1440.screenshot({ path: shot1440 });
  console.log('Saved 1440 coconut lime:', shot1440);
  await context1440.close();

  // 3. Mobile 390x844
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto('http://localhost:3000/#flavor=coco-citron-vert', { waitUntil: 'networkidle' });
  await pageMobile.waitForTimeout(3000);
  const shotMobile = path.join(ARTIFACT_DIR, 'val_390_mobile_coconut_lime.png');
  await pageMobile.screenshot({ path: shotMobile });
  console.log('Saved 390 mobile:', shotMobile);
  await contextMobile.close();

  await browser.close();

  console.log('--- CONSOLE LOGS ---');
  logs.forEach(l => console.log(l));
  console.log('--- VALIDATION COMPLETE ---');
}

runValidation().catch(console.error);
