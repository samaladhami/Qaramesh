function CircularDecoration({ className, right = false }) {
  return (
    <svg
      className={`pointer-events-none absolute ${className}`}
      viewBox="0 0 300 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {right ? <>
        <circle cx="292" cy="172" r="174" stroke="currentColor" strokeWidth="1.2" opacity=".3" />
        <circle cx="292" cy="172" r="129" stroke="currentColor" strokeWidth="30" opacity=".045" />
        <circle cx="292" cy="172" r="114" stroke="currentColor" opacity=".13" />
        <circle cx="268" cy="355" r="163" fill="currentColor" fillOpacity=".025" stroke="currentColor" strokeWidth="1.3" strokeOpacity=".8" />
        <circle cx="268" cy="355" r="126" stroke="currentColor" strokeWidth="26" opacity=".035" />
        <path d="M105 145a190 190 0 0 0-5 167" stroke="currentColor" strokeDasharray="2 6" strokeLinecap="round" opacity=".45" />
        <circle cx="105" cy="145" r="5" fill="currentColor" opacity=".5" />
      </> : <>
        <circle cx="-5" cy="233" r="166" fill="currentColor" fillOpacity=".045" stroke="currentColor" strokeWidth="1.2" strokeOpacity=".65" />
        <circle cx="-5" cy="233" r="207" stroke="currentColor" strokeWidth="1" strokeDasharray="2 6" strokeLinecap="round" opacity=".4" />
        <path d="M-61 55a189 189 0 0 1 242 48" stroke="currentColor" strokeWidth="1.1" opacity=".25" />
        <circle cx="-20" cy="323" r="111" fill="currentColor" opacity=".07" />
        <circle cx="-20" cy="323" r="128" stroke="currentColor" strokeWidth="28" opacity=".045" />
        <circle cx="-20" cy="323" r="148" stroke="currentColor" strokeDasharray="1 5" strokeLinecap="round" opacity=".45" />
        <circle cx="180" cy="126" r="7" fill="currentColor" opacity=".5" />
        <circle cx="174" cy="348" r="10" fill="currentColor" opacity=".25" />
      </>}
    </svg>
  );
}

function GoldDivider() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] items-center gap-5 px-5 text-[#c39b53] sm:gap-10" aria-hidden="true">
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
    <header className="relative isolate overflow-hidden text-[#073e3c]">
      <CircularDecoration className="-left-24 top-10 w-[260px] text-[#c39b53] sm:-left-8 sm:top-14 sm:w-[350px] lg:w-[400px]" />
      <CircularDecoration right className="-right-24 top-8 w-[260px] text-[#c39b53] sm:-right-8 sm:top-3 sm:w-[350px] lg:w-[400px]" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-5 sm:px-12 lg:px-20">
        <div dir="ltr" className="flex items-center justify-between gap-4 border-b border-[#c39b53]/45 py-3 text-[#92723c] sm:py-4">
          <span lang="en" className="text-[9px] tracking-[.16em] sm:text-xs sm:tracking-[.22em]">QARAMESH RESTAURANT</span>
          <span dir="rtl" className="shrink-0 text-xs sm:text-sm">نكهة تجمعنا</span>
        </div>

        <div className="flex flex-col items-center pb-5 pt-6 text-center sm:pb-7 sm:pt-8">
          <h1 className="sr-only">مطعم قراميش</h1>
          {/* The existing transparent lockup includes the emblem, Arabic name,
              FAST FOOD and RESTAURANT, so no duplicate lettering is needed. */}
          <img
            src="/logo-transparent.png"
            alt="قراميش — FAST FOOD RESTAURANT"
            width="2172"
            height="724"
            fetchPriority="high"
            className="block h-auto w-full max-w-[360px] sm:max-w-[620px] lg:max-w-[680px]"
          />
          <p className="mb-4 mt-4 text-base font-medium text-[#b28c42] sm:mb-6 sm:mt-5 sm:text-2xl">أهلاً بكم على سفرتنا</p>
          <GoldDivider />
        </div>
      </div>
    </header>
  );
}
