const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Baigo\\.gemini\\antigravity-ide\\brain\\8a07765e-fac7-41d5-8d73-116dd77db892';

async function verifyAll() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 }
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });

  // 1. Wait for preloader to dismiss (3.8s)
  console.log('Waiting for preloader to dismiss...');
  await page.waitForTimeout(3800);

  // 2. Capture Hero Carousel with wider aesthetic can spacing
  const heroSpacingPath = path.join(ARTIFACT_DIR, 'verify_aesthetic_can_spacing.png');
  await page.screenshot({ path: heroSpacingPath });
  console.log('Saved hero spacing screenshot to:', heroSpacingPath);

  // 3. Hover across cans to test hover proximity & audio
  console.log('Hovering across cans...');
  await page.mouse.move(720, 480);
  await page.waitForTimeout(200);
  await page.mouse.move(860, 480);
  await page.waitForTimeout(200);
  await page.mouse.move(580, 480);
  await page.waitForTimeout(200);

  // 4. Open Product Detail Card (".carousel_title-btn")
  console.log('Opening INFOS & COMMANDER drawer...');
  const infosBtn = await page.$('.carousel_title-btn');
  if (infosBtn) {
    await infosBtn.click();
    await page.waitForTimeout(600);

    const cardPath = path.join(ARTIFACT_DIR, 'verify_product_detail_card_open.png');
    await page.screenshot({ path: cardPath });
    console.log('Saved product detail card screenshot to:', cardPath);

    // Click "AJOUTER AU PANIER"
    console.log('Clicking AJOUTER AU PANIER...');
    const addBtn = await page.$('.product-card-add-btn');
    if (addBtn) {
      await addBtn.click();
      await page.waitForTimeout(400);

      const toastPath = path.join(ARTIFACT_DIR, 'verify_add_to_cart_toast.png');
      await page.screenshot({ path: toastPath });
      console.log('Saved add-to-cart toast screenshot to:', toastPath);
    }
  }

  // 5. Click "Voir le panier" inside the toast to open the Cart Drawer!
  console.log('Opening Cart Drawer via toast action...');
  const toastActionBtn = await page.$('.toast-action-btn');
  if (toastActionBtn) {
    await toastActionBtn.click();
  } else {
    const cartTrigger = await page.$('.cart-trigger');
    if (cartTrigger) await cartTrigger.click();
  }
  await page.waitForTimeout(600);

  const cartPath = path.join(ARTIFACT_DIR, 'verify_cart_drawer_with_meter.png');
  await page.screenshot({ path: cartPath });
  console.log('Saved cart drawer screenshot to:', cartPath);

  // 6. Navigate to Boutique PDP (/boutique/double-litchi)
  console.log('Navigating to /boutique/double-litchi ...');
  await page.goto('http://localhost:3000/boutique/double-litchi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Click the 'Nutrition' preset angle button
  const angleBtns = await page.$$('.angle-btn');
  if (angleBtns.length >= 2) {
    console.log('Clicking Nutrition preset angle...');
    await angleBtns[1].click();
    await page.waitForTimeout(600);
  }

  const pdpPath = path.join(ARTIFACT_DIR, 'verify_pdp_page.png');
  await page.screenshot({ path: pdpPath });
  console.log('Saved PDP page screenshot to:', pdpPath);

  console.log('Console errors encountered:', errors);
  await browser.close();
}

verifyAll().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
