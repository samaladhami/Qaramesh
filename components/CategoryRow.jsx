'use client';
import { useLayoutEffect, useRef } from 'react';
import CategoryIcon from './CategoryIcon';

export default function CategoryRow({ categories, records, selected, onSelect, visible = true, reserveSpace = false, navRef, variant }) {
  const ownRef = useRef(null);
  const ref = navRef || ownRef;
  useLayoutEffect(() => {
    if (!visible) return;
    const nav = ref.current;
    function reveal() {
      const button = Array.from(nav.children).find(child => child.dataset.category === selected);
      if (!button || !nav.clientWidth) return;
      const bounds = button.getBoundingClientRect();
      const viewport = nav.getBoundingClientRect();
      if (bounds.left < viewport.left + 4 || bounds.right > viewport.right - 4) {
        const target = nav.scrollLeft + bounds.left + bounds.width / 2 - viewport.left - viewport.width / 2;
        const limit = Math.max(0, nav.scrollWidth - nav.clientWidth);
        const rtl = getComputedStyle(nav).direction === 'rtl';
        nav.scrollTo({ left: rtl ? Math.max(-limit, Math.min(0, target)) : Math.max(0, Math.min(limit, target)), behavior: 'instant' });
      }
    }
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [selected, visible, ref, categories, records]);

  return <nav ref={ref} className={`category-nav category-nav-${variant}`} aria-label={variant === 'home' ? 'أقسام القائمة' : 'أقسام القائمة المثبتة'} hidden={!visible && !reserveSpace}>
    <button className={`category-card all-category ${selected === 'الكل' ? 'selected' : ''}`} data-category="الكل" aria-pressed={selected === 'الكل'} onClick={() => onSelect('الكل')}><span className="all-icon" aria-hidden="true"><img src="/logo-badge.webp" alt="" width="320" height="320" /></span><span>كل القائمة</span></button>
    {categories.map(name => {
      const record = records.find(record => record.name === name);
      return <button key={name} className={`category-card ${selected === name ? 'selected' : ''}`} data-category={name} aria-pressed={selected === name} onClick={() => onSelect(name)}>
        {record?.image ? <span className="category-icon"><img src={record.image} alt="" width="48" height="48" style={{ objectFit: 'contain' }}/></span> : <CategoryIcon name={record?.icon || name}/>}
        <span>{name}</span>
      </button>;
    })}
  </nav>;
}
