import s from "@/app/info.module.css";

export const metadata = {
  title: "Contact",
  description: "Get in touch with AvaSquishi. We read every message and reply within 1–2 business days.",
};

export default function ContactPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Contact Us</h1>

      <section className={s.section}>
        <p className={s.body}>We&apos;d love to hear from you!</p>
        <div className={s.callout}>
          <p className={s.body}>
            📧{" "}
            <a href="mailto:support@avasquishi.com" className={s.link}>
              support@avasquishi.com
            </a>
          </p>
        </div>
        <p className={s.body}>
          We&apos;re a small team and we read every message. We&apos;ll get back to you within{" "}
          <strong>1–2 business days</strong>.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Looking for a quick answer?</h2>
        <p className={s.body}>
          Our{" "}
          <a href="/faq" className={s.link}>
            FAQ page
          </a>{" "}
          covers the most common questions about orders, shipping, and returns.
        </p>
      </section>
    </main>
  );
}
