# CIAO ENERGY — ORIGINAL RECONSTRUCTION MASTER PLAN
**Status**: Authoritative Execution Plan  
**Date**: October 1, 2026  
**Target**: Full Visual, Motion, 3D, Interaction & Responsive Convergence to `https://www.ciaoenergy.com/`

---

## 1. Architectural Strategy

The reconstruction strictly follows the order of operations defined in the Master Directive:
1. **Preserve Foundation**: Maintain the single persistent Three.js WebGL renderer, TypeScript typing, and React architecture.
2. **Fixed-Overlay Composition**: Align the DOM layer with the reference's fixed container pattern (`position: fixed; inset: 0`), using spacer sections (`min-height: 125svh`) to drive scroll progress without DOM text translating upward into the canvas or header.
3. **Calibrated 3D Engine**: Restore the exact reference mathematical formulas for can placement, wave curve, camera distance, lighting intensity, and material PBR settings.
4. **Unified Visual System**: Ensure the commerce views (`/shop`, `/product/[slug]`, CartDrawer) visually match the cinematic product theatre using the authentic 4K product packshots.

---

## 2. Phase-by-Phase Execution Plan

### Phase D — Global Layout & Fixed Layer System
- Update `src/styles/sections.css` and `src/App.tsx`:
  - Define `.gamme_container`, `.profile_container`, `.benefits_container`, `.argument_container`, `.carousel_title-bis-wrapper` as fixed layers (`position: fixed; inset: 0; pointer-events: none`).
  - Set scroll spacer sections (`.section.is-gamme`, `.section.is-profile`, etc.) to `min-height: 125svh`.
  - Wire ScrollTrigger or synchronized scroll progress to toggle `autoAlpha` (opacity + visibility) so only the active chapter is displayed.

### Phase E — Global Header & Brand Logo
- Update `src/components/CiaoHeader.tsx` and `src/styles/header.css`:
  - Restore minimal luxury reference layout:
    - Left: Audio button (`ON` / `OFF` with 4 animated equalizer bars).
    - Center: Pure white Ciao Energy logo SVG (`max-width: 10rem`, optically centered).
    - Right: Menu button with 5-dot matrix icon + Contact pill button.
  - Seamlessly integrate Commerce (Shop & Cart):
    - Place "Boutique" and Cart status inside the Menu drawer and as subtle, non-intrusive elements that do not compete with the centered logo or 3D stage.
  - Add top `.scroll_indicator` hairline progress bar across the entire viewport.

### Phase F — Preloader
- Update `src/components/Preloader.tsx`:
  - Ensure video embed / SVG vertical can is centered on pure black background.
  - Smooth counter progression `0% → 100%`.
  - Deterministic exit: smooth curtain sweep down (`--loader-reveal: 100vh → 0vh`), revealing navbar, HUD framing marks, and 3D hero simultaneously.

### Phase G — 3D Scene Calibration & Studio Lighting
- Update `src/webgl/sceneManager.ts` & `src/webgl/canModel.ts`:
  - Set Camera: `position: (0, 0, 29)`, FOV: `20°`.
  - Calibrate Spotlights:
    - `spot1` (Key): position `(0, 3.5, 0)`, target `(0, 0, 1)`, intensity `50`, distance `8`, angle `π / 4`.
    - `spot2` (Rim): position `(0, -3, 2)`, target `(0, 0, 1.8)`, intensity `50`, distance `8`, angle `π / 3`.
    - `spot3` (Ingredient): position `(0, 3, 5)`, target `(0, 0.5, 0)`, intensity `0` (hero) / `35` (benefits), texture `spot-mask.avif`.
  - Remove redundant `pointerLight` and oversized `ceilingSpot` which blow out graphics.
  - Retract base discs (`baseOffset`) so ceiling disc and floor base frame the can without dominating.
  - Materials: preserve PBR Physical materials (`metalness: 0.9`, `roughness: 0.2`, `envMapIntensity: 3.0` on rim; `envMapIntensity: 1.0` on label).

### Phase H — Hero Composition & Can Scale
- Update `src/webgl/sceneManager.ts`:
  - Reset `canScale` to authentic reference value: `1.2` (desktop).
  - Wave curve:
    `canPosX = x * data.spacing`
    `canPosY = Math.sin(canPosX * wave)`
    `canPosZ = (Math.abs(x) * -1 - 0.2) * data.wave`
    `canRotX = (-20° * π/180) * data.wave`
    `canRotY = (canPosX * 0.5 - 20° * π/180) * data.wave`
    `canRotZ = (22.5° * π/360) * data.wave`
  - Position can vertically so it floats cleanly in the center (18%–68% viewport height), providing a clear 20%+ text safe zone below it.

### Phase I & J — Flavor Transitions & Profile Detail
- Update `src/components/HeroCarousel.tsx` & `src/components/ProfileSection.tsx`:
  - Position flavor title in lower third, completely below the can rim.
  - Implement SplitText style character mask transitions (`yPercent: 110 → 0`).
  - Wire SVG liquid slider with 6 flavor stops, draggable handle, and smooth loop wrap.
  - Profile section: Camera zooms in (`camPosZ: 6`, FOV `40°`), can tilts right (`-37.5°, 15°, 22.5°`), left column displays tasting notes with technical corner marks (`viewBox="0 0 9 9"`).

### Phase K — Benefits Sequence
- Update `src/components/BenefitsSection.tsx`:
  - Left column: Strikethrough pill with horizontal strike line (`--benefits-line: 0 → 1`), large heading, description.
  - Center: Can upright (`camPosY: -2`, `camPosZ: 12`, FOV `20°`), axial spin showcasing ingredient panel under `spot3`.
  - Right: Vertical icon navigation rail with 4 custom SVGs (Sugar crystal, Leaf, Coffee flame, Stevia plant).

### Phase L — Argument ("Zero Bullshit") Section
- Update `src/components/ArgumentSection.tsx`:
  - Implement the authentic SVG vector mark (viewBox `0 0 1314 405`) with liquid blur mask (`zero-bullshit-mask.svg`).
  - Include the background flavor video loop with seamless loop playback.
  - Camera pulls back (`camPosZ: 8`, FOV `45°`, `canRotX: -20°`, `canRotZ: -5°`).

### Phase M — Full Gamme (Range) Section
- Update `src/webgl/sceneManager.ts` & `src/components/FullGammeSection.tsx`:
  - Fix swirl fan formula:
    `camPosX: -3`, `camPosY: -3.5`, `camPosZ: 20`, FOV `30°`.
    `spacing: 0.47`, `swirl: 1`.
    `canRotX = lerp(canRotX, x * 0.06 * windowRatio + 0.2, data.swirl)`.
  - Six cans fan out gracefully across the lower-center stage in an authentic packshot formation.

### Phase N & O — FAQ & Newsletter/Footer
- Update `src/components/FaqSection.tsx` & `src/components/NewsletterFooter.tsx`:
  - FAQ: Editorial typography `FOIRE AUX QUESTIONS`, 1px dividers, accordion with plus/chevron icons, smooth animated expansion.
  - Newsletter: Clean centered block `REJOIGNEZ-NOUS`, validated email input, privacy text, minimal dark footer.

### Phase P, Q, R — Commerce Integration (Shop, Product Detail, Cart)
- Update `src/components/ShopPage.tsx`, `ProductDetailPage.tsx`, `CartDrawer.tsx`:
  - Replace gradient placeholders with authentic 4K product packshots (`/products/4k/*.webp`).
  - Match typography, buttons, and borders with core brand tokens.

### Phase S, T, U, V, W — Mobile, Accessibility, Performance & Verification
- Mobile responsive composition: 12 cans, DPR capped, touch gestures for carousel and wheel.
- WCAG AA accessibility, keyboard navigation, reduced motion support.
- Zero per-frame allocations, single WebGL context, DPR optimization.
- Multi-viewport visual QA screenshots and automated build tests.
