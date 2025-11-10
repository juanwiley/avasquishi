"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./cart.module.css";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";

// local helper to compute the effective per-unit price (in cents)
const unitCents = (it) => {
  const list = Number(it?.unit_amount ?? 0);              // cents
  const pct  = it?.discount_percent != null ? Number(it.discount_percent) : null;
  if (pct && pct > 0) return Math.max(0, Math.round(list * (1 - pct / 100)));
  if (it?.sale_price != null && Number(it.sale_price) > 0) return Number(it.sale_price);
  return list;
};

export default function CartPageClient() {
  const {
    items,
    currency = "USD",
    increment,
    decrement,
    remove,
    clear,
    totals,      // if present, keep using it for summary display
  } = useCart();

  // Fallback totals (display only). Does not affect what we send to Stripe.
  const safeTotals = useMemo(() => {
    if (totals && typeof totals.subTotalCents === "number") return totals;

    let originalTotalCents = 0;
    let discountCents = 0;

    for (const it of items) {
      const qty = Number(it.qty ?? 1);
      const list = Number(it.unit_amount ?? 0);
      const sale = it.sale_price != null ? Number(it.sale_price) : null;
      const dp   = it.discount_percent != null ? Number(it.discount_percent) : null;

      const base = sale && sale > 0 ? sale : list;
      const eff  = dp && dp > 0 ? Math.round(base * (1 - dp / 100)) : base;

      originalTotalCents += base * qty;
      if (eff < base) discountCents += (base - eff) * qty;
    }

    const subTotalCents = originalTotalCents - discountCents;
    return { originalTotalCents, discountCents, subTotalCents };
  }, [items, totals]);

  const savings   = (safeTotals.discountCents ?? 0) / 100;
  const subTotal  = (safeTotals.subTotalCents ?? 0) / 100;

  const shippingCents = (safeTotals.subTotalCents ?? 0) >= 4000 ? 0 : 499;

  // --- NEW: subtotal including shipping (display-only)
  const subtotalWithShippingCents = (safeTotals.subTotalCents ?? 0) + shippingCents;

  // Build Stripe payload including discounted lines via price_data
  async function handleCheckout() {
    if (!items?.length) return;

    // Build mixed line items:
    // - No discount: send base Stripe price id (enables promo codes)
    // - With discount (sale_price or discount_percent): send price_data at effective cents
    const lineItems = items.map((it) => {
      const qty = Math.max(1, Number(it.qty ?? 1));
      const eff = unitCents(it); // cents (int)
      const hasDiscount =
        (Number(it.discount_percent || 0) > 0) ||
        (Number(it.sale_price || 0) > 0);

      if (!hasDiscount && it?.stripe_price_id) {
        // base price path
        return {
          price: String(it.stripe_price_id),
          quantity: qty,
        };
      }

      // discounted path
      return {
        price_data: {
          currency: String(it.currency || "usd").toLowerCase(),
          unit_amount: Number(eff), // cents
          product_data: {
            name: String(it.name || "Item"),
            images: it.image_url ? [String(it.image_url)] : undefined,
            metadata: {
              // keep these for reconciliation if you want
              stripe_price_id: String(it.stripe_price_id || ""),
              stripe_product_id: String(it.stripe_product_id || ""),
              source: "avasquishi-cart",
            },
          },
        },
        quantity: qty,
      };
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lineItems,
          allowPromotionCodes: true,
          metadata: { source: "avasquishi-cart" },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else throw new Error("No session URL received");
    } catch (err) {
      console.error(err);
      alert("Sorry—checkout could not start. Please try again.");
    }
  }

  if (!items?.length) {
    return (
      <main className={s.page}>
        <div className={s.container}>
          <h1 className={s.summaryTitle}>Your cart is empty</h1>
          <Link className={s.link} href="/products">Shop products</Link>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.container}>
        <ul className={s.list}>
          {items.map((it) => {
            const unit = Number(it.unit_amount ?? it.price ?? 0);
            const eff  = unitCents(it);
            const isDiscounted = eff < unit;

            return (
              <li key={it.id} className={s.row}>
                {/* thumb */}
                <div className={s.thumb}>
                  {it.image_url ? (
                    <Image src={it.image_url} alt={it.name} width={72} height={72} />
                  ) : null}
                </div>

                {/* info */}
                <div className={s.info}>
                  <div className={s.title}>{it.name}</div>
                  {it.description ? (
                    <p className={s.desc}>
                      {it.description.length > 120 ? it.description.slice(0, 117) + "…" : it.description}
                    </p>
                  ) : null}

                  {/* Unit price with discount treatment */}
                  <p className={s.unit}>
                    Unit:&nbsp;
                    {isDiscounted ? (
                      <>
                        <strong className={s.priceNow}>{money(eff, currency)}</strong>
                        <span className={s.priceWas}>{money(unit, currency)}</span>
                        {typeof it.discount_percent === "number" && it.discount_percent > 0 ? (
                          <span className={s.saveBadge}>{Math.round(it.discount_percent)}% OFF</span>
                        ) : null}
                      </>
                    ) : (
                      <strong>{money(unit, currency)}</strong>
                    )}
                  </p>
                </div>

                {/* actions */}
                <div className={s.actions}>
                  <div className={s.qtyGroup} aria-label="Quantity">
                    <button
                      type="button"
                      className={s.qtyBtn}
                      onClick={() => decrement(it.id)}
                      aria-label="Decrease"
                    >
                      –
                    </button>
                    <span className={s.qtyVal}>{it.qty ?? 1}</span>
                    <button
                      type="button"
                      className={s.qtyBtn}
                      onClick={() => increment(it.id)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>

                  <div className={s.lineTotal}>
                    {money(eff * (it.qty ?? 1), currency)}
                  </div>

                  <button
                    type="button"
                    className={s.remove}
                    onClick={() => remove(it.id)}
                    aria-label={`Remove ${it.name}`}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className={s.actionsBar}>
          <button type="button" className={s.qtyBtn} onClick={clear}>Clear cart</button>
          <Link className={s.link} href="/products">Continue shopping</Link>
        </div>

        <section className={s.summary}>
          <h2 className={s.summaryTitle}>Order Summary</h2>

          {/* Savings */}
          {savings > 0 && (
            <div className={s.summaryRow}>
              <span>Savings</span>
              <strong className={s.savings}>–{money(savings * 100, currency)}</strong>
            </div>
          )}

          {/* NEW: Shipping row (display-only) */}
          <div className={s.summaryRow}>
            <span>Shipping</span>
            <strong>{shippingCents === 0 ? "Free" : money(shippingCents, currency)}</strong>
          </div>

          {/* Subtotal */}
          <div className={s.summaryRow}>
            <span>Subtotal</span>
            <strong>{money(subtotalWithShippingCents, currency)}</strong>
          </div>

          {/* Note: only tax at Stripe now */}
          <p className={s.note}>
            Applicable tax is calculated at Stripe checkout.
          </p>

          <button type="button" className={s.checkout} onClick={handleCheckout}>
            Checkout
          </button>
        </section>
      </div>
    </main>
  );
}
