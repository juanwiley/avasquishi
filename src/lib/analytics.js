// src/lib/analytics.js
// Thin wrapper over PostHog (loaded by components/Analytics.jsx only when
// NEXT_PUBLIC_POSTHOG_KEY is set). Safe to call anywhere: no-ops without it.

export function track(event, properties = {}) {
  if (typeof window === "undefined") return;
  try {
    window.posthog?.capture?.(event, properties);
  } catch {
    // analytics must never break the store
  }
}

// Effective unit price in cents for a cart line (same rule as the cart page).
export function lineUnitCents(it) {
  const list = Number(it?.unit_amount ?? 0);
  const pct = it?.discount_percent != null ? Number(it.discount_percent) : 0;
  if (pct > 0) return Math.max(0, Math.round(list * (1 - pct / 100)));
  if (it?.sale_price != null && Number(it.sale_price) > 0) return Number(it.sale_price);
  return list;
}

export function cartValueCents(items = []) {
  return items.reduce((sum, it) => sum + lineUnitCents(it) * Number(it?.qty ?? 1), 0);
}
