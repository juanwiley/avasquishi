// apps/avasquishi/src/app/page.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import HeroCarousel from '@/components/HeroCarousel';
import ProductCard from "@/components/ProductCard";
import SignupForm from "@/components/SignupForm";

import { getNewest } from "@/lib/catalog";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
  title: { absolute: "AvaSquishi | Cute Squishy Toys for Kids, by a Kid" },
  description:
    "Soft, slow-rising squishies picked by a kid who loves them: cats, paws, treats and mixes. Ships from Dobbs Ferry, NY. Free US shipping over $40.",
  alternates: { canonical: "/" },
};

export default async function Home() {

  // Four newest in-stock products (same catalog + rules as every other screen)
  const products = await getNewest(4);

// Creating the image items that will be displayed in the carousel
const items = [ 
    {path: "/carousel1.png", alt:"fancy", kind: "image", href: "/products", cta: ""},
    {path: "/carousel2.png", alt:"yummy", kind: "image", href: "/products", cta: ""},
    {path: "/carousel3.png", alt:"avasquishi", kind: "image", href: "/products", cta: ""}
  ];


return (
    
  <main className={styles.main}>
    <HeroCarousel media={items} />      

    <section className={styles.featuredSection}>
      <h2 className={styles.featuredHeading}>🆕 Newest Products</h2>

<div className={styles.featuredGridFader}>
      <div className={styles.featuredGrid}>
          {products.map((product) => ( <ProductCard key={product.id} product={product} /> ))}
      </div>
</div>
      <div className={styles.viewAllLink}>
        <Link href="/products">View All Products →</Link>
      </div>

      <div style={{ margin: "2.5rem 1rem 0" }}>
        <SignupForm
          source="home"
          title="Join the Squish Squad 💌"
          blurb="New squishies sell out fast. Get a heads-up when fresh ones drop."
        />
      </div>
</section>
    

  </main>




);
}
