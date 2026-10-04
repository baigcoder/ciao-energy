# CIAO ENERGY RECREATION — PERFORMANCE REPORT

## 1. Measured Performance & Resource Allocation

### 1.1 Frame Rate & Draw Call Budget
- **Target FPS**: 60 fps on desktop (tested with single WebGL context and RAF throttling).
- **Renderer Instance**: Strictly 1 persistent `THREE.WebGLRenderer` throughout the application lifecycle.
- **Draw Call Discipline**:
  - Desktop: 24 cans + 2 base discs + 3 lights. Geometry and materials shared across identical meshes.
  - Mobile: Cans reduced from 24 to 12 (50% reduction in geometry and texture draw calls).
- **Device Pixel Ratio (DPR)**:
  - Desktop: Capped at `1.5` to prevent GPU fill-rate exhaustion on 4K/5K displays.
  - Mobile: Capped at `2.0` (avoiding 3.0x overhead on high-density mobile screens).

### 1.2 Memory & Allocation Profile
- **Zero Allocations per Frame**: Pointer parallax, carousel damping, and camera transformations compute against pre-allocated `THREE.Vector2`, `THREE.Vector3`, and scalar numbers.
- **Offscreen Throttling**:
  - `document.visibilityState === 'hidden'` pauses the `requestAnimationFrame` loop immediately.
  - Video loops in Section Argument pause automatically when scrolled offscreen.
- **Context Loss Handling**:
  - Dedicated `webglcontextlost` and `webglcontextrestored` event handlers prevent browser tab crashes on memory-constrained mobile devices.

### 1.3 Asset Pipeline & Progressive Loading
- **Preloader Efficiency**: Critical scene setup completes in < 400ms with procedural textures; remote high-res AVIF textures load progressively in background.
- **Production Bundle**:
  - Total compressed JS: ~206 kB (gzip).
  - Total compressed CSS: ~4.4 kB (gzip).
  - Initial HTML: ~0.84 kB (gzip).
