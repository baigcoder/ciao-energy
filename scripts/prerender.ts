/**
 * Post-build step (run with vite-node after `vite build`): writes one static HTML
 * file per indexable route with its own title, description, canonical URL, Open
 * Graph tags, JSON-LD and crawlable body text, plus 404.html, robots.txt,
 * sitemap.xml and llms.txt. All content comes from src/seo/meta.ts.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  NOT_FOUND_META,
  getIndexablePaths,
  getLlmsTxt,
  getRobotsTxt,
  getRouteMeta,
  getSitemapXml,
  getStaticBody,
  type RouteMeta,
} from '../src/seo/meta';

const DIST = join(process.cwd(), 'dist');
const template = readFileSync(join(DIST, 'index.html'), 'utf8');

const attr = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
// JSON inside <script>: "</" must not close the tag early.
const json = (value: object) => JSON.stringify(value).replace(/<\//g, '<\\/');

function render(meta: RouteMeta): string {
  const head = [
    `<title>${attr(meta.title)}</title>`,
    `<meta name="description" content="${attr(meta.description)}" />`,
    `<link rel="canonical" href="${attr(meta.canonical)}" />`,
    meta.noindex ? '<meta name="robots" content="noindex, follow" />' : '',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Grizzly Energy" />',
    `<meta property="og:title" content="${attr(meta.title)}" />`,
    `<meta property="og:description" content="${attr(meta.description)}" />`,
    `<meta property="og:url" content="${attr(meta.canonical)}" />`,
    `<meta property="og:image" content="${attr(meta.image)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    ...meta.jsonLd.map((data) => `<script type="application/ld+json">${json(data)}</script>`),
  ]
    .filter(Boolean)
    .join('\n    ');

  const flavor = meta.path.match(/^\/products\/([^/]+)$/)?.[1];
  const html = template
    .replace(/data-flavor="[^"]*"/, (match) => (flavor ? `data-flavor="${flavor}"` : match))
    // Route-specific tags replace the generic ones from index.html.
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta (?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/g, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${getStaticBody(meta)}</div>`);
  if (!html.includes('<div id="root"><div class="prerender">')) throw new Error(`prerender: #root not found for ${meta.path}`);
  return html;
}

function write(file: string, content: string) {
  const target = join(DIST, file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

const paths = getIndexablePaths();
// Each route as folder/index.html and as a flat .html twin, so hosts that map
// "/products/peach" either way (and `vite preview`) serve the right page.
const writeRoute = (path: string) => {
  const html = render(getRouteMeta(path));
  if (path === '/') return write('index.html', html);
  write(`${path.slice(1)}/index.html`, html);
  write(`${path.slice(1)}.html`, html);
};
paths.forEach(writeRoute);
// Bag and checkout: same shell, noindex.
['/cart', '/checkout'].forEach(writeRoute);
write('404.html', render(NOT_FOUND_META));
write('robots.txt', getRobotsTxt());
write('sitemap.xml', getSitemapXml());
write('llms.txt', getLlmsTxt());

console.log(`prerender: ${paths.length} indexable routes, 404.html, robots.txt, sitemap.xml, llms.txt`);
