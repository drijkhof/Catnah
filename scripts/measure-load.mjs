// Measures how long the game takes to load, as a phone: Lighthouse's mobile
// profile -- the CPU four times slower, and Slow 4G (562.5 ms round trip,
// 1.47 Mbit/s down) or, with NET=fast4g, 4G (170 ms, 9 Mbit/s). Reads the
// `catnah:*` marks from src/timing.ts.
//
//   npm run build && npx vite preview --port 5190 --strictPort &
//   node scripts/measure-load.mjs load http://localhost:5190/ [runs]
//       cold loads (no cache): first paint, boot, art, title; median of runs
//   node scripts/measure-load.mjs levels http://localhost:5180/
//       every level's build time, on the dev server (it drives window.game)
//
// Chrome is visible by default: headless Chrome draws without the GPU, which
// makes everything the graphics card does several times slower than on any
// phone. HEADLESS=1 to hide it anyway.
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const [mode = 'load', url = 'http://localhost:5190/', runsArg = '3'] = process.argv.slice(2);
const chrome =
  process.env.CHROME ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find((p) => existsSync(p));
const net = process.env.NET === 'fast4g' ? { latency: 170, down: 9000, up: 9000 } : { latency: 562.5, down: 1474.56, up: 675 };
const browser = await puppeteer.launch({ executablePath: chrome, headless: process.env.HEADLESS ? 'new' : false });

async function phone(throttleNetwork) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.emulate({
    viewport: { width: 844, height: 390, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  });
  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (throttleNetwork) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: net.latency, downloadThroughput: (net.down * 1024) / 8, uploadThroughput: (net.up * 1024) / 8 });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  return { page, context };
}

const waitForTitle = (page) => page.waitForFunction(() => performance.getEntriesByName('catnah:title').length > 0, { timeout: 120000, polling: 50 });

if (mode === 'load') {
  const results = [];
  for (let i = 0; i < Number(runsArg); i++) {
    const { page, context } = await phone(true);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await waitForTitle(page);
    const r = await page.evaluate(() => {
      const at = (name) => Math.round(performance.getEntriesByName(name)[0]?.startTime ?? -1);
      const files = performance.getEntriesByType('resource');
      const bytes = files.reduce((sum, e) => sum + (e.encodedBodySize || 0), 0) + (performance.getEntriesByType('navigation')[0].encodedBodySize || 0);
      return { fcp: at('first-contentful-paint'), boot: at('catnah:boot'), art: at('catnah:art'), title: at('catnah:title'), kB: Math.round(bytes / 1024) };
    });
    console.log(JSON.stringify(r));
    results.push(r);
    await context.close();
  }
  const median = (key) => results.map((r) => r[key]).sort((a, b) => a - b)[Math.floor(results.length / 2)];
  console.log(`median: first paint ${median('fcp')} ms, title ${median('title')} ms, ${median('kB')} kB`);
} else {
  const { page, context } = await phone(false);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForTitle(page);
  const lines = await page.evaluate(async () => {
    const game = window.game;
    game.resume();
    game.scene.stop('Title');
    for (let i = 0; i < 23; i++) {
      game.scene.start('Game', { levelIndex: i });
      await new Promise((r) => setTimeout(r, 3500));
    }
    return performance.getEntriesByType('measure').filter((e) => e.name.startsWith('catnah:level')).map((e) => `${e.name.replace('catnah:level:', '')} ${Math.round(e.duration)} ms`);
  });
  console.log(lines.join('\n'));
  await context.close();
}
await browser.close();
