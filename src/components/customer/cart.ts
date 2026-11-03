// OWNER: P4
export type Item = { id: string; name: string; description: string; priceCents: number };
export type Cart = Record<string, number>;

export const MAX_QTY = 20;

export const ITEMS: Item[] = [
  { id: "drip", name: "Drip Coffee", description: "Medium roast, 12oz", priceCents: 435 },
  { id: "croissant", name: "Butter Croissant", description: "Baked this morning", priceCents: 375 },
  { id: "latte", name: "Oat Latte", description: "Espresso + oat milk", priceCents: 565 },
  { id: "bread", name: "Banana Bread", description: "Thick slice", priceCents: 325 },
  { id: "coldbrew", name: "Cold Brew", description: "16oz, steeped 18h", priceCents: 495 },
];

export function setQty(cart: Cart, id: string, qty: number): Cart {
  const next = { ...cart };
  const q = Math.min(MAX_QTY, Math.floor(qty));
  if (!(q > 0)) delete next[id];
  else next[id] = q;
  return next;
}

export function subtotalCents(cart: Cart): number {
  return ITEMS.reduce((sum, i) => sum + i.priceCents * (cart[i.id] ?? 0), 0);
}

export function cartCount(cart: Cart): number {
  return Object.entries(cart).reduce(
    (n, [id, q]) => n + (ITEMS.some((i) => i.id === id) ? q : 0),
    0,
  );
}

const key = (merchantId: string) => `p4:cart:${merchantId}`;

export function loadCart(merchantId: string): Cart {
  try {
    const raw = sessionStorage.getItem(key(merchantId));
    const parsed = raw ? JSON.parse(raw) : {};
    let cart: Cart = {};
    for (const [id, q] of Object.entries(parsed)) {
      if (typeof q === "number") cart = setQty(cart, id, q);
    }
    return cart;
  } catch {
    return {};
  }
}

export function saveCart(merchantId: string, cart: Cart): void {
  try {
    sessionStorage.setItem(key(merchantId), JSON.stringify(cart));
  } catch {
    /* storage unavailable: cart just won't persist */
  }
}

export function clearCart(merchantId: string): void {
  try {
    sessionStorage.removeItem(key(merchantId));
  } catch {
    /* ignore */
  }
}
