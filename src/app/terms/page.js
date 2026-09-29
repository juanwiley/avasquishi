import s from "@/app/info.module.css";

export const metadata = {
  title: "Terms of Service",
  description: "AvaSquishi terms of service. By using our website and placing orders, you agree to these terms.",
};

export default function TermsPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Terms of Service</h1>
      <p className={s.updated}>Last updated: March 10, 2026</p>

      <section className={s.section}>
        <p className={s.body}>
          Welcome to AvaSquishi! By using this website and placing orders, you agree to these terms.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>1. About Us</h2>
        <p className={s.body}>
          AvaSquishi is an online shop selling squishy toys at avasquishi.com.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>2. Ordering</h2>
        <p className={s.body}>
          By placing an order you confirm that you are authorized to use the payment method provided
          and that the information you supply is accurate and complete.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>3. Pricing</h2>
        <p className={s.body}>
          All prices are shown in US dollars. We reserve the right to correct pricing errors at any
          time before your order ships.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>4. Payment</h2>
        <p className={s.body}>
          Payments are processed securely through Stripe. AvaSquishi never stores your full payment
          card information.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>5. Shipping &amp; Delivery</h2>
        <p className={s.body}>
          Please see our{" "}
          <a href="/shipping" className={s.link}>
            Shipping Policy
          </a>{" "}
          for details on processing times and delivery estimates.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>6. Returns &amp; Refunds</h2>
        <p className={s.body}>
          Please see our{" "}
          <a href="/refunds" className={s.link}>
            Refund Policy
          </a>{" "}
          for full details.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>7. Product Safety</h2>
        <p className={s.body}>
          Our products are intended for ages 3 and up. Please see our{" "}
          <a href="/safety" className={s.link}>
            Safety page
          </a>{" "}
          for important safety information.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>8. Intellectual Property</h2>
        <p className={s.body}>
          All content on this site — including text, images, and logos — is the property of
          AvaSquishi and may not be used or reproduced without permission.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>9. Limitation of Liability</h2>
        <p className={s.body}>
          AvaSquishi is not liable for any indirect or consequential damages arising from the use of
          our products or website, to the fullest extent permitted by applicable law.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>10. Changes to These Terms</h2>
        <p className={s.body}>
          We may update these terms from time to time. Continued use of the site following any
          changes means you accept the updated terms.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>11. Contact</h2>
        <p className={s.body}>
          Questions? Email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>
        </p>
      </section>
    </main>
  );
}
