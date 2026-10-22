import fs from 'node:fs/promises';
const menu = JSON.parse(await fs.readFile('data/menu.json', 'utf8'));
await fs.mkdir('public/menu', { recursive: true });
const report = [];
let cursor = 0;
async function worker() {
  while (cursor < menu.items.length) {
    const item = menu.items[cursor++];
    const source = item.image;
    if (!source.startsWith('https://')) continue;
    try {
      const response = await fetch(source, { signal: AbortSignal.timeout(25000) });
      const type = response.headers.get('content-type') || '';
      if (!response.ok || !type.startsWith('image/')) throw new Error(`HTTP ${response.status}, ${type}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
      const path = `/menu/${item.id}.${ext}`;
      await fs.writeFile(`public${path}`, bytes);
      item.image = path;
      report.push({ name: item.name, source, local: path, status: response.status, bytes: bytes.length, type });
    } catch (error) { report.push({ name: item.name, source, error: error.message }); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
await fs.writeFile('data/image-report.json', JSON.stringify(report, null, 2) + '\n');
await fs.writeFile('data/menu.json', JSON.stringify(menu, null, 2) + '\n');
console.log({ checked: report.length, downloaded: report.filter(row => row.local).length, failed: report.filter(row => row.error).length });
