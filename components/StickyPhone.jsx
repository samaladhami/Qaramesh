export default function StickyPhone({ panelId = 'sticky-phone-numbers' }) {
  return <div className="sticky-phone">
    <button className="sticky-phone-toggle" type="button" popoverTarget={panelId} aria-label="الاتصال بالمطعم">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m8 3 3 5-3 3a16 16 0 0 0 5 5l3-3 5 3c0 3-2 5-5 5C9 21 3 15 3 8c0-3 2-5 5-5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    <div id={panelId} className="sticky-phone-panel" popover="auto" aria-label="أرقام هاتف المطعم">
      <p>اتصل بالمطعم</p>
      <a href="tel:07722883899" dir="ltr">07722883899</a>
      <a href="tel:07712319666" dir="ltr">07712319666</a>
    </div>
  </div>;
}
