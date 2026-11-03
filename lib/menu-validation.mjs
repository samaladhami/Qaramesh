import { validMenuImage } from './media-path.mjs';
const idPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const validId = value => typeof value === 'string' && idPattern.test(value);
const text = (value, max, required = false) => typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
const unique = (values, key) => new Set(values.map(value => value[key])).size === values.length;
const image = validMenuImage;

export function validateMenu(value) {
  if (!value || !Array.isArray(value.items) || !Array.isArray(value.categories) || !Array.isArray(value.slides)) throw new Error('INVALID_MENU');
  if (JSON.stringify(value).length > 2000000 || value.items.length > 2000 || value.categories.length > 200 || value.slides.length > 30) throw new Error('INVALID_MENU');
  if (!value.categories.every(c => c && validId(c.id) && text(c.name, 100, true) && text(c.icon || '', 100) && image(c.image))) throw new Error('INVALID_CATEGORIES');
  if (!unique(value.categories, 'id') || !unique(value.categories, 'name')) throw new Error('DUPLICATE_CATEGORY');
  if (!value.items.every(i => i && validId(i.id) && text(i.name, 120, true) && Number.isSafeInteger(i.price) && i.price >= 0 && i.price <= 999999999 && typeof i.available === 'boolean' && value.categories.some(c => c.name === i.category) && ['size','description','shortDescription','addOn'].every(key => text(i[key] || '', key === 'description' ? 3000 : key === 'shortDescription' ? 240 : key === 'size' ? 100 : 300)) && image(i.image))) throw new Error('INVALID_DISHES');
  if (!unique(value.items, 'id') || !unique(value.slides, 'id')) throw new Error('DUPLICATE_ID');
  if (!value.slides.every(s => s && validId(s.id) && text(s.alt,240) && s.src && image(s.src))) throw new Error('INVALID_SLIDES');
  return value;
}
