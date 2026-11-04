# Phase 2: menu administration

Status: staff login and shared drafts are configured, and the two-account draft/save/undo check passed. Protected preview, atomic publishing and restore-as-draft are implemented behind `MENU_BACKEND_ENABLED=true`; the initial menu is imported. Image uploads/compression and private Storage policies are implemented in migration 002; see `IMAGE-STORAGE.md` for rollout and live acceptance. Published-menu/photo backups and deployed outage fallback are implemented; see `BACKUPS.md` for required hourly-workflow configuration and the recovery-point limits. Reference-aware asset cleanup and operational monitoring remain future work. Live publishing/restore, scheduled-backup/recovery and image acceptance checks remain before handover.

## Dashboard requirements agreed with the user

- Design primarily for phones. The dashboard is used by the owner and a few other authorized staff members.
- Every authorized staff member can add, edit, delete and publish. There is no owner-only publishing or deletion role in this scope. Staff account provisioning remains invitation-only.
- Staff can add, edit and delete dishes and categories, and move dishes between categories.
- A category can be deleted only when it contains no dishes. Enforce this in server/database operations as well as the interface, including concurrent dish moves or additions. If deletion is blocked, display: “يرجى نقل أو حذف جميع الأطباق في هذا القسم قبل حذفه.”
- Category icons can be selected from the existing icon library, future additions to that library, or a custom uploaded icon. Validate custom icon uploads and provide a preview.
- All changes, including availability, additions, deletions and category moves, remain drafts until Publish. Deleting or moving draft content must not alter the currently published revision.
- Mobile editing uses the full dish editor: tapping the name, price, photo or edit icon opens it. Inline name/price editing was removed. Availability toggles remain in the dish list, alongside within-category ordering controls.
- Category and banner ordering is in scope. The exact phone interaction (move controls or drag handles) remains to be selected during interface review.

## Delivery architecture details

- Supabase supplies staff authentication, PostgreSQL data and uploaded image storage. Customers browse without accounts.
- Vercel continues hosting the Next.js site. Public requests use a cached published menu snapshot rather than querying Supabase for every visitor. Drafts are available only to authorized staff.
- Publishing creates an immutable revision, then switches the published revision and invalidates the relevant Vercel caches. Failed publishing must preserve the last working public revision and offer a retry.
- Dish pages and the home menu must use the same revision. Preserve dish URLs and use the existing site URL for printed table QR codes.
- Use Next.js image optimization and Vercel image caching for remote images, lazy loading and long-lived caching for versioned image URLs. Image cache misses still consume Supabase egress; Vercel has its own usage limits. This approach reduces traffic, but does not guarantee free operation.
- Keep data access and storage operations in dedicated modules, use ordinary PostgreSQL tables, and retain exportable data and image backups. Images can move to S3 later independently of authentication and the database.

## Capacity assumptions

Measured at planning time: 145 dish images total 60,887,813 bytes (about 60.9 MB), and six hero images total 2,859,463 bytes (about 2.9 MB). Storage is comfortably below 1 GB; monthly traffic needs measurement after launch.

At planning time, Supabase Free includes 1 GB file storage and separate monthly allowances of 5 GB cached and 5 GB uncached egress. These are independent limits, not a pooled 10 GB allowance. Free projects may pause after inactivity, and image transformations are not included. Recheck provider terms before launch: [pricing](https://supabase.com/pricing), [egress](https://supabase.com/docs/guides/storage/serving/bandwidth).

Compress uploads in our workflow, targeting 100–200 KB per dish where visual quality permits. Supabase, Vercel and browser caching affect actual traffic, so visitor-count estimates are planning illustrations rather than capacity guarantees.

## Implementation sequence and completion checks

1. **Dashboard specification:** define Arabic RTL screens for overview, dishes, categories, hero slides, preview/publish and account access. Specify empty, loading, error, unsaved-edit and mobile states. Agree staff permissions, deletion behavior and how quickly published changes should appear before building.
2. **Backend setup:** create the Supabase project, configure local and Vercel environment variables, and designate the initial staff account. Add versioned database migrations for staff authorization, categories, dishes, hero slides and draft/published revisions. Enforce row-level security; prove public and unauthorized users cannot edit or read drafts.
3. **Data import:** build a repeatable import of the current menu and slides. Verify all 145 dish IDs, 20 categories, prices, Arabic text and image references. Keep public reads on the existing files until migration verification passes.
4. **Staff access and editing:** implement login/logout, protected server operations, dish forms, availability controls, category ordering and hero management. Validate inputs and preserve form data on save errors. Verify both allowed and denied access paths.
5. **Images:** validate uploads, resize/compress them and use unique versioned paths. Upload first, save the new reference successfully, and defer cleanup until the old file is no longer referenced by drafts, published revisions or retained rollback revisions. Retry failed cleanup without breaking dishes.
6. **Preview and publishing:** provide authenticated draft preview and a confirmation showing pending changes. Publish a complete revision with an auditable actor/time, protect against conflicting publishes, and support rollback to a retained revision. Verify failed publishes leave the live menu usable.
7. **Public delivery:** replace local JSON reads with shared cached published data, configure the Supabase image host, and invalidate affected menu/dish caches after publishing. Choose cache APIs only after reading the installed Next.js documentation. Verify a published update appears on home and dish pages, and repeated visits reuse caches. A warm cached page alone is insufficient evidence of outage resilience; test cold requests and retain a defined last-known-good fallback.
8. **Launch and monitoring:** test real table QR codes on mobile, Arabic layout, image quality, search and existing links. Track Supabase storage, cached/uncached egress and Vercel usage, with an initial review at 50% and an action review at 80% of each allowance. Document backups, recovery and staff handover. Decide on paid service or separate image hosting from measured usage and reliability needs.

## Milestone grouping

1. Staff access and dish editing: configure Supabase authentication, restrict access to explicitly authorized staff, import existing categories and dishes, and allow editing names, descriptions, prices and availability.
2. Publishing: keep edits in a draft, preview changes, and publish a consistent menu revision. Public pages read only published content; preserve existing dish IDs and URLs.
3. Media and organization: category ordering, image uploads with compression, and hero slide management.

Ordering, payments and checkout require a separate scope.

## Existing data to preserve

- `data/menu.json`: 20 ordered categories and 145 dishes. Preserve IDs, Arabic text, integer IQD prices, descriptions, size, image paths, availability and add-on fields.
- `data/hero-slides.json`: six ordered slide records with IDs, sources and alternative text.
- Existing local images remain usable during migration.

## Implementation requirements

- Enforce authorization on the server and database; hiding admin controls is insufficient.
- Staff accounts are invitation-only. Store backend secrets only in server environment variables.
- Validate edits, reject invalid prices and categories, and report save failures without discarding the form.
- Prepare a repeatable import and verify record counts and IDs before switching public reads.
- Keep the existing public menu available until the backend and publishing path are verified.
- Verify unauthorized access is rejected and unpublished changes cannot appear on public pages.

## Setup needed before connecting a backend

Create the Supabase project, configure local/Vercel environment variables through secure settings, and designate the initial staff account after the dashboard specification is agreed. Do not commit credentials. Planning does not require credentials.
