const { chromium } = require('C:/Users/samal/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    for (const [width, height, touch] of [[320,568,true],[390,844,true],[768,1024,true],[1024,768,true],[820,1180,true],[1366,1024,true],[1280,720,false],[1440,400,false],[667,375,true]]) {
      const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch, reducedMotion: 'reduce' });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      await page.waitForSelector('#hero-slides [aria-hidden="false"] img');
      const result = await page.evaluate(() => {
        const stage = document.querySelector('#hero-slides').getBoundingClientRect();
        const search = document.querySelector('.search-wrap').getBoundingClientRect();
        const image = document.querySelector('#hero-slides [aria-hidden="false"] img:last-child');
        return { stageWidth: stage.width, stageHeight: stage.height, searchTop: search.top, searchBottom: search.bottom, fit: getComputedStyle(image).objectFit, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert(result.searchTop >= 0 && result.searchBottom <= height, JSON.stringify(result));
      assert.equal(result.overflow, false);
      if (width > 540 && (touch || width < 1200)) {
        assert.equal(result.fit, 'cover');
        assert.equal(result.stageWidth, width);
        assert.equal(result.stageHeight, height - 96);
      }
      console.log(`${width}x${height}: search visible, hero ${result.stageHeight}px, ${result.fit}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
