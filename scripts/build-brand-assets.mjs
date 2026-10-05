#!/usr/bin/env node
/**
 * Brand-level images (the wordmark is typeset, there is no logo file):
 *   public/brand/logo.png          512×512 square mark for the Organization schema and app surfaces
 *   public/social/grizzly-energy.png  1200×630 social preview for the home page and every non-product page
 * Text comes from src/data/grizzly.json; the cans are the transparent thumbnails in assets_label-art/thumbs.
 *   node scripts/build-brand-assets.mjs
 */
import { chromium } from 'playwright';
import { localFontCss } from './local-fonts.mjs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontCss = await localFontCss();
const data = JSON.parse(await readFile(resolve(root, 'src/data/grizzly.json'), 'utf8'));
await mkdir(resolve(root, 'public/brand'), { recursive: true });
await mkdir(resolve(root, 'public/social'), { recursive: true });
const [top, bottom] = data.brand.wordmark;
const blue = data.flavors[0].accent;

const browser = await chromium.launch();

const logo = await browser.newPage({ viewport: { width: 512, height: 512 } });
await logo.setContent(`<!doctype html><html><head>${fontCss}<style>
  body { margin: 0; width: 512px; height: 512px; display: grid; place-content: center; background: radial-gradient(70% 70% at 50% 40%, #16202b 0%, #05080c 100%); }
  .top { font: italic 900 98px/0.9 'Libre Franklin'; color: #eef2f7; letter-spacing: -2px; }
  .bottom { font: italic 900 74px/0.9 'Libre Franklin'; color: ${blue}; margin-left: 54px; }
</style></head><body><div class="top">${top}</div><div class="bottom">${bottom}</div></body></html>`);
await logo.evaluate(() => document.fonts.ready);
await logo.screenshot({ path: resolve(root, 'public/brand/logo.png') });
console.log('✓ brand/logo.png');

const cans = await Promise.all(
  data.flavors.map(async (flavor) => ({
    accent: flavor.accent,
    src: `data:image/png;base64,${(await readFile(resolve(root, `assets_label-art/thumbs/${flavor.slug}.png`))).toString('base64')}`,
  }))
);
const social = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await social.setContent(`<!doctype html><html><head>${fontCss}<style>
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; color: #fff; font-family: Geist, sans-serif;
    background: radial-gradient(80% 70% at 50% 100%, #1b2a3a 0%, #05080c 70%); }
  .row { position: absolute; left: 0; right: 0; bottom: 36px; display: flex; justify-content: center; align-items: flex-end; gap: 6px; }
  .row img { height: 330px; }
  .row img:nth-child(3), .row img:nth-child(4) { height: 380px; }
  .mark { position: absolute; top: 56px; left: 0; right: 0; text-align: center; font: italic 900 108px/0.9 'Libre Franklin'; text-transform: uppercase; }
  .mark span { margin-left: 22px; color: ${blue}; filter: brightness(1.2); }
  .tag { position: absolute; top: 178px; left: 0; right: 0; text-align: center; font-size: 26px; letter-spacing: 9px; text-transform: uppercase; opacity: .85; }
</style></head><body>
  <div class="mark">${top}<span>${bottom}</span></div>
  <div class="tag">${data.brand.tagline}</div>
  <div class="row">${cans.map((can) => `<img src="${can.src}" alt="">`).join('')}</div>
</body></html>`);
await social.evaluate(() => document.fonts.ready);
await social.screenshot({ path: resolve(root, 'public/social/grizzly-energy.png') });
console.log('✓ social/grizzly-energy.png');
await browser.close();
