"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./ProductCard.module.css";
import { useCart } from "@/context/CartContext";

const formatCurrency = (cents) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    (cents ?? 0) / 100
  );

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const t = new Date(dateStr).getTime();
  return Number.isNaN(t) ? Infinity : Math.floor((Date.now() - t) / 86400000);
}

export default function ProductCard({ product }) {
  const { add } = useCart();
  const {
    id,
    name,
    description,
    image_url,
    active,
    unit_amount,
    quantity,
    restock_threshold,
    created_at,
    discount_percent,
    sale_price,
    stripe_price_id,
  } = product || {};

  // ----- pricing -----
  const basePrice = unit_amount ?? 0; // cents
  const hasDiscount =
    typeof discount_percent === "number" && discount_percent > 0;

  const discounted = hasDiscount
    ? Math.round(basePrice * (1 - discount_percent / 100))
    : typeof sale_price === "number"
    ? sale_price
    : basePrice;

  const original = hasDiscount
    ? typeof sale_price === "number"
      ? sale_price
      : basePrice
    : null;

  // Keep both flags as requested; isDiscounted mirrors your prior intent
  const isDiscounted =
    original != null ||
    (typeof discount_percent === "number" && discount_percent > 0);

  if (!active) return null;

  // ----- badges / states -----
  const isOut = quantity === 0;
  const isLow =
    !isOut &&
    typeof restock_threshold === "number" &&
    typeof quantity === "number"
      ? quantity <= restock_threshold
      : false;
  const isNew = daysSince(created_at) <= 14;

  return (
    <div className={styles.card}>
      <div className={styles.badgeStack}>
        {isOut && (
          <span className={`${styles.badge} ${styles.badgeOut}`}>
            OUT OF STOCK
          </span>
        )}
        {!isOut && hasDiscount && (
          <span className={`${styles.badge} ${styles.badgeSale}`}>
            {Math.round(discount_percent)}% OFF!
          </span>
        )}
        {!isOut && isLow && (
          <span className={`${styles.badge} ${styles.badgeLow}`}>LOW STOCK</span>
        )}
        {!isOut && isNew && (
          <span className={`${styles.badge} ${styles.badgeNew}`}>NEW</span>
        )}
      </div>

      <Link
        href={`/products/${id}`}
        className={styles.mediaLink}
        aria-label={`View ${name}`}
      >
        <div className={styles.mediaWrap}>
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={styles.media}
              priority={false}
            />
          ) : (
            <div className={styles.mediaPlaceholder}>No Image</div>
          )}
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Link href={`/products/${id}`} className={styles.title}>
            {name}
          </Link>
          {description ? (
            <p className={styles.desc}>{description}</p>
          ) : null}

          {/* ----- price row (fixed) ----- */}
          <div className={styles.priceRow}>
            {/* ----- price row (standardized) ----- */}
            <div className={styles.priceRow}>
              <span className={hasDiscount ? styles.priceSale : styles.price}>
                {formatCurrency(discounted)}
              </span>
              {original ? (
                <span className={styles.priceStruck}>
                  {formatCurrency(original)}
                </span>
              ) : null}
            </div>

          </div>
        </div>

        <div className={styles.actions}>
          {isOut ? (
            <button className={styles.btnDisabled} disabled>
              Out of Stock
            </button>
          ) : (
            <button
              className={styles.btn}
              onClick={() => add(product, 1)} // pass the full object
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
