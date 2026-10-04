# CIAO ENERGY — PHASE 2 COMMERCE BLUEPRINT
**Authority Reference Document**
**Status:** Approved Architectural Blueprint
**Scope:** Data Architecture, Pricing System, Cart State Machine, Checkout Abstraction, Product Navigation, Search

---

## 1. Commerce Philosophy

Ciao Energy integrates an authentic, production-grade commerce layer into the cinematic 3D experience without flattening the brand into a cookie-cutter Shopify template.

### Non-Negotiables
1. **No Fabricated Real-World Claims or Prices**: Pricing is realistic, explicit, and backed by a centralized TypeScript data configuration.
2. **No Fake Transactions**: Never simulate successful order placements or fake confirmation numbers without server verification. When no backend gateway is configured, provide an intentional, dignified customer support and direct inquiry fallback.
3. **No Fabricated Reviews/Ratings**: No star ratings or artificial customer reviews.
4. **Single Persistent 3D Context**: Route transitions between `/`, `/shop`, and `/product/[slug]` preserve the Three.js WebGL canvas and memory without tearing down WebGL contexts.
5. **Full WCAG 2.2 AA Compliance**: All product selection, quantity controls, pack configurations, and cart operations are accessible via keyboard, screen reader, and high-contrast styling.

---

## 2. Product Catalog Data Architecture

The catalog lives in `src/data/products.ts` as the single source of truth for all commerce and 3D visual modules.

### 2.1 Catalog Schema (`Product`)
```typescript
export interface PackOption {
  id: 'single' | 'pack-6' | 'pack-12' | 'case-24';
  label: string;
  count: number;
  price: number; // in Euros
  unitPrice: number; // in Euros per can
  badge?: string; // e.g. "Plus Populaire" or "-20%"
  inStock: boolean;
}

export type AvailabilityStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';

export interface NutritionalInfo {
  per100ml: {
    energyKj: number;
    energyKcal: number;
    fat: number;
    ofWhichSaturates: number;
    carbohydrates: number;
    ofWhichSugars: number;
    protein: number;
    salt: number;
    caffeineMg: number;
  };
  perCan250ml: {
    energyKcal: number;
    sugars: number;
    caffeineMg: number;
  };
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  flavor: string;
  index: number;
  tagline: string;
  shortDescription: string;
  description: string;
  accentColor: string;
  secondaryColor: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  currency: 'EUR';
  packOptions: PackOption[];
  availability: AvailabilityStatus;
  leadTime: string;
  origin: string;
  volume: string;
  ingredients: string[];
  nutritionalInfo: NutritionalInfo;
  features: string[];
  textureUrl: string;
  videoWebm?: string;
  videoMp4?: string;
  relatedSlugs: string[];
  tags: ('FRUITÉ' | 'FRAIS' | 'FAIBLE_EN_SUCRE' | 'BEST_SELLER')[];
}
```

### 2.2 Authentic Catalog Matrix
| Slug | Flavor Name | Tags | Default Pack (6x) | Single Can | Case (24x) | Stock Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `double-litchi` | Double Litchi | `FRUITÉ`, `BEST_SELLER` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |
| `coco-citron-vert` | Coco Citron Vert | `FRAIS`, `BEST_SELLER` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |
| `kiwi-concombre` | Kiwi Concombre | `FRAIS`, `FAIBLE_EN_SUCRE` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |
| `peche-blanche` | Pêche Blanche | `FRUITÉ`, `FAIBLE_EN_SUCRE` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |
| `pomme-rhubarbe` | Pomme Rhubarbe | `FRUITÉ`, `FRAIS` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |
| `abricot-framboise`| Abricot Framboise| `FRUITÉ`, `BEST_SELLER` | 14,50 € | 2,50 € | 48,00 € | `AVAILABLE` |

---

## 3. Client-Side Cart System (`src/store/cart.ts`)

### 3.1 Cart State Interface
```typescript
export interface CartItem {
  id: string; // Composite: `${productSlug}_${packOptionId}`
  productSlug: string;
  productName: string;
  flavor: string;
  packOptionId: string;
  packLabel: string;
  packCount: number;
  unitPrice: number;
  price: number;
  quantity: number;
  accentColor: string;
  textureUrl: string;
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
  lastAddedItem: CartItem | null;
  notificationVisible: boolean;
  freeShippingThreshold: number; // 35.00 EUR
}
```

### 3.2 State Actions & Invariants
- `addItem(product, packOptionId, quantity)`: Inserts item or updates existing composite key quantity. Triggers non-intrusive "Ajouté au panier" toast without hijacking screen.
- `removeItem(itemId)`: Removes item cleanly.
- `updateQuantity(itemId, quantity)`: Bounds quantity between $1 \le Q \le 99$.
- `clearCart()`: Empties cart.
- `toggleCart(isOpen?)`: Controls slide-over drawer visibility.
- **Persistence**: Synchronous read/write to `localStorage['ciao_energy_cart']` with `try/catch` guard for private browsing / blocked storage environments.

---

## 4. Checkout Abstraction Layer

```typescript
export interface CheckoutResult {
  status: 'SUCCESS' | 'REDIRECT' | 'GATEWAY_UNAVAILABLE';
  url?: string;
  message?: string;
}

export async function createCheckoutSession(items: CartItem[]): Promise<CheckoutResult> {
  // Graceful abstraction hook for Stripe / Shopify Headless / PayPlug
  if (items.length === 0) {
    return { status: 'GATEWAY_UNAVAILABLE', message: 'Votre panier est vide.' };
  }
  
  // Real gateway check: return clean unavailable status with official customer service contact
  return {
    status: 'GATEWAY_UNAVAILABLE',
    message: 'Les commandes en ligne directes sont en cours de déploiement final pour la France et l\'Europe. Contactez commande@ciaoenergy.com pour les précommandes professionnelles et particuliers.'
  };
}
```

---

## 5. Routing & Page Architecture

### 5.1 Route Map
1. **`/` (Homepage Experience)**:
   - Full Cinematic Scroll Chapter Experience (Hero $\to$ Profile $\to$ Benefits $\to$ Zero Bullshit $\to$ Full Range $\to$ FAQ $\to$ Footer).
2. **`/shop` (The Discovery Catalog)**:
   - Header with active Cart trigger.
   - Filter bar: `TOUS`, `FRUITÉ`, `FRAIS`, `FAIBLE EN SUCRE`, `BEST SELLERS`.
   - 6-can architectural grid featuring interactive 3D can preview, pack options, price, and Quick Add.
3. **`/product/[slug]` (Interactive 3D Product Detail Page)**:
   - Left Column: Sticky interactive 3D can viewer with pointer drag rotation, orbital control, and reset button.
   - Right Column: Title, flavor profile, pack size segmented picker (1 Canette, Pack 6, Pack 12, Carton 24), accessible $+/-$ quantity controls, Add to Cart CTA.
   - Secondary Panels: Collapsible accordions for Ingrédients, Valeurs Nutritionnelles, Livraison & Retours, FAQ spécifique.
   - Related Flavors: "Vous aimerez aussi" 3-flavor discovery rail.
4. **404 Fallback**: Clean brand error page when an invalid flavor slug is requested, directing back to `/shop`.

---

## 6. Global Search System (`Cmd/Ctrl + K`)

- **Trigger**: Persistent search icon in header and keyboard shortcut `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux).
- **Search Capabilities**: Instant search matching:
  - Product Name (e.g., "Litchi", "Kiwi")
  - Flavor Notes (e.g., "Concombre", "Frais", "Tropical")
  - Ingredients (e.g., "Café vert", "Stévia")
  - Tags (`FAIBLE_EN_SUCRE`, `BEST_SELLER`)
- **Keyboard Navigation**:
  - `ArrowDown` / `ArrowUp` for selection traversal.
  - `Enter` to navigate to `/product/[slug]`.
  - `Escape` to close modal.
  - Focus trapped within modal while active; restored to trigger element on close.
