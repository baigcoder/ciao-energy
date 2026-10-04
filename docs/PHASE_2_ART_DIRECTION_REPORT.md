# CIAO ENERGY — PHASE 2 ART DIRECTION REPORT

## Executive Summary
This report documents the comprehensive art-direction pass and visual hierarchy reconstruction for the Ciao Energy digital product theatre (`https://www.ciaoenergy.com/`), resolving all visual defects identified in Phase 1 and elevating the experience from a functional Three.js landing page to a cinematic, reference-grade brand experience.

---

## 1. Systemic Art Direction Corrections

### Defect 1: Preloader Logo Vertical Distortion & Clipping
- **Symptom**: The preloader emblem was vertically stacked (`CIAO` above `ENERGY`), severely clipped at the top/bottom boundaries, and distorted by inherited transform styles.
- **Root Cause**: SVG had a portrait `viewBox="0 0 140 380"` with an internal `rotate(-90deg)` transform and mismatched CSS `aspect-ratio: 140/380`, violating the horizontal brand emblem specification.
- **Fix**: Rebuilt `src/components/Preloader.tsx` from first principles with a clean horizontal lockup (`viewBox="0 0 460 52"`), crisp italic black typography, precise percentage counter ($0 \to 100\%$), and a hairline progress indicator on pure black (`#000000`) canvas.
- **Result**: Immediate, unclipped horizontal brand lockup reading "CIAO ENERGY" with zero layout shift and smooth exit fade.

---

### Defect 2: Hero Product Hierarchy & Secondary Can Competition
- **Symptom**: Central can was visually modest (~27% viewport height), while flanking cans occupied equal visual weight and competed heavily for focal dominance.
- **Root Cause**: Uniform `canScale: 1.15` applied across all cans regardless of wave distance; wave Z-offset did not sufficiently push secondary cans into depth.
- **Fix**: 
  - Calibrated central hero can scale to `1.92`, establishing unambiguous focal dominance at $46\%$ viewport height (matching the $44–48\%$ specification).
  - Implemented dynamic scale attenuation for flanking cans: `heroScale = 1.92 * (0.64 + 0.36 * p)` where $p = \max(0, 1 - |x|/\text{spacing})$. Flanking cans taper down to scale $1.23$.
  - Deepened secondary can Z-push: `canPosZ = (-(Math.abs(x) * 1.6 + 0.3)) * wave`.
  - Restored authentic hero dynamic rotation tilt: `(-20°, -20°, 22.5°)`, fixing an erroneous `/ 360` divisor.
- **Result**: Central can is unequivocally the hero protagonist. Flanking cans form a soft, deep spatial arc that frames the center without competing.

---

### Defect 3: Flat Studio Lighting & Excessive Background Gradient Wash
- **Symptom**: The product environment felt flat and purple-washed; can surface lacked metallic chimes, edge definition, and specular rim separation.
- **Root Cause**: Over-reliance on a high-opacity CSS conic gradient (`opacity: 0.35`) combined with low directional lighting and flat ambient illumination.
- **Fix**:
  - Rebuilt studio lighting rig with calibrated 5-point architecture:
    - **Key Light**: `0xfffaed` warm directional light at `(4, 7, 7)`, intensity `2.0`.
    - **Rim Light**: `0xeef4ff` cool directional back light at `(-2, 8, -6)`, intensity `2.6`, grazing top chimes and edge profiles.
    - **Fill Light**: `0xd5e2f0` soft side fill at `(-6, -1, 5)`, intensity `0.95`.
    - **Hemisphere & Ambient**: Grounded soft fill at intensities `0.40` and `0.35`.
    - **Focused Dynamic Spots**: `spot1` and `spot2` at intensity `48` for hero highlights.
  - Toned down CSS conic gradient opacity from `0.35` to `0.18` with $100\text{px}$ blur, making it a subtle dark vignette rather than an overwhelming purple wash.
- **Result**: Deep specular reflections across brushed aluminum chimes, rich saturated label artwork, and high-contrast volumetric studio depth.

---

### Defect 4: Profile Section Can Clipping & "Card UI" Enclosure
- **Symptom**: Profile can scaled excessively, causing lower-body chime clipping at the viewport bottom; editorial copy was trapped inside a heavy, dark glassmorphic box ("card UI").
- **Root Cause**: Camera FOV was set to $40^\circ$ at $z=6$ with `canPosY: -0.5`, placing the can bottom near the frustum floor; copy container had heavy padding, borders, and backdrop-filter blur.
- **Fix**:
  - Calibrated Profile 3D composition: `camPosZ: 7.2, fov: 34, canScale: 0.95, canPosX: 0.72, canPosY: -0.10, canPosZ: 0.2`.
  - Removed enclosed card UI: copy now floats seamlessly in the dark spatial environment with minimal corner ticks, open line length ($32\text{rem}$), and clean specs grid with hairline dividers.
- **Result**: Zero lower-body clipping with generous top/bottom safe margins. The editorial layout and 3D can form a magazine-grade asymmetric spread.

---

### Defect 5: Benefit Storytelling & Right Nav Synchronization
- **Symptom**: Benefit transitions lacked physical continuity; comparison pills did not dynamically reflect scroll state; right rail was generic.
- **Root Cause**: Independent scroll thresholds; benefit spin was not aligned with nutrition panel UV coordinates.
- **Fix**:
  - Synchronized axial spins for all 4 chapters ($120^\circ \to 140^\circ \to 160^\circ \to 180^\circ$) to bring specific technical label callouts directly into the studio spot focus (`spotY: 2.5, intensity: 45`).
  - Animated strikethrough comparison pills with `scaleX(1)` transition upon entering chapter.
  - Scoped right navigation rail visibility strictly to the Benefits scroll range with active glow feedback.
- **Result**: A continuous 4-chapter narrative journey from obsolete energy drink standards to clean Ciao Energy alternatives.

---

### Defect 6: ZERO BULLSHIT Oversized Typography Integration
- **Symptom**: Enormous vector text overlaid the page abruptly without depth integration, obscuring the product.
- **Root Cause**: Text rendered at full scale with heavy drop shadow and full opacity without depth plane coordination.
- **Fix**:
  - Controlled SVG scale: `max-width: 86vw, 980px`, `max-height: 38vh`.
  - Positioned 3D can in focal depth plane: `camPosZ: 7.5, fov: 38, canScale: 1.08, canPosY: -0.2, canPosZ: -0.2`.
  - Subdued background loop video to `opacity: 0.22` with contrast/brightness balancing.
- **Result**: Balanced manifesto presentation where the 3D can stands prominently as the physical manifestation of the "Zero Bullshit" philosophy.

---

### Defect 7: Full Gamme Packshot Fan Arrangement
- **Symptom**: Full gamme cans clustered irregularly without clear flavor identification.
- **Root Cause**: Linear swirl formula lacked forward arc curvature.
- **Fix**:
  - Engineered collector fan layout:
    - `canRotX += (x * 0.08 * windowRatio + 0.15 - canRotX) * swirl;`
    - `canPosZ += (Math.cos(x * 1.2) * 1.2 - canPosZ) * swirl;`
    - `canPosY += (-Math.abs(x) * 0.12 - canPosY) * swirl;`
  - Integrated 6 interactive flavor pills with direct-jump selection and primary flavor accent dots.
- **Result**: A pristine 6-can collector packshot where every can is individually legible and interactively selectable.
