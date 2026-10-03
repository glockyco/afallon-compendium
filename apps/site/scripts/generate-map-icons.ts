import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
let browser;
try {
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Unable to start the sprite generator server.');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
  const page = await browser.newPage();
  await page.goto(origin);
  // Import the Vite-served module in the browser: the canvas renderer must match the actual map's SVG rasterizer.
  const result = await page.evaluate(async (moduleUrl) => {
    const { generateIconSheet } = await import(/* @vite-ignore */ moduleUrl);
    const { canvas, mapping } = await generateIconSheet();
    return { image: canvas.toDataURL('image/png').split(',')[1], mapping };
  }, `${origin}/src/lib/map/icon-sheet-generator.ts`);
  if (!result.image) throw new Error('The sprite generator produced no pixels.');
  await Bun.write(join(import.meta.dir, '../static/map-marker-icons.png'), Buffer.from(result.image, 'base64'));
  await Bun.write(join(import.meta.dir, '../src/lib/map/icon-sheet-mapping.json'), `${JSON.stringify(result.mapping, null, 2)}\n`);
} finally {
  await browser?.close();
  await server.close();
}
