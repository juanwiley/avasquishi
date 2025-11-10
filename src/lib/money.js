// src/lib/money.js

/**
 * Format a value expressed in cents into a currency string.
 * Accepts numbers or numeric strings; non-numeric become 0.
 */
export function money(cents, currency = "USD") {
  const n = typeof cents === "number" ? cents : Number(cents || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(n / 100);
}

// Keep both named and default to support existing imports.
export default money;
