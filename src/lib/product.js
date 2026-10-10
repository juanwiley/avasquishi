// src/lib/product.js
// One product model for every screen (cards, product page, rails, cart).
// Price, stock and badge rules live here and nowhere else.
//
// Source of truth is the Supabase inventory row (see CLAUDE.md). There is no
// sale_price column: a sale is `discount_percent` off `unit_amount`.
import { isLowStock, lowStockThreshold } from "@/lib/stock";

export const NEW_DAYS = 14;

// Effective unit price in cents. Same rounding as /api/checkout.
export function effectivePriceCents(row) {
  const list = Math.round(Number(row?.unit_amount ?? 0));
  const pct = Number(row?.discount_percent);
  return Number.isFinite(pct) && pct > 0 ? Math.max(0, Math.round(list * (1 - pct / 100))) : list;
}

// Product copy from Stripe often ends with "...fans.Contents: 2 Big Oreo" (no
// space). Split the prose from the "Contents:" list so it can render on its own line.
export function splitDescription(desc = "") {
  const text = String(desc || "").trim();
  const m = text.match(/^(.*?)\s*Contents:\s*(.+)$/is);
  if (!m) return { text, contents: "" };
  return { text: m[1].trim(), contents: m[2].trim() };
}

// Normalize an inventory row into the shape every screen renders from.
export function toProduct(row) {
  if (!row) return null;
  const stock = Math.max(0, Math.round(Number(row.quantity ?? 0)));
  const pct = Number(row.discount_percent);
  const discountPercent = Number.isFinite(pct) && pct > 0 ? pct : null;
  const created = row.created_at ? new Date(row.created_at).getTime() : NaN;
  const { text: blurb, contents } = splitDescription(row.description);
  return {
    id: row.id, // inventory UUID
    stripeProductId: row.stripe_product_id || null,
    path: row.stripe_product_id ? `/products/${row.stripe_product_id}` : null,
    name: row.name || "",
    // blurb = prose only; contents = what's in the package ("" if none listed);
    // description = both, with the missing space fixed (for meta tags / SEO).
    blurb,
    contents,
    description: contents ? `${blurb} Contents: ${contents}`.trim() : blurb,
    images: Array.isArray(row.image_urls) ? row.image_urls.filter(Boolean) : [],
    active: row.active !== false,
    listPriceCents: Math.round(Number(row.unit_amount ?? 0)),
    priceCents: effectivePriceCents(row),
    discountPercent,
    stock,
    soldOut: stock <= 0,
    lowStock: isLowStock(stock, row.restock_threshold),
    lowThreshold: lowStockThreshold(row.restock_threshold),
    isNew: Number.isFinite(created) && (Date.now() - created) / 86400000 <= NEW_DAYS,
    createdAt: row.created_at || null,
    relatedIds: Array.isArray(row.related_ids) ? row.related_ids.filter(Boolean) : [],
  };
}

// Badges in display order. Sold out suppresses the others.
export function productBadges(p) {
  if (!p) return [];
  if (p.soldOut) return [{ kind: "out", label: "Sold out" }];
  const out = [];
  if (p.discountPercent) out.push({ kind: "sale", label: `${Math.round(p.discountPercent)}% off` });
  if (p.lowStock) out.push({ kind: "low", label: `Only ${p.stock} left` });
  if (p.isNew) out.push({ kind: "new", label: "New" });
  return out;
}

// What a cart line needs. `stock` caps how many can be added.
export function toCartItem(p) {
  return {
    id: p.stripeProductId || p.id,
    inventory_item_id: p.id,
    stripe_product_id: p.stripeProductId,
    name: p.name,
    description: p.blurb,
    image_url: p.images[0] || "/placeholder.png",
    currency: "usd",
    unit_amount: p.listPriceCents,
    discount_percent: p.discountPercent ?? 0,
    sale_price: 0,
    stock: p.stock,
  };
}
