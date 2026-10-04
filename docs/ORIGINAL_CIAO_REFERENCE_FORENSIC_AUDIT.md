# CIAO ENERGY — ORIGINAL REFERENCE FORENSIC AUDIT
**Document Status**: Authoritative Pre-Implementation Forensic Audit  
**Date**: October 1, 2026  
**Reference Source**: Live Production Authority (`https://www.ciaoenergy.com/`) + Live DOM/WebGL Extracted Architecture  
**Local Codebase**: `f:\ciao-energy-antigravity-spec`

---

## 1. Executive Summary & Architecture Forensic Findings

A comprehensive comparative audit between the official production website (`https://www.ciaoenergy.com/`) and the current local codebase reveals that while the local application has implemented functional 3D rendering and ecommerce routing, **critical art-direction, spatial composition, camera choreography, and lighting formulas have deviated significantly from the reference.**

The original Ciao Energy site is an austere, high-contrast, physical product theatre. The canvas is pure black (`#000000`), punctuated only by subtle, localized flavor bloom, razor-sharp white/silver editorial typography, hairline vector HUD instrumentation, and a dominant, photorealistic 3D aluminum can.

In contrast, the current local build suffers from:
1. **Severe 3D hero scale and position distortion**: The hero can scale was inflated (`canScale: 1.92` vs reference `1.2`), and vertical position offsets pushed the lower third of the can directly over the display title ("DOUBLE LITCHI").
2. **Pedestal and ceiling cap dominance**: The ceiling cap and floor pedestal were oversized and illuminated by an extra 55-intensity spotlight, directly competing with the product rather than remaining a subtle frame.
3. **Secondary can clutter and visual noise**: Surrounding carousel cans crowd the hero can with unnatural angles (+7° pitch, -0.17 rad roll) and flat lighting, creating visual noise rather than an elegant receding wave.
4. **Header clutter and logo displacement**: Extra commerce pills and action buttons (`BOUTIQUE`, search icon, cart counter) were added directly into the global header bar, crowding the centered Ciao Energy logo and destroying the minimal reference utility balance (`[ ON |||| ]` — `[ LOGO ]` — `[ :: MENU ] [ CONTACT ]`).
5. **DOM scroll vs Fixed overlay architecture mismatch**: The reference uses fixed, full-viewport layer containers (`.gamme_container`, `.profile_container`, `.benefits_container`, `.argument_container`) controlled via opacity crossfades against scroll spacer sections (`min-height: 125svh`). The local app allowed DOM sections to scroll upward through the fixed canvas, resulting in text overlapping the logo and clipping through the canvas.
6. **Full Gamme (Packshot) Swirl Collapse**: In `sceneManager.ts`, the swirl calculation collapsed cans into a single vertical stack of rings (observed in `08_full_gamme.png`), rather than the authentic 6-can collector fan arc (`spacing: 0.47`, `swirl: 1`, `camPosZ: 20`).
7. **Shop and Cart visual detachment**: The shop cards displayed blurry placeholder gradient squares instead of the available 4K product packshots, disconnecting commerce from the product film aesthetics.

---

## 2. Forensic Analysis by Category

### A. Viewport Composition & Layout Structure
- **Reference**:
  - The viewport is framed by four corner ticks (`.corner-left`, `.corner-right`) and hairline HUD framing markers (`viewBox="0 0 9 9"`).
  - All editorial chapters (`.gamme_container`, `.profile_container`, `.benefits_container`, `.argument_container`, `.carousel_title-bis-wrapper`) are `position: fixed; inset: 0`.
  - The DOM `<section>` elements act strictly as scroll track spacers (`min-height: 125svh`, `pointer-events: none`).
  - Cross-fading is driven by GSAP ScrollTrigger timelines toggling container visibility (`autoAlpha: 0 → 1`), ensuring text never collides with the fixed header or 3D canvas during scrolling.
- **Current Local**:
  - Components were rendered as flow DOM elements with relative/absolute positioning.
  - As the user scrolled, the previous section text translated upward directly behind the fixed header and over the 3D can, causing severe collisions (e.g. `02_profile.png` shows "LITCHI" overlapping the header logo).
- **Root Cause**: Architecture did not adopt the reference's fixed-container overlay model.

### B. Typography & Text Safe Zones
- **Reference**:
  - Display Header: `Franklin Gothic Atf` 900 Italic Uppercase (`clamp(2.5rem, 4.167vw, 4.5rem)`), tight line-height (`0.92`).
  - Text Safe Zone in Hero: Sits in the lower third of the viewport (68%–88% vertical range), completely below the bottom rim of the can.
  - Character Masking: Headings use line and character masks (`overflow: hidden`) animated with `yPercent: 110 → 0` via SplitText.
- **Current Local**:
  - Hero title was centered vertically and rendered directly over the 3D can body, obscuring product labels.
  - Transitions were simple opacity fades or instant re-renders.

### C. 3D Scene Architecture & Geometry
- **Reference**:
  - Persistent Three.js scene, PerspectiveCamera with FOV 20°, positioned at `(0, 0, 29)`.
  - Can dimensions: 250ml sleek aluminum can geometry (`can.glb`).
  - Carousel wave: 24 cans (desktop) or 12 cans (mobile).
  - Wave formula:
    `canPosX = x * data.spacing` (spacing = 3.5)
    `canPosY = Math.sin(canPosX * wave)`
    `canPosZ = (Math.abs(x) * -1 - 0.2) * data.wave`
    `canRotX = (-20° * π/180) * data.wave`
    `canRotY = (canPosX * 0.5 - 20° * π/180) * data.wave`
    `canRotZ = (22.5° * π/360) * data.wave`
    `canScale = 1.2`
- **Current Local**:
  - Custom arbitrary rotations (`canRotX: +7°`, `canRotZ: -0.17 rad`) and inflated scale (`1.92`) broke the elegant wave curve and crowded the screen.

### D. 3D Materials & Label Shading
- **Reference**:
  - Can Body/Rim: `metalness: 0.9`, `roughness: 0.2`, `sheen: 0.8`, `clearcoat: 1.0`, `clearcoatRoughness: 0.1`, `ior: 2.0`, `envMapIntensity: 3.0`, `metalnessMap: can-metallic-2.avif`.
  - Label: `metalness: 0.9`, `roughness: 0.2`, `sheen: 0.05`, `clearcoat: 0.5`, `clearcoatRoughness: 0.3`, `ior: 2.0`, `envMapIntensity: 1.0`, `SRGBColorSpace`.
  - Tint Shader: Custom `applyEnvironmentTint` injection modulating indirect diffuse and indirect specular by `tintColor * tintStrength`.
- **Current Local**:
  - Shell material brightness was manually scaled down to 0.30 on side cans with harsh steps, turning secondary cans into flat dark silhouettes.
  - Center can had excessive direct directional light (`spot3: 96` + `keyLight: 2.35`), washing out printed graphics.

### E. Lighting Rig
- **Reference**:
  - Key Spot 1 (`spot1`): `(0, 3.5, 0)`, target `(0, 0, 1)`, intensity 50, angle `π / 4`, distance 8.
  - Rim Spot 2 (`spot2`): `(0, -3, 2)`, target `(0, 0, 1.8)`, intensity 50, angle `π / 3`, distance 8.
  - Focus Spot 3 (`spot3`): `(0, 3, 5)`, target `(0, 0.5, 0)`, distance 15, angle `π / 8`, intensity 0 in hero, 35 in benefits, mapped with `spot-mask.avif`.
  - HDRI: `hdri2.hdr` equirectangular reflection map.
- **Current Local**:
  - Redundant point light (`pointerLight: 12`), redundant ceiling spot (`ceilingSpot: 55`), oversized directional lights, creating conflicting specular glares and washed out highlights.

### F. Pedestal and Ceiling Fixtures
- **Reference**:
  - Floor and ceiling discs are instances of `base.glb`.
  - Positioned via `base.children[0].position.y = -1 * data.baseOffset` and `base.children[1].position.y = 1 * data.baseOffset`.
  - In hero state: `baseOffset: 0` or retracted out of immediate focus, allowing the can to float cleanly.
- **Current Local**:
  - Hardcoded floor at `y = -1.72` and ceiling at `y = 1.0`, crowding the can top and bottom.

### G. Brand Logo & Header Integration
- **Reference**:
  - Pure white vector SVG `Ciao-Energy_logo.svg` (138px × 34px), centered horizontally at `left: 50%; transform: translateX(-50%)`.
  - Sits directly below top margin with ample negative space.
  - Header controls strictly: Left `[ ON |||| ]`, Center `[ LOGO ]`, Right `[ :: MENU ]` + `[ CONTACT ]` pill.
  - Thin scroll progress hairline (`.scroll_indicator`) runs continuously along the top border.
- **Current Local**:
  - Cluttered with extra ecommerce controls (`BOUTIQUE` button, search magnifying glass, cart bag with badge), destroying brand presence.

### H. Liquid Slider & Flavor Navigation
- **Reference**:
  - Sits below the flavor title in hero: width 440px (viewBox `0 0 1000 40`).
  - SVG bar filled with multi-stop linear gradient (`#9089D3` → `#00A6E2` → `#71BD96` → `#EEB169` → `#E59DE6` → `#FF659D`).
  - Draggable liquid dot with `feGaussianBlur` (stdDev 4) + `feColorMatrix` liquid filter.
  - Snaps smoothly to nearest flavor on release.
  - When wrapping around ends (0 ↔ 5), dot scales to 0, slides out `±150px`, teleports, and springs in.
- **Current Local**:
  - Slider was floating disconnectedly below the huge can without proper text framing or smooth liquid wrap animations.

### I. Argument / "Zero Bullshit" Section
- **Reference**:
  - Monumental custom SVG mark `viewBox="0 0 1314 405"` with liquid blur mask (`zero-bullshit-mask.svg`).
  - Layered video background stack playing silent effervescent loop for active flavor.
  - Can moves to `(0, 0, -0.5)`, FOV 45°, `canRotX: -20°`, `canRotZ: -5°`.
- **Current Local**:
  - Replaced with standard DOM text `ZERO BULLSHIT` in huge font overlapping the can body with visible horizontal border seams.

### J. Full Gamme Section
- **Reference**:
  - Packshot collector fan: `camPosX: -3`, `camPosY: -3.5`, `camPosZ: 20`, FOV 30°, `spacing: 0.47`, `swirl: 1`.
  - All 6 cans fan out in an elegant arc around camera focus.
- **Current Local**:
  - All cans collapsed into a single column of overlapping rings.

### K. Shop, Product Detail, and Cart (Commerce Integration)
- **Reference & PRD Requirement**:
  - Seamless continuation of the product theatre.
  - Cards and detail views must feature genuine 3D renders / 4K packshot photography (`public/products/4k/*.webp`).
- **Current Local**:
  - Product cards and cart drawer displayed fuzzy gradient squares with plain text instead of real product images.

---

## 3. Discrepancy & Root Cause Matrix

| ID | Area | Reference Behavior | Current Local Behavior | Root Cause | Priority |
|:---|:---|:---|:---|:---|:---|
| **D-01** | Hero Can Scale & Safe Area | Can scale 1.2, occupies ~45% viewport height, floating with clear margin above title | Can scale 1.92, overlaps "DOUBLE LITCHI" title directly | Inflated `canScale` and incorrect vertical translation offset | **P0** |
| **D-02** | Hero Title Collision | Title is in lower third (y: 68%–88%), framing can from below | Title rendered behind/under lower third of 3D can | `gamme_hud_bottom` layout positioning not respecting text safe zone | **P0** |
| **D-03** | Section Transitions & Scroll Overlap | Sections use fixed overlay containers (`position: fixed; inset: 0`) that fade via GSAP | Sections scroll vertically as flow elements, causing text to scroll over header & canvas | Flow DOM layout instead of fixed overlay track architecture | **P0** |
| **D-04** | Full Gamme Swirl | 6 cans fan out in a wide collector arc (`spacing: 0.47`, `swirl: 1`) | Cans collapse into a single vertical stack of rings | Incorrect swirl X-coordinate mapping in `sceneManager.ts` | **P0** |
| **D-05** | Lighting Overexposure | Balanced studio key/rim spots (50 intensity, 8 distance), soft falloff | Washed out white labels, blown highlights, harsh shadows | Key light (2.35) + spot1 (65) + spot2 (60) + spot3 (96) + pointerLight (12) all firing simultaneously | **P0** |
| **D-06** | Secondary Can Clutter | Secondary cans form an elegant receding wave curve with natural falloff | Cans crowded close to hero with steep unnatural pitch (+7°) and harsh tilt | Wave formula altered from reference; spacing/rotations out of sync | **P1** |
| **D-07** | Ceiling & Floor Fixture Dominance | Base fixtures subtle/retracted, integrating with lighting | Large chrome discs float directly above and below can with dedicated spot | Hardcoded `y` coordinates and scale in `sceneManager.ts` | **P1** |
| **D-08** | Header Clutter | Sparse luxury utility: Sound, centered Logo, Menu, Contact pill | Extra `BOUTIQUE`, search icon, cart button crowding header | Redundant commerce buttons placed directly in primary header row | **P1** |
| **D-09** | Shop & Cart Product Imagery | Genuine product visual on each card and cart line item | Blurry colored gradient squares without can renders | Image URLs pointing to missing or invalid sources instead of `/products/4k/*.webp` | **P1** |
| **D-10** | Argument / "Zero Bullshit" | Vector SVG with blur mask + background flavor video loop | Plain HTML display text overlapping can with harsh divider | Missing authentic SVG artwork and video container choreography | **P1** |
| **D-11** | Preloader Sequence | Clean black canvas → video/counter → smooth curtain sweep | Video sometimes delayed, instant jump into scene | Missing deterministic GSAP timeline coordination with WebGL readiness | **P2** |
| **D-12** | Liquid Slider Hierarchy | Polished SVG slider with active fluid handle & wrap transition | Floating slider with basic drag and no end-wrap animation | Incomplete SVG filter and gsap wrap choreography | **P2** |

---

## 4. Architectural Remediation Plan

1. **Phase 1 — 3D Scene Calibration (`sceneManager.ts` & `canModel.ts`)**:
   - Restore authentic camera: FOV 20°, `pos: (0, 0, 29)`.
   - Restore authentic can wave formula: `canScale: 1.2`, `canRotX: -20°`, `canRotY: (x*0.5 - 20°)`, `canRotZ: 11.25°`.
   - Restore studio lighting rig: `spot1: 50`, `spot2: 50`, `spot3: 0` (hero) / `35` (benefits). Remove redundant pointer light and ceiling spotlight blinding the scene.
   - Retract base fixtures to reference positions (`baseOffset`).
   - Fix swirl fan formula for Full Gamme so all 6 cans form the authentic collector arc.

2. **Phase 2 — Global Header & Logo Cleanup (`CiaoHeader.tsx` & `header.css`)**:
   - Restore reference utility composition: Left audio toggle, Center logo, Right Menu + Contact pill.
   - Integrate Shop and Cart cleanly into the Menu drawer and unobtrusive top utility actions without crowding the brand mark.
   - Ensure the Ciao Energy logo SVG is centered, unclipped, and rendered with crisp white fill.

3. **Phase 3 — Fixed Overlay Architecture & Section Staging (`App.tsx` & `sections.css`)**:
   - Anchor `.gamme_container`, `.profile_container`, `.benefits_container`, `.argument_container`, `.carousel_title-bis-wrapper` to fixed viewport overlays (`position: fixed; inset: 0`).
   - Wire GSAP ScrollTrigger to crossfade container opacity (`autoAlpha`) as the user scrolls through spacer tracks, preventing text from scrolling over the logo or can.

4. **Phase 4 — Hero Typography & Liquid Slider (`HeroCarousel.tsx`)**:
   - Position flavor title cleanly in the lower third, below the 3D can rim.
   - Implement the authentic liquid filter SVG slider with smooth dragging and wrap animation.

5. **Phase 5 — Argument Section & Benefits Refinement (`ArgumentSection.tsx` & `BenefitsSection.tsx`)**:
   - Integrate the authoritative "ZERO BULLSHIT" SVG artwork with mask filter and flavor video backdrop.
   - Align benefit scenes with spot-mask lighting and strikethrough pill animation.

6. **Phase 6 — Commerce Integration (`ShopPage.tsx`, `ProductDetailPage.tsx`, `CartDrawer.tsx`)**:
   - Mount authentic 4K product packshots (`/products/4k/*.webp`) across all shop cards, detail views, and cart drawers.
   - Align typography, buttons, and spacing with the core brand theatre.

7. **Phase 7 — Verification & QA**:
   - Run typecheck, lint, test, and production build.
   - Validate multi-viewport visual screenshots with Playwright.
