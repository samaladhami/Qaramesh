import suppliedArt from './category-icon-art.json';

const icons = {
  'الكل': <><rect x="10" y="10" width="16" height="16" rx="4"/><rect x="38" y="10" width="16" height="16" rx="4"/><rect x="10" y="38" width="16" height="16" rx="4"/><rect x="38" y="38" width="16" height="16" rx="4"/></>,
  'الأطباق': <><path d="M12 44a20 20 0 0 1 40 0M29 24v-2a3 3 0 0 1 6 0v2M7 44h50c0 5-11 8-25 8S7 49 7 44ZM22 17c-4-4 3-6 0-10M32 13c-4-4 3-6 0-10M42 17c-4-4 3-6 0-10"/></>,
  'السندويتشات': <g transform="rotate(35 32 32)"><path d="M19 17v31c0 6 26 6 26 0V17"/><ellipse cx="32" cy="17" rx="13" ry="8"/><path d="m23 17 4-3 5 3 5-3 4 3M23 21l4-2 5 3 5-3 4 2m-21 9 24 6m-24 3 24 6m-16-16 5-5"/></g>,
  'البركَر': <><path d="M11 27a21 18 0 0 1 42 0ZM10 34l8-4 8 5 11-5 10 5 7-3M12 48h40v3a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6Z"/><rect x="10" y="39" width="44" height="7" rx="3.5"/><path d="m23 19 1-1m8-2 1-1m8 4 1-1"/></>,
  'الكومبير': <><path d="M8 37c0-15 9-24 24-24s24 9 24 24c0 11-11 17-24 17S8 48 8 37Z"/><path d="M15 34c3-9 8-13 17-13s14 4 17 13l-9-3-8 6-8-6ZM19 42l5 3m8-3 4 3m7-6 3 2"/><circle cx="28" cy="26" r="1"/><circle cx="38" cy="27" r="1"/></>,
  'البيتزا': <><path d="m12 53 15-43c13 3 23 12 28 24ZM25 17c11 3 18 9 23 19"/><circle cx="29" cy="29" r="3"/><circle cx="38" cy="37" r="3"/><circle cx="23" cy="42" r="2.5"/></>,
  'الكنتاكي': <><path d="M28 19c-6-5-15 0-15 8 0 5 4 9 9 10l10 10 8-8-9-11c1-4 0-7-3-9ZM34 45l8 8c-1 5 5 7 7 3 5 1 7-5 2-7l-9-8"/><path d="m20 25 2-1m-2 7 2 1m5-6 1 2M41 10l-2 6m10 1-4 4"/></>,
  'الإيطالي': <><path d="M9 42h46c-2 10-11 15-23 15S11 52 9 42ZM16 37c-9-16 11-23 13-10 2 12-11 11-8 0 3-13 21-12 19 2-2 12-13 10-9 0 5-12 19-7 16 8M19 13l23 7M21 8l23 7"/></>,
  'الزنجر': <><path d="m13 36 20-21 6 1 6 5 1 6-19 23-6 1-7-7ZM29 12l4 3m-3 8 3 2m-10 6 4 2m-9 6 4 3m17-14 3 2M37 42l6-3 7 3 3 7-5 5-8-1-4-5ZM16 17l-3-4m32-3-2 5"/></>,
  'الريزو': <><path d="M10 34h44c0 14-9 22-22 22S10 48 10 34ZM15 29c1-6 5-10 11-10 2-6 12-6 15 0 5 0 9 5 9 10M21 26l3-1m8-2 2 2m7 1 3 1M24 41l3 1m10-1 3-1"/></>,
  'السلطات': <><path d="M9 34h46c-2 14-10 21-23 21S11 48 9 34ZM17 32C6 23 12 13 21 20c-1-14 12-15 14-3 10-10 19-1 12 7 12-1 11 8 5 10M23 33l-5-9m15 9 1-16m7 16 7-9"/></>,
  'المقبلات': <><path d="M12 32h40l-5 24H17ZM16 31l-3-18 7-1 4 19m0 0-1-24 7-1 2 25m0 0 4-21 7 2-4 19m2 0 7-15 6 3-5 12M25 39v9m14-9v9"/></>,
  'المشروبات الساخنة': <><path d="M14 27h32v14a13 13 0 0 1-13 13h-6a13 13 0 0 1-13-13ZM46 30h4a7 7 0 0 1 0 14h-4M10 58h42M22 20c-5-5 4-7 0-12m10 12c-5-5 4-7 0-12m10 12c-5-5 4-7 0-12"/></>,
  'المشروبات الباردة': <><path d="M17 18h30l-4 39H21ZM14 18h36M34 29l6-22h10M20 32h24"/><rect x="24" y="36" width="7" height="7" rx="1" transform="rotate(-12 28 40)"/><path d="m35 46 5 2"/></>,
  'العصائر الطبيعية': <><path d="M9 25h27l-4 31H13ZM23 35l7-27h10M12 35h20"/><circle cx="46" cy="39" r="12"/><path d="M46 27v24M34 39h24m-20-8 16 16m0-16L38 47M43 24c-2-8 4-13 11-13-1 7-4 11-11 13Z"/></>,
  'موهيتو': <><path d="M16 25h34l-4 31H20ZM37 33l7-25h9M25 24l-3-6M22 18c-8 1-12-3-12-9 7-1 12 2 12 9Zm1-1c-1-7 2-11 8-11 1 6-2 10-8 11Z"/><rect x="24" y="33" width="7" height="6" rx="1.5" transform="rotate(-12 27.5 36)"/><path d="M21 44c8-3 15 3 25 0"/><circle cx="39" cy="39" r="1" fill="currentColor" stroke="none"/><circle cx="29" cy="49" r="1" fill="currentColor" stroke="none"/><circle cx="37" cy="51" r="1" fill="currentColor" stroke="none"/></>,
  'الميلك شيك': <><path d="M18 31h28l-4 26H22ZM15 31h34M20 25c-7-8 4-10 8-15 2 6 13 4 14 11 7 0 9 6 4 10M34 18l7-12h9M26 38l2 12m9-12-2 12"/><circle cx="28" cy="9" r="3"/></>,
  'أطباق اخرى': <><ellipse cx="32" cy="35" rx="24" ry="18"/><ellipse cx="32" cy="35" rx="15" ry="11"/><path d="M4 12v15m4-15v15m4-15v15M4 24c0 6 8 6 8 0M8 29v27M60 12c-6 6-6 18 0 18v26M26 35h12m-6-6v12"/></>,
  'الكنافة': <><ellipse cx="32" cy="28" rx="23" ry="14"/><path d="M9 28v9c0 8 10 14 23 14s23-6 23-14v-9M6 39c0 10 12 17 26 17s26-7 26-17M15 25l7-4m-6 10 8-5m-2 11 6-4m13-14 6 4m-6 4 8 4m-13 6 9-2M20 43c7 4 17 4 24 0"/><path d="m29 20 3-3 3 3-3 3Zm3 9 3-3 3 3-3 3Z"/></>,
  'كريب وافل': <><rect x="12" y="12" width="40" height="40" rx="9"/><path d="M23 13v38m10-38v38m10-38v38M13 23h38M13 33h38M13 43h38M40 9c-3-6 6-9 8-3"/></>,
  'الأراكيل': <><path d="M25 12h14l-3 8h-8ZM32 20v16M25 36h14l6 15c2 6-28 6-26 0ZM21 46h22M24 10h16M38 29c18 0 21 7 15 16-4 6-1 10 4 10M57 55V43M29 6h6"/></>,
};

export default function CategoryIcon({ name }) {
  const art = suppliedArt[name];
  if (art) {
    return <span className="category-icon"><svg viewBox={art.viewBox} width="64" height="64" fill={art.strokeWidth ? 'none' : 'currentColor'} stroke={art.strokeWidth ? 'currentColor' : undefined} strokeWidth={art.strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{art.paths.map((path, index) => <path key={index} d={path} fillRule="evenodd" />)}</svg></span>;
  }
  return <span className="category-icon"><svg viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name] || icons['الكل']}</svg></span>;
}
