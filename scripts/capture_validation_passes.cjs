const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Baigo/.gemini/antigravity-ide/brain/019819d3-197f-4ee6-8a72-f37c77fc78a8');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'val_1920_double_lychee.png', width: 1920, height: 1080, hash: '#flavor=double-litchi' },
  { name: 'val_1440_double_lychee.png', width: 1440, height: 900, hash: '#flavor=double-litchi' },
  { name: 'val_1366_double_lychee.png', width: 1366, height: 768, hash: '#flavor=double-litchi' },
  { name: 'val_390_mobile_double_lychee.png', width: 390, height: 844, hash: '#flavor=double-litchi' },
  { name: 'val_1920_kiwi_cucumber.png', width: 1920, height: 1080, hash: '#flavor=kiwi-concombre' },
  { name: 'val_1920_white_peach.png', width: 1920, height: 1080, hash: '#flavor=peche-blanche' },
];

async function captureAll() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11'],
  });

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const url = `http://127.0.0.1:3000/${vp.hash}`;
    console.log(`Navigating to ${url} at ${vp.width}x${vp.height}...`);
    await page.goto(url, { waitUntil: 'networkidle' });
    // Let WebGL textures and initial transition settle
    await page.waitForTimeout(3500);

    const shotPath = path.join(ARTIFACT_DIR, vp.name);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All validation screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
