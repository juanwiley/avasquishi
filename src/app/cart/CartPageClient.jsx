"use client";
import { useMemo } from "react";

import Image from "next/image";
import Link from "next/link";
import s from "./cart.module.css";
import { useCart } from "@/context/CartContext";

function money(n, c = "USD") {
  const v = typeof n === "number" ? n : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(v / 100);
}

// local helper to compute the effective per-unit price (in cents)
const unitCents = (it) => {
  const list = Number(it?.unit_amount ?? 0);
  const pct  = it?.discount_percent != null ? Number(it.discount_percent) : null;
  if (pct && pct > 0) return Math.max(0, Math.round(list * (1 - pct / 100)));
  if (it?.sale_price != null) return Number(it.sale_price);
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
    totals,      // { beforeDiscountCents, subTotalCents, discountCents, qty, count }
  } = useCart();

  // Fallback if `totals` isn’t populated by context for some reason.
// We compute: originalTotal, discount, and subtotal = (original - discount).
const safeTotals = useMemo(() => {
  if (totals && typeof totals.subTotalCents === "number") return totals;

  let originalTotalCents = 0;
  let discountCents = 0;

  for (const it of items) {
    const qty = Number(it.qty ?? 1);
    const unit = Number(it.unit_amount ?? 0);               // cents
    const sale = it.sale_price != null ? Number(it.sale_price) : null; // cents
    const dp = it.discount_percent != null ? Number(it.discount_percent) : null;

    const original = sale ?? unit;                           // base price
    const discounted = dp ? Math.round(original * (1 - dp / 100)) : original;

    originalTotalCents += original * qty;
    if (dp) discountCents += Math.max(0, original - discounted) * qty;
  }

  const subTotalCents = originalTotalCents - discountCents;
  return { originalTotalCents, discountCents, subTotalCents };
}, [items, totals]);

// Human-friendly values (dollars)
const savings = (safeTotals.discountCents ?? 0) / 100;
const subTotal = (safeTotals.subTotalCents ?? 0) / 100;
  
  // Ensure each line has a price id for Stripe
const purchasable = items.filter(it => !!it.stripe_price_id);

  async function handleCheckout() {
    if (!purchasable.length) {
      alert("No purchasable items in the cart (missing stripe_price_id).");
      return;
    }
    try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: purchasable.map(it => ({
                price: it.stripe_price_id,      // 👈 Stripe price id
                quantity: it.qty ?? 1,
                name: it.name,
                image: it.image_url ?? null,
    })),



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

          {/* Show savings when applicable */}
          {savings > 0 && (
            <div className={s.summaryRow}>
              <span>Savings</span>
              <strong className={s.savings}>–{money(savings*100, currency)}</strong>
            </div>
          )}

          <div className={s.summaryRow}>
            <span>Subtotal</span>
            <strong>{money(subTotal*100, currency)}</strong>
          </div>

          <p className={s.note}>
            Applicable tax and shipping are calculated at Stripe checkout.
          </p>

          <button type="button" className={s.checkout} onClick={handleCheckout}>
            Checkout
          </button>
        </section>
      </div>
    </main>
  );
}
