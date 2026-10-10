// src/lib/shipping.js
// Single source of truth for shipping rates. Used by the cart (display)
// and /api/checkout (the amount Stripe actually charges).

export const FLAT_SHIPPING_CENTS = 699; // $6.99 under the free-shipping threshold
export const FREE_SHIPPING_THRESHOLD_CENTS = 4000; // free at $40+

// Returns { label, amount } where amount is in cents.
export function quoteShippingCents(itemsSubtotalCents) {
  return Number(itemsSubtotalCents) >= FREE_SHIPPING_THRESHOLD_CENTS
    ? { label: "Free Shipping", amount: 0 }
    : { label: "Standard Shipping", amount: FLAT_SHIPPING_CENTS };
}

// Cents still needed to reach free shipping (0 once qualified).
export function centsUntilFreeShipping(itemsSubtotalCents) {
  return Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - Number(itemsSubtotalCents || 0));
}
