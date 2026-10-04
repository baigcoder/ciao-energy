const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/019819d3-197f-4ee6-8a72-f37c77fc78a8');

async function testDetailAndCart() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11'],
  });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click VIEW DETAILS & ORDER button
  console.log('Clicking VIEW DETAILS & ORDER button...');
  const detailBtn = page.locator('.carousel_title-btn');
  await detailBtn.click();
  await page.waitForTimeout(1000);

  // Verify product detail card / page is visible
  const cardPath = path.join(ARTIFACT_DIR, 'val_1920_detail_open.png');
  await page.screenshot({ path: cardPath });
  console.log('Saved product detail screenshot:', cardPath);

  // Look for ADD TO CART button
  const addToCartBtn = page.locator('button:has-text("ADD TO CART")').first();
  if (await addToCartBtn.isVisible()) {
    console.log('Clicking ADD TO CART...');
    await addToCartBtn.click();
    await page.waitForTimeout(1000);

    const cartPath = path.join(ARTIFACT_DIR, 'val_1920_cart_added.png');
    await page.screenshot({ path: cartPath });
    console.log('Saved cart added screenshot:', cartPath);
  } else {
    console.log('ADD TO CART button not directly visible, checking drawer or selectors...');
  }

  await browser.close();
}

testDetailAndCart().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
