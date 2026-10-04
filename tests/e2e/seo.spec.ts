import { expect, test } from '@playwright/test';

// These run without executing the app: they read the static HTML a crawler or an AI assistant gets.
test.use({ javaScriptEnabled: false });

test('home page is crawlable without JavaScript: h1, answer paragraph, range links, FAQ, JSON-LD', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Grizzly Energy');
  await expect(page.getByText('halal-certified energy drink made in Pakistan').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Blue Raspberry/ }).first()).toHaveAttribute('href', '/products/blue-raspberry');
  await expect(page.getByRole('heading', { name: 'What is Grizzly Energy?' })).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/$/);
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  const graph = JSON.parse(ld ?? '{}')['@graph'] as Array<{ '@type': string }>;
  expect(graph.map((node) => node['@type'])).toEqual(expect.arrayContaining(['Organization', 'WebSite', 'FAQPage']));
});

test('product pages carry their own title, canonical, Product + Breadcrumb schema and a facts block', async ({ page }) => {
  await page.goto('/products/peach');
  await expect(page).toHaveTitle(/Peach/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/products\/peach$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Peach' })).toBeVisible();
  for (const label of ['Size', 'Caffeine', 'Sugar', 'Ingredients', 'Halal status']) {
    await expect(page.locator('dt', { hasText: label })).toBeVisible();
  }
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}')['@graph'] as Array<{ '@type': string; offers?: unknown }>;
  expect(ld.map((node) => node['@type'])).toEqual(expect.arrayContaining(['Product', 'BreadcrumbList']));
  expect(ld.find((node) => node['@type'] === 'Product')?.offers).toBeUndefined(); // prices are placeholders: not in structured data
});

test('robots.txt, sitemap.xml and llms.txt are real files', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toContain('Sitemap:');
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('/products/blue-raspberry');
  const llms = await request.get('/llms.txt');
  const text = await llms.text();
  expect(text).toContain('# Grizzly Energy');
  expect(text).not.toContain('TODO');
});

test('unknown paths return the 404 shell marked noindex', async ({ request }) => {
  const html = await (await request.get('/404.html')).text();
  expect(html).toContain('noindex');
});
