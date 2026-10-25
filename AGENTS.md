<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Delivery workflow

The site is deployed on Vercel through GitHub. After completing a meaningful milestone, run appropriate checks, commit the relevant changes, and push to origin/main to update the deployment. The user has authorized this ongoing milestone workflow; do not ask for confirmation each time. Avoid pushing incomplete experiments. Preserve unrelated user changes and exclude them from milestone commits. See README.md for deployment notes.

## Brand colors

When the user names a color, use these project values without asking for the hex again:

- Red: `#DB4D49` (`var(--red)`)
- Teal: `#429198` (`var(--teal)`)
- Yellow: `#F7D54F` (`var(--yellow)`)
- White: `#FFFFFF` (`var(--white)`)

The CSS variables are defined in `app/globals.css`. Use them for interface styling and preserve this palette unless the user requests a change.
