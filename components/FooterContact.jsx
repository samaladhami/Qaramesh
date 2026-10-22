export default function FooterContact() {
  return <div className="footer-contact" aria-label="معلومات المطعم">
    <span className="footer-hours">
      <span className="open-status-dot" aria-hidden="true" />
      مفتوح 24 ساعة
    </span>
    <address><svg className="address-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><span>الأعظمية — شارع قاسم أبو الكَص</span></address>
    <div className="footer-phone-links" aria-label="هاتف المطعم">
      <a href="tel:07722883899" dir="ltr">07722883899</a>
      <span aria-hidden="true">·</span>
      <a href="tel:07712319666" dir="ltr">07712319666</a>
    </div>
  </div>;
}
