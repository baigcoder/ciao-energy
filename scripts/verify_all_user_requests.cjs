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

  console.log('Navigating to http://localhost:3000/ to capture Preloader...');
  // 1. Capture Preloader mid-load
  const navPromise = page.goto('http://localhost:3000/');
  await page.waitForTimeout(300);
  const preloaderPath = path.join(ARTIFACT_DIR, 'verify_preloader_logo.png');
  await page.screenshot({ path: preloaderPath });
  console.log('Preloader screenshot saved to:', preloaderPath);

  await navPromise;
  // Wait for loader to finish and fade out completely
  await page.waitForTimeout(2000);

  // 2. Capture Hero Carousel (Wider Spacing)
  const heroPath = path.join(ARTIFACT_DIR, 'verify_hero_wider_spacing.png');
  await page.screenshot({ path: heroPath });
  console.log('Hero wider spacing saved to:', heroPath);

  // 3. Switch to Flavor 5: Abricot Framboise (5 clicks to the next flavor)
  const nextBtn = page.locator('.carousel_arrow.is-next');
  for (let i = 0; i < 5; i++) {
    await nextBtn.click();
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);

  // 4. Scroll to #argument (ZERO BULLSHIT)
  console.log('Scrolling to #argument...');
  await page.evaluate(() => {
    const el = document.getElementById('argument');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1400);

  const argumentPath = path.join(ARTIFACT_DIR, 'verify_argument_zero_bullshit.png');
  await page.screenshot({ path: argumentPath });
  console.log('Argument Zero Bullshit screenshot saved to:', argumentPath);

  // 5. Scroll to #full-gamme (OUTRO DIAGONAL SWOOP)
  console.log('Scrolling to #full-gamme...');
  await page.evaluate(() => {
    const el = document.getElementById('full-gamme');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1400);

  const outroPath = path.join(ARTIFACT_DIR, 'verify_outro_diagonal_swoop.png');
  await page.screenshot({ path: outroPath });
  console.log('Outro Diagonal Swoop screenshot saved to:', outroPath);

  await browser.close();
  console.log('All visual validations completed successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
