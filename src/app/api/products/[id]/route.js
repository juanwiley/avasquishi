// Next 15+ API route
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient as createSupabaseServerClient } from "@supabase/supabase-js";

export const revalidate = 0;

function getSupabaseForServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prefer service role if present; fall back to anon for read-only queries (local dev).
  const key = serviceKey || anon;
  if (!url || !key) return null;

  return createSupabaseServerClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(_request, { params }) {
  const { id } = await params; // dynamic API params must be awaited in Next 15
  const stripe = getStripe();

  let stripeProduct = null;
  let stripePrice = null;

  // 1) Stripe product (ok if it has no default_price)
  try {
    stripeProduct = await stripe.products.retrieve(id, { expand: ["default_price"] });
    stripePrice = stripeProduct?.default_price ?? null;
  } catch (_) {
    // leave as null; we’ll still try Supabase
  }

  // 2) Supabase record
  let supabaseRow = null;
  try {
    const supabase = getSupabaseForServer();
    if (supabase) {
      const { data, error } = await supabase
        .from("inventory_items") // schema: wileypay.inventory_items is default public alias if not namespaced
        .select(
          `
            id,
            name,
            description,
            category,
            image_urls,
            active,
            currency,
            unit_amount,
            quantity,
            restock_threshold,
            discount_percent,
            sale_price,
            collection,
            stripe_price_id,
            stripe_product_id
          `
        )
        .eq("stripe_product_id", id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        supabaseRow = data;
      }
    }
  } catch (_) {
    // keep supabaseRow null if error
  }

  // 3) Build consistent response shape (unchanged names)
  const product = {
    id,
    name: stripeProduct?.name || supabaseRow?.name || "",
    description: stripeProduct?.description ?? supabaseRow?.description ?? "",
    discount_percent: supabaseRow?.discount_percent ?? null,
    sale_price: supabaseRow?.sale_price ?? null,
    stripe_product_id: id,
    stripe_price_id: stripePrice?.id ?? supabaseRow?.stripe_price_id ?? null,
  };

  const defaultPrice = {
    unit_amount:
      stripePrice?.unit_amount ??
      (typeof supabaseRow?.unit_amount === "number"
        ? Math.round(Number(supabaseRow.unit_amount))
        : null) ??
      0,
    currency:
      stripePrice?.currency ??
      supabaseRow?.currency ??
      "usd",
    id: stripePrice?.id ?? supabaseRow?.stripe_price_id ?? null,
  };

  const images =
    (Array.isArray(supabaseRow?.image_urls) && supabaseRow.image_urls.length > 0)
      ? supabaseRow.image_urls
      : Array.isArray(stripeProduct?.images)
        ? stripeProduct.images
        : [];

  const inventory = {
    // source of truth is supabase.quantity
    available: typeof supabaseRow?.quantity === "number" ? supabaseRow.quantity : 0,
  };

  return NextResponse.json({
    product,
    defaultPrice,
    images,
    inventory,
    stripe: stripeProduct
      ? { product: stripeProduct, price: stripePrice }
      : { product: null, price: null },
    supabase: supabaseRow || null,
  });
}
