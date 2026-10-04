import { describe, expect, it } from 'vitest';
import { FAQ_ITEMS } from '../data/faq';
import { PRODUCTS, getProductFacts } from '../data/products';
import {
  BRAND_ANSWER,
  getIndexablePaths,
  getLlmsTxt,
  getRobotsTxt,
  getRouteMeta,
  getSitemapXml,
  getStaticBody,
} from '../seo/meta';

const everything = () =>
  [...getIndexablePaths(), '/cart', '/checkout', '/nope'].map((path) => {
    const meta = getRouteMeta(path);
    return JSON.stringify(meta) + getStaticBody(meta);
  });

describe('SEO and answer-engine output', () => {
  it('never publishes a TODO value anywhere', () => {
    [...everything(), getLlmsTxt(), getSitemapXml(), getRobotsTxt()].forEach((text) => expect(text).not.toMatch(/TODO/));
    FAQ_ITEMS.forEach((item) => expect(item.answer).not.toMatch(/TODO/));
  });

  it('lists every product and static page in the sitemap, but not the bag or checkout', () => {
    const sitemap = getSitemapXml();
    PRODUCTS.forEach((product) => expect(sitemap).toContain(`/products/${product.slug}</loc>`));
    expect(sitemap).toContain('/halal-zamzam</loc>');
    expect(sitemap).not.toContain('/checkout');
    expect(getRouteMeta('/checkout').noindex).toBe(true);
  });

  it('gives each product its own canonical URL, product schema and breadcrumb, with no price', () => {
    PRODUCTS.forEach((product) => {
      const meta = getRouteMeta(`/product/${product.slug}/`);
      expect(meta.canonical).toMatch(new RegExp(`/products/${product.slug}$`));
      const json = JSON.stringify(meta.jsonLd);
      expect(json).toContain('"@type":"Product"');
      expect(json).toContain('"@type":"BreadcrumbList"');
      expect(json).not.toContain('offers');
      // Schema facts are a subset of the visible facts block.
      getProductFacts(product)
        .filter((fact) => fact.value !== 'To be confirmed')
        .forEach((fact) => expect(getStaticBody(meta)).toContain(fact.value));
    });
  });

  it('answers "What is Grizzly Energy?" with the same text in the FAQ, the schema and llms.txt', () => {
    expect(FAQ_ITEMS[0].question).toBe('What is Grizzly Energy?');
    expect(FAQ_ITEMS[0].answer).toBe(BRAND_ANSWER);
    expect(JSON.stringify(getRouteMeta('/').jsonLd)).toContain(BRAND_ANSWER);
    expect(getLlmsTxt()).toContain(BRAND_ANSWER);
    expect(getStaticBody(getRouteMeta('/'))).toContain('<h1>Grizzly Energy</h1>');
  });

  it('treats unknown paths and unknown flavors as not found', () => {
    expect(getRouteMeta('/nope').noindex).toBe(true);
    expect(getRouteMeta('/products/cola').noindex).toBe(true);
  });
});
