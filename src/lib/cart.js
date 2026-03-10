const CART_KEY = "wp_cart_v1";

function readRaw() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: {} };
  } catch {
    return { items: {} };
  }
}

function writeRaw(state) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function getCart() {
  const s = readRaw();
  return s || { items: {} };
}

export function clearCart() {
  writeRaw({ items: {} });
}

export function getCartItemById(id) {
  const s = readRaw();
  return s?.items?.[id] || null;
}

export function addOrUpdateCartItem(item) {
  const s = readRaw();
  const next = s || { items: {} };

  const clampedQty = Math.max(
    0,
    Math.min(item.availableQty ?? 0, item.quantity ?? 0)
  );

  if (clampedQty === 0) {
    delete next.items[item.id];
  } else {
    next.items[item.id] = {
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl || null,
      unitAmount: item.unitAmount, // cents
      currency: (item.currency || "usd").toLowerCase(),
      availableQty: item.availableQty ?? 0,
      quantity: clampedQty,
    };
  }

  writeRaw(next);
  return next.items[item.id] || null;
}

export function removeCartItem(id) {
  const s = readRaw();
  if (!s?.items?.[id]) return;
  delete s.items[id];
  writeRaw(s);
}

export function getCartItemsArray() {
  const s = readRaw();
  if (!s?.items) return [];
  return Object.values(s.items);
}

export function getCartTotals() {
  const items = getCartItemsArray();
  const totalUnits = items.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const subtotalCents = items.reduce(
    (sum, it) => sum + (it.quantity || 0) * (it.unitAmount || 0),
    0
  );
  return { totalUnits, subtotalCents };
}
