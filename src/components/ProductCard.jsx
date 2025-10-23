"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./ProductCard.module.css";
import { useCart } from "@/context/CartContext";

const formatCurrency = (cents) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents ?? 0) / 100);

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
    active,
    unit_amount,
    quantity,
    restock_threshold,
    created_at,
    discount_percent,
    sale_price,
    stripe_price_id,
    stripe_product_id,
  } = product || {};

  // ✅ Unified hero for display + cart
  const imageSrc =
    (Array.isArray(product?.image_urls) && product.image_urls[0]) ||
    (Array.isArray(product?.images) && product.images[0]) ||
    product?.image_url ||
    "/placeholder.png";

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

  const isDiscounted =
    original != null ||
    (typeof discount_percent === "number" && discount_percent > 0);

  if (!active) return null;

  // ----- badges -----
  const isOut = quantity === 0;
  const isLow =
    !isOut &&
    typeof restock_threshold === "number" &&
    typeof quantity === "number"
      ? quantity <= restock_threshold
      : false;
  const isNew = daysSince(created_at) <= 14;

  // ✅ normalize payload so CartSheet always has image_url + numeric price
  function toCartPayload(p) {
    return {
      ...p,
      image_url: imageSrc,
      stripe_price_id: p.stripe_price_id || p.price_id || null,
      stripe_product_id: p.stripe_product_id || p.id || null,
      unit_amount: Number(p.unit_amount ?? 0),
      currency: "usd",
    };
  }

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
        href={`/products/${stripe_product_id}`}
        className={styles.mediaLink}
        aria-label={`View ${name}`}
      >
        <div className={styles.mediaWrap}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={styles.image}
              priority={false}
            />
          ) : (
            <div className={styles.mediaPlaceholder}>No Image</div>
          )}
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Link href={`/products/${stripe_product_id}`} className={styles.title}>
            {name}
          </Link>
          {description ? (
            <p className={styles.desc}>{description}</p>
          ) : null}

          {/* ----- price row ----- */}
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

        <div className={styles.actions}>
          {isOut ? (
            <button className={styles.btnDisabled} disabled>
              Out of Stock
            </button>
          ) : (
            <button
              className={styles.btn}
              onClick={() => add(toCartPayload(product), 1)}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
