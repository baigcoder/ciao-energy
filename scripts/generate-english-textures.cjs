const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FLAVORS = [
  {
    id: 'double-litchi',
    name: 'DOUBLE LYCHEE',
    flavorSub: 'DOUBLE LYCHEE FLAVOR',
    primary: '#3D2B68',
    secondary: '#5A3F9A',
    sourceAvif: 'ciao-energy_texture_double-litchi.avif',
  },
  {
    id: 'coco-citron-vert',
    name: 'COCONUT LIME',
    flavorSub: 'COCONUT LIME FLAVOR',
    primary: '#1A2968',
    secondary: '#00B8F5',
    sourceAvif: 'ciao-energy_texture_coco-citron-vert.avif',
  },
  {
    id: 'kiwi-concombre',
    name: 'KIWI CUCUMBER',
    flavorSub: 'KIWI CUCUMBER FLAVOR',
    primary: '#024A44',
    secondary: '#5ECE99',
    sourceAvif: 'ciao-energy_texture_Kiwi-Concombre.avif',
  },
  {
    id: 'peche-blanche',
    name: 'WHITE PEACH',
    flavorSub: 'WHITE PEACH FLAVOR',
    primary: '#BA5200',
    secondary: '#F4AC5B',
    sourceAvif: 'ciao-energy_texture_peche-blanche.avif',
  },
  {
    id: 'pomme-rhubarbe',
    name: 'APPLE RHUBARB',
    flavorSub: 'APPLE RHUBARB FLAVOR',
    primary: '#9B0984',
    secondary: '#E6A0E8',
    sourceAvif: 'ciao-energy_texture_pomme-rhubarbe.avif',
  },
  {
    id: 'abricot-framboise',
    name: 'APRICOT RASPBERRY',
    flavorSub: 'APRICOT RASPBERRY FLAVOR',
    primary: '#800035',
    secondary: '#FF5E97',
    sourceAvif: 'ciao-energy_texture_abricot_framboise.avif',
  },
];

async function generateTextures() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 2048, height: 1603 } });
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });

  for (const flavor of FLAVORS) {
    console.log(`Processing English texture for ${flavor.id}...`);
    const sourceUrl = `http://127.0.0.1:5173/textures/${flavor.sourceAvif}`;

    const dataUrl = await page.evaluate(async ({ sourceUrl, flavor }) => {
      // 1. Load source image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = sourceUrl;
      });

      const width = 2048;
      const height = 1603;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No context');

      // 2. Draw original high-res texture
      ctx.drawImage(img, 0, 0, width, height);

      // Sample local background color for seamless masking
      function getBgColor(x, y) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
      }

      const baseBg = getBgColor(740, 200);

      // 3. ── FRONT FACE REPLACEMENT (English Flavor Name & Clean Caffeine) ──
      // In source: X: 690 to 860, Y: 280 to 1540 contains French flavor, caffeine & calorie text
      ctx.fillStyle = baseBg;
      ctx.fillRect(688, 275, 172, 1265);

      // Draw English Front Subhead: "& clean caffeine & guarana"
      ctx.save();
      ctx.translate(760, 310);
      ctx.rotate(Math.PI / 2);
      ctx.font = '700 25px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.letterSpacing = '1px';
      ctx.fillText('& clean caffeine & guarana', 0, 0);
      ctx.restore();

      // Draw English Flavor Name: "[FLAVOR NAME]" (Bold, striking, stylized)
      ctx.save();
      ctx.translate(810, 600);
      ctx.rotate(Math.PI / 2);
      ctx.font = '900 56px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 10;
      ctx.letterSpacing = '2px';
      ctx.fillText(flavor.name, 0, 0);
      ctx.restore();

      // Draw English Low Calorie badge: "low in calories • refined sugar free"
      ctx.save();
      ctx.translate(760, 1220);
      ctx.rotate(Math.PI / 2);
      ctx.font = '700 21px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.letterSpacing = '1px';
      ctx.fillText('low in calories • zero refined sugar', 0, 0);
      ctx.restore();

      // 4. ── LEFT PANEL (NUTRITION FACTS & INGREDIENTS IN ENGLISH) ──
      // Cleanly mask entire left column with exact base color
      ctx.fillStyle = baseBg;
      ctx.fillRect(20, 25, 660, 1550);

      // Category Subhead
      ctx.font = '900 24px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('SPARKLING BOTANICAL ENERGY DRINK', 38, 70);

      ctx.font = '500 17px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('Crafted with organic green coffee extract, guarana seeds,', 38, 105);
      ctx.fillText('natural fruit essence, organic cane sugar & stevia.', 38, 130);
      ctx.fillText('Enriched with active vitamins B3, B6 and B8 (biotin).', 38, 155);

      // Ingredients block
      ctx.font = '900 19px "Franklin Gothic Atf", Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('INGREDIENTS (100% REVEALED):', 38, 215);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      const ingredients = [
        'Carbonated mountain spring water, cold-pressed lemon juice',
        '(5.5%), unrefined fair-trade organic cane sugar, natural',
        `${flavor.name.toLowerCase()} botanical essence, natural caffeine extracted from`,
        'organic green coffee beans (0.031%), dry guarana seed extract',
        '(Paullinia cupana 0.023%), natural plant stevia (steviol glycosides),',
        'niacin (vitamin B3), vitamin B6, biotin (vitamin B8).',
      ];
      ingredients.forEach((line, idx) => {
        ctx.fillText(line, 38, 250 + idx * 26);
      });

      // Warning Box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(38, 430, 620, 85);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(38, 430, 620, 85);

      ctx.font = '900 17px "Franklin Gothic Atf", Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('HIGH CAFFEINE CONTENT: 32 mg / 100 ml (80 mg / can)', 55, 462);
      ctx.font = '500 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Not recommended for children, pregnant or nursing women.', 55, 492);

      // Nutrition Table
      ctx.font = '900 21px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('AVERAGE NUTRITIONAL VALUES / 100 ML', 38, 565);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      const nutLines = [
        'Energy ....................... 71 kJ / 17 kcal',
        'Fat .......................... 0 g',
        '  of which saturates ......... 0 g',
        'Carbohydrates ................ 4.2 g',
        '  of which unrefined sugars .. 4.0 g',
        'Protein ...................... 0 g',
        'Salt ......................... < 0.01 g',
        'Vitamin B3 (Niacin) .......... 4.0 mg (25% NRV*)',
        'Vitamin B6 ................... 0.35 mg (25% NRV*)',
        'Vitamin B8 (Biotin) .......... 12.5 µg (25% NRV*)',
        'Natural Green Coffee Caffeine  32 mg',
        'Organic Guarana Extract ...... 23 mg',
      ];
      nutLines.forEach((l, idx) => {
        ctx.fillText(l, 38, 605 + idx * 28);
      });

      // Disclaimer
      ctx.font = '400 14px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.70)';
      ctx.fillText('*NRV = Nutrient Reference Values for daily adult intake.', 38, 970);
      ctx.fillText('Vitamins B3 and B6 contribute to normal energy metabolism', 38, 995);
      ctx.fillText('and the long-term reduction of tiredness and physical fatigue.', 38, 1020);
      ctx.fillText('Best consumed chilled. Keep refrigerated after opening.', 38, 1050);

      // Volume Stamp & Address
      ctx.font = '900 52px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('250ml', 38, 1515);

      ctx.font = '500 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.80)';
      ctx.fillText('CIAO ENERGY BEVERAGE LABS', 220, 1475);
      ctx.fillText('86 Avenue de la République, 75011 Paris, France', 220, 1500);
      ctx.fillText('www.ciaoenergy.com  •  @ciaoenergy', 220, 1525);

      // 5. ── RIGHT PANEL (RECIPE BENEFITS IN ENGLISH) ──
      // Mask over French main title (Y = 35 to 200)
      ctx.fillStyle = baseBg;
      ctx.fillRect(1450, 35, 580, 165);

      ctx.font = '900 38px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('OPTIMAL RECIPE.', 1465, 80);
      ctx.fillText('PERFECT ENERGY DRINK.*', 1465, 130);

      // Mask over text next to the 4 icons (X = 1530 to 2030, Y = 190 to 1030)
      ctx.fillStyle = baseBg;
      ctx.fillRect(1530, 190, 500, 840);

      // Benefit 1: LESS SUGAR
      ctx.font = '900 24px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('LESS SUGAR', 1540, 215);

      ctx.font = '800 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
      ctx.fillText('VS 11g IN TRADITIONAL DRINKS', 1540, 240);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('We keep just 4g of unrefined organic cane', 1540, 270);
      ctx.fillText('sugar for a smooth, natural physical lift.', 1540, 295);

      // Benefit 2: NATURAL BOTANICALS
      ctx.font = '900 24px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('NATURAL AROMAS', 1540, 365);

      ctx.font = '800 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
      ctx.fillText('ZERO ARTIFICIAL FLAVORING', 1540, 390);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('Crafted exclusively from cold-pressed botanical', 1540, 420);
      ctx.fillText('extracts and real Mediterranean fruit essences.', 1540, 445);

      // Benefit 3: GREEN COFFEE CAFFEINE
      ctx.font = '900 24px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('GREEN COFFEE CAFFEINE', 1540, 520);

      ctx.font = '800 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
      ctx.fillText('ZERO SYNTHETIC PETROLEUM CAFFEINE', 1540, 545);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('Why manufacture caffeine in a synthetic lab', 1540, 575);
      ctx.fillText('when nature provides clean green coffee beans?', 1540, 600);

      // Benefit 4: ORGANIC STEVIA
      ctx.font = '900 24px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('ORGANIC STEVIA', 1540, 675);

      ctx.font = '800 15px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.60)';
      ctx.fillText('ZERO ASPARTAME • ZERO SUCRALOSE', 1540, 700);

      ctx.font = '500 16px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillText('Our sole zero-calorie sweetener is 100% natural,', 1540, 730);
      ctx.fillText('extracted directly from organic stevia leaves.', 1540, 755);

      // Mask French "EMBOUTEILLÉ EN FRANCE" (Y = 1040 to 1150)
      ctx.fillStyle = baseBg;
      ctx.fillRect(1450, 1040, 580, 100);

      ctx.font = '900 32px "Franklin Gothic Atf", Impact, Arial Black, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('CRAFTED IN FRANCE', 1465, 1085);
      ctx.font = '700 17px monospace, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('100% RECYCLABLE INFINITE ALUMINUM', 1465, 1120);

      // 6. ── GRAPHICS POLISH: SUBTLE BRUSHED ALUMINUM GRAIN & SOFTBOX SPECULAR ──
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 1);
      }

      // Left shoulder softbox highlight line
      const leftSpec = ctx.createLinearGradient(740, 0, 860, 0);
      leftSpec.addColorStop(0, 'rgba(255, 255, 255, 0)');
      leftSpec.addColorStop(0.5, 'rgba(255, 255, 255, 0.14)');
      leftSpec.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = leftSpec;
      ctx.fillRect(740, 0, 120, height);

      // Right shoulder softbox highlight line
      const rightSpec = ctx.createLinearGradient(1320, 0, 1440, 0);
      rightSpec.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rightSpec.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
      rightSpec.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rightSpec;
      ctx.fillRect(1320, 0, 120, height);

      return canvas.toDataURL('image/png');
    }, { sourceUrl, flavor });

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const outDir = path.resolve(__dirname, '../public/textures/en');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${flavor.id}.png`);
    fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved English texture: ${outPath} (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
  }

  await browser.close();
  console.log('All English textures generated successfully!');
}

generateTextures().catch(console.error);
