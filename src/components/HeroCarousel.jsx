'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './HeroCarousel.module.css';

export default function HeroCarousel({ media }) {
  const [current, setCurrent] = useState(0);
  
  const slides = Array.isArray(media) ? media : [];
  
  // Old definion of slides, including items
  // const slides = (media && media.length ? media : items) ?? [];
  
  const intervalRef = useRef(null);

  const advanceSlide = () => {
    setCurrent((prev) => (prev + 1) % media.length);
  };

  useEffect(() => {
    if (!media.length) return;
    const currentItem = media[current];

const timeoutId = setTimeout(advanceSlide, 6000);

return () => {
  clearTimeout(timeoutId);
};

  }, [current, media]);

  const goTo = (dir) => {
    if (dir === 'prev') {
      setCurrent((prev) => (prev - 1 + media.length) % media.length);
    } else {
      setCurrent((prev) => (prev + 1) % media.length);
    }
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.mediaContainer}>
        {slides.map((item, index) => (
          <div
            key={item.id || index}
            className={`${styles.slide} ${index === current ? styles.active : ''}`}
          >


{item.href ? (
  <a href={item.href}>
    <img className={styles.media} src={item.path} alt={item.alt || 'Media'} />
  </a>
) : (
  <img className={styles.media} src={item.path} alt={item.alt || 'Media'} />
)}

<a href={item.href}>

{item.cta && (
      <div className={styles.ctaOverlay}>
        {item.cta}
      </div>
  )}

</a>

          </div>
        ))}
        <div className={styles.arrows}>
          <button onClick={() => goTo('prev')}>
            <span className={styles.arrowSymbol}>◄</span>
          </button>
          <button onClick={() => goTo('next')}>
            <span className={styles.arrowSymbol}>►</span>
          </button>
        </div>
      </div>
    </div>
  );
}
