import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import backup from '../data/published-menu-backup.json';
import { readBackupImage, validatePublishedBackup } from './menu-backup.mjs';

export function bundledPublishedMenu() {
  try { return validatePublishedBackup(backup); } catch { return null; }
}

export async function bundledPublishedImage(filename) {
  const snapshot = bundledPublishedMenu();
  if (!snapshot) return null;
  return readBackupImage(snapshot, filename, name => readFile(path.join(process.cwd(), 'data', 'published-media', name)));
}
