# Isolated recovery drill

Completed locally on November 4, 2026 using the checked-in backup of **published revision 17: 145 dishes and 1 uploaded photo**.

Run again with:

```powershell
npm.cmd run verify:backup
npm.cmd run verify:recovery
```

## Environment

The drill creates a fresh in-memory PostgreSQL database with PGlite and applies the project's actual shared-menu and media migrations. A local HTTP fixture implements the Auth, Storage and RPC endpoints used by the Supabase SDK. The actual `scripts/restore-menu-backup.mjs --restore-draft` command runs in a child process with its connection URL explicitly set to that local fixture and a disposable test identity.

No production database, draft, uploaded file, staff account or credential is modified. Local test services and database resources close at the end of the drill.

## Results

- The restore command recreated the missing photo and saved the full backup into the shared draft.
- Restored content matched the complete backup, including dish/category/offer ordering and prices.
- Photo bytes matched the recorded SHA-256 hash and decoded successfully as WebP.
- The published revision stayed unchanged during recovery. Anonymous Storage access could not see the draft-only photo.
- A simulated Storage upload failure stopped recovery before changing the draft or published revision.
- A second recovery attempt refused to replace unpublished draft changes.
- Repeating recovery into a clean draft reused identical immutable files without uploading them again.
- A conflicting/corrupt existing image stopped recovery without overwriting it or changing the draft.
- An explicit publish in the isolated database made the recovered snapshot and photo publicly readable. The restore command itself never called Publish.

The regression is `tests/menu-recovery.test.mjs` and uses the current checked-in backup, so future runs exercise the latest captured menu and uploaded photos.

## Limits

This verifies the real restore command, image data and PostgreSQL rules against a **local protocol fixture**. It does not test hosted Supabase Auth/Storage internals, provisioning a replacement cloud project, real staff credentials, or Vercel's behavior during a live provider outage. A hosted staging-project exercise can supplement this drill. Weekly GitHub execution was separately confirmed by the user; deployment of a newly changed backup should still be checked in Vercel.
