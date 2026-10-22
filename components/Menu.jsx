'use client';
import { useMemo, useState } from 'react';
import DishCard from './DishCard';
import FoodImage from './FoodImage';
const normalize = value => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/\s+/g, ' ').toLowerCase().trim();
export default function Menu({ categories, items }) {
  const [category, setCategory] = useState('الكل');
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => items.filter(item => (category === 'الكل' || item.category === category) && normalize(`${item.name} ${item.category} ${item.shortDescription} ${item.description}`).includes(normalize(query))), [items, category, query]);
  function reset() { setCategory('الكل'); setQuery(''); }
  return <>
    <a className="skip-link" href="#menu">انتقل إلى قائمة الطعام</a>
    <header className="brand-header"><div className="header-top"><span>نكهة تجمعنا</span><span lang="en" dir="ltr">QARAMESH RESTAURANT</span></div><div className="brand-lockup"><span className="ornament" aria-hidden="true">❧</span><img className="logo" src="/logo.png" alt="مطعم قراميش" width="434" height="145" /><span className="ornament mirrored" aria-hidden="true">❧</span></div><p className="welcome">أهلاً بكم على سفرتنا</p><div className="gold-rule" aria-hidden="true">✦</div></header>
    <main className="menu-shell" id="menu"><div className="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg><label className="sr-only" htmlFor="search">ابحث في قائمة الطعام</label><input id="search" type="search" placeholder="شنو مشتهي اليوم؟ ابحث عن وجبتك…" value={query} onChange={event => { setQuery(event.target.value); if (event.target.value.trim()) setCategory('الكل'); }} />{query && <button className="clear-search" aria-label="مسح البحث" onClick={() => setQuery('')}>×</button>}</div>
      <div className="section-label"><h2>اكتشف قائمتنا</h2><span>٢٠ قسم · نكهات لكل الأذواق</span></div>
      <nav className="category-nav" aria-label="أقسام القائمة"><button className={`category-card all-category ${category === 'الكل' ? 'selected' : ''}`} aria-pressed={category === 'الكل'} onClick={() => setCategory('الكل')}><span className="all-icon" aria-hidden="true">✦</span><span>كل القائمة</span></button>{categories.map((name, index) => <button key={name} className={`category-card ${category === name ? 'selected' : ''}`} aria-pressed={category === name} onClick={() => setCategory(name)}><FoodImage src={items.find(item => item.category === name && item.image)?.image} alt="" eager={index < 5} /><span>{name}</span></button>)}</nav>
      <section className="results" aria-labelledby="results-heading"><div className="results-heading"><div><span className="eyebrow">طازج، شهي، وعلى ذوقك</span><h2 id="results-heading">{query ? 'نتائج البحث' : category === 'الكل' ? 'من قائمة قراميش' : category}</h2></div><span className="result-count" role="status" aria-live="polite">{filtered.length} صنف</span></div>
      {filtered.length ? <div className="dish-grid">{filtered.map(item => <DishCard key={item.id} item={item} />)}</div> : <div className="empty-state"><span aria-hidden="true">⌕</span><h3>ما لقينا طبق بهذا البحث</h3><p>جرّب اسم ثاني أو اكتشف باقي الأقسام</p><button onClick={reset}>عرض كل القائمة</button></div>}</section>
    </main><footer><span className="footer-flourish" aria-hidden="true">❧</span><strong>قراميش</strong><p>الطعم الطيب… يجمعنا دائماً</p><small>جميع الأسعار بالدينار العراقي</small></footer>
  </>;
}
