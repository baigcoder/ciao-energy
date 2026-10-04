const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/00718c83-3a45-47e1-8fd1-edbb1aa1223e');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function captureAllSections() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/#flavor=double-litchi...');
  await page.goto('http://localhost:3000/#flavor=double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const sections = [
    { id: 'gamme', name: '01_hero.png' },
    { id: 'profile', name: '02_profile.png' },
    { id: 'tasting', name: '03_tasting.png' },
    { id: 'benefits-1', name: '04_benefit_01.png' },
    { id: 'benefits-2', name: '05_benefit_02.png' },
    { id: 'benefits-3', name: '06_benefit_03.png' },
    { id: 'benefits-4', name: '07_benefit_04.png' },
    { id: 'argument', name: '08_argument.png' },
    { id: 'full-gamme', name: '09_full_range.png' },
  ];

  for (const s of sections) {
    console.log(`Scrolling to ${s.id} (${s.name})...`);
    await page.evaluate((sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, s.id);
    await page.waitForTimeout(1200);
    const dest = path.join(ARTIFACT_DIR, s.name);
    await page.screenshot({ path: dest });
    console.log(`Saved ${dest}`);
  }

  await browser.close();
  console.log('All sections captured successfully!');
}

captureAllSections().catch(console.error);
