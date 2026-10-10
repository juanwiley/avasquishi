// src/lib/catalog.js — server only.
// Loads the whole store catalog in ONE query per request, so every section on
// a page renders from the same rows (the catalog is small: ~20 products).
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { toProduct } from "@/lib/product";

const TENANT_ID = process.env.AVASQUISHI_TENANT_ID || "c113bbab-4d77-46c4-a2a8-5f6cbe4bd48f";
const COLUMNS =
  "id, name, description, image_urls, active, unit_amount, discount_percent, quantity, restock_threshold, created_at, related_ids, stripe_product_id";

// All active products for this store, newest first. Cached per request.
export const getCatalog = cache(async function getCatalog() {
  const { data, error } = await supabaseAdmin
    .schema("wileypay")
    .from("inventory_items")
    .select(COLUMNS)
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("catalog load failed:", error.message);
    return [];
  }
  return (data || []).map(toProduct);
});

export const SORTS = {
  new: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  "price-asc": (a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name),
  "price-desc": (a, b) => b.priceCents - a.priceCents || a.name.localeCompare(b.name),
};

// Sorted list; sold-out items always go last so they don't bury what's buyable.
export function sortProducts(list, sortKey = "new") {
  const cmp = SORTS[sortKey] || SORTS.new;
  return [...list].sort((a, b) => Number(a.soldOut) - Number(b.soldOut) || cmp(a, b));
}

export async function getNewest(limit = 4) {
  return (await getCatalog()).filter((p) => !p.soldOut).slice(0, limit);
}

export async function getByStripeProductId(stripeProductId) {
  return (await getCatalog()).find((p) => p.stripeProductId === stripeProductId) || null;
}

// related_ids when set (in that order), else newest other in-stock products.
export async function getRelated(product, limit = 4) {
  const all = await getCatalog();
  const others = all.filter((p) => p.id !== product?.id && !p.soldOut);
  if (product?.relatedIds?.length) {
    const byId = new Map(others.map((p) => [p.id, p]));
    const picked = product.relatedIds.map((id) => byId.get(id)).filter(Boolean);
    if (picked.length) return picked.slice(0, limit);
  }
  return others.slice(0, limit);
}

// Hand-curated picks (featured_products table), in curated order. Empty if unused.
export async function getFeatured(limit = 12) {
  try {
    const { data, error } = await supabaseAdmin
      .from("featured_products")
      .select("product_id, sort_order")
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (error || !data?.length) return [];
    const byId = new Map((await getCatalog()).map((p) => [p.id, p]));
    return data.map((f) => byId.get(f.product_id)).filter((p) => p && !p.soldOut);
  } catch {
    return [];
  }
}
