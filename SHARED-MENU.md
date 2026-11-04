# Shared drafts and publishing

## Setup and rollout

1. Configure staff login using `STAFF-SETUP.md`.
2. Run `npm.cmd run prepare:backend`. This generates `tmp/setup-shared-menu.sql` from the tracked migration, current JSON files, and the local staff UID allowlist. It includes no API keys or passwords. The generator checks the initial 145 dishes, 20 categories and 6 slides.
3. Run that complete SQL file as the project administrator in Supabase SQL Editor. It can be rerun without resetting menu data. It creates the initial published revision and shared draft only if no state exists. Running it again adds the listed staff but does not remove existing memberships.
4. Set `MENU_BACKEND_ENABLED=true` in `.env.local`, restart development, and verify both staff accounts. Add the same server-only setting to Vercel Production and redeploy when ready. Without this flag the existing public JSON menu and browser-only prototype remain active.
5. Before staff handover, use two separate signed-in browsers: save a small draft edit in one; refresh the other; confirm the public menu is unchanged. Review the authenticated preview, undo the test edit, and verify change review is clear. Use an agreed real update to test publishing, public home/dish consistency, and restoring an older revision as a draft.

The November 3 migration imported the production source menu. Old browser prototype drafts are deliberately not imported into the shared database. The public site changes only after a staff member explicitly confirms Publish.

## Data and access

The `private` schema contains staff memberships, a single shared menu draft, and immutable published revisions. Each revision is one exportable JSON snapshot with stable dish/category/slide IDs; this keeps publication atomic across the whole menu. The draft has a version number. A stale save, publish, or restore fails instead of overwriting a newer staff member's work. This initial model stores menu records in snapshots rather than separate editable dish/category tables.

RLS is enabled, and browser roles receive no table or private-schema access. Explicitly granted RPC functions perform database staff checks with a fixed empty search path. Only `menu_public_read` is callable anonymously; it returns the current published snapshot, never the draft or publication history. Staff mutations also verify the server's configured allowlist before calling the database. Database constraints validate prices, IDs, unique categories and category references. A category cannot disappear while a dish still refers to it, and concurrent operations require the current version.

To add staff, provision a confirmed Auth account, add its UUID to `SUPABASE_STAFF_USER_IDS`, and add the same UUID to `private.menu_staff` through the project administrator. To revoke access, remove the UUID from both places. Do not expose staff-table management to ordinary clients. All authorized staff have the same edit/publish/restore access.

## Editing and recovery

In shared mode each completed edit saves to Supabase, with a saving status and controls disabled while the save is in progress. Idle pages check for newer team changes every 20 seconds; the refresh button reads immediately. Forms with unsaved edits are not overwritten by background reads. On errors, the displayed draft is preserved, retry is offered, and local recovery JSON can be downloaded before loading the latest shared version. Conflicting edits require reviewing the latest draft; there is no automatic merge.

The publish view compares shared drafts with the published revision. Each X undoes that displayed row and saves the resulting draft. Category and slide changes are still grouped. `/admin/preview` and its dish routes render saved draft data using the actual menu components, require staff access, and are not cached publicly. Unsaved form values do not appear in preview. Publication history lists the latest 20 revisions; restoration replaces the shared draft for review and does not publish until separately confirmed.

## Public delivery and limitations

Home, dish metadata, dish pages, categories and hero slides all read the same cached published snapshot. New dish URLs can render on demand; existing URLs retain their IDs. Publishing stores a complete immutable revision and atomically switches the public pointer in one database transaction. Failures before commit leave the public pointer unchanged. If the database commits but the connection fails before acknowledging it, refresh shared state to check the result before retrying.

Public fetches have a shared Next.js cache with a 60-second refresh interval. Successful app publishing invalidates its tag and the root layout; updates appear on subsequent public requests. A cache invalidation failure is reported separately from a successful database commit. Active browser pages may need refresh. Next.js's fetch cache is used directly; the deprecated `unstable_cache` API was not introduced.

If a cold request cannot fetch or validate published data, the app serves the deployed published-menu backup, including backed-up uploaded photos. Its recovery point is the last successful capture, commit and deployment, which can precede the latest publication. See [BACKUPS.md](BACKUPS.md) for the weekly GitHub workflow, required configuration, and restore-as-draft procedure. If no valid backup exists, the original menu remains the final fallback. Setting `MENU_BACKEND_ENABLED=false` deliberately uses the original local demo menu; it does not select the latest backup.

Image uploads/compression are implemented through migration 002. Shared mode accepts existing `/menu/` and `/hero/` paths plus registered immutable `/media/UUID.webp` assets. Base64 images and arbitrary remote URLs cannot be saved. See [IMAGE-STORAGE.md](IMAGE-STORAGE.md) for private draft access, public caching, upload limits and retention. Local photos stay in Git; uploaded photos stay in the private Storage bucket, with policy-based public reads after publishing. Deleting a record does not delete its image asset.

## Checks

`npm.cmd run verify:backend` runs portable PostgreSQL tests through PGlite, covering anonymous/nonstaff denial, import integrity, private drafts, both staff accounts, stale saves/publishes, invalid categories/images, atomic publishing, retained revisions, restore-as-draft and membership revocation. It also checks application input validation. Run `npm.cmd run build` and `npm.cmd run verify:data` for application/data checks. These tests use local test identities; live login, cross-device saving, publication and session behavior still need acceptance checks against Supabase/Vercel with staff accounts.

Acceptance update (November 3, 2026): the user confirmed that the live two-account workflow passed: shared-mode banner, saved draft price visible to the second staff account after refresh, unchanged public price before publishing, and per-change undo reflected across accounts. Live publication/restore and image-storage acceptance remain separate checks.
