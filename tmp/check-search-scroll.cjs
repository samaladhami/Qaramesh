const { chromium } = require('C:/Users/samal/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    for (const [width, motion] of [[320, 'no-preference'], [390, 'no-preference'], [390, 'reduce'], [1280, 'no-preference']]) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: motion });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        window.searchScrolls = [];
        const original = Element.prototype.scrollIntoView;
        Element.prototype.scrollIntoView = function(options) { window.searchScrolls.push(options); return original.call(this, options); };
      });
      await page.locator('#search').click();
      if (width <= 540) {
        await page.waitForSelector('.is-compact.search-open');
        await page.waitForTimeout(900);
        assert(await page.locator('#search').evaluate(input => document.activeElement === input));
        assert(await page.evaluate(() => scrollY > 0));
        const calls = await page.evaluate(() => window.searchScrolls);
        assert(calls.some(call => call.behavior === (motion === 'reduce' ? 'instant' : 'smooth')));
        // Simulate an iOS webview panning its visual viewport above the keyboard.
        await page.evaluate(() => {
          window.testViewportTop = 0;
          Object.defineProperty(window.visualViewport, 'offsetTop', { configurable: true, get: () => window.testViewportTop });
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
        for (const offset of [80, 160, 0]) {
          await page.evaluate(top => {
            window.testViewportTop = top;
            window.visualViewport.dispatchEvent(new Event('scroll'));
            window.visualViewport.dispatchEvent(new Event('resize'));
          }, offset);
          await page.waitForTimeout(100);
          const input = await page.locator('#search').boundingBox();
          assert(input.y >= offset && input.y + input.height <= offset + 300, 'Search must remain in the visible viewport above the keyboard');
          assert(await page.locator('#search').evaluate(input => document.activeElement === input));
          assert.equal(await page.locator('.is-compact.search-open').count(), 1);
        }
        await page.evaluate(() => { delete window.visualViewport.offsetTop; });
        await page.locator('#search').fill('zzzzzz');
        assert.equal(await page.locator('.dish-card').count(), 0);
        await page.locator('.compact-search-close').click();
        assert.equal(await page.locator('.is-compact.search-open').count(), 0);
      } else {
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.equal(await page.evaluate(() => window.searchScrolls.length), 0);
      }
      assert.deepEqual(errors, []);
      console.log(`${width}px ${motion}: search focus, scroll behavior and controls passed`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
