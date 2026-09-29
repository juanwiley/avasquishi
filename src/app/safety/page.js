import s from "@/app/info.module.css";

export const metadata = {
  title: "Product Safety",
  description: "Important safety information for AvaSquishi squishy toys. Recommended for ages 3 and up.",
};

export default function SafetyPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>Product Safety</h1>

      <section className={s.section}>
        <p className={s.body}>Your child&apos;s safety comes first. Please read before play.</p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Age Recommendation</h2>
        <div className={s.callout}>
          <p className={s.body}>
            ⚠️ All AvaSquishi products are recommended for ages <strong>3 and up</strong>.
          </p>
        </div>
        <p className={s.body}>
          Some items may contain small parts and are <strong>not suitable for children under 3</strong>.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Supervision</h2>
        <p className={s.body}>
          Adult supervision is recommended, especially for young children.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Intended Use</h2>
        <p className={s.body}>
          Our squishies are novelty toys and sensory play items. They are <strong>not food products</strong>{" "}
          and should not be placed in the mouth.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Care Instructions</h2>
        <ul className={s.list}>
          <li>Keep away from heat and direct sunlight</li>
          <li>Do not submerge in water</li>
          <li>Clean gently with a slightly damp cloth if needed</li>
          <li>Inspect regularly for signs of wear or damage</li>
        </ul>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Warning</h2>
        <p className={s.body}>
          If a squishy becomes damaged — torn, leaking, or showing signs of wear — please discontinue
          use and dispose of it safely.
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Questions?</h2>
        <p className={s.body}>
          Email us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>
        </p>
      </section>
    </main>
  );
}
