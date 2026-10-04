# CIAO ENERGY — 3D RENDERING ROOT-CAUSE AUDIT

**Document Date**: September 30, 2026  
**Status**: Authoritative Forensic Diagnostic  
**Subject**: Critical 3D Rendering Failure & Visual Discrepancy against Live Reference (`https://www.ciaoenergy.com/`)

---

## 1. Executive Summary

A comprehensive, ground-up audit of the 3D rendering pipeline was conducted to identify the root causes of the severe visual rendering defects observed in the runtime screenshots. 

The failures are **not** minor aesthetic issues; they were caused by severe structural and architectural defects spanning:
1. Geometric tearing due to per-child transform mutations in the render loop.
2. Silent texture loading failure caused by missing CORS headers on remote CDN assets, falling back to an inverted procedural canvas.
3. Severe UV channel orientation mismatch (label drawn on the rear face $u=0.5$ facing away from the camera).
4. Physical material extinction caused by excessive metalness coupled with a dark procedural environment map and narrow spotlight cones.
5. Preloader SVG layout and typography clipping.
6. Ceiling and pedestal disc scale and clipping issues.

---

## 2. Root Cause Breakdown (Defect by Defect)

### Defect 1: Disconnected / Exploding Can Geometry (Floating Caps, Detached Rims)
- **Symptom**: In the hero, wave array, and profile sections, can caps, rolled rims, and neck tapers detach from the cylindrical body, floating independently in space at divergent angles. In the wave array, cans appear as dissected, unrolled fragments and hovering discs.
- **Root Cause**: In [sceneManager.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/sceneManager.ts#L636-L640):
  ```ts
  can.children.forEach((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.rotation.z = can.rotation.y * 0.6 + this.data.canSpin * p;
    }
  });
  ```
  Each procedural can was assembled from 6 individual child meshes (`bodyMesh`, `topNeckMesh`, `topRimMesh`, `topCapMesh`, `bottomTaperMesh`, `bottomCapMesh`). In Three.js, a cylinder's symmetry axis is $Y$. Setting `child.rotation.z` tilts each individual component mesh around its own local $Z$-axis. Because the top and bottom meshes have local vertical offsets ($y = \pm 1.34$, $\pm 1.43$), rotating them on $Z$ swings them wildly off-axis, causing complete structural disassembly of the can.
- **Remedy**:
  1. Replace the disjointed multi-mesh geometry with the authentic official Ciao Energy 3D asset [can.glb](file:///f:/ciao-energy-antigravity-spec/public/models/can.glb) (containing official `Shell`, `Top`, and `Bottom` meshes with factory-accurate chimes, rolled lip, recessed dome, and pull-tab).
  2. Implement a single, watertight procedural can geometry fallback where all vertices are part of a unified rigid hierarchy.
  3. Remove the per-child `rotation.z` mutation entirely. All rotational transforms (wave tilt, yaw, spin) are applied strictly to the parent can `Group` around its valid axes ($Y$ for axial spin, $X$/$Z$ for pitch and roll).

---

### Defect 2: Cans Render Pitch Black / Dark Silhouettes & Invisible Flavor Artwork
- **Symptom**: Cans render as deep purple-black silhouettes. Center can shows zero legible brand identity or flavor typography. Flanking cans in the wave curve are entirely black.
- **Root Cause Chain**:
  1. **CORS Failure on Remote Textures**: [sceneManager.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/sceneManager.ts#L254-L276) attempted to fetch remote AVIF textures from `https://cdn.skaald.com/`. Live network inspection confirmed that `cdn.skaald.com` returns `access-control-allow-origin: null`. The browser's WebGL texture loader blocked all remote image data due to cross-origin security rules. The error callback silently triggered fallback to `generateProceduralLabelTexture`.
  2. **180° Inverted Label UV Mapping**: In [canModel.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/canModel.ts#L33-L52), `generateProceduralLabelTexture` rendered the "CIAO ENERGY" brand text at coordinate $(512, 512)$ on a $1024 \times 1024$ canvas ($u = 0.5, v = 0.5$). In Three.js `CylinderGeometry`, $u = 0.5$ corresponds to angle $\theta = \pi$ (the exact **back** of the cylinder facing away from the camera). The front of the can facing the camera ($u = 0$ / $u = 1.0$) was completely blank background color. The entire brand label was literally facing backwards.
  3. **High Metalness with Dark Environment**: [canModel.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/canModel.ts#L75-L84) configured `MeshPhysicalMaterial` with `metalness: 0.7 - 0.9`. Highly metallic PBR surfaces suppress diffuse base color and rely entirely on specular reflections of the environment. The procedural environment in [sceneManager.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/sceneManager.ts#L164-L170) had a black bottom and dark horizon (`#060608` to `#111118`). With no bright studio softboxes in the environment, the metal reflected blackness.
- **Remedy**:
  1. Download all authentic high-resolution textures (`double-litchi.avif`, `coco-citron-vert.avif`, `Kiwi-Concombre.avif`, `peche-blanche.avif`, `pomme-rhubarbe.avif`, `abricot_framboise.avif`, plus metallic and spotlight masks) locally into [public/textures/](file:///f:/ciao-energy-antigravity-spec/public/textures/). Serving them locally eliminates all CORS issues, achieves instant loading, and guarantees offline reliability.
  2. Rewrite [canModel.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/canModel.ts) procedural label generation to use a $2048 \times 1024$ canvas with correct front-facing UV alignment ($u = 0 / 1$ and $u = 0.5$ correctly mapped to the can rotation), bold stylized typography, flavor badge, and 360° nutrition/barcode detail.
  3. Calibrate PBR material parameters to physical printed aluminum standards: printed can body ink requires a healthy diffuse response (`metalness: 0.55 - 0.65`, `roughness: 0.22 - 0.28`, `clearcoat: 0.4 - 0.6`), while unprinted chimes/rims use pure brushed aluminum (`metalness: 0.85 - 0.90`, `roughness: 0.20 - 0.25`).

---

### Defect 3: Flanking Cans Invisible (Spotlights Don't Reach the Wave Array)
- **Symptom**: Only the hero can receives light; cans to the left and right ($x = \pm 3.5, \pm 7.0, \dots$) drop off into complete blackness.
- **Root Cause**: The lighting rig in [sceneManager.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/sceneManager.ts#L217-L229) utilized only two spotlight cones directed at $(0, 0, 1)$ with narrow spread (`Math.PI / 3`). Spotlights have severe inverse-square distance falloff and angular cutoff. Any can located at $|x| > 3$ received zero direct light.
- **Remedy**:
  1. Construct a comprehensive studio lighting rig:
     - Broad soft Key Directional Light illuminating the frontal arc of the wave array.
     - Studio Rim / Back Directional Light providing continuous metallic edge highlights along the chimes and silhouettes of all flanking cans.
     - Ambient & Hemisphere Light tuned to provide subtle fill without flattening depth.
     - Dynamic focused spotlight preserved for the benefit ingredient inspection sections.
  2. Utilize the authentic studio HDRI [public/hdr/hdri2.hdr](file:///f:/ciao-energy-antigravity-spec/public/hdr/hdri2.hdr) via `RGBELoader` + `PMREMGenerator`, complemented by an optimized studio gradient fallback with high-luminance softbox reflectors.

---

### Defect 4: Preloader Logo Distorted & Overlapping ("CIAU" / "ENERGY" Clipped)
- **Symptom**: In the preloader, the "CIAO" text is vertically distorted, the bottom of the "O" overlaps and is cut by "ENERGY", and the aspect ratio does not match the clean, slender vertical brand emblem in the live reference.
- **Root Cause**: In [Preloader.tsx](file:///f:/ciao-energy-antigravity-spec/src/components/Preloader.tsx#L53-L85), the SVG `viewBox="0 0 100 240"` contained a `fontSize="100"` text element with `transform="rotate(-90 50 120)"` and a second `fontSize="26"` text element at `y="225"`. The bounding box of the rotated text exceeded the 240px vertical height and collided with the "ENERGY" text. Additionally, CSS styling on `.loader_emblem` constrained height without proper aspect preservation.
- **Remedy**:
  1. Re-engineer the preloader emblem SVG with exact typographic geometry, correct viewBox dimensions ($120 \times 320$), separated text baselines, and exact character tracking matching the live reference screenshot (`media_1790770742371.png`).
  2. Verify that "CIAO" and "ENERGY" render crisply without letter clipping or vertical distortion across all viewport scales.

---

### Defect 5: Ceiling Disc and Floor Pedestal Misalignment & Viewport Clipping
- **Symptom**: The ceiling disc appears as a generic bowl hovering over the can, and in the profile section, it clips directly through the header text "CIAO ENERGY".
- **Root Cause**: The procedural discs in `createBaseDiscs` were simplified cylinders (`CylinderGeometry(1.8, 1.6, 0.35)`). Furthermore, their vertical positions were not properly synchronized with the camera's field of view in profile mode.
- **Remedy**:
  1. Replace the procedural discs with the authentic industrial fixtures from [public/models/base.glb](file:///f:/ciao-energy-antigravity-spec/public/models/base.glb) (`top_base_metal` with concentric mechanical rings, and `bot_base_metal` with copper cables and metallic conduits).
  2. Calibrate `baseOffset` and camera clipping planes so the ceiling fixture anchors behind the header logo without obscuring typography.

---

## 3. Asset Inventory & Verification Table

| Asset | Local Path | Verified Size | Status |
|:---|:---|:---|:---|
| **Can 3D Mesh** | `/models/can.glb` | 162,956 bytes | Downloaded & Inspected (Nodes: `Shell`, `Top`, `Bottom`) |
| **Pedestal 3D Base** | `/models/base.glb` | 621,704 bytes | Downloaded & Inspected (Nodes: `top_base_metal`, `bot_base_metal`) |
| **Studio HDRI** | `/hdr/hdri2.hdr` | 1,429,581 bytes | Downloaded & Validated |
| **Metallic Texture** | `/textures/can-metallic-2.avif` | 35,092 bytes | Downloaded & Validated |
| **Spotlight Mask** | `/textures/spot-mask.avif` | 2,678 bytes | Downloaded & Validated |
| **Flavor 01 Texture** | `/textures/ciao-energy_texture_double-litchi.avif` | 192,030 bytes | Downloaded & Validated |
| **Flavor 02 Texture** | `/textures/ciao-energy_texture_coco-citron-vert.avif` | 243,750 bytes | Downloaded & Validated |
| **Flavor 03 Texture** | `/textures/ciao-energy_texture_Kiwi-Concombre.avif` | 236,899 bytes | Downloaded & Validated |
| **Flavor 04 Texture** | `/textures/ciao-energy_texture_peche-blanche.avif` | 204,252 bytes | Downloaded & Validated |
| **Flavor 05 Texture** | `/textures/ciao-energy_texture_pomme-rhubarbe.avif` | 233,775 bytes | Downloaded & Validated |
| **Flavor 06 Texture** | `/textures/ciao-energy_texture_abricot_framboise.avif` | 252,726 bytes | Downloaded & Validated |
