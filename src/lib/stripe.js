// apps/avasquishi/src/lib/stripe.js
import Stripe from "stripe";

let stripe = null;

export function getStripe() {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY || "";

  // 🧩 During CI or local without real key, return harmless mock
  if (!key || key.includes("dummy")) {
    console.warn("⚠️ Using mock Stripe client (no valid STRIPE_SECRET_KEY).");
    stripe = {
      products: {
        list: async () => ({ data: [] }),
        retrieve: async (id) => ({
          id,
          name: "Mock Product",
          description: "Mock product (no live Stripe key configured)",
          default_price: { unit_amount: 499, currency: "usd" },
          images: ["/favicon.ico"],
        }),
      },
      prices: {
        retrieve: async (id) => ({
          id,
          unit_amount: 499,
          currency: "usd",
        }),
      },
    };
    return stripe;
  }

  // ✅ Real Stripe client — pin to a stable version
  stripe = new Stripe(key, {
    apiVersion: "2024-06-20",
  });

  return stripe;
}
