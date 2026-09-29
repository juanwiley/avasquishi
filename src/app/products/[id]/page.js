// Product page (server component). Renders from the shared catalog model
// (src/lib/catalog.js + src/lib/product.js), so name, price, stock and badges
// match every card and rail on the site.
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery.jsx";
import AddToCartButton from "@/components/AddToCartButton.jsx";
import ProductCard from "@/components/ProductCard";
import TrackEvent from "@/components/TrackEvent";
import { getByStripeProductId, getRelated } from "@/lib/catalog";
import { productBadges } from "@/lib/product";
import { FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS, quoteShippingCents } from "@/lib/shipping";
import { money } from "@/lib/money";
import styles from "./productDetail.module.css";
import cardStyles from "@/components/ProductCard.module.css";

export const dynamic = "force-dynamic";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.avasquishi.com").replace(/\/+$/, "");
const FALLBACK_DESC = "Soft, colorful, and squishable — collect them all!";

const BADGE_CLASS = {
  out: cardStyles.badgeOut,
  sale: cardStyles.badgeSale,
  low: cardStyles.badgeLow,
  new: cardStyles.badgeNew,
};

function trimDescription(text = "", max = 155) {
  const t = String(text).replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : t;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const p = await getByStripeProductId(id);
  if (!p) return { title: "Product not found" };

  const desc =
    trimDescription(p.description) || `${p.name} squishy toy from AvaSquishi. Ships from Dobbs Ferry, NY.`;
  return {
    title: `${p.name} – Squishy Toy`,
    description: desc,
    alternates: { canonical: p.path },
    openGraph: {
      title: `${p.name} | AvaSquishi`,
      description: desc,
      type: "website",
      url: p.path,
      images: p.images[0] ? [p.images[0]] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const p = await getByStripeProductId(id);
  if (!p) notFound();

  const badges = productBadges(p);
  const related = await getRelated(p);

  // schema.org Product for Google. Ratings get added once real reviews exist.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description || undefined,
    image: p.images.length ? p.images : undefined,
    sku: p.id,
    brand: { "@type": "Brand", name: "AvaSquishi" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${p.path}`,
      priceCurrency: "USD",
      price: (p.priceCents / 100).toFixed(2),
      availability: p.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (quoteShippingCents(p.priceCents).amount / 100).toFixed(2),
          currency: "USD",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "US" },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <TrackEvent
        event="product_viewed"
        properties={{ product_id: id, name: p.name, price_cents: p.priceCents, in_stock: !p.soldOut }}
      />
      <main className={styles.container}>
        <div className={styles.galleryCol}>
          <ProductGallery images={p.images} name={p.name} />
        </div>

        <div className={styles.infoCol}>
          <h1 className={styles.title}>{p.name}</h1>

          {badges.length > 0 && (
            <div className={styles.badgeRow}>
              {badges.map((b) => (
                <span key={b.kind} className={`${cardStyles.badge} ${BADGE_CLASS[b.kind]}`}>
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <div className={styles.priceRow}>
            <span className={p.discountPercent ? styles.priceSale : styles.price}>{money(p.priceCents)}</span>
            {p.discountPercent ? <span className={styles.priceStruck}>{money(p.listPriceCents)}</span> : null}
          </div>

          <p className={styles.desc}>{p.blurb || FALLBACK_DESC}</p>
          {p.contents ? (
            <p className={styles.contents}>
              <strong>Contents:</strong> {p.contents}
            </p>
          ) : null}

          <div className={styles.ctaRow}>
            <AddToCartButton product={p} />
          </div>

          <ul className={styles.metaList}>
            <li>Kid-approved squish factor</li>
            <li>Ships from Dobbs Ferry, NY</li>
            <li>Free sticker in every order 🎉</li>
          </ul>

          <div className={styles.policyBox}>
            <p>
              <strong>Shipping:</strong> {money(FLAT_SHIPPING_CENTS)} flat, free on orders of{" "}
              {money(FREE_SHIPPING_THRESHOLD_CENTS).replace(".00", "")}+. US only. Ships in 3–5 business days.{" "}
              <Link href="/shipping">Details</Link>
            </p>
            <p>
              <strong>Returns:</strong> Unused items in original packaging within 30 days of delivery.{" "}
              <Link href="/refunds">Details</Link>
            </p>
          </div>
        </div>
      </main>

      {related.length > 0 && (
        <section className={styles.related} aria-labelledby="related-heading">
          <h2 id="related-heading" className={styles.relatedTitle}>You might also like</h2>
          <div className={styles.relatedGrid}>
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
