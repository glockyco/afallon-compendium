import { afterAll, beforeAll, expect, test } from 'bun:test';
import { chromium, type Browser, type Page } from 'playwright-core';
import { deflateRawSync } from 'node:zlib';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { canonicalBuildJson } from '../build-link';
import type { PlannerBuild } from '../build';

declare global {
  interface Window { plannerCharacterWrites: string[] }
}

const origin = process.env.COMPENDIUM_BROWSER_TEST_URL;
const browserTest = test.skipIf(!origin);
let browser: Browser;
beforeAll(async () => {
  if (!origin) return;
  browser = process.env.CHROMIUM_CDP_URL ? await chromium.connectOverCDP(process.env.CHROMIUM_CDP_URL)
    : await chromium.launch({ ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}) });
}, 60000);
afterAll(async () => { if (browser && !process.env.CHROMIUM_CDP_URL) await browser.close(); });
const build: PlannerBuild = { catalog: 'd5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15', class: 'classes:7', race: 'races:1', level: 30, points: [], talents: { kind: 'ordered', purchases: [] }, heroic: [], gear: [], party: { role: null, members: [] } };
const collection = { version: 1, revision: 2, characters: [{ id: 'first', name: 'First', revision: 1, build }, { id: 'second', name: 'Second', revision: 2, build: { ...build, level: 20 } }], activeId: 'first', draft: null, migratedCharacterLevel: true };
async function ready(page: Page) {
  await page.getByRole('button', { name: 'New Character', exact: true }).waitFor({ timeout: 60000 });
  await page.locator('.summary').waitFor({ timeout: 60000 });
}
async function settled(page: Page) {
  // Rank rendering is optimistic; the next action waits for the acknowledged transaction, not a timer.
  await page.waitForFunction(() => document.querySelector('.top-actions button[aria-disabled]')?.getAttribute('aria-disabled') === 'false');
}

for (const width of [1440, 1100, 390]) {
  browserTest(`${width}px: web/list allocation, reversal, keyboard focus, scroll and reflow`, async () => {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1050 } });
    try {
      await context.addInitScript(value => { if (!localStorage.getItem('compendium.characters.v1')) localStorage.setItem('compendium.characters.v1', value); }, JSON.stringify(collection));
      const page = await context.newPage();
      const response = await page.goto(`${origin}/planner/`);
      expect(await response!.text()).not.toContain('First');
      await ready(page);
      await page.getByRole('tab', { name: 'Talents', exact: true }).click();
      const talent = page.getByRole('link', { name: 'Barbed Fletching, Packwarden, tier 2', exact: true });
      await talent.focus(); await talent.press('Enter');
      expect(await page.locator('.inspector').textContent()).toContain('Preview · Verified');
      const add = page.getByRole('button', { name: 'Add a rank of Barbed Fletching', exact: true });
      await add.focus();
      const before = await page.evaluate(() => ({ y: scrollY, view: document.querySelector('.canvas svg')!.getAttribute('viewBox') }));
      await add.press('Enter');
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 1 of 3'));
      await settled(page);
      expect(await add.evaluate(element => element === document.activeElement)).toBe(true);
      expect(await page.evaluate(() => ({ y: scrollY, view: document.querySelector('.canvas svg')!.getAttribute('viewBox') }))).toEqual(before);
      expect(await page.locator('.ledger').textContent()).toContain('Earliest level 1');
      const remove = page.getByRole('button', { name: 'Remove a rank of Barbed Fletching', exact: true });
      await remove.focus(); await remove.press('Enter');
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 0 of 3'));
      await settled(page);
      expect(await remove.evaluate(element => element === document.activeElement)).toBe(true);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 1 of 3'));
      await settled(page);
      await page.getByRole('button', { name: 'Reset Tree', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 0 of 3'));
      await settled(page);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 1 of 3'));
      await settled(page);
      await page.getByRole('button', { name: 'Reset Build', exact: true }).click();
      expect(await page.locator('.inspector').textContent()).toContain('Selected rank 1 of 3');
      await page.getByRole('button', { name: 'Confirm Reset Build', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 0 of 3'));
      await settled(page);
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.inspector')?.textContent?.includes('Selected rank 1 of 3'));
      await settled(page);
      await page.getByRole('button', { name: 'Close Confirmation', exact: true }).click();
      await page.locator('.level-view > summary').click();
      await page.getByLabel('Show the ordered prefix at this level', { exact: true }).check();
      await page.getByLabel('Projection Level', { exact: true }).focus();
      await page.getByLabel('Projection Level', { exact: true }).press('End');
      expect(await page.getByLabel('Projection Level', { exact: true }).inputValue()).toBe('60');
      await page.getByLabel('Show the ordered prefix at this level', { exact: true }).uncheck();
      await page.locator('.level-view > summary').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const screens = resolve('local/planner-ui-screens'); await mkdir(screens, { recursive: true });
      await page.screenshot({ path: resolve(screens, `talents-${width}.png`), fullPage: true });
      await page.getByRole('tab', { name: 'List', exact: true }).click();
      await page.getByRole('button', { name: 'Shared Instinct', exact: true }).click();
      expect(await page.locator('.inspector').textContent()).toContain('Purchase Requirements');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: resolve(screens, `talent-list-${width}.png`), fullPage: true });
    } finally { await context.close(); }
  }, 120000);
}

browserTest('character setup, complete duplication, rename, explicit survivor and delete Undo', async () => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage(); await page.goto(`${origin}/planner/?new=1`);
    await page.locator('form.setup').waitFor({ timeout: 60000 });
    await page.locator('form.setup').getByLabel('Name', { exact: true }).fill('Named Hunter');
    await page.getByLabel('Class', { exact: true }).selectOption('classes:7');
    await page.locator('form.setup').getByRole('button', { name: 'Create Character', exact: true }).click(); await ready(page);
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.summary h2')?.textContent === 'Named Hunter Copy');
    await page.getByLabel('Name', { exact: true }).fill('Another Plan');
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.summary h2')?.textContent === 'Another Plan');
    await page.getByRole('button', { name: 'Delete Character', exact: true }).click();
    expect(await page.getByRole('button', { name: 'Confirm Delete', exact: true }).isDisabled()).toBe(true);
    const original = await page.getByLabel('Surviving Active Character', { exact: true }).locator('option').nth(1).getAttribute('value');
    await page.getByLabel('Surviving Active Character', { exact: true }).selectOption(original!);
    await page.getByRole('button', { name: 'Confirm Delete', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.summary h2')?.textContent === 'Named Hunter');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.summary h2')?.textContent === 'Another Plan');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!));
    expect(saved.characters).toHaveLength(2); expect(saved.characters[0].build).toEqual(saved.characters[1].build);
  } finally { await context.close(); }
}, 120000);

browserTest('preview navigation/edit/copy/cancel write nothing; adoption names its captured target and reverses', async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  try {
    await context.addInitScript(value => { if (!localStorage.getItem('compendium.characters.v1')) localStorage.setItem('compendium.characters.v1', value); }, JSON.stringify(collection));
    const page = await context.newPage();
    const link = `${origin}/planner/#build=v1.${deflateRawSync(canonicalBuildJson({ ...build, level: 42 })).toString('base64url')}`;
    await page.goto(link); await ready(page);
    const before = await page.evaluate(() => localStorage.getItem('compendium.characters.v1'));
    await page.getByLabel('Character Level', { exact: true }).fill('43'); await page.getByLabel('Character Level', { exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Copy Link', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.feedback')?.textContent?.includes('copied'));
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(before);
    await page.getByLabel('Character to Replace', { exact: true }).selectOption('first');
    await page.getByRole('button', { name: 'Cancel Replacement', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(before);
    await page.getByLabel('Character to Replace', { exact: true }).selectOption('first');
    // A foreign active switch must not change the captured replacement target.
    await page.evaluate(() => { const value = JSON.parse(localStorage.getItem('compendium.characters.v1')!); value.activeId = 'second'; value.revision++; const encoded = JSON.stringify(value); localStorage.setItem('compendium.characters.v1', encoded); window.dispatchEvent(new StorageEvent('storage', { key: 'compendium.characters.v1', newValue: encoded })); });
    await page.getByRole('button', { name: "Replace First's Build", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).characters.find((row: { id: string }) => row.id === 'first').build.level === 43);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).activeId)).toBe('second');
    await page.getByRole('button', { name: 'Undo Adoption', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).characters.find((row: { id: string }) => row.id === 'first').build.level === 30);
    await page.getByLabel('New Character Name', { exact: true }).fill('Saved Preview');
    await page.getByRole('button', { name: 'Save as New Character', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).characters.length === 3);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).activeId)).toBe('second');
    const adopted = await page.evaluate(() => localStorage.getItem('compendium.characters.v1'));
    await page.goto(`${origin}/planner/#build=v1.invalid`); await ready(page);
    expect(await page.getByRole('heading', { name: 'Build Link Could Not Be Opened', exact: true }).isVisible()).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(adopted);
  } finally { await context.close(); }
}, 120000);

browserTest('export all characters, import diff/cancellation and one confirmed complete replacement', async () => {
  const context = await browser.newContext({ acceptDownloads: true });
  try {
    await context.addInitScript(value => { if (!localStorage.getItem('compendium.characters.v1')) localStorage.setItem('compendium.characters.v1', value); }, JSON.stringify(collection));
    const page = await context.newPage(); await page.goto(`${origin}/planner/`); await ready(page);
    const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export All Characters', exact: true }).click();
    expect((await download).suggestedFilename()).toBe('afallon-compendium-characters.json');
    const transfer = { format: 'afallon-compendium.characters', version: 1, collection: { ...collection, characters: [{ ...collection.characters[0], name: 'Imported First', build: { ...build, level: 44 } }], activeId: 'first' }, preserved: [] };
    const file = { name: 'characters.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(transfer)) };
    const before = await page.evaluate(() => localStorage.getItem('compendium.characters.v1'));
    await page.locator('input[type="file"]').setInputFiles(file);
    await page.getByRole('heading', { name: 'Import Preview', exact: true }).waitFor();
    expect(await page.locator('.character-view').textContent()).toContain('Level 30 → 44');
    await page.getByRole('button', { name: 'Cancel Import', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(before);
    await page.locator('input[type="file"]').setInputFiles(file);
    await page.getByLabel('Action', { exact: true }).selectOption('replace');
    await page.getByLabel('Active Character After Import', { exact: true }).selectOption('local:second');
    await page.getByRole('button', { name: 'Review Changes', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm Import', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!).characters[0].name === 'Imported First');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.characters.v1')!));
    expect(stored.activeId).toBe('second'); expect(stored.characters[0].build.level).toBe(44); expect(stored.characters[1]).toEqual(collection.characters[1]);
  } finally { await context.close(); }
}, 120000);

browserTest('legacy-only hydration and preview editing/copying are read-only until explicit adoption', async () => {
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  try {
    await context.addInitScript(() => {
      if (!localStorage.getItem('compendium.reader-levels.v1')) localStorage.setItem('compendium.reader-levels.v1', JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 }));
      const original = Storage.prototype.setItem;
      Object.assign(window, { plannerCharacterWrites: [] as string[] });
      Storage.prototype.setItem = function (key, value) {
        if (key === 'compendium.characters.v1' || key === 'compendium.reader-levels.v1') window.plannerCharacterWrites.push(key);
        original.call(this, key, value);
      };
    });
    const page = await context.newPage();
    await page.goto(`${origin}/planner/#build=v1.${deflateRawSync(canonicalBuildJson(build)).toString('base64url')}`);
    await ready(page);
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBeNull();
    expect(await page.evaluate(() => window.plannerCharacterWrites)).toEqual([]);
    await page.getByLabel('Character Level', { exact: true }).fill('31');
    await page.getByLabel('Character Level', { exact: true }).press('Enter');
    await page.getByRole('button', { name: 'Copy Link', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.feedback')?.textContent?.includes('copied'));
    expect(await page.evaluate(() => window.plannerCharacterWrites)).toEqual([]);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.reader-levels.v1')!))).toEqual({ character: 42, 'skill:a': 9, 'skill:b': 17 });
    await page.getByLabel('New Character Name', { exact: true }).fill('Adopted Preview');
    await page.getByRole('button', { name: 'Save as New Character', exact: true }).click();
    await page.waitForFunction(() => localStorage.getItem('compendium.characters.v1') !== null);
    await settled(page);
    expect(await page.evaluate(() => window.plannerCharacterWrites)).toEqual(['compendium.characters.v1', 'compendium.reader-levels.v1']);
    const envelope = await page.evaluate(() => localStorage.getItem('compendium.characters.v1'));
    expect(JSON.parse(envelope!).migratedCharacterLevel).toBe(true);
    expect(JSON.parse(envelope!).characters[0].build.level).toBe(31);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('compendium.reader-levels.v1')!))).toEqual({ 'skill:a': 9, 'skill:b': 17 });
    await page.reload(); await ready(page);
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBe(envelope);
    expect(await page.evaluate(() => window.plannerCharacterWrites)).toEqual([]);
  } finally { await context.close(); }
}, 120000);

browserTest('tab-only adoption reports not saved and exports the edited preview without locks', async () => {
  const context = await browser.newContext({ acceptDownloads: true });
  try {
    await context.addInitScript(() => Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }));
    const page = await context.newPage();
    await page.goto(`${origin}/planner/#build=v1.${deflateRawSync(canonicalBuildJson(build)).toString('base64url')}`);
    await ready(page);
    expect(await page.locator('.summary').textContent()).toContain('Not saved in this browser');
    await page.getByLabel('Character Level', { exact: true }).fill('31');
    await page.getByLabel('Character Level', { exact: true }).press('Enter');
    await page.getByLabel('New Character Name', { exact: true }).fill('Tab-Only Preview');
    await page.getByRole('button', { name: 'Save as New Character', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.feedback')?.textContent?.includes('Not saved in this browser'));
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBeNull();
    expect(await page.locator('.summary').textContent()).not.toContain('Saved in this browser');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export All Characters', exact: true }).click();
    const path = await (await download).path();
    expect(path).not.toBeNull();
    const backup = await Bun.file(path!).json();
    expect(backup.collection.characters[0].name).toBe('Tab-Only Preview');
    expect(backup.collection.characters[0].build.level).toBe(31);
  } finally { await context.close(); }
}, 120000);

browserTest('unsupported compression explains the limitation without touching characters', async () => {
  const context = await browser.newContext();
  try {
    await context.addInitScript(() => Object.defineProperty(window, 'DecompressionStream', { value: undefined, configurable: true }));
    const page = await context.newPage();
    await page.goto(`${origin}/planner/#build=v1.${deflateRawSync(canonicalBuildJson(build)).toString('base64url')}`);
    const error = page.getByRole('region', { name: 'Build Link Could Not Be Opened', exact: true });
    await error.waitFor({ timeout: 60000 });
    expect(await error.textContent()).toContain('This browser does not support raw-deflate build links');
    expect(await page.evaluate(() => localStorage.getItem('compendium.characters.v1'))).toBeNull();
    await page.getByRole('button', { name: 'New Character', exact: true }).click();
    expect(await page.getByLabel('Class', { exact: true }).isVisible()).toBe(true);
  } finally { await context.close(); }
}, 120000);
