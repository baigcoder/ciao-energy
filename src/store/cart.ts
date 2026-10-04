import { useCallback, useSyncExternalStore } from 'react';
import { getProductBySlug, PACK_OPTIONS, Product } from '../data/products';
import { COMMERCE } from '../data/brand';

export interface MixEntry {
  slug: string;
  count: number;
}

export interface CartItem {
  id: string; // `${productSlug}_${packOptionId}` or `mix_<contents>`
  productSlug: string; // flavor slug, or 'mix' for a mixed pack
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
  /** Mixed pack contents (flavor slug → cans). */
  mix?: MixEntry[];
}

export const MAX_LINE_QUANTITY = 99;
export const MIX_SLUG = 'mix';

export type AddResult = { ok: true; item: CartItem } | { ok: false; reason: 'unknown-pack' | 'out-of-stock' | 'line-full' | 'invalid-mix' };
export type PromoResult = { ok: true; percent: number } | { ok: false; reason: 'empty' | 'unknown' };

interface CartSnapshot {
  items: CartItem[];
  isOpen: boolean;
  lastAddedId: string | null;
  /** False when localStorage is blocked: the bag still works for this visit. */
  persistent: boolean;
  promo: { code: string; percent: number } | null;
  /** Last removed line, restorable for a few seconds. */
  removed: { item: CartItem; index: number } | null;
  /** Lines moved out of the bag to buy later (not counted in totals). */
  saved: CartItem[];
}

const STORAGE_KEY = 'grizzly_cart_v2';
const PROMO_KEY = 'grizzly_promo_v1';
const SAVED_KEY = 'grizzly_saved_v1';
const UNDO_MS = 6000;

let state: CartSnapshot = { items: [], isOpen: false, lastAddedId: null, persistent: true, promo: null, removed: null, saved: [] };
const listeners = new Set<() => void>();
let undoTimer: ReturnType<typeof setTimeout> | undefined;

function setState(next: Partial<CartSnapshot>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function packFor(id: string) {
  return PACK_OPTIONS.find((pack) => pack.id === id);
}

function toCartItem(product: Product, packOptionId: string, quantity: number): CartItem {
  const pack = product.packOptions.find((option) => option.id === packOptionId) ?? product.packOptions[0];
  return {
    id: `${product.slug}_${pack.id}`,
    productSlug: product.slug,
    productName: product.name,
    flavor: product.flavor,
    packOptionId: pack.id,
    packLabel: pack.label,
    packCount: pack.count,
    unitPrice: pack.unitPrice,
    price: pack.price,
    quantity,
    accentColor: product.accentColor,
    textureUrl: product.textureUrl,
  };
}

/** Builds a mixed-pack line; null if the contents don't fill a known pack size. */
function toMixItem(mix: MixEntry[], quantity: number): CartItem | null {
  const clean = mix.filter((entry) => entry.count > 0 && getProductBySlug(entry.slug));
  const total = clean.reduce((sum, entry) => sum + entry.count, 0);
  const pack = PACK_OPTIONS.find((option) => option.count === total && option.count >= 6);
  if (!pack || clean.length !== mix.filter((entry) => entry.count > 0).length) return null;
  const sorted = [...clean].sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    id: `mix_${sorted.map((entry) => `${entry.slug}-${entry.count}`).join('_')}`,
    productSlug: MIX_SLUG,
    productName: `Mixed pack`,
    flavor: sorted.map((entry) => `${entry.count}× ${getProductBySlug(entry.slug)?.name}`).join(', '),
    packOptionId: pack.id,
    packLabel: pack.label,
    packCount: pack.count,
    unitPrice: pack.unitPrice,
    price: pack.price,
    quantity,
    accentColor: getProductBySlug(sorted[0].slug)?.accentColor ?? '',
    textureUrl: getProductBySlug(sorted[0].slug)?.textureUrl ?? '',
    mix: sorted,
  };
}

/**
 * Boundary: persisted data is untrusted. Keep only lines that still exist in the
 * catalog and re-derive name and price from it, so stale or edited storage can
 * never change what the bag charges.
 */
function parseStoredItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const items: CartItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const { productSlug, packOptionId, quantity, mix } = entry as Partial<CartItem>;
    if (typeof productSlug !== 'string' || typeof quantity !== 'number') continue;
    const safeQuantity = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)));
    if (productSlug === MIX_SLUG) {
      if (!Array.isArray(mix)) continue;
      const entries = mix.filter((m): m is MixEntry => !!m && typeof m.slug === 'string' && typeof m.count === 'number');
      const item = toMixItem(entries, safeQuantity);
      if (item) items.push(item);
      continue;
    }
    const product = getProductBySlug(productSlug);
    if (!product || typeof packOptionId !== 'string' || !product.packOptions.some((option) => option.id === packOptionId)) continue;
    items.push(toCartItem(product, packOptionId, safeQuantity));
  }
  return items;
}

function readStorage() {
  try {
    const items = parseStoredItems(window.localStorage.getItem(STORAGE_KEY));
    const saved = parseStoredItems(window.localStorage.getItem(SAVED_KEY));
    const promoCode = window.localStorage.getItem(PROMO_KEY);
    const promo = promoCode && promoCode.toUpperCase() === COMMERCE.promo.code ? { code: COMMERCE.promo.code, percent: COMMERCE.promo.percent } : null;
    return { items, promo, saved };
  } catch {
    return { items: [], promo: null, saved: [], persistent: false };
  }
}

const serialise = (items: CartItem[]) =>
  JSON.stringify(items.map(({ productSlug, packOptionId, quantity, mix }) => ({ productSlug, packOptionId, quantity, mix })));

function persist(items: CartItem[], key = STORAGE_KEY) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, serialise(items));
    if (!state.persistent) setState({ persistent: true });
  } catch {
    if (state.persistent) setState({ persistent: false });
  }
}

if (typeof window !== 'undefined') {
  state = { ...state, ...readStorage() };
  // Keep several open tabs in step.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) setState({ items: parseStoredItems(event.newValue) });
    if (event.key === SAVED_KEY) setState({ saved: parseStoredItems(event.newValue) });
  });
}

function commit(items: CartItem[], extra: Partial<CartSnapshot> = {}) {
  persist(items);
  setState({ items, ...extra });
}

function upsert(item: CartItem, quantity: number): AddResult {
  const existing = state.items.find((line) => line.id === item.id);
  if (existing && existing.quantity >= MAX_LINE_QUANTITY) return { ok: false, reason: 'line-full' };
  const next = existing ? { ...existing, quantity: Math.min(MAX_LINE_QUANTITY, existing.quantity + quantity) } : item;
  const items = existing ? state.items.map((line) => (line.id === item.id ? next : line)) : [...state.items, next];
  commit(items, { lastAddedId: item.id });
  return { ok: true, item: next };
}

export const cartStore = {
  getItems: () => state.items,
  getSnapshot: () => state,
  getIsOpen: () => state.isOpen,

  addItem: (product: Product, packOptionId: string = 'pack-6', quantity: number = 1): AddResult => {
    const pack = product.packOptions.find((option) => option.id === packOptionId);
    if (!pack) return { ok: false, reason: 'unknown-pack' };
    if (!pack.inStock) return { ok: false, reason: 'out-of-stock' };
    const safeQuantity = Math.max(1, Math.min(MAX_LINE_QUANTITY, Math.floor(quantity)));
    return upsert(toCartItem(product, pack.id, safeQuantity), safeQuantity);
  },

  addMix: (mix: MixEntry[], quantity: number = 1): AddResult => {
    const item = toMixItem(mix, quantity);
    if (!item) return { ok: false, reason: 'invalid-mix' };
    return upsert(item, quantity);
  },

  removeItem: (itemId: string) => {
    const index = state.items.findIndex((item) => item.id === itemId);
    if (index < 0) return;
    const item = state.items[index];
    clearTimeout(undoTimer);
    commit(state.items.filter((line) => line.id !== itemId), { removed: { item, index } });
    undoTimer = setTimeout(() => setState({ removed: null }), UNDO_MS);
  },

  undoRemove: () => {
    const removed = state.removed;
    if (!removed) return;
    clearTimeout(undoTimer);
    const items = [...state.items];
    items.splice(Math.min(removed.index, items.length), 0, removed.item);
    commit(items, { removed: null });
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.removeItem(itemId);
      return;
    }
    const safeQuantity = Math.min(MAX_LINE_QUANTITY, Math.floor(quantity));
    commit(state.items.map((item) => (item.id === itemId ? { ...item, quantity: safeQuantity } : item)));
  },

  applyPromo: (code: string): PromoResult => {
    const value = code.trim().toUpperCase();
    if (!value) return { ok: false, reason: 'empty' };
    if (value !== COMMERCE.promo.code) return { ok: false, reason: 'unknown' };
    try {
      window.localStorage.setItem(PROMO_KEY, value);
    } catch {
      // promo still applies for this visit
    }
    setState({ promo: { code: value, percent: COMMERCE.promo.percent } });
    return { ok: true, percent: COMMERCE.promo.percent };
  },

  removePromo: () => {
    try {
      window.localStorage.removeItem(PROMO_KEY);
    } catch {
      // ignore
    }
    setState({ promo: null });
  },

  clearCart: () => commit([], { removed: null }),

  /** Moves a bag line to the saved list (merging with a saved line of the same pack). */
  saveForLater: (itemId: string) => {
    const item = state.items.find((line) => line.id === itemId);
    if (!item) return;
    const saved = [...state.saved.filter((line) => line.id !== itemId), item];
    persist(saved, SAVED_KEY);
    commit(state.items.filter((line) => line.id !== itemId), { saved, removed: null });
  },

  moveToBag: (itemId: string) => {
    const item = state.saved.find((line) => line.id === itemId);
    if (!item) return;
    // Only leave the saved list once the bag has actually taken the line.
    if (!upsert(item, item.quantity).ok) return;
    const saved = state.saved.filter((line) => line.id !== itemId);
    persist(saved, SAVED_KEY);
    setState({ saved });
  },

  removeSaved: (itemId: string) => {
    const saved = state.saved.filter((line) => line.id !== itemId);
    persist(saved, SAVED_KEY);
    setState({ saved });
  },

  setIsOpen: (open: boolean) => setState({ isOpen: open }),

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

/** Totals for a bag: subtotal, discount, delivery and progress to free delivery. */
export function getTotals(items: CartItem[], promo: CartSnapshot['promo']) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promo ? Math.round((subtotal * promo.percent) / 100) : 0;
  const afterDiscount = subtotal - discount;
  const threshold = COMMERCE.freeDeliveryThreshold;
  const delivery = items.length === 0 || afterDiscount >= threshold ? 0 : COMMERCE.deliveryFee;
  return {
    subtotal,
    discount,
    delivery,
    total: afterDiscount + delivery,
    toFreeDelivery: Math.max(0, threshold - afterDiscount),
    freeDeliveryProgress: Math.min(1, afterDiscount / threshold),
  };
}

const getServerSnapshot = () => state;

export function useCart() {
  const snapshot = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, getServerSnapshot);
  const totalCount = snapshot.items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = getTotals(snapshot.items, snapshot.promo);

  const toggleCart = useCallback((open?: boolean) => {
    cartStore.setIsOpen(open ?? !cartStore.getIsOpen());
  }, []);

  return {
    items: snapshot.items,
    isOpen: snapshot.isOpen,
    lastAddedId: snapshot.lastAddedId,
    persistent: snapshot.persistent,
    promo: snapshot.promo,
    removed: snapshot.removed,
    saved: snapshot.saved,
    totalCount,
    subtotal: totals.subtotal,
    totals,
    addItem: cartStore.addItem,
    addMix: cartStore.addMix,
    removeItem: cartStore.removeItem,
    undoRemove: cartStore.undoRemove,
    updateQuantity: cartStore.updateQuantity,
    applyPromo: cartStore.applyPromo,
    removePromo: cartStore.removePromo,
    clearCart: cartStore.clearCart,
    saveForLater: cartStore.saveForLater,
    moveToBag: cartStore.moveToBag,
    removeSaved: cartStore.removeSaved,
    toggleCart,
  };
}

export interface CheckoutResult {
  status: 'GATEWAY_UNAVAILABLE' | 'SUCCESS';
  message: string;
}

/**
 * Online payment stub: no payment provider is connected, so this never reports a
 * paid order. Cash on delivery goes through the checkout form instead.
 */
export async function createCheckoutSession(items: CartItem[]): Promise<CheckoutResult> {
  if (items.length === 0) {
    return { status: 'GATEWAY_UNAVAILABLE', message: 'Your bag is empty.' };
  }
  return {
    status: 'GATEWAY_UNAVAILABLE',
    message: 'Card payment isn’t available yet. Choose cash on delivery at checkout.',
  };
}

export { packFor };
