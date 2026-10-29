'use client';
import { useEffect } from 'react';

export default function useCategoryScrollHint(navRef, controlsRef) {
  useEffect(() => {
    const nav = navRef.current;
    const controls = controlsRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer = 0;
    let frame = 0;
    let running = false;
    let origin = 0;
    const attempted = new Set();
    let manuallyUsed = false;
    const mode = () => controls.classList.contains('is-compact') || controls.classList.contains('is-sticky') ? 'sticky' : 'home';
    let previousMode = mode();
    const previousBehavior = nav.style.scrollBehavior;

    function stop(restore = true) {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      if (running) {
        if (restore) nav.scrollLeft = origin;
        nav.style.scrollBehavior = previousBehavior;
      }
      running = false;
      timer = frame = 0;
    }
    function eligible() {
      const bounds = nav.getBoundingClientRect();
      return !motion.matches && !document.hidden && !manuallyUsed && bounds.top >= 0 && bounds.bottom <= window.innerHeight &&
        !controls.contains(document.activeElement) && Math.abs(nav.scrollLeft) < 2 &&
        nav.scrollWidth > nav.clientWidth + 8;
    }
    function schedule() {
      if (attempted.has(mode()) || running || !eligible()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = 0;
        if (!eligible()) return;
        attempted.add(mode());
        running = true;
        origin = nav.scrollLeft;
        nav.style.scrollBehavior = 'auto';
        const distance = Math.min(40, nav.scrollWidth - nav.clientWidth);
        const direction = getComputedStyle(nav).direction === 'rtl' ? -1 : 1;
        let start;
        function tick(now) {
          if (!running) return;
          start ??= now;
          const progress = Math.min(1, (now - start) / 800);
          // One gentle round trip; no timers or renders run between hints.
          nav.scrollLeft = origin + direction * distance * (1 - Math.cos(2 * Math.PI * progress)) / 2;
          if (progress < 1) frame = requestAnimationFrame(tick);
          else stop();
        }
        frame = requestAnimationFrame(tick);
      }, 350);
    }
    function onScroll() {
      stop();
      // Wait until scrolling settles before the sticky row's first hint.
      if (mode() === 'sticky') schedule();
    }
    function onInteraction(event) {
      const inNav = nav.contains(event.target);
      if (inNav) manuallyUsed = true;
      attempted.add(mode());
      stop(!inNav);
    }
    function onVisibility() { if (document.hidden) stop(); }
    const observer = new IntersectionObserver(() => {
      if (eligible()) schedule();
      else stop();
    }, { threshold: [0, .9, 1] });
    const modeObserver = new MutationObserver(() => {
      const currentMode = mode();
      if (currentMode === previousMode) return;
      attempted.add(previousMode);
      previousMode = currentMode;
      stop();
      schedule();
    });
    modeObserver.observe(controls, { attributes: true, attributeFilter: ['class'] });
    observer.observe(nav);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerdown', onInteraction, { passive: true });
    document.addEventListener('touchstart', onInteraction, { passive: true });
    document.addEventListener('wheel', onInteraction, { passive: true });
    document.addEventListener('keydown', onInteraction);
    document.addEventListener('focusin', onInteraction);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', stop);
    return () => {
      stop();
      observer.disconnect();
      modeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('pointerdown', onInteraction);
      document.removeEventListener('touchstart', onInteraction);
      document.removeEventListener('wheel', onInteraction);
      document.removeEventListener('keydown', onInteraction);
      document.removeEventListener('focusin', onInteraction);
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', stop);
    };
  }, [navRef, controlsRef]);
}
