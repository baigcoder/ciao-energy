# Ciao Energy — Master Performance Report

**Date:** 2026-09-30

## Architecture and measurements

- One persistent Three.js renderer and one can scene serve home, shop, and product pages.
- Local can GLB, six AVIF label textures, metal/spot textures, and HDRI are used. Procedural can labels and a generated studio environment are immediate fallbacks.
- The scene has a perpetual RAF loop; it skips rendering while the tab is hidden/context lost. It does not stop scheduling RAF callbacks while hidden.
- Flavor and scroll transforms are applied directly to scene objects; React receives scroll progress quantized to one percentage point rather than one render per scroll pixel. Full performance trace, FPS, GPU memory, and frame-time percentiles were not measured.
- Latest production build: JS 894.73 kB raw / 253.20 kB gzip; CSS 69.05 kB raw / 13.00 kB gzip; Vite warns the JS chunk exceeds 500 kB. Build completed in 2.37 s on the current environment.
- No performance claim such as sustained 60 FPS is made.

## Work completed

- Range state now shows the selected can rather than rendering all carousel duplicates as a swirl.
- Shop uses the existing renderer for one introduction can, then hides it after the introduction.
- Six transparent 2160 × 3840 WebP product packshots are used in the shop shelf and as the PDP WebGL fallback. Together they add 687,192 bytes; collection images load lazily. The one-off renderer only enables `preserveDrawingBuffer` for export URLs, leaving normal sessions unchanged.
- Atmospheric CSS animations were removed; reduced-motion disables decorative effects. Product scene quality is lowered when `prefers-reduced-motion` is active.

## Not measured / remaining

- Real-device sustained scroll performance, GPU memory, texture residency, low-memory behavior, context-loss recovery, and network throttling were not measured in this turn.
- The 893.64 kB JavaScript bundle remains a code-splitting opportunity; no dynamic import was added because route-level loading needs a separate architecture change and visual/3D boundaries must stay stable.
