// Bakes the heavy pictures into files at build time, so no phone ever works
// them out: starts the dev server, opens bake.html in headless Chrome (the
// generators draw on a canvas, so they need a browser), and writes each
// picture to src/art/baked/<key>.png. The game imports them by URL; without
// them it draws them itself. Run by the deploy before `npm run build`.
//
// Chrome: $CHROME, else the usual place on macOS or Linux.
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'src/art/baked');
const chrome =
  process.env.CHROME ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'].find((p) =>
    existsSync(p),
  );
if (!chrome) {
  throw new Error('No Chrome found: set $CHROME');
}

const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), server: { port: 5191, strictPort: false, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  page.on('pageerror', (error) => console.error(error));
  await page.goto(new URL('bake.html', url).href);
  await page.waitForFunction(() => window.baked !== undefined, { timeout: 120000 });
  const baked = await page.evaluate(() => window.baked);
  await mkdir(out, { recursive: true });
  let total = 0;
  for (const [key, data] of Object.entries(baked)) {
    const bytes = Buffer.from(data.replace(/^data:image\/png;base64,/, ''), 'base64');
    total += bytes.length;
    await writeFile(path.join(out, `${key}.png`), bytes);
    console.log(`${key}.png ${Math.round(bytes.length / 1024)} kB`);
  }
  console.log(`baked ${Object.keys(baked).length} pictures, ${Math.round(total / 1024)} kB`);
} finally {
  await browser.close();
  await server.close();
}
