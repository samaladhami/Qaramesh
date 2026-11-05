'use client';
import { useEffect, useRef } from 'react';

// Browsers expose RTL scrollLeft as negative, positive from the start, or
// positive from the end. Detect using an isolated element, never the real row.
function rtlScrollType() {
  const probe = document.createElement('div');
  probe.dir = 'rtl';
  probe.style.cssText = 'position:absolute;left:-10000px;top:-10000px;width:4px;height:1px;overflow:scroll;visibility:hidden;';
  const child = document.createElement('div');
  child.style.width = '8px';
  probe.appendChild(child);
  document.body.appendChild(probe);
  let type = 'default';
  if (probe.scrollLeft === 0) {
    probe.scrollLeft = 1;
    type = probe.scrollLeft === 0 ? 'negative' : 'reverse';
  }
  probe.remove();
  return type;
}

export default function useHomeCategoryHint(ref, enabled, visible) {
  const finished = useRef(false);
  useEffect(() => {
    if (!enabled || finished.current) return;
    if (!visible) { finished.current = true; return; }
    const nav = ref.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0;
    let frame = 0;
    let restore = null;
    function cancel() {
      finished.current = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      restore = null;
    }
    function onVisibility() { if (document.hidden) cancel(); }
    timer = window.setTimeout(() => {
      finished.current = true;
      const bounds = nav.getBoundingClientRect();
      if (motion.matches || document.hidden || bounds.bottom <= 0 || bounds.top >= innerHeight) return;
      const limit = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const rtl = getComputedStyle(nav).direction === 'rtl';
      const type = rtl ? rtlScrollType() : 'reverse';
      const raw = nav.scrollLeft;
      const origin = rtl && type === 'default' ? limit - raw : type === 'negative' ? -raw : raw;
      const distance = Math.min(60, Math.max(0, limit - origin));
      if (!distance) return;
      const write = value => { nav.scrollLeft = rtl && type === 'default' ? limit - value : type === 'negative' ? -value : value; };
      restore = () => { nav.scrollLeft = raw; };
      let start;
      function tick(now) {
        start ??= now;
        const progress = Math.min(1, (now - start) / 1000);
        write(origin + distance * (1 - Math.cos(2 * Math.PI * progress)) / 2);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else { restore(); restore = null; }
      }
      frame = requestAnimationFrame(tick);
    }, 1000);
    const events = ['pointerdown', 'touchstart', 'wheel', 'keydown', 'focusin'];
    events.forEach(event => nav.addEventListener(event, cancel, { passive: true }));
    motion.addEventListener('change', cancel);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      // Restore only on layout/unmount cleanup, never during a user's swipe.
      restore?.();
      events.forEach(event => nav.removeEventListener(event, cancel));
      motion.removeEventListener('change', cancel);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, enabled, visible]);
}
