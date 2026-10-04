/**
 * SEO and answer-engine metadata, one source for every route. Pure functions (no
 * DOM): the build script writes them into static HTML per route, and the app
 * applies the same values on client-side navigation. Only confirmed facts from
 * grizzly.json reach titles, text or structured data — TODO values never do.
 */
import { BRAND, GRIZZLY_BENEFITS, GRIZZLY_FAQ } from '../data/brand';
import { FAQ_ITEMS } from '../data/faq';
import { PRODUCTS, getProductBySlug, getProductFacts, type Product } from '../data/products';

/** Canonical origin. The label prints www.grizzlyenergy.pk; override with VITE_SITE_URL. */
export const SITE_URL = (
  import.meta.env?.VITE_SITE_URL ||
  `https://${BRAND.company.website.replace(/^https?:\/\//, '')}`
).replace(/\/+$/, '');

export const SITE_NAME = BRAND.name;

/** The one-paragraph answer to "What is Grizzly Energy?": the visible FAQ answer, reused in schema and llms.txt. */
export const BRAND_ANSWER = GRIZZLY_FAQ[0].a;

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  canonical: string;
  image: string;
  /** Static pages a crawler should not index (bag, checkout, 404). */
  noindex?: boolean;
  jsonLd: object[];
}

const absolute = (path: string) => `${SITE_URL}${path}`;
const productImage = (product: Pick<Product, 'slug'>) => absolute(`/social/${product.slug}.png`);

const organization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: BRAND.name,
  legalName: BRAND.company.name,
  url: `${SITE_URL}/`,
  logo: absolute('/brand/favicon.svg'),
  slogan: BRAND.tagline,
};

const website = {
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: BRAND.name,
  url: `${SITE_URL}/`,
  publisher: { '@id': `${SITE_URL}/#organization` },
};

function breadcrumb(items: Array<[string, string]>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: absolute(path),
    })),
  };
}

/**
 * Product schema without `offers`: prices are placeholders until confirmed, so no
 * price is published. Facts mirror the visible facts block exactly.
 */
function productSchema(product: Product) {
  return {
    '@type': 'Product',
    '@id': `${absolute(`/products/${product.slug}`)}#product`,
    name: `${BRAND.name} ${product.name}`,
    description: product.description,
    image: productImage(product),
    brand: { '@type': 'Brand', name: BRAND.name },
    manufacturer: { '@id': `${SITE_URL}/#organization` },
    category: BRAND.productType,
    countryOfOrigin: { '@type': 'Country', name: 'Pakistan' },
    additionalProperty: getProductFacts(product)
      .filter((fact) => fact.value !== 'To be confirmed')
      .map((fact) => ({ '@type': 'PropertyValue', name: fact.label, value: fact.value })),
  };
}

function faqSchema() {
  return {
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

const graph = (...nodes: object[]) => [{ '@context': 'https://schema.org', '@graph': [organization, ...nodes] }];

const DEFAULT_DESCRIPTION =
  'Grizzly Energy: natural caffeine, natural electrolytes, B vitamins and added Zamzam water. Halal certified, made in Pakistan, six flavors.';

const STATIC_PAGES: Record<string, { title: string; description: string; noindex?: boolean; crumb?: string }> = {
  '/': { title: `${BRAND.name} – ${BRAND.tagline}`, description: DEFAULT_DESCRIPTION },
  '/halal-zamzam': {
    title: `Halal and Zamzam – ${BRAND.name}`,
    description: 'Grizzly Energy is halal certified and made with added Zamzam water. Certificate details are being published.',
    crumb: 'Halal and Zamzam',
  },
  '/mix': {
    title: `Mix your pack – ${BRAND.name}`,
    description: 'Build a mixed pack of Grizzly Energy flavors: Blue Raspberry, Mango Fuego, Watermelon, Strawberry Kiwi, Peach and Blackout Berry.',
    crumb: 'Mix your pack',
  },
  '/stores': {
    title: `Find a store – ${BRAND.name}`,
    description: 'Where to buy Grizzly Energy. The stockist list is coming soon; order online with cash on delivery.',
    crumb: 'Find a store',
  },
  '/cart': { title: `Your bag – ${BRAND.name}`, description: DEFAULT_DESCRIPTION, noindex: true },
  '/checkout': { title: `Checkout – ${BRAND.name}`, description: DEFAULT_DESCRIPTION, noindex: true },
};

export const NOT_FOUND_META: RouteMeta = {
  path: '/404',
  title: `Page not found – ${BRAND.name}`,
  description: DEFAULT_DESCRIPTION,
  canonical: absolute('/'),
  image: productImage(PRODUCTS[0]),
  noindex: true,
  jsonLd: [],
};

/** Metadata for a pathname, or the 404 metadata when the path is not a page. */
export function getRouteMeta(pathname: string): RouteMeta {
  const path = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const productSlug = path.match(/^\/products?\/([^/]+)$/)?.[1];
  if (productSlug) {
    const product = getProductBySlug(productSlug);
    if (!product) return NOT_FOUND_META;
    const canonicalPath = `/products/${product.slug}`;
    return {
      path: canonicalPath,
      title: `${product.name} energy drink – ${BRAND.name}`,
      description: `${product.name}: ${product.tagline} ${BRAND.volume} can with natural caffeine, electrolytes, B vitamins and added Zamzam water. Halal certified.`,
      canonical: absolute(canonicalPath),
      image: productImage(product),
      jsonLd: graph(productSchema(product), breadcrumb([['Home', '/'], ['Flavors', '/#gamme'], [product.name, canonicalPath]])),
    };
  }
  const page = STATIC_PAGES[path];
  if (!page) return NOT_FOUND_META;
  const jsonLd =
    path === '/'
      ? graph(website, faqSchema(), ...PRODUCTS.map(productSchema))
      : page.noindex
        ? []
        : graph(breadcrumb([['Home', '/'], [page.crumb ?? page.title, path]]));
  return {
    path,
    title: page.title,
    description: page.description,
    canonical: absolute(path),
    image: productImage(PRODUCTS[0]),
    noindex: page.noindex,
    jsonLd,
  };
}

/** Every indexable path, for the sitemap and the prerender step. */
export function getIndexablePaths(): string[] {
  return [
    '/',
    ...PRODUCTS.map((product) => `/products/${product.slug}`),
    ...Object.entries(STATIC_PAGES)
      .filter(([path, page]) => path !== '/' && !page.noindex)
      .map(([path]) => path),
  ];
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function factsList(product: Product) {
  return `<dl class="prerender__facts">${getProductFacts(product)
    .map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`)
    .join('')}</dl>`;
}

const flavorLinks = () =>
  `<ul class="prerender__flavors">${PRODUCTS.map(
    (product) =>
      `<li><a href="/products/${product.slug}"><img src="/products/thumbs/${product.slug}.png" alt="${escapeHtml(`${product.name} can`)}" width="187" height="491" loading="lazy" decoding="async" /><span>${escapeHtml(product.name)}</span></a></li>`
  ).join('')}</ul>`;

const siteNav = `<nav class="prerender__nav" aria-label="Main navigation"><a href="/">Home</a><a href="/#gamme">Flavors</a><a href="/mix">Mix your pack</a><a href="/halal-zamzam">Halal and Zamzam</a><a href="/stores">Find a store</a><a href="/#FAQ">FAQ</a></nav>`;

/**
 * Crawlable, readable HTML for a route, placed inside #root at build time. It is
 * the first paint (text and a still can before any script runs) and what search
 * engines and assistants read; React replaces it when the app mounts.
 */
export function getStaticBody(meta: RouteMeta): string {
  const product = meta.path.startsWith('/products/') ? getProductBySlug(meta.path.split('/').pop() ?? '') : undefined;
  let main: string;
  if (product) {
    main = `<p class="prerender__eyebrow">${escapeHtml(BRAND.name)}</p>
<h1>${escapeHtml(product.name)}</h1>
<img class="prerender__hero" src="/products/thumbs/${product.slug}.png" alt="${escapeHtml(`${product.name} can`)}" width="187" height="491" fetchpriority="high" />
<p>${escapeHtml(product.description)}</p>
<h2>${escapeHtml(product.name)} facts</h2>
${factsList(product)}
<h2>Other flavors</h2>
${flavorLinks()}`;
  } else if (meta.path === '/') {
    main = `<p class="prerender__eyebrow">${escapeHtml(BRAND.tagline)}</p>
<h1>${escapeHtml(BRAND.name)}</h1>
<img class="prerender__hero" src="/products/thumbs/${PRODUCTS[0].slug}.png" alt="${escapeHtml(`${PRODUCTS[0].name} can`)}" width="187" height="491" fetchpriority="high" />
<h2>What is ${escapeHtml(BRAND.name)}?</h2>
<p>${escapeHtml(BRAND_ANSWER)}</p>
<h2>Six flavors</h2>
${flavorLinks()}
<h2>What is in the can</h2>
<ul>${GRIZZLY_BENEFITS.map((benefit) => `<li><strong>${escapeHtml(benefit.title)}.</strong> ${escapeHtml(benefit.labelDetail)}</li>`).join('')}</ul>
<h2>Frequently asked questions</h2>
${FAQ_ITEMS.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('\n')}`;
  } else {
    const heading = meta.title.replace(` – ${BRAND.name}`, '');
    main = `<p class="prerender__eyebrow">${escapeHtml(BRAND.name)}</p>
<h1>${escapeHtml(heading)}</h1>
<p>${escapeHtml(meta.description)}</p>
<h2>Flavors</h2>
${flavorLinks()}`;
  }
  return `<div class="prerender">${siteNav}<main id="main" class="prerender__main">${main}</main></div>`;
}

/** robots.txt body. */
export function getRobotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

/** sitemap.xml body. */
export function getSitemapXml(): string {
  const urls = getIndexablePaths()
    .map((path) => `  <url><loc>${absolute(path)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** llms.txt: a plain summary for AI assistants, built from the same confirmed facts. */
export function getLlmsTxt(): string {
  const products = PRODUCTS.map(
    (product) =>
      `### ${product.name}\n${product.description}\nURL: ${absolute(`/products/${product.slug}`)}\n${getProductFacts(product)
        .map((fact) => `- ${fact.label}: ${fact.value}`)
        .join('\n')}`
  ).join('\n\n');
  const faq = FAQ_ITEMS.map((item) => `- Q: ${item.question}\n  A: ${item.answer}`).join('\n');
  return `# ${BRAND.name}\n\n> ${BRAND_ANSWER}\n\nTagline: ${BRAND.tagline}\nMaker: ${BRAND.company.name}\nWebsite: ${SITE_URL}/\n\n## Products\n\n${products}\n\n## FAQ\n\n${faq}\n\n## Notes\n\n- Values shown as "To be confirmed" are awaiting confirmation from the brand and should not be estimated.\n- ${BRAND.warning}\n`;
}
