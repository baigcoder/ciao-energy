import { expect, test, type Page } from '@playwright/test';

/**
 * The storage notice must never sit on top of page controls, its dismiss button must be a real touch
 * target, and header/footer controls must be at least 44px (WCAG 2.2 target size, phone usability).
 */
async function ready(page: Page) {
  await expect(page.getByRole('progressbar', { name: 'Loading Grizzly Energy' })).toBeHidden({ timeout: 30_000 });
}

const intersects = (a: DOMRect | { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
  test(`notice does not cover controls at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    await page.goto('/');
    await ready(page);
    const notice = page.locator('.cookie-notice');
    await expect(notice).toBeVisible();
    const noticeBox = (await notice.boundingBox())!;
    expect(noticeBox.y + noticeBox.height, 'notice inside the viewport').toBeLessThanOrEqual(viewport.height + 1);
    expect(noticeBox.x, 'notice left edge on screen').toBeGreaterThanOrEqual(0);
    expect(noticeBox.x + noticeBox.width, 'notice right edge on screen').toBeLessThanOrEqual(viewport.width + 1);

    const dismiss = (await notice.getByRole('button', { name: 'Got it' }).boundingBox())!;
    expect(dismiss.height, 'dismiss height').toBeGreaterThanOrEqual(44);
    expect(dismiss.width, 'dismiss width').toBeGreaterThanOrEqual(44);

    // Hero controls, header and footer links stay clear of the bar.
    const covered = await page.evaluate(
      ({ top }) =>
        [...document.querySelectorAll<HTMLElement>('.hero a, .hero button, .hero [role="slider"], .site-header a, .site-header button')]
          .filter((el) => getComputedStyle(el).visibility !== 'hidden')
          .map((el) => ({ label: (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 30), r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && r.height > 0 && r.bottom > top && r.top < window.innerHeight)
          .map(({ label }) => label),
      { top: noticeBox.y }
    );
    expect(covered, 'controls under the notice').toEqual([]);

    // Escape the bar: Got it dismisses and clears the reserved space.
    await notice.getByRole('button', { name: 'Got it' }).click();
    await expect(notice).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--notice-h'))).toBe('');
  });
}

test('product page: Add to bag is not under the notice', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/products/peach');
  await ready(page);
  const notice = (await page.locator('.cookie-notice').boundingBox())!;
  const add = page.getByRole('button', { name: /add to bag/i }).first();
  await add.scrollIntoViewIfNeeded();
  const box = (await add.boundingBox())!;
  expect(intersects(box, notice), `Add to bag ${JSON.stringify(box)} vs notice ${JSON.stringify(notice)}`).toBe(false);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
  test(`header and footer controls are at least 44px at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => window.localStorage.setItem('grizzly_notice_v1', '1'));
    await page.setViewportSize(viewport);
    await page.goto('/');
    await ready(page);
    const small = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('.site-header a, .site-header button, .site-footer a, .site-footer button, .skip-link')]
        .filter((el) => el.getBoundingClientRect().width > 0 || el.classList.contains('skip-link'))
        .map((el) => ({ label: (el.getAttribute('aria-label') || el.textContent || el.className).trim().slice(0, 28), r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.height < 43.5 || r.width < 43.5)
        .map(({ label, r }) => `${label}: ${Math.round(r.width)}x${Math.round(r.height)}`)
    );
    expect(small, 'targets under 44px').toEqual([]);
  });
}
