"use client";
import { useEffect, useRef } from "react";
import styles from "./success.module.css";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function SuccessPage() {
  const { clear } = useCart();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const hasSessionId =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("session_id");

    if (hasSessionId) {
      try {
        // wipe any keys your CartContext may use to hydrate
        localStorage.removeItem("cart");
        localStorage.removeItem("cart_items");
        // optional: if your context writes a namespaced key (v1, etc.), force-empty it
        localStorage.setItem("cart_v1", "[]");
      } catch {
        // ignore storage errors (Safari private mode, etc.)
      }
      // then clear React state in the context
      clear();
    }
  }, []); // run exactly once

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Payment complete ✅</h1>
        <p className={styles.subtitle}>Thanks! Your cart has been cleared.</p>
        <div className={styles.actions}>
          <Link href="/products" className={styles.link}>
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
