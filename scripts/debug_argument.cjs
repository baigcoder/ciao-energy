const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Scroll to #argument
  await page.evaluate(() => {
    const el = document.getElementById('argument');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(1000);

  const debugInfo = await page.evaluate(() => {
    const scene = window.__CIAO_SCENE__;
    return {
      scrollY: window.scrollY,
      currentTimelineProgress: scene ? scene.currentTimelineProgress : null,
      targetTimelineProgress: scene ? scene.targetTimelineProgress : null,
      timelineDuration: scene && scene.masterTimeline ? scene.masterTimeline.duration() : null,
      data: scene ? {
        canScale: scene.data.canScale,
        canPosY: scene.data.canPosY,
        canRotX: scene.data.canRotX,
        canRotY: scene.data.canRotY,
        canSpin: scene.data.canSpin,
        wave: scene.data.wave,
      } : null,
    };
  });

  console.log('Debug Info at #argument center:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
}

main().catch(console.error);
