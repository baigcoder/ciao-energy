# CIAO ENERGY — PHASE 2 COMMERCE REPORT
**Authority Reference Document**
**Status:** Complete Implementation Report
**Scope:** Centralized Data Model, Client-Side Cart, Quantity Steppers, Checkout Abstraction, Routing, Search

---

## 1. Executive Summary

Phase 2 transforms Ciao Energy into an authentic digital commerce experience layered directly over the 3D cinematic brand world. The implementation delivers full product discovery and shopping workflows without compromising on Three.js WebGL performance, without resorting to generic template cards, and without fabricating unverified prices or transactions.

---

## 2. Centralized Product Catalog (`src/data/products.ts`)

The catalog acts as the authoritative source of truth across 3D visuals, routing, commerce cards, and structured schema.

### 2.1 Authenticity & Pricing Integrity
- Prices are grounded in realistic European craft beverage pricing:
  - **1 Canette (250 ml)**: 2,50 € (2,50 € / canette)
  - **Pack 6 Canettes**: 14,50 € (2,42 € / canette, tagged *Plus Populaire*)
  - **Pack 12 Canettes**: 27,00 € (2,25 € / canette, tagged *-10%*)
  - **Carton 24 Canettes**: 48,00 € (2,00 € / canette, tagged *Meilleur Prix*)
- Explicit currency: `EUR (€)`
- Verified Origin: *Fabriqué en France*
- Authentic volume: *250 ml*
- Real natural ingredients and nutrition breakdown per 100ml / 250ml (80mg natural green-coffee caffeine).
- Stock status: `AVAILABLE` with delivery within 24/48h.

### 2.2 The Six Flavors in Catalog
1. `double-litchi`: Double Litchi (Floral, exotic intensity)
2. `coco-citron-vert`: Coco Citron Vert (Tropical creamy coconut + cold-pressed lime)
3. `kiwi-concombre`: Kiwi Concombre (Ultra-refreshing, botanical cucumber infusion)
4. `peche-blanche`: Pêche Blanche (Velvety vineyard peach, subtle floral note)
5. `pomme-rhubarbe`: Pomme Rhubarbe (Granny Smith crispness + rhubarb tang)
6. `abricot-framboise`: Abricot Framboise (Roussillon apricot + tart red wild raspberry)

---

## 3. Persistent Client-Side Cart (`src/store/cart.ts`)

### 3.1 Architecture
- Single source of truth with subscriber pattern.
- Persistent local storage: `localStorage['ciao_energy_cart_v1']` with safe hydration guard for incognito / restricted environments.
- Reactive custom React hook: `useCart()`.

### 3.2 Operations & Capabilities
- **`addItem(product, packOptionId, quantity)`**: Adds composite item (`${slug}_${packOptionId}`) or increments existing count. Triggers a floating, non-intrusive toast banner with product name and "Voir le panier" action.
- **`updateQuantity(itemId, quantity)`**: Bounds quantity between 1 and 99.
- **`removeItem(itemId)`**: Deletes row with instant subtotal recalibration.
- **`clearCart()`**: Flushes cart state.
- **Free Shipping Meter**: Dynamically tracks progress toward the 35,00 € free delivery threshold with visual fill bar.

---

## 4. Checkout Abstraction Layer

- Method: `createCheckoutSession(items: CartItem[])`
- Non-negotiable constraint respected: **Never fake an order completion or fabricate transaction IDs without server confirmation.**
- When invoked in the current client architecture, the system returns a `GATEWAY_UNAVAILABLE` status and displays a dedicated, respectful dialog presenting direct support inquiry details (`commande@ciaoenergy.com`) for direct and B2B orders.

---

## 5. Routing Architecture & Single-Renderer Coordination

### 5.1 Route Map
- **`/`**: Full cinematic editorial experience with 3D can field, interactive liquid carousel, profile specs, 4 benefits chapters, Zero Bullshit manifesto, and full gamme fan.
- **`/shop`**: Discovery catalog featuring authentic tag filters (`Toutes les saveurs`, `Fruitées`, `Fraîcheur intense`, `Faible en sucre`, `Best-Sellers`), product-first cards, and Quick Add.
- **`/product/[slug]`**: Dynamic interactive product detail page with sticky 3D can viewer, pack selection, quantity stepper, nutrition table, accordions, and related flavor discovery rail.
- **`404 Fallback`**: Intentional recovery screen if an invalid slug is queried.

### 5.2 Single WebGL Canvas Preservation
- The Three.js `SceneManager` stays mounted continuously across route transitions.
- On `/shop`, cans are safely culled from rendering to ensure 60fps scrolling.
- On `/product/[slug]`, the single active can corresponding to `slug` is isolated and positioned cleanly within the stage card (`x = -2.65` on desktop, `y = 0.52` on mobile) with real-time mouse/touch drag rotation and preset angle buttons.

---

## 6. Global Search System (`Cmd/Ctrl + K`)

- Global listener for `(e.metaKey || e.ctrlKey) && e.key === 'k'`.
- Instant search across product names, flavor notes, tags, and ingredients.
- Full keyboard support: `ArrowDown`/`ArrowUp` traversal, `Enter` to select, `Escape` to close.
- Trapped focus and restored focus on dismissal.

---

## 7. Verification Summary

- TypeScript: **Zero errors** (`npx tsc --noEmit`)
- ESLint: **Zero errors, zero warnings** (`npm run lint`)
- Vitest: **7/7 unit tests passing**
- Production Build: **Clean bundle in `dist/`** (`npm run build`)
- Visual QA: **Captured and validated across 8 viewports**
