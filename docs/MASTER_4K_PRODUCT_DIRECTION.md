# Ciao Energy — Product Theatre Redesign

**Date:** 2026-09-30  
**Status:** Implemented; six 4K packshots generated and integrated.

## Design objective

Make the can unmistakably the hero on every route. Replace the current broad color wash and text-monogram commerce cards with a darker, more editorial product theatre: ink-black surfaces, controlled flavor light, larger real product art, deliberate typography, and quiet utility controls.

## Product art

- Render the existing `can.glb` with the six supplied AVIF label textures in the project's real Three.js PBR scene.
- Export one transparent portrait packshot per flavor at 2160 × 3840 (4K UHD portrait pixel count), with front-facing artwork and restrained studio reflections.
- Keep export mode isolated from normal customer traffic and keep `preserveDrawingBuffer` disabled for regular sessions.
- Use those packshots on the shop cards and PDP poster/fallback surfaces; preserve the live 3D canvas as an optional interactive viewer.
- Never recreate packaging text with generated imagery or substitute invented can artwork.

## Page composition

- Home: keep the established carousel and flavor identity; deepen the blacks, contain color to the selected product halo, and protect the product silhouette and lower controls from collisions.
- Shop: use a short editorial introduction, a large featured product stage, concise flavor navigation, and an art-led collection shelf. Reduce the green fog and remove monograms.
- PDP: make the product poster/interactive stage dominant, with compact title and pack configuration to the side; on mobile, order product art, identity, pack choices, and purchase action into one clear sequence.
- Keep all names, options, controls, and prices semantic DOM. The 3D scene owns lighting/rotation; CSS owns surfaces and responsive layout.

## Acceptance

- Six faithful 2160 × 3840 transparent packshots exist and are loaded as local assets.
- Shop and PDP visibly use the 4K product art at responsive sizes, with live 3D remaining interactive where supported.
- The six-product collection reads as a premium range, not a row of text placeholders.
- WebGL failure retains the high-resolution stills and all content/actions.
- No new unsupported product, stock, nutrition, or delivery claims are introduced.

## Evidence limits

Image generation is not available in this environment. The packshot source is the exact local model and texture pipeline. The six transparent WebP assets are each 2160 × 3840 and total 687,192 bytes. Desktop 4K renders are authored locally; no campaign or ingredient photography is implied.

## Delivered assets and workflow

- `public/products/4k/double-litchi-4k.webp`
- `public/products/4k/coco-citron-vert-4k.webp`
- `public/products/4k/kiwi-concombre-4k.webp`
- `public/products/4k/peche-blanche-4k.webp`
- `public/products/4k/pomme-rhubarbe-4k.webp`
- `public/products/4k/abricot-framboise-4k.webp`
- Regenerate from the running local app with `npm run render:products-4k`.
