'use client';
import { useLayoutEffect, useRef } from 'react';

export default function useCategoryScrollPosition(navRef, mode) {
  const positions = useRef({ home: 0, sticky: 0 });
  const currentMode = useRef(mode);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const restore = () => {
      const limit = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const rtl = getComputedStyle(nav).direction === 'rtl';
      const saved = positions.current[currentMode.current];
      const left = rtl ? Math.max(-limit, Math.min(0, saved)) : Math.max(0, Math.min(limit, saved));
      // Stop any old smooth scroll before applying the other layout's offset.
      nav.scrollTo({ left, behavior: 'instant' });
    };
    currentMode.current = mode;
    restore();
    const remember = () => {
      const limit = Math.max(0, nav.scrollWidth - nav.clientWidth);
      positions.current[currentMode.current] = Math.max(-limit, Math.min(limit, nav.scrollLeft));
    };
    nav.addEventListener('scroll', remember, { passive: true });
    let width = nav.clientWidth;
    const observer = new ResizeObserver(() => {
      if (width === nav.clientWidth) return;
      width = nav.clientWidth;
      restore();
    });
    observer.observe(nav);
    return () => {
      nav.removeEventListener('scroll', remember);
      observer.disconnect();
    };
  }, [navRef, mode]);
}
