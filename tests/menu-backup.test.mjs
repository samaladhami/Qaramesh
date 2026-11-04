import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { capturePublishedMenu, readBackupImage, sha256, uploadedImages } from '../lib/menu-backup.mjs';

const filename = '12345678-1234-1234-1234-123456789abc.webp';
const image = `/media/${filename}`;
const bytes = Buffer.from('RIFF1234WEBPtest');
const snapshot = { revision: 2, publishedAt: '2026-11-03T12:00:00Z', content: {
  items: [], categories: [{ id: 'cat', name: 'Category', icon: '', image }], slides: [{ id: 'slide', src: image, alt: '' }],
} };

test('outage image fallback refuses unpublished names, traversal and corrupt bytes', async () => {
  const backup = { ...snapshot, images: { [filename]: sha256(bytes) } };
  assert.deepEqual(await readBackupImage(backup, filename, async () => bytes), bytes);
  assert.equal(await readBackupImage(backup, filename, async () => Buffer.from('corrupt')), null);
  const forbidden = async () => { assert.fail('Must not read unreferenced files'); };
  assert.equal(await readBackupImage(backup, '../secret', forbidden), null);
  assert.equal(await readBackupImage(backup, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp', forbidden), null);
});

test('backup includes exactly the published media, deduplicates and hashes bytes', async () => {
  let downloads = 0;
  const { manifest, images } = await capturePublishedMenu({ readPublished: async () => snapshot, readImage: async name => { assert.equal(name, filename); downloads++; return bytes; } });
  assert.equal(downloads, 1);
  assert.deepEqual(uploadedImages(snapshot.content), [filename]);
  assert.equal(manifest.images[filename], sha256(bytes));
  assert.deepEqual(manifest.content, snapshot.content);
  assert.equal(images.size, 1);
});

test('checked-in recovery manifest has every referenced image and correct hashes', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const backup = JSON.parse(await readFile(path.join(root, 'data/published-menu-backup.json'), 'utf8'));
  assert.ok(backup?.revision > 0, 'Capture the first backup before deployment');
  for (const name of uploadedImages(backup.content)) {
    assert.equal(sha256(await readFile(path.join(root, 'data/published-media', name))), backup.images[name]);
  }
  const sources = [...backup.content.items.map(i => i.image), ...backup.content.categories.map(c => c.image), ...backup.content.slides.map(s => s.src)];
  for (const src of new Set(sources.filter(src => src && !src.startsWith('/media/')))) await access(path.join(root, 'public', src));
});

test('publication races, unavailable images and invalid payloads never yield a complete backup', async () => {
  let reads = 0;
  await assert.rejects(capturePublishedMenu({ readPublished: async () => ({ ...snapshot, revision: ++reads }), readImage: async () => bytes }), /PUBLICATION_CHANGED/);
  await assert.rejects(capturePublishedMenu({ readPublished: async () => snapshot, readImage: async () => { throw Error('Offline'); } }), /Offline/);
  await assert.rejects(capturePublishedMenu({ readPublished: async () => snapshot, readImage: async () => Buffer.from('bad image') }), /INVALID_BACKUP_IMAGE/);
  await assert.rejects(capturePublishedMenu({ readPublished: async () => ({ ...snapshot, revision: 0 }), readImage: async () => bytes }), /INVALID_BACKUP/);
});
