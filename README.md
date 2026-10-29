# Qaramesh — Phase 1 complete

Arabic RTL customer menu built with Next.js App Router, React, JavaScript and Tailwind CSS. No backend or ordering features.

Phase 1 was officially completed and accepted on October 29, 2026. It includes the customer menu, category filtering, Arabic search, promotional carousel, individual dish pages, related dishes, phone links, and responsive mobile navigation. Content currently comes from local JSON files; a cart, checkout, and the proposed “اطلب الآن” action have not been implemented.

## Run locally

Node.js 20.9+ is required (verified here with Node 24).

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. On this computer use `npm.cmd` because PowerShell blocks the `npm.ps1` wrapper.

```powershell
npm.cmd run build
npm.cmd start
npm.cmd run verify:data
```

## Reviewable pieces

1. `data/` and `scripts/`: workbook extraction, name matching, price conversion, discrepancy reports, image validation/cache.
2. `components/`: reusable menu navigation, search, dish cards and resilient images.
3. `app/`: Arabic metadata, RTL document, responsive menu and dish routes, brand styling, and route loading skeleton.

Brand colors are defined in `app/globals.css`: red `#DB4D49`, teal `#429198`, yellow `#F7D54F`, and white `#FFFFFF`.

## Data and assumptions

- All 145 Sheet1 dishes and 20 categories are retained. Sheet3 supplies category order; category whitespace is trimmed.
- Sheet4 has no header. Column A names match all Sheet1 names; column E provides image URLs. No missing, extra or duplicate name matches.
- Prices are multiplied by 1,000: 4.0 becomes 4,000 د.ع.
- Sheet1 governs availability: blank means available, explicit 0 is shown as unavailable. This marks one dish unavailable, without removing it. Sheet4 differs substantially; all differences are listed in `data/import-report.json` for review.
- All image URLs returned image content and were cached in `public/menu/`. See `data/image-report.json` for source URLs, status and sizes. Download success does not establish that every photograph depicts the correct dish; only representative images were visually inspected.
- Next.js serves resized image variants; below-the-fold images load lazily. Failed images show a branded fallback.
- Search ignores Arabic diacritics and common alef variants. Entering a nonempty search resets the category to all dishes; category selection clears the search. Full descriptions expand on dish pages using native accessible details controls.

`data/menu.json` is the app's local data source. Components contain no menu records. Raw spreadsheet values are retained in `data/workbook-raw.json` for traceability.

To reimport the original workbook, edit the path in `scripts/read-workbook.ps1` if needed, then:

```powershell
Get-Content scripts/read-workbook.ps1 -Raw | Invoke-Expression
node scripts/import-menu.mjs
node scripts/cache-images.mjs
```

Reimport regenerates menu data; caching requires network access. The workbook's display names differ from its internal XML filenames: Sheet1 → sheet1.xml, Sheet3 → sheet2.xml, Sheet4 → sheet3.xml.

Supabase, authentication and administration remain proposed Phase 2 work; they are not configured in Phase 1.

## Dish pages

Available menu cards link to `/dish/dish-1` and the corresponding URL for each dish. A circular plus overlays available dish photos. Unavailable menu cards are faded and have no link. Cards retain their short descriptions; full descriptions appear on the dish page.

Dish pages have a grey strip above a rounded food photo, with white circular close and search controls over the photo. There is no separate top header or logo. The close control returns to the menu; a downward swipe of at least 100px at the top of a mobile dish page performs the same action. Normal page scrolling and horizontal carousel gestures remain available.

An overlapping white panel contains one yellow-bordered information section: dish name with heading rays, category pill, price, short description, size, and availability where applicable. “وصف الطبق” expands the full description inside that section. Below it, “قد يهمك أيضاً” shows a horizontally scrollable RTL list of other dishes from the same category, excluding the current dish. Available suggestions link to their dish pages; unavailable suggestions are faded and unclickable, without an unavailable label. A small circular badge logo finishes the page.

Opening a card saves the menu category, search query, and scroll position for return navigation in the same tab. Direct dish links fall back to the main menu through the close control. The photo search control returns to the menu and focuses search. The `?search=1` flag is consumed after focusing so reloads do not repeatedly reopen search. All 145 dish URLs are generated during the production build; unknown dish IDs show the not-found page.

## Hero carousel

The hero uses the six selected restaurant images in `public/hero/`. `data/hero-slides.json` is the single list of image IDs, URLs, and Arabic descriptions; a future admin feature can supply the same records without changing the carousel presentation.

Images advance every five seconds in a shuffled order, with each image shown once before the next shuffle and no immediate repeat at the cycle boundary. Horizontal swipes move through the shuffled sequence; there is no navigation-dot section. There are no visible carousel buttons; hovering or hiding the browser tab temporarily pauses autoplay. Reduced-motion users start with autoplay paused and no fade animation.

The hero height stays fixed between slides. Foreground images use `object-fit: contain` and top alignment at every breakpoint, including tablets, to preserve all artwork and text without extra space above the fitted image. An enlarged, blurred, faded copy fills unused space. Background and foreground fade together. The next image is loaded ahead of time. Images with different aspect ratios can leave unused space below or beside the foreground; whitespace inside an uploaded image remains part of that image.

Validated against a production build at 320px, 390px, and 1280px: every image, swipe, stable height, overflow, shuffled autoplay, menu categories, and search. The browser check is `tmp/check-hero-carousel.cjs` and uses the existing local Playwright/Edge setup with a production server on port 3001.

## Deployment and milestone workflow

- Vercel deployment was completed through the GitHub integration on October 22, 2026.
- Repository: https://github.com/samaladhami/Qaramesh; production branch: main.
- Push completed milestones to origin/main so Vercel can rebuild and update the live site.
- The production URL has not been recorded; find it in the Vercel project dashboard.
- Mobile dish cards use square photos on the right at 41% of the available width, with `object-fit: cover` and a 12px gap before the text. Desktop and tablet cards retain their stacked layout.

## Mobile menu navigation

On screens up to 540px wide, scrolling past the menu controls reveals a compact 71px controls row with 11px top padding and a 72px category row, plus 3px bottom padding on the sticky header. The controls follow the tablet layout: teal wordmark with its red underline on the right, an always-visible search field in the middle, and the green phone control on the left. The mobile sticky search placeholder reads only through the question mark; the home and tablet search retain the full placeholder. The logo focuses search. The search X clears the query and keeps the field focused; the logo and phone remain visible while searching. The expanded controls keep their space to prevent content jumping when compact mode starts or ends. The phone control also appears beside desktop/tablet search. Footer logos use the transparent circular badge; stars appear below the main footer logo, but not on the dish-page logo.

Category taps show only that category; the all-categories button restores the full menu. Scrolling the full menu updates the active icon, which stays visible in the RTL navigation. Selected compact icons have a white gap and yellow outline around their teal background. Category spacing is tighter in compact mode, and the category row shares the controls' maximum width. The expanded controls keep their space to prevent content jumping when compact mode starts or ends. Category icons use inline SVGs in `components/CategoryIcon.jsx` and `components/category-icon-art.json`.

The category row gives a small scroll hint once when the home categories first become visible and once when the sticky categories first appear. It moves up to 40px toward the next categories and returns over 800ms after scrolling settles; returning to the top does not replay it. Touch, pointer, wheel, keyboard, or focus interaction cancels the hint; interacting with the category row disables further hints for that visit. Reduced-motion users and non-overflowing rows skip the hint. The animation changes only horizontal scroll position, with no per-frame React updates or new dependencies.

Validated with a production build and headless Edge checks at 390px and 320px widths: search focus/filter/close, category navigation and tracking, RTL visibility, stable content position, return to the top, reduced motion, and desktop filtering.

## Validation and local artifacts

Run `npm.cmd run build` and `npm.cmd run verify:data` for the tracked project checks. A build may need network access to fetch the Tajawal font from Google Fonts. Additional browser checks during Phase 1 covered dish navigation, keyboard access, search return and reload behavior, menu state restoration, mobile swipe dismissal, related dishes, and card wrapping across mobile, tablet, and desktop widths. Real-device Safari and Android browser review remains advisable before broader promotion.

Files under `tmp/` are local check scripts and screenshots, not a committed or portable test suite. Some scripts depend on this computer's Playwright cache and Edge installation. Unused experimental logo variants are also excluded from milestone commits.

## Proposed Phase 2

The recommended next milestone is secure menu administration: staff login, dish and price editing, availability toggles, category ordering, image uploads with compression, hero management, and preview/publish controls. Supabase is a proposed foundation for authentication, database, and storage, subject to planning. Ordering should be scoped separately after deciding between phone, WhatsApp, or a full cart/checkout workflow. No Phase 2 implementation has started.
