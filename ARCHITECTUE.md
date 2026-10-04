# CIAO ENERGY — ARCHITECTURE BLUEPRINT

## 1. Runtime
Recommended baseline for a modern implementation:
- Next.js App Router or equivalent
- React
- TypeScript
- Three.js
- GSAP / ScrollTrigger
- Lenis only if smooth scrolling is actually beneficial
- CSS modules/Tailwind/system tokens according to host project

Do not add libraries blindly. If an equivalent system already exists, reuse it.

## 2. Layered Architecture

### Layer A — Semantic DOM
Owns:
- headings
- copy
- navigation
- flavor buttons
- benefit content
- FAQ
- newsletter
- status text
- accessibility

### Layer B — Interaction Orchestrator
Owns:
- scroll progress
- active flavor
- direct navigation
- pointer state
- reduced-motion state
- audio state
- transition state

### Layer C — WebGL Scene
Owns:
- can model
- materials
- lights
- camera
- reflections/HDRI
- environment
- product transforms
- spatial composition

### Layer D — Motion Timeline
Owns:
- scene transitions
- camera movement
- product rotation
- scale
- opacity
- section synchronization

### Layer E — Data
Owns:
- flavor definitions
- copy
- color themes
- asset references
- benefit records
- FAQ records

There must be one source of truth.

## 3. Suggested Data Model

```ts
type Flavor = {
  id: string
  title: string
  shortTitle: string
  description: string
  theme: {
    background: string
    accent: string
    glow: string
  }
  asset: {
    model?: string
    texture?: string
    poster?: string
  }
}

type Benefit = {
  id: string
  oldLabel: string
  newLabel: string
  title: string
  description: string
}

type FAQ = {
  id: string
  question: string
  answer: string
}
```

## 4. Scene Strategy
Use one persistent Three.js scene where possible.

Do not destroy/recreate the renderer when flavor changes.

Switch product state through:
- transform
- material/texture swap
- camera interpolation
- scene lighting
- background atmosphere

Prefer a single renderer to multiple canvases.

## 5. Scroll Strategy
Map normalized scroll progress to a master timeline.

Concept:

scroll progress
→ master timeline progress
→ section state
→ WebGL transforms
→ DOM state

Do not let multiple independent scroll listeners mutate the same state.

## 6. Frame Loop
Inside the render/update loop:
- read cached pointer/scroll values
- interpolate values
- render
- avoid React setState
- avoid allocations

Use damping for:
- camera
- can rotation
- pointer parallax
- background light movement

## 7. Progressive Enhancement
Fallback levels:

Level 0:
semantic DOM + CSS

Level 1:
CSS transitions

Level 2:
lightweight WebGL

Level 3:
full product asset + post-processing

Any device can remain at a lower level without losing content.

## 8. Asset Pipeline
3D:
- prefer GLB
- optimize geometry
- compress textures
- use KTX2/Draco/Meshopt only when beneficial
- cap texture sizes

Textures:
- use AVIF/WebP for 2D
- use GPU-compressed formats for WebGL where practical

Preloader:
- first-view essentials only

## 9. Performance Controls
Implement:
- device capability classification
- DPR cap
- intersection-based pause
- quality presets
- reduced-motion preset
- mobile preset

Example quality tiers:
HIGH / MEDIUM / LOW / STATIC

## 10. Routing
A single long-form marketing route is preferred for the recreation.
If the host project needs multiple routes, use normal document navigation and preserve the immersive experience only where appropriate.

## 11. Failure Handling
Handle:
- WebGL unavailable
- 3D asset missing
- texture missing
- audio unavailable
- reduced motion
- slow network
- resize
- browser tab visibility change
- mobile browser viewport changes

No failure may blank the page.

## 12. Cleanup
On unmount:
- remove listeners
- cancel animation loops
- dispose geometries
- dispose materials
- dispose textures
- dispose post-processing resources
- disconnect observers
- remove GSAP/ScrollTrigger instances
