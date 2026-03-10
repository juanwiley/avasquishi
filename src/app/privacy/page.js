import s from "@/app/info.module.css";

export const metadata = {
  title: "Privacy Policy",
  description: "AvaSquishi privacy policy. We don't sell your data. Ever.",
};

export default function PrivacyPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Privacy Policy</h1>
      <p className={s.updated}>Last updated: March 10, 2026</p>

      <section className={s.section}>
        <p className={s.body}>
          We take your privacy seriously. Here&apos;s what we collect and how we use it.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>What We Collect</h2>
        <ul className={s.list}>
          <li>Your name and email address when you place an order</li>
          <li>Your shipping address</li>
          <li>
            Payment information — processed securely by Stripe. We never see your full card number.
          </li>
          <li>Your order history</li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>How We Use It</h2>
        <ul className={s.list}>
          <li>To process and fulfill your orders</li>
          <li>To send order confirmations and shipping updates</li>
          <li>To respond to your questions and support requests</li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Who We Share It With</h2>
        <ul className={s.list}>
          <li>
            <strong>Stripe</strong> — to process payments securely
          </li>
          <li>
            <strong>Shipping carriers</strong> — to deliver your order
          </li>
        </ul>
        <p className={s.body}>
          We do <strong>not</strong> sell your personal information. Ever.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Cookies</h2>
        <p className={s.body}>
          Our site uses cookies to keep your shopping cart working between pages. We do not use
          advertising or third-party tracking cookies.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Children&apos;s Privacy</h2>
        <p className={s.body}>
          We do not knowingly collect personal information from children under 13 without verifiable
          parental consent. If you are a parent or guardian and have concerns, please contact us.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Your Rights</h2>
        <p className={s.body}>
          You can email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>{" "}
          to request access to, correction of, or deletion of your personal data.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Changes</h2>
        <p className={s.body}>
          We may update this policy from time to time and will post changes on this page.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Contact</h2>
        <p className={s.body}>
          Privacy questions? Email{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>
        </p>
      </section>
    </main>
  );
}
