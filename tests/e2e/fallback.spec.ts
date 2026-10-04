import { expect, test } from '@playwright/test';

// Devices without WebGL get the same content and a working shop.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return (original as (...args: unknown[]) => unknown).call(this, type, ...rest) as never;
    } as typeof original;
    window.localStorage.setItem('grizzly_notice_v1', '1');
  });
});

test('home works without WebGL: flavors, copy and the shop button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 2, name: 'Blue Raspberry' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next flavor' }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Mango Fuego' }).first()).toBeVisible();
  await expect(page.locator('.fallback-stage img')).toBeVisible();
});

test('shop works without WebGL: add to bag from the product page', async ({ page }) => {
  await page.goto('/products/mango-fuego');
  await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Add to bag' }).click();
  await expect(page.getByRole('button', { name: 'Bag, 1 item' })).toBeVisible();
});
