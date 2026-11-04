import { createHash } from 'node:crypto';
import { validateMenu } from './menu-validation.mjs';
import { mediaFilename, mediaFilenamePattern } from './media-path.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function uploadedImages(content) {
  return [...new Set([
    ...content.items.map(item => item.image),
    ...content.categories.map(category => category.image),
    ...content.slides.map(slide => slide.src),
  ].map(mediaFilename).filter(Boolean))].sort();
}

export function validatePublishedBackup(backup) {
  validateMenu(backup?.content);
  if (!Number.isSafeInteger(backup.revision) || backup.revision < 1 || !Number.isFinite(Date.parse(backup.publishedAt))) throw Error('INVALID_BACKUP');
  return backup;
}

export async function readBackupImage(backup, filename, readBytes) {
  if (!mediaFilenamePattern.test(filename) || !uploadedImages(validatePublishedBackup(backup).content).includes(filename)) return null;
  try {
    const bytes = await readBytes(filename);
    return bytes.length <= 500000 && sha256(bytes) === backup.images?.[filename] ? bytes : null;
  } catch { return null; }
}

// Download everything before the caller replaces the last complete manifest.
// The second read detects publication changes while Storage policies are changing.
export async function capturePublishedMenu({ readPublished, readImage }) {
  const snapshot = validatePublishedBackup(await readPublished());
  const images = new Map();
  for (const filename of uploadedImages(snapshot.content)) {
    const bytes = Buffer.from(await readImage(filename));
    if (bytes.length > 500000 || bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw Error('INVALID_BACKUP_IMAGE');
    images.set(filename, bytes);
  }
  const current = validatePublishedBackup(await readPublished());
  if (current.revision !== snapshot.revision || JSON.stringify(current.content) !== JSON.stringify(snapshot.content)) throw Error('PUBLICATION_CHANGED_RETRY_BACKUP');
  const manifest = {
    format: 1, revision: snapshot.revision, publishedAt: snapshot.publishedAt,
    content: snapshot.content,
    images: Object.fromEntries([...images].map(([name, bytes]) => [name, sha256(bytes)])),
  };
  return { manifest, images };
}
