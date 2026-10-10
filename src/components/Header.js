"use client";

import Link from "next/link";
import Image from "next/image";
import s from "./Header.module.css";
import { useCart } from "@/context/CartContext";
import { useEffect, useState } from "react";

export default function Header() {
  const { count = 0 } = useCart(); // ✅ from CartContext
  const [ping, setPing] = useState(false);

  // animate badge whenever count changes
  useEffect(() => {
    if (count === 0) return;
    setPing(true);
    const t = setTimeout(() => setPing(false), 500);
    return () => clearTimeout(t);
  }, [count]); // ✅ no lastAddedAt

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link href="/" className={s.logoLink} aria-label="AvaSquishi home">
          <Image
            src="/AvaSquishiLogotype.png"
            alt="AvaSquishi logo"
            width={168}
            height={52}
            priority
            className={s.logo}
          />
        </Link>

        <nav className={s.nav} aria-label="Main">
          <Link href="/" className={s.navLink}>Home</Link>
          <Link href="/products" className={s.navLink}>Shop</Link>
        </nav>

        <div className={s.actions} role="navigation" aria-label="Account and cart">
          <Link href="/account" className={s.iconButton} aria-label="Account">
            <UserIcon className={s.icon} />
            <span className={s.navText}>Account</span>
          </Link>

          <Link href="/cart" className={s.iconButton} aria-label="Cart">
            <CartIcon className={s.icon} />
            <span className={s.navText}>Cart</span>

            {/* ✅ Red badge */}
            {count > 0 && (
              <span
                key={String(count)}
                className={`${s.badge} ${ping ? s.badgePing : ""}`}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function CartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h7.3a2 2 0 0 0 2-1.6L21 7H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.6" fill="currentColor" />
      <circle cx="18" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 20a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
