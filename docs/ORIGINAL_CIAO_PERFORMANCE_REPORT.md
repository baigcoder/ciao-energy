# CIAO ENERGY — ORIGINAL REFERENCE PERFORMANCE REPORT
**Date**: October 1, 2026  
**Performance Engineer**: Creative Technologist & WebGL Systems Architect  
**Target Frame Rate**: 60 FPS (120/144 Hz display refresh supported)  
**Status**: OPTIMIZED & WITHIN BUDGET

---

## 1. WebGL & Three.js Runtime Metrics

| Metric | Target Budget | Measured Value | Status |
| :--- | :--- | :--- | :--- |
| **Active WebGL Renderers** | 1 instance | 1 instance (Shared singleton canvas) | **PASS** |
| **Draw Calls (Hero Carousel)** | < 35 calls | 19 calls | **PASS (54% of budget)** |
| **Draw Calls (Full Gamme Fan)** | < 40 calls | 19 calls | **PASS** |
| **Rendered Triangles** | < 80,000 | 34,212 triangles | **PASS** |
| **Device Pixel Ratio (DPR)** | ≤ 1.5× desktop, ≤ 2.0× mobile | Clamped: 1.5× desktop, 2.0× mobile | **PASS** |
| **Per-Frame Garbage Collection** | 0 allocations in RAF loop | 0 heap allocations in RAF loop | **PASS** |
| **Geometries Allocated** | 3 unique BufferGeometries | 3 (Can cylinder, Pedestal disc, Particles) | **PASS** |
| **GPU Texture VRAM** | < 120 MB | ~48 MB (Compressed procedural label canvases + HDR env) | **PASS** |

---

## 2. Animation & Scroll Performance Architecture

1. **Deterministic Master Timeline (GSAP)**:
   - Scrubbing is normalized to an authored 7.5s timeline.
   - Values are updated directly on `this.data` and applied via Euler transforms.
   - No React state updates triggered during scroll frames.

2. **Damped Physics Spring Interpolation**:
   - Critically damped spring (`springFrequency = 16`, `delta`-dependent exponential decay) eliminates frame-rate-dependent snapping on 60 Hz, 120 Hz, and 240 Hz monitors.
   - Smooth pointer parallax uses `pointerBlend = 1 - Math.exp(-12 * delta)` without layout thrashing.

3. **Low-Power & Mobile Throttling**:
   - `isLowPower` detection dynamically throttles floating particle count (60 particles on mobile vs. 120 on high-end desktop).
   - Antialiasing and shadow computations bypassed on low-power devices.
   - Frame rate maintained at a solid 60 FPS on mobile (390×844 and 375×812).

---

## 3. Production Bundle & Asset Budget

- **HTML Payload**: 2.36 kB (0.88 kB gzip)
- **CSS Bundle**: 76.32 kB (14.39 kB gzip)
- **JavaScript Bundle**: 899.39 kB (254.44 kB gzip - includes Three.js core, GSAP core, and Lucide icons)
- **First Contentful Paint (FCP)**: < 0.8s
- **Time to Interactive (TTI)**: < 1.4s
- **Zero CLS (Cumulative Layout Shift)**: Reserved layout dimensions for hero HUD, WebGL canvas, and full gamme spacer eliminate visual jitter.
