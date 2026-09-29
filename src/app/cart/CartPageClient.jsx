"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import s from "./cart.module.css";
import { useCart } from "@/context/CartContext";
import { money } from "@/lib/money";
import { track } from "@/lib/analytics";
import { effectivePriceCents } from "@/lib/product";
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  centsUntilFreeShipping,
  quoteShippingCents,
} from "@/lib/shipping";

// Effective per-unit price in cents (shared rule, same as /api/checkout).
const unitCents = (it) => effectivePriceCents(it);

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

  const shippingCents = quoteShippingCents(safeTotals.subTotalCents ?? 0).amount;
  const remainingForFreeCents = centsUntilFreeShipping(safeTotals.subTotalCents ?? 0);
  const freeShippingProgress = Math.min(1, (safeTotals.subTotalCents ?? 0) / FREE_SHIPPING_THRESHOLD_CENTS);

  const itemCount = items.reduce((n, it) => n + Number(it.qty ?? 1), 0);

  // subtotal including shipping (display-only)
  const subtotalWithShippingCents = (safeTotals.subTotalCents ?? 0) + shippingCents;

  // All items sent as price_data — no catalog price references.
  // metadata embeds inventory_item_id (UUID) as primary reconciliation key.
  async function handleCheckout() {
    if (!items?.length) return;

    track("checkout_started", {
      items: itemCount,
      value_cents: safeTotals.subTotalCents ?? 0,
      shipping_cents: shippingCents,
    });

    const lineItems = items.map((it) => {
      const qty = Math.max(1, Number(it.qty ?? 1));
      const eff = unitCents(it); // cents (int)

      const metadata = { source: "avasquishi-cart" };
      if (it.inventory_item_id) metadata.inventory_item_id = String(it.inventory_item_id);
      if (it.stripe_product_id) metadata.stripe_product_id = String(it.stripe_product_id);

      return {
        price_data: {
          currency: String(it.currency || "usd").toLowerCase(),
          unit_amount: Number(eff), // cents
          product_data: {
            name: String(it.name || "Item"),
            images: it.image_url ? [String(it.image_url)] : undefined,
            metadata,
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
                      disabled={Number.isFinite(Number(it.stock)) && (it.qty ?? 1) >= Number(it.stock)}
                      title={Number.isFinite(Number(it.stock)) && (it.qty ?? 1) >= Number(it.stock) ? `Only ${it.stock} in stock` : undefined}
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

          {/* Free-shipping progress */}
          <div className={s.freeShip}>
            <p className={s.freeShipText} aria-live="polite">
              {remainingForFreeCents > 0 ? (
                <>
                  Add <strong>{money(remainingForFreeCents, currency)}</strong> more to get free shipping!
                </>
              ) : (
                <>🎉 You&apos;ve unlocked <strong>free shipping!</strong></>
              )}
            </p>
            <div
              className={s.freeShipTrack}
              role="progressbar"
              aria-label="Progress toward free shipping"
              aria-valuemin={0}
              aria-valuemax={FREE_SHIPPING_THRESHOLD_CENTS / 100}
              aria-valuenow={Math.min(safeTotals.subTotalCents ?? 0, FREE_SHIPPING_THRESHOLD_CENTS) / 100}
            >
              <div
                className={s.freeShipFill}
                style={{ width: `${Math.round(freeShippingProgress * 100)}%` }}
              />
            </div>
          </div>

          {/* Subtotal = items only (after any product discounts) */}
          <div className={s.summaryRow}>
            <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
            <strong>{money(safeTotals.subTotalCents ?? 0, currency)}</strong>
          </div>

          {savings > 0 && (
            <div className={s.summaryRow}>
              <span>You save</span>
              <strong className={s.savings}>{money(savings * 100, currency)}</strong>
            </div>
          )}

          {/* Shipping: rule shared with /api/checkout via @/lib/shipping */}
          <div className={s.summaryRow}>
            <span>Shipping</span>
            <strong>{shippingCents === 0 ? "Free" : money(shippingCents, currency)}</strong>
          </div>

          <div className={s.summaryRow}>
            <span>Total before tax</span>
            <strong>{money(subtotalWithShippingCents, currency)}</strong>
          </div>

          <p className={s.note}>
            Sales tax, if any, is added at Stripe checkout, which shows your final total.
            Promo codes can be entered there too.
          </p>

          <button type="button" className={s.checkout} onClick={handleCheckout}>
            Checkout
          </button>
        </section>
      </div>
    </main>
  );
}
