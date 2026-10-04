# Ciao Energy — Reference Match Pass

**Date:** 2026-09-30  
**Scope:** Sitewide visual/flow review with the newly supplied homepage screenshot as the primary art-direction reference.

## Reference target

The homepage opens on a black product theatre with a neutral grey horizon, a saturated selected can at center, and a measured arc of other flavors. Navigation stays compact at the top; product name, flavor selector, and scroll cue sit in a clear bottom control zone. Flavor color belongs on the cans and in a restrained local halo.

## Existing implementation findings

- The persistent Three.js renderer and actual can models already supply the core physical product interaction and carousel movement.
- The home hero currently renders the Double Litchi flavor first; the supplied reference opens on Abricot Framboise.
- The selected can currently fills most of the viewport height. Its lower label is covered by the overlaid flavor title and its bright lighting competes with the surrounding cans.
- The home page's global purple gradient is stronger than the reference's neutral black-to-grey environment.
- Carousel arrow controls are inside an `aria-hidden` wrapper, making visible buttons unavailable to assistive technology.
- Mobile has less room for the desktop fan. It needs a tighter arc and safe bottom controls, while preserving swipe and the fallback poster.
- Shop and product detail retain their own page structure, product imagery, pack selection and cart flow; the hero change must not remount the shared renderer or alter those routes.
- The supplied scroll captures show the Zero Bullshit statement and full-range heading crossing into each other at short viewport heights; the camera title in the full-range state also sits behind pills and paragraph copy on portrait mobile.
- The shop capture shows the fixed WebGL can continuing behind the feature copy and across the first product row. The transparent 4K WebP packshots are already available and are sharper than that oversized canvas render for editorial/shop use.
- The additional official reference captures define a large angled can on the flavor profile chapter, product storytelling to the left, and a compact vertical chapter selector on the right.
- Current section progress is driven by `scrollY / (6.5 * viewportHeight)` while section heights vary by viewport and content. The homepage sections have no short-landscape typography/layout rules, so headings can exceed their section boxes.

## Implementation plan

1. Initialize the home hero from a valid flavor hash when present; otherwise show Abricot Framboise to match the supplied reference. Initialize the existing carousel scene to the same flavor.
2. Scale the hero product fan down, shift the bottom controls into a dedicated safe zone, and tune spacing by viewport so can silhouettes remain distinct on narrow screens.
3. Replace the home hero's strong purple wash with a layered charcoal-to-grey horizon and a small active-flavor halo. Keep route-specific atmosphere on shop, product, and later home sections.
4. Keep the existing GSAP/WebGL carousel transition, add restrained DOM title transitions, and honor reduced-motion settings. Use frame-rate-independent damping for carousel, pointer, viewer, and short scroll-stage settling. Do not add a second canvas or perpetual decorative animation.
5. Restore screen-reader access to visible carousel arrow buttons; retain keyboard and pointer flavor selection.
6. Visually inspect home, shop, product detail, menu/search/cart access, desktop and mobile. Run lint, typecheck, and production build; the task does not request unit tests.

## Expanded pass — scroll choreography, collection, and profile

1. Replace the fixed viewport-multiple scroll mapping with a single geometry-based checkpoint sample. The same sample must drive the Three.js master timeline, chapter rail, progress HUD, and stage label; direct/hash navigation must initialize from the visible section.
2. Add a short-landscape layout for the argument and full-range sections. Each chapter must own sufficient vertical space for its actual text; titles must never bleed into the next chapter.
3. Recompose the mobile full-range chapter as a readable sequence: title and summary, a high-resolution selected flavor can, then the six flavor controls. Hide the WebGL range can on portrait mobile while the DOM packshot is visible; retain the live 3D range can on desktop.
4. Recompose the shop feature into an independent editorial product stage that uses the selected 4K transparent render. Suppress the shop-route WebGL product so it cannot overlap the feature text or the collection cards. Keep six product cards, filtering, pack selection, quick add, and PDP navigation.
5. Tune the profile chapter's 3D can to the official framing: flavor story left, oversized angled can toward center/right, accessible chapter rail clear at the edge; use the fixed scene renderer already in the app.
6. Update `MASTER_DESIGN_SYSTEM.md` to implement the user-provided Ciao token foundations and output structure. Use token-backed components, explicit interaction states, WCAG 2.2 AA test criteria, reduced-motion support, and overflow behavior.
7. Refresh all six 2160 × 3840 packshots from the existing GLB with larger can framing. Render offline at 2× with antialiasing, then downsample to 2160 × 3840 WebP at quality 0.99. Use the selected 4K asset as the single central home-hero can while retaining the live 3D fan around it. The range and shop continue using the same packshot helper and product source data.
8. Give short landscape and mobile manifesto sections viewport-safe heights; remove the fixed 3D canvas from the mobile manifesto and FAQ/footer reading regions to prevent scene art from obscuring text.

### Expanded acceptance

- At desktop, home sections sequence without crossing titles; the same scroll position always resolves to one matching DOM and 3D chapter.
- At 390×844 and landscape 570×320, headings, flavor controls, chapter rail, and scroll cue do not collide or leave the viewport horizontally.
- Portrait mobile range uses a crisp 4K can render with selectors below the copy; desktop range keeps the live shared 3D can.
- Shop hero copy, featured render, and first collection row do not overlap. All controls remain usable and cards use the existing 4K image assets.
- Product profile gives the flavor story and angled can distinct space at desktop and a readable stacked composition on mobile.
- Design-system documentation includes tokens, component states, keyboard/pointer/touch behavior, empty/long-content handling, accessibility criteria, prohibited patterns, migration notes, and QA checklist.

## Sitewide polish audit — 2026-09-30

### Audit findings

- At the first flavor profile checkpoint, the chapter copy is already visible while the scene timeline is still at its hero value. The shared progress map assigns both the hero and profile start to 0, even though the first authored camera scene is the profile. This makes the visible product scene, stage label, and copy disagree during the handoff.
- On portrait mobile, the product detail viewer is a fixed viewport canvas while its stage card scrolls out of view. The can then remains behind pricing, pack selection, and recipe copy, reducing legibility and making the viewer feel detached from its frame.
- The mobile shop card rail intentionally previews the next card, but the collection area has no section heading or swipe cue, so the clipped next item can read as a broken grid.
- The active preview at `127.0.0.1:3000` returns the SPA HTML document for existing files in `public/` (loader mark, product packshots, flavor textures). This produces broken-image icons, flat unbranded cans, and a Three.js texture-loader exception. A fresh Vite server on port 3001 serves the same files as PNG/WebP/AVIF correctly with no such exception, confirming the old server was started before the public asset directory was available.
- Replacing the selected home can with a keyed image restarts its entrance animation on every flavor update; during that fade the hero loses its focal product. The new can's packshot should load/decode before the old one fades, keeping at least one product visible throughout.

### Implementation plan

1. Align scroll checkpoints to the authored timeline: transition from hero to profile across the hero section, then hold the profile scene at the profile/benefit boundary. Keep the existing single measured checkpoint map as the source for scene state, stage label, and progress HUD.
2. On the product route, use the existing viewer stage's viewport intersection to hide the fixed WebGL canvas after the non-sticky mobile stage leaves view; preserve the sticky desktop viewer and restore the canvas as soon as its stage is visible again.
3. Add a collection heading and explicit mobile swipe cue above the existing snap rail. Keep filter, pack, add-to-cart, product navigation, and the desktop grid intact.
4. Keep the selected hero packshot mounted during flavor changes and cross-fade only after the incoming image has decoded. Preload the loader mark and avoid unsupported React image-priority attributes.
5. Restart the stale local Vite process so its static middleware indexes the complete `public/` directory, then verify loader, packshots, and textures return their image MIME types.
6. Re-capture profile, shop, and product routes at desktop and mobile sizes, then run lint, typecheck, production build, and route smoke checks.

## Effect ownership

| Effect | Trigger / persistence | Owner | Fallback |
|---|---|---|---|
| Flavor carousel | Arrow, keyboard, slider, or flavor hash; persists while home is active | React selector + existing Three.js carousel | Product poster and semantic controls |
| Flavor title | Selected flavor change | CSS opacity/transform transition | Immediate title with reduced motion |
| Selected hero can | Home route at the hero checkpoint; changes with selected flavor | Static transparent 4K render in the DOM, over the one shared canvas; adjacent fan stays in Three.js | 4K product image remains visible when WebGL is unavailable |
| Neutral hero horizon | Home route and hero scroll range | CSS pseudo-elements | Existing route backgrounds |
| Fan movement | Scroll and flavor selection | GSAP timeline and Three.js | Static fallback stage |

## Acceptance

- Bare home opens on Abricot Framboise; a valid `#flavor=` deep link still selects its requested flavor.
- The selected can reads clearly without the title obscuring the label; adjacent cans form a recognizable shallow arc.
- Black-to-grey lighting reads neutral at desktop and mobile sizes; the active product keeps its flavor color.
- Shop and product routes remain functional and visually intact.
- Carousel buttons are keyboard and screen-reader reachable.
- Lint, typecheck, build, and route-level visual inspection complete without errors.

## Reference fidelity fixes — 2026-09-30

- The local preview had been started before the `public/` image assets were available. It returned the SPA document for PNG/WebP/AVIF paths, so the loader mark and 4K cans appeared broken and the Three.js texture loader threw. Restarting the existing preview process restored the correct image MIME types; no renderer replacement was needed.
- The desktop hero navigation now uses Ciao's supplied vector wordmark and moves that existing home button over the suspended fixture while the hero is active. Its position eases back into the compact header after scrolling; mobile keeps the logo in the navigation row.
- The home hero preloads only the two adjacent 4K packshots after first paint. When the active flavor changes, its new image must decode before the previous can fades, preventing an empty or low-resolution focal can during the carousel's damped movement.
- Portrait flavor-profile framing now scales and raises the existing 3D can enough to leave the title and flavor copy readable. The portrait product-detail camera similarly raises and reduces the can so it remains inside its viewer card. The fixed canvas still hides after that card scrolls away.
- Desktop and 390 × 844 route smoke checks confirmed a loaded wordmark and 2160px hero can, six shop products, no failed network requests or page errors, and the mobile PDP canvas hiding below its stage. The mobile shop defers offscreen can renders and all six 2160px images load as the horizontal rail is browsed.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass. Vite still reports the existing 900 KB minified JavaScript chunk (about 255 KB gzip); no bundle-splitting refactor was included in this visual fix.
