/**
 * One source for everything search engines and AI assistants read: titles, descriptions,
 * canonical URLs, Open Graph images and JSON-LD for every route. Used at build time (the
 * prerender script writes it into static HTML) and at runtime (applyHead keeps it correct while
 * the visitor navigates). Everything is derived from src/data/grizzly.json, and structured data
 * only states what the visible page states: no prices (still placeholders), no caffeine or sugar
 * figures, no reviews, no addresses until they are confirmed.
 */
import { BADGES, BRAND, GRIZZLY_FLAVORS, isTodo } from '../data/brand';
import { PRIVACY } from '../data/privacy';
import { FAQ_ITEMS } from '../data/faq';
import { PRODUCTS, type Product } from '../data/products';

export type SeoRoute =
  | { type: 'HOME' }
  | { type: 'SHOP' }
  | { type: 'MIX' }
  | { type: 'HALAL' }
  | { type: 'STORES' }
  | { type: 'PRIVACY' }
  | { type: 'CART' }
  | { type: 'CHECKOUT' }
  | { type: 'NOT_FOUND' }
  | { type: 'PRODUCT'; slug: string };

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  image: string;
  /** noindex pages (bag, checkout, 404). */
  noindex: boolean;
  jsonLd: Array<Record<string, unknown>>;
}

export const SITE_URL: string = BRAND.siteUrl.replace(/\/$/, '');
const absolute = (path: string) => `${SITE_URL}${path}`;
const LABEL = `${BRAND.volume} ${BRAND.productType.toLowerCase()}`;

const FLAVOR_NAMES = GRIZZLY_FLAVORS.map((flavor) => flavor.name);

/** Key facts for a product, in the order they are shown and listed. Unconfirmed values read "To be confirmed". */
export interface Fact {
  label: string;
  value: string;
  confirmed: boolean;
}

export function productFacts(product: Product): Fact[] {
  const pending = 'To be confirmed';
  const row = (label: string, value: string): Fact => ({ label, value: isTodo(value) ? pending : value, confirmed: !isTodo(value) });
  return [
    row('Size', product.volume),
    row('Type', BRAND.productType),
    row('Caffeine', 'TODO'),
    row('Sugar', 'TODO'),
    row('Ingredients', product.ingredients),
    row('Halal status', 'Halal certified'),
    row('Zamzam water', 'Made with added Zamzam water'),
    row('Made in', product.origin.replace('Made in ', '')),
  ];
}

const productUrl = (slug: string) => absolute(`/products/${slug}`);
const imageFor = (slug?: string) => absolute(`/social/${slug ?? 'blue-raspberry'}.png`);

function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND.name,
    legalName: BRAND.company.name,
    url: SITE_URL,
    logo: absolute('/brand/favicon.svg'),
    slogan: BRAND.tagline,
    areaServed: 'PK',
  };
}

function website() {
  return { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: BRAND.name, publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'en' };
}

function breadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absolute(item.path) })),
  };
}

/** Product schema: identity, size, origin and halal status only (no offer until prices are real). */
function productSchema(product: Product) {
  return {
    '@type': 'Product',
    '@id': `${productUrl(product.slug)}#product`,
    name: `${product.name} ${BRAND.name}`,
    description: product.description,
    image: imageFor(product.slug),
    url: productUrl(product.slug),
    category: 'Energy drink',
    brand: { '@type': 'Brand', name: BRAND.name },
    countryOfOrigin: { '@type': 'Country', name: 'Pakistan' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Net volume', value: product.volume },
      { '@type': 'PropertyValue', name: 'Halal status', value: 'Halal certified' },
      { '@type': 'PropertyValue', name: 'Zamzam water', value: 'Made with added Zamzam water' },
    ],
  };
}

function faqSchema() {
  const answered = FAQ_ITEMS.filter((item) => !item.pending);
  return {
    '@type': 'FAQPage',
    mainEntity: answered.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  };
}

export function pageMeta(route: SeoRoute): PageMeta {
  switch (route.type) {
    case 'HOME':
      return {
        path: '/',
        title: `${BRAND.name} – ${BRAND.tagline} | Halal energy drink made in Pakistan`,
        description: `${BRAND.name} is a halal-certified energy drink made in Pakistan, with natural caffeine, B vitamins, electrolytes and added Zamzam water. Six flavors in ${BRAND.volume} cans.`,
        image: imageFor(),
        noindex: false,
        jsonLd: [organization(), website(), faqSchema()],
      };
    case 'SHOP':
      return {
        path: '/shop',
        title: `Shop ${BRAND.name} – all six flavors`,
        description: `Shop all six ${BRAND.name} flavors (${FLAVOR_NAMES.join(', ')}). ${BADGES.join(', ')}. ${BRAND.origin}.`,
        image: imageFor(),
        noindex: false,
        jsonLd: [
          breadcrumb([{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }]),
          {
            '@type': 'ItemList',
            itemListElement: PRODUCTS.map((product, index) => ({ '@type': 'ListItem', position: index + 1, url: productUrl(product.slug), name: product.name })),
          },
        ],
      };
    case 'PRODUCT': {
      const product = PRODUCTS.find((item) => item.slug === route.slug);
      if (!product) return pageMeta({ type: 'NOT_FOUND' });
      return {
        path: `/products/${product.slug}`,
        title: `${product.name} energy drink – ${BRAND.name}`,
        description: `${product.name}: ${product.tagline} A ${LABEL}, halal certified, with added Zamzam water. ${BRAND.origin}.`,
        image: imageFor(product.slug),
        noindex: false,
        jsonLd: [
          productSchema(product),
          breadcrumb([{ name: 'Home', path: '/' }, { name: 'Shop', path: '/shop' }, { name: product.name, path: `/products/${product.slug}` }]),
        ],
      };
    }
    case 'HALAL':
      return {
        path: '/halal-zamzam',
        title: `Halal and Zamzam – ${BRAND.name}`,
        description: `${BRAND.name} is halal certified and made with added Zamzam water. What that means, and where the details will be published.`,
        image: imageFor(),
        noindex: false,
        jsonLd: [breadcrumb([{ name: 'Home', path: '/' }, { name: 'Halal and Zamzam', path: '/halal-zamzam' }])],
      };
    case 'MIX':
      return {
        path: '/mix',
        title: `Mix your own pack – ${BRAND.name}`,
        description: `Build a 6, 12 or 24 can pack of ${BRAND.name} from any mix of the six flavors.`,
        image: imageFor(),
        noindex: false,
        jsonLd: [breadcrumb([{ name: 'Home', path: '/' }, { name: 'Mix your own pack', path: '/mix' }])],
      };
    case 'STORES':
      return {
        path: '/stores',
        title: `Find a store – ${BRAND.name}`,
        description: `Where to buy ${BRAND.name}. The store list is coming soon; you can order online in the meantime.`,
        image: imageFor(),
        noindex: false,
        jsonLd: [breadcrumb([{ name: 'Home', path: '/' }, { name: 'Find a store', path: '/stores' }])],
      };
    case 'PRIVACY':
      return {
        path: '/privacy',
        title: `Privacy – ${BRAND.name}`,
        description: PRIVACY.intro,
        image: imageFor(),
        noindex: false,
        jsonLd: [breadcrumb([{ name: 'Home', path: '/' }, { name: 'Privacy', path: '/privacy' }])],
      };
    case 'CART':
      return { path: '/cart', title: `Your bag – ${BRAND.name}`, description: `Your ${BRAND.name} bag.`, image: imageFor(), noindex: true, jsonLd: [] };
    case 'CHECKOUT':
      return { path: '/checkout', title: `Checkout – ${BRAND.name}`, description: `Checkout for ${BRAND.name}.`, image: imageFor(), noindex: true, jsonLd: [] };
    default:
      return { path: '/404', title: `Page not found – ${BRAND.name}`, description: `This page doesn't exist. Head back to the ${BRAND.name} range.`, image: imageFor(), noindex: true, jsonLd: [] };
  }
}

/** Every indexable route, for the sitemap and the prerender. */
export function indexableRoutes(): SeoRoute[] {
  return [
    { type: 'HOME' },
    { type: 'SHOP' },
    ...PRODUCTS.map((product) => ({ type: 'PRODUCT' as const, slug: product.slug })),
    { type: 'MIX' },
    { type: 'HALAL' },
    { type: 'STORES' },
    { type: 'PRIVACY' },
  ];
}

export { absolute as absoluteUrl };
