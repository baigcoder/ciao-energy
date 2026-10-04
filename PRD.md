# CIAO ENERGY — PRODUCT REQUIREMENTS DOCUMENT

## 1. Product Goal
Recreate the supplied Ciao Energy marketing experience as a single immersive web experience centered on six products/flavors and their benefits.

The reference experience is a dark, scroll-driven product showcase with a prominent 3D can, flavor transitions, minimal navigation, benefit comparisons, FAQ, newsletter, and a lightweight loading sequence.

## 2. Primary User Journey
1. App loads into a minimal black preloader.
2. User sees the brand and utility controls.
3. Primary 3D can/product field establishes the visual identity.
4. Scrolling drives product/flavor transitions.
5. Product copy changes with the selected flavor.
6. User can jump between flavor/benefit points.
7. Benefits are revealed as contrast/comparison moments.
8. FAQ provides practical product information.
9. Newsletter/contact conversion closes the experience.

## 3. Reference Information
The live reference currently presents six flavors:
- Double Litchi
- Coco Citron Vert
- Kiwi Concombre
- Pêche Blanche
- Pomme Rhubarbe
- Abricot Framboise

The live page also presents benefit comparisons around reduced sugar, natural flavors, coffee-derived caffeine, and stevia, followed by FAQ and newsletter content. The reference is available at the supplied Ciao Energy URL. Treat live content as reference material; do not copy protected copy/assets into a public project without permission.

## 4. Interaction Requirements

### 4.1 Preloader
- Black full-viewport stage.
- Centered brand mark / loading identity.
- Minimal numeric loading feedback.
- Transition only after required first-view assets are available.
- MUST not freeze the page waiting on every secondary asset.

### 4.2 Header
Desktop:
- brand centered or visually anchored to the experience
- left sound/status control
- right menu + contact
- thin top framing line

Mobile:
- maintain simple utility controls
- no multi-row navigation
- menu becomes touch-friendly drawer/overlay

### 4.3 Flavor Exploration
- 3D can is the primary object.
- Scroll controls progression.
- Side or indexed controls allow direct navigation.
- Product title/copy changes with the active flavor.
- Color/lighting environment changes with flavor.
- Transitions must be continuous rather than card swaps.

### 4.4 Product Navigation
- 6-item flavor navigation.
- Active item must be visually distinct.
- Keyboard accessible.
- Touch friendly.
- Selecting an item scrolls/animates to that flavor state.

### 4.5 Benefits
Create comparative storytelling rather than a generic grid.
Each benefit is a before/after idea:
- prior ingredient/claim
- new choice
- concise supporting copy
- visual state transition

### 4.6 FAQ
- Accordion.
- Keyboard accessible.
- One item can be expanded at a time unless design requires otherwise.
- Answer heights must animate without layout jumps.
- Long answers must wrap naturally.

### 4.7 Newsletter
- Valid email input.
- Explicit success, error, loading, and invalid states.
- No ambiguous CTA.
- Privacy notice remains visible.

## 5. Performance Requirements
Targets:
- fast first paint
- no long main-thread stalls during initial load
- smooth scroll on modern desktop hardware
- graceful quality reduction on mobile/low-power devices

MUST:
- defer secondary assets
- optimize textures
- use compressed 3D assets
- cap device pixel ratio
- pause offscreen rendering where possible
- avoid continuous React state updates every frame
- reduce post-processing on constrained devices
- avoid loading all textures at full resolution
- use responsive image/media formats
- preload only critical first-view assets

Recommended baseline:
- Three.js/WebGL for the hero/product stage
- GSAP + ScrollTrigger or an equivalent deterministic timeline layer
- Lenis or native scroll with a disciplined synchronization layer
- React/Next.js shell if the target application requires it

Use an existing project architecture when available instead of adding duplicates.

## 6. Accessibility
MUST meet WCAG 2.2 AA principles.
- All navigation reachable without pointer.
- All controls have accessible names.
- Focus-visible is obvious.
- Reduced motion disables nonessential motion.
- Product information exists as DOM.
- WebGL never becomes the sole information channel.
- Audio is off until explicitly enabled.

## 7. Definition of Done
A release candidate is complete only when:
- visual structure matches the supplied references closely
- scrolling drives the intended product story
- direct navigation works
- 3D has a non-WebGL fallback
- mobile has a dedicated composition
- no essential information is hidden in canvas
- accessibility checks pass
- production build passes
- no console errors remain on key paths
- performance has been measured and documented
