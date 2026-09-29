"use client";

// Product tile used by every grid/rail. Expects a product from toProduct()
// (src/lib/product.js); badges, price and stock all come from that model.
import Link from "next/link";
import Image from "next/image";
import styles from "./ProductCard.module.css";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import { productBadges, toCartItem } from "@/lib/product";

const BADGE_CLASS = {
  out: styles.badgeOut,
  sale: styles.badgeSale,
  low: styles.badgeLow,
  new: styles.badgeNew,
};

export default function ProductCard({ product: p }) {
  const { add, qtyInCart } = useCart();
  if (!p || !p.active || !p.path) return null;

  const imageSrc = p.images[0] || "/placeholder.png";
  const badges = productBadges(p);
  const inCart = qtyInCart(p.stripeProductId || p.id);
  const atLimit = !p.soldOut && inCart >= p.stock;

  return (
    <div className={styles.card}>
      <div className={styles.badgeStack}>
        {badges.map((b) => (
          <span key={b.kind} className={`${styles.badge} ${BADGE_CLASS[b.kind]}`}>
            {b.label}
          </span>
        ))}
      </div>

      <Link href={p.path} className={styles.mediaLink} aria-label={`View ${p.name}`}>
        <div className={styles.mediaWrap}>
          <Image
            src={imageSrc}
            alt={p.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={styles.image}
          />
        </div>
      </Link>

      <div className={styles.body}>
        <div className={styles.meta}>
          <Link href={p.path} className={styles.title}>
            {p.name}
          </Link>
          {p.blurb ? <p className={styles.desc}>{p.blurb}</p> : null}

          <div className={styles.priceRow}>
            <span className={p.discountPercent ? styles.priceSale : styles.price}>{money(p.priceCents)}</span>
            {p.discountPercent ? <span className={styles.priceStruck}>{money(p.listPriceCents)}</span> : null}
          </div>
        </div>

        <div className={styles.actions}>
          {p.soldOut ? (
            <button className={styles.btnDisabled} disabled>
              Sold out
            </button>
          ) : atLimit ? (
            <button className={styles.btnDisabled} disabled title={`All ${p.stock} are in your cart`}>
              All in cart
            </button>
          ) : (
            <button className={styles.btn} onClick={() => add(toCartItem(p), 1)}>
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
