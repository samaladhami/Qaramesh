# Uploaded-photo cleanup report

Status: read-only reporting implemented. No file deletion or automatic cleanup is enabled.

## Setup

Run `supabase/migrations/003_media_cleanup_report.sql` as postgres in the Supabase SQL Editor after migrations 001 and 002. The rollout copy is `tmp/setup-media-cleanup.sql`. Rerunning it preserves all menu data and files. Deploy the app update, then open **النشر → مراجعة الصور غير المستخدمة → فحص الصور**.

The report requires a confirmed staff account in `private.menu_staff`. Anonymous users and other signed-in accounts cannot call the RPC. Before migration 003 is applied, the report displays a setup message; dish and offer editing continue to work.

## What is always protected

- Every built-in category icon, even if unused. Icons are part of the source code and are never scanned by this report.
- Uploaded category icons identified by their upload metadata, even if unused.
- Uploaded images referenced by the current shared draft, current publication, or **any** retained revision. The report checks all revisions, not only the 20 shown in publish history.
- Older uploads without a recognized dish/offer type. Their origin cannot be established safely, so they remain protected.
- Files uploaded within the last seven days, or with missing creation dates or unexpected filenames.
- Local `/menu/` and `/hero/` files, Git backup files and other Storage buckets. The report scans only `menu-media`.

New uploads record `menuKind` (`dish`, `offer`, or `category`) through the Storage SDK's custom metadata option. Existing files are not relabeled or modified. Restored files without classification remain protected too.

## Report results

Only recognized dish/offer uploads older than seven days with no saved references are listed as potential cleanup candidates. Totals include the whole bucket; the displayed list is limited to the oldest 200 candidates. Size totals use Storage metadata and can undercount if size metadata is missing.

The report is a point-in-time preview. It does not claim files, reserve names, delete data, or change Storage policies. An unsaved editor can still hold a photo that is absent from all saved snapshots; therefore this preview must never be used as a direct deletion list.

Deletion remains a separate follow-up. It must recheck references immediately before deleting and coordinate with draft saves/restores, uploads and active edits so references cannot appear between checking and removing a file. Actual object removal must use the Storage API, not SQL deletion of `storage.objects`. Review the report before designing or enabling that workflow.

## Verification

`npm.cmd run verify:backend` includes PostgreSQL coverage for staff-only access, migration repeatability, read-only behavior, permanently protected icons, legacy uploads, recent files, all saved references, missing ages/unexpected paths, other buckets and capped lists with complete totals. Existing delete/overwrite denial remains in force.

Production migration/application and a real staff report run remain to be confirmed.
