'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import DishCard from './DishCard';
import CategoryIcon from './CategoryIcon';
import RestaurantHeader from './RestaurantHeader';
import StickyPhone from './StickyPhone';
import FooterContact from './FooterContact';
const normalize = value => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
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
  const [expandedHeight, setExpandedHeight] = useState(null);
  const compact = isMobile && isSticky;
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
    const observer = new IntersectionObserver(([entry]) => {
      setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(stickyMarker.current);
    return () => observer.disconnect();
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
    if (compact) requestAnimationFrame(() => resultsRef.current.scrollIntoView({ block: 'start', behavior: 'instant' }));
  }
  function selectCategory(name) {
    setQuery('');
    setCategory(name);
    if (isMobile) {
      setVisibleCategory(name);
      // Show the selected category from its beginning beneath the compact controls.
      requestAnimationFrame(() => {
        resultsRef.current.scrollIntoView({ block: 'start', behavior: 'instant' });
      });
    }
  }
  function openSearch() {
    flushSync(() => setSearchOpen(true));
    // Focus in the tap event so mobile browsers can open the keyboard.
    inputRef.current.focus({ preventScroll: true });
  }
  function closeSearch() {
    flushSync(() => setSearchOpen(false));
    searchButtonRef.current?.focus({ preventScroll: true });
  }
  function reset() { selectCategory('الكل'); }
  return <>
    <a className="skip-link" href="#menu">انتقل إلى قائمة الطعام</a>
    <RestaurantHeader />
    <main className="menu-shell" id="menu"><div ref={stickyMarker} className="sticky-marker" aria-hidden="true" /><div className="menu-controls-slot" style={{ '--expanded-controls-height': expandedHeight ? `${expandedHeight}px` : undefined }}><div ref={controlsRef} className={`menu-controls${isSticky ? ' is-sticky' : ''}${compact ? ' is-compact' : ''}${searchOpen ? ' search-open' : ''}`}><div className="sticky-search-row"><img className="scroll-logo" src="/logo-teal-scroll.png" alt="" aria-hidden="true" width="320" height="132" /><button ref={searchButtonRef} className="compact-search-toggle" type="button" aria-label="فتح البحث" aria-expanded={searchOpen} aria-controls="search" onClick={openSearch}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg></button>{compact && !searchOpen && <StickyPhone />}<div className="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><label className="sr-only" htmlFor="search">ابحث في قائمة الطعام</label><input ref={inputRef} tabIndex={compact && !searchOpen ? -1 : undefined} onKeyDown={event => { if (event.key === 'Escape' && compact) closeSearch(); }} id="search" type="search" placeholder="شنو مشتهي اليوم؟ ابحث عن وجبتك…" value={query} onChange={event => updateSearch(event.target.value)} />{query && <button className="clear-search" aria-label="مسح البحث" onClick={() => updateSearch('')}>×</button>}{compact && <button type="button" className="compact-search-close" aria-label="إغلاق البحث" onClick={closeSearch}>×</button>}</div></div>
      <div className="section-label"><h2>اكتشف قائمتنا</h2><span>٢٠ قسم · نكهات لكل الأذواق</span></div>
      <nav ref={navRef} className="category-nav" aria-label="أقسام القائمة"><button className={`category-card all-category ${activeCategory === 'الكل' ? 'selected' : ''}`} data-category="الكل" aria-pressed={activeCategory === 'الكل'} onClick={() => selectCategory('الكل')}><span className="all-icon" aria-hidden="true">✦</span><span>كل القائمة</span></button>{categories.map(name => <button key={name} className={`category-card ${activeCategory === name ? 'selected' : ''}`} data-category={name} aria-pressed={activeCategory === name} onClick={() => selectCategory(name)}><CategoryIcon name={name} /><span>{name}</span></button>)}</nav></div></div>
      <section ref={resultsRef} className="results" aria-labelledby="results-heading"><div className="results-heading"><div><span className="eyebrow">طازج، شهي، وعلى ذوقك</span><h2 id="results-heading">{query ? 'نتائج البحث' : category === 'الكل' ? 'من قائمة قراميش' : category}</h2></div><span className="result-count" role="status" aria-live="polite">{filtered.length} صنف</span></div>
      {filtered.length ? <div className="dish-grid">{filtered.map(item => <DishCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span aria-hidden="true">⌕</span><h3>ما لقينا طبق بهذا البحث</h3><p>جرّب اسم ثاني أو اكتشف باقي الأقسام</p><button onClick={reset}>عرض كل القائمة</button></div>}</section>
    </main><footer><span className="footer-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map(star => <svg key={star} viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z" /></svg>)}</span><span className="footer-flourish" aria-hidden="true">❧</span><strong>قراميش</strong><p>الطعم الطيب… يجمعنا دائماً</p><FooterContact /></footer>
  </>;
}
