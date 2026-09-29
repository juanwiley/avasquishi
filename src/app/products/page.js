// src/app/products/page.js — shop page (server component).
// Every section renders from the same catalog load (src/lib/catalog.js), so a
// product shows the same price, stock and badges in every rail.
import styles from "./products.module.css";
import ProductCard from "@/components/ProductCard";
import { getCatalog, getFeatured, sortProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop All Squishies",
  description:
    "Browse every AvaSquishi squishy: cats, paws, treats and mixes from $2.49. Flat $6.99 US shipping, free over $40.",
  alternates: { canonical: "/products" },
};

const NEW_ARRIVALS = 12;

/** Slug helper for section anchors. */
function slugify(label = "") {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function ProductsPage({ searchParams }) {
  const { sort } = await searchParams;
  const sortKey = ["new", "price-asc", "price-desc"].includes(sort) ? sort : "new";

  const catalog = await getCatalog();
  const featured = await getFeatured();

  // Sections. Empty ones are hidden (no "Nothing here yet" rails).
  const sections = [
    { id: "g-reco", label: "Recommended for you", products: sortKey === "new" ? featured : sortProducts(featured, sortKey) },
    { id: "g-new", label: "New arrivals", products: sortProducts(catalog.filter((p) => !p.soldOut).slice(0, NEW_ARRIVALS), sortKey) },
    { id: "g-all", label: "All products", products: sortProducts(catalog, sortKey) },
  ];
  const visible = sections.filter((g) => g.products.length > 0);

  const chips = visible.map((g) => ({ id: g.id, label: g.label, href: `#${slugify(g.label)}` }));

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
      {visible.map((section) => {
        const anchor = slugify(section.label);

        return (
          <section key={section.id} id={anchor} className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>{section.label}</h2>
            </div>

            {(
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
