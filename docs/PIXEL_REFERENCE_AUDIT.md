# CIAO ENERGY — PIXEL-LEVEL VISUAL & INTERACTION AUDIT
**Document Status**: Frozen Reference Authority  
**Primary Sources**: Supplied high-resolution desktop screenshots (Preloader, Hero Double Litchi, Hero Kiwi Concombre) + live production reference (`https://www.ciaoenergy.com/`).  
**Resolution Baseline**: Desktop 1440 × 900 / 1920 × 1080 (16:9), Tablet 768 × 1024, Mobile 390 × 844 / 375 × 812.

---

## 1. Executive Summary & Forensic Verification
The supplied screenshots and live DOM/WebGL source confirm that Ciao Energy is an austere, high-contrast, physical product theatre. The canvas is pure black (`#000000`), punctuated only by subtle, flavor-specific atmospheric radial glow, sharp silver/white editorial typography, hairline instrumentation marks, and a dominant, photorealistic 3D aluminum can.

---

## 2. Viewport Composition & Spatial Grid

### 2.1 Viewport Anchors & Margins
- **Global Outer Margin (`--_spacing-sizing---page-padding--padding-global`)**: `4%` of viewport width (~57.6px at 1440px; ~76.8px at 1920px; ~16px on mobile ≤ 480px).
- **Max Container Width (`--_spacing-sizing---container--container-xlarge`)**: `120rem` (1920px max-width, horizontally centered).
- **Canvas Positioning**: Fixed full-viewport layer (`position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0`).
- **Hairline Viewport Framing Ticks**:
  - Four corner ticks (`.corner-left`, `.corner-right`) located in the header and profile sections, and four technical ticks inset `32px–48px` from the main viewport boundaries.
  - Geometry: 9×9px SVG vector path with 1px stroke, `stroke: currentColor`, `fill: none`.
  - Opacity: `rgba(255, 255, 255, 0.25)`.

---

## 3. Header & Utility Controls

```
[ ON |||| ]                   [  3D CEILING DISC  ]                   [ :: MENU ]  [ CONTACT ]
  (Audio)                     [ CIAO ENERGY LOGO  ]                     (Drawer)      (Pill)
```

### 3.1 Layout Coordinates
- **Position**: `position: fixed; top: 0; left: 0; right: 0; z-index: 1000`.
- **Height**: `80px` (desktop), `64px` (mobile).
- **Padding**: `0 4%` (horizontal), `20px 0` (vertical).

### 3.2 Left Audio Control (`.navbar_sound`)
- **Dimensions**: ~56px width × 24px height.
- **Label**: `ON` / `OFF` in `Geistmono`, font-size `0.72rem` (11.5px), font-weight 400, letter-spacing `0.05em`.
- **Equalizer Graphic**: SVG `14px × 8px` containing 4 vertical bars (rects):
  - Bar width: `2px`, border-radius: `1px`, spacing: `2px` between bars.
  - Active state: Bars animate independently via GSAP with random heights between `2px` and `8px` (`gsap.utils.random(2, 8)`).
  - Muted state (`.is-muted`): Bars freeze at `height: 2px, y: 3px`.
- **Interaction**: Pointer click toggles audio buffer state (`AudioContext`), updates label, and silences SFX.

### 3.3 Center Brand / Logo Anchor
- **Horizontal Alignment**: Exactly centered (`left: 50%; transform: translateX(-50%)`).
- **Vertical Position**: Sits directly underneath the 3D ceiling pedestal cap (`base.children[1]`), forming an integrated mechanical fixture.
- **Logo Dimensions**: Width `138px`, height `34px` (`max-width: 10rem`).
- **Color**: Pure white `#FFFFFF` vector SVG.
- **Link Target**: `href="/"`.

### 3.4 Right Utility Group
- **Menu Trigger (`.navbar_menu-button`)**:
  - Dimensions: ~72px width × 32px height.
  - Text: `MENU` in uppercase, font-size `0.75rem` (12px), bold.
  - Matrix Icon: SVG `8px × 8px` displaying a 5-dot matrix (dots at `(1,1)`, `(7,1)`, `(1,7)`, `(7,7)` radius 1px, plus center dot `(4,4)`).
  - Hover Micro-interaction: Continuous pulsating scale wave across dots (`scale: 0.5 → 1.0`, stagger `0.1s`).
- **Contact Button (`.button.is-small`)**:
  - Shape: Capsule / Pill (`border-radius: 2rem`).
  - Dimensions: ~110px width × 36px height; padding `0.65rem 1.4rem`.
  - Styling: Pure white background `#FFFFFF`, black text `#000000`, font-size `0.75rem` (12px), font-weight 700, letter-spacing `0.05em`.
  - Aura / Glow: Subtle radial luminescence behind button (`filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.45))`).
  - Desktop Hover: Dual-layer SplitText character roll-up (`layer-top` shifts `y: -110%`, `layer-bottom` shifts `y: 0%`, stagger `0.025s`).

---

## 4. 3D Product & Spatial Framing

```
                                 [ Ceiling Cap (base.children[1]) ]
                                                |
                                                v
    (Can -2)        (Can -1)            [ HERO CAN ]             (Can +1)        (Can +2)
   Dark/Receding  Dark/Mid-curve        Tilted/Hero             Dark/Mid-curve  Dark/Receding
                                                |
                                                v
                                 [ Base Pedestal (base.children[0]) ]
```

### 4.1 3D Can Scale & Geometry
- **Form Factor**: Sleek 250ml aluminum beverage can (approximate height-to-diameter ratio `2.53 : 1`).
- **Three.js Virtual Units**: Height `2.8 units`, diameter `1.1 units`.
- **Hero Viewport Scale**: Occupies **44% to 48%** of the vertical viewport height on standard 1080p desktop screens.
- **Materials (PBR Physical)**:
  - Can Body/Rim: `metalness: 0.9`, `roughness: 0.2`, `sheen: 0.8`, `sheenRoughness: 0.2`, `clearcoat: 1.0`, `clearcoatRoughness: 0.1`, `ior: 2.0`, `envMapIntensity: 3.0`.
  - Metallic Roughness Map: `can-metallic-2.avif` applied to `metalnessMap`.
  - Label Material: `metalness: 0.9`, `roughness: 0.2`, `sheen: 0.05`, `clearcoat: 0.5`, `clearcoatRoughness: 0.3`, `ior: 2.0`, `envMapIntensity: 1.0`, high-res texture map (`SRGBColorSpace`).
  - Low-Power / Mobile Fallback: Reverts to `MeshStandardMaterial` (omitting clearcoat/sheen shaders for 60fps GPU stability).

### 4.2 Pedestals (Base Geometry)
- **Top Inverted Ceiling Disc (`base.children[1]`)**: Inverted concentric grooved metal disc at `y = +3.0` units.
- **Bottom Floor Pedestal (`base.children[0]`)**: Concentric circular beveled base at `y = -3.0` units directly below the central hero can.
- **Material**: `color: #ababab`, `metalness: 0.9`, `roughness: 0.3`, `sheen: 0.3`, `ior: 2.0`.

### 4.3 Spatial Coordinates by Section
| Section | Camera Pos (X, Y, Z) | Camera FOV | Can Pos (X, Y, Z) | Can Rotation (Euler X, Y, Z) | Spacing | Swirl / Wave |
|:---|:---|:---|:---|:---|:---|:---|
| **0. Preloader** | `(0, 0, 25)` | `20°` | `(0, 0, 0)` | `(0, 0, 20°)` | `10.0` | `wave: 0` |
| **1. Gamme (Hero)** | `(0, 0, 29)` | `20°` | `(0, 0, 0)` | `(-20°, -20°, 22.5°)` | `3.5` | `wave: 1` |
| **2. Profile** | `(0, 0, 6)` | `40°` | `(0.5, -0.5, 0)` | `(-37.5°, 15°, 22.5°)` | `5.0` | `wave: 0` |
| **3. Benefit 1** | `(0, -2, 12)` | `20°` | `(0, -0.8, 0)` | `(0, 0, 0)` + `spin: 120°` | `2.2` | `wave: 0` |
| **4. Benefit 2** | `(0, -2, 12)` | `20°` | `(0, -0.48, 0)` | `(0, 0, 0)` + `spin: 130°` | `2.2` | `wave: 0` |
| **5. Benefit 3** | `(0, -2, 12)` | `20°` | `(0, 0.02, 0)` | `(0, 0, 0)` + `spin: 120°` | `2.2` | `wave: 0` |
| **6. Benefit 4** | `(0, -2, 12)` | `20°` | `(0, 0.5, 0)` | `(0, 0, 0)` + `spin: 130°` | `2.2` | `wave: 0` |
| **7. Argument** | `(0, 0, 8)` | `45°` | `(0, 0, -0.5)` | `(-20°, 0, -5°)` | `5.0` | `wave: 0` |
| **8. Full Gamme** | `(-3, -3.5, 20)`| `30°` | `(0, 0, -0.4)` | `(0, 0, 0)` | `0.47` | `swirl: 1` |

### 4.4 Carousel Wave Curve Formula
Each can `i` in the carousel has an offset `target = i * spacing - carousel.position`. The horizontal and depth curve follows:
- `canPosX = x * data.spacing`
- `canPosY = Math.sin(canPosX * wave)`
- `canPosZ = (Math.abs(x) * -1 - 0.2) * data.wave`
- `canRotX = (-20° * π/180) * data.wave`
- `canRotY = (canPosX * 0.5 - 20° * π/180) * data.wave`
- `canRotZ = (22.5° * π/360) * data.wave`
- Mouse Parallax Damping:
  `can.rotation.y += (smoothPointerX / 1280) * 0.2 * proximity`  
  `can.rotation.x += (smoothPointerY / 1280) * 0.2 * proximity`

---

## 5. Typography Scale & Text Safe Zones

### 5.1 Font Family Hierarchy
1. **Primary Display Header**: `Franklin Gothic Atf`, weight 900 (Black), font-style italic, uppercase.
2. **Body & Interface**: `Geist`, weight 300 (Light) & 400 (Regular).
3. **Technical & Instrumentation**: `Geistmono`, weight 400 (Regular).

### 5.2 Typographic Metrics
| Element | Font Family | Weight / Style | Fluid Size Range | Line Height | Tracking | Text Transform |
|:---|:---|:---|:---|:---|:---|:---|
| **Hero Title** | `Franklin Gothic Atf` | 900 Italic | `clamp(2.5rem, 4.167vw, 4.5rem)` | `0.92` | `-0.02em` | UPPERCASE |
| **Benefit Headings** | `Franklin Gothic Atf` | 900 Italic | `clamp(2.25rem, 3.5vw, 3.75rem)` | `1.0` | `-0.01em` | UPPERCASE |
| **Argument "ZERO BULLSHIT"** | Custom Vector SVG | Bold / Stylized | ViewBox `1314 × 405` | N/A | Tight | UPPERCASE |
| **FAQ Question** | `Geist` | 500 Medium | `clamp(1.125rem, 1.25vw, 1.5rem)`| `1.4` | `0` | Sentence case |
| **Body Copy** | `Geist` | 300 Light | `clamp(0.95rem, 1.0vw, 1.15rem)` | `1.6` | `0` | Normal |
| **Strikethrough Pill** | `Geistmono` | 400 Regular | `0.85rem` (13.6px) | `1.0` | `0.04em` | UPPERCASE |
| **Utility / Badges** | `Geistmono` | 400 Regular | `0.72rem` (11.5px) | `1.0` | `0.1em` | UPPERCASE |
| **Preloader %** | `Geistmono` | 400 Regular | `0.875rem` (14px) | `1.0` | `0.3em` | Monospace spaced |

### 5.3 Collision-Free Text Safe Zones
- **Gamme (Hero)**:
  - Top 0% – 18%: Reserved for top ceiling disc, logo, and header controls.
  - Middle 18% – 68%: Dedicated strictly to the 3D can field.
  - Lower 68% – 88%: Dedicated to two-line display title and pagination slider.
  - Bottom 88% – 100%: "SCROLLER POUR DÉCOUVRIR" discover indicator.
- **Profile (Detail)**:
  - Left Safe Zone (0% – 48% width): Text box with technical corners (`.max-width-custom: 30rem`). Zero overlap with 3D can.
  - Right Zone (48% – 100% width): Can positioned at `canPosX: 0.5`, tilted right.
- **Benefits**:
  - Left Column (4% – 45% width): Strikethrough pill, title, description.
  - Center/Right Column (45% – 92% width): Can upright, centered under focused spotlight.
  - Rightmost Rail (92% – 100% width): Vertical icon navigation rail.

---

## 6. Interactive Flavor Navigation & Slider Details

```
          [ < ]             ( HERO CAN )             [ > ]
                      DOUBLE
                      LITCHI
       [========================O========================]
                    SCROLLER POUR DÉCOUVRIR
```

### 6.1 Arrow Controls (`.carousel_arrow`)
- **Position**: Sits at the horizontal mid-line of the hero can, ~240px left and right of screen center.
- **Dimensions**: SVG `17px × 32px`.
- **Graphic Structure**: Multi-dot arrow head (dots with opacity `1.0`, `0.6`, `0.3`).
- **Hover Micro-interaction**: Dot wave scale pulsation (`scale: 0.5 → 1.0`, stagger `0.08s`).
- **Click**: Triggers `carousel.previous()` / `carousel.next()`.

### 6.2 Liquid Pagination Slider (`.carousel_pagination`)
- **Position**: Centered horizontally, ~32px below the flavor title.
- **Dimensions**: Desktop width `440px` (or viewBox `1000 × 40`), height `8px` bar.
- **Multi-stop Color Gradient**:
  - Stop 0%: `#9089D3` (Double Litchi)
  - Stop 20%: `#00A6E2` (Coco Citron Vert)
  - Stop 40%: `#71BD96` (Kiwi Concombre)
  - Stop 60%: `#EEB169` (Pêche Blanche)
  - Stop 80%: `#E59DE6` (Pomme Rhubarbe)
  - Stop 100%: `#FF659D` (Abricot Framboise)
- **Draggable Handle (`.carousel_pagination-dot`)**:
  - Diameter: `18px` circle with subtle liquid filter (`feGaussianBlur` + `feColorMatrix`).
  - Active position: `padding + (usableWidth / 5) * activeIndex`.
  - Interaction: Draggable via PointerEvent with `setPointerCapture`, snapping to nearest integer flavor on release.
  - Loop Wrap Animation: If transitioning across ends (0 ↔ 5), the handle scales down to 0, slides out `exitX: ±150px`, teleports to opposite end, and springs in (`scale: 1.0, power3.out`).

### 6.3 Discover Prompt (`.scroll_discover`)
- **Position**: ~18px below the pagination bar.
- **Text**: `SCROLLER POUR DÉCOUVRIR` in `Geistmono`, font-size `0.72rem`, `color: rgba(255, 255, 255, 0.5)`.

---

## 7. Lighting & Atmospheric Color System

### 7.1 Three.js Light Specifications
1. **Key Spot (`spot1`)**:
   - Position: `(0, 3.5, 0)`, target `(0, 0, 1)`.
   - Intensity: `50` (Hero), `0` (Benefits), `45` (Argument).
   - Angle: `Math.PI / 4` (~45°).
2. **Rim Fill Spot (`spot2`)**:
   - Position: `(0, -3, 2)`, target `(0, 0, 1.8)`.
   - Intensity: `50` (Hero), `0` (Benefits), `45` (Argument).
   - Angle: `Math.PI / 3` (~60°).
3. **Ingredient Spotlight (`spot3`)**:
   - Position: `(0, data.spotY, 2)`, target `(0, data.spotY - 2.5, 0)`.
   - Intensity: `0` (Hero), `35` (Benefits).
   - Light Map: High-contrast vignette texture `spot-mask.avif` creating an ultra-focused beam on the ingredient panel of the can.
4. **Environment / HDRI Map**:
   - Loaded via `RGBELoader` (`hdri2.hdr`), pre-filtered via `PMREMGenerator`.
   - Custom shader injection (`applyEnvironmentTint`) modulates diffuse and specular reflections by `tintColor * tintStrength`.

### 7.2 Background Glow & Angular Gradient
- **Conic Disc (`.gamme_gradient`)**:
  - Blur filter: `blur(80px)`, dimensions `1400px × 1400px`, centered behind hero can.
  - Rotates `60°` per flavor transition (`step = 360° / 6`).
- **Atmospheric Underglow (`body::after`)**:
  - Radial gradient emanating from bottom-center:
    `radial-gradient(88.85% 121.19% at 43.49% 112.49%, var(--color-scheme-1--taste-secondary) 4.96%, var(--color-scheme-1--taste-primary) 54.38%, #000 93.49%)`
  - Interpolated smoothly using CSS `@property` syntax across 0.6s.

---

## 8. Benefit Storytelling Mechanics

### 8.1 The Comparative Formula
Every benefit section (`#benefits-1` to `#benefits-4`) executes an identical architectural contrast:
1. **Prior Compromise (Old Choice)**:
   - Displayed in a pill container with a leading cross mark: `[ × ] [ 11G DE SUCRES ]`.
   - When scrolled into view, an absolute strike line (`.subhead_text::before`) scales from `scaleX: 0` to `scaleX: 1` (`transform-origin: left center`, duration `0.8s`, `power3.out`).
2. **Clean Alternative (Ciao Choice)**:
   - Large bold italic header: `MOINS DE SUCRE`.
   - Explanatory copy: "Une boisson énergisante moins sucrée, avec exclusivement du sucre de canne, choisi pour son origine végétale et son caractère en bouche."
3. **Right Rail Vertical Nav (`.benefits_nav`)**:
   - Pinned at `right: 4%, top: 50%, transform: translateY(-50%)`.
   - 4 icon triggers separated by 1px vertical hairline dividers:
     - Icon 1: Sugar crystal / prism SVG.
     - Icon 2: Natural plant leaf SVG.
     - Icon 3: Coffee bean flame SVG.
     - Icon 4: Stevia leaf sprig SVG.
   - Active state toggles `.is-active` (opacity `1.0`, glow) as ScrollTrigger enters each respective section.
   - Clicking an icon executes programmatic smooth scroll to that section (`scroll.to(sectionTop)`).

---

## 9. Menu Drawer Architecture (`.navbar_menu`)

### 9.1 Desktop vs. Mobile Mechanics
- **Desktop (≥ 992px)**:
  - Drops down from header: `height: auto, opacity: 0 → 1, duration: 0.6s, ease: power3.inOut`.
  - Links: `Gamme`, `Bénéfices`, `FAQ`, `Newsletter`.
  - Staggered line-mask reveal on links (`delay: 0.3s + i * 0.06s`).
  - Clicking outside closes drawer.
- **Mobile (< 992px)**:
  - Expands to full screen: `height: 100svh`.
  - Extra mobile footer elements slide up (`y: 30px → 0px`, `autoAlpha: 0 → 1`):
    - Middle brand icon SVG.
    - Large Contact button.
    - Social links (TikTok, Instagram) and copyright.
- **Accessibility & Focus Guard**:
  - `aria-expanded="true/false"` on button; `role="dialog"` and `aria-modal="true"` on menu.
  - Body scroll locked when open (`document.body.style.overflow = 'hidden'`).
  - `Escape` key closes menu; focus restored to `.navbar_menu-button`.

---

## 10. Responsive Composition & Performance Presets

### 10.1 Breakpoint Dimensions
- **Desktop Extra Wide (≥ 1440px)**: 24 cans in wave, full post-processing (UnrealBloom, SMAA), DPR capped at 1.5.
- **Desktop Standard (1024px – 1439px)**: 24 cans in wave, spacing adjusted proportionally, full shaders.
- **Tablet (768px – 1023px)**: 12 cans, can scale reduced to 1.0, DPR capped at 1.5.
- **Mobile (375px – 767px)**:
  - 12 cans (50% reduction in geometry instancing).
  - Post-processing passes disabled (UnrealBloom and SMAA omitted; UnsignedByteType target).
  - DPR capped at 2.0 (ensuring sharp retina rendering without 3x overhead).
  - Touch paging: Native wheel disabled; custom touchmove paging locks vertical scroll during horizontal swipes (`paging.threshold: 24px`).
  - All interactive tap targets strictly ≥ 48px × 48px.

---

## 11. Audio System Map

| Trigger Event | Sound Key | Audio Asset Reference | Playback Volume |
|:---|:---|:---|:---|
| Flavor Change | `change` | `CIAO-ENERGY-defilementui.mp3` | 0.5 |
| Section 1 → 2 Enter | `enter` | `CIAO-ENERGY-doubleclic-canette.mp3` | 0.5 |
| Benefits Section Enter | `benefits` | `CIAO-ENERGY-transition2.mp3` | 0.5 |
| Menu & Button Clicks | `click` | `CIAO-ENERGY-Clickui.mp3` | 0.5 |

- Autoplay restriction respected: AudioContext starts suspended and unlocks on the first user pointerdown/keydown gesture.
- Global mute toggle (`.navbar_sound.is-muted`) instantly mutes all audio buffer sources.

---

## 12. Non-WebGL Fallback Architecture
If WebGL initialization fails or context is lost:
1. Canvas replaced by a high-resolution, transparent WebP/AVIF rendered can poster image.
2. Carousel transitions revert to CSS 3D transforms (`transform: translateX() scale() rotateY()`).
3. All semantic text, benefit comparisons, FAQ accordions, and newsletter forms remain 100% interactive and legible.
4. No white screen or blank viewport is ever presented to the user.
