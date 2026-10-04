const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/00718c83-3a45-47e1-8fd1-edbb1aa1223e');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runValidation() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop 1920x1080 Double Lychee
  console.log('Testing Desktop 1920x1080 Double Lychee...');
  let context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  let page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1920_double_lychee.png') });
  await context.close();

  // 2. Desktop 1920x1080 Kiwi Cucumber (direct match to image_2_original_kiwi.png)
  console.log('Testing Desktop 1920x1080 Kiwi Cucumber...');
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=kiwi-concombre', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1920_kiwi_cucumber.png') });
  await context.close();

  // 3. Desktop 1920x1080 White Peach (direct match against image_1_broken_current.png)
  console.log('Testing Desktop 1920x1080 White Peach...');
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=peche-blanche', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1920_white_peach.png') });
  await context.close();

  // 4. Desktop 1440x900 Double Lychee
  console.log('Testing Desktop 1440x900 Double Lychee...');
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1440_double_lychee.png') });
  await context.close();

  // 5. Mobile 390x844 Double Lychee
  console.log('Testing Mobile 390x844...');
  context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_390_mobile_double_lychee.png') });
  await context.close();

  // 6. Product Detail Drawer open
  console.log('Testing Product Detail Drawer...');
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  // Click View Details & Order
  const detailBtn = await page.$('.carousel_title-btn');
  if (detailBtn) {
    await detailBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1920_product_detail_open.png') });
  }
  await context.close();

  // 7. Full Gamme / Range Section
  console.log('Testing Full Gamme Section...');
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await context.newPage();
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => {
    const el = document.getElementById('full-gamme');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'val_1920_full_gamme_scroll.png') });
  await context.close();

  await browser.close();
  console.log('All validation passes captured successfully!');
}

runValidation().catch(console.error);
