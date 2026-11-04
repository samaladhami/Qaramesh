# Usage monitoring

Status: staff-only photo-storage metrics and an owner review procedure are implemented. Provider dashboard readings, account plans and notification settings still need owner confirmation. No billing credentials, paid monitoring service, account upgrades, quota changes or automatic pause actions were added.

## Admin photo usage

Run `supabase/migrations/004_media_usage_report.sql` as postgres in Supabase SQL Editor. The rollout copy is `tmp/setup-media-usage.sql`. It adds a read-only, staff-only report and can be rerun safely. After deployment, open **النشر → استخدام مساحة الصور → تحديث الاستخدام**.

The report shows the image count, known stored bytes, largest file and check time for the private `menu-media` bucket. Missing file-size metadata is counted separately; totals exclude those unknown sizes. It does not count bundled local photos/icons, Git backups, database storage, traffic/egress, other buckets or billable hosting usage. It deliberately does not display a percentage of an assumed plan allowance.

The report links to the Supabase and Vercel dashboards. Those require the service owner's account; being menu staff does not grant provider billing access.

## Owner setup

1. Open [Supabase Dashboard](https://supabase.com/dashboard), select the restaurant's organization and review its **Usage** and billing settings. Confirm the current plan, billing period and allowances shown there. Organization usage can include other projects.
2. Check Storage size, database/disk usage, and **both cached and uncached egress**. Record a baseline below. Supabase's Usage pages are authoritative; do not infer traffic from the app's stored-image size.
3. Confirm that the Supabase billing email reaches the responsible person and that account notifications are being received. If using Pro, review the Spend Cap and what it covers before changing it. Spend Cap does not provide arbitrary per-resource budget alerts or cover every charge. See [Supabase cost controls](https://supabase.com/docs/guides/platform/cost-control) and [usage documentation](https://supabase.com/docs/guides/platform/manage-your-usage).
4. Open [Vercel Dashboard](https://vercel.com/dashboard), select the correct team/project, and review **Usage** for the current period: data transfer, function invocations/compute, image optimization and builds. Record the plan and included allowances shown there.
5. In Vercel account **Settings → Notifications**, review usage/deployment email preferences. Custom on-demand usage notifications and Spend Management depend on the plan; Spend Management is a Pro feature. If applicable, choose a notification amount within the owner's budget. No amount or automatic project pause has been selected for you. See [notifications](https://vercel.com/docs/notifications) and [Spend Management](https://vercel.com/docs/spend-management).
6. Confirm GitHub Actions failure notifications reach the owner, and inspect the **Back up published menu** run after the weekly schedule. The initial manual run has already passed.

## Review rhythm and thresholds

Review once a week after the scheduled backup, and again after substantial photo uploads or an unusual traffic spike. The following are project review thresholds, **not configured automatic provider alerts**:

| Usage compared with the provider's allowance | Owner action |
| --- | --- |
| Below 50% | Record totals and the trend; keep ordinary operation. |
| 50–79% | Check what is growing and whether usage is on course to exceed the allowance before the period ends. |
| 80% or more | Review promptly. Identify the source and choose optimization or a plan/budget change before reaching the limit. |

For unexpected Storage growth, inspect the read-only cleanup report. Never delete category icons or images referenced by drafts/revisions. Deletion remains disabled. For unexpected traffic, use provider usage breakdowns to distinguish real visits, repeated image requests, bots and backup downloads. Weekly backup captures currently download all referenced uploaded photos even when unchanged, although they only commit a changed snapshot.

For errors, check Vercel runtime/build logs and Supabase service logs promptly. Upload errors use `STORAGE_*` codes; repeated failures, backup failures or a stopped public menu require investigation even when usage is below the thresholds. Do not paste passwords, tokens or connection strings into logs or reports.

## Baseline to record in provider dashboards

| Field | Current value |
| --- | --- |
| Review date and owner | Not yet recorded |
| Supabase plan / billing period | Owner confirmation pending |
| Supabase Storage / allowance | Owner confirmation pending |
| Supabase database/disk / allowance | Owner confirmation pending |
| Supabase cached and uncached egress / allowances | Owner confirmation pending |
| Vercel plan / billing period | Owner confirmation pending |
| Vercel transfer, compute/invocations, image optimization and builds | Owner confirmation pending |
| Notification recipient/settings checked | Owner confirmation pending |
| Next review | One week after baseline |

## Verification

`npm.cmd run verify:backend` tests staff-only access, repeatable migration, exact bucket-scoped byte/count totals, missing metadata and read-only behavior. The app has no provider management tokens and cannot verify or change provider account notification/billing settings. Deployment, migration 004, an actual staff usage refresh and the owner's dashboard/notification review are the remaining rollout checks.
