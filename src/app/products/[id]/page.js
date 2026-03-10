import ProductGallery from "@/components/ProductGallery.jsx";
import AddToCartButton from "@/components/AddToCartButton.jsx";
import styles from "./productDetail.module.css";

// --- helper to fetch product from API ---
async function getProduct(productId) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "";
  const res = await fetch(`${base}/api/products/${productId}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.error("❌ Failed to fetch product:", res.status);
    return null;
  }

  const data = await res.json();
  return data;
}

// --- page component ---
export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data || !data.product) {
    return (
      <main className={styles.container}>
        <p className={styles.notFound}>Product not found.</p>
      </main>
    );
  }

  const { product, defaultPrice, images = [], inventory, supabase } = data;

  // ✅ normalize price (convert to cents if needed)
  let priceCentsRaw =
    defaultPrice?.unit_amount ??
    supabase?.unit_amount ??
    product?.unit_amount ??
    0;
  const priceCents = Math.round(Number(priceCentsRaw));
  const currency = (defaultPrice?.currency || "usd").toUpperCase();

  const price = (priceCents / 100).toLocaleString(undefined, {
    style: "currency",
    currency,
  });

  // ✅ stock from Supabase
  const available = Math.max(
    0,
    Number(supabase?.quantity ?? inventory?.available ?? 0)
  );
  const inStock = available > 0;
  const lowStock = inStock && available <= 5;

  // ✅ handle discounts
  const discountPercent = supabase?.discount_percent ?? product.discount_percent;
  const salePriceRaw = supabase?.sale_price ?? product.sale_price ?? null;
  const saleCents = salePriceRaw ? Math.round(Number(salePriceRaw)) : null;

  return (
    <main className={styles.container}>
      {/* --- Gallery column --- */}
      <div className={styles.galleryCol}>
        <ProductGallery
          images={
            Array.isArray(supabase?.image_urls) && supabase.image_urls.length
              ? supabase.image_urls
              : images
          }
          name={product.name}
        />
      </div>

      {/* --- Product info column --- */}
      <div className={styles.infoCol}>
        <h1 className={styles.title}>{product.name}</h1>

        <div className={styles.badgeRow}>
          {!inStock && (
            <span className={`${styles.badge} ${styles.badgeSold}`}>
              Sold out
            </span>
          )}
          {lowStock && (
            <span className={`${styles.badge} ${styles.badgeWarn}`}>
              Only {available} left!
            </span>
          )}
        </div>

        {/* --- pricing with discount --- */}
        <div className={styles.priceRow}>
          {discountPercent ? (
            <>
              <span className={styles.priceSale}>
                {(priceCents * (1 - discountPercent / 100) / 100).toLocaleString(
                  undefined,
                  { style: "currency", currency }
                )}
              </span>
              <span className={styles.priceStruck}>{price}</span>
              <span className={styles.badgeSale}>
                {Math.round(discountPercent)}% OFF
              </span>
            </>
          ) : saleCents ? (
            <>
              <span className={styles.priceSale}>
                {(saleCents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency,
                })}
              </span>
              <span className={styles.priceStruck}>{price}</span>
            </>
          ) : (
            <span className={styles.price}>{price}</span>
          )}
        </div>

        <p className={styles.desc}>
          {product.description ||
            supabase?.description ||
            "Soft, colorful, and squishable — collect them all!"}
        </p>

        <div className={styles.ctaRow}>

            
<AddToCartButton
  product={{
    ...product,
    stripe_product_id:
      product.stripe_product_id || product.id || id,
    stripe_price_id:
      product.stripe_price_id || defaultPrice?.id || null,
    unit_amount: Number(saleCents ?? priceCents ?? 0),
    currency: currency.toLowerCase(),
    discount_percent:
      discountPercent ?? product.discount_percent ?? null,
    sale_price: saleCents ?? product.sale_price ?? null,
    quantity: available,
    image_url:
      (supabase?.image_urls && supabase.image_urls[0]) ||
      (Array.isArray(images) && images[0]) ||
      "/placeholder.png",
  }}
  disabled={!inStock}
/>


                    
        </div>

        <ul className={styles.metaList}>
          <li>Kid-approved squish factor</li>
          <li>Ships from Dobbs Ferry, NY</li>
          <li>Free sticker in every order 🎉</li>
        </ul>
      </div>
    </main>
  );
}
