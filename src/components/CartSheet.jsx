"use client";

import Image from "next/image";
import styles from "./CartSheet.module.css";
import { useCart } from "@/context/CartContext";

function unitCents(it) {
  const baseCents =
    typeof it.unit_amount === "number"
      ? it.unit_amount
      : Math.round((it.price ?? 0) * 100);

  if (typeof it.discount_percent === "number" && it.discount_percent > 0) {
    return Math.round(baseCents * (1 - it.discount_percent / 100));
  }
  if (typeof it.sale_price === "number") {
    return Math.round(it.sale_price);
  }
  return baseCents;
}

export default function CartSheet() {
  const { items, remove, setQty, subtotal } = useCart();

  const onCheckout = async () => {
    alert("Checkout will redirect to Stripe in the next step. (API route TBD)");
  };

  return (
    <div className={styles.sheet} role="dialog" aria-label="Shopping Cart">
      <div className={styles.header}>
        <div className={styles.title}>Your Cart</div>
      </div>

      <div className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.empty}>Your cart is empty.</div>
        ) : (
          items.map((p) => {
            const lineCents = unitCents(p) * (p.qty || 1);

            // ✅ robust thumbnail selection
            const thumb =
              (Array.isArray(p.image_url) && p.image_url[0]) ||
              (Array.isArray(p.image_urls) && p.image_urls[0]) ||
              (Array.isArray(p.images) && p.images[0]) ||
              p.image_url ||
              "/placeholder.png";

            return (
              <div className={styles.row} key={p.id}>
                <div className={styles.thumb}>
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={p.name || "Product image"}
                      fill
                      className={styles.img}
                      sizes="80px"
                    />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                </div>

                <div className={styles.meta}>
                  <div className={styles.name}>{p.name}</div>
                  <div className={styles.controls}>
                    <button
                      onClick={() =>
                        setQty(p.id, Math.max(1, (p.qty || 1) - 1))
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className={styles.qty}>{p.qty || 1}</span>
                    <button
                      onClick={() => setQty(p.id, (p.qty || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      className={styles.remove}
                      onClick={() => remove(p.id)}
                      aria-label="Remove from cart"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className={styles.price}>
                  ${(lineCents / 100).toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.subtotalRow}>
          <span>Subtotal</span>
          <strong>${(subtotal / 100).toFixed(2)}</strong>
        </div>
        <button
          className={styles.checkout}
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Checkout with Stripe
        </button>
      </div>
    </div>
  );
}
