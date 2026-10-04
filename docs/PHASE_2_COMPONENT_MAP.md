# CIAO ENERGY — PHASE 2 COMPONENT MAP
**Authority Reference Document**
**Status:** Approved Architectural Blueprint
**Scope:** Component Hierarchy, Props Contracts, State Flow, 3D WebGL Scene Integration

---

## 1. Global Component Tree Hierarchy

```text
App
├── Preloader (onReady)
├── FramingTicks (Hairline edge HUD)
├── ConicAtmosphereGlow (Data-driven flavor conic bloom)
├── WebGL Canvas (Single persistent Three.js SceneManager) OR FallbackStage
├── ProductHotspots (Contextual 3D callouts on Hero & PDP)
├── ProgressIndicator (Persistent Intelligence HUD)
├── CiaoHeader
│   ├── AudioControl (Ambient brand tone generator)
│   ├── BrandLogo (SVG typographic vector)
│   ├── SearchTrigger (Opens GlobalSearch Cmd+K)
│   ├── CartTrigger (Persistent badge with item count)
│   └── MenuTrigger (Opens MenuDrawer)
├── MenuDrawer (Full overlay navigation)
├── CartDrawer (Slide-over right drawer on desktop, bottom sheet on mobile)
│   ├── FreeShippingMeter
│   ├── CartItemList
│   │   └── CartItemRow
│   │       ├── Thumbnail (Can preview)
│   │       ├── Details (Name, pack, unit price)
│   │       ├── QuantityControl (+/- buttons, min 1, max 99)
│   │       └── RemoveButton
│   └── CartFooter (Subtotal, Tax, Checkout CTA, Unavailable Modal)
├── GlobalSearch (Cmd/Ctrl + K command palette dialog)
├── ToastNotification (Non-intrusive "Ajouté au panier" micro-banner)
│
└── Route Switcher
    ├── Route: '/' (Cinematic Editorial Experience)
    │   ├── HeroCarousel (Gamme index, dynamic title, 3D carousel)
    │   ├── ProfileSection (Factual specification grid, single can)
    │   ├── BenefitsSection (4 comparative transition chapters)
    │   ├── ArgumentSection (Zero Bullshit typographic can lockup)
    │   ├── FullGammeSection (6-can collector packshot discovery)
    │   ├── FaqSection (Structured accordion)
    │   └── NewsletterFooter (Conversion form, legal imprint)
    │
    ├── Route: '/shop' (Discovery Catalog)
    │   ├── ShopHeader (Editorial headline & range introduction)
    │   ├── ShopFilterBar (All, Fruité, Frais, Faible en sucre, Best-sellers)
    │   ├── ShopGrid
    │   │   └── ProductCard (3D/asset preview, pack selector, price, Quick Add)
    │   └── ShopFooter
    │
    ├── Route: '/product/:slug' (Interactive 3D Product Detail)
    │   ├── BreadcrumbNav ('Boutique / [Nom du Produit]')
    │   ├── ProductDetailGrid
    │   │   ├── Left Column: Interactive 3D Can Viewer (Drag rotate, orbital zoom, reset)
    │   │   └── Right Column: Commerce Suite
    │   │       ├── ProductHeader (Name, Flavor, Badge, Rating-free authenticity)
    │   │       ├── PricingDisplay (Current pack price + unit price / can)
    │   │       ├── PackSelector (Single, Pack 6, Pack 12, Case 24)
    │   │       ├── QuantityControl (>=48px touch targets)
    │   │       ├── AddToCartButton (Cart action + animation)
    │   │       ├── Accordions (Ingrédients, Valeurs Nutritionnelles, Livraison, Éco-engagement)
    │   │       └── HotspotQuickPills
    │   ├── RelatedProductsRail ("Vous aimerez aussi")
    │   └── ShopFooter
    │
    └── Route: '404' (Not Found)
        └── Intentional error recovery screen with return link to '/shop'
```

---

## 2. Component Specifications & Props Contracts

### 2.1 `QuantityControl.tsx`
- **Location**: `src/components/QuantityControl.tsx`
- **Props**:
  ```typescript
  interface QuantityControlProps {
    value: number;
    onChange: (newValue: number) => void;
    min?: number; // default 1
    max?: number; // default 99
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    ariaLabel?: string;
  }
  ```
- **Accessibility**:
  - `role="group"` with `aria-label="Sélectionner la quantité"`
  - `button aria-label="Diminuer la quantité"` and `button aria-label="Augmenter la quantité"`
  - `input type="number"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
  - Touch targets guaranteed $\ge 48\text{px} \times 48\text{px}$.

### 2.2 `CartDrawer.tsx`
- **Location**: `src/components/CartDrawer.tsx`
- **Props**:
  ```typescript
  interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- **Behavior**:
  - Escape key listener to close.
  - Traps focus within drawer when open.
  - Disables body scroll while drawer is active.
  - Accessible dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-label="Panier"`).
  - Checkout CTA invokes `createCheckoutSession()` and shows graceful unavailable dialog if no gateway is active.

### 2.3 `GlobalSearch.tsx`
- **Location**: `src/components/GlobalSearch.tsx`
- **Props**:
  ```typescript
  interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProduct: (slug: string) => void;
  }
  ```
- **Shortcuts**: Listens to `keydown` for `(e.metaKey || e.ctrlKey) && e.key === 'k'` and `Escape`.
- **Search Scope**: Indexes product name, flavor notes, tags, and key ingredients from `src/data/products.ts`.

### 2.4 `ShopPage.tsx`
- **Location**: `src/components/ShopPage.tsx`
- **Props**:
  ```typescript
  interface ShopPageProps {
    onNavigateProduct: (slug: string) => void;
    onAddToCart: (product: Product, packOptionId: string, quantity: number) => void;
  }
  ```

### 2.5 `ProductDetailPage.tsx`
- **Location**: `src/components/ProductDetailPage.tsx`
- **Props**:
  ```typescript
  interface ProductDetailPageProps {
    slug: string;
    onNavigateProduct: (slug: string) => void;
    onAddToCart: (product: Product, packOptionId: string, quantity: number) => void;
    onBackToShop: () => void;
  }
  ```

---

## 3. WebGL Scene Coordination with Routing

The `SceneManager` maintains a single WebGL context and adjusts camera targets and object visibility depending on active route:
1. **On Route `/`**:
   - Master scroll progress drives camera position and carousel.
   - At scroll `0.0`: Hero carousel active (3 cans visible).
   - At scroll `0.15--0.65`: Profile & Benefits (single can isolated, axial rotation).
   - At scroll `0.70--0.95`: Zero Bullshit & Full Gamme (6-can collector arc).
2. **On Route `/shop`**:
   - Sets camera to wide ambient stage: `camPos: (0, 0, 14)`, subtle idle floating motion.
   - Preserves can meshes ready in memory.
3. **On Route `/product/:slug`**:
   - Isolates the single active can corresponding to `slug`.
   - Positions can in Left Column space (`camPos: (-1.6, 0, 8.2)` on desktop).
   - Enables interactive pointer drag/swipe rotation with spring damping.
   - Exposes interactive reset button to re-align can to front face.
