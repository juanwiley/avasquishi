"use client";
// Product-page Add to Cart with a quantity stepper. Expects a product from
// toProduct() (src/lib/product.js). You can't add more than is in stock,
// counting what's already in the cart.
import { useState } from "react";
import { useCart } from "@/context/CartContext.jsx";
import { toCartItem } from "@/lib/product";
import styles from "./AddToCartButton.module.css";

export default function AddToCartButton({ product: p }) {
  const { add, qtyInCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = qtyInCart(p.stripeProductId || p.id);
  const canAdd = Math.max(0, p.stock - inCart);
  const max = Math.max(1, canAdd);
  const disabled = p.soldOut || canAdd === 0;
  const q = Math.min(qty, max);

  function handleAdd() {
    if (disabled) return;
    add(toCartItem(p), q);
    setQty(1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  const label = p.soldOut ? "Sold out" : canAdd === 0 ? "All in cart" : added ? "Added! ✓" : "Add to Cart";

  return (
    <div className={styles.row}>
      {!disabled && max > 1 && (
        <div className={styles.qtyGroup} aria-label="Quantity">
          <button type="button" className={styles.qtyBtn} onClick={() => setQty(Math.max(1, q - 1))} disabled={q <= 1} aria-label="Decrease quantity">–</button>
          <span className={styles.qtyVal} aria-live="polite">{q}</span>
          <button type="button" className={styles.qtyBtn} onClick={() => setQty(Math.min(max, q + 1))} disabled={q >= max} aria-label="Increase quantity">+</button>
        </div>
      )}
      <button className="btn-primary" onClick={handleAdd} disabled={disabled}>
        {label}
      </button>
    </div>
  );
}
