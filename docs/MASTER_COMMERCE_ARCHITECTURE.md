# Ciao Energy — Master Commerce Architecture (Current State)

**Date:** 2026-09-30

## Structure

- `src/data/products.ts` is the sole product/pack catalog consumed by shop, PDP, search, related products, cart, and product schema.
- `src/store/cart.ts` owns cart items, local persistence, quantity updates, totals, and an explicit gateway-unavailable checkout result. No order-success state is fabricated.
- `/shop` now has an editorial intro with a featured catalog item, data-backed price, flavor filters, then the existing collection and quick-add controls.
- `/product/:slug` shares one detail component with accessible pack selection, quantity controls, local 3D viewer, ingredients/nutrition accordions, related products, and a not-found state.
- One `SceneManager` remains mounted across client-side route changes. Shop introduction and PDP use the same renderer.

## Integrity boundaries

- Product pack prices currently match the user-supplied product screenshots and remain in the catalog.
- Static free-shipping thresholds, free-shipping claims, and PDP stock badges have been removed because no shipping/inventory service is connected.
- PDP now labels displayed amounts as euro prices; its delivery content says service information will be provided when sales are available.
- Structured Product/Offer JSON-LD no longer declares `InStock`; URLs and image origins follow the active site origin.
- A current route updates title, description, canonical, Open Graph, and Twitter metadata. Invalid product slugs use `noindex,follow`.
- Current public reference confirms the flavor names and broad recipe/benefit/FAQ content. Product-specific recipe, nutrition, stock, and tag details in the catalog still need owner-approved provenance; see the audit.

## Checkout and service status

Cart is a local prototype. Payment, inventory, shipping rates, order confirmation, and newsletter subscription have no live provider. The UI must continue to present these as unavailable or pending service configuration, with no fake success.
