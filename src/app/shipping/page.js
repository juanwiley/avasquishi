import s from "@/app/info.module.css";

export const metadata = {
  title: "Shipping",
  description: "AvaSquishi shipping rates, processing times, and delivery information.",
};

export default function ShippingPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Shipping Policy</h1>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Processing Time</h2>
        <p className={s.body}>
          Orders are processed within <strong>3–5 business days</strong>, Monday through Friday,
          excluding holidays.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Shipping Rates</h2>
        <div className={s.callout}>
          <p className={s.body}>
            🚚 <strong>Flat $4.99 shipping</strong> on most orders.
          </p>
          <p className={s.body}>
            🎉 <strong>Free shipping on orders of $40 or more!</strong>
          </p>
        </div>
        <p className={s.body}>
          Very large or heavy orders may incur additional shipping charges. If this applies to your
          order, the updated rate will be shown at checkout before you pay.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Delivery Time</h2>
        <p className={s.body}>
          Standard shipping typically takes <strong>5–8 business days</strong> after your order ships.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Tracking</h2>
        <p className={s.body}>
          Once your order ships, you&apos;ll receive a shipping confirmation email with a tracking number.
          Please allow up to 24 hours for tracking information to activate.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Shipping Area</h2>
        <p className={s.body}>
          We currently ship within the <strong>United States only</strong>. We hope to expand in the future!
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Lost or Delayed Packages</h2>
        <p className={s.body}>
          If your package hasn&apos;t arrived within the expected window, please email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>{" "}
          and we&apos;ll look into it for you.
        </p>
      </section>
    </main>
  );
}
