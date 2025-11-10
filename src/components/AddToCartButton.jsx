"use client";
import { useCart } from "@/context/CartContext.jsx";

export default function AddToCartButton({ product, disabled }) {
  const { add } = useCart();

  function handleAdd() {
    if (disabled) return;

    // Read current product fields without renaming your existing properties.
    const unit = Number(product.unit_amount ?? product.defaultPrice?.unit_amount ?? 0);
    const sale = product.sale_price != null ? Number(product.sale_price) : null;

    const hasSaleId = !!product.stripe_sale_price_id;
    const isOnSale = hasSaleId && sale != null && sale > 0 && sale < unit;

    const normalized = {
      id: product.id,
      name: product.name,
      description: product.description,
      // keep your existing ids
      stripe_price_id: product.stripe_price_id || product.defaultPrice?.id || "",
      stripe_product_id: product.stripe_product_id || product.product?.id || product.id || "",
      // NEW: carry the sale price id if present (no rename to existing)
      stripe_sale_price_id: product.stripe_sale_price_id || "",

      image_url:
        product.image_urls?.[0] ||
        product.image_url ||
        product.images?.[0] ||
        "/placeholder.png",

      qty: 1,
      currency: (product.currency || "usd").toLowerCase(),
      unit_amount: unit,
      discount_percent: Number(product.discount_percent ?? 0),
      sale_price: sale ?? 0,

      // NEW: mark if this line should use sale pricing
      onSale: !!isOnSale,
    };

    add(normalized);
  }

  return (
    <button
      className="btn-primary"
      onClick={handleAdd}
      disabled={disabled}
    >
      Add to Cart
    </button>
  );
}
