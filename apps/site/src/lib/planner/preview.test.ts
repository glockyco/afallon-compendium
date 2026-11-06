import { expect, test } from 'bun:test';
import { createCharacterStore, CHARACTER_STORAGE_KEY, type CharacterLocks } from './characters';
import { decodeBuildLink, encodeBuildLink, canonicalBuildJson, type BuildLinkDecodeResult } from './build-link';
import { parsePlannerBuild, type PlannerBuild } from './build';
import { bindPreviewNavigation, createPlannerPreview, type PreviewEnvironment } from './preview';
import fixture from './export.fixture.json';

const build = parsePlannerBuild(fixture.collection.characters[0]!.build);
class MemoryStorage {
  values = new Map<string, string>();
  writes: string[] = [];
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.writes.push(key); this.values.set(key, value); }
}
class SerialLocks implements CharacterLocks {
  queue: Promise<unknown> = Promise.resolve();
  request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const next = this.queue.then(callback);
    this.queue = next.catch(() => {});
    return next;
  }
}
async function workspace(options: Partial<PreviewEnvironment> = {}, noLocks = false) {
  const storage = new MemoryStorage();
  let counter = 0;
  const characters = createCharacterStore({ storage: () => storage, locks: noLocks ? undefined : new SerialLocks(), localId: () => `character-${++counter}` });
  await characters.initialize();
  await characters.newCharacter('Brielle', build);
  await characters.addCharacter('Arden', { ...build, level: 60 });
  storage.writes.length = 0;
  const copied: string[] = [];
  const preview = createPlannerPreview(characters, {
    resolve: () => ({ catalogChanged: false, unresolved: [], unevaluated: ['Gear', 'Party'] }),
    clipboard: () => ({ writeText: async text => { copied.push(text); } }),
    origin: 'https://example.test', ...options,
  });
  return { storage, characters, copied, preview };
}
async function url(value: PlannerBuild = build): Promise<URL> {
  const link = await encodeBuildLink(value);
  if (link.status !== 'ok') throw new Error(link.message);
  return new URL(link.value, 'https://example.test');
}

test('opening, editing, undoing and copying a link never touch collection or active selection', async () => {
  const { preview, characters, copied, storage } = await workspace();
  const before = characters.snapshot();
  await preview.navigate(await url());
  preview.edit({ ...build, level: 35 });
  expect(preview.snapshot().canUndo).toBe(true);
  expect(preview.snapshot().build!.level).toBe(35);
  expect(preview.undo()).toBe(true);
  expect(preview.snapshot().build).toEqual(build);
  expect(preview.undo()).toBe(false);
  const result = await preview.copyLink();
  expect(result.status).toBe('copied');
  expect(result.message).toContain('copied');
  for (const included of ['level', 'point totals', 'Heroic', 'gear', 'party', 'not encrypted', 'names']) expect(result.contents).toContain(included);
  expect(copied).toEqual([result.url!]);
  const decoded = await decodeBuildLink(new URL(copied[0]!));
  expect(decoded.status).toBe('ok');
  if (decoded.status === 'ok') expect(canonicalBuildJson(decoded.value)).toBe(canonicalBuildJson(build));
  expect(characters.snapshot()).toEqual(before);
  expect(storage.writes).toEqual([]);
});

test('save handoffs detach their input, cancellation has no adoption, Save as New does not switch active', async () => {
  const { preview, characters, storage } = await workspace();
  const active = characters.snapshot().collection.activeId;
  const incoming = { ...build };
  preview.openHandoff(incoming);
  incoming.level = 45;
  expect(preview.snapshot().build!.level).toBe(30);
  preview.captureReplacement(active!); // A cancelled confirmation never calls replace.
  expect(storage.writes).toEqual([]);
  expect((await preview.saveAsNew('Shared Hunter')).persisted).toBe(true);
  expect(characters.snapshot().collection.activeId).toBe(active);
  expect(characters.snapshot().collection.characters.at(-1)!.build).toEqual(build);
  expect(storage.writes).toEqual([CHARACTER_STORAGE_KEY]);
});

test('replacement captures name/id/revision, never follows active switch and store Undo restores full build', async () => {
  const { preview, characters, storage } = await workspace();
  preview.openHandoff({ ...build, level: 45, gear: [] });
  const original = characters.snapshot().collection.characters[0]!;
  const offer = preview.captureReplacement(original.id);
  expect(offer.label).toBe("Replace Brielle's Build");
  expect(offer.target.revision).toBe(original.revision);
  const second = characters.snapshot().collection.characters[1]!;
  await characters.switchActive(second.id);
  expect((await preview.replace(offer.target)).ok).toBe(true);
  expect(characters.snapshot().collection.activeId).toBe(second.id);
  expect(characters.snapshot().collection.characters[0]!.build.level).toBe(45);
  expect(characters.snapshot().collection.characters[1]!.build).toEqual(second.build);
  expect((await preview.undoAdoption()).ok).toBe(true);
  expect(characters.snapshot().collection.characters[0]!.build).toEqual(original.build);
  expect(characters.snapshot().collection.activeId).toBe(second.id);
  expect(storage.writes).toHaveLength(3);
});

test('stale replacements preserve the attempted draft rather than overwriting a newer build', async () => {
  const { preview, characters, storage } = await workspace();
  preview.openHandoff({ ...build, level: 45 });
  const offer = preview.captureReplacement(characters.snapshot().collection.activeId!);
  await characters.replaceBuild(characters.capture(), { ...build, level: 40 });
  storage.writes.length = 0;
  expect((await preview.replace(offer.target)).ok).toBe(false);
  expect(characters.snapshot().collection.characters[0]!.build.level).toBe(40);
  expect(characters.snapshot().preserved.at(-1)!.characters[0]!.build.level).toBe(45);
  expect(preview.snapshot().build!.level).toBe(45);
  expect(storage.writes).toEqual([]);
});

test('different-catalog unresolved keys are retained by default; omission warns and requires confirmation', async () => {
  const resolution = { catalogChanged: true, unresolved: [{ key: 'items:301', description: 'A ring from earlier game data' }], unevaluated: ['Gear', 'Party'] };
  const { preview, copied, storage } = await workspace({ resolve: () => resolution, omitUnresolved: value => ({ ...value, gear: [] }) });
  const old = { ...build, catalog: 'a'.repeat(64) };
  preview.openHandoff(old);
  expect(preview.snapshot().resolution).toEqual(resolution);
  expect(preview.snapshot().message).toContain('different game data');
  expect((await preview.copyLink()).status).toBe('copied');
  let decoded = await decodeBuildLink(new URL(copied[0]!));
  if (decoded.status !== 'ok') throw new Error('Missing copied build');
  expect(decoded.value.gear).toEqual(old.gear);
  expect(decoded.value.catalog).toBe(old.catalog);
  const warning = await preview.copyLink({ omitUnresolved: true });
  expect(warning.status).toBe('confirmation-required');
  expect(warning.message).toContain(resolution.unresolved[0]!.description);
  expect(copied).toHaveLength(1);
  const omitted = await preview.copyLink({ omitUnresolved: true, confirmOmission: true });
  expect(omitted.status).toBe('copied');
  expect(omitted.contents).toContain('omitted');
  decoded = await decodeBuildLink(new URL(copied[1]!));
  if (decoded.status !== 'ok') throw new Error('Missing copied build');
  expect(decoded.value.gear).toEqual([]);
  expect(preview.snapshot().build).toEqual(old);
  expect(storage.writes).toEqual([]);
});

test('clipboard denial/getter denial and encoder failure report failure rather than success', async () => {
  for (const clipboard of [() => { throw new Error('SecurityError'); }, () => ({ writeText: async () => { throw new Error('NotAllowedError'); } })]) {
    const { preview, storage } = await workspace({ clipboard });
    preview.openHandoff(build);
    const result = await preview.copyLink();
    expect(result.status).toBe('failed');
    expect(result.message).toContain('permissions');
    expect(storage.writes).toEqual([]);
  }
  const { preview } = await workspace({ encode: async () => ({ status: 'invalid', message: 'Build exceeds encoded size limit' }) });
  preview.openHandoff(build);
  expect((await preview.copyLink()).message).toContain('size limit');
});

test('invalid and dual-transport URLs leave collection unchanged and unsupported raw deflate explains export', async () => {
  const { preview, characters, storage } = await workspace();
  const before = characters.snapshot();
  for (const href of ['https://example.test/planner/#build=v99.abc', 'https://example.test/planner/#build=v1.???', 'https://example.test/planner/?build=a#build=v1.abc', 'https://example.test/planner/?build=a']) {
    await preview.navigate(new URL(href));
    expect(preview.snapshot().status).toBe('invalid');
  }
  expect(characters.snapshot()).toEqual(before);
  expect(storage.writes).toEqual([]);
  const unsupported = await workspace({ decode: async () => ({ status: 'unsupported', message: 'This browser does not support raw-deflate build links. You can still edit locally and export your characters.' }), encode: async () => ({ status: 'unsupported', message: 'Raw-deflate is unsupported. Export your characters.' }) });
  await unsupported.preview.navigate(new URL('https://example.test/planner/#build=v1.abc'));
  expect(unsupported.preview.snapshot().status).toBe('unsupported');
  expect(unsupported.preview.snapshot().message).toContain('raw-deflate');
  expect(unsupported.preview.snapshot().message).toContain('export');
  unsupported.preview.openHandoff(build);
  expect((await unsupported.preview.copyLink()).status).toBe('unsupported');
  expect(unsupported.storage.writes).toEqual([]);
});

test('mount/hashchange/popstate/client navigation decode changed identity once, including Back/Forward; cleanup removes listeners', async () => {
  let decodes = 0;
  const { preview, storage } = await workspace({ decode: async target => { ++decodes; return { status: 'ok', value: { ...build, level: Number(target.hash.slice(1)) } }; } });
  const host = new EventTarget() as EventTarget & { location: { href: string } };
  host.location = { href: 'https://example.test/planner/#30' };
  const dispose = bindPreviewNavigation(preview, host as unknown as Window);
  await preview.navigate(new URL(host.location.href));
  await Promise.resolve();
  expect(decodes).toBe(1);
  preview.edit({ ...build, level: 31 });
  await preview.navigate(new URL(host.location.href));
  expect(preview.snapshot().build!.level).toBe(31);
  expect(decodes).toBe(1);
  for (const level of [40, 30, 40]) {
    host.location.href = `https://example.test/planner/#${level}`;
    host.dispatchEvent(new Event('hashchange'));
    host.dispatchEvent(new Event('popstate'));
    await preview.navigate(new URL(host.location.href));
    await Promise.resolve();
    expect(preview.snapshot().build!.level).toBe(level);
    expect(preview.snapshot().canUndo).toBe(false);
  }
  expect(decodes).toBe(4);
  dispose();
  host.location.href = 'https://example.test/planner/#50';
  host.dispatchEvent(new Event('hashchange'));
  host.dispatchEvent(new Event('popstate'));
  expect(decodes).toBe(4);
  expect(storage.writes).toEqual([]);
});

test('a late decode cannot overwrite later navigation, a save handoff or a disposed workspace', async () => {
  let release!: (value: BuildLinkDecodeResult) => void;
  const { preview } = await workspace({ decode: () => {
    const deferred = Promise.withResolvers<BuildLinkDecodeResult>();
    release = deferred.resolve;
    return deferred.promise;
  } });
  const pending = preview.navigate(new URL('https://example.test/planner/#old'));
  preview.openHandoff({ ...build, level: 50 });
  release({ status: 'ok', value: build });
  await pending;
  expect(preview.snapshot().build!.level).toBe(50);
  const second = preview.navigate(new URL('https://example.test/planner/#new'));
  preview.cancelNavigation();
  release({ status: 'ok', value: build });
  await second;
  expect(preview.snapshot().build!.level).toBe(50);
  const resolvers: ((value: BuildLinkDecodeResult) => void)[] = [];
  const latest = await workspace({ decode: () => {
    const deferred = Promise.withResolvers<BuildLinkDecodeResult>();
    resolvers.push(deferred.resolve);
    return deferred.promise;
  } });
  const oldNavigation = latest.preview.navigate(new URL('https://example.test/planner/#one'));
  const newNavigation = latest.preview.navigate(new URL('https://example.test/planner/#two'));
  resolvers[1]!({ status: 'ok', value: { ...build, level: 60 } });
  await newNavigation;
  resolvers[0]!({ status: 'ok', value: build });
  await oldNavigation;
  expect(latest.preview.snapshot().build!.level).toBe(60);
});

test('no-lock tab-only collection remains isolated, editable and explicitly adoptable', async () => {
  const { preview, characters, storage } = await workspace({}, true);
  await preview.navigate(await url());
  preview.edit({ ...build, level: 40 });
  expect((await preview.saveAsNew('Tab Preview')).persisted).toBe(false);
  expect(characters.snapshot().collection.characters.at(-1)!.build.level).toBe(40);
  expect(characters.snapshot().persistence.kind).toBe('not-saved');
  expect(storage.writes).toEqual([]);
});
