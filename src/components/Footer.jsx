import Link from "next/link";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={s.footer} aria-label="Site footer">
      <div className={s.inner}>
        <nav className={s.links} aria-label="Footer navigation">
          <Link href="/about" className={s.link}>About</Link>
          <Link href="/faq" className={s.link}>FAQ</Link>
          <Link href="/shipping" className={s.link}>Shipping</Link>
          <Link href="/refunds" className={s.link}>Returns</Link>
          <Link href="/safety" className={s.link}>Safety</Link>
          <Link href="/contact" className={s.link}>Contact</Link>
        </nav>

        <nav className={s.legal} aria-label="Legal links">
          <Link href="/terms" className={s.legalLink}>Terms of Service</Link>
          <Link href="/privacy" className={s.legalLink}>Privacy Policy</Link>
        </nav>

        <p className={s.copy}>© {new Date().getFullYear()} AvaSquishi. All rights reserved.</p>
      </div>
    </footer>
  );
}
