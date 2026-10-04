/** @font-face CSS for the build scripts, read from the installed @fontsource packages (no network). */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FACES = [
  ['Geist', 300, 'normal', 'geist', 'geist-latin-300-normal'],
  ['Geist', 400, 'normal', 'geist', 'geist-latin-400-normal'],
  ['Geist', 500, 'normal', 'geist', 'geist-latin-500-normal'],
  ['Geist', 700, 'normal', 'geist', 'geist-latin-700-normal'],
  ['Libre Franklin', 700, 'italic', 'libre-franklin', 'libre-franklin-latin-700-italic'],
  ['Libre Franklin', 900, 'italic', 'libre-franklin', 'libre-franklin-latin-900-italic'],
];

export async function localFontCss() {
  const rules = await Promise.all(
    FACES.map(async ([family, weight, style, pkg, file]) => {
      const data = await readFile(resolve(root, `node_modules/@fontsource/${pkg}/files/${file}.woff2`));
      return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};font-display:block;src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2')}`;
    })
  );
  return `<style>${rules.join('\n')}</style>`;
}
