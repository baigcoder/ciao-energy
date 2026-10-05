#!/usr/bin/env node
/**
 * The README banner (.github/readme/banner.jpg): a night studio, the wordmark, and all six cans standing on glows in
 * their flavor colours with a faint floor reflection. Built from the real product art (public/brand/logo.png and
 * public/products/thumbs), so re-run it after changing either:
 *   node scripts/build-readme-banner.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FLAVORS = (await import('../src/data/grizzly.json', { with: { type: 'json' } })).default.flavors;
const W = 1600;
const H = 760;
const flavors = FLAVORS.map((flavor) => [flavor.slug, flavor.accent]);
const CAN_H = 360;
const CAN_W = Math.round((187 / 491) * CAN_H);
const GAP = 26;
const rowW = flavors.length * CAN_W + (flavors.length - 1) * GAP;
const x0 = Math.round((W - rowW) / 2);
const canTop = 300;

const glows = flavors
  .map(([, c], i) => {
    const cx = x0 + i * (CAN_W + GAP) + CAN_W / 2;
    return `<ellipse cx="${cx}" cy="${canTop + CAN_H - 6}" rx="${CAN_W * 0.95}" ry="26" fill="url(#g${i})"/>
      <radialGradient id="g${i}"><stop offset="0" stop-color="${c}" stop-opacity="0.85"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>
      <ellipse cx="${cx}" cy="${canTop + CAN_H * 0.45}" rx="${CAN_W * 1.1}" ry="${CAN_H * 0.55}" fill="url(#h${i})"/>
      <radialGradient id="h${i}"><stop offset="0" stop-color="${c}" stop-opacity="0.22"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  })
  .join('\n');

const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="sky" cx="0.5" cy="0.15" r="0.95">
      <stop offset="0" stop-color="#16263f"/><stop offset="0.55" stop-color="#070c16"/><stop offset="1" stop-color="#020408"/>
    </radialGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9aa3ad" stop-opacity="0"/><stop offset="0.5" stop-color="#9aa3ad" stop-opacity="0.16"/><stop offset="1" stop-color="#9aa3ad" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="spot" cx="0.5" cy="0" r="1">
      <stop offset="0" stop-color="#dfe9ff" stop-opacity="0.18"/><stop offset="1" stop-color="#dfe9ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#sky)"/>
  <ellipse cx="${W / 2}" cy="0" rx="${W * 0.42}" ry="${H * 0.9}" fill="url(#spot)"/>
  <rect y="${canTop + CAN_H - 90}" width="100%" height="200" fill="url(#floor)"/>
  ${glows}
</svg>`);

// key out the logo's dark background: alpha from brightness, so the wordmark sits on the sky with no box
const trimmed = await sharp(path.join(root, 'public/brand/logo.png')).trim({ threshold: 40 }).resize({ width: 600 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: lw, height: lh } = trimmed.info;
const rgba = Buffer.alloc(lw * lh * 4);
for (let i = 0; i < lw * lh; i += 1) {
  const r = trimmed.data[i * 3], g = trimmed.data[i * 3 + 1], b = trimmed.data[i * 3 + 2];
  const a = Math.max(0, Math.min(255, (Math.max(r, g, b) - 60) * 2.2));
  rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a;
}
const logo = await sharp(rgba, { raw: { width: lw, height: lh, channels: 4 } }).png().toBuffer();
const logoMeta = await sharp(logo).metadata();
const cans = await Promise.all(
  flavors.map(([slug]) => sharp(path.join(root, `public/products/thumbs/${slug}.webp`)).resize({ height: CAN_H }).toBuffer())
);
// a faint mirror of each can on the floor
const reflections = await Promise.all(
  cans.map((buf) =>
    sharp(buf)
      .flip()
      .composite([{ input: Buffer.from(`<svg width="${CAN_W}" height="${CAN_H}"><defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="0.35" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#f)"/></svg>`), blend: 'dest-in' }])
      .toBuffer()
  )
);
const layers = [
  { input: logo, left: Math.round((W - logoMeta.width) / 2), top: Math.round((canTop - logoMeta.height) / 2) - 6 },
  ...reflections.map((input, i) => ({ input, left: x0 + i * (CAN_W + GAP), top: canTop + CAN_H + 2 })),
  ...cans.map((input, i) => ({ input, left: x0 + i * (CAN_W + GAP), top: canTop })),
];
await sharp(bg).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(root, '.github/readme/banner.jpg'));
console.log('banner ok', logoMeta.width, logoMeta.height, CAN_W);
