# Ciao Energy — Master Implementation Plan

**Date:** 2026-09-30  
**Status:** Audit complete; plan recorded before production source edits.  
**Authority:** `RULES.md` → `AGENTS.md` → `PRD.md` → `ARCHITECTUE.md` → `DESIGN.md` → `TASKS.md` → `MEMORY.md` → `ANTIGRAVITY_PROMPT.md`. Existing authorities remain unchanged.

## Working principle

Retain the functioning Vite/React/Three.js application, its persistent renderer, local product assets, semantic DOM, product catalog, and local cart. Make small, verifiable changes at the current broken boundaries. Do not migrate frameworks, replace the scene, install dependencies, or claim operational commerce facts without evidence.

## Execution order

### 1. Range scene and checkpoint (P0)

- Reproduce the supplied full-range state through actual scrolling at desktop and mobile sizes.
- Add an explicit range-state composition to the existing scene. At the reference checkpoint, show one selected product centered behind the title/selector, matching the supplied screenshot. Keep the current six flavor buttons and full DOM product names.
- Avoid running all 12/24 carousel instances through the range swirl; preserve the hero wave and single renderer.
- Confirm the FAQ begins unobstructed immediately after the range state.

**Acceptance:** One readable can at `#full-gamme`; no duplicated vertical can stack; all six flavor buttons work by keyboard and pointer; the next section is not occluded.

### 2. Claim and commerce integrity (P0/P1)

- Compare product names, ingredients, nutrition, recipe claims, benefit copy, production/origin, shipping, delivery, bestseller, inventory, and price against the existing authority and public reference.
- Do not overwrite project authorities. Record discrepancies and provenance in a new document. Since price/inventory/shipping feeds are absent, remove static “in stock” assertions and do not publish Offer availability until an approved commerce source is available.
- Retain provided pack prices where consistent with supplied screenshots/current catalog, but label the source and mark operational validation as not verified.
- Keep checkout's current gateway-unavailable behavior; never simulate purchase success.

**Acceptance:** No stale “In Stock”/delivery promise is presented as live; JSON-LD contains only substantiated Product/Offer fields; contradictory recipe text is resolved or explicitly marked for owner verification rather than silently invented.

### 3. Scroll and DOM state (P1)

- Keep native scrolling and the GSAP timeline. Derive timeline position, chapter label, progress, and active section from one scheduled scroll/resize sample.
- Remove scroll effect re-registration caused by `activeChapter` and avoid state updates when values have not changed.
- Compute initial state on mount, navigation, and hash navigation. Use observed section boundaries/document progress to map timeline rather than silently assuming content remains exactly 6.5 viewport-heights long.

**Acceptance:** Direct section/hash navigation and ordinary scroll yield matching DOM chapter/HUD and 3D checkpoint; footer height does not clamp the animation early; no competing scroll controller is added.

### 4. Product viewer interactions and stacking (P1)

- Implement actual target rotations for front/nutrition/back controls in the existing scene manager.
- Scope pointer capture and drag to the product stage; prevent drag from intercepting unrelated page content and preserve touch scroll outside the stage.
- Set explicit product-stage and content stacking/safe-area behavior; verify sticky stage releases before related products.

**Acceptance:** Buttons produce visibly distinct and repeatable orientations, recenter returns front, dragging works only from the model stage, and all commerce details remain readable and focusable.

### 5. Shop composition (P1)

- Recompose `/shop` around a featured can/editorial intro and concise flavor discovery before the collection.
- Reuse local can textures and current persistent WebGL renderer where feasible; keep the catalog data, existing prices/options, quick add, and filters only when tag claims are verified.
- Reduce reliance on colored text-monogram cards. Use product artwork/scene and sparse metadata as the visual focus.

**Acceptance:** Shop resembles the supplied premium discovery direction, does not create a second WebGL renderer, and retains functional pack selection, add-to-cart, and detail navigation.

### 6. Visual system, responsive, accessibility, and metadata (P2)

- Tune flavor background to restrained localized atmosphere; reduce unnecessary grain/scanline/light leak layers and respect `prefers-reduced-motion`.
- Review mobile composition, horizontal overflow, touch target size, keyboard focus, dialog escape/return focus, WebGL fallback, and pointer/touch gestures.
- Add route-specific title, description, canonical, Open Graph, and Twitter metadata. Handle invalid product slug with clear not-found metadata and no misleading product schema.

### 7. Validation and separate reports

- Run `npm run lint`, `npx tsc --noEmit`, `npm test -- --passWithNoTests`, and `npm run build` as requested in the task brief.
- Start the app and smoke-test `/`, `/shop`, valid `/product/:slug`, invalid product slug, cart/search/menu interactions, and direct scroll/hash checkpoints.
- Capture screenshots at 1440×900 and 390×844 at actual scroll states; also inspect the broken full-range checkpoint at 1280×800 and 768×1024.
- Add separate current reports: `MASTER_DESIGN_SYSTEM.md`, `MASTER_COMMERCE_ARCHITECTURE.md`, `MASTER_VISUAL_QA.md`, `MASTER_PERFORMANCE_REPORT.md`, and `MASTER_ACCESSIBILITY_REPORT.md`. Do not replace existing authority or historical reports.
- State measured results only; mark untested requirements `NOT VERIFIED`.

## Out of scope without more evidence

- Deploying the site, connecting payments/newsletter/inventory, claiming actual stock or shipping service, purchasing/licensing product assets, or rewriting historical authority documents.
- Targeting all 37 requested implementation phases as if they can be proven complete by a passing build. Work proceeds against observed P0/P1 defects, then reports remaining items precisely.
