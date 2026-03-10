"use client";

import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export default function QuantityPicker({ productId, max = 10, disabled = false }) {
  const { items, setQty } = useCart();
  const current = items.find((p) => p.id === productId);
  const [qty, setLocalQty] = useState(current?.qty || 1);

  // Keep local qty in sync with global cart
  useEffect(() => {
    setLocalQty(current?.qty || 1);
  }, [current?.qty]);

  const dec = () => {
    const newQty = Math.max(1, qty - 1);
    setLocalQty(newQty);
    setQty(productId, newQty);
  };

  const inc = () => {
    const newQty = Math.min(max || 1, qty + 1);
    setLocalQty(newQty);
    setQty(productId, newQty);
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: ".5rem" }}>
      <button onClick={dec} disabled={disabled || qty <= 1} aria-label="Decrease quantity">–</button>
      <input
        type="number"
        min={1}
        max={max || 1}
        value={qty}
        onChange={(e) => {
          const newQty = Math.max(1, Math.min(Number(e.target.value || 1), max || 1));
          setLocalQty(newQty);
          setQty(productId, newQty);
        }}
        disabled={disabled}
        aria-label="Quantity"
        style={{ width: "3.5rem", textAlign: "center" }}
      />
      <button onClick={inc} disabled={disabled || qty >= (max || 1)} aria-label="Increase quantity">+</button>
    </div>
  );
}
