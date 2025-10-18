// Next.js App Router API route for Stripe Checkout (server-side)
import Stripe from "stripe";
import { headers } from "next/headers";

// Force Node.js runtime (Stripe's Node SDK is happiest here)
export const runtime = "nodejs";

export async function POST(req) {
  try {
    // Ensure key exists at runtime (not import time)
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.error("[checkout] Missing STRIPE_SECRET_KEY at runtime");
      return new Response(
        JSON.stringify({ error: "Stripe secret key is not configured" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const stripe = new Stripe(secretKey, {
      // Pin an API version to avoid surprise breaking changes
      apiVersion: "2024-06-20",
    });

    // Parse request body (optionally accept line items from client)
    let body = {};
    try {
      body = await req.json();
    } catch {
      // no-op; allow empty body
    }

    // Build origin from request (works on Vercel + custom domains)
    const hdrs = headers();
    const origin =
      hdrs.get("origin") ||
      (hdrs.get("host") ? `https://${hdrs.get("host")}` : "https://avasquishi.com");

    // Default line item if none provided (your $15 test button)
    const lineItems =
      body?.lineItems ??
      [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "AvaSquishi Plush (Test)" },
            unit_amount: 1500, // $15.00
          },
          quantity: 1,
        },
      ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // These don’t need to be whitelisted for *server-side* Checkout:
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/products`,
      shipping_address_collection: { allowed_countries: ["US"] },
      // Expand to help with debugging in logs if needed
      // expand: ["payment_intent", "latest_charge"],
    });

    return new Response(
      JSON.stringify({ id: session.id, url: session.url }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    // Log everything useful to Vercel function logs
    console.error("[checkout] Stripe error", {
      type: err?.type,
      code: err?.code,
      message: err?.message,
      raw: err?.raw,
      stack: err?.stack,
    });

    return new Response(
      JSON.stringify({
        error: "Checkout creation failed",
        details: err?.message ?? "Unknown error",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
