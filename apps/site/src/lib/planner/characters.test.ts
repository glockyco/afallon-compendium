import { expect, test } from 'bun:test';
import { activeCharacter, characterLevel, displayedCharacterLevel, CHARACTER_STORAGE_KEY, LEGACY_LEVEL_STORAGE_KEY, createCharacterStore, emptyCollection, parseCharacterCollection, type CharacterCollection, type CharacterLocks } from './characters';
import type { PlannerBuild } from './build';

const build = (level = 30): PlannerBuild => ({
  catalog: 'd5b0b4b3e2161010e0de6fff10a2be305063990eb7c139080a9eb844edee0e15', class: 'classes:7', race: 'races:1', level,
  points: [{ type: 'treePoints:2', total: 345 }],
  talents: { kind: 'ordered', purchases: [{ tree: 'talentTrees:29', node: 1 }, { tree: 'talentTrees:30', node: 2 }, { tree: 'talentTrees:29', node: 1 }] },
  heroic: [{ tree: 'talentTrees:32', node: 0, rank: 2 }],
  gear: [{ placement: 'ring', item: 'items:301', heroic: true, corruption: 60, rolls: [{ index: 0, value: 22.5 }], gems: [{ socket: 0, item: 'items:2' }], enchantment: { item: 'items:3', tier: 0 } }],
  party: { role: 'damage', members: [{ kind: 'adventurer', npc: 'npcs:5', level: null }] },
});
class MemoryStorage {
  values = new Map<string, string>();
  writes: string[] = [];
  denied = false;
  failingKey: string | null = null;
  getItem(key: string): string | null { if (this.denied) throw new Error('SecurityError'); return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { if (this.failingKey === key) throw new Error('QuotaExceededError'); this.writes.push(key); this.values.set(key, value); }
}
class SerialLocks implements CharacterLocks {
  queue: Promise<unknown> = Promise.resolve();
  request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const next = this.queue.then(callback);
    this.queue = next.catch(() => {});
    return next;
  }
}
function environment(storage = new MemoryStorage(), locks: CharacterLocks | undefined = new SerialLocks()) {
  let counter = 0;
  return { storage, locks, store: createCharacterStore({ storage: () => storage, locks, localId: () => `local-${++counter}` }) };
}
async function seeded() {
  const fixture = environment();
  await fixture.store.initialize();
  await fixture.store.newCharacter('Brielle', build());
  await fixture.store.addCharacter('Arden', build(60));
  return fixture;
}
const saved = (storage: MemoryStorage) => parseCharacterCollection(JSON.parse(storage.getItem(CHARACTER_STORAGE_KEY)!));

test('a complete duplicate is isolated, rename edits only metadata, and switch does not edit builds', async () => {
  const { store } = await seeded();
  const original = store.snapshot().collection.characters[0]!;
  await store.duplicate(store.capture(original.id), 'Brielle Copy');
  const duplicated = activeCharacter(store.snapshot().collection)!;
  expect(duplicated.id).not.toBe(original.id);
  expect(duplicated.build).toEqual(original.build);
  await store.replaceBuild(store.capture(), { ...duplicated.build, level: 31, party: { role: 'tank', members: [] } });
  expect(store.snapshot().collection.characters[0]!.build).toEqual(original.build);
  const copyBuild = activeCharacter(store.snapshot().collection)!.build;
  await store.rename(store.capture(), 'Renamed');
  expect(activeCharacter(store.snapshot().collection)!.build).toEqual(copyBuild);
  const before = store.snapshot().collection.characters;
  await store.switchActive(original.id);
  expect(store.snapshot().collection.characters).toEqual(before);
});

test('deleting active requires deliberate surviving selection and Undo restores the edited copy and prior active ID', async () => {
  const { store } = await seeded();
  const survivor = store.snapshot().collection.characters[0]!.id;
  await store.duplicate(store.capture(), 'Edited Copy');
  await store.replaceBuild(store.capture(), { ...build(), level: 45 });
  const before = store.snapshot().collection;
  expect((await store.deleteCharacter(store.capture(), null)).ok).toBe(false);
  expect(store.snapshot().collection).toEqual(before);
  expect((await store.deleteCharacter(store.capture(), survivor)).ok).toBe(true);
  expect(store.snapshot().collection.activeId).toBe(survivor);
  expect((await store.undo()).ok).toBe(true);
  expect(store.snapshot().collection.activeId).toBe(before.activeId);
  expect(activeCharacter(store.snapshot().collection)!.build.level).toBe(45);
  expect(store.snapshot().collection.characters.map(({ revision: _revision, ...entry }) => entry)).toEqual(before.characters.map(({ revision: _revision, ...entry }) => entry));
});

test('the last deletion has no active character and later New Character never reuses a migrated level', async () => {
  const fixture = environment();
  fixture.storage.values.set(LEGACY_LEVEL_STORAGE_KEY, JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 }));
  await fixture.store.initialize();
  expect(characterLevel(fixture.store.snapshot().collection)).toBe(42);
  await fixture.store.newCharacter('Fresh', build(1));
  await fixture.store.deleteCharacter(fixture.store.capture(), null);
  expect(fixture.store.snapshot().collection.activeId).toBeNull();
  expect(fixture.store.snapshot().collection.characters).toEqual([]);
  await fixture.store.newCharacter('Another', build(2));
  expect(characterLevel(fixture.store.snapshot().collection)).toBe(2);
  expect(fixture.store.snapshot().collection.migratedCharacterLevel).toBe(true);
});

test('migration writes state and marker before cleanup, preserves every skill, and does not repeat on reload', async () => {
  const { store, storage, locks } = environment();
  storage.values.set(LEGACY_LEVEL_STORAGE_KEY, JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 }));
  await store.initialize();
  expect(storage.writes).toEqual([CHARACTER_STORAGE_KEY, LEGACY_LEVEL_STORAGE_KEY]);
  expect(saved(storage).draft).toEqual({ level: 42, revision: 1 });
  expect(saved(storage).characters).toEqual([]);
  expect(JSON.parse(storage.getItem(LEGACY_LEVEL_STORAGE_KEY)!)).toEqual({ 'skill:a': 9, 'skill:b': 17 });
  const reload = createCharacterStore({ storage: () => storage, locks });
  await reload.initialize();
  expect(reload.snapshot().collection).toEqual(store.snapshot().collection);
  expect(storage.writes).toHaveLength(2);
});

test('failed migration write retains legacy data and an interrupted cleanup is idempotent', async () => {
  const first = environment();
  const old = JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 });
  first.storage.values.set(LEGACY_LEVEL_STORAGE_KEY, old);
  first.storage.failingKey = CHARACTER_STORAGE_KEY;
  await first.store.initialize();
  expect(first.storage.getItem(LEGACY_LEVEL_STORAGE_KEY)).toBe(old);
  expect(first.storage.getItem(CHARACTER_STORAGE_KEY)).toBeNull();
  expect(first.store.snapshot().persistence.kind).toBe('not-saved');
  expect(characterLevel(first.store.snapshot().collection)).toBe(42);
  first.storage.failingKey = LEGACY_LEVEL_STORAGE_KEY;
  const retry = createCharacterStore({ storage: () => first.storage, locks: first.locks });
  await retry.initialize();
  expect(saved(first.storage).migratedCharacterLevel).toBe(true);
  expect(first.storage.getItem(LEGACY_LEVEL_STORAGE_KEY)).toBe(old);
  const revision = saved(first.storage).revision;
  first.storage.failingKey = null;
  const reload = createCharacterStore({ storage: () => first.storage, locks: first.locks });
  await reload.initialize();
  expect(saved(first.storage).revision).toBe(revision);
  expect(JSON.parse(first.storage.getItem(LEGACY_LEVEL_STORAGE_KEY)!)).toEqual({ 'skill:a': 9, 'skill:b': 17 });
});

test('existing characters or draft prevent a second legacy migration', async () => {
  for (const collection of [
    { ...emptyCollection(), revision: 2, draft: { level: 15, revision: 2 } },
    { ...emptyCollection(), revision: 2, activeId: 'one', characters: [{ id: 'one', name: 'One', revision: 2, build: build(23) }] },
  ] satisfies CharacterCollection[]) {
    const { store, storage } = environment();
    storage.values.set(CHARACTER_STORAGE_KEY, JSON.stringify(collection));
    storage.values.set(LEGACY_LEVEL_STORAGE_KEY, JSON.stringify({ character: 42 }));
    await store.initialize();
    expect(store.snapshot().collection).toEqual(collection);
    expect(storage.writes).toHaveLength(0);
  }
});

test('storage getter denial, getItem denial, malformed envelopes and unavailable locks use editable tab memory', async () => {
  for (const denial of ['getter', 'read', 'malformed', 'locks']) {
    const storage = new MemoryStorage();
    if (denial === 'read') storage.denied = true;
    if (denial === 'malformed') storage.values.set(CHARACTER_STORAGE_KEY, '{"version":99}');
    const store = createCharacterStore({ storage: () => { if (denial === 'getter') throw new Error('SecurityError'); return storage; }, locks: denial === 'locks' ? undefined : new SerialLocks(), localId: () => 'local' });
    await store.initialize();
    expect(store.snapshot().persistence.kind).toBe('not-saved');
    expect((await store.newCharacter('Tab Character', build())).persisted).toBe(false);
    expect(activeCharacter(store.snapshot().collection)!.name).toBe('Tab Character');
    expect(store.snapshot().persistence.message).toContain('Not saved in this browser');
    expect(storage.writes).toHaveLength(0);
  }
});

test('write failure retains the entire edited build and never acknowledges it as saved', async () => {
  const { store, storage } = await seeded();
  const previous = storage.getItem(CHARACTER_STORAGE_KEY);
  storage.failingKey = CHARACTER_STORAGE_KEY;
  expect(await store.replaceBuild(store.capture(), build(40))).toEqual({ ok: true, persisted: false });
  expect(store.snapshot().persistence.kind).toBe('not-saved');
  expect(store.snapshot().persistence.revision).toBeNull();
  expect(activeCharacter(store.snapshot().collection)!.build).toEqual(build(40));
  expect(storage.getItem(CHARACTER_STORAGE_KEY)).toBe(previous);
  await store.rename(store.capture(), 'Still Editable');
  expect(activeCharacter(store.snapshot().collection)!.name).toBe('Still Editable');
});

test('simultaneous different-character transactions merge, same-character stale edits preserve conflicting drafts', async () => {
  const { store: first, storage, locks } = await seeded();
  const second = createCharacterStore({ storage: () => storage, locks });
  await second.initialize();
  const one = first.snapshot().collection.characters[0]!.id;
  const two = first.snapshot().collection.characters[1]!.id;
  const results = await Promise.all([first.replaceBuild(first.capture(one), build(31)), second.replaceBuild(second.capture(two), build(59))]);
  expect(results.every((result) => result.persisted)).toBe(true);
  expect(saved(storage).characters.map((entry) => entry.build.level)).toEqual([31, 59]);
  const third = createCharacterStore({ storage: () => storage, locks });
  const fourth = createCharacterStore({ storage: () => storage, locks });
  await Promise.all([third.initialize(), fourth.initialize()]);
  const accepted = third.capture(one);
  const stale = fourth.capture(one);
  const writesBefore = storage.writes.length;
  const concurrent = await Promise.all([third.replaceBuild(accepted, build(32)), fourth.replaceBuild(stale, build(33))]);
  expect(concurrent.map((result) => result.ok)).toEqual([true, false]);
  expect(storage.writes.length - writesBefore).toBe(1);
  expect(saved(storage).characters[0]!.build.level).toBe(32);
  expect(fourth.snapshot().persistence.kind).toBe('conflict');
  expect(fourth.snapshot().preserved[0]!.characters[0]!.build.level).toBe(33);
});

test('captured level actions never retarget after a switch; explicit replacement still names its original character', async () => {
  const { store: first, storage, locks } = await seeded();
  const second = createCharacterStore({ storage: () => storage, locks });
  await second.initialize();
  const target = first.captureLevel();
  const original = first.capture();
  const two = first.snapshot().collection.characters[1]!.id;
  await second.switchActive(two);
  expect((await first.setLevel(target, 35)).ok).toBe(false);
  expect(saved(storage).characters.map((entry) => entry.build.level)).toEqual([30, 60]);
  expect(first.snapshot().preserved[0]!.characters[0]!.build.level).toBe(35);
  expect((await first.replaceBuild(original, build(36))).ok).toBe(true);
  expect(saved(storage).activeId).toBe(two);
  expect(saved(storage).characters.map((entry) => entry.build.level)).toEqual([36, 60]);
});

test('a remote event before a delayed action preserves the captured draft rather than the later active build', async () => {
  const { store: first, storage, locks } = await seeded();
  const second = createCharacterStore({ storage: () => storage, locks });
  await second.initialize();
  const target = first.captureLevel();
  await second.switchActive(second.snapshot().collection.characters[1]!.id);
  first.receiveStorage(CHARACTER_STORAGE_KEY, storage.getItem(CHARACTER_STORAGE_KEY));
  expect((await first.setLevel(target, 35)).ok).toBe(false);
  expect(first.snapshot().preserved.at(-1)!.characters[0]!.build.level).toBe(35);
  expect(characterLevel(first.snapshot().collection)).toBe(60);
});

test('foreign updates and removal are read-only, reject stale event revisions, and retain tab work for export', async () => {
  const { store, storage } = await seeded();
  const collection = store.snapshot().collection;
  const writes = storage.writes.length;
  store.receiveStorage(CHARACTER_STORAGE_KEY, JSON.stringify({ ...collection, revision: collection.revision + 1, activeId: collection.characters[1]!.id }));
  expect(characterLevel(store.snapshot().collection)).toBe(60);
  store.receiveStorage(CHARACTER_STORAGE_KEY, JSON.stringify(collection));
  expect(characterLevel(store.snapshot().collection)).toBe(60);
  store.receiveStorage('other', null);
  expect(characterLevel(store.snapshot().collection)).toBe(60);
  store.receiveStorage(null, null);
  expect(store.snapshot().collection.activeId).toBeNull();
  expect(store.snapshot().preserved.at(-1)!.characters).toHaveLength(2);
  expect(store.snapshot().persistence.kind).toBe('not-saved');
  expect(storage.writes).toHaveLength(writes);
});

test('queued changes from a held control serialize our own revisions but never rebase a foreign edit', async () => {
  const { store, storage, locks } = await seeded();
  const target = store.captureLevel();
  const results = await Promise.all([store.setLevel(target, 31, true), store.setLevel(target, 32, true), store.setLevel(target, 33, true)]);
  expect(results.every((result) => result.ok)).toBe(true);
  expect(characterLevel(saved(storage))).toBe(33);
  const other = createCharacterStore({ storage: () => storage, locks });
  await other.initialize();
  await other.setLevel(other.captureLevel(), 50);
  expect((await store.setLevel(target, 34, true)).ok).toBe(false);
  expect(characterLevel(saved(storage))).toBe(50);
});

test('collection parser enforces identities, complete builds, revisions, active selection and unknown fields', () => {
  const valid: CharacterCollection = { ...emptyCollection(), revision: 1, characters: [{ id: 'one', name: 'One', revision: 1, build: build() }], activeId: 'one' };
  expect(parseCharacterCollection(valid)).toEqual(valid);
  for (const invalid of [
    { ...valid, activeId: null }, { ...valid, activeId: 'absent' }, { ...valid, characters: [] },
    { ...valid, extra: true }, { ...valid, revision: Number.MAX_SAFE_INTEGER + 1 },
    { ...valid, characters: [valid.characters[0], valid.characters[0]] },
    { ...valid, characters: [{ ...valid.characters[0], revision: 2 }] },
    { ...valid, characters: [{ ...valid.characters[0], build: { ...build(), party: { role: 'damage', members: [{ npc: 'npcs:5' }] } } }] },
    { ...valid, draft: { level: 0, revision: 1 } },
  ]) expect(() => parseCharacterCollection(invalid)).toThrow();
});

test('page bounds clamp comparison display without writing or normalizing the active build or classless draft', async () => {
  const { store, storage } = await seeded();
  await store.switchActive(store.snapshot().collection.characters[1]!.id);
  const writes = storage.writes.length;
  expect(displayedCharacterLevel(characterLevel(store.snapshot().collection), 1, 30)).toBe(30);
  expect(characterLevel(store.snapshot().collection)).toBe(60);
  expect(characterLevel(saved(storage))).toBe(60);
  expect(storage.writes).toHaveLength(writes);
  const setup = environment();
  await setup.store.initialize();
  await setup.store.setLevel(setup.store.captureLevel(), 60);
  const draftWrites = setup.storage.writes.length;
  expect(displayedCharacterLevel(characterLevel(setup.store.snapshot().collection), 1, 20)).toBe(20);
  expect(characterLevel(setup.store.snapshot().collection)).toBe(60);
  expect(setup.storage.writes).toHaveLength(draftWrites);
  expect(displayedCharacterLevel(undefined, 1, 20)).toBeUndefined();
});

test('without locks a legacy value remains a classless tab draft and both storage keys are untouched', async () => {
  const storage = new MemoryStorage();
  const old = JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 });
  storage.values.set(LEGACY_LEVEL_STORAGE_KEY, old);
  const store = createCharacterStore({ storage: () => storage });
  await store.initialize();
  expect(characterLevel(store.snapshot().collection)).toBe(42);
  expect(store.snapshot().collection.characters).toEqual([]);
  expect(storage.getItem(LEGACY_LEVEL_STORAGE_KEY)).toBe(old);
  expect(storage.getItem(CHARACTER_STORAGE_KEY)).toBeNull();
  expect(storage.writes).toHaveLength(0);
});

test('a confirmed import replaces the roster atomically and revisions change only with character content', async () => {
  const { store, storage } = await seeded();
  const before = store.snapshot().collection;
  const unchanged = before.characters[0]!;
  const changed = before.characters[1]!;
  const writes = storage.writes.length;
  const result = await store.applyImport(before.revision, [
    { id: unchanged.id, name: unchanged.name, build: unchanged.build },
    { id: changed.id, name: 'Renamed on Import', build: build(55) },
    { id: 'imported', name: 'Imported', build: build(45) },
  ], 'imported');
  expect(result).toEqual({ ok: true, persisted: true });
  expect(storage.writes.length - writes).toBe(1);
  const imported = saved(storage);
  expect(imported.activeId).toBe('imported');
  expect(imported.characters.map((entry) => entry.revision)).toEqual([unchanged.revision, imported.revision, imported.revision]);
  expect(imported.characters[0]).toEqual(unchanged);
  expect(imported.characters[1]!.build).toEqual(build(55));
  expect((await store.undo()).ok).toBe(true);
  const undone = saved(storage);
  expect(undone.activeId).toBe(before.activeId);
  expect(undone.characters[0]).toEqual(unchanged);
  expect(undone.characters[1]!.name).toBe(changed.name);
  expect(undone.characters[1]!.build).toEqual(changed.build);
  expect(undone.characters[1]!.revision).toBe(undone.revision);
});

test('invalid imports reject the entire roster, active choice, draft or retained collection before any write', async () => {
  const { store, storage } = await seeded();
  const before = store.snapshot();
  const existing = before.collection.characters[0]!;
  const entry = { id: existing.id, name: existing.name, build: existing.build };
  const writes = storage.writes.length;
  for (const roster of [
    [entry, entry],
    [entry, { id: 'bad', name: 'Bad', build: { ...build(), level: 0 } }],
    [{ ...entry, extra: true }],
  ]) expect(() => store.applyImport(before.collection.revision, roster, entry.id)).toThrow();
  expect(() => store.applyImport(before.collection.revision, [entry], 'absent')).toThrow();
  expect(() => store.applyImport(Number.MAX_SAFE_INTEGER, [entry], entry.id)).toThrow();
  expect(() => store.applyImport(before.collection.revision, [entry], entry.id, { draft: { level: 0, revision: 1 } })).toThrow();
  expect(() => store.applyImport(before.collection.revision, [entry], entry.id, { preserved: [{ ...emptyCollection(), activeId: 'absent' }] })).toThrow();
  expect(storage.writes).toHaveLength(writes);
  expect(store.snapshot()).toEqual(before);
});

test('import checks the reviewed collection revision inside the lock and preserves accepted foreign edits', async () => {
  const { store, storage, locks } = await seeded();
  const before = store.snapshot().collection;
  const other = createCharacterStore({ storage: () => storage, locks });
  await other.initialize();
  await other.rename(other.capture(), 'Changed Elsewhere');
  const writes = storage.writes.length;
  const result = await store.applyImport(before.revision, [{ id: 'imported', name: 'Imported', build: build(45) }], 'imported');
  expect(result.ok).toBe(false);
  expect(result.reason).toContain('after import was reviewed');
  expect(storage.writes).toHaveLength(writes);
  expect(saved(storage).characters[0]!.name).toBe('Changed Elsewhere');
  expect(saved(storage).characters).toHaveLength(2);
  expect(store.snapshot().preserved.at(-1)!.characters[0]!.id).toBe('imported');
});

test('import detaches input, retains setup and conflict drafts in tab memory, and Undo reverses their adoption', async () => {
  const { store, storage } = await seeded();
  const before = store.snapshot();
  const importedBuild = { ...build(), level: 45 };
  const importedDraft = { level: 51, revision: 999 };
  const preserved = { ...emptyCollection(), revision: 2, draft: { level: 44, revision: 2 } };
  storage.failingKey = CHARACTER_STORAGE_KEY;
  const adoption = store.applyImport(before.collection.revision, [{ id: 'imported', name: 'Imported', build: importedBuild }], 'imported', { draft: importedDraft, preserved: [preserved] });
  importedBuild.level = 46;
  importedDraft.level = 52;
  preserved.draft.level = 53;
  expect(await adoption).toEqual({ ok: true, persisted: false });
  const after = store.snapshot();
  expect(activeCharacter(after.collection)!.build.level).toBe(45);
  expect(after.collection.draft).toEqual({ level: 51, revision: after.collection.revision });
  expect(after.preserved).toHaveLength(1);
  expect(after.preserved[0]!.draft!.level).toBe(44);
  expect(after.persistence.kind).toBe('not-saved');
  expect((await store.undo()).ok).toBe(true);
  const undone = store.snapshot();
  expect(undone.collection.activeId).toBe(before.collection.activeId);
  expect(undone.collection.characters.map(({ revision: _revision, ...entry }) => entry)).toEqual(before.collection.characters.map(({ revision: _revision, ...entry }) => entry));
  expect(undone.collection.draft).toBeNull();
  expect(undone.preserved).toEqual(before.preserved);
});
