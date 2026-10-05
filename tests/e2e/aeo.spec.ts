import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/**
 * Answer-engine layer: a direct answer first, the questions people actually ask answered in sentences, a plain
 * facts block per flavor, and llms.txt kept in step with the data. Unconfirmed facts read "To be confirmed" on the
 * page and are named as "not yet published" in llms.txt; none is guessed.
 */
const data = JSON.parse(readFileSync('src/data/grizzly.json', 'utf8')) as {
  brand: { summary: string; name: string };
  flavors: Array<{ slug: string; name: string }>;
};

const QUESTIONS = [
  'What is Grizzly Energy?',
  'Where is Grizzly Energy made?',
  'What flavors does Grizzly Energy come in?',
  'How big is a can?',
  'How much caffeine is in a can?',
  'Does Grizzly Energy contain sugar?',
  'Is Grizzly Energy halal?',
  'Does Grizzly Energy contain Zamzam water?',
  'How do I pay?',
];

test.describe('without JavaScript (what a crawler or an LLM fetch receives)', () => {
  test.use({ javaScriptEnabled: false });

  test('home: direct answer first, then every common question answered', async ({ page }) => {
    await page.goto('/');
    const first = await page.locator('main p, #root p').first().textContent();
    expect(first).toContain('halal-certified energy drink made in Pakistan');
    for (const question of QUESTIONS) await expect(page.getByRole('heading', { name: question }), question).toBeVisible();
    await expect(page.getByText('Cash on delivery').first()).toBeVisible();
    await expect(page.getByText('Each can is 250 ml.').first()).toBeVisible();
  });

  for (const flavor of data.flavors) {
    test(`${flavor.name}: facts block lists name, size, calories, caffeine, sugar, ingredients, halal, origin, flavor`, async ({ page }) => {
      await page.goto(`/products/${flavor.slug}`);
      const facts = await page.locator('main dl').first().innerText();
      for (const label of ['Size', 'Type', 'Flavor', 'Calories', 'Caffeine', 'Sugar', 'Ingredients', 'Halal status', 'Zamzam water', 'Made in']) expect(facts, label).toContain(label);
      expect(facts).toContain('250 ml');
      expect(facts).toContain('Halal certified');
      expect(facts).toContain('Pakistan');
      // Unknown values are stated as unknown, never invented or left blank.
      expect(facts).toMatch(/Caffeine\s*\n?\s*To be confirmed/);
      expect(facts).not.toMatch(/\bTODO\b/);
    });
  }

  test('llms.txt matches the data: summary, every flavor with its confirmed facts, nothing marked TODO', async ({ request }) => {
    const text = await (await request.get('/llms.txt')).text();
    expect(text).toContain(`> ${data.brand.summary}`);
    for (const flavor of data.flavors) {
      expect(text).toContain(`/products/${flavor.slug}`);
      expect(text).toMatch(new RegExp(`- ${flavor.name}: .*size 250 ml.*Not yet published: .*caffeine`));
    }
    expect(text).not.toMatch(/TODO|To be confirmed/);
  });
});

test.describe('with JavaScript (what an executing crawler or screen reader gets)', () => {
  test('home: the answer paragraph leads the document and headings read as words', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => window.localStorage.setItem('grizzly_notice_v1', '1'));
    await page.goto('/');
    await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 40_000 });
    const first = await page.locator('main p').first().textContent();
    expect(first).toBe(data.brand.summary);
    const heroTitle = await page.locator('#hero-title').textContent();
    expect(heroTitle).toMatch(/^BLUE RASPBERRY$/i);
  });
});
