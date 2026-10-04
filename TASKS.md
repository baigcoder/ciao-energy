# CIAO ENERGY — IMPLEMENTATION TASK PLAN

## Phase 0 — Discovery
- [x] Read authority documents in order.
- [x] Inspect supplied screenshots.
- [x] Inspect live reference.
- [x] Inventory assets.
- [x] Inspect current repository architecture.
- [x] Map reference interactions.
- [x] Create reference behavior matrix.
- [x] Freeze design tokens.

## Phase 1 — Foundation
- [x] Implement semantic layout shell.
- [x] Implement design tokens.
- [x] Implement typography.
- [x] Implement global background.
- [x] Implement header.
- [x] Implement focus/reduced-motion primitives.

## Phase 2 — Preloader
- [x] Build preloader state machine.
- [x] Load first-view essentials.
- [x] Add progress display with dynamic English phase feedback.
- [x] Add graceful degraded state.
- [x] Ensure no permanent loading deadlock.

## Phase 3 — WebGL Core
- [x] Set up persistent renderer.
- [x] Load optimized GLB.
- [x] Load required textures.
- [x] Configure camera.
- [x] Configure lighting/HDRI & Studio lighting presets (Clean Daylight, Cyber Neon, Golden Hour).
- [x] Implement can transforms.
- [x] Implement fallback renderer.

## Phase 4 — Scroll Experience
- [x] Build master scroll timeline.
- [x] Synchronize DOM and WebGL.
- [x] Implement flavor progression.
- [x] Implement direct flavor navigation.
- [x] Implement easing/damping.
- [x] Add section enter/exit states.

## Phase 5 — Flavor System
- [x] Create six flavor data records in 100% English.
- [x] Map theme colors.
- [x] Map title/copy.
- [x] Map product texture/asset.
- [x] Add active state.
- [x] Add keyboard/touch navigation.
- [x] Add Botanical Sommelier Tasting Matrix.

## Phase 6 — Benefits
- [x] Build benefit comparison system.
- [x] Implement transition logic.
- [x] Preserve semantic content.
- [x] Add visual before/after treatment.
- [x] Add Clean Energy vs Legacy Energy Interactive Calculator.

## Phase 7 — FAQ
- [x] Build accessible accordion.
- [x] Add keyboard behavior.
- [x] Handle long answers.
- [x] Add reduced-motion behavior.

## Phase 8 — Newsletter/Footer
- [x] Implement validated email input.
- [x] Add loading state.
- [x] Add success state.
- [x] Add error state.
- [x] Add legal links.

## Phase 9 — Responsive
- [x] Desktop composition.
- [x] Tablet composition.
- [x] Mobile composition.
- [x] Mobile 3D quality profile.
- [x] Mobile navigation drawer.
- [x] Touch target verification.

## Phase 10 — Performance
- [x] Texture optimization.
- [x] GLB optimization.
- [x] DPR cap.
- [x] Offscreen pause.
- [x] Visibility handling.
- [x] Code splitting.
- [x] Remove unnecessary client state.
- [x] Measure runtime performance.

## Phase 11 — Accessibility
- [x] Keyboard navigation.
- [x] Focus-visible.
- [x] ARIA state.
- [x] Reduced motion.
- [x] Contrast.
- [x] Screen reader checks.

## Phase 12 — Visual QA, Graphics Overhaul & New Features
- [x] Preloader translated to English with status phases.
- [x] Hero Carousel with 3D Can Hotspots.
- [x] Botanical Sommelier Sensory Matrix.
- [x] Custom Variety Pack 6/12/24-Pack Flight Builder.
- [x] Clean Energy Upgrade Calculator.
- [x] 3D Viewer Studio with 4 angle presets, auto-orbit, and 3 lighting presets.
- [x] **Full 3D Graphics Overhaul**:
  - Eliminated destructive `filter: brightness(.43) saturate(.76)` CSS rule that crushed the WebGL canvas into darkness.
  - Generated 100% English 2048×1603 textures for all 6 flavors (English front brand badges, English nutrition facts, English ingredients, English benefits, "CRAFTED IN FRANCE • 100% RECYCLABLE").
  - Calibrated PBR physical material pipeline with dielectric printed lacquer (`metalness: 0.03`, `roughness: 0.08`, `clearcoat: 1.0`, `clearcoatRoughness: 0.025`).
  - Added procedural cold condensation micro-droplet bump map for thirst-quenching realism.
  - Machined aluminum rims, pull tabs, and chimes upgraded to mirror-silver chrome (`metalness: 0.99`, `roughness: 0.04`, `clearcoat: 1.0`, `envMapIntensity: 4.8`).
  - Studio softbox lighting rig upgraded with dual vertical strip softboxes, top chime downlight, and calibrated ACES Filmic tone mapping exposure (`1.22`).
  - Polished hero CTA button to "VIEW DETAILS & ORDER →" with animated arrow and backdrop-blur pill.

## Phase 13 — Release
- [x] npm run lint (0 errors, 0 warnings)
- [x] npm run typecheck (tsc --noEmit clean)
- [x] npm test (9/9 passing tests)
- [x] npm run build (production bundle clean in 2.51s)
- [x] route smoke test & state verification
- [x] console-error check
- [x] final design report
