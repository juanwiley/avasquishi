// GET /api/admin/summary?days=30|90|365 — owner dashboard data (stock, sales in the window, low stock).
// Auth: the caller sends its Supabase session token (Authorization: Bearer ...).
// The token is verified server-side and the user's email must be in ADMIN_EMAILS
// (comma-separated env var; defaults to the owner). Read-only: no writes anywhere.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isLowStock, lowStockThreshold } from "@/lib/stock";

export const dynamic = "force-dynamic";

const TENANT_ID = process.env.AVASQUISHI_TENANT_ID || "c113bbab-4d77-46c4-a2a8-5f6cbe4bd48f";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "jcwiley@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req) {
  const supabase = serviceClient();
  if (!supabase) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  // 1) Who is asking?
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const email = userData?.user?.email?.toLowerCase();
  if (userErr || !email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: "This account isn't an admin", email }, { status: 403 });
  }

  const reqDays = Number(new URL(req.url).searchParams.get("days"));
  const days = [30, 90, 365].includes(reqDays) ? reqDays : 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // 2) Inventory (this tenant only)
  const { data: items, error: invErr } = await supabase
    .schema("wileypay")
    .from("inventory_items")
    .select("id, name, active, quantity, restock_threshold, unit_amount, discount_percent, stripe_product_id, created_at")
    .eq("tenant_id", TENANT_ID)
    .order("name", { ascending: true });
  if (invErr) return NextResponse.json({ error: `inventory: ${invErr.message}` }, { status: 500 });

  // 3) Orders in the window, with their line items
  const { data: orders, error: ordErr } = await supabase
    .schema("wileypay")
    .from("orders")
    .select("id, created_at, status, item_subtotal_cents, shipping_amount_cents, tax_amount_cents, order_items ( item_id, qty, effective_price_cents )")
    .eq("tenant_id", TENANT_ID)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (ordErr) return NextResponse.json({ error: `orders: ${ordErr.message}` }, { status: 500 });

  // 4) Email signups (table may not exist yet → null)
  let subscribers = null;
  {
    const { count, error } = await supabase
      .schema("wileypay")
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", TENANT_ID)
      .is("unsubscribed_at", null);
    if (!error) subscribers = count ?? 0;
  }

  const sold = new Map(); // item_id -> { units, revenue_cents }
  for (const o of orders || []) {
    for (const li of o.order_items || []) {
      const cur = sold.get(li.item_id) || { units: 0, revenue_cents: 0 };
      cur.units += Number(li.qty || 0);
      cur.revenue_cents += Number(li.qty || 0) * Number(li.effective_price_cents || 0);
      sold.set(li.item_id, cur);
    }
  }

  const rows = (items || []).map((it) => {
    const s = sold.get(it.id) || { units: 0, revenue_cents: 0 };
    const qty = Number(it.quantity ?? 0);
    return {
      id: it.id,
      name: it.name,
      active: it.active !== false,
      stock: qty,
      threshold: lowStockThreshold(it.restock_threshold),
      low: isLowStock(qty, it.restock_threshold),
      out: qty <= 0,
      price_cents: Math.round(Number(it.unit_amount ?? 0)),
      discount_percent: it.discount_percent ?? null,
      units_sold: s.units,
      revenue_cents: s.revenue_cents,
      product_path: it.stripe_product_id ? `/products/${it.stripe_product_id}` : null,
    };
  });

  const active = rows.filter((r) => r.active);
  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_days: days,
    admin: email,
    totals: {
      orders: (orders || []).length,
      units_sold: rows.reduce((n, r) => n + r.units_sold, 0),
      item_revenue_cents: (orders || []).reduce((n, o) => n + Number(o.item_subtotal_cents || 0), 0),
      active_products: active.length,
      units_in_stock: active.reduce((n, r) => n + Math.max(0, r.stock), 0),
      low_stock: active.filter((r) => r.low).length,
      out_of_stock: active.filter((r) => r.out).length,
      subscribers,
    },
    items: rows,
    recent_orders: (orders || []).slice(0, 10).map((o) => ({
      created_at: o.created_at,
      status: o.status,
      units: (o.order_items || []).reduce((n, li) => n + Number(li.qty || 0), 0),
      item_subtotal_cents: o.item_subtotal_cents,
      shipping_cents: o.shipping_amount_cents,
      tax_cents: o.tax_amount_cents,
    })),
  });
}
