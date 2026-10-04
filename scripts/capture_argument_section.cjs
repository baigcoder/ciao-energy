const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/8a07765e-fac7-41d5-8d73-116dd77db892');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Switch to Flavor 5: Abricot Framboise (5 clicks)
  const nextBtn = page.locator('.carousel_arrow.is-next');
  for (let i = 0; i < 5; i++) {
    await nextBtn.click();
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(600);

  // Scroll to #argument
  await page.evaluate(() => {
    const el = document.getElementById('argument');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  // Test different rotations on __CIAO_SCENE__
  const testAngles = [
    { name: 'rot_pi_minus_024', y: Math.PI - 0.24 },
    { name: 'rot_neg_pi_plus_024', y: -Math.PI + 0.24 },
    { name: 'rot_pi', y: Math.PI },
    { name: 'rot_pi_plus_024', y: Math.PI + 0.24 },
    { name: 'rot_neg_024', y: -0.24 },
  ];

  for (const angle of testAngles) {
    await page.evaluate((yVal) => {
      const scene = window.__CIAO_SCENE__;
      if (scene) {
        scene.data.canRotY = yVal;
        scene.cans.forEach((c) => {
          c.rotation.y = yVal;
        });
      }
    }, angle.y);

    await page.waitForTimeout(200);
    const savePath = path.join(ARTIFACT_DIR, `test_${angle.name}.png`);
    await page.screenshot({ path: savePath });
    console.log(`Saved ${angle.name} to:`, savePath);
  }

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
