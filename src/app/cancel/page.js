// apps/avasquishi/src/app/cancel/page.js
"use client";

import Link from "next/link";
import styles from "./cancel.module.css";

export default function CancelPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Order Cancelled</h1>
      <p className={styles.text}>
        Your payment was cancelled or did not complete.
      </p>
      <Link href="/products/" className={styles.backLink}>
        ← Back to Catalog
      </Link>
    </main>
  );
}
