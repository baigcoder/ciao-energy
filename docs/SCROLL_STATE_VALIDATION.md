# CIAO ENERGY — SCROLL STATE & SECTION VALIDATION MATRIX

**Document Date**: September 30, 2026  
**Status**: Comprehensive Scroll Verification & Architectural Matrix  
**Baseline**: Reference Authority [PIXEL_REFERENCE_AUDIT.md](file:///f:/ciao-energy-antigravity-spec/docs/PIXEL_REFERENCE_AUDIT.md)

---

## 1. Sequential Section Validation Matrix

| Section ID | Target Scroll | 3D Camera / Scene State | DOM Content & Composition | Visual Result | Status |
|:---|:---|:---|:---|:---|:---|
| **01. HERO (`#gamme`)** | $scrollY = 0\text{vh}$ ($progress = 0.00$) | Camera: `(0, 0, 29)`, FOV `20°`. Can: `(-20°, -20°, 22.5°)`, `wave: 1`, `spacing: 3.5`. All 24 cans active in wave arc. Top & bottom spotlights active (`intensity: 50`). | Headline: Two-line display title (e.g. `DOUBLE` / `LITCHI`). Navigation: Left sound toggle, center logo under ceiling cap, right menu + contact pill. Bottom: Multi-color gradient slider with draggable liquid handle. | Can scale 45.9% vertical occupancy. Brand label, flavor color, and flanking metallic chimes verified. | **PASS** |
| **02. PROFILE (`#profile`)** | $scrollY = 1.0\text{vh}$ ($progress = 0.133$) | Camera: `(0, 0, 6)`, FOV `40°`. Can: `(0.5, -0.5, 0)`, rot `(-37.5°, 15°, 22.5°)`, `wave: 0`. `baseOffset: 8.0` (fixtures retracted). | Left column (0%–45%): `01 / 06` badge, display title, description box with corner ticks and tasting specs grid (`250ML`, `32MG`, `SUCRE DE CANNE`). Right: 3D can tilted. | Large hero can on right, clear text safe zone on left, zero header collision. | **PASS** |
| **03. BENEFIT 1 (`#benefits-1`)** | $scrollY = 2.0\text{vh}$ ($progress = 0.267$) | Camera: `(0, -2, 12)`, FOV `20°`. Can: `(0, -0.8, 0)`, rot `(0, 0, 0)` + `spin: 120°`. Focused spotlight `spot3` active (`intensity: 35`, $y=2.2$). | Left: `BÉNÉFICE 01 / 04`, strikethrough pill `✕ 11G DE SUCRES`, bold heading `MOINS DE SUCRE`, description, feature chips. Right rail: active dot `01`. Center: can upright. | Sugar comparison clearly communicated; focused ingredient beam highlights nutrition panel. | **PASS** |
| **04. BENEFIT 2 (`#benefits-2`)** | $scrollY = 3.0\text{vh}$ ($progress = 0.400$) | Camera: `(0, -2, 12)`, FOV `20°`. Can: `(0, -0.48, 0)`, rot `(10°, 0, 5°)`, `spin: 130°`. `spot3` active. | Left: `BÉNÉFICE 02 / 04`, strikethrough pill `✕ ARÔMES ARTIFICIELS`, heading `ARÔMES NATURELS`, narrative description. Right rail: active dot `02`. | Smooth spin transition; active chapter indicator updates accurately. | **PASS** |
| **05. BENEFIT 3 (`#benefits-3`)** | $scrollY = 4.0\text{vh}$ ($progress = 0.533$) | Camera: `(0, -2, 12)`, FOV `20°`. Can: `(0, 0.02, 0)`, rot `(10°, 0, -10°)`, `spin: 120°`. `spot3` active. | Left: `BÉNÉFICE 03 / 04`, strikethrough pill `✕ CAFÉINE SYNTHÉTIQUE`, heading `CAFÉINE ISSUE DE GRAINS DE CAFÉ`, description. Right rail: active dot `03`. | Vertical position adjusts upward; caffeine panel highlighted under spotlight. | **PASS** |
| **06. BENEFIT 4 (`#benefits-4`)** | $scrollY = 5.0\text{vh}$ ($progress = 0.667$) | Camera: `(0, -2, 12)`, FOV `20°`. Can: `(0, 0.5, 0)`, rot `(10°, 0, 5°)`, `spin: 130°`. `spot3` active. | Left: `BÉNÉFICE 04 / 04`, strikethrough pill `✕ ASPARTAME • SUCRALOSE`, heading `STÉVIA`, description. Right rail: active dot `04`. | Stevia comparison chapter aligned with 3D can position. | **PASS** |
| **07. ARGUMENT (`#argument`)** | $scrollY = 6.0\text{vh}$ ($progress = 0.800$) | Camera: `(0, 0, 8)`, FOV `45°`. Can: `(0, 0, -0.5)`, rot `(-20°, 0, -5°)`, `wave: 0`. Background video loops stack active with flavor accent glow. | Full-screen composition: Glowing vector `ZERO BULLSHIT` SVG ($1314 \times 405$) centered, with manifesto subhead: `AUCUN COMPROMIS SUR LE GOÛT • ZÉRO ÉDULCORANT ARTIFICIEL • 100% TRANSPARENCE`. | High-contrast visual impact; zero layout distortion. | **PASS** |
| **08. FULL GAMME (`#full-gamme`)** | $scrollY = 7.0\text{vh}$ ($progress = 0.933$) | Camera: `(-3, -3.5, 20)`, FOV `30°`. Can: `(0, 0, -0.4)`, `spacing: 0.47`, `swirl: 1`. All 6 flavor cans grouped in tight fan packshot formation. | Header: `LA GAMME COMPLÈTE` + badge. 6 interactive flavor pills with color swatches. Quality seal: `FABRIQUÉ EN FRANCE • MOINS DE SUCRE • CAFÉINE VÉGÉTALE`. | Packshot composition matches reference swirl layout. | **PASS** |
| **09. FAQ (`#FAQ`)** | $scrollY \ge 7.5\text{vh}$ ($progress = 1.000$) | Camera: `(0, -6, 10)`, FOV `30°`. Cans transition smoothly downward offscreen. Lights dim. | Headline: `FOIRE AUX QUESTIONS`. Compact 7-item accordion with animated '+' toggle icon and accessible ARIA attributes. | Compact vertical rhythm without excessive empty space. | **PASS** |
| **10. NEWSLETTER (`#newsletter`)** | Document end | Cans maintained offscreen. Zero GPU compute waste. | Card: `REJOIGNEZ-NOUS`, subtitle, email input with floating label, high-contrast submit button. Footer: Social links, legal links, copyright. | High-conversion footer block cleanly proportioned. | **PASS** |

---

## 2. Technical Validation Summary

- **Typecheck**: `npx tsc --noEmit` — 0 errors.
- **Lint**: `npm run lint` — 0 warnings, 0 errors.
- **Unit & Integration Tests**: `npm test` — 4/4 passing tests.
- **Production Build**: `npm run build` — 2.40s clean bundle.
- **Dual Server Ports**: Active on `http://localhost:3000/` and `http://localhost:3001/`.
