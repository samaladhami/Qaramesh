'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export default function DishHeader() {
  const router = useRouter();
  const goBack = useCallback(() => {
    try {
      if (sessionStorage.getItem('menu-return')) { router.back(); return; }
    } catch {}
    router.push('/');
  }, [router]);
  useEffect(() => {
    let gesture = null;
    function start(event) {
      if (!window.matchMedia('(max-width: 540px)').matches || window.scrollY > 0 || event.touches.length !== 1 || event.target.closest('a,button,input,.related-dishes-track')) return;
      const touch = event.touches[0];
      gesture = { x: touch.clientX, y: touch.clientY, distance: 0 };
    }
    function move(event) {
      if (!gesture) return;
      if (event.touches.length !== 1) { gesture = null; return; }
      const touch = event.touches[0];
      const dy = touch.clientY - gesture.y;
      const dx = Math.abs(touch.clientX - gesture.x);
      if (dy < -10 || dx > Math.max(20, dy)) { gesture = null; return; }
      gesture.distance = dy;
      if (dy > 12 && event.cancelable) event.preventDefault();
    }
    function end() {
      const close = gesture && gesture.distance >= 100;
      gesture = null;
      if (close) goBack();
    }
    function cancel() { gesture = null; }
    document.addEventListener('touchstart', start, { passive: true });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', cancel);
    return () => {
      document.removeEventListener('touchstart', start);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', cancel);
    };
  }, [goBack]);
  return <nav className="dish-photo-actions" aria-label="التنقل في الطبق">
    <button className="dish-photo-action" type="button" onClick={goBack} aria-label="إغلاق والعودة إلى القائمة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg></button>
    <Link className="dish-photo-action" href="/?search=1" scroll={false} aria-label="البحث في القائمة"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></svg></Link>
  </nav>;
}
