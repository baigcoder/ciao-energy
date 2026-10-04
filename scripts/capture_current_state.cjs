const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/f040d2a6-163c-4d9a-b970-b0649e65fce6');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  const shotPath = path.join(ARTIFACT_DIR, 'current_running_hero.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved screenshot to:', shotPath);
  
  await browser.close();
}

capture().catch(console.error);
