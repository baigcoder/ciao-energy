const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.CIAO_BASE_URL || 'http://127.0.0.1:3000';
const SIZE = { width: 2160, height: 3840 };
const RENDER_SCALE = 2;
const SLUGS = [
  'double-litchi',
  'coco-citron-vert',
  'kiwi-concombre',
  'peche-blanche',
  'pomme-rhubarbe',
  'abricot-framboise',
];
const requestedSlugs = process.argv.slice(2);
const targets = requestedSlugs.length ? SLUGS.filter((slug) => requestedSlugs.includes(slug)) : SLUGS;
const OUTPUT_DIR = path.resolve(__dirname, '../public/products/4k');

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11'],
  });

  try {
    const context = await browser.newContext({ viewport: SIZE, deviceScaleFactor: 1 });
    for (const slug of targets) {
      const page = await context.newPage();
      page.on('pageerror', (error) => console.error(`[${slug}] ${error.message}`));
      await page.goto(`${BASE_URL}/?packshot=${slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(
        () => window.__CIAO_SCENE__?.packshotMode === true &&
          document.querySelector('canvas')?.width === 2160 * 2 &&
          document.querySelector('canvas')?.height === 3840 * 2,
        { timeout: 30000 },
      );
      // Let the local GLB, label map, and HDR environment finish upgrading the first-frame fallbacks.
      await page.waitForTimeout(2200);
      const image = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) throw new Error('The product render canvas is missing.');
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 2160;
        exportCanvas.height = 3840;
        const exportContext = exportCanvas.getContext('2d', { alpha: true });
        if (!exportContext) throw new Error('The high-quality export canvas is unavailable.');
        exportContext.imageSmoothingEnabled = true;
        exportContext.imageSmoothingQuality = 'high';
        exportContext.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
        const dataUrl = exportCanvas.toDataURL('image/webp', 0.99);
        const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
        return {
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          maxTextureSize: context?.getParameter(context.MAX_TEXTURE_SIZE) ?? 0,
        };
      });

      if (image.width !== SIZE.width * RENDER_SCALE || image.height !== SIZE.height * RENDER_SCALE) {
        throw new Error(`${slug}: expected ${SIZE.width * RENDER_SCALE}×${SIZE.height * RENDER_SCALE} source, received ${image.width}×${image.height}.`);
      }
      const outputPath = path.join(OUTPUT_DIR, `${slug}-4k.webp`);
      fs.writeFileSync(outputPath, Buffer.from(image.dataUrl.split(',')[1], 'base64'));
      console.log(`${slug}: ${image.width}×${image.height} supersampled → ${SIZE.width}×${SIZE.height} WebP, GPU max ${image.maxTextureSize}, ${Math.round(fs.statSync(outputPath).size / 1024)} KB → ${outputPath}`);
      await page.close();
    }
    await context.close();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
