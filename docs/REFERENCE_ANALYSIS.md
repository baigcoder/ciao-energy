# CIAO ENERGY — REFERENCE ANALYSIS & RECONSTRUCTION FORENSICS

## 1. Executive Summary & Source Authority
This document records the Phase 0 forensic analysis of the official Ciao Energy reference experience (`https://www.ciaoenergy.com/`), cross-referenced with the supplied project authority files (`RULES.md`, `AGENTS.md`, `PRD.md`, `ARCHITECTUE.md`, `DESIGN.md`, `TASKS.md`, `MEMORY.md`, and `ANTIGRAVITY_PROMPT.md`).

The experience is a cinematic dark-mode product showcase built around a single persistent Three.js WebGL scene, synchronized to a deterministic scroll timeline (GSAP + Lenis), displaying six beverage flavors with high-fidelity physical materials, editorial French typography, comparative benefit storytelling, an accessible accordion FAQ, and a newsletter conversion block.

---

## 2. Six Flavor Reference Profiles

| ID | French Name | Primary Color | Secondary Color | Accent Glow | Character & Recipe Notes |
|:---|:---|:---|:---|:---|:---|
| `double-litchi` | Double Litchi | `#3D2B68` | `#9089D3` | Deep Violet / Lilac | Une explosion exotique. Recette intense en litchi qui rappelle les saveurs d'Asie tropicale. |
| `coco-citron-vert` | Coco Citron Vert | `#27326B` | `#00A6E2` | Cobalt Navy / Cyan | Une parenthèse tropicale. Douceur lactée de la coco et acidité du citron vert. |
| `kiwi-concombre` | Kiwi Concombre | `#024A44` | `#71BD96` | Deep Pine / Emerald | Le plus rafraîchissant. Éclat juteux du kiwi et fraîcheur du concombre. |
| `peche-blanche` | Pêche Blanche | `#BA5200` | `#EFB36B` | Burnt Amber / Peach | Instant de douceur. Floral et délicatement parfumé à la pêche blanche. |
| `pomme-rhubarbe` | Pomme Rhubarbe | `#9B0984` | `#E6A0E8` | Deep Magenta / Orchid | Fruits du jardin. Fraîcheur de la pomme et acidité de la rhubarbe. |
| `abricot-framboise` | Abricot Framboise | `#800035` | `#FF659D` | Crimson Wine / Rose | Duo solaire et gourmand. Douceur de l'abricot et vivacité de la framboise. |

---

## 3. Section-by-Section Forensic Breakdown

### Section 0: Preloader (`.loader`)
- **PURPOSE**: Stage initialization, WebGL context and critical asset verification, visual anticipation.
- **DOM COMPOSITION**: Full viewport fixed overlay (`100vw × 100vh`), centered SVG vertical can / video embed (`Ciao-energy_loader-v2.webm`), numeric percent counter (`0%` → `100%`).
- **3D COMPOSITION**: Background scene initializes behind loader; camera set at `camPosZ: 25`, lights at 0 intensity, waiting for signal.
- **SCROLL RANGE**: Scroll is strictly locked (`overflow: hidden`, Lenis stopped, wheel/touch prevented).
- **TRIGGER**: Page load event; progresses with loader video playback and scene readiness.
- **MOTION**: Counter ticks smoothly to 100%; curtain reveal sweeps down (`--loader-reveal: 100vh → 0vh`), navbar drops in (`yPercent: -120 → 0`), HUD elements slide in from edges.
- **COLOR**: Pure black `#000000` background, crisp white typography, subtle gray percent.
- **TYPOGRAPHY**: Display sans bold for brand, mono for percentage.
- **RESPONSIVE BEHAVIOR**: Video and counter stay centered across 320px to 4K displays.
- **ACCESSIBILITY**: `aria-live="polite"` status; keyboard focus constrained; bypasses or completes immediately if motion is reduced.
- **PERFORMANCE COST**: Low CPU/GPU load; video cached or gracefully bypassed after timeout (3000ms safety guard).
- **FALLBACK**: Static SVG vertical can + instantaneous percent reveal if video fails or is blocked.

---

### Section 1: Gamme / Hero Carousel (`#gamme`, `.section.is-gamme`)
- **PURPOSE**: Hero brand statement and interactive exploration of the 6 flavors.
- **DOM COMPOSITION**:
  - Hidden semantic `<h1>` ("Ciao Energy – L'energy drink parfaite").
  - Large display flavor title with SplitText char masking (`carousel_title`).
  - Carousel navigation arrows (`is-prev`, `is-next`) with dot-matrix hover effect.
  - Liquid SVG pagination progress bar with draggable handle (`.carousel_pagination-svg`).
  - "Scroller pour découvrir" discover prompt with animated 3-chevron chevron indicator.
  - Top fixed navigation (Equalizer sound toggle, centered logo, menu trigger).
- **3D COMPOSITION**:
  - Array of 12 to 24 can instances arranged in a horizontal wave along X and Z (`camPosZ: 29`, `fov: 20`, `wave: 1`, `spacing: 3.5`).
  - Center can is foregrounded, rotating gently with mouse parallax (`pointerInfluence: 0.2`).
  - Can geometry with PBR metallic can material, label texture map, custom environmental tint shader.
  - Base platform below cans with ambient metallic reflection.
  - Dual spotlight illumination (`spot1` top, `spot2` bottom rim).
- **SCROLL RANGE**: 0% to 15% of total page scroll.
- **TRIGGER**: Active by default on initial landing.
- **MOTION**:
  - Dragging/swiping or clicking arrows lerps `carousel.target` with damped interpolation (`delta * 10`).
  - Liquid SVG dot smoothly slides or morphs across flavors.
  - Title SplitText char mask animates out/in with stagger (0.01s).
  - Background angular gradient (`.gamme_gradient`) rotates `360 / 6 = 60°` per flavor.
- **COLOR**: Dynamic radial/conic gradient linked to active flavor (`--color-scheme-1--taste-primary` & `secondary`).
- **TYPOGRAPHY**: Fluid display font (`clamp(4.5rem, 11vw, 8.75rem)`), uppercase, tight line-height (1.0).
- **RESPONSIVE BEHAVIOR**:
  - Mobile: Reduced number of cans (12 instead of 24), carousel swipe sensitivity tuned, title positioned ergonomically above can.
- **ACCESSIBILITY**:
  - ARIA carousel attributes (`role="region"`, `aria-roledescription="carousel"`, previous/next buttons labeled).
  - Keyboard arrow keys cycle active flavor.
- **PERFORMANCE COST**: Moderate (12-24 instanced meshes, 1 draw-call optimization, 2 spotlights, bloom).
- **FALLBACK**: CSS/SVG static rendered high-res can poster image if WebGL fails; pure CSS transitions for titles.

---

### Section 2: Profile / Detail State (`.section.is-profile`)
- **PURPOSE**: Detailed single-flavor profile with tasting notes and architectural editorial framing.
- **DOM COMPOSITION**:
  - Active flavor title displayed with high contrast.
  - Description box wrapped with technical vector framing marks (`.corner-left`, `.corner-right`).
  - Narrative tasting notes with line-by-line reveal mask.
- **3D COMPOSITION**:
  - Camera zooms in close (`camPosZ: 6`, `fov: 40`).
  - Active can shifts to editorial angle: tilted (`canRotX: -37.5°`, `canRotY: 15°`, `canRotZ: 22.5°`), positioned right of center (`canPosX: 0.5`, `canPosY: -0.5`).
  - Surrounding carousel cans spread far apart (`spacing: 3.5 → 5.0`) and fade out of view.
- **SCROLL RANGE**: 15% to 30% of scroll timeline.
- **TRIGGER**: Scroll progress past Section 1 threshold.
- **MOTION**:
  - Smooth camera translation and can rotation interpolation.
  - Editorial text splits into lines and reveals upwards with 0.08s stagger.
  - Framing corners expand into position.
- **COLOR**: Dominant flavor atmospheric backdrop (`body.is-profile-active::after` fades to opacity 1).
- **TYPOGRAPHY**: Display title `clamp(2.5rem, 6vw, 4.5rem)`; body `clamp(1rem, 1.2vw, 1.35rem)` with generous line-height (1.6).
- **RESPONSIVE BEHAVIOR**:
  - Mobile: Can remains centered or scales down; text stacks neatly underneath without overlapping 3D object.
- **ACCESSIBILITY**: Text resides in semantic HTML `<p>` tags; screen readers read full tasting notes without canvas obstruction.
- **PERFORMANCE COST**: Low; camera is zoomed in on single can mesh.
- **FALLBACK**: Full-res static can render with HTML overlay.

---

### Sections 3–6: Benefits Sequence (`#benefits-1` to `#benefits-4`)
- **PURPOSE**: Comparative before/after storytelling dismantling four traditional energy drink vices:
  1. *Moins de sucre* (vs. 11g de sucre)
  2. *Arômes naturels* (vs. Arômes artificiels)
  3. *Caféine issue de grains de café* (vs. Caféine artificielle)
  4. *Stévia* (vs. Aspartame / Sucralose / Acésulfame K)
- **DOM COMPOSITION**:
  - Strikethrough pill: `× [Traditional Ingredient]` with animated horizontal strike line.
  - Large title: `[Ciao Clean Alternative]`.
  - Supporting narrative description.
  - Vertical right-hand navigation rail (`.benefits_nav`) with 4 custom SVGs (Sugar crystal, Leaf, Coffee flame, Stevia plant).
- **3D COMPOSITION**:
  - Can spins upright and faces front (`camPosY: -2`, `camPosZ: 12`, `fov: 20`).
  - Can spin angle rotates through `120° → 130° → 120° → 130°` per benefit section, showcasing ingredient details on the label.
  - Spot mask spotlight (`spot3`) activates (`intensity: 35`, `y: 2.2`) with custom textured spot map (`spot-mask.avif`).
- **SCROLL RANGE**: 30% to 65% of scroll timeline.
- **TRIGGER**: Section entry via scroll or direct click on benefits rail.
- **MOTION**:
  - Strikethrough red/gray line animates from width 0 to 100% (`--benefits-line: 0 → 1`).
  - Active icon in right rail highlights with white glow and active state.
  - Audio SFX trigger: `transition2.mp3` on section transition.
- **COLOR**: High-contrast black stage; focused spotlight highlighting can surface.
- **TYPOGRAPHY**: Section headers `clamp(2.5rem, 5.5vw, 4.5rem)` bold; strikethrough labels in mono/uppercase.
- **RESPONSIVE BEHAVIOR**:
  - Mobile: Benefits nav rail pinned compactly to side or converted to horizontal dots; can scaled to maintain text safe zone.
- **ACCESSIBILITY**:
  - Full DOM text; strikethrough has semantic `aria-label="Ancienne recette: 11g de sucre, Nouvelle recette: Moins de sucre"`.
  - Icon rail buttons have `aria-label` and `aria-current="step"`.
- **PERFORMANCE COST**: Low to Moderate. Single can highlighted with 1 active textured spotlight.
- **FALLBACK**: Clean typography grid with static product visuals.

---

### Section 7: Argument / "Zero Bullshit" (`.section.is-argument`)
- **PURPOSE**: High-energy brand manifesto moment affirming clean formulation.
- **DOM COMPOSITION**:
  - Layered video background stack showing effervescent flavor loops.
  - Massive SVG typographic mark "ZERO BULLSHIT" with liquid/blur silhouette filter (`.argument_svg-blur`).
- **3D COMPOSITION**:
  - Can moves into dynamic wide perspective (`camPosZ: 8`, `fov: 45`, `canRotX: -20°`, `canRotZ: -5°`).
  - Environment tint strength increases (`tintStrength: 2`).
- **SCROLL RANGE**: 65% to 75% of scroll timeline.
- **TRIGGER**: Scroll entry.
- **MOTION**:
  - Vector glyphs scale up with spring/back easing (`scale: 0.6 → 1.0`, `ease: back.out(2)`, stagger 0.04s).
  - Background flavor video auto-plays muted.
- **COLOR**: Vibrant flavor-matched accent against black.
- **TYPOGRAPHY**: Monumental custom lettering SVG vector artwork.
- **RESPONSIVE BEHAVIOR**: Vector scale calibrated to viewport width; video object-fit adjusts to cover on mobile.
- **ACCESSIBILITY**: Hidden accessible heading `<h2>Zero Bullshit</h2>`; videos have `aria-hidden="true"`.
- **PERFORMANCE COST**: Video playback (lazy loaded, paused when offscreen); SVG paths hardware-accelerated.
- **FALLBACK**: Static SVG artwork without video loop.

---

### Section 8: Full Gamme Packshot (`.section.is-full-gamme`)
- **PURPOSE**: Showcase the complete line-up of all six flavors in dynamic spatial unison.
- **DOM COMPOSITION**: Clean minimal viewport frame, allowing the 3D packshot to dominate.
- **3D COMPOSITION**:
  - All 6 can flavors organized in a tight cinematic swirl formation (`camPosZ: 20`, `camPosX: -3`, `camPosY: -3.5`, `swirl: 1`, `spacing: 0.47`).
  - Cans fan out with individual staggered rotations, exhibiting all six flavor label artworks simultaneously.
- **SCROLL RANGE**: 75% to 85% of scroll timeline.
- **TRIGGER**: Scroll entry.
- **MOTION**: Seamless transition from single can into multi-can swirl fan; camera sweeps diagonally.
- **COLOR**: Multi-colored reflection array across cans.
- **TYPOGRAPHY**: Minimalist framing metadata.
- **RESPONSIVE BEHAVIOR**: Swirl radius and camera distance adapt to portrait mobile viewports.
- **ACCESSIBILITY**: Alt description: "Vue d'ensemble de la gamme complète des six canettes Ciao Energy".
- **PERFORMANCE COST**: 6 active textured meshes rendered simultaneously.
- **FALLBACK**: High-resolution group photograph render.

---

### Section 9: FAQ (`#FAQ`, `.section.is-faq`)
- **PURPOSE**: Address consumer inquiries regarding ingredients, caffeine source, carbonation, taurine absence, and storage.
- **DOM COMPOSITION**:
  - Centered editorial header `FOIRE AUX QUESTIONS`.
  - 8 accordion rows with thin top/bottom divider rules (`.faq_separator`).
  - Custom dot-matrix expansion icons (`+` / `-`).
  - Rich text answer containers with zero layout shift.
- **3D COMPOSITION**: WebGL canvas camera transitions offscreen or reduces rendering rate to conserve GPU.
- **SCROLL RANGE**: 85% to 95% of scroll timeline.
- **TRIGGER**: User interaction (click / Enter / Space on accordion triggers).
- **MOTION**: Smooth accordion height tween (`height: 0 → auto`, `duration: 0.4s`, `ease: power2.inOut`); hover color dimming across inactive items.
- **COLOR**: Subtle white/gray contrast; hover elevates active question to `#FFFFFF` while dimming siblings to `rgba(255,255,255,0.3)`.
- **TYPOGRAPHY**: Question `clamp(1.1rem, 1.4vw, 1.5rem)` semibold; Answer `1rem` regular, line-height 1.65.
- **RESPONSIVE BEHAVIOR**: Stacks comfortably on mobile; touch target minimum 48px height.
- **ACCESSIBILITY**:
  - Full WAI-ARIA Accordion pattern (`aria-expanded="false/true"`, `aria-controls`, `role="region"`, `id` pairing).
  - Complete keyboard navigation (Tab, Enter, Space).
- **PERFORMANCE COST**: Virtually zero; CSS/DOM only.
- **FALLBACK**: Standard accessible HTML `<details>` and `<summary>` styling.

---

### Section 10: Newsletter & Footer (`#newsletter`, `.newsletter_container`)
- **PURPOSE**: Direct community conversion (newsletter subscription), social channel connectivity, legal compliance.
- **DOM COMPOSITION**:
  - Newsletter card: Heading `REJOIGNEZ-NOUS`, subtitle, email input field (`#EMAIL`) with floating label animation.
  - Submit button with spinner loading state.
  - RGPD compliance checkbox with link to Privacy Policy.
  - Inline validation error panel and success confirmation panel.
  - Social media pills: TikTok, Instagram.
  - Legal navigation: Mentions légales, CGU, Politique de confidentialité.
  - Copyright line: `© 2026 CIAO ENERGY`.
- **3D COMPOSITION**: Persistent canvas completely paused/idle in background.
- **SCROLL RANGE**: 95% to 100% of scroll timeline.
- **TRIGGER**: Form interaction / submit.
- **MOTION**:
  - Input focus triggers floating label translation (`translateY(-65%)`, `font-size: 0.75rem`).
  - Button hover character roll-up animation (desktop).
- **COLOR**: Pure black canvas, white borders, `#71bd96` success state, `#ff6b6b` error state.
- **TYPOGRAPHY**: Clean sans for form controls; micro label 0.75rem.
- **RESPONSIVE BEHAVIOR**: Form max-width 540px centered; footer buttons wrap cleanly on mobile viewports.
- **ACCESSIBILITY**:
  - Explicit `<label for="EMAIL">`.
  - Live region `aria-live="assertive"` for submission feedback.
  - Valid HTML5 email validation + custom client-side RFC 5322 regex validation.
- **PERFORMANCE COST**: Very low.
- **FALLBACK**: Standard POST form submission if JavaScript is disabled.

---

## 4. Navigation & HUD Systems

### Fixed Utility Header (`.navbar`)
1. **Left Status/Audio**:
   - Equalizer button with 4 animated SVG bars.
   - States: `ON` (bars dancing randomly), `OFF` / `is-muted` (bars collapse to flat 2px line).
   - Audio buffer engine with Web Audio API (`AudioContext`). Unlocked on first user interaction.
2. **Center Brand**:
   - Vector SVG logo linking to top (`/`).
3. **Right Controls**:
   - `MENU` button with 5-dot matrix icon (interactive scale/stagger hover).
   - `Contact` pill button (`mailto:contact@ciaoenergy.com`).
4. **Global Scroll Indicator (`.scroll_component`)**:
   - Thin framing track with glowing linear hotspot indicating progress 0% → 100%.

### Fullscreen Menu Drawer (`.navbar_menu`)
- Drawer drops down over screen with line-mask reveals on links (`Gamme`, `Bénéfices`, `FAQ`, `Newsletter`).
- Keyboard trap implemented; `Escape` key closes drawer; focus returned to trigger button.
- Background scroll locked while open.
