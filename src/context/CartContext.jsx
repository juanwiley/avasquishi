"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

/* ---------- helpers (small & stable) ---------- */
const toCents = (n) => {
  if (n == null) return null;
  const v = Number(n);
  if (Number.isNaN(v)) return null;
  // treat whole numbers > 50 as already-in-cents
  return v % 1 === 0 && v > 50 ? v : Math.round(v * 100);
};
const toPercent = (n) => {
  if (n == null) return null;
  const v = Number(n);
  return Number.isNaN(v) ? null : v;
};

// the effective unit price (in cents) for a cart line
export function effectiveUnitCents(it) {
  const list = Number(it?.unit_amount ?? 0);
  if (!it) return 0;

  // % OFF takes priority if present
  if (it.discount_percent != null && Number(it.discount_percent) > 0) {
    return Math.max(0, Math.round(list * (1 - Number(it.discount_percent) / 100)));
  }
  // else explicit sale price wins
  if (it.sale_price != null) return Number(it.sale_price);
  return list;
}

function calcSubAndSavings(items) {
  let sub = 0;
  let save = 0;
  for (const it of items) {
    const qty = Number(it.qty ?? 1);
    const list = Number(it.unit_amount ?? 0);
    const unit = effectiveUnitCents(it);
    sub += unit * qty;
    save += Math.max(0, list - unit) * qty;
  }
  return { subTotalCents: sub, savingsCents: save };
}

// normalize once as the item enters the cart
function normalize(product, qtyDelta = 1) {
  return {
    id: product.id,
    name: product.name,
    image_url: product.image_url ?? product.image ?? null,
    currency: product.currency ?? "USD",

    // amounts (cents)
    unit_amount: toCents(product.unit_amount ?? product.price ?? 0),
    sale_price: toCents(product.sale_price),
    discount_percent: toPercent(product.discount_percent),

    // keep price ids for Stripe
    stripe_price_id:
      product.stripe_price_id ?? product.price_id ?? product.stripe_priceid ?? null,
    stripe_product_id: product.stripe_product_id ?? product.product_id ?? null,

    // cart-specific
    qty: Number(product.qty ?? 0) + qtyDelta,
  };
}

/* ---------- hook ---------- */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/* ---------- provider ---------- */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [currency, setCurrency] = useState("USD");
  const [lastAddedAt, setLastAddedAt] = useState(0); // drives the red badge pop

  // load once
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart:v2");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.items)) setItems(parsed.items);
      if (parsed?.currency) setCurrency(parsed.currency);
    } catch {}
  }, []);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem("cart:v2", JSON.stringify({ items, currency }));
    } catch {}
  }, [items, currency]);

  // derived
  const { subTotalCents, savingsCents } = useMemo(
    () => calcSubAndSavings(items),
    [items]
  );
  const totalQty = useMemo(
    () => items.reduce((n, it) => n + Number(it.qty ?? 1), 0),
    [items]
  );

  /* ---------- mutators ---------- */
  const add = (product, qty = 1) => {
    setItems((curr) => {
      const idx = curr.findIndex((x) => x.id === product.id);
      if (idx === -1) {
        setLastAddedAt(Date.now());
        return [...curr, normalize(product, qty)];
      }
      const next = [...curr];
      const existing = next[idx];
      // merge new info (esp. stripe ids) without losing previous
      next[idx] = {
        ...existing,
        qty: Number(existing.qty ?? 0) + qty,
        unit_amount: existing.unit_amount ?? toCents(product.unit_amount ?? product.price ?? 0),
        sale_price: existing.sale_price ?? toCents(product.sale_price),
        discount_percent: existing.discount_percent ?? toPercent(product.discount_percent),
        stripe_price_id:
          existing.stripe_price_id ??
          product.stripe_price_id ??
          product.price_id ??
          product.stripe_priceid ??
          null,
        stripe_product_id: existing.stripe_product_id ?? product.stripe_product_id ?? null,
      };
      setLastAddedAt(Date.now());
      return next;
    });
  };

  const setQty = (id, qty) => {
    setItems((curr) =>
      curr.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, Number(qty || 1)) } : it
      )
    );
    setLastAddedAt(Date.now());
  };

  const increment = (id) =>
    setQty(id, (items.find((x) => x.id === id)?.qty || 1) + 1);
  const decrement = (id) =>
    setQty(id, (items.find((x) => x.id === id)?.qty || 1) - 1);

  // keep short aliases to avoid breaking older code
  const inc = increment;
  const dec = decrement;

  const remove = (id) => {
    setItems((curr) => curr.filter((it) => it.id !== id));
    setLastAddedAt(Date.now());
  };

  const clear = () => {
    setItems([]);
    setLastAddedAt(Date.now());
  };

  const value = useMemo(
    () => ({
      /* state */
      items,
      currency,
      /* derived */
      totalQty,
      subTotalCents,
      savingsCents,
      lastAddedAt,
      /* helpers */
      effectiveUnitCents,
      /* actions */
      add,
      setQty,
      increment,
      decrement,
      inc,
      dec,
      remove,
      clear,
    }),
    [items, currency, totalQty, subTotalCents, savingsCents, lastAddedAt]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
