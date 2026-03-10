export type ShippingQuote = { label: "Standard Shipping"; amount: number }; // cents

export function quoteShippingCents(cartSubtotalCents: number): ShippingQuote {
  // $4.99 under $40; free at $40+
  return cartSubtotalCents >= 4000
    ? { label: "Standard Shipping", amount: 0 }
    : { label: "Standard Shipping", amount: 499 };
}
