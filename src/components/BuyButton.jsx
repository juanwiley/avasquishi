"use client";

export default function BuyButton({ priceId }) {
  const handleCheckout = async () => {
    if (!priceId) {
      alert("Missing price ID — cannot start checkout.");
      console.error("BuyButton called without priceId.");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Stripe session failed:", res.status, text);
        alert("Server error creating checkout session.");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL returned from Stripe:", data);
        alert("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network or server error. Please try again.");
    }
  };

  return (
    <button
      onClick={handleCheckout}
      style={{
        backgroundColor: "var(--darkred)",
        color: "white",
        border: "none",
        padding: "0.75rem 1.5rem",
        borderRadius: "8px",
        cursor: "pointer",
        marginTop: "1rem",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "background-color 0.2s ease, transform 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--purple)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--darkred)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      Buy Now
    </button>
  );
}
