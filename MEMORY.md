# CIAO ENERGY — PROJECT MEMORY

## Reference
Primary reference:
Ciao Energy marketing site supplied by the user:
`https://www.ciaoenergy.com/`

Supplied visual references:
- preloader screen
- product carousel / can field
- flavor detail states
- benefits state
- menu state
- product detail compositions

## Stable Design Observations
- dominant black canvas
- white/near-white typography
- thin technical lines
- minimal UI
- large 3D can as the hero
- scroll-driven transitions
- flavor-dependent atmosphere
- centered or visually anchored logo
- compact utility navigation
- vertical navigation for content categories/flavors
- restrained interactive controls
- large negative space used intentionally

## Current Public Content Reference
The current live page lists six flavors and benefit/FAQ content. The site is structured around product discovery rather than a traditional multi-card product grid.

## Technical Reference Notes
Public third-party descriptions of the experience characterize it as a Webflow + Three.js immersive experience with scroll-driven 3D can animations and interactive sound. Independent recreation projects commonly use Three.js/WebGL, GSAP, and Lenis-like scroll orchestration. These are implementation references, not official source code.

## Accuracy Rules
- Live/public data can change.
- Never assume a third-party reconstruction is the official implementation.
- Never copy source code from third-party projects into the user's project.
- Rebuild architecture independently.
- Record verified observations in `REFERENCE_ANALYSIS.md` when needed.

## Known Risks
- 3D can assets can become the dominant performance bottleneck.
- High DPR and post-processing can overload mobile devices.
- Scroll synchronization can cause jank if implemented via React state.
- Large texture sets can increase memory pressure.
- Audio APIs require user gesture and browser permission considerations.
