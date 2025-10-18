import Image from "next/image";
import Link from "next/link";
import styles from "./productDetail.module.css";

export const dynamic = "force-dynamic";

async function getProduct(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/products`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const { items } = await res.json();
  const list = Array.isArray(items) ? items : [];
  return list.find(p => String(p.id) === String(id)) ?? null;
}

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.id);

  if (!product) {
    return (
      <main className={styles.main}>
        <p>Product not found.</p>
        <Link href="/products" className={styles.back}>← Back to products</Link>
      </main>
    );
  }

  const {
    name, description, image_url, unit_amount, quantity, restock_threshold,
    discount_percent, sale_price
  } = product;

  const isOut = quantity === 0;
  const isLow = !isOut && typeof restock_threshold === "number" && typeof quantity === "number"
    ? quantity <= restock_threshold
    : false;
  const price = typeof sale_price === "number" ? sale_price : unit_amount;
  const isSale = typeof discount_percent === "number" && discount_percent > 0;

  return (
    <main className={styles.main}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Home</Link> <span>›</span> <Link href="/products">Products</Link> <span>›</span> <span>{name}</span>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.gallery}>
          <div className={styles.imageWrap}>
            {image_url ? (
              <Image
                src={image_url}
                alt={name}
                fill
                className={styles.image}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : <div className={styles.placeholder} />}
          </div>
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{name}</h1>
          <div className={styles.priceRow}>
            {isSale ? (
              <>
                <span className={styles.priceSale}>${(price / 100).toFixed(2)}</span>
                <span className={styles.priceStruck}>${(unit_amount / 100).toFixed(2)}</span>
              </>
            ) : (
              <span className={styles.price}>${(price / 100).toFixed(2)}</span>
            )}
          </div>

          {!isOut && isLow && typeof quantity === "number" && (
            <div className={styles.low}>Only {quantity} left!</div>
          )}
          {isOut && <div className={styles.out}>Currently out of stock</div>}

          <p className={styles.desc}>{description || "Soft, colorful, and squishable — collect them all!"}</p>

          <AddToCartButton product={product} disabled={isOut} />
        </div>
      </div>
    </main>
  );
}

// Client wrapper for Add to Cart
function AddToCartButton({ product, disabled }) {
  return <AddToCartClient product={product} disabled={disabled} />;
}

function AddToCartClient(props) {
  const { product, disabled } = props;
  return (
    <button
      className={disabled ? styles.btnDisabled : styles.btn}
      type="button"
      disabled={disabled}
      onClick={() => { add(product, 1); setIsOpen(true); }}
    >
      {disabled ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
