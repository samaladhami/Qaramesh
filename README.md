# Qaramesh restaurant menu

Arabic RTL customer menu built with Next.js App Router, React, JavaScript and Tailwind CSS. Supabase powers staff authentication, shared drafts, publishing history and private image uploads. Ordering and checkout are not implemented.

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

On screens up to 540px wide, scrolling past the menu controls reveals an 88px category row with centered icons above a 55px search row, plus 3px bottom padding on the sticky header. Categories appear above search in both the home controls and sticky header at every screen size. The category strip scrolls edge to edge while its first card aligns with the menu content; the scroll hint animation is preserved. The sticky header has a shallow teal shadow and 12px between the category content and search. Home search has a 12px gap before the menu heading. The sticky controls show a wide search field and the circular call control on the left; there is no logo in the sticky header. The mobile sticky search placeholder reads only through the question mark; the home and tablet search retain the full placeholder. The search X clears the query and keeps the field focused; the phone remains visible while searching. The expanded controls keep their space to prevent content jumping when compact mode starts or ends. A 44px white circular call button with a teal border and teal phone icon appears to the left of home search on every screen size and remains available in the sticky header. Footer logos use the transparent circular badge; stars appear below the main footer logo, but not on the dish-page logo.

Category taps show only that category; the all-categories button restores the full menu. Scrolling the full menu updates the active icon, which stays visible in the RTL navigation. Selected compact icons have a white gap and yellow outline around their teal background. Category spacing is tighter in compact mode, and the category row shares the controls' maximum width. The expanded controls keep their space to prevent content jumping when compact mode starts or ends. Category icons use inline SVGs in `components/CategoryIcon.jsx` and `components/category-icon-art.json`.

The category row gives a small scroll hint once when the home categories first become visible and once when the sticky categories first appear. It moves up to 40px toward the next categories and returns over 800ms after scrolling settles; returning to the top does not replay it. Touch, pointer, wheel, keyboard, or focus interaction cancels the hint; interacting with the category row disables further hints for that visit. Reduced-motion users and non-overflowing rows skip the hint. The animation changes only horizontal scroll position, with no per-frame React updates or new dependencies.

Validated with a production build and headless Edge checks at 390px and 320px widths: search focus/filter/close, category navigation and tracking, RTL visibility, stable content position, return to the top, reduced motion, and desktop filtering.

## Validation and local artifacts

Run `npm.cmd run build` and `npm.cmd run verify:data` for the tracked project checks. A build may need network access to fetch the Tajawal font from Google Fonts. Additional browser checks during Phase 1 covered dish navigation, keyboard access, search return and reload behavior, menu state restoration, mobile swipe dismissal, related dishes, and card wrapping across mobile, tablet, and desktop widths. Real-device Safari and Android browser review remains advisable before broader promotion.

Files under `tmp/` are local check scripts and screenshots, not a committed or portable test suite. Some scripts depend on this computer's Playwright cache and Edge installation. Unused experimental logo variants are also excluded from milestone commits.

## Phase 2 plan

Phase 2 starts with planning the full admin dashboard, followed by secure staff access, menu editing, categories, image uploads, hero management and preview/publish controls. The agreed starting architecture uses Supabase Free for authentication, database and storage, with the published QR menu cached through Vercel to reduce backend traffic. Free operation depends on measured usage and provider limits. See [PHASE-2.md](PHASE-2.md) for implementation steps, migration safeguards and launch checks. Staff authentication and shared draft/publishing integration are implemented. See [SHARED-MENU.md](SHARED-MENU.md) for rollout and current limits. Ordering and checkout remain a separate scope.

## Design handoff before Phase 2 implementation

As of November 2, 2026, the user has approved the dashboard comps as the starting design direction. Minor visual and interaction changes can be made together during implementation. The comps have not yet been implemented; the public menu remains the completed Phase 1 site.

The user supplied the approved eight-screen comp reference in the conversation on November 3, 2026. Refer to that image when refining the dashboard; this written handoff does not replace the reference. Supabase setup and the initial staff account will be needed when connecting the backend, as described in [PHASE-2.md](PHASE-2.md).

Next steps:

1. Review the approved comps alongside the mobile-first Arabic RTL dashboard requirements in `PHASE-2.md`. Preserve the project brand palette and the agreed staff permissions and draft/publish behavior.
2. Build the dashboard interface in manageable milestones, beginning with the shared layout and primary screens. Use clearly identified local sample data until backend integration is ready. Refine small details with the user as work progresses.
3. Check mobile and desktop layouts, RTL behavior, keyboard access, and loading, empty, error and unsaved-edit states as the relevant screens are built.
4. Connect staff authentication, draft editing, media management and publishing according to the Phase 2 plan. Keep the existing public menu available throughout the transition.
5. Run the appropriate checks for each completed milestone, commit only relevant files, and push to `origin/main` for Vercel deployment.

Before writing application code, read the relevant guides in the installed `node_modules/next/dist/docs/` as required by `AGENTS.md`. Local `tmp/` checks, screenshots and unused logo experiments remain outside milestone commits.

## Dashboard interface prototype — November 3, 2026

Open `/admin` to review the first implementation of the approved comps. The mobile-first Arabic RTL interface includes the teal header, draft badge, bottom navigation, dish search and category filters, inline name/price editing, dish forms, availability switches, category icons and ordering, nonempty-category deletion warning, offer images and ordering, change review, and draft preview. Existing menu records and hero images seed the prototype.

The dashboard now requires staff authentication as described below, but editing and publishing remain interface prototypes with no menu database connection. Drafts are saved only in this browser's local storage under `qaramesh-admin-prototype-v1:USER_ID`; they are not shared between staff or devices. Clear that key to reset the prototype. The old anonymous prototype key is retained but no longer loaded. Failed local saves show an error. Image selection accepts PNG, JPG and WebP up to 500 KB per image; production compression, storage and SVG support remain future work.

The publish button explicitly simulates publishing within the current session. It clears the local change review without modifying public data; reloading compares the saved draft with the original menu again. The preview is a simplified draft rendering, not yet the production menu renderer. There is no publish history or rollback yet. The public menu, dish URLs and local JSON sources are unchanged.

Each pending-change row has an X button to undo that row while keeping the other pending changes. Deleted dishes return to their original position; new dishes are removed and edited dishes revert to the current baseline. Category and offer changes are currently reviewed and undone as groups. Undoing categories is blocked if it would remove a new category still containing dishes. Dish filters appear above search.

Validated with a production build and headless Edge at 320, 390, 768 and 1280px: RTL layout without horizontal overflow, inline editing, draft reload persistence, category creation, blocked deletion, offers and preview. Additional flow checks covered full dish saves, new dishes, availability, category ordering and simulated publishing without public menu changes. Local browser scripts and screenshots are in `tmp/`, using the existing machine-specific Playwright setup.

## Staff access

A small footer link, “دخول الموظفين”, opens `/admin/login`. Cookie-based Supabase password authentication, sign-out, server-verified staff access and private/no-store admin responses are implemented. Staff access requires a confirmed user ID in the server-only `SUPABASE_STAFF_USER_IDS` allowlist; there is no registration form. The proxy checks requests and the dashboard page independently verifies access. Future mutations must perform their own authorization and use database row-level security.

Supabase authentication is configured with two staff accounts, and public sign-ups are disabled. Login is disabled in environments without the project URL, publishable key and staff allowlist. Follow [STAFF-SETUP.md](STAFF-SETUP.md) for local/Vercel settings. Password recovery remains administrator-assisted.

The build and local browser checks cover the footer link, responsive login, unconfigured access denial, direct-route redirects and return to the public menu. Real sign-in, sign-out, session refresh and nonstaff-account denial still need verification with the configured Supabase project before staff handover.

## Shared drafts, preview and publishing

The shared-menu integration is implemented behind the server setting `MENU_BACKEND_ENABLED=true`. Supabase contains the initial 145 dishes, 20 categories and 6 hero slides. Staff save a shared versioned draft, review protected preview pages using the actual public components, undo individual review rows, and publish a complete immutable revision. Publication history supports restoring an older revision into a draft before publishing. Public home/dish pages read the cached published snapshot; anonymous access to staff RPC operations is denied. Existing local browser drafts are not automatically imported.

Run `npm.cmd run verify:backend` for database security/concurrency/publishing and image-processing tests, and `npm.cmd run prepare:backend` to generate setup SQL. See [SHARED-MENU.md](SHARED-MENU.md) for rollout, staff acceptance checks, recovery and the snapshot architecture. Cold-request outages use the deployed published-menu backup; its freshness depends on the last successful backup and deployment.

Both staff accounts have passed the live shared-draft/save/undo check. Publication history and restore behavior have been clarified; final live publication/restore acceptance remains part of handover.

To reorder dishes, use the up/down arrows below each dish on the admin dishes screen, including the All view. The adjacent double arrows move a dish directly to the top or bottom of its category after an Arabic confirmation dialog, preserving the order of the other dishes. Cancel leaves the order unchanged. Each dish moves within its own category; selecting a category is optional. Clear search before reordering. Changes save to the shared draft and appear in preview; Publish makes the order public. The change review lists each reordered category and supports undoing its order while preserving dish edits. No database migration is needed.

## Image uploads and storage

Dish photos and offer images support uploads through a private Supabase Storage bucket. Category icons use the standard built-in picker; custom-icon uploads are temporarily disabled. The browser prepares the selected file; the server validates, resizes and compresses it to WebP, strips metadata, and saves a unique immutable object. Draft images remain staff-only until published. Failed uploads preserve the previous image, and old files are retained for revision restoration.

Apply `supabase/migrations/002_menu_media.sql` in Supabase SQL Editor, then deploy this milestone. The rollout copy is `tmp/setup-menu-media.sql`. No new credentials or environment settings are needed. See [IMAGE-STORAGE.md](IMAGE-STORAGE.md) for upload limits, setup, caching/privacy, retention and the live acceptance checklist.

The production build, input-processing tests, and PostgreSQL storage-policy tests are the tracked checks. Migration 002 is applied in Supabase; the user confirmed photo upload, draft preview and publication on the local app. Phone/live-site photo checks remain pending deployment, followed by custom-icon, offer-image and real-device failure/restore checks. Automatic unused-upload cleanup is deferred; all assets are retained to protect drafts and rollback revisions.

## Published-menu backup and recovery

`npm.cmd run backup:menu` captures the published menu and its uploaded photos without staff credentials. The deployed copy supplies menu and photo fallback during a Supabase outage. `npm.cmd run restore:menu` restores a backup into a clean shared draft for staff review without publishing. The latest backup contains revision 17 (145 dishes and 1 uploaded image), captured November 4, 2026.

A weekly GitHub Actions workflow is scheduled for Sunday at 03:23 UTC. The user confirmed the repository-variable setup and a successful manual run on November 4, 2026. See [BACKUPS.md](BACKUPS.md) for setup, recovery instructions and limits. Run `npm.cmd run verify:backup` for integrity and failure-path checks.

- [x] **Configure weekly backups.** Repository variables are added and the manual GitHub Actions run passed. The weekly schedule is enabled; changes since the last deployed backup are not covered.
- [x] **Run an isolated recovery drill.** The actual restore command recovered revision 17 (145 dishes and 1 photo) using local PostgreSQL and a local HTTP fixture, with failure and privacy checks. Run `npm.cmd run verify:recovery`; see [RECOVERY-DRILL.md](RECOVERY-DRILL.md) for the results and hosted-service limits.
- [ ] **TODO: Confirm backup deployment.** Check that a changed backup commit deploys on Vercel. A hosted staging restore and live outage failover have not been exercised by the local drill.

Remaining: scheduled-backup setup and recovery verification, reference-aware image cleanup, usage monitoring, and staff handover. The latest user-reported functional acceptance is recorded below.

- [ ] **TODO: Re-enable custom category-icon uploads.** Fix the upload issues, verify iPhone upload/preview/publish behavior, then restore the **رفع أيقونة مخصصة** section. Keep the standard icon picker as the available option until this is verified.

## Current acceptance and remaining work

November 4, 2026: the user confirmed offer-image replacement works and reported successful testing with no observed defects in the flows tested. The latest upload and offer-ordering milestone passed all 15 backend/image/ordering tests and the production build. Offer images support first/last moves with Arabic confirmation; each up/down arrow pair is stacked vertically and aligned with the change-image button.

The remaining backlog is operational: confirm deployment of changed backups, add safe reference-aware cleanup for unused uploads, monitor Supabase/Vercel storage and traffic usage, and finish staff handover. The isolated local recovery drill passed; hosted staging/outage exercises can extend that verification. Custom category-icon uploads remain an optional deferred feature tracked above.

## Next phases

- **Phase 3: Ordering through WhatsApp.** Customers build a cart, review the total and details, then send the order to the restaurant through WhatsApp. Staff receive and confirm it there. See [PHASE-3.md](PHASE-3.md).
- **Phase 4: Credit-card payments and receiving orders.** Add secure online payment plus a staff incoming-orders dashboard and order-status workflow. See [PHASE-4.md](PHASE-4.md).

Both phases are planned; ordering and card payments are not enabled yet.

## Uploaded-photo cleanup preview

A read-only report is available under admin **النشر → مراجعة الصور غير المستخدمة** after applying `supabase/migrations/003_media_cleanup_report.sql` (rollout copy: `tmp/setup-media-cleanup.sql`). It lists only known dish/offer uploads older than seven days with no saved references. All built-in category icons remain available, and uploaded category icons, legacy/unclassified files, drafts and every retained revision are protected. Nothing is deleted and deletion remains a separate follow-up. See [MEDIA-CLEANUP.md](MEDIA-CLEANUP.md).
