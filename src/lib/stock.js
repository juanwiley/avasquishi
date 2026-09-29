// src/lib/stock.js
// One low-stock rule for product cards and product pages.
// A product is "low" when 1..threshold units remain. The threshold is the row's
// restock_threshold when set above 0, otherwise LOW_STOCK_DEFAULT.

export const LOW_STOCK_DEFAULT = 3;

export function lowStockThreshold(restockThreshold) {
  const t = Number(restockThreshold);
  return Number.isFinite(t) && t > 0 ? t : LOW_STOCK_DEFAULT;
}

export function isLowStock(quantity, restockThreshold) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return false;
  return q <= lowStockThreshold(restockThreshold);
}
