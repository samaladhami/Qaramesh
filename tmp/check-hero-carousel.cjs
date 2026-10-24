const { chromium } = require('C:/Users/samal/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  try {
    for (const width of [320, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: true, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.CHECK_URL || 'http://localhost:3001', { waitUntil: 'networkidle' });
      const carousel = page.getByRole('region', { name: 'صور من مطعم قراميش' });
      assert.equal(await carousel.getByRole('group', { name: 'اختيار الصورة' }).count(), 0);
      const stage = page.locator('#hero-slides');
      const height = (await stage.boundingBox()).height;
      for (let index = 0; index < 8; index++) {
        if (index > 0) {
          await stage.dispatchEvent('pointerdown', { clientX: 200, clientY: 180, pointerId: 1, isPrimary: true, pointerType: 'touch' });
          await stage.dispatchEvent('pointerup', { clientX: 100, clientY: 185, pointerId: 1, isPrimary: true, pointerType: 'touch' });
        }
        await page.waitForFunction(() => {
          const image = document.querySelector('#hero-slides [aria-hidden="false"] img[alt]:not([alt=""])');
          return image && image.complete && image.naturalWidth > 0;
        });
        const image = stage.locator('[aria-hidden="false"] img').last();
        const tablet = await page.evaluate(() => matchMedia('(min-width: 541px) and (max-width: 1199px), (min-width: 541px) and (hover: none) and (pointer: coarse)').matches);
        assert.equal(await image.evaluate(element => getComputedStyle(element).objectFit), tablet ? 'cover' : 'contain');
        assert.equal((await stage.boundingBox()).height, height);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      await page.screenshot({ path: `tmp/menu-check/carousel-${width}.png` });
      const before = await stage.locator('[aria-hidden="false"]').getAttribute('aria-label');
      await stage.dispatchEvent('pointerdown', { clientX: 200, clientY: 180, pointerId: 1, isPrimary: true, pointerType: 'touch' });
      await stage.dispatchEvent('pointerup', { clientX: 100, clientY: 185, pointerId: 1, isPrimary: true, pointerType: 'touch' });
      const after = await stage.locator('[aria-hidden="false"]').getAttribute('aria-label');
      assert.notEqual(before, after);
      await page.locator('.category-card').nth(1).click();
      assert(await page.locator('.dish-card').count() > 0);
      if (width <= 540) {
        await page.waitForSelector('.is-compact');
        await page.locator('.compact-search-toggle').click();
      }
      await page.locator('#search').fill('zzzzzz');
      assert.equal(await page.locator('.dish-card').count(), 0);
      console.log(`${width}px: 8 images, no dots section, fixed height, contain, swipe, category and search passed`);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(process.env.CHECK_URL || 'http://localhost:3001', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#hero-slides [aria-hidden="false"] img[alt]:not([alt=""])')?.naturalWidth > 0);
    const current = () => page.locator('#hero-slides [aria-hidden="false"]').getAttribute('aria-label');
    const seen = [await current()];
    for (let index = 0; index < 7; index++) {
      await page.waitForTimeout(150);
      await page.clock.runFor(5100);
      await page.waitForFunction(() => document.querySelector('#hero-slides [aria-hidden="false"] img[alt]:not([alt=""])')?.naturalWidth > 0);
      seen.push(await current());
    }
    console.log('Autoplay sequence:', seen);
    assert.equal(new Set(seen).size, 8, 'Autoplay must show every slide once before reshuffling');
    await page.waitForTimeout(150);
    await page.clock.runFor(5100);
    await page.waitForFunction(() => document.querySelector('#hero-slides [aria-hidden="false"] img[alt]:not([alt=""])')?.naturalWidth > 0);
    assert.notEqual(await current(), seen.at(-1), 'Reshuffling must not repeat the previous image');
    assert.equal(await page.getByRole('region', { name: 'صور من مطعم قراميش' }).getByRole('button').count(), 0);
    assert.deepEqual(errors, []);
    console.log('Shuffled 5-second autoplay, no repeats across first cycle, no visible controls, and browser errors passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
