"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/money";
import s from "./admin.module.css";

const SORTS = {
  sold: { label: "Best sellers", fn: (a, b) => b.units_sold - a.units_sold || a.name.localeCompare(b.name) },
  stock: { label: "Lowest stock", fn: (a, b) => a.stock - b.stock || a.name.localeCompare(b.name) },
  name: { label: "Name", fn: (a, b) => a.name.localeCompare(b.name) },
};

export default function AdminClient() {
  const [state, setState] = useState({ status: "loading" });
  const [sort, setSort] = useState("sold");
  const [showInactive, setShowInactive] = useState(false);
  const [days, setDays] = useState(30);

  async function load(d = days) {
    setState({ status: "loading" });
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return setState({ status: "signed-out" });

    const res = await fetch(`/api/admin/summary?days=${d}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) return setState({ status: "signed-out" });
    if (res.status === 403) return setState({ status: "forbidden", email: body.email });
    if (!res.ok) return setState({ status: "error", message: body.error || `HTTP ${res.status}` });
    setState({ status: "ok", data: body });
  }

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const rows = useMemo(() => {
    if (state.status !== "ok") return [];
    return state.data.items.filter((r) => showInactive || r.active).sort(SORTS[sort].fn);
  }, [state, sort, showInactive]);

  if (state.status === "loading") return <main className={s.page}><p>Loading…</p></main>;

  if (state.status === "signed-out") {
    return (
      <main className={s.page}>
        <h1 className={s.h1}>Store admin</h1>
        <p>Sign in first: go to <Link href="/account">Account</Link>, request a magic link with the owner email, open it, then come back to <code>/admin</code>.</p>
      </main>
    );
  }

  if (state.status === "forbidden") {
    return (
      <main className={s.page}>
        <h1 className={s.h1}>Store admin</h1>
        <p>You&apos;re signed in as <strong>{state.email}</strong>, which isn&apos;t an admin account.</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className={s.page}>
        <h1 className={s.h1}>Store admin</h1>
        <p className={s.error}>Couldn&apos;t load data: {state.message}</p>
        <button type="button" onClick={() => load()}>Try again</button>
      </main>
    );
  }

  const { totals, window_days, generated_at, recent_orders } = state.data;
  const low = state.data.items.filter((r) => r.active && (r.low || r.out)).sort((a, b) => a.stock - b.stock);

  return (
    <main className={s.page}>
      <div className={s.headRow}>
        <h1 className={s.h1}>Store admin</h1>
        <div className={s.controls}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Time window">
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last 12 months</option>
          </select>
          <button type="button" className={s.refresh} onClick={() => load()}>Refresh</button>
        </div>
      </div>
      <p className={s.muted}>Sales cover the last {window_days} days · stock is live · updated {new Date(generated_at).toLocaleString()}</p>

      <section className={s.tiles}>
        <Tile label="Orders" value={totals.orders} />
        <Tile label="Units sold" value={totals.units_sold} />
        <Tile label="Item sales" value={money(totals.item_revenue_cents)} hint="before shipping & tax" />
        <Tile label="Units in stock" value={totals.units_in_stock} hint={`${totals.active_products} active products`} />
        <Tile label="Low stock" value={totals.low_stock} warn={totals.low_stock > 0} />
        <Tile label="Sold out" value={totals.out_of_stock} warn={totals.out_of_stock > 0} />
        <Tile label="Email signups" value={totals.subscribers ?? "–"} hint={totals.subscribers == null ? "table not set up" : "Squish Squad"} />
      </section>

      <section className={s.card}>
        <h2 className={s.h2}>Needs restocking</h2>
        {low.length === 0 ? (
          <p className={s.muted}>Nothing is low. 🎉</p>
        ) : (
          <ul className={s.lowList}>
            {low.map((r) => (
              <li key={r.id}>
                <span>{r.name}</span>
                <strong className={r.out ? s.bad : s.warn}>{r.out ? "Sold out" : `${r.stock} left`}</strong>
              </li>
            ))}
          </ul>
        )}
        <p className={s.muted}>&quot;Low&quot; means at or below the product&apos;s restock threshold (3 unless set in Supabase).</p>
      </section>

      <section className={s.card}>
        <div className={s.headRow}>
          <h2 className={s.h2}>Products</h2>
          <div className={s.controls}>
            <label>
              Sort{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show hidden</label>
          </div>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Product</th><th>Price</th><th>In stock</th><th>Sold ({window_days}d)</th><th>Sales ({window_days}d)</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={!r.active ? s.inactive : undefined}>
                  <td>
                    {r.product_path ? <Link href={r.product_path}>{r.name}</Link> : r.name}
                    {!r.active && <span className={s.tag}>hidden</span>}
                  </td>
                  <td>{money(r.price_cents)}{r.discount_percent ? <span className={s.tag}>{r.discount_percent}% off</span> : null}</td>
                  <td className={r.out ? s.bad : r.low ? s.warn : undefined}>{r.stock}</td>
                  <td>{r.units_sold}</td>
                  <td>{money(r.revenue_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.card}>
        <h2 className={s.h2}>Recent orders</h2>
        {recent_orders.length === 0 ? (
          <p className={s.muted}>No orders in the last {window_days} days.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>Date</th><th>Units</th><th>Items</th><th>Shipping</th><th>Tax</th></tr></thead>
              <tbody>
                {recent_orders.map((o, i) => (
                  <tr key={i}>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>{o.units}</td>
                    <td>{money(o.item_subtotal_cents)}</td>
                    <td>{money(o.shipping_cents)}</td>
                    <td>{money(o.tax_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className={s.muted}>Customer details and refunds live in the Stripe Dashboard.</p>
      </section>
    </main>
  );
}

function Tile({ label, value, hint, warn }) {
  return (
    <div className={`${s.tile} ${warn ? s.tileWarn : ""}`}>
      <div className={s.tileLabel}>{label}</div>
      <div className={s.tileValue}>{value}</div>
      {hint ? <div className={s.tileHint}>{hint}</div> : null}
    </div>
  );
}
