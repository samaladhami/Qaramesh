import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { capturePublishedMenu } from '../lib/menu-backup.mjs';

createRequire(import.meta.url)('@next/env').loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. No staff credentials are needed.');
const publicClient = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (resource, options) => fetch(resource, { ...options, signal: AbortSignal.timeout(15000) }) },
});
const headers = { apikey: key, 'Content-Type': 'application/json' };
async function request(path, options = {}) {
  const response = await fetch(`${url}${path}`, { ...options, headers, signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!response.ok) throw Error(`Backup request failed (${response.status}); the previous backup is unchanged.`);
  return response;
}

const { manifest, images } = await capturePublishedMenu({
  readPublished: async () => (await request('/rest/v1/rpc/menu_public_read', { method: 'POST', body: '{}' })).json(),
  readImage: async filename => {
    const { data, error } = await publicClient.storage.from('menu-media').download(filename);
    if (error || !data) throw Error('Published photo download failed; the previous backup is unchanged.');
    return data.arrayBuffer();
  },
});
const directory = resolve('data/published-media');
await mkdir(directory, { recursive: true });
for (const [filename, bytes] of images) {
  const target = resolve(directory, filename);
  let existing;
  try { existing = await readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing && !existing.equals(bytes)) throw Error('An immutable backup image differs; inspect it before continuing.');
  if (!existing) await writeFile(target, bytes, { flag: 'wx' });
}
// Atomic manifest replacement: a failed download never advertises a partial backup.
const target = resolve('data/published-menu-backup.json');
const temporary = `${target}.pending`;
await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(temporary, target);
console.log(`Backed up published revision ${manifest.revision}: ${manifest.content.items.length} dishes, ${images.size} uploaded images.`);
