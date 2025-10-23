// apps/avasquishi/src/app/api/checkout/route.js
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// Helper: resolve absolute URLs for success/cancel
function originFromRequest(req) {
  // Prefer NEXT_PUBLIC_SITE_URL if set, else derive from headers
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  return `${proto}://${host}`;
}

export async function POST(req) {
  try {
    const stripe = getStripe();
    const urlBase = originFromRequest(req);

    const body = await req.json();
    const incoming = Array.isArray(body?.items) ? body.items : [];

    if (incoming.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Build Stripe line_items
    // Accept either { price } or { price_data }, each with quantity
    const line_items = [];
    for (const raw of incoming) {
      const qty = Math.max(1, Number(raw?.quantity ?? 1));

      // Case A: price-based item (preferred for promo codes)
      if (raw?.price) {
        line_items.push({
          price: String(raw.price),
          quantity: qty,
          adjustable_quantity: { enabled: true, minimum: 1 },
        });
        continue;
      }

      // Case B: direct price_data (only when we explicitly *must* set a custom amount)
      const pd = raw?.price_data;
      if (pd?.currency && Number.isFinite(Number(pd?.unit_amount))) {
        line_items.push({
          price_data: {
            currency: String(pd.currency).toLowerCase(),
            unit_amount: Number(pd.unit_amount), // cents
            // Limit product_data to a safe minimal subset
            product_data: {
              name: String(pd?.product_data?.name || "Item"),
              images: Array.isArray(pd?.product_data?.images)
                ? pd.product_data.images.slice(0, 1)
                : undefined,
              // You can pass through select metadata if needed
              metadata: pd?.product_data?.metadata || undefined,
            },
          },
          quantity: qty,
          adjustable_quantity: { enabled: true, minimum: 1 },
        });
        continue;
      }

      // If neither form is valid, reject this one item but proceed if others exist
      // (Alternatively, you could bail out hard with a 400.)
      console.warn("Skipping invalid line item:", raw);
    }

    if (line_items.length === 0) {
      return NextResponse.json(
        { error: "No valid line items to process" },
        { status: 400 }
      );
    }

    const sessionParams = {
      mode: "payment",
      line_items,
      allow_promotion_codes: true, // enable promo code box in Checkout
      success_url: `${urlBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${urlBase}/cancel`,
      // Optional: extra metadata to help later analytics
      metadata: { source: "avasquishi-cart" },
    };

    // Dev visibility for debugging only (safe summary)
    console.log("➡️ Creating checkout with line_items:", JSON.stringify(line_items, null, 2));

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error("❌ Checkout session error:", err);
    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}
