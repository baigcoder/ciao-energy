const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/00718c83-3a45-47e1-8fd1-edbb1aa1223e');

async function testSpin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Scroll to benefits-2
  await page.evaluate(() => {
    const el = document.getElementById('benefits-2');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  const testAngles = [
    { label: 'neg_1_8', spin: -1.8 },
    { label: 'neg_2_1', spin: -2.1 },
    { label: 'neg_2_3', spin: -2.3 },
    { label: 'neg_2_5', spin: -2.5 },
  ];

  for (const t of testAngles) {
    await page.evaluate((spinVal) => {
      if (window.__CIAO_SCENE__) {
        window.__CIAO_SCENE__.data.canSpin = spinVal;
      }
    }, t.spin);
    await page.waitForTimeout(400);
    const dest = path.join(ARTIFACT_DIR, `test_spin_${t.label}.png`);
    await page.screenshot({ path: dest });
    console.log(`Saved ${dest}`);
  }

  await browser.close();
}

testSpin().catch(console.error);
