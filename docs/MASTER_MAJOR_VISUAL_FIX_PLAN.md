# Ciao Energy — Major Visual Fix Plan

**Date:** 2026-10-01  
**Scope:** Repair the homepage presentation shown in the supplied screenshots while retaining the current Vite, React, and single Three.js renderer.

## Findings

- Project Markdown reports conflict: several historical QA reports claim clean flavor/profile/range renders, while the current browser capture has no focal can in profile/benefit/range states and a strong full-screen berry wash. Treat fresh local captures and the higher-priority `RULES.md` / `AGENTS.md` as current authority.
- `SceneManager` explicitly hides the selected can in every editorial chapter, but the intended separate product composition is only mounted in the WebGL failure fallback. This leaves the profile and benefits without their main product.
- The range checkpoint exposes repeated carousel instances rather than six distinct flavors. Its selected product image is also hidden on desktop.
- Profile, benefit, manifesto, and range chapters are shorter than the viewport. The next chapter enters before the current composition has resolved, matching the cropped/stacked text in the supplied screenshots.
- The page layers a full-screen flavor gradient with a separate blurred rainbow gradient, grain, scan lines, light leak, and a custom cursor. Together these effects overwhelm the restrained black product theatre.
- The preloader includes a decorative language/menu strip that does not belong to the loader and competes with the page header.

## Implementation

1. Keep one renderer and make its six-flavor range state position one instance of each flavor around the selected flavor.
2. Keep the selected can visible in profile and benefit states; keep the manifesto text unobstructed.
3. Give cinematic scroll chapters a full viewport of space so one chapter resolves before the next appears.
4. Reduce global flavor color to a localized, low-opacity atmosphere; remove decorative overlays and the cursor override.
5. Remove the fake preloader toolbar and preserve the centered brand/progress treatment.

## Validation

## Completed changes

- Kept the persistent Three.js renderer for the hero, profile, and benefits, and reduced product scale and lighting in those editorial stages.
- Added a six-packshot desktop range field using the existing local product assets. The compact mobile layout retains its single selected packshot.
- Hid the shared canvas while the DOM-led manifesto/range compositions are active, avoiding competing graphics and duplicated product art.
- Removed the looping flavor video stack from the manifesto, the decorative loader toolbar, and the custom cursor replacement.
- Reduced the full-screen color overlays, removed unused cinematic overlay layers from the app tree, and set the profile/benefit/manifesto/range sections to full-viewport stages.
- Added mobile top spacing to keep the range label clear of the fixed header.

## Validation results

- Desktop captures reviewed for hero, profile, benefit, manifesto, and range at 1440×900.
- Mobile captures reviewed for benefits, manifesto, and range at 390×844. Home, `#profile`, `#benefits-1`, `#argument`, `#full-gamme`, `/shop`, and `/product/double-litchi` had no runtime errors and no horizontal overflow.
- Lint, typecheck, all 7 unit tests, and production build passed. The build retains the existing warning for a minified JavaScript bundle above 500 kB.
- Product and content claims were not rewritten; the work is presentation-focused.

## Follow-up: match the supplied hero reference — completed

**Target:** the user's second screenshot (desktop hero with a broad can arc, suspended ceiling fixture, lower floor pedestal, gray studio falloff, and sparse header).

1. Kept the six-flavor, 24-can continuous carousel, enlarged the secondary cans and reduced their depth falloff to make the arc fill the desktop frame, and turned the default can to present the CIAO mark.
2. Positioned the floor pedestal beneath the flavor title, resized the suspended fixture, and aligned the title, slider, and scroll prompt with the supplied layout.
3. Restored the neutral gray studio falloff behind the alpha WebGL canvas with a restrained flavor-colored glow near the bottom.
4. Simplified the desktop home header by hiding shop/search/cart there, repositioning the controls and wordmark, and preserving commerce actions on other routes. Sound remains user-controlled and reports its actual state.
5. Set Double Litchi as the default flavor and kept compact mobile framing.

**Validation:** reviewed captures at 1920×930, 1440×900, and 390×844. No horizontal overflow at those widths or on the key home, shop, and product routes. Lint, typecheck, all 7 unit tests, and production build passed. The build reports the existing 903 kB minified JavaScript chunk warning.
