// apps/avasquishi/src/app/success/page.js
"use client";

import Link from "next/link";
import styles from "./success.module.css";

export default function SuccessPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Thank you!</h1>
      <p className={styles.text}>
        Your order was placed successfully and will ship soon.
      </p>
      <Link href="/products/" className={styles.backLink}>
        Continue Shopping →
      </Link>
    </main>
  );
}
