import fs from 'node:fs';
import assert from 'node:assert/strict';
const raw = JSON.parse(fs.readFileSync('data/workbook-raw.json', 'utf8').replace(/^\uFEFF/, ''));
const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const displayNames = new Map([['بنسبي مشين', 'بيبسي']]);
const source = raw.Sheet1.slice(1).filter(row => clean(row.A));
const images = new Map();
const duplicates = [];
for (const row of raw.Sheet4) {
  const key = clean(row.A);
  if (images.has(key)) duplicates.push(key);
  images.set(key, row);
}
const unmatched = source.filter(row => !images.has(clean(row.A))).map(row => row.A);
const extra = raw.Sheet4.filter(row => !source.some(item => clean(item.A) === clean(row.A))).map(row => row.A);
const items = source.map((row, index) => ({
  id: `dish-${index + 1}`, name: displayNames.get(clean(row.A)) || clean(row.A), category: clean(row.B),
  price: Number(row.C) * 1000, shortDescription: clean(row.D), description: clean(row.E),
  size: clean(row.F), image: clean(images.get(clean(row.A))?.E || row.G),
  available: row.H !== '0', addOn: clean(row.I),
}));
const categories = [...new Set([...raw.Sheet3.map(row => clean(row.A)), ...items.map(item => item.category)])].filter(Boolean);
const report = {
  entries: items.length, categories: categories.length, matchedImages: items.filter(item => item.image).length,
  unmatchedNames: unmatched, extraImageNames: extra, duplicateImageNames: duplicates,
  availabilityPolicy: 'Sheet1 is authoritative: blank means available; explicit 0 means unavailable. Sheet4 availability is not imported.',
  availabilityDifferences: source.filter(row => clean(row.H || '1') !== clean(images.get(clean(row.A))?.H || '1')).map(row => ({ name: row.A, sheet1: row.H || '1', sheet4: images.get(clean(row.A))?.H })),
};
assert.equal(items.length, 145); assert.equal(categories.length, 20);
assert.equal(new Set(items.map(item => item.name)).size, items.length);
assert.ok(items.every(item => Number.isFinite(item.price) && item.price >= 0));
assert.equal(unmatched.length + extra.length + duplicates.length, 0, 'Investigate workbook name discrepancies');
if (process.argv.includes('--check')) {
  const saved = JSON.parse(fs.readFileSync('data/menu.json', 'utf8'));
  assert.deepEqual(saved.categories, categories);
  assert.equal(saved.items.length, items.length);
  for (const [index, item] of saved.items.entries()) {
    const { image, ...fields } = item;
    const { image: sourceImage, ...sourceFields } = items[index];
    assert.deepEqual(fields, sourceFields);
    assert.ok(image === sourceImage || (image.startsWith('/menu/') && fs.existsSync(`public${image}`)), `Missing image for ${item.name}`);
  }
}
if (!process.argv.includes('--check')) {
  fs.writeFileSync('data/menu.json', JSON.stringify({ categories, items }, null, 2) + '\n');
  fs.writeFileSync('data/import-report.json', JSON.stringify(report, null, 2) + '\n');
}
console.log(JSON.stringify(report, null, 2));
