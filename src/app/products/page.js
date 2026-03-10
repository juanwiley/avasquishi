// src/app/products/page.js

// Server component
import Link from "next/link";
import styles from "./products.module.css";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@supabase/supabase-js";

/** Create a Supabase server client (service key preferred, falls back to anon). */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  // No throw: use service if present, else anon.
  return createClient(url, service || anon, { auth: { persistSession: false } });
}


/** Fetch visible merch groups; fall back to sane defaults when table isn’t present. */
async function fetchGroups(supabase) {
  try {
    const { data, error } = await supabase
      .from("merch_groups")
      .select("id,label,type,value,is_visible,sort_order,limit")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (Array.isArray(data) && data.length) return data;
  } catch {
    // silent fallback
  }

  // Fallback groups (no DB table yet)
  return [
    { id: "g-reco", label: "Recommended for you", type: "recommendations", value: null, is_visible: true, sort_order: 1, limit: 12 },
    { id: "g-new", label: "New arrivals", type: "custom", value: "__NEW__", is_visible: true, sort_order: 2, limit: 12 },
    { id: "g-all", label: "All products", type: "custom", value: "__ALL__", is_visible: true, sort_order: 3, limit: 18 },
  ];
}

/** Apply an in-memory sort for lists we fetch without an SQL ORDER (e.g. featured). */
function sortList(list = [], sortKey = "new") {
  const copy = [...(list || [])];

  const effectivePrice = (p) => {
    const cents = Number(p.unit_amount ?? 0);
    const hasPct = p.discount_percent != null && !Number.isNaN(Number(p.discount_percent));
    const pctPrice = hasPct ? Math.round(cents * (1 - Number(p.discount_percent) / 100)) : cents;
    return Number.isFinite(p.sale_price) ? p.sale_price : pctPrice;
  };

  if (sortKey === "price-asc") {
    copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (sortKey === "price-desc") {
    copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  } else {
    // "new" (newest first)
    copy.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  return copy;
}

/** Fetch products for a single group, respecting sortKey. */
async function fetchGroupProducts(supabase, group, sortKey = "new") {
  const limit = group.limit ?? 12;

  // 1) Recommendations: featured -> inventory_items (preserve featured order unless user sorts)
  if (group.type === "recommendations") {
    try {
      const { data: featured, error: featErr } = await supabase
        .from("featured_products")
        .select("product_id, sort_order")
        .order("sort_order", { ascending: true })
        .limit(limit);

      if (featErr || !Array.isArray(featured) || featured.length === 0) return [];

      const ids = featured.map((f) => f.product_id);
      const { data: prods, error: prodErr } = await supabase
        .from("inventory_items")
        .select("*")
        .in("id", ids)
        .eq("active", true);

      if (prodErr || !Array.isArray(prods)) return [];

      // default (no explicit sort): preserve curated order
      const byId = new Map(prods.map((p) => [p.id, p]));
      const curated = ids.map((id) => byId.get(id)).filter(Boolean);

      // if the user chose a price sort, respect it
      if (sortKey === "price-asc" || sortKey === "price-desc") {
        return sortList(curated, sortKey).slice(0, limit);
      }
      return curated.slice(0, limit);
    } catch {
      return [];
    }
  }

  // 2) Category rail (now sorted in-memory)
  if (group.type === "category" && group.value) {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("active", true)
      .eq("category", group.value)
      .limit(limit);

    if (error || !Array.isArray(data)) return [];
    return sortList(data, sortKey).slice(0, limit);
  }

  // 3) Collection rail (now sorted in-memory)
  if (group.type === "collection" && group.value) {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("active", true)
      .eq("collection", group.value)
      .limit(limit);

    if (error || !Array.isArray(data)) return [];
    return sortList(data, sortKey).slice(0, limit);
  }

  // 4) Custom rules (now sorted in-memory)
  if (group.type === "custom") {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("active", true)
      .limit(limit);

    if (error || !Array.isArray(data)) return [];
    return sortList(data, sortKey).slice(0, limit);
  }

  return [];
}

/** Slug helper for section anchors. */
function slugify(label = "") {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function ProductsPage({ searchParams }) {
  const supabase = getSupabase();
  const { sort } = await searchParams;

  // read sort preference from query (?sort=new|price-asc|price-desc)
  const sortKey =
    typeof sort === "string" &&
    ["new", "price-asc", "price-desc"].includes(sort)
      ? sort
      : "new";

  // 1) Get groups (DB-driven, with fallback)
  const groups = await fetchGroups(supabase);

  // 2) Fetch products per group in parallel with the chosen sort
  const results = await Promise.all(
    groups.map(async (g) => ({
      ...g,
      products: await fetchGroupProducts(supabase, g, sortKey),
    }))
  );

  // 3) Build chip list (anchors to sections)
  const chips = results.map((g) => ({
    id: g.id,
    label: g.label,
    href: `#${slugify(g.label)}`,
  }));

  return (
    <main className={styles.main}>
      <h1 className={styles.pageTitle}>🧸 Products</h1>

      {/* Toolbar: chips + sort (GET form, no client JS) */}
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {chips.map((c) => (
            <a key={c.id} href={c.href} className={styles.chip}>
              {c.label}
            </a>
          ))}
        </div>

        <form className={styles.sort} action="/products" method="get">
          <label htmlFor="sort" className={styles.sortLabel}>Sort</label>
          <select id="sort" name="sort" className={styles.sortSelect} defaultValue={sortKey}>
            <option value="new">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <button className={styles.sortApply} type="submit">Apply</button>
        </form>
      </div>

      {/* Section rails */}
      {results.map((section) => {
        const anchor = slugify(section.label);
        const empty = !Array.isArray(section.products) || section.products.length === 0;

        return (
          <section key={section.id} id={anchor} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.label}</h2>
              <Link
                className={styles.viewAll}
                href={`/products?group=${encodeURIComponent(section.id)}&sort=${encodeURIComponent(sortKey)}`}
              >
                View all →
              </Link>
            </div>

            {empty ? (
              <div className={styles.empty}>Nothing here yet—check back soon!</div>
            ) : (
              <div className={styles.railWrap}>
                <div className={styles.rail}>
                  {section.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                <div className={`${styles.fade} ${styles.fadeLeft}`} />
                <div className={`${styles.fade} ${styles.fadeRight}`} />
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
