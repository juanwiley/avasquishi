import s from "@/app/info.module.css";

export const metadata = {
  title: "About",
  description: "Meet Ava — the kid behind AvaSquishi — and learn how a love of squishy toys turned into a real shop.",
};

export default function AboutPage() {
  return (
    <main className={s.page}>
      <h1 className={s.heading}>About AvaSquishi</h1>

      <section className={s.section}>
        <p className={s.body}>
          AvaSquishi was started by Ava, a kid who loves squishy toys more than almost anything.
        </p>
        <p className={s.body}>
          It started with a shelf full of squishies — and a big idea. Ava thought:{" "}
          <em>wouldn&apos;t it be cool to share the squishies I love with other kids?</em> So she built a shop.
        </p>
        <p className={s.body}>
          Every toy in the store is something Ava would want herself. No fillers, no junk — just soft,
          squishy, squeezable things that make you smile.
        </p>
        <p className={s.body}>
          AvaSquishi is a small, independent shop run with a lot of heart. Thank you so much for supporting it. 💛
        </p>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>Say hi!</h2>
        <p className={s.body}>
          Questions or just want to share some squishy love? Reach us at{" "}
          <a href="mailto:support@avasquishi.com" className={s.link}>
            support@avasquishi.com
          </a>
        </p>
      </section>
    </main>
  );
}
