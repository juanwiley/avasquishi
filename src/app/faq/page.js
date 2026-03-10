import s from "@/app/info.module.css";

export const metadata = {
  title: "FAQ",
  description: "Answers to common questions about AvaSquishi orders, shipping, returns, and product safety.",
};

const faqs = [
  {
    q: "When will my order ship?",
    a: "Most orders ship within 3–5 business days. You'll get a confirmation email with a tracking number when it's on its way.",
  },
  {
    q: "How long does shipping take?",
    a: "After your order ships, standard delivery is typically 5–8 business days within the US.",
  },
  {
    q: "How much does shipping cost?",
    a: "We charge a flat $4.99 shipping fee on most orders. Shipping is free on orders of $40 or more. Very large or heavy orders may incur additional charges, which will be shown at checkout.",
  },
  {
    q: "Do you ship outside the US?",
    a: "We currently ship within the United States only. We hope to expand in the future!",
  },
  {
    q: "Can I return my order?",
    a: "Yes! We accept returns within 30 days of delivery. Items must be unused and in their original packaging. See our Refund Policy for full details.",
  },
  {
    q: "My order arrived damaged. What do I do?",
    a: "We're so sorry! Email us at support@avasquishi.com with your order number and a photo. We'll make it right.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Email us at support@avasquishi.com as soon as possible. We'll do our best to help before your order ships.",
  },
  {
    q: "Are your squishies safe for kids?",
    a: "Yes! Our products are recommended for ages 3 and up. See our Safety page for full details.",
  },
  {
    q: "How do I track my order?",
    a: "You'll receive a tracking number by email when your order ships. You can also log in to your Account to view your order history.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <main className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h1 className={s.heading}>Frequently Asked Questions</h1>

      {faqs.map(({ q, a }) => (
        <section key={q} className={s.section}>
          <h2 className={s.sectionTitle}>{q}</h2>
          <p className={s.body}>{a}</p>
        </section>
      ))}

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Still have questions?</h2>
        <p className={s.body}>
          Email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>{" "}
          — we&apos;re happy to help!
        </p>
      </section>
    </main>
  );
}
