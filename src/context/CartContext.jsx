"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // canonical key helper
  function getKey(p) {
    return p?.stripe_product_id || p?.id;
  }

  // Add item or increase quantity
  function add(incoming, qty = 1) {
    if (!incoming) return;
    const key = getKey(incoming);
    if (!key) return;

    setItems((prev) => {
      const idx = prev.findIndex((it) => getKey(it) === key);
      if (idx !== -1) {
        const next = [...prev];
        const cur = next[idx];
        next[idx] = {
          ...cur,
          ...incoming,
          id: key,
          qty: (cur.qty || 1) + qty,
        };
        return next;
      }
      return [
        ...prev,
        {
          ...incoming,
          id: key,
          qty: Math.max(1, qty),
        },
      ];
    });
  }

  // ✅ Increment / Decrement wrappers
  function increment(idOrKey) {
    setItems((prev) =>
      prev.map((it) =>
        getKey(it) === idOrKey ? { ...it, qty: (it.qty || 1) + 1 } : it
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
        getKey(it) === idOrKey ? { ...it, qty: Math.max(1, qty) } : it
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
