'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import DishCard from './DishCard';
import CategoryIcon from './CategoryIcon';
import RestaurantHeader from './RestaurantHeader';
import StickyPhone from './StickyPhone';
import FooterContact from './FooterContact';
const normalize = value => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
export default function Menu({ categories, items }) {
  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');
  const stickyMarker = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [visibleCategory, setVisibleCategory] = useState('الكل');
  const controlsRef = useRef(null);
  const navRef = useRef(null);
  const inputRef = useRef(null);
  const searchButtonRef = useRef(null);
  const resultsRef = useRef(null);
  const searchNavigation = useRef(false);
  const [expandedHeight, setExpandedHeight] = useState(null);
  const compact = isMobile && (isSticky || searchOpen);
  function rememberMenu() {
    try { sessionStorage.setItem('menu-return', JSON.stringify({ category, query, y: window.scrollY })); } catch {}
  }
  useEffect(() => {
    let saved;
    try {
      saved = JSON.parse(sessionStorage.getItem('menu-return') || 'null');
      sessionStorage.removeItem('menu-return');
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
          setIsMobile(window.matchMedia('(max-width: 540px)').matches);
          setSearchOpen(true);
        });
        resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
        frame = requestAnimationFrame(() => {
          inputRef.current?.focus({ preventScroll: true });
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
  const activeCategory = compact && category === 'الكل' && !query.trim() ? visibleCategory : category;
  useEffect(() => {
    const media = window.matchMedia('(max-width: 540px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!isMobile || compact) return;
    const controls = controlsRef.current;
    const observer = new ResizeObserver(() => {
      if (!controls.classList.contains('is-compact')) setExpandedHeight(controls.getBoundingClientRect().height);
    });
    observer.observe(controls);
    return () => observer.disconnect();
  }, [isMobile, compact]);
  useEffect(() => {
    if (!compact) setSearchOpen(false);
  }, [compact]);
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
      const sticky = stickyMarker.current.getBoundingClientRect().top < 0;
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
  useEffect(() => {
    if (!isMobile) return;
    const nav = navRef.current;
    const button = Array.from(nav.querySelectorAll('button')).find(button => button.dataset.category === activeCategory);
    if (!button) return;
    const bounds = button.getBoundingClientRect();
    const viewport = nav.getBoundingClientRect();
    if (bounds.left < viewport.left || bounds.right > viewport.right) {
      nav.scrollBy({ left: bounds.left + bounds.width / 2 - viewport.left - viewport.width / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [activeCategory, isMobile, compact]);
  useEffect(() => {
    if (!compact || category !== 'الكل' || query.trim()) return;
    const cards = Array.from(resultsRef.current.querySelectorAll('[data-dish-category]'));
    const visible = new Set();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      const first = cards.find(card => visible.has(card));
      if (first) setVisibleCategory(first.dataset.dishCategory);
    }, { rootMargin: '-148px 0px -35% 0px', threshold: 0 });
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [compact, category, query]);
  function updateSearch(value) {
    setQuery(value);
    if (value.trim()) setCategory('الكل');
  }
  function selectCategory(name) {
    setQuery('');
    setCategory(name);
    if (isMobile) setVisibleCategory(name);
  }
  function openSearch() {
    flushSync(() => setSearchOpen(true));
    // Focus in the tap event so mobile browsers can open the keyboard.
    inputRef.current.focus({ preventScroll: true });
  }
  function closeSearch() {
    flushSync(() => { setQuery(''); setSearchOpen(false); });
    searchButtonRef.current?.focus({ preventScroll: true });
  }
  function reset() { selectCategory('الكل'); }
  return <>
    <a className="skip-link" href="#menu">انتقل إلى قائمة الطعام</a>
    <RestaurantHeader />
    <main className="menu-shell" id="menu"><div ref={stickyMarker} className="sticky-marker" aria-hidden="true" /><div className="menu-controls-slot" style={{ '--expanded-controls-height': expandedHeight ? `${expandedHeight}px` : undefined }}><div ref={controlsRef} className={`menu-controls${isSticky ? ' is-sticky' : ''}${compact ? ' is-compact' : ''}${searchOpen ? ' search-open' : ''}`}><div className="sticky-search-row"><button className="scroll-logo" type="button" aria-label="قراميش — فتح البحث" aria-controls="search" aria-expanded={searchOpen} tabIndex={isSticky || compact ? 0 : -1} onClick={openSearch}><img src="/logo-scroll-teal.webp" alt="" width="352" height="176" /></button><button ref={searchButtonRef} className="compact-search-toggle" type="button" aria-label="فتح البحث" aria-expanded={searchOpen} aria-controls="search" onClick={openSearch}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg></button>{(!isMobile || (compact && !searchOpen)) && <StickyPhone />}<div className="search-wrap" onClick={event => { if (event.target.closest('button')) return; inputRef.current.focus({ preventScroll: true }); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><label className="sr-only" htmlFor="search">ابحث في قائمة الطعام</label><input ref={inputRef} tabIndex={compact && !searchOpen ? -1 : undefined} onKeyDown={event => { if (event.key === 'Escape' && compact) closeSearch(); }} id="search" type="search" placeholder="شنو مشتهي اليوم؟ ابحث عن وجبتك…" value={query} onChange={event => updateSearch(event.target.value)} />{query && !compact && <button className="clear-search" aria-label="مسح البحث" onClick={() => updateSearch('')}>×</button>}{compact && <button type="button" className="compact-search-close" aria-label="مسح وإغلاق البحث" onClick={closeSearch}>×</button>}</div></div>
      <div className="section-label"><h2>اكتشف قائمتنا</h2><span>٢٠ قسم · نكهات لكل الأذواق</span></div>
      <nav ref={navRef} className="category-nav" aria-label="أقسام القائمة"><button className={`category-card all-category ${activeCategory === 'الكل' ? 'selected' : ''}`} data-category="الكل" aria-pressed={activeCategory === 'الكل'} onClick={() => selectCategory('الكل')}><span className="all-icon" aria-hidden="true">✦</span><span>كل القائمة</span></button>{categories.map(name => <button key={name} className={`category-card ${activeCategory === name ? 'selected' : ''}`} data-category={name} aria-pressed={activeCategory === name} onClick={() => selectCategory(name)}><CategoryIcon name={name} /><span>{name}</span></button>)}</nav></div></div>
      <section ref={resultsRef} className="results" aria-labelledby="results-heading"><div className="results-heading"><div><span className="eyebrow">طازج، شهي، وعلى ذوقك</span><h2 id="results-heading"><span>{query ? 'نتائج البحث' : category === 'الكل' ? 'من قائمة قراميش' : category}</span><svg className="heading-rays" viewBox="0 0 50 70" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" aria-hidden="true" focusable="false"><path d="m24 8 16 14M8 35h27M24 62l16-14" /></svg></h2></div><span className="result-count" role="status" aria-live="polite">{filtered.length} صنف</span></div>
      {filtered.length ? <div className="dish-grid">{filtered.map(item => <DishCard key={item.id} item={item} onOpen={rememberMenu} />)}</div> : <div className="empty-state"><span aria-hidden="true">⌕</span><h3>ما لقينا طبق بهذا البحث</h3><p>جرّب اسم ثاني أو اكتشف باقي الأقسام</p><button onClick={reset}>عرض كل القائمة</button></div>}</section>
    </main><footer><span className="footer-flourish" aria-hidden="true">❧</span><img className="footer-logo" src="/logo-badge.webp" alt="قراميش" width="320" height="320" loading="lazy" /><span className="footer-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map(star => <svg key={star} viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z" /></svg>)}</span><p>الطعم الطيب… يجمعنا دائماً</p><FooterContact /></footer>
  </>;
}
