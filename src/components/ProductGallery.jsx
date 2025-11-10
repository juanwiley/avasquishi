"use client";
import Image from "next/image";
import { useState } from "react";
import styles from "./ProductGallery.module.css";

export default function ProductGallery({ images = [], name = "" }) {
  // ✅ De-duplicate and sanitize images
  const list =
    Array.isArray(images) && images.length > 0
      ? [...new Set(images.filter(Boolean))]
      : ["/placeholder.png"];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = list[activeIndex];

  return (
    <div className={styles.gallery}>
      <div className={styles.hero}>
        <div className={styles.imageWrapper}>
          <Image
            key={active}
            src={active}
            alt={name || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            priority={false}
            onError={(e) => {
              const parent = e.target?.parentNode;
              if (parent && parent.contains(e.target)) {
                try {
                  parent.removeChild(e.target);
                } catch {
                  /* ignore harmless cleanup mismatch */
                }
              }
            }}
          />
        </div>
      </div>

      {list.length > 1 && (
        <div className={styles.thumbs}>
          {list.map((img, i) => (
            <button
              key={`${img}-${i}`} // ✅ ensure unique key
              type="button"
              className={`${styles.thumbBtn} ${
                i === activeIndex ? styles.active : ""
              }`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                width={64}
                height={64}
                className={styles.thumbImg}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
