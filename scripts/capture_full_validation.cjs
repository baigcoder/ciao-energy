const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/f040d2a6-163c-4d9a-b970-b0649e65fce6');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Hero Homepage
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(3500); // allow Three.js textures and lighting to settle
  
  const heroPath = path.join(ARTIFACT_DIR, 'hero_desktop_validated.png');
  await desktopPage.screenshot({ path: heroPath });
  console.log('Saved:', heroPath);

  // 2. Open Product Detail Card by clicking the hero title button
  const titleBtn = await desktopPage.$('.carousel_title-btn');
  if (titleBtn) {
    await titleBtn.click();
    await desktopPage.waitForTimeout(1000);
    const cardPath = path.join(ARTIFACT_DIR, 'hero_product_card_open.png');
    await desktopPage.screenshot({ path: cardPath });
    console.log('Saved:', cardPath);
  }

  // 3. Mobile Viewport (iPhone 14 standard: 390x844)
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(3000);
  const mobilePath = path.join(ARTIFACT_DIR, 'hero_mobile_validated.png');
  await mobilePage.screenshot({ path: mobilePath });
  console.log('Saved:', mobilePath);

  // 4. Shop Page
  const shopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await shopPage.goto('http://localhost:3000/#shop', { waitUntil: 'networkidle' });
  await shopPage.waitForTimeout(2000);
  const shopPath = path.join(ARTIFACT_DIR, 'shop_validated.png');
  await shopPage.screenshot({ path: shopPath });
  console.log('Saved:', shopPath);

  await browser.close();
}

run().catch(console.error);
