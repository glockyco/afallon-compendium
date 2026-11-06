import { afterAll, beforeAll, expect, test } from 'bun:test';
import { chromium, type Browser } from 'playwright-core';

// Browser integration needs a running staged site: COMPENDIUM_BROWSER_TEST_URL=http://127.0.0.1:4210.
// Use CHROMIUM_CDP_URL for an existing test browser, or installed Playwright Chromium (optionally
// PLAYWRIGHT_CHROMIUM_EXECUTABLE). Ordinary unit runs do not start a staged server or install browsers.
const origin = process.env.COMPENDIUM_BROWSER_TEST_URL;
const browserTest = test.skipIf(!origin);
const storedDraft = (level: number) => JSON.stringify({ version: 1, revision: 2, characters: [], activeId: null, draft: { level, revision: 2 }, migratedCharacterLevel: true });
let session: Browser;
beforeAll(async () => {
  if (!origin) return;
  session = process.env.CHROMIUM_CDP_URL
    ? await chromium.connectOverCDP(process.env.CHROMIUM_CDP_URL)
    : await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
}, 60000);
afterAll(async () => {
  // Never close the caller's managed browser; the test runner releases the CDP connection on exit.
  if (session && !process.env.CHROMIUM_CDP_URL) await session.close();
});

browserTest('mounted bound controls and results follow a remembered level arriving after mount', async () => {
  const context = await session.newContext();
  try {
    await context.addInitScript(() => {
      const originalAdd = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (...args) {
        Reflect.apply(originalAdd, this, args);
        if (this instanceof HTMLInputElement && args[0] === 'keydown' && this.id.includes('level')) this.dataset.levelHydrated = 'true';
      };
      // Hold the initial character read until the test has observed the mounted fallback. This is
      // a late external source, not seeding state during page import or replacing the real store.
      const originalRequest = navigator.locks.request.bind(navigator.locks);
      const delayed = new Promise<void>((resolve) => document.addEventListener('release-character-read', () => resolve(), { once: true }));
      navigator.locks.request = async function (name: string, optionsOrCallback: LockOptions | LockGrantedCallback<unknown>, callback?: LockGrantedCallback<unknown>) {
        if (name === 'compendium.characters') await delayed;
        return typeof optionsOrCallback === 'function' ? await originalRequest(name, optionsOrCallback) : await originalRequest(name, optionsOrCallback, callback!);
      } as typeof navigator.locks.request;
    });
    const page = await context.newPage();
    await page.goto(`${origin}/about/`);
    await page.evaluate((value) => localStorage.setItem('compendium.characters.v1', value), storedDraft(37));
    await page.goto(`${origin}/mechanics/character-progression/`);
    await page.waitForSelector('#progression-character-level[data-level-hydrated="true"]');
    expect(await page.locator('#progression-character-level').inputValue()).toBe('23');
    await page.evaluate(() => document.dispatchEvent(new Event('release-character-read')));
    await page.waitForFunction(() => (document.querySelector('#progression-character-level') as HTMLInputElement)?.value === '37');
    expect(await page.locator('#progression-character-level').inputValue()).toBe('37');
    expect(await page.locator('.progression-answer .answer').textContent()).toMatch(/from level\s*37/);
    expect(await page.locator('.progression-answer input[type="range"]').inputValue()).toBe('37');
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(storedDraft(37));

    await page.goto(`${origin}/`);
    await page.waitForSelector('#hub-your-level[data-level-hydrated="true"]');
    expect(await page.locator('#hub-your-level').inputValue()).toBe('');
    await page.evaluate(() => document.dispatchEvent(new Event('release-character-read')));
    await page.waitForFunction(() => (document.querySelector('#hub-your-level') as HTMLInputElement)?.value === '37');
    expect(await page.locator('#hub-your-level').inputValue()).toBe('37');
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(storedDraft(37));
  } finally {
    await context.close();
  }
}, 60000);

browserTest('mounted controls remain editable when the storage getter throws before import', async () => {
  const context = await session.newContext();
  try {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Denied', 'SecurityError'); } });
      const originalAdd = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (...args) {
        Reflect.apply(originalAdd, this, args);
        if (this instanceof HTMLInputElement && args[0] === 'keydown' && this.id.includes('level')) this.dataset.levelHydrated = 'true';
      };
    });
    const page = await context.newPage();
    await page.goto(`${origin}/mechanics/character-progression/`);
    await page.waitForSelector('#progression-character-level[data-level-hydrated="true"]');
    expect(await page.locator('#progression-character-level').inputValue()).toBe('23');
    await page.getByRole('button', { name: 'Raise character level', exact: true }).click();
    await page.waitForFunction(() => (document.querySelector('#progression-character-level') as HTMLInputElement)?.value === '24');
    expect(await page.locator('#progression-character-level').inputValue()).toBe('24');
    expect(await page.locator('.progression-answer .answer').textContent()).toMatch(/from level\s*24/);
    await page.getByRole('button', { name: 'Raise character level', exact: true }).click();
    await page.waitForFunction(() => (document.querySelector('#progression-character-level') as HTMLInputElement)?.value === '25');
    expect(await page.locator('#progression-character-level').inputValue()).toBe('25');
    expect(await page.evaluate(() => { try { window.localStorage; return false; } catch (error) { return error instanceof DOMException && error.name === 'SecurityError'; } })).toBe(true);
  } finally {
    await context.close();
  }
}, 60000);
