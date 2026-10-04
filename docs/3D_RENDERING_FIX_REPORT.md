# CIAO ENERGY — 3D RENDERING DEEP FIX PLAN & ARCHITECTURE

**Document Date**: September 30, 2026  
**Status**: Implementation Blueprint & Architecture Specification  

---

## 1. Deep Fix Strategy Overview

Rather than cosmetic surface patches, this plan executes a ground-up reconstruction of the 3D rendering pipeline:

```
[ Local PBR Assets (can.glb, base.glb, hdri2.hdr, *.avif) ]
                     │
                     ▼
         [ Hybrid Asset Loading Pipeline ]
         ├─ Primary: Official GLTF + Texture Loader (Zero CORS, Local Fast I/O)
         └─ Fallback: Procedural Watertight Geometry + 2048x1024 Canvas Texture
                     │
                     ▼
         [ Accurate PBR Material Rig ]
         ├─ Shell (Can Body): Subdued metalness (0.60), calibrated roughness (0.24), high clearcoat
         ├─ Aluminum Chimes / Lid: High metalness (0.88), low roughness (0.22), anisotropic look
         └─ PMREM Studio HDRI Reflections (hdri2.hdr with softboxes)
                     │
                     ▼
         [ Studio Lighting System ]
         ├─ Key Studio Light: Soft directional frontal illumination across wave curve
         ├─ Rim Light: Rear/top edge backlight for silhouette separation
         ├─ Fill Light: Controlled low-angle fill
         ├─ Ambient / Hemisphere: Low grounding base
         └─ Focused Spotlight: Precision beam for Benefits sections
                     │
                     ▼
         [ Unified Rigid Wave Transforms ]
         ├─ Group-level transforms ONLY (canPosX, canPosY, canPosZ, canRotX, canRotY, canRotZ)
         ├─ Axial spin applied to Group rotation.y (ZERO child mesh detachment)
         └─ Calibrated wave amplitude, depth curve, and pedestal alignment
                     │
                     ▼
         [ UI & Preloader Polish ]
         ├─ Preloader: Slender vertical SVG emblem with exact typographic spacing
         └─ Header Logo: Centered, integrated with ceiling cap
```

---

## 2. Implementation Workstreams

### Workstream 1: Localized Asset Pipeline & Flavor Data
- Update [src/data/flavors.ts](file:///f:/ciao-energy-antigravity-spec/src/data/flavors.ts) to point to local assets `/textures/ciao-energy_texture_*.avif`.
- Configure `GLTFLoader` and `RGBELoader` to load `/models/can.glb`, `/models/base.glb`, and `/hdr/hdri2.hdr` from Vite's public asset root.
- Ensure all color textures are strictly tagged with `colorSpace = THREE.SRGBColorSpace`, `minFilter = THREE.LinearMipmapLinearFilter`, and anisotropic filtering (`renderer.capabilities.getMaxAnisotropy()`).

### Workstream 2: Model & Geometry Architecture (`canModel.ts`)
- Implement `CanFactory` in [canModel.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/canModel.ts):
  - Async loader for `can.glb` which clones geometry and attaches calibrated PBR materials.
  - Watertight procedural can geometry fallback:
    - Single unified hierarchy where `Shell`, `Top`, and `Bottom` are anchored rigidly to the parent can group.
    - Accurately beveled chimes, lid recessed plate, and bottom taper.
  - Rewritten `generateProceduralLabelTexture(flavorIndex)`:
    - $2048 \times 1024$ canvas.
    - True front-face UV placement ($u=0$ wrap and $u=0.5$ aligned with can rotation).
    - Authentic stylized italic typography, flavor badges, barcode, nutrition fact block, and metallic brush texture.
  - Pedestal creation using authentic `base.glb` (`top_base_metal` and `bot_base_metal`) with metallic industrial materials.

### Workstream 3: Studio Lighting & Environment Rig (`sceneManager.ts`)
- Replace the inadequate 2-spotlight setup with a balanced 5-light studio rig:
  1. `keyLight`: Directional light at `(2, 6, 8)` with broad illumination across all wave cans.
  2. `fillLight`: Directional light at `(-4, 0, 6)` with soft fill.
  3. `rimLight`: Directional light at `(0, 6, -6)` aimed forward to create brilliant metallic rim highlights along the top chimes and flanking edges.
  4. `hemiLight`: `HemisphereLight(0xffffff, 0x111122, 0.35)`.
  5. `ambientLight`: Controlled `AmbientLight(0xffffff, 0.40)`.
  6. `spot3`: Preserved for dynamic ingredient illumination during Benefits scroll.
- Environment: Load `hdri2.hdr` with `RGBELoader` + `PMREMGenerator`. When loading, inject procedural high-contrast studio light panels so cans always have metallic reflections.

### Workstream 4: Transform Engine & Render Loop Normalization
- In [sceneManager.ts](file:///f:/ciao-energy-antigravity-spec/src/webgl/sceneManager.ts#L602-L642):
  - **DELETE** `child.rotation.z = can.rotation.y * 0.6 + this.data.canSpin * p`.
  - Apply axial spin directly to the can Group: `can.rotation.y = canRotY + (this.data.canSpin * p)`.
  - Maintain the exact frozen reference wave curve formulas:
    - `canPosX = x * this.data.spacing`
    - `canPosY = Math.sin(canPosX * waveStrength)`
    - `canPosZ = (Math.abs(x) * -1 - 0.2) * this.data.wave`
    - `canRotX = (-20 * Math.PI / 180) * this.data.wave`
    - `canRotY = (canPosX * 0.5 - (20 * Math.PI / 180)) * this.data.wave`
    - `canRotZ = (22.5 * Math.PI / 360) * this.data.wave`
  - Ensure zero geometric tearing, zero detached lids, zero floating rings.

### Workstream 5: Preloader Typography Fix
- In [Preloader.tsx](file:///f:/ciao-energy-antigravity-spec/src/components/Preloader.tsx):
  - Redesign the SVG emblem with `viewBox="0 0 120 340"`.
  - Use exact proportional baseline positioning for "CIAO" (vertical stacked or rotated) and "ENERGY" (horizontal italic tracking).
  - Guarantee zero overlap, zero text cutoff, and clean responsive scaling.

### Workstream 6: Ceiling Cap Alignment
- Calibrate `top_base_metal` position so it sits cleanly behind the header logo at $y \approx 4.2$, creating the authentic ceiling stage fixture without clipping through the header text in any section.

---

## 3. Step-by-Step Validation Checklist

1. **Diagnostic / Single-Can Test**: Render 1 can with label texture, verify metallic reflections, label legibility, chime geometry.
2. **Multi-Can Wave Array**: Render full wave (24 desktop / 12 mobile), verify flanking can visibility, metallic rim lights, zero geometry tearing.
3. **Scroll Choreography Test**: Verify smooth transition from Hero $\to$ Profile $\to$ Benefits 1-4 $\to$ Argument $\to$ Full Gamme without camera clipping or disc collisions.
4. **Preloader Test**: Verify emblem typography renders cleanly without overlap.
5. **Lint / Build / Smoke Test**: Pass `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
6. **Visual QA Screenshots**: Capture at 1920x1080, 1440x900, 768x1024, 390x844.
