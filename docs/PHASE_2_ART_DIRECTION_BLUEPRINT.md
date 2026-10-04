# CIAO ENERGY — PHASE 2 ART DIRECTION BLUEPRINT
**Authority Reference Document**
**Status:** Approved Architectural Blueprint
**Scope:** Global Visual System, Spatial Composition, Lighting, Atmosphere, 3D Orchestration, Responsive Art Direction

---

## 1. Executive Summary & Design Vision

Ciao Energy is neither a generic SaaS landing page nor a standard e-commerce template. It is an **Editorial Product Film** fused with an **Interactive 3D Product Catalog** and **High-End Commerce Layer**.

### Core Aesthetic Pillars
1. **Pure Black Canvas (`#000000`)**: Deep obsidian base providing infinite contrast for metallic aluminum reflections and typography.
2. **Product Color as Atmosphere**: Flavor hues are never applied as harsh, opaque flat gradients. They bloom softly as atmospheric rim reflections, dynamic conic lighting, and subtle UI micro-accents.
3. **Metallic Aluminum Physicality**: The 250ml sleek can is treated as an industrial sculpture with calibrated PBR roughness, anisotropic highlights, and sharp label typography.
4. **Cinematic Negative Space**: Elimination of arbitrary vertical voids (empty 100vh gaps with hidden content) in favor of intentional, content-driven editorial proportions.
5. **Harmonized Horizontal Datum**: Strict horizontal alignment across Desktop (4% outer inset, 1920px max container) and Mobile (16px outer inset).

---

## 2. Spatial Composition & Grid Matrix

### 2.1 Viewport Anchors
- **Desktop Maximum Width**: `1920px` centered container.
- **Desktop Inset**: `4vw` (minimum 32px, maximum 76px).
- **Mobile Inset**: `16px` consistent edge margin.
- **Vertical Rhythm**: Replaces indiscriminate `100vh` minimums with proportional vertical padding (`clamp(3.5rem, 6vh, 6.5rem)`) tied to content scale.

### 2.2 Alignment Datum Matrix
| Component / Section | Left Margin / Inset | Center Alignment | Right Margin / Inset | Vertical Height Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Global Header** | Left utility (Audio toggle, Brand status) | Centered Ciao wordmark | Search trigger + Cart trigger + Menu drawer | Fixed 64px, hairline bottom border on scroll |
| **Hero Theatre** | Vertical index ticker `01/06` | Primary hero can ($z=9.4$, scale 1.92) | Flavor technical specs | Dynamic 100vh viewport lock |
| **Product Profile** | Editorial title, origin, narrative | Can offset right ($x=2.2$, $z=7.6$) | 4-cell factual grid (Volume, Sucre, Caféine, Origine) | Content-driven $80\text{--}90\text{vh}$ |
| **Benefits Matrix** | 4-chapter dynamic sticky rail | Axial product focus ($120^\circ \to 180^\circ$) | Comparative transformation pills | 4 calibrated scroll steps ($1\text{vh}$ per chapter) |
| **Zero Bullshit** | Large masking typography | Can centered, piercing text depth | Purity statement | Dynamic lockup ($70\text{vh}$) |
| **Full Range** | Range descriptor & filter tabs | 6-can collector fan arc ($z=16.5$) | Quick discovery CTA | Spatial showcase ($90\text{vh}$) |
| **Shop Catalog** | Filter pills (All, Fruité, Frais, Low Sugar) | 3D-oriented product cards | Cart drawer affordance | Flowing grid (responsive columns) |
| **Product Detail** | Sticky 3D interactive viewer | Can rotation pivot | Sticky purchase drawer (Pack, Qty, Add to Cart) | Dual-column desktop / stacked mobile |
| **FAQ & Footer** | Structured accordion rows | Centered newsletter signup | Legal links & copyright | Content-driven minimal padding |

---

## 3. Typography & Optical Hierarchy

### 3.1 Type Scale Foundations
- **Display Heading (`--type-display`)**: `clamp(3.5rem, 8.5vw, 7.5rem)` — Bold, tracked tightly (`-0.035em`), leading `0.92`.
- **Section Heading (`--type-section`)**: `clamp(2rem, 4.2vw, 3.8rem)` — Uppercase, geometric clarity, leading `1.05`.
- **Editorial Subtitle (`--type-subtitle`)**: `clamp(1.1rem, 1.8vw, 1.6rem)` — Semi-bold, subtle letterspacing (`-0.01em`).
- **Body Standard (`--type-body`)**: `clamp(0.95rem, 1.1vw, 1.15rem)` — High legibility, neutral grey (`rgba(255,255,255,0.72)`), leading `1.55`.
- **Technical & Commerce Mono (`--type-mono`)**: `0.72rem` — `Geist Mono, monospace`, uppercase, tracked (`0.08em`), muted gold/aluminum tone.

### 3.2 Typography-3D Spatial Integration
- In the **Hero**, the product name sits directly behind the central can't top rim, creating natural occlusion depth.
- In **Zero Bullshit**, typography wraps the can through z-depth sorting and selective luminescent backlighting.
- In **Product Profile**, text is placed in the left 52% column, providing a dedicated 48% clear spatial corridor for the 3D can without overlapping legibility areas.

---

## 4. Color & Lighting Architecture

### 4.1 Master Color Tokens
```css
--color-canvas: #000000;
--color-surface-elevated: #0a0a0c;
--color-surface-glass: rgba(18, 18, 22, 0.72);
--color-border-subtle: rgba(255, 255, 255, 0.12);
--color-border-strong: rgba(255, 255, 255, 0.28);
--color-text-primary: #ffffff;
--color-text-secondary: rgba(255, 255, 255, 0.68);
--color-text-muted: rgba(255, 255, 255, 0.44);
--color-aluminum-highlight: #e8ecf2;
```

### 4.2 6-Flavor Atmospheric Chromatic Palette
| Flavor ID | Flavor Name | Primary Hue | Secondary Hue | Accent Atmospheric Bloom |
| :--- | :--- | :--- | :--- | :--- |
| `double-litchi` | Double Litchi | `#3D2B68` | `#9089D3` | `rgba(144, 137, 211, 0.16)` |
| `coco-citron-vert` | Coco Citron Vert | `#27326B` | `#00A6E2` | `rgba(0, 166, 226, 0.16)` |
| `kiwi-concombre` | Kiwi Concombre | `#024A44` | `#71BD96` | `rgba(113, 189, 150, 0.16)` |
| `peche-blanche` | Pêche Blanche | `#BA5200` | `#EFB36B` | `rgba(239, 179, 107, 0.16)` |
| `pomme-rhubarbe` | Pomme Rhubarbe | `#9B0984` | `#E6A0E8` | `rgba(230, 160, 232, 0.16)` |
| `abricot-framboise` | Abricot Framboise | `#800035` | `#FF659D` | `rgba(255, 101, 157, 0.16)` |

### 4.3 3D Lighting Rig Specifications
- **Key Light**: Directional Light (`#ffffff`, Intensity `2.0`), angle `(3.2, 5.0, 4.2)`. Renders crisp label highlights.
- **Rim / Edge Light**: Dynamic Spot (`Flavor Secondary Color`, Intensity `2.6`), angle `(-4.5, 3.8, -2.5)`. Defines can silhouette against obsidian void.
- **Fill Light**: Directional Light (`#9cb2c8`, Intensity `0.95`), angle `(-2.8, -1.0, 3.0)`. Lifts shadow detail.
- **Hemisphere Ambient**: Sky `#384252`, Ground `#0a0b0e`, Intensity `0.40`. Prevents muddy blacks.
- **HDRI Environment**: `hdri2.hdr` Equirectangular map with exposure `1.05`, generating realistic brushed aluminum reflections on top/bottom chimes.

---

## 5. Elimination of Accidental Empty Space

### 5.1 Root Causes Diagnosed
1. **Unconstrained Viewport Sizing**: Previous sections used `min-height: 100vh` on short textual content (e.g. Profile factual grid, Argument summary), causing 400–600px of barren black emptiness between readable text.
2. **Disconnected Scroll Triggers**: Large gap regions where 3D cans transitioned between sections before DOM copy entered the viewport.
3. **Padded CSS Wrappers**: Cumulative `4rem` to `6rem` vertical padding compounding on top of `min-height: 100vh`.

### 5.2 Geometric Remedy & Precision Rules
1. **Content-Driven Section Heights**:
   - `HeroCarousel`: strictly `100vh` with fixed can lockup.
   - `ProfileSection`: `min-height: 80vh`, padding `clamp(3rem, 5vh, 5rem) 0`.
   - `BenefitsSection`: 4 sequential sticky chapters sharing a pinned stage, with zero dead vertical gaps between transitions.
   - `ArgumentSection`: `min-height: 70vh`, tight optical lock around can center.
   - `FullGammeSection`: `min-height: 85vh`, active interaction zone for all 6 flavors.
   - `ShopPage` & `ProductDetailPage`: Fluid layout adjusting to catalog items and specification tables.
2. **Continuous Visual Rhythm**: Every vertical scroll distance of 100px triggers progressive motion (camera shift, axial spin, or textual reveal) ensuring the user is never scrolling through dead void.

---

## 6. Preloader Rebuild Specifications

- **Container**: Fixed `#000000` overlay, `z-index: 9999`.
- **Lockup**: Minimal Ciao Energy typographic mark (`Geist Mono`, tracked `0.24em`).
- **Status Indicator**: Hairline line loader (`height: 1px`, `background: rgba(255,255,255,0.18)` with `width: 0% -> 100%` filled by active flavor accent).
- **Progress Counter**: Monospace 3-digit format (`000` to `100%`).
- **Micro-Status**: Factual system indicator: `INITIALIZING EXPERIENCE / 001 - CAN SHADER COMPILED / 002 - TEXTURES LOADED`.
- **Exit Sequence**: Counter reaches `100%` $\to$ line glows with accent color $\to$ preloader scales smoothly (`1.02`) and fades to `opacity: 0` (`600ms cubic-bezier(0.16, 1, 0.3, 1)`), unlocking camera glide into Hero.

---

## 7. Product Detail Hotspots Architecture

- **Subtle Radial Markers**: 4 interactive hairline pulsars on the can surface:
  1. `Hotspot 01: Opercule & Scellé` — Aluminium brossé 100% recyclable à l'infini.
  2. `Hotspot 02: Arômes & Recette` — 100% arômes naturels, sans sucres raffinés ni taurine.
  3. `Hotspot 03: Énergie Propre` — 80mg caféine naturelle issue de grains de café vert.
  4. `Hotspot 04: Signature Visuelle` — Design sérigraphié mat tactile anti-dérapant.
- **Interaction Contract**:
  - Desktop: Hover triggers a floating glassmorphic tooltip with hairline border and flavor accent pill.
  - Mobile: Tap opens a concise bottom sheet card with dismissal button and full accessibility label.
  - Keyboard: Tab reachable with `aria-expanded` and `role="button"`.

---

## 8. Multi-Viewport Responsive Matrix

| Viewport Width | Can Scale | Can Placement ($x, y, z$) | Grid System | Commerce Drawer Mode |
| :--- | :--- | :--- | :--- | :--- |
| **1920px (Desktop Ultra)** | `1.92` (Hero) / `0.85` (PDP) | Centered / PDP: $(-1.8, 0, 8.2)$ | 12-column, 4% inset | 480px Slide-Over Right Drawer |
| **1440px (Desktop Standard)**| `1.85` (Hero) / `0.82` (PDP) | Centered / PDP: $(-1.6, 0, 8.2)$ | 12-column, 4% inset | 440px Slide-Over Right Drawer |
| **1280px (Desktop Compact)** | `1.75` (Hero) / `0.78` (PDP) | Centered / PDP: $(-1.4, 0, 8.2)$ | 12-column, 4% inset | 400px Slide-Over Right Drawer |
| **1024px (Tablet Landscape)** | `1.55` (Hero) / `0.70` (PDP) | Centered / PDP: Stacked | 8-column, 32px inset | 380px Slide-Over Right Drawer |
| **768px (Tablet Portrait)**  | `1.38` (Hero) / `0.65` (PDP) | Centered / PDP: Stacked | 6-column, 24px inset | Fullscreen / Bottom Sheet |
| **430px (iPhone 14/15 Pro Max)**| `1.15` (Hero) / `0.58` (PDP)| Centered / PDP: Top 45vh | 4-column, 16px inset | Full-Height Bottom Sheet |
| **390px (iPhone 13/14 Standard)**|`1.08` (Hero) / `0.54` (PDP)| Centered / PDP: Top 42vh | 4-column, 16px inset | Full-Height Bottom Sheet |
| **375px (iPhone SE / Compact)** | `1.00` (Hero) / `0.50` (PDP)| Centered / PDP: Top 40vh | 4-column, 16px inset | Full-Height Bottom Sheet |
