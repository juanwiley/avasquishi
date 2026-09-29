import s from "@/app/info.module.css";

export const metadata = {
  title: "Returns & Refunds",
  description: "AvaSquishi return and refund policy. We accept returns within 30 days of delivery.",
};

export default function RefundsPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Refund &amp; Return Policy</h1>

      <section className={s.section}>
        <p className={s.body}>Your happiness matters to us! Here&apos;s how returns and refunds work.</p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Returns</h2>
        <p className={s.body}>
          We accept returns within <strong>30 days of delivery</strong>. To be eligible:
        </p>
        <ul className={s.list}>
          <li>The item must be unused and in its original packaging</li>
          <li>
            Email us first at{" "}
            <a href="mailto:support@avasquishi.com" className={s.link}>
              support@avasquishi.com
            </a>{" "}
            to start the return process
          </li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Refunds</h2>
        <p className={s.body}>
          Once we receive and inspect your return, we&apos;ll process your refund to the original payment
          method within <strong>5–7 business days</strong>.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Damaged or Wrong Items</h2>
        <p className={s.body}>
          If your order arrived damaged or you received the wrong item, email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>{" "}
          with a photo and your order number. We&apos;ll send a replacement or issue a full refund —
          no return required.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Non-Returnable Items</h2>
        <p className={s.body}>
          Items that have been used, opened, or are not in their original condition are not eligible
          for return.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Exchanges</h2>
        <p className={s.body}>
          We don&apos;t currently offer direct exchanges. To swap items, return the original for a
          refund and place a new order.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Questions?</h2>
        <p className={s.body}>
          Email{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>{" "}
          — we&apos;ll take care of you.
        </p>
      </section>
    </main>
  );
}
