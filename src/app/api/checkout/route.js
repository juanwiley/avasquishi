// apps/avasquishi/src/app/api/checkout/route.js
// - All line items sent as price_data — no catalog Stripe price ID references
// - Oversell clamp: lookup by inventory_item_id (UUID) first, stripe_product_id as fallback
// - Shipping via inline shipping_rate_data: $4.99 under $40 subtotal; Free at $40+

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const TENANT_ID = process.env.AVASQUISHI_TENANT_ID || "c113bbab-4d77-46c4-a2a8-5f6cbe4bd48f";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function originFromRequest(req) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${proto}://${host}`;
}

// Cents helpers (DB stores cents as numeric with ".00")
const toIntCents = (v) => {
  if (v == null) return 0;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

// Build a lookup key to locate inventory rows for oversell clamp.
// All items are price_data — reads inventory_item_id (UUID) first,
// stripe_product_id as fallback.
function resolveLookupKey(raw) {
  const md = raw?.price_data?.product_data?.metadata || {};
  if (md.inventory_item_id) return { key: `id:${String(md.inventory_item_id)}` };
  if (md.stripe_product_id) return { key: `prod:${String(md.stripe_product_id)}` };
  return { key: undefined };
}

// Compute effective cents for shipping threshold from price_data unit_amount.
function effectiveLineCentsForShipping(raw) {
  const qty = Math.max(1, Number(raw?.quantity ?? 1));
  const pd = raw?.price_data;
  if (pd?.currency && Number.isFinite(Number(pd?.unit_amount))) {
    return Number(pd.unit_amount) * qty;
  }
  return 0;
}

// Fetch inventory rows for oversell clamping.
// Primary: lookup by internal UUID (itemIds → WHERE id IN).
// Fallback: lookup by stripe_product_id for items where UUID was absent in metadata.
async function fetchInventoryRows(keys) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Map();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const itemIds = Array.from(new Set(keys.itemIds || [])).filter(Boolean);
  const productIds = Array.from(new Set(keys.productIds || [])).filter(Boolean);

  const map = new Map();

  const base = supabase
    .schema("wileypay")
    .from("inventory_items")
    .select("id, tenant_id, name, quantity, unit_amount, stripe_price_id, stripe_product_id")
    .eq("tenant_id", TENANT_ID);

  if (itemIds.length) {
    const { data, error } = await base.in("id", itemIds);
    if (error) {
      console.error("⚠️ fetchInventoryRows itemIds error:", error.message);
    } else {
      for (const r of data || []) {
        map.set(`id:${r.id}`, r);
        if (r.stripe_product_id) map.set(`prod:${r.stripe_product_id}`, r);
      }
    }
  }

  if (productIds.length) {
    const { data, error } = await base.in("stripe_product_id", productIds);
    if (error) {
      console.error("⚠️ fetchInventoryRows productIds error:", error.message);
    } else {
      for (const r of data || []) {
        map.set(`id:${r.id}`, r);
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

    // 1) Gather keys for a single inventory fetch.
    // inventory_item_id is primary; stripe_product_id used only when UUID is absent.
    const itemIds = [];
    const productIds = [];
    for (const raw of incoming) {
      const md = raw?.price_data?.product_data?.metadata || {};
      if (md.inventory_item_id) {
        itemIds.push(String(md.inventory_item_id));
      } else if (md.stripe_product_id) {
        productIds.push(String(md.stripe_product_id));
      }
    }
    const invMap = await fetchInventoryRows({ itemIds, productIds });

    // 2) Clamp quantities; compute shipping threshold subtotal
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
          finalQty = 0;
          clampNotes.push(`OOS: ${invRow?.name || key}`);
        } else if (requestedQty > stock) {
          finalQty = stock;
          clampNotes.push(`Clamped ${invRow?.name || key} ${requestedQty} → ${finalQty}`);
        }
      }

      if (finalQty > 0) {
        if (raw?.price_data?.currency && Number.isFinite(Number(raw?.price_data?.unit_amount))) {
          // Only emit metadata fields that are non-empty.
          const itemMd = raw.price_data?.product_data?.metadata || {};
          const productMetadata = { source: "avasquishi-cart" };
          if (itemMd.inventory_item_id) productMetadata.inventory_item_id = String(itemMd.inventory_item_id);
          if (itemMd.stripe_product_id) productMetadata.stripe_product_id = String(itemMd.stripe_product_id);

          line_items.push({
            price_data: {
              currency: String(raw.price_data.currency).toLowerCase(),
              unit_amount: Number(raw.price_data.unit_amount),
              product_data: {
                name: String(raw.price_data?.product_data?.name || "Item"),
                images: Array.isArray(raw.price_data?.product_data?.images)
                  ? raw.price_data.product_data.images
                  : undefined,
                metadata: productMetadata,
              },
            },
            quantity: finalQty,
          });
        }

        subtotalForShipping += effectiveLineCentsForShipping({ ...raw, quantity: finalQty });
      }
    }

    if (line_items.length === 0) {
      return NextResponse.json({ error: "No valid line items to process" }, { status: 400 });
    }
    if (clampNotes.length) console.warn("⚠️ Oversell clamp:", clampNotes);

    // 3) Shipping via inline shipping_rate_data — not added to line_items
    const shippingCents = subtotalForShipping >= 4000 ? 0 : 499;
    const shippingOption = {
      shipping_rate_data: {
        display_name: shippingCents === 0 ? "Free Shipping" : "Standard Shipping",
        type: "fixed_amount",
        fixed_amount: { amount: shippingCents, currency: "usd" },
      },
    };

    // 4) Create checkout session
    const sessionParams = {
      mode: "payment",
      line_items,
      shipping_options: [shippingOption],
      allow_promotion_codes: allowPromotionCodes,
      success_url: `${urlBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${urlBase}/cancel`,
      metadata: { source: "avasquishi-cart" },
      automatic_tax: process.env.NODE_ENV === "production" ? { enabled: true } : { enabled: false },
      shipping_address_collection: { allowed_countries: ["US"] },
    };

    console.log("➡️ Creating checkout with line_items:", JSON.stringify(line_items, null, 2));
    console.log("➡️ Shipping option:", JSON.stringify(shippingOption, null, 2));
    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err?.raw?.message || err?.message || "Unable to create checkout session";
    console.error("❌ Checkout session error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
