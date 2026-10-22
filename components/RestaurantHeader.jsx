function CircularDecoration({ className, right = false }) {
  return (
    <svg
      className={`culinary-art pointer-events-none absolute ${className}`}
      viewBox="0 0 300 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {right ? <>
        <path d="M80 280 240 105 277 324Z M240 105Q264 195 277 324 M225 123Q247 208 258 313" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="204" cy="214" r="13" stroke="currentColor" strokeWidth="2" />
        <circle cx="235" cy="275" r="11" stroke="currentColor" strokeWidth="2" />
        <path d="m164 251 12 5m47-96 7 10m-37 110 10 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </> : <>
        <path d="M30 285h197M48 275a80 80 0 0 1 160 0M119 191v-10h18v10M85 157c-25-26 25-36 0-65m45 63c-25-26 25-36 0-65m45 67c-25-26 25-36 0-65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>}
    </svg>
  );
}

function GoldDivider() {
  return (
    <div className="header-divider mx-auto flex w-full max-w-[760px] items-center gap-5 px-5 text-[#c39b53] sm:gap-10" aria-hidden="true">
      <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-[#c39b53]" />
      <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" className="h-6 w-5 shrink-0 sm:h-9 sm:w-8">
        <path d="M10 0c1.3 7.3 3.4 9.4 10 12-6.6 2.6-8.7 4.7-10 12C8.7 16.7 6.6 14.6 0 12 6.6 9.4 8.7 7.3 10 0Z" />
      </svg>
      <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-[#c39b53]" />
    </div>
  );
}

export default function RestaurantHeader() {
  return (
    <header className="restaurant-header relative isolate overflow-hidden">
      <CircularDecoration className="-left-24 top-10 w-[260px] text-[#c39b53] sm:-left-8 sm:top-14 sm:w-[350px] lg:w-[400px]" />
      <CircularDecoration right className="-right-24 top-8 w-[260px] text-[#c39b53] sm:-right-8 sm:top-3 sm:w-[350px] lg:w-[400px]" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-12 lg:px-20">
        <div dir="ltr" className="header-meta flex items-center justify-between gap-4 border-b py-3 sm:py-4">
          <span lang="en" className="text-[9px] tracking-[.16em] sm:text-xs sm:tracking-[.22em]">QARAMESH RESTAURANT</span>
          <span dir="rtl" className="shrink-0 text-xs sm:text-sm">نكهة تجمعنا</span>
        </div>

        <div className="header-lockup flex flex-col items-center text-center">
          <h1 className="sr-only">مطعم قراميش</h1>
          {/* The existing transparent lockup includes the emblem, Arabic name,
              FAST FOOD and RESTAURANT, so no duplicate lettering is needed. */}
          <img
            src="/logo-hollow-text.png"
            alt="قراميش — FAST FOOD RESTAURANT"
            width="2172"
            height="724"
            fetchPriority="high"
            className="header-logo block h-auto w-full"
          />
          <p className="header-welcome text-base font-medium sm:text-xl">أهلاً بكم على سفرتنا</p>
          <GoldDivider />
        </div>
      </div>
    </header>
  );
}
