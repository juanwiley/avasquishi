"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { track, lineUnitCents } from "@/lib/analytics";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // canonical key helper
  function getKey(p) {
    return p?.stripe_product_id || p?.id;
  }

  // Units in stock for a cart line, if known (older saved carts may lack it).
  function stockOf(it) {
    const n = Number(it?.stock);
    return Number.isFinite(n) ? Math.max(0, n) : Infinity;
  }
  const clampQty = (it, q) => Math.max(1, Math.min(q, stockOf(it)));

  // Add item or increase quantity
  function add(incoming, qty = 1) {
    if (!incoming) return;
    const key = getKey(incoming);
    if (!key) return;

    track("add_to_cart", {
      product_id: key,
      name: incoming.name,
      qty,
      unit_cents: lineUnitCents(incoming),
    });

    setItems((prev) => {
      const idx = prev.findIndex((it) => getKey(it) === key);
      if (idx !== -1) {
        const next = [...prev];
        const cur = next[idx];
        const merged = { ...cur, ...incoming, id: key };
        next[idx] = { ...merged, qty: clampQty(merged, (cur.qty || 1) + qty) };
        return next;
      }
      const line = { ...incoming, id: key };
      return [...prev, { ...line, qty: clampQty(line, qty) }];
    });
  }

  // ✅ Increment / Decrement wrappers
  function increment(idOrKey) {
    setItems((prev) =>
      prev.map((it) =>
        getKey(it) === idOrKey ? { ...it, qty: clampQty(it, (it.qty || 1) + 1) } : it
      )
    );
  }

  function decrement(idOrKey) {
    setItems((prev) =>
      prev.map((it) =>
        getKey(it) === idOrKey
          ? { ...it, qty: Math.max(1, (it.qty || 1) - 1) }
          : it
      )
    );
  }

  function setQty(idOrKey, qty) {
    setItems((prev) =>
      prev.map((it) =>
        getKey(it) === idOrKey ? { ...it, qty: clampQty(it, qty) } : it
      )
    );
  }

  function remove(idOrKey) {
    setItems((prev) => prev.filter((it) => getKey(it) !== idOrKey));
  }

  function clear() {
    setItems([]);
  }

  const subtotal = items.reduce(
    (sum, p) => sum + (p.unit_amount ?? 0) * (p.qty || 1),
    0
  );

  const count = items.reduce((sum, p) => sum + (p.qty || 1), 0);

  // How many of a product are already in the cart (0 if none).
  const qtyInCart = (idOrKey) => items.find((it) => getKey(it) === idOrKey)?.qty || 0;

  // Load saved cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        add,
        remove,
        setQty,
        increment,
        decrement,
        clear,
        subtotal,
        count,
        qtyInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
