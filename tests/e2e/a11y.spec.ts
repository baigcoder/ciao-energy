import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page) {
  await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 30_000 });
}

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('canvas')
    .analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `${label}\n${summary.join('\n')}`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('grizzly_notice_v1', '1');
    window.localStorage.setItem('grizzly_cart_v2', JSON.stringify([{ productSlug: 'peach', packOptionId: 'pack-6', quantity: 1 }]));
  });
});

for (const path of ['/', '/products/peach', '/products/blackout-berry', '/checkout', '/mix', '/halal-zamzam', '/stores', '/cart', '/nope']) {
  test(`axe: ${path}`, async ({ page }) => {
    await page.goto(path);
    await ready(page);
    await audit(page, path);
  });
}

test('axe: bag drawer and nutrition drawer', async ({ page }) => {
  await page.goto('/products/peach');
  await ready(page);
  await page.getByRole('button', { name: /^Bag,/ }).click();
  await audit(page, 'bag drawer');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Nutrition and ingredients' }).click();
  await audit(page, 'nutrition drawer');
});

test('keyboard: menu, slider, bag and product can work without a mouse', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await ready(page);
  const slider = page.getByRole('slider', { name: 'Flavor' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Mango Fuego');
  await page.keyboard.press('End');
  await expect(slider).toHaveAttribute('aria-valuetext', 'Blackout Berry');

  const menu = page.getByRole('button', { name: 'Menu' });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();

  const bag = page.getByRole('button', { name: /^Bag,/ });
  await bag.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: /Your bag/ });
  await expect(dialog).toBeVisible();
  // Focus stays trapped inside the dialog.
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(bag).toBeFocused();
});

test('axe: storage notice and saved-for-later list', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.removeItem('grizzly_notice_v1');
    window.localStorage.setItem('grizzly_saved_v1', JSON.stringify([{ productSlug: 'watermelon', packOptionId: 'pack-12', quantity: 1 }]));
  });
  await page.goto('/cart');
  await ready(page);
  await expect(page.getByRole('complementary', { name: 'Storage notice' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saved for later (1)' })).toBeVisible();
  await audit(page, 'notice + saved');
});
