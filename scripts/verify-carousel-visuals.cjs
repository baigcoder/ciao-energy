const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/8a07765e-fac7-41d5-8d73-116dd77db892');

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop 1440x900
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));
  page.on('pageerror', err => consoleLogs.push('ERROR: ' + err.message));

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  // Wait for loader to finish and fade out completely
  await page.waitForTimeout(2500);

  const desktopHeroPath = path.join(ARTIFACT_DIR, 'verify_desktop_hero.png');
  await page.screenshot({ path: desktopHeroPath });
  console.log('Desktop Hero saved to:', desktopHeroPath);

  // 2. Click next arrow to verify transition (Coco Citron Vert)
  const nextBtn = page.locator('.carousel_arrow.is-next');
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(1100);
    const nextFlavorPath = path.join(ARTIFACT_DIR, 'verify_next_flavor.png');
    await page.screenshot({ path: nextFlavorPath });
    console.log('Next flavor saved to:', nextFlavorPath);
  }

  // 3. Click the hero title/discover button or hero can to open ProductDetailCard
  const discoverBtn = page.locator('.carousel_title-btn');
  if (await discoverBtn.isVisible()) {
    await discoverBtn.click();
    await page.waitForTimeout(700);
    const detailCardPath = path.join(ARTIFACT_DIR, 'verify_detail_card.png');
    await page.screenshot({ path: detailCardPath });
    console.log('Detail card saved to:', detailCardPath);

    // Test Add to Cart button inside detail card
    const addToCartBtn = page.locator('.product-card-add-btn');
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.click();
      await page.waitForTimeout(600);
      const afterAddPath = path.join(ARTIFACT_DIR, 'verify_after_add.png');
      await page.screenshot({ path: afterAddPath });
      console.log('After Add saved to:', afterAddPath);
    }
  }

  // 4. Mobile 390x844
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2500);

  const mobileHeroPath = path.join(ARTIFACT_DIR, 'verify_mobile_hero.png');
  await mobilePage.screenshot({ path: mobileHeroPath });
  console.log('Mobile Hero saved to:', mobileHeroPath);

  await browser.close();
  console.log('Finished visual validation. Console logs:', consoleLogs.slice(-10));
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
