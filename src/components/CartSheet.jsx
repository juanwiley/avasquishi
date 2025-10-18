"use client";

import Image from "next/image";
import styles from "./CartSheet.module.css";
import { useCart } from "@/context/CartContext";

// cents the UI should charge for one unit
function unitCents(it) {
  const baseCents =
    typeof it.unit_amount === "number"
      ? it.unit_amount
      : Math.round((it.price ?? 0) * 100); // fallback for legacy "price" in dollars

  if (typeof it.discount_percent === "number" && it.discount_percent > 0) {
    return Math.round(baseCents * (1 - it.discount_percent / 100));
  }
  if (typeof it.sale_price === "number") {
    return Math.round(it.sale_price); // store sale_price as cents if you do; otherwise *100
  }
  return baseCents;
}

export default function CartSheet() {
  const { items, remove, setQty, subtotal, isOpen, setIsOpen } = useCart();

  const lineCents = unitCents(p) * (p.qty || 1);

  const onCheckout = async () => {
    // Wire this to your Stripe Checkout API route later (/api/create-checkout-session)
    alert("Checkout will redirect to Stripe in the next step. (API route TBD)");
  };

  return (
    <div className={`${styles.overlay} ${isOpen ? styles.open : ""}`} aria-hidden={!isOpen}>
      <div className={styles.sheet} role="dialog" aria-label="Shopping Cart">
        <div className={styles.header}>
          <button className={styles.back} onClick={() => setIsOpen(false)} aria-label="Close cart">←</button>
          <div className={styles.title}>Your Cart</div>
          <button className={styles.close} onClick={() => setIsOpen(false)} aria-label="Close cart">✕</button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>Your cart is empty.</div>
          ) : (
            items.map(p => (
              <div className={styles.row} key={p.id}>
                <div className={styles.thumb}>
                  {p.image_url ? (
                    <Image src={p.image_url} alt={p.name} fill className={styles.img} />
                  ) : <div className={styles.placeholder} />}
                </div>
                <div className={styles.meta}>
                  <div className={styles.name}>{p.name}</div>
                  <div className={styles.controls}>
                    <button onClick={() => setQty(p.id, Math.max(1, (p.qty || 1) - 1))} aria-label="Decrease">−</button>
                    <span className={styles.qty}>{p.qty || 1}</span>
                    <button onClick={() => setQty(p.id, (p.qty || 1) + 1)} aria-label="Increase">+</button>
                    <button className={styles.remove} onClick={() => remove(p.id)} aria-label="Remove">Remove</button>
                  </div>
                </div>
                <div className={styles.price}>${(lineCents / 100).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.subtotalRow}>
            <span>Subtotal</span>
            <strong>${(subtotal / 100).toFixed(2)}</strong>
          </div>
          <button className={styles.checkout} onClick={onCheckout} disabled={items.length === 0}>
            Checkout with Stripe
          </button>
          <button className={styles.continue} onClick={() => setIsOpen(false)}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
