# Published-menu backups and recovery

`npm.cmd run backup:menu` captures the current published Supabase revision and every uploaded photo it references. It uses only the public project URL and publishable key already configured in `.env.local`; staff credentials and service-role keys are not used. Drafts, accounts, passwords and abandoned uploads are excluded.

The manifest is `data/published-menu-backup.json`. Uploaded WebP bytes live in `data/published-media/`, with SHA-256 hashes in the manifest. Existing `/menu/` and `/hero/` photos remain in `public/` and are already versioned. A second publication read checks for changes during download. A failed request or changed revision stops the capture; the previous manifest remains intact. Retry after publishing has settled.

Commit both the manifest and its images, then push and confirm the Vercel deployment succeeds. Until deployed, a local backup does not update the live fallback. Old uploaded backup files are retained, and earlier manifests are recoverable through Git history. GitHub and local clones provide copies independent of Supabase; preserve repository access.

## Scheduled captures

Weekly scheduling is enabled in the workflow: **Sunday at 03:23 UTC**. Manual runs remain available. Successful execution still requires the repository variables below; configuration and the first successful run must be verified.

Weekly captures mean changes made since the last successful backup, potentially close to seven days of updates, may be missing from recovery. Run a manual capture after major menu or photo changes when needed.

- [ ] Add the two repository variables listed below.
- [ ] Run **Back up published menu** manually from GitHub Actions and confirm it succeeds.
- [ ] Confirm the backup commit deploys successfully on Vercel.
- [x] Configure a weekly Sunday schedule (`23 3 * * 0`, UTC).

In GitHub → repository Settings → Secrets and variables → Actions → **Variables**, add these repository variables using the same values as Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

These are public connection settings. Do not supply a service-role key. The workflow has scoped `contents: write` permission and commits only the backup manifest and image directory when they change. It never force-pushes; a simultaneous developer push can cause the backup push to fail safely. Run it again in that case. Branch protection or organization restrictions may also require configuration before the workflow can push.

After setting the variables, manually run the workflow once, check its green result and backup commit, and confirm Vercel deploys that commit. Check failed-run notifications regularly. GitHub schedules can be delayed, and inactive public repositories can have schedules disabled: this is periodic recovery, not an immediate backup after every Publish. The recovery point is the last **successfully captured, committed and deployed** revision. Run a manual backup after an important publication when waiting for the schedule is unacceptable.

The first capture on November 3, 2026 contains published revision 6, 145 dishes and no uploaded `/media/` images. Later captures automatically include uploaded photos when the published revision references them.

Latest capture (November 4, 2026): published revision 17, 145 dishes and 1 uploaded image.

## Serving during a Supabase outage

The app still prefers the live published snapshot. If that request fails, it serves the validated deployed backup, including its original revision and publication date. Without a valid backup, it uses the original bundled menu. Backend-disabled local demo mode continues using the original menu.

The `/media/` route can serve hash-verified backup bytes when Storage is unavailable. Only filenames referenced by the deployed published backup are eligible; arbitrary files and unpublished drafts are never exposed by this fallback. Files are explicitly included in Next.js server tracing for deployment. Previously published photos can remain publicly cached after removal, as with the existing immutable image delivery.

## Restore after Supabase recovers

Usually no restore is needed: live reads resume when Supabase recovers. If data or images were lost:

1. For a replacement project, apply the shared-menu and media migrations, initialize the menu, recreate confirmed staff accounts, and configure their access as described in `STAFF-SETUP.md`. Set local/Vercel connection settings for that project. This backup does not restore auth accounts or database infrastructure.
2. Resolve any unpublished shared draft first. Recovery refuses to replace a draft that differs from its published baseline.
3. In a local PowerShell terminal, set a staff recovery email and enter its password without adding it to source control:

   ```powershell
   $env:MENU_RECOVERY_EMAIL = Read-Host 'Staff email'
   $recoveryPassword = Read-Host 'Staff password' -AsSecureString
   $env:MENU_RECOVERY_PASSWORD = [System.Net.NetworkCredential]::new('', $recoveryPassword).Password
   try { npm.cmd run restore:menu } finally {
     Remove-Item Env:MENU_RECOVERY_EMAIL, Env:MENU_RECOVERY_PASSWORD
     Remove-Variable recoveryPassword
   }
   ```

4. The command checks local photo hashes, signs in as staff, uploads missing immutable photos without overwriting existing objects, and saves the backup as a shared draft using the current version check. Conflicting existing image bytes stop recovery. Partial upload failures may leave retained files but never publish or change the draft. A concurrent draft save prevents the final recovery save.
5. Open `/admin/preview`, review the restored dishes/categories/offers/photos, then use the normal Publish button. Capture a fresh backup afterward.

To recover an older backed-up revision, use a separate checkout of its backup commit, retaining the matching manifest and image files together. Do not reset the active project to an old commit or remove newer staff work.

## Checks and limits

`npm.cmd run verify:backup` checks publication races, incomplete downloads, invalid payloads, image deduplication/hashes and the integrity of the checked-in backup. Run it with the production build before deploying changes to recovery.

This is a published-content backup, not a full Supabase database backup or a backup of every publication. Drafts and revisions published between weekly captures can be absent. Repository size grows as photos change; cleanup and usage monitoring remain separate work. Scheduled GitHub execution, deployment acceptance and a staff recovery drill still need operational verification after configuration.

GitHub references: [scheduled workflow behavior](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) and [workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).
