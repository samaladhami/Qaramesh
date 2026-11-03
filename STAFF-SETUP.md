# Staff login setup

The footer links to `/admin/login`. `/admin` requires a verified Supabase account whose user ID is in the server's staff allowlist. Until configuration is complete, login is disabled and `/admin` redirects to login. There is no public registration form.

## Create the project and first staff account

1. Sign in at [Supabase](https://supabase.com/dashboard) and create a project. Keep the database password in your password manager; the app does not need it for login.
2. In Authentication settings, disable **Allow new users to sign up**. Keep email/password authentication enabled. This must be disabled in Supabase, not just hidden in the app.
3. Under Authentication → Users, use **Add user → Create new user** for the initial staff account. Set an email and strong password and confirm the email only after verifying that it belongs to the intended staff member. Deliver credentials securely. Copy the account's user UUID into the server allowlist below. Email invitation acceptance and self-service password reset screens are not part of this milestone; provision accounts through the project dashboard for now.
4. In the project's Connect dialog, copy the Project URL and publishable key. A legacy anon key can also be used in the publishable-key field. Do not use a service-role key, secret API key or database password.

## Configure local development

Copy `.env.example` to `.env.local` and fill these values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_STAFF_USER_IDS=FIRST_STAFF_USER_UUID
```

For multiple staff accounts, separate UUIDs with commas. Every listed staff member has the same dashboard access. Removing an ID revokes dashboard access after the next server request with the updated configuration. Restart `npm.cmd run dev` after changing environment values. `.env.local` is ignored by Git; do not commit it or share credentials in chat.

## Configure Vercel

Add the same three values in the Vercel project's environment settings for Production. Configure Preview separately if staff login is needed there. Redeploy after setting or changing values. The allowlist is a server variable; never prefix it with `NEXT_PUBLIC_`.

## Verify before handing over

- The footer opens `/admin/login`; direct signed-out visits to `/admin` redirect there.
- A confirmed, allowlisted account can sign in and sign out.
- Wrong passwords, unconfirmed accounts, and accounts not on the staff list cannot open the dashboard. Removing a staff UUID and redeploying/restarting denies that account.
- Expired sessions refresh; an unavailable authentication service does not grant access. Check this with the configured project before staff handover.
- The public menu still works without signing in.

Shared drafts and real publishing are available after the database migration and `MENU_BACKEND_ENABLED=true` rollout setting. Follow [SHARED-MENU.md](SHARED-MENU.md). Both the server's UID allowlist and the database staff membership must be maintained when granting or revoking access. Until enabled, the dashboard uses the local prototype. Image uploads use the same staff accounts and require migration 002; see [IMAGE-STORAGE.md](IMAGE-STORAGE.md).

Implementation references: [Supabase cookie-based Next.js authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs), [password authentication](https://supabase.com/docs/guides/auth/passwords).
