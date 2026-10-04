# Ciao Energy — Master Visual and Architecture Audit

**Date:** 2026-09-30  
**Scope:** Existing Vite/React application, local reference captures, six user-supplied screenshots, project authority documents, local asset inventory, and the current public reference at https://www.ciaoenergy.com/.

## 1. Current architecture

- Runtime is Vite + React 18 + TypeScript, with Three.js 0.161, GSAP, and Lenis installed. There is no router dependency; `src/App.tsx` parses browser paths/hash state and calls `history.pushState` directly.
- `App.tsx` owns route, selected flavor/chapter, scroll progress, header/drawer state, search, and WebGL fallback state. One `SceneManager` holds the Three.js renderer, scene, camera, can instances, lights, materials, and GSAP master timeline.
- Content is composed from `src/components/`: home sections, commerce routes (`ShopPage`, `ProductDetailPage`), drawers, search, and controls. Shared styles are in five CSS files.
- `src/data/products.ts` is the commerce catalog; `src/data/flavors.ts`, `benefits.ts`, and `faq.ts` provide related experience content. `src/store/cart.ts` provides the local persistent cart and checkout-unavailable abstraction.
- Homepage scroll progress is normalized from `scrollY / (6.5 * viewportHeight)` and passed into the master timeline. A separate scroll listener also updates DOM progress/chapter/stage state. The canvas has its own perpetual RAF loop, paused at render time when the document is hidden.
- WebGL builds procedural label textures first, then loads local AVIF label textures; a local HDRI upgrades a procedural softbox environment. Local assets include six AVIF labels, `can.glb`, `base.glb`, `hdri2.hdr`, and metallic/spot masks. The current scene creates 24 desktop or 12 low-power can groups.
- There is no `.git` repository at the provided workspace root, so repository history and a baseline diff are unavailable.

## 2. Route map

| Route | Current implementation | Observed concern |
|---|---|---|
| `/` | Long home sequence: hero, profile, four benefits, manifesto, full range, FAQ, newsletter/footer | Timeline scroll normalization is coupled to hard-coded viewport multiples and the document's changing height. |
| `/shop` | Hero, tag filters, six product cards, pack choices, quick add | Main screenshot reads as a centered marketing template above a generic three-column card grid; no featured product scene. |
| `/product/:slug` | Shared data-driven PDP, single can, pack selection, quantity, cart, accordions, related rail | Angle presets currently only change a label/reset orientation; pointer drag listens on the whole window. |
| Invalid product slug | In-component not-found state | URL remains a product route and page metadata/schema do not clearly become not-found metadata. |

## 3. Evidence and source checks

- Reviewed the six supplied screenshots and local QA captures at 1440×900 for hero, shop, PDP, and full-range states, plus 1920×1080 and mobile capture inventories.
- The supplied desired scenes establish a dark product theatre with a dominant central can, subdued ambient color, editorial typography, a compact utility header, selected flavor controls, and commerce controls that share the same brand system.
- The current 1440×900 hero is recognizable and close in composition, but is more purple-washed and its title/product relationship differs from the supplied hero reference.
- The current full-range capture visibly renders an overlapping vertical stack of can tops behind the FAQ heading. The source creates 12/24 repeated can groups and runs a generic swirl formula for every can. This conflicts with the supplied full-range screenshot, which uses one prominent selected can, title, and six selectable flavor controls.
- The shop capture uses prominent full-width green atmosphere and three large cards whose gradient monograms stand in for product visuals. The supplied shop reference gives more space to the collection and uses a quieter, product-first visual hierarchy.
- The PDP capture has a useful two-column layout and actual local can texture. Related content is obscured by scene overlap in a deep scroll capture; inspect sticky positioning and stacking as a dedicated fix.
- The public reference page is reachable. Its text includes product flavor descriptions, four ingredient comparisons, FAQ, and newsletter structure. The live reference describes cane sugar + stevia and references guarana; project product records sometimes state grape-juice sweetening, caffeine-only coffee sources, or other conflicting recipe/benefit details. Those product claims require a source-of-truth review before changing content. See https://www.ciaoenergy.com/.
- Existing visual/performance/accessibility reports assert broad passes, but rendered local captures contradict the full-range claim. The report artifacts are historical evidence and are not sufficient proof of current quality. `screenshots/visual_qa_report.json` also records connection-reset errors at 1024×768.

## 4. Defects and remediation

### Major / P0 — Full-range scene does not match intended composition

- **Symptom:** At the full-range checkpoint, can geometry collapses into a vertical stack and overlaps the FAQ heading.
- **Root cause:** 12/24 carousel instances are all assigned a generic swirl transform; the swirl's compact spacing and current camera/depth place repeated instances into a narrow stack. Scene visibility is not constrained to the six distinct range items or the active showcase can.
- **Impact:** Breaks the supplied reference's most important range composition, obstructs the following FAQ, and makes product identity unreadable.
- **Proposed fix:** Give the range state an explicit scene layout/visibility rule. Match the supplied reference with one selected, centered hero can while keeping all six flavor controls in semantic DOM; if a six-can fan is retained as an alternate view, use exactly six distinct cans and a measured horizontal arc. Keep section transition and focus states deterministic.
- **Priority:** P0.

### Major / P0 — Product claims and catalog facts are inconsistent or unverified

- **Symptom:** Catalog/FAQ/benefit content asserts recipe, ingredient, nutrition, production, delivery, stock, and bestseller facts; some conflict with the current public reference. Multiple PDP accordions state shipping terms and recycling claims not grounded in a visible commerce backend.
- **Root cause:** Data model mixes apparent reference content, inferred details, and commerce assertions; there is no provenance/verification flag. Every pack option is marked in stock and several UI labels imply operational facts.
- **Impact:** Misleads customers and creates legal/trust risk; structured data also publishes `InStock` unconditionally.
- **Proposed fix:** Compare every customer-facing fact against an approved project source. Keep existing authority content unchanged; add a separate source/provenance ledger and remove or qualify only the unsubstantiated operational claims. Derive availability/schema from actual product data and do not emit an Offer if legitimate offer/availability data is not verified.
- **Priority:** P0.

### Major / P1 — Scroll state is split between the scene and DOM

- **Symptom:** The scene timeline is sought from fixed viewport-height assumptions, while separate thresholds control profile, benefit chapter, and stage UI. The scroll effect is recreated when `activeChapter` changes. A user's screenshot can land between mismatched DOM and 3D states.
- **Root cause:** There is no shared normalized master-state object for both scene and DOM; `activeChapter` is derived in one RAF but also a dependency of the listener effect. FAQ/footer height is not part of the same calibrated range.
- **Impact:** Scene/copy drift, extra event lifecycle work, difficult direct linking, and fragile content-height changes.
- **Proposed fix:** Preserve native scroll and the existing timeline; compute one cached scroll sample and derive section/chapter/progress from that same sample. Make DOM state updates conditional on actual changes and map timeline checkpoints from the real section geometry. Initialize from current scroll on mount/route change.
- **Priority:** P1.

### Major / P1 — Product viewer controls imply behavior they do not perform

- **Symptom:** “Face”, “Nutrition”, and “Arrière” are presented as camera-angle presets, but click handlers only update local active styling and call reset. Product dragging listens on `window`, so pointer movement anywhere on the PDP can rotate the can.
- **Root cause:** Viewer control state is not connected to `SceneManager.productViewerRotation`; input is attached globally rather than to the stage.
- **Impact:** Users receive false feedback and unintended can rotation; touch/scroll gestures are not scoped.
- **Proposed fix:** Add deterministic front/nutrition/back preset targets to the existing scene manager and bind pointer capture/drag only to the viewer stage. Preserve touch scrolling outside that region and reset to front on product navigation.
- **Priority:** P1.

### Major / P1 — Shop is functional but card-led and its filters can present unsupported claims

- **Symptom:** `/shop` is a centered intro followed by a three-column product-card grid with text monograms instead of a product-first featured discovery scene. “Best-Seller”, “Faible en sucre”, and other filters can imply claims beyond simple flavor navigation.
- **Root cause:** Shop presentation is independent from the shared 3D stage and filter tags are asserted in each product record without provenance.
- **Impact:** The store feels like a generic catalog instead of the supplied cinematic brand; filters may be inaccurate.
- **Proposed fix:** Recompose the existing shop around a featured product followed by compact flavor discovery and the collection; reuse the current 3D renderer/data rather than mount another canvas. Only expose data-backed filters once tag meaning is verified. Keep quick add, pack selection, prices, and keyboard semantics.
- **Priority:** P1.

### Major / P1 — Commerce controls present operational states without a backend

- **Symptom:** PDP says “EN STOCK”, shows a free-shipping threshold, and exposes delivery promises while checkout intentionally returns gateway-unavailable.
- **Root cause:** Static commerce strings and `inStock: true` defaults are not linked to an inventory/shipping provider.
- **Impact:** Cart can accept items that may not be sellable; operational promises cannot be fulfilled/verified.
- **Proposed fix:** Represent checkout, inventory, and shipping as unavailable/configurable unless verified source data exists. Keep cart review and non-fake checkout handoff. Do not show static positive inventory claims by default.
- **Priority:** P1.

### Major / P1 — Product page presentation has weak scroll/sticky boundaries

- **Symptom:** The local detail capture shows the viewer and can persisting beside later accordion/related content, with the related heading/card area partially obscured in the captured state.
- **Root cause:** The page-wide fixed WebGL canvas remains visible by design and page content/stage stacking and viewer geometry are not aligned to a sticky safe region. The canvas is pointer-active globally.
- **Impact:** Reading the product details and using controls can feel crowded or blocked.
- **Proposed fix:** Constrain canvas interaction hit-testing to the viewer stage on PDP, add a deliberate stage mask/background and safe stacking for text, and verify sticky end boundaries against the related section.
- **Priority:** P1.

### Minor / P2 — Visual effects layer is heavier than the supplied direction

- **Symptom:** Current home/shop renders combine an intense radial gradient, conic gradient, animated grain, scanlines, light leak, vignette, and particles.
- **Root cause:** Atmosphere layers were added independently rather than tuned as one lighting system.
- **Impact:** Purple/green wash competes with label artwork; persistent effects use GPU/compositing budget and dilute the restrained product-first direction.
- **Proposed fix:** Keep flavor color in scene lighting and a restrained local atmosphere; disable or reduce nonessential grain/scanline/light-leak layers and honor reduced motion. Preserve subtle framing and measured contrast.
- **Priority:** P2.

### Minor / P2 — SEO metadata is partial and commerce schema is too assertive

- **Symptom:** Route effects set titles only; canonical, description, Open Graph/Twitter tags are absent from the observed route logic. JSON-LD builds Product/Offer with hardcoded site URL and `InStock`.
- **Root cause:** SPA metadata is incomplete and schema is not gated by verified operational data.
- **Impact:** Search/social previews and structured data may be stale or misleading.
- **Proposed fix:** Update title, description, canonical, and social metadata on every route (including invalid slug); use product schema only with approved product data and offer facts only when verified.
- **Priority:** P2.

### Minor / P2 — Existing verification documents overstate current evidence

- **Symptom:** Historical reports say the full-range composition and all viewport checks passed, but checked-in captures show a broken full-range state and a 1024 connection failure.
- **Root cause:** Reports are not tied to a reproducible state-by-state recapture and their claims were not reconciled with actual images.
- **Impact:** Reviewers cannot trust the QA summary or determine what remains unverified.
- **Proposed fix:** Preserve existing reports; add a current master QA report with fresh evidence and explicit NOT VERIFIED entries where a test was not performed.
- **Priority:** P2.

## 5. Root cause summary

The main issue is not absent capability: the project has reusable scene, catalog, cart, and section components. The quality gap comes from independently layered systems: scene choreography and DOM scroll thresholds disagree; the range state reuses the hero's many-can carousel instead of owning a distinct composition; commerce facts are static; and visual QA reports describe expected behavior rather than the supplied captures. These findings call for small coordinated changes at shared state/data boundaries rather than a framework or renderer replacement.

## 6. Proposed architecture and visual system

- Keep Vite, React, TypeScript, Three.js, native document scrolling, the one `SceneManager`, current product catalog, and cart store.
- Keep a single scroll sample as the source for scene seeking, chapter labels, progress indicator, and active state. Scene transforms remain in WebGL; headings, product names, controls, facts, and cart remain DOM.
- Give hero, profile, benefits, manifesto, and range explicit scene checkpoints. Range is one centered product with six DOM selectors, matching the supplied screenshot.
- Preserve the global black canvas, centered brand, restrained flavor-colored light, white italic display type, mono instrumentation, and accessible utility controls. Reduce ambient overlays and color wash.
- Reuse existing local GLB/HDRI/AVIF assets; retain procedural can labels and DOM product data as fallbacks. No additional renderer or asset CDN is required.
- Keep a single product model as the commerce source. Mark provenance at product/commerce field level in documentation and render only approved information.

## 7. Effect ownership and fallback matrix

| Effect | Trigger and persistence | Driver / owner | Optional behavior | Fallback |
|---|---|---|---|---|
| Can carousel | Initial home load; flavor selection persists while home route is active | DOM buttons/scroll → master timeline → Three.js transforms and local flavor texture | Pointer parallax; particles | Static `FallbackStage` plus HTML labels |
| Profile/benefit/range framing | Native scroll or direct section navigation | Single scroll sample → timeline and DOM section state | Ambient particle drift and transitions | Content remains in DOM; reduced motion lowers transforms |
| Product rotation | Pointer gesture started on viewer stage; angle preset button | Stage pointer capture → `SceneManager` target rotation | Drag only | Fixed front-facing model / poster fallback |
| Flavor atmosphere | Active flavor or route changes | CSS custom properties + WebGL light/color | Animated gradient transition | Static flavor color |
| Menu/cart/search | Explicit button, shortcut, or commerce action | React state + DOM dialogs | Transitions | Semantic links/forms and inline cart status |
| Audio | Explicit user toggle | Audio manager/Web Audio | Entirely optional | OFF state; all information visible without sound |

## 8. Proposed phases

1. **Confirmed audit and implementation plan** — this report and `MASTER_IMPLEMENTATION_PLAN.md`; no production source changed before these artifacts.
2. **P0 integrity/composition** — correct range scene; verify product/benefit facts against project authority and current public reference; remove unverified operational assertions from exposed commerce UI/schema.
3. **P1 orchestration/viewer** — unify scroll-derived UI with timeline, wire viewer presets, scope drag to the stage, correct product page stacking.
4. **P1 shop direction** — use the existing renderer/data for a featured product-first intro and compact discovery; keep commerce actions.
5. **P2 visual system, responsive/accessibility, and metadata** — reduce overlays, check focus/reduced-motion/touch targets, add route metadata with claim-safe schema.
6. **Current evidence and validation** — run requested lint/typecheck/tests/build, route smoke tests, screenshot capture/review at reference desktop/mobile sizes; document any unverified states in a separate current report.

## 9. Known limits at audit time

- Product label textures, GLB, and HDRI are local; no dedicated product cutout or photographic can assets are present for HTML shop cards.
- The supplied repository root is not a Git checkout.
- Current cart is local-only and checkout intentionally has no live payment gateway.
- Public reference access confirmed current page text, but does not verify a commercial data feed, inventory, shipping terms, or authorization to reuse proprietary assets in a public release.
