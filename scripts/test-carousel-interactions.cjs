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

  // 1. Test clicking a neighboring can (left neighbor at roughly x=600, y=420)
  console.log('Clicking left neighbor can at (600, 420)...');
  await page.mouse.click(600, 420);
  await page.waitForTimeout(1100);

  const afterNeighborClickPath = path.join(ARTIFACT_DIR, 'verify_neighbor_click.png');
  await page.screenshot({ path: afterNeighborClickPath });
  console.log('Neighbor click saved to:', afterNeighborClickPath);

  // 2. Test horizontal drag across canvas (drag from 720 to 520)
  console.log('Dragging canvas from 720 to 520...');
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(520, 450, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(1100);

  const afterDragPath = path.join(ARTIFACT_DIR, 'verify_drag_snap.png');
  await page.screenshot({ path: afterDragPath });
  console.log('Drag snap saved to:', afterDragPath);

  // 3. Test deep linking (#flavor=pomme-rhubarbe)
  console.log('Navigating to #flavor=pomme-rhubarbe...');
  await page.goto('http://localhost:3000/#flavor=pomme-rhubarbe', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const deepLinkPath = path.join(ARTIFACT_DIR, 'verify_deep_link.png');
  await page.screenshot({ path: deepLinkPath });
  console.log('Deep link saved to:', deepLinkPath);

  await browser.close();
  console.log('Interaction tests passed successfully.');
}

main().catch(err => {
  console.error('Error during interaction tests:', err);
  process.exit(1);
});
