export const MEDIA_BUCKET = 'menu-media';
export const mediaFilenamePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
export function mediaFilename(src) {
  if (typeof src !== 'string' || !src.startsWith('/media/')) return null;
  const filename=src.slice(7);
  return mediaFilenamePattern.test(filename) ? filename : null;
}
export function validMenuImage(src) {
  return src === '' || src === undefined || (typeof src === 'string' && !src.includes('..') && (/^\/(menu|hero)\/[a-zA-Z0-9._-]+$/.test(src) || Boolean(mediaFilename(src))));
}
