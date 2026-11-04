# Menu image uploads

Image uploads are implemented for dish photos, custom category icons, and adding/replacing offer slides. They use the existing staff login and `MENU_BACKEND_ENABLED=true`; no service-role key, secret key, or additional environment variable is required.

## Supabase setup

Run `supabase/migrations/002_menu_media.sql` in Supabase SQL Editor as the project administrator, after the shared-menu migration. A copy is prepared at `tmp/setup-menu-media.sql` for this rollout. Click **Run**, not just Save. Rerunning it preserves existing menu data, objects and revisions. It adds a private `menu-media` bucket and scoped policies; it does not make the bucket public.

Refresh the dashboard after the migration is run and deployment finishes. Upload controls remain disabled until the server can verify the new Storage staff-access function, so deployment before migration does not activate broken upload controls.

For a new installation, `npm.cmd run prepare:backend` now includes all migrations before seeding the menu. For an existing installation, apply only migration 002; no repeat import is needed.

## Behavior

- Select PNG, JPG or WebP up to 25 MB and 40 megapixels. SVG, GIF, animation and other formats are not supported in this milestone.
- The browser resizes and compresses before sending, keeping the upload below 2 MB. If WebP encoding is unavailable, it sends JPEG for photos or PNG for category icons to retain transparency. It progressively reduces quality/dimensions when needed and reports format, file-size, decoding and compression errors separately. The server checks byte signatures, decodes the image again, enforces pixel/size limits, corrects orientation, strips metadata and writes WebP. The stored-file limit remains 500 KB.
- Dish photos fit within 1600px, icons within 256px, and offer images within 1920px, preserving aspect ratio without enlarging small originals. Compression tries quality 82, 72 and 62, targeting 200 KB for dishes, 60 KB for icons and 350 KB for offers. Those are quality-dependent targets; 500 KB is the hard stored-file cap. Icon transparency is retained.
- Each upload gets a unique UUID filename. Files cannot be overwritten or deleted by staff. Failed upload or processing leaves the previous image reference in place. A form's photo is not saved to the shared draft until **حفظ المسودة**; offers save their changed image immediately into the draft. Neither changes the public menu until Publish.
- Uploading temporarily disables editing/navigation to prevent a late upload result from replacing newer form state. Upload errors stay visible with the original image so the staff member can choose the file again.
- Images appear in `/admin/preview` and its dish views after the draft is saved. Custom category icons also render in the public navigation after publishing.

## Access and caching

The private Storage bucket permits inserts only for confirmed users in `private.menu_staff`. Downloads are allowed to authorized staff, or anonymously when the object is referenced by the currently published snapshot. Drafts, historical-only assets, and abandoned uploads are not initially exposed to visitors. Saving a draft with a missing media reference is rejected by the database.

The app stores stable same-origin paths such as `/media/UUID.webp`, not expiring signed links or arbitrary remote URLs. The route validates filenames, tries an anonymous Storage download under its policy, and otherwise verifies the staff session before downloading privately. Anonymous missing/private images return 404 with no-store headers. Staff-only images use private/no-store caching. Published immutable images use long-lived browser/CDN caching and a fixed WebP content type with nosniff.

Uploaded images bypass Next.js image optimization because its internal requests do not carry staff cookies for private previews. They are already resized/compressed on upload. Local images continue using the existing optimizer. Published bytes may remain in browser/CDN caches after later unpublishing; previously published photos should not be treated as confidential.

## Retention and remaining work

Replacing or removing a dish, icon or slide does not delete its files. This preserves all retained rollback revisions and avoids concurrent-reference deletion races. Canceled forms and failed draft saves can leave unused uploads in the private bucket. Automatic garbage collection is deliberately deferred until a reference-aware cleanup/claim workflow is implemented; monitor storage and review old orphan uploads rather than deleting files manually based only on the current menu.

Published menu exports and uploaded-photo backups are implemented in [BACKUPS.md](BACKUPS.md). The deployed backup can serve its hash-verified published photos during a Supabase outage. Configure the hourly capture workflow and verify deployment to keep that recovery copy current. Uncaptured uploads still depend on Supabase; usage alerts remain separate work.

## Verification

`npm.cmd run verify:backend` covers image processing and PostgreSQL access policies: private draft images, anonymous/nonstaff insert denial, immutable objects, missing-reference rejection, publication visibility, retention and restoration. Processing checks cover WebP output, resize limits, orientation, metadata removal, transparency, bad formats and payload limits. The browser's actual preparation helper is also checked locally using Edge.

After deploying and applying migration 002, verify with staff accounts:

1. Replace a dish photo and save its draft. Confirm the other staff account and protected preview see it; an incognito window must not open its `/media/` URL before publishing. The public menu must still use the old photo.
2. Publish the intended photo change. Confirm it loads from an incognito window on both the menu and dish page.
3. Upload a transparent category icon and an offer image. Confirm preview, mobile navigation, offer ordering and publication.
4. Restore a revision with an older photo as a draft. Verify the old image still loads; only publish if that restoration is intended.
5. Try an invalid file, cancel a form after uploading, and simulate a network failure. Verify the form and previous image remain usable. Check mobile Safari upload selection and orientation on a real device.

Live staff-account upload/publish acceptance remains necessary; automated tests use local test identities and a PostgreSQL model of Storage policies rather than the hosted Storage service.

Acceptance update (November 3, 2026): migration 002 ran successfully in Supabase and the read-only image-access check passed. The user confirmed upload, saved draft preview and publication work on the local app. Phone/live-site photo verification remains pending deployment of the image-storage code. Custom-icon, offer-image and real-device failure/restore checks remain in the handover checklist.
