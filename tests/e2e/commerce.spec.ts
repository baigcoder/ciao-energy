import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/**
 * The commerce state machine beyond shop.spec.ts: totals and shipping maths against the data file, the
 * "line full" error, bag empty/undo, checkout validation, the submitting state, the confirmation, and that no
 * order or analytics request ever leaves the origin (cash on delivery only, nothing external connected).
 */
const commerce = JSON.parse(readFileSync('src/data/grizzly.json', 'utf8')).commerce as {
  packs: Array<{ id: string; price: number }>;
  freeDeliveryThreshold: number;
  deliveryFee: number;
};
const price = (id: string) => commerce.packs.find((pack) => pack.id === id)!.price;
const rs = (value: number) => `Rs ${value.toLocaleString('en-US')}`;

async function ready(page: Page) {
  await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 40_000 });
}

const seedBag = (lines: Array<{ productSlug: string; packOptionId: string; quantity: number }>) => (page: Page) =>
  page.addInitScript((items) => {
    window.localStorage.setItem('grizzly_notice_v1', '1');
    if (!window.sessionStorage.getItem('seeded')) {
      window.localStorage.setItem('grizzly_cart_v2', JSON.stringify(items));
      window.sessionStorage.setItem('seeded', '1');
    }
  }, lines);

test('shipping: below the free-delivery threshold the fee applies, above it delivery is free', async ({ page }) => {
  test.setTimeout(90_000);
  await seedBag([{ productSlug: 'peach', packOptionId: 'pack-6', quantity: 1 }])(page);
  await page.goto('/cart');
  const subtotal = price('pack-6');
  expect(subtotal).toBeLessThan(commerce.freeDeliveryThreshold);
  const bag = page.locator('.bag');
  await expect(bag).toContainText(rs(subtotal));
  await expect(bag).toContainText(rs(commerce.deliveryFee));
  await expect(bag).toContainText(rs(subtotal + commerce.deliveryFee));

  // Raise the line over the threshold: delivery drops to free and the total is the subtotal alone.
  const needed = Math.ceil(commerce.freeDeliveryThreshold / subtotal);
  for (let i = 1; i < needed; i += 1) await bag.getByRole('button', { name: /Increase quantity of Peach, 6 cans/ }).click();
  await expect(bag).toContainText(rs(subtotal * needed));
  await expect(bag.getByText(/free/i).first()).toBeVisible();
  await expect(bag).not.toContainText(rs(subtotal * needed + commerce.deliveryFee));
});

test('product: adding to a full line shows a clear error and the control recovers', async ({ page }) => {
  test.setTimeout(90_000);
  await seedBag([{ productSlug: 'peach', packOptionId: 'pack-6', quantity: 99 }])(page);
  await page.goto('/products/peach');
  await ready(page);
  await page.getByRole('button', { name: 'Add to bag' }).first().click();
  const status = page.locator('#pdp-status');
  await expect(status).toContainText('maximum of this pack');
  await expect(status).toHaveClass(/is-error/);
  await expect(page.getByRole('button', { name: 'Add to bag' }).first()).toBeEnabled();
});

test('bag: remove to empty, undo, then remove again shows the empty state with a way back', async ({ page }) => {
  test.setTimeout(90_000);
  await seedBag([{ productSlug: 'mango-fuego', packOptionId: 'pack-12', quantity: 1 }])(page);
  await page.goto('/cart');
  const bag = page.locator('.bag');
  await bag.getByRole('button', { name: 'Remove Mango Fuego, 12 cans' }).click();
  await expect(bag.getByText('Your bag is empty.')).toBeVisible();
  await bag.getByRole('button', { name: 'Undo' }).click();
  await expect(bag).toContainText(rs(price('pack-12')));
  await bag.getByRole('button', { name: 'Remove Mango Fuego, 12 cans' }).click();
  await expect(bag.getByText('Your bag is empty.')).toBeVisible();
  await expect(page.getByRole('link', { name: /explore the range|see all|shop/i }).first()).toBeVisible();
});

test('checkout: errors name each field, submit shows a busy state, confirmation clears the bag, nothing leaves the origin', async ({ page }) => {
  test.setTimeout(120_000);
  const external: string[] = [];
  const origin = new URL(test.info().project.use.baseURL ?? 'http://localhost:4173').origin;
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:')) external.push(`${request.method()} ${url}`);
  });
  await seedBag([{ productSlug: 'watermelon', packOptionId: 'pack-6', quantity: 1 }])(page);
  await page.goto('/checkout');
  await expect(page.getByRole('heading', { level: 1, name: 'Checkout' })).toBeVisible();

  // Validation: summary alert lists every problem, each linked to its field, and takes focus.
  await page.getByLabel('Mobile number').fill('12345');
  await page.getByRole('button', { name: 'Place order' }).click();
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('Fix these');
  await expect(alert).toContainText('Enter your full name.');
  await expect(alert).toContainText('Enter a Pakistani mobile number');
  await expect(alert).toBeFocused();
  await expect(page.locator('.field__error').first()).toBeVisible();

  // Valid details: the button reports busy while the order is placed, then the confirmation takes focus.
  await page.getByLabel('Full name').fill('Ayesha Khan');
  await page.getByLabel('Mobile number').fill('0300 1234567');
  await page.getByLabel('Street address').fill('12 Canal View Road');
  await page.getByLabel('City', { exact: true }).fill('Lahore');
  await page.getByLabel('Province or territory').selectOption('Punjab');
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByRole('button', { name: 'Placing order…' })).toHaveAttribute('aria-busy', 'true');
  const heading = page.getByRole('heading', { name: 'Thank you, Ayesha' });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(page.locator('.checkout__lead')).toContainText(/Reference GE-[A-Z0-9]{1,6}/);
  await expect(page.locator('.checkout__lead')).toContainText('cash on delivery');
  await expect(page.getByRole('button', { name: 'Bag, empty' })).toBeVisible();
  expect(external, 'requests that left the origin').toEqual([]);
});
