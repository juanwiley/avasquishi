// inside ProductBuyActions.jsx (client)
import BuyButton from "@/components/BuyButton";
import { useCart } from "@/context/CartContext";

export default function ProductBuyActions({ product }) {
  const { add } = useCart();
  const {
    id,
    name,
    unit_amount,
    stripe_price_id,
    price_id,           // alias seen in some code paths
    stripe_priceid,     // another alias seen earlier
    quantity = 0,
  } = product || {};

  const outOfStock = Number(quantity) <= 0;

  const handleAdd = () => {
    // normalize a *copy* to avoid mutating the prop
    const payload = {
      ...product,
      // ensure we keep a usable Stripe price id even if the field name varies
      stripe_price_id: stripe_price_id || price_id || stripe_priceid || null,
      // make sure money is a number in cents
      unit_amount: Number(unit_amount ?? product?.price ?? 0),
    };
    add(payload, 1);
  };

  return (
    <div className="actionsRow">
      <button
        disabled={outOfStock}
        onClick={handleAdd}
        className="btnPrimary"
        aria-label={`Add ${name} to cart`}
      >
        Add to Cart
      </button>

      { (stripe_price_id || price_id || stripe_priceid) && (
        <BuyButton priceId={stripe_price_id || price_id || stripe_priceid} />
      )}
    </div>
  );
}
