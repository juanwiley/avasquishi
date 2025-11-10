// apps/avasquishi/src/app/api/checkout/route.js
// Minimal, server-only oversell clamp + your existing shipping behavior.
// - Clamps requested qty to available stock from wileypay.inventory_items
// - Skips OOS items
// - Keeps your mixed line_items (price vs price_data) intact
// - Shows $4.99 shipping under $40 subtotal; Free at $40+
// - No client/UI changes required

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = process.env.AVASQUISHI_TENANT_ID || "c113bbab-4d77-46c4-a2a8-5f6cbe4bd48f";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SHIPPING_PRICE_ID = process.env.SHIPPING_PRICE_ID;

function originFromRequest(req) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${proto}://${host}`;
}

// Cents helpers (your DB stores cents as numeric with ".00")
const toIntCents = (v) => {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

// Shipping quote: $4.99 under $40; free at $40+
function quoteShippingCents(subtotalCents) {
  return subtotalCents >= 4000 ? { amount: 0, label: "Free Shipping" } : { amount: 499, label: "Standard Shipping" };
}

// Build a lookup key to locate inventory rows for clamp
function resolveLookupKey(raw) {
  if (raw?.price) return { key: `price:${String(raw.price)}` };
  const md = raw?.price_data?.product_data?.metadata || {};
  if (md.stripe_price_id) return { key: `price:${String(md.stripe_price_id)}` };
  if (md.stripe_product_id) return { key: `prod:${String(md.stripe_product_id)}` };
  return { key: undefined };
}

// Compute effective cents for shipping threshold (list price for price lines; given unit_amount for price_data)
function effectiveLineCentsForShipping(raw, invRow) {
  const qty = Math.max(1, Number(raw?.quantity ?? 1));
  if (raw?.price && invRow) {
    // use list unit from inventory for threshold calc
    const listCents = toIntCents(invRow.unit_amount);
    return listCents * qty;
  }
  const pd = raw?.price_data;
  if (pd?.currency && Number.isFinite(Number(pd?.unit_amount))) {
    return Number(pd.unit_amount) * qty;
  }
  return 0;
}

// ⬇️ CHANGED: query priceIds and productIds separately, then merge
async function fetchInventoryRows(keys) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Map();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const priceIds = Array.from(new Set(keys.priceIds || [])).filter(Boolean);
  const productIds = Array.from(new Set(keys.productIds || [])).filter(Boolean);

  const map = new Map();

  const base = supabase
    .schema("wileypay")
    .from("inventory_items")
    .select("id, tenant_id, name, quantity, unit_amount, stripe_price_id, stripe_product_id")
    .eq("tenant_id", TENANT_ID);

  // Query by price IDs
  if (priceIds.length) {
    const { data, error } = await base.in("stripe_price_id", priceIds);
    if (error) {
      console.error("⚠️ fetchInventoryRows priceIds error:", error.message);
    } else {
      for (const r of data || []) {
        if (r.stripe_price_id) map.set(`price:${r.stripe_price_id}`, r);
        if (r.stripe_product_id) map.set(`prod:${r.stripe_product_id}`, r);
      }
    }
  }

  // Query by product IDs
  if (productIds.length) {
    const { data, error } = await base.in("stripe_product_id", productIds);
    if (error) {
      console.error("⚠️ fetchInventoryRows productIds error:", error.message);
    } else {
      for (const r of data || []) {
        if (r.stripe_price_id) map.set(`price:${r.stripe_price_id}`, r);
        if (r.stripe_product_id) map.set(`prod:${r.stripe_product_id}`, r);
      }
    }
  }

  return map;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.items) ? body.items : [];
    const allowPromotionCodes = !!body?.allowPromotionCodes;
    if (!incoming.length) return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    const stripe = await getStripe();
    const urlBase = originFromRequest(req);

    // 1) Gather keys for a single inventory fetch
    const priceIds = [];
    const productIds = [];
    for (const raw of incoming) {
      if (raw?.price) priceIds.push(String(raw.price));
      const md = raw?.price_data?.product_data?.metadata || {};
      if (md.stripe_price_id) priceIds.push(String(md.stripe_price_id));
      if (md.stripe_product_id) productIds.push(String(md.stripe_product_id));
    }
    const invMap = await fetchInventoryRows({ priceIds, productIds });

    // 2) Clamp quantities quietly; compute shipping threshold subtotal
    const line_items = [];
    let subtotalForShipping = 0;
    const clampNotes = [];

    for (const raw of incoming) {
      const requestedQty = Math.max(1, Number(raw?.quantity ?? 1));
      const { key } = resolveLookupKey(raw);
      const invRow = key ? invMap.get(key) : undefined;
      const stock = invRow && typeof invRow.quantity === "number" ? invRow.quantity : null;

      let finalQty = requestedQty;
      if (stock != null) {
        if (stock <= 0) {
          finalQty = 0; // skip OOS
          clampNotes.push(`OOS: ${invRow?.name || key}`);
        } else if (requestedQty > stock) {
          finalQty = stock; // clamp to available
          clampNotes.push(`Clamped ${invRow?.name || key} ${requestedQty} → ${finalQty}`);
        }
      }

      if (finalQty > 0) {
        // Preserve original structure (price vs price_data)
        if (raw?.price) {
          line_items.push({
            price: String(raw.price),
            quantity: finalQty,
            adjustable_quantity: { enabled: true, minimum: 1 },
          });
        } else if (raw?.price_data?.currency && Number.isFinite(Number(raw?.price_data?.unit_amount))) {
          line_items.push({
            price_data: {
              currency: String(raw.price_data.currency).toLowerCase(),
              unit_amount: Number(raw.price_data.unit_amount),
              product_data: {
                name: String(raw.price_data?.product_data?.name || "Item"),
                images: Array.isArray(raw.price_data?.product_data?.images)
                  ? raw.price_data.product_data.images
                  : undefined,
                metadata: {
                  stripe_price_id: String(raw.price_data?.product_data?.metadata?.stripe_price_id || ""),
                  stripe_product_id: String(raw.price_data?.product_data?.metadata?.stripe_product_id || ""),
                  source: "avasquishi-cart",
                },
              },
            },
            quantity: finalQty,
          });
        }

        // contribute to shipping threshold subtotal
        subtotalForShipping += effectiveLineCentsForShipping({ ...raw, quantity: finalQty }, invRow);
      }
    }

    if (line_items.length === 0) {
      return NextResponse.json({ error: "No valid line items to process" }, { status: 400 });
    }
    if (clampNotes.length) console.warn("⚠️ Oversell clamp:", clampNotes);

// 3) Shipping line: $4.99 under $40; Free at $40+ (inline, no helper use)
const shippingCents = subtotalForShipping >= 4000 ? 0 : 499;

if (shippingCents > 0) {
  if (SHIPPING_PRICE_ID) {
    // Use a pre-created Stripe price if you have one
    line_items.push({ price: SHIPPING_PRICE_ID, quantity: 1 });
  } else {
    // Otherwise add shipping directly as a one-off price_data item
    line_items.push({
      price_data: {
        currency: "usd",
        unit_amount: shippingCents,
        product_data: { name: "Standard Shipping" },
      },
      quantity: 1,
    });
  }
}


    // 4) Create checkout session (keeps your previous settings)
    const sessionParams = {
      mode: "payment",
      line_items,
      allow_promotion_codes: allowPromotionCodes,
      success_url: `${urlBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${urlBase}/cancel`,
      metadata: { source: "avasquishi-cart" },
      automatic_tax: process.env.NODE_ENV === "production" ? { enabled: true } : { enabled: false },
      shipping_address_collection: { allowed_countries: ["US"] },
    };

    console.log("➡️ Creating checkout with line_items:", JSON.stringify(line_items, null, 2));
    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err?.raw?.message || err?.message || "Unable to create checkout session";
    console.error("❌ Checkout session error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
