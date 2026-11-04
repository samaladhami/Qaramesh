import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { sha256, uploadedImages, validatePublishedBackup } from '../lib/menu-backup.mjs';

createRequire(import.meta.url)('@next/env').loadEnvConfig(process.cwd());
if (!process.argv.includes('--restore-draft')) throw Error('Run with --restore-draft to restore the backup into a clean shared draft for review. This never publishes.');
const backup = validatePublishedBackup(JSON.parse(await readFile('data/published-menu-backup.json', 'utf8')));
const files = new Map();
for (const filename of uploadedImages(backup.content)) {
  const bytes = await readFile(path.join('data', 'published-media', filename));
  if (bytes.length > 500000 || sha256(bytes) !== backup.images?.[filename]) throw Error('Missing or damaged backup image. Nothing was restored.');
  files.set(filename, bytes);
}
const email = process.env.MENU_RECOVERY_EMAIL;
const password = process.env.MENU_RECOVERY_PASSWORD;
if (!email || !password) throw Error('Set MENU_RECOVERY_EMAIL and MENU_RECOVERY_PASSWORD for a confirmed staff account in the terminal environment. Do not commit them.');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }) },
});
try {
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw Error('Staff sign-in failed.');
  const { data: state, error } = await client.rpc('menu_admin_read');
  if (error || !state) throw Error('Staff access or initialized menu is missing. Apply setup migrations and seed first.');
  if (JSON.stringify(state.draft) !== JSON.stringify(state.baseline)) throw Error('The shared draft has unpublished changes. Resolve those in the dashboard before recovery.');
  for (const [filename, bytes] of files) {
    const existing = await client.storage.from('menu-media').download(filename);
    if (!existing.error && existing.data) {
      if (sha256(Buffer.from(await existing.data.arrayBuffer())) !== backup.images[filename]) throw Error('Existing immutable image differs. Recovery stopped without replacing it.');
      continue;
    }
    const upload = await client.storage.from('menu-media').upload(filename, bytes, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (upload.error) throw Error('Image recovery failed. The shared draft has not been changed.');
  }
  const saved = await client.rpc('menu_save', { value: backup.content, expected_version: state.version });
  if (saved.error) throw Error('Draft recovery failed or another staff member saved first. Refresh the dashboard; nothing was published.');
  console.log(`Backup revision ${backup.revision} restored as a shared draft. Review /admin/preview before publishing.`);
} finally {
  await client.auth.signOut({ scope: 'local' });
}
