'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import DishCard from './DishCard';
import CategoryRow from './CategoryRow';
import RestaurantHeader from './RestaurantHeader';
import StickyPhone from './StickyPhone';
import FooterContact from './FooterContact';
import { finishDishSearchFocus } from './dishSearchFocus';
const normalize = value => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
export default function Menu({ categories, items, slides, categoryRecords = [], preview = false }) {
  const returnKey = preview ? 'menu-preview-return' : 'menu-return';
  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');
  const stickyMarker = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchRequested, setSearchOpen] = useState(false);
  const [dishSearchLanding, setDishSearchLanding] = useState(false);
  const controlsRef = useRef(null);
  const slotRef = useRef(null);
  const navRef = useRef(null);
  useEffect(() => {
    const updateWidth = () => slotRef.current.style.setProperty('--category-viewport-width', document.documentElement.clientWidth + 'px');
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const searchNavigation = useRef(false);
  const [homeSearchHeight, setHomeSearchHeight] = useState(null);
  // Enter compact mode and show a populated search in the same render.
  const searchOpen = searchRequested || (isMobile && isSticky && Boolean(query.trim()));
  const compact = isMobile && !dishSearchLanding && (isSticky || searchOpen);
  const stickyCategories = !dishSearchLanding && (isSticky || compact);
  function rememberMenu() {
    try { sessionStorage.setItem(returnKey, JSON.stringify({ category, query, y: window.scrollY })); } catch {}
  }
  useEffect(() => {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem(returnKey) || 'null');
      sessionStorage.removeItem(returnKey);
    } catch {}
    if (saved) {
      if (categories.includes(saved.category)) setCategory(saved.category);
      setQuery(saved.query || '');
    }
    searchNavigation.current = new URLSearchParams(window.location.search).has('search');
    let frame = requestAnimationFrame(() => {
      if (searchNavigation.current) {
        // Commit the expanded controls before calculating their scroll offset.
        flushSync(() => {
          const mobile = window.matchMedia('(max-width: 540px)').matches;
          setIsMobile(mobile);
          setDishSearchLanding(mobile);
          setSearchOpen(true);
        });
        if (window.matchMedia('(max-width: 540px)').matches) {
          const top = navRef.current.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({ top, behavior: 'instant' });
        } else resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        frame = requestAnimationFrame(() => {
          const pendingQuery = finishDishSearchFocus(inputRef.current);
          if (pendingQuery) updateSearch(pendingQuery);
          // Search navigation is a one-time action, not a persistent page mode.
          const url = new URL(window.location.href);
          url.searchParams.delete('search');
          window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
          frame = requestAnimationFrame(() => { searchNavigation.current = false; });
        });
      } else if (saved) window.scrollTo({ top: saved.y || 0, behavior: 'instant' });
    });
    return () => { cancelAnimationFrame(frame); searchNavigation.current = false; };
  }, [categories]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 540px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (stickyCategories) return;
    const controls = controlsRef.current;
    const observer = new ResizeObserver(() => {
      setHomeSearchHeight(controls.getBoundingClientRect().height);
    });
    observer.observe(controls);
    return () => observer.disconnect();
  }, [stickyCategories]);
  useEffect(() => {
    if (!compact) setSearchOpen(false);
  }, [compact]);
  useEffect(() => {
    if (!dishSearchLanding) return;
    let start = null;
    function onStart(event) {
      const touch = event.touches[0];
      start = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
    function onMove(event) {
      const touch = event.touches[0];
      if (!start || !touch) return;
      const distance = start.y - touch.clientY;
      // Only a deliberate downward page scroll ends the expanded landing.
      // Keyboard viewport changes and horizontal category swipes keep it open.
      if (distance > 8 && distance > Math.abs(touch.clientX - start.x)) setDishSearchLanding(false);
    }
    function onWheel(event) {
      if (event.deltaY > 0 && event.deltaY > Math.abs(event.deltaX)) setDishSearchLanding(false);
    }
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('wheel', onWheel);
    };
  }, [dishSearchLanding]);
  useEffect(() => {
    let touchStart = null;
    let upwardScrollUntil = 0;
    function onTouchStart(event) {
      const touch = event.touches[0];
      touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }
    function onTouchMove(event) {
      const touch = event.touches[0];
      if (!touchStart || !touch) return;
      const dy = touch.clientY - touchStart.y;
      if (dy > 8 && dy > Math.abs(touch.clientX - touchStart.x)) {
        upwardScrollUntil = performance.now() + 1200;
        updateSticky();
      }
    }
    function onWheel(event) {
      if (event.deltaY < 0) upwardScrollUntil = performance.now() + 1200;
    }
    function updateSticky() {
      const marker = stickyMarker.current;
      if (!marker) return;
      const sticky = marker.getBoundingClientRect().top < 0;
      setIsSticky(sticky);
      const focused = document.activeElement === inputRef.current;
      // iOS keyboard/viewport changes and shorter search results can move the
      // marker without a user scroll. Keep editing active through those moves.
      const returnedToTop = window.scrollY <= 1 && performance.now() < upwardScrollUntil;
      if (!sticky && !searchNavigation.current && (!focused || returnedToTop)) {
        setSearchOpen(false);
        if (document.activeElement === inputRef.current) inputRef.current.blur();
      }
    }
    // A marker can remain intersecting while scrolling back to the top after
    // search navigation, so intersection changes alone are not sufficient.
    const observer = new IntersectionObserver(updateSticky);
    observer.observe(stickyMarker.current);
    window.addEventListener('scroll', updateSticky, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updateSticky);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);
  const filtered = useMemo(() => items.filter(item => (category === 'الكل' || item.category === category) && normalize(`${item.name} ${item.category} ${item.shortDescription} ${item.description}`).includes(normalize(query))), [items, category, query]);
  function updateSearch(value) {
    setQuery(value);
    if (value.trim()) setCategory('الكل');
  }
  function selectCategory(name) {
    setQuery('');
    setCategory(name);
  }
  function clearSearch() {
    setQuery('');
    inputRef.current?.focus({ preventScroll: true });
  }
  function reset() { selectCategory('الكل'); }
  return <>
    <a className="skip-link" href="#menu">انتقل إلى قائمة الطعام</a>
    <RestaurantHeader slides={slides}/>
    <main className="menu-shell" id="menu"><div ref={stickyMarker} className="sticky-marker" aria-hidden="true" /><div ref={slotRef} className="menu-controls-slot stable-category-controls"><div className="menu-controls home-category-controls" inert={stickyCategories ? true : undefined} style={{ visibility: stickyCategories ? 'hidden' : undefined }}><CategoryRow categories={categories} records={categoryRecords} selected={category} onSelect={selectCategory} visible={!stickyCategories} reserveSpace navRef={navRef} variant="home"/></div><div className="menu-search-slot" style={{ height: homeSearchHeight ? `${homeSearchHeight}px` : undefined }}><div ref={controlsRef} className={`menu-controls${isSticky && !dishSearchLanding ? ' is-sticky' : ''}${compact ? ' is-compact' : ''}${searchOpen ? ' search-open' : ''}`}><CategoryRow categories={categories} records={categoryRecords} selected={category} onSelect={selectCategory} visible={stickyCategories} variant="sticky"/><div className="sticky-search-row"><StickyPhone /><div className="search-wrap" onClick={event => { if (event.target.closest('button')) return; inputRef.current.focus({ preventScroll: true }); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><label className="sr-only" htmlFor="search">ابحث في قائمة الطعام</label><input ref={inputRef} onBlur={() => { if (dishSearchLanding) setDishSearchLanding(false); }} onKeyDown={event => { if (event.key === 'Escape') clearSearch(); }} id="search" type="search" placeholder={compact ? "شنو مشتهي اليوم؟" : "شنو مشتهي اليوم؟ ابحث عن وجبتك…"} value={query} onChange={event => updateSearch(event.target.value)} />{query && <button type="button" className="clear-search" aria-label="مسح البحث" onClick={clearSearch}>×</button>}</div></div>
      </div></div></div>
      <section ref={resultsRef} className="results" aria-labelledby="results-heading"><div className="results-heading"><div><h2 id="results-heading"><span>{query ? 'نتائج البحث' : category === 'الكل' ? 'من قائمة قراميش' : category}</span><svg className="heading-rays" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m24 8 16 14M8 35h27M24 62l16-14" /></svg></h2></div><span className="result-count" role="status" aria-live="polite">{filtered.length} صنف</span></div>
      {filtered.length ? <div className="dish-grid">{filtered.map(item => <DishCard key={item.id} item={item} onOpen={rememberMenu} basePath={preview ? "/admin/preview/dish" : "/dish"} />)}</div> : <div className="empty-state"><span aria-hidden="true">⌕</span><h3>ما لقينا طبق بهذا البحث</h3><p>جرّب اسم ثاني أو اكتشف باقي الأقسام</p><button onClick={reset}>عرض كل القائمة</button></div>}</section>
    </main><footer><span className="footer-flourish" aria-hidden="true">❧</span><img className="footer-logo" src="/logo-badge.webp" alt="قراميش" width="320" height="320" loading="lazy" /><span className="footer-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map(star => <svg key={star} viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z" /></svg>)}</span><p>الطعم الطيب… يجمعنا دائماً</p><FooterContact /></footer>
  </>;
}
