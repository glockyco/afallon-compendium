import { afterAll, beforeAll, expect, test } from 'bun:test';
import { chromium, type Browser } from 'playwright-core';

const origin = process.env.COMPENDIUM_BROWSER_TEST_URL;
const browserTest = test.skipIf(!origin);
let session: Browser;
beforeAll(async () => {
  if (!origin) return;
  session = process.env.CHROMIUM_CDP_URL ? await chromium.connectOverCDP(process.env.CHROMIUM_CDP_URL)
    : await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
}, 60000);
afterAll(async () => { if (session && !process.env.CHROMIUM_CDP_URL) await session.close(); });

const build = { catalog: 'd5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15', class: 'classes:6', race: 'races:0', level: 24, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } };
const collection = { version: 1, revision: 2, characters: [{ id: 'brielle', name: 'Brielle', revision: 1, build }, { id: 'theron', name: 'Theron', revision: 2, build: { ...build, class: 'classes:7', level: 37 } }], activeId: 'brielle', draft: null, migratedCharacterLevel: true };

browserTest('public mount and ordinary switch load no planner data and preserve builds, focus and scroll', async () => {
  const context = await session.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    await context.addInitScript((value) => localStorage.setItem('compendium.characters.v1', value), JSON.stringify(collection));
    const page = await context.newPage();
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const response = await page.goto(`${origin}/items/gold/`);
    const initial = await response!.text();
    expect(initial).not.toContain('Brielle');
    expect(initial).toContain('Character Planner');
    await page.waitForSelector('.desktop-character summary[aria-label^="Active character"]');
    expect(await page.locator('[data-character-context]').count()).toBe(0);
    for (const width of [1440, 1100]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.locator('.bar-search').evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(256);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator('.desktop-character summary').click();
    const control = page.locator('.desktop-character button').filter({ hasText: 'Theron' });
    await control.focus();
    const before = await page.evaluate(() => ({ y: scrollY, top: document.querySelector('h1')!.getBoundingClientRect().top }));
    await control.press('Enter');
    await page.waitForFunction(() => document.querySelector('.desktop-character summary')?.textContent?.includes('Theron'));
    expect(await control.evaluate((element) => element === document.activeElement)).toBe(true);
    expect(await page.evaluate(() => ({ y: scrollY, top: document.querySelector('h1')!.getBoundingClientRect().top }))).toEqual(before);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!));
    expect(stored.activeId).toBe('theron');
    expect(stored.characters).toEqual(collection.characters);
    expect(requests.filter((url) => /\/data\/.*\.json(?:\?|$)|\/planner\/(?:talents(?:-order)?|build-link|ui)\b/.test(url))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
}, 60000);

browserTest('phone character menu switches with the keyboard without overflowing', async () => {
  const context = await session.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await context.addInitScript((value) => localStorage.setItem('compendium.characters.v1', value), JSON.stringify(collection));
    const page = await context.newPage();
    await page.goto(`${origin}/items/gold/`);
    await page.waitForSelector('.phone-character summary[aria-label^="Active character"]', { state: 'attached' });
    await page.locator('details.browse > summary').focus();
    await page.locator('details.browse > summary').press('Enter');
    await page.locator('.phone-character summary').focus();
    await page.locator('.phone-character summary').press('Enter');
    const control = page.locator('.phone-character button').filter({ hasText: 'Theron' });
    await control.focus();
    await control.press('Enter');
    await page.waitForFunction(() => document.querySelector('.phone-character summary')?.textContent?.includes('Theron'));
    expect(await control.evaluate((element) => element === document.activeElement)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await control.press('Escape');
    expect(await page.locator('.phone-character summary').evaluate((element) => element === document.activeElement)).toBe(true);
  } finally { await context.close(); }
}, 60000);

browserTest('Plan a Druid opens class-prefilled setup without adopting or editing the active character', async () => {
  const context = await session.newContext();
  try {
    await context.addInitScript((value) => { if (!localStorage.getItem('compendium.characters.v1')) localStorage.setItem('compendium.characters.v1', value); }, JSON.stringify({ ...collection, activeId: 'theron' }));
    const page = await context.newPage();
    await page.goto(`${origin}/classes/druid/`);
    await page.waitForSelector('summary[aria-label^="Active character"]', { state: 'attached' });
    const before = await page.evaluate(() => localStorage.getItem('compendium.characters.v1'));
    await page.getByRole('link', { name: 'Plan a Druid', exact: true }).click();
    await page.locator('.setup').waitFor();
    expect(await page.locator('.setup select').nth(1).inputValue()).toBe('classes:6');
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(before);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).activeId)).toBe('theron');
  } finally { await context.close(); }
}, 60000);

browserTest('item context appears only for weapon rules or level requirements with inline help', async () => {
  const context = await session.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await context.addInitScript((value) => localStorage.setItem('compendium.characters.v1', value), JSON.stringify(collection));
    const page = await context.newPage();
    await page.goto(`${origin}/items/novice-staff/`);
    await page.waitForFunction(() => document.querySelector('[data-character-context]')?.textContent?.includes('Druid can use this weapon type.'));
    expect(await page.locator('[data-character-context] .identity').textContent()).toBe('Brielle · Druid · Level 24');
    const help = page.getByRole('link', { name: 'About active character comparisons' });
    expect(await help.textContent()).toBe('?');
    expect(await help.getAttribute('href')).toBe('/planner/#help');
    expect(await page.locator('[data-character-context] p .context-help').count()).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto(`${origin}/items/gold/`);
    await page.waitForSelector('.phone-character summary[aria-label^="Active character"]', { state: 'attached' });
    expect(await page.locator('[data-character-context]').count()).toBe(0);
    await page.getByRole('link', { name: 'Adept Leather Chest', exact: true }).first().click();
    await page.waitForFunction(() => document.querySelector('[data-character-context] p')?.textContent?.includes('Brielle is level 24'));
    expect(await page.locator('[data-character-context] p').textContent()).toMatch(/Requires level \d+; Brielle is level 24\.\?/);
    expect(await page.locator('[data-character-context] p').textContent()).not.toContain('cannot');
  } finally { await context.close(); }
}, 60000);
