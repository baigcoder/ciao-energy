# CIAO ENERGY — PERFORMANCE MODEL & RUNTIME BUDGETS

## 1. Frame Budget & Target Metrics

| Device Category | Target FPS | Max DPR | Instanced Cans | Shaders / Materials | Post-Processing | Render Target Type |
|:---|:---|:---|:---|:---|:---|:---|
| **High GPU Desktop** (Discrete GPU) | 60 fps | 1.5 | 24 | Physical PBR (Clearcoat, Sheen, PMREM) | UnrealBloom (0.1, 0.1, 1), SMAAPass, OutputPass | HalfFloatType |
| **Standard Laptop / Mid GPU** | 60 fps | 1.5 | 24 | Standard PBR | OutputPass | HalfFloatType |
| **Tablet** (iPad / Android Tab) | 60 fps | 1.5 | 12 | Standard PBR | OutputPass | UnsignedByteType |
| **Mobile / Low-Power** (iOS / Android) | 60 fps | 2.0 (capped) | 12 | Standard PBR (no clearcoat) | OutputPass (no Bloom, no SMAA) | UnsignedByteType |
| **Reduced-Motion Mode** | 60 fps | 1.0 | 1 (static) | Standard PBR | OutputPass | UnsignedByteType |

---

## 2. Resource Management Discipline
1. **Single WebGL Context**:
   - Only ONE `THREE.WebGLRenderer` instance mounted in `<main>`.
   - Never create independent canvases for sections.
2. **WebGL Context Loss Recovery**:
   - `webglcontextlost` event listener sets `contextLost = true`, cancels render loop ticks to prevent console panics.
   - `webglcontextrestored` rebuilds render targets and resumes render loop seamlessly.
3. **No Per-Frame Allocations**:
   - Vectors, matrices, rays, and color objects allocated statically outside the `animate()` RAF loop.
   - Zero object allocations or array spread operations inside render ticks.
4. **No React Re-renders on Scroll/Pointer**:
   - Mouse parallax, scroll position, and carousel lerping update Three.js object transforms and CSS variables directly via refs or `gsap.quickTo`.
   - React state never updates at 60Hz.
5. **Offscreen & Tab-Hidden Throttling**:
   - When the browser tab is hidden (`document.visibilityState === 'hidden'`), the animation frame loop pauses rendering.
   - Background video loops pause immediately when their containing section scrolls out of the viewport.
6. **Disposal Lifecycle**:
   - If the component unmounts, all geometries (`geometry.dispose()`), materials (`material.dispose()`), textures (`texture.dispose()`), and render targets (`renderTarget.dispose()`) are systematically cleared.
