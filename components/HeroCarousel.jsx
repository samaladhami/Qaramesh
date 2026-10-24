'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import styles from './HeroCarousel.module.css';

function shuffle(indices, previous) {
  const result = [...indices];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.length > 1 && result[0] === previous) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

export default function HeroCarousel({ slides }) {
  const [active, setActive] = useState(null);
  const [visited, setVisited] = useState([]);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const order = useRef([]);
  const position = useRef(0);
  const pointer = useRef(null);
  const loaded = useRef(new Set());
  const count = slides.length;

  const show = useCallback(index => {
    setReady(loaded.current.has(index));
    setActive(index);
    setVisited(previous => previous.includes(index) ? previous : [...previous, index]);
    setRevision(value => value + 1);
  }, []);

  useEffect(() => {
    if (!count) return;
    order.current = shuffle(Array.from({ length: count }, (_, index) => index));
    position.current = 0;
    show(order.current[0]);
  }, [count, show]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { if (media.matches) setPaused(true); };
    const updateVisibility = () => setVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const advance = useCallback((direction = 1) => {
    let nextPosition = position.current + direction;
    if (nextPosition >= count) {
      order.current = shuffle(Array.from({ length: count }, (_, index) => index), active);
      nextPosition = 0;
    } else if (nextPosition < 0) nextPosition = count - 1;
    position.current = nextPosition;
    show(order.current[nextPosition]);
  }, [active, count, show]);

  useEffect(() => {
    if (count < 2 || active === null || !ready || paused || hovered || focused || !visible) return;
    const timer = window.setTimeout(() => advance(), 5000);
    return () => window.clearTimeout(timer);
  }, [active, advance, count, focused, hovered, paused, ready, revision, visible]);

  if (!count) return null;
  const nextIndex = order.current[position.current + 1];

  return <section className={styles.carousel} aria-label="صور من مطعم قراميش" aria-roledescription="عرض شرائح"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <div className={styles.stage} id="hero-slides" onPointerDown={event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointer.current = { x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerCancel={() => { pointer.current = null; }} onPointerUp={event => {
      const start = pointer.current;
      pointer.current = null;
      if (!start || active === null || count < 2) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) advance(dx < 0 ? 1 : -1);
    }}>
      {slides.map((slide, index) => (visited.includes(index) || index === nextIndex) && <div key={slide.id}
        className={`${styles.slide} ${active === index ? styles.active : ''}`}
        role="group" aria-roledescription="شريحة" aria-label={`${index + 1} من ${count}`} aria-hidden={active !== index}>
        <Image src={slide.src} alt="" fill sizes="(max-width: 540px) 100vw, 50vw" className={styles.backdrop} aria-hidden="true" />
        <Image src={slide.src} alt={slide.alt} fill sizes="(max-width: 540px) 100vw, 520px"
          className={styles.foreground} loading="eager" draggable={false}
          onLoad={() => { loaded.current.add(index); if (active === index) setReady(true); }} />
      </div>)}
    </div>
  </section>;
}
