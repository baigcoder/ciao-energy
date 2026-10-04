const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  // Set preloader visible with 56% for visual QA review
  await page.evaluate(() => {
    const stage = document.querySelector('.loader-stage');
    if (stage) {
      stage.classList.remove('is-hidden');
      stage.style.opacity = '1';
      stage.style.visibility = 'visible';
      const percentEl = stage.querySelector('.loader_percent');
      if (percentEl) percentEl.textContent = '56 %';
      const fillEl = stage.querySelector('.loader_progress_fill');
      if (fillEl) fillEl.style.width = '56%';
    }
  });

  await page.waitForTimeout(100);

  const outPath = path.resolve(__dirname, '../screenshots/1440x900/00_preloader.png');
  await page.screenshot({ path: outPath });
  console.log('Successfully captured crisp preloader to:', outPath);

  await browser.close();
})();
