import { absoluteUrl, pageMeta, SITE_NAME, SOCIAL_IMAGE, type SeoRoute } from './meta';

function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let element = document.head.querySelector<HTMLElement>(selector);
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  return element;
}

/** Keeps title, description, canonical, Open Graph and JSON-LD in step with the current route. */
export function applyHead(route: SeoRoute) {
  const meta = pageMeta(route);
  document.title = meta.title;
  const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
    const element = upsert(`meta[${attr}="${key}"]`, () => {
      const node = document.createElement('meta');
      node.setAttribute(attr, key);
      return node;
    }) as HTMLMetaElement;
    element.content = content;
  };
  setMeta('name', 'description', meta.description);
  setMeta('name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow');
  setMeta('property', 'og:title', meta.title);
  setMeta('property', 'og:description', meta.description);
  setMeta('property', 'og:site_name', SITE_NAME);
  setMeta('property', 'og:image', meta.image);
  setMeta('property', 'og:image:width', String(SOCIAL_IMAGE.width));
  setMeta('property', 'og:image:height', String(SOCIAL_IMAGE.height));
  setMeta('property', 'og:image:alt', meta.title);
  setMeta('property', 'og:url', absoluteUrl(meta.path === '/404' ? '/' : meta.path));
  setMeta('name', 'twitter:title', meta.title);
  setMeta('name', 'twitter:description', meta.description);
  setMeta('name', 'twitter:image', meta.image);
  const canonical = upsert('link[rel="canonical"]', () => {
    const node = document.createElement('link');
    node.setAttribute('rel', 'canonical');
    return node;
  }) as HTMLLinkElement;
  canonical.href = absoluteUrl(meta.path === '/404' ? '/' : meta.path);

  const script = upsert('script[data-seo="jsonld"]', () => {
    const node = document.createElement('script');
    node.setAttribute('type', 'application/ld+json');
    node.setAttribute('data-seo', 'jsonld');
    return node;
  });
  script.textContent = meta.jsonLd.length ? JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.jsonLd }) : '';
}
