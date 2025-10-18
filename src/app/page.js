// apps/avasquishi/src/app/page.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import HeroCarousel from '@/components/HeroCarousel';
import ProductCard from "@/components/ProductCard";

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
//const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
//const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

import Link from "next/link";
//import Image from "next/image";  // not needed until we render images here
import styles from "./page.module.css";

      // Dynamic fetchin of images disabled for simplicity
      /*
  useEffect(() => {
    const supabase = createClientComponentClient();

    const fetchCarouselMedia = async () => {
      

      const { data, error } = await supabase
        .from('media_assets')
        .select('id, path, kind, alt, sort_order')
        .eq('is_featured', true)
        .eq('published', true)
        .order('sort_order');

      if (error) {
        console.error('Carousel fetch error:', error.message);
      } else {
        setCarouselMedia(data || []);
      } 
    }; 

    fetchCarouselMedia();
  }, []); */

export default async function Home() {

// Fetching products from my inventory in Supabase
const { data: products, error } = await supabase
    .from("inventory_items") // or your exposed `public.inventory_items` view
    .select("*")
    .eq("active", true)
    .gt("quantity",0)
    .order("created_at", { ascending: false })
    .limit(4); // limit to newest 4

  if (error) console.error("Error fetching products:", error);

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
          {products.slice(0, 4).map((product) => ( <ProductCard key={product.id} product={product} /> ))}
      </div>
</div>
      <div className={styles.viewAllLink}>
        <Link href="/products">View All Products →</Link>
      </div>

      <div className={styles.footer}>
        <br></br>  
      &copy; 2025 Juan Wiley. All rights reserved.
      </div>
</section>
    

  </main>




);
}