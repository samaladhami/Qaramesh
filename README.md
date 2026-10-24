# Qaramesh — phase one

Arabic RTL customer menu built with Next.js App Router, React, JavaScript and Tailwind CSS. No backend or ordering features.

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
3. `app/`: Arabic metadata, RTL document, responsive cream/teal/gold styling and route loading skeleton.

## Data and assumptions

- All 145 Sheet1 dishes and 20 categories are retained. Sheet3 supplies category order; category whitespace is trimmed.
- Sheet4 has no header. Column A names match all Sheet1 names; column E provides image URLs. No missing, extra or duplicate name matches.
- Prices are multiplied by 1,000: 4.0 becomes 4,000 د.ع.
- Sheet1 governs availability: blank means available, explicit 0 is shown as unavailable. This marks one dish unavailable, without removing it. Sheet4 differs substantially; all differences are listed in `data/import-report.json` for review.
- All image URLs returned image content and were cached in `public/menu/`. See `data/image-report.json` for source URLs, status and sizes. Download success does not establish that every photograph depicts the correct dish; only representative images were visually inspected.
- Next.js serves resized image variants; below-the-fold images load lazily. Failed images show a branded fallback.
- Search ignores Arabic diacritics and common alef variants, and combines with the selected category. Long descriptions expand using native accessible details controls.

`data/menu.json` is the app's local data source. Components contain no menu records. Raw spreadsheet values are retained in `data/workbook-raw.json` for traceability.

To reimport the original workbook, edit the path in `scripts/read-workbook.ps1` if needed, then:

```powershell
Get-Content scripts/read-workbook.ps1 -Raw | Invoke-Expression
node scripts/import-menu.mjs
node scripts/cache-images.mjs
```

Reimport regenerates menu data; caching requires network access. The workbook's display names differ from its internal XML filenames: Sheet1 → sheet1.xml, Sheet3 → sheet2.xml, Sheet4 → sheet3.xml.

Supabase, authentication and administration remain later phases.

## Hero carousel

The hero uses the eight supplied restaurant images in `public/hero/`. `data/hero-slides.json` is the single list of image IDs, URLs, and Arabic descriptions; a future admin feature can supply the same records without changing the carousel presentation.

Images advance every five seconds in a shuffled order, with each image shown once before the next shuffle and no immediate repeat at the cycle boundary. Horizontal swipes move through the shuffled sequence; there is no navigation-dot section. There are no visible carousel buttons; hovering or hiding the browser tab temporarily pauses autoplay. Reduced-motion users start with autoplay paused and no fade animation.

The hero height stays fixed between slides. Foreground images use `object-fit: contain` to preserve all artwork and text; an enlarged, blurred, faded copy fills unused space. Background and foreground fade together. The next image is loaded ahead of time.

Validated against a production build at 320px, 390px, and 1280px: every image, swipe, stable height, overflow, shuffled autoplay, menu categories, and search. The browser check is `tmp/check-hero-carousel.cjs` and uses the existing local Playwright/Edge setup with a production server on port 3001.

## Deployment and milestone workflow

- Vercel deployment was completed through the GitHub integration on October 22, 2026.
- Repository: https://github.com/samaladhami/Qaramesh; production branch: main.
- Push completed milestones to origin/main so Vercel can rebuild and update the live site.
- The production URL has not been recorded; find it in the Vercel project dashboard.
- Current dish card padding: desktop 8px 6px 7px; mobile (max-width: 540px) 0px 6px.

## Mobile menu navigation

On screens up to 540px wide, scrolling past the menu controls reveals a compact 52px logo/search row and a 72px category row. Search expands in place and preserves the query when closed. Category taps show only that category and return to the beginning of its results; the all-categories button restores the full menu. Scrolling the full menu updates the active icon, which stays visible in the RTL navigation. Search still filters the menu, and desktop category filtering is unchanged. The expanded controls keep their space to prevent content jumping when compact mode starts or ends. Category icons use inline SVGs in `components/CategoryIcon.jsx` and `components/category-icon-art.json`.

Validated with a production build and headless Edge checks at 390px and 320px widths: search focus/filter/close, category navigation and tracking, RTL visibility, stable content position, return to the top, reduced motion, and desktop filtering.
