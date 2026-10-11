import { expect, test } from 'bun:test';
import { CHARACTER_STORAGE_KEY, createCharacterStore, type CharacterLocks, type CharacterState } from './characters';
import { createCharacterImport, exportCharacters, parseCharacterExport, type ImportChoice } from './export';
import { parsePlannerBuild } from './build';
import fixture from './export.fixture.json';

const build = parsePlannerBuild(fixture.collection.characters[0]!.build);
const file = JSON.stringify(fixture);
class MemoryStorage {
  values = new Map<string, string>();
  writes: string[] = [];
  quota = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.quota) throw new Error('QuotaExceededError');
    this.writes.push(key);
    this.values.set(key, value);
  }
}
class SerialLocks implements CharacterLocks {
  queue: Promise<unknown> = Promise.resolve();
  request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    const next = this.queue.then(callback);
    this.queue = next.catch(() => {});
    return next;
  }
}
async function destination(mode: 'normal' | 'no-locks' | 'denied' = 'normal') {
  const storage = new MemoryStorage();
  const locks = new SerialLocks();
  let counter = 0;
  const characters = createCharacterStore({ storage: () => { if (mode === 'denied') throw new Error('SecurityError'); return storage; }, locks: mode === 'no-locks' ? undefined : locks, localId: () => ++counter === 1 ? 'brielle' : `local-${counter}` });
  await characters.initialize();
  return { storage, characters, locks };
}

test('versioned export contains every complete character, active choice and all preserved conflict drafts', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Brielle', build);
  await characters.addCharacter('Arden', { ...build, level: 60 });
  const state: CharacterState = { ...characters.snapshot(), preserved: parseCharacterExport(file).preserved };
  const exported = parseCharacterExport(exportCharacters(state));
  expect(exported.collection).toEqual(state.collection);
  expect(exported.collection.characters.map(character => character.name)).toEqual(['Brielle', 'Arden']);
  expect(exported.preserved).toEqual(parseCharacterExport(file).preserved);
  expect(exported.collection.activeId).toBe('brielle');
  expect(exported.collection.characters[0]!.build.gear).toEqual(build.gear);
  expect(exported.preserved[0]!.characters[0]!.build.talents.kind).toBe('unknown-order');
  const writes = storage.writes.length;
  exportCharacters(state);
  expect(storage.writes).toHaveLength(writes);
  const transferred = await destination();
  const session = createCharacterImport(exportCharacters(state), transferred.characters);
  await session.apply(state.collection.characters.map(character => ({ id: character.id, action: 'add' })), { kind: 'incoming', id: state.collection.activeId! });
  expect(transferred.characters.snapshot().collection.characters.map(character => character.build)).toEqual(state.collection.characters.map(character => character.build));
  expect(transferred.characters.snapshot().collection.activeId).toBe(state.collection.activeId);
  expect(transferred.storage.writes).toHaveLength(1);
});

test('another browser previews complete additions and imports once with explicit active selection, preserving file drafts', async () => {
  const { storage, characters } = await destination();
  const session = createCharacterImport(file, characters);
  expect(session.preview.rows.map(row => row.kind)).toEqual(['addition']);
  expect(session.preview.incomingActiveId).toBe('brielle');
  expect(session.preview.localActiveId).toBeNull();
  expect(session.preview.preserved).toEqual(parseCharacterExport(file).preserved);
  const choices: ImportChoice[] = [{ id: 'brielle', action: 'add' }];
  const active = { kind: 'incoming', id: 'brielle' } as const;
  const plan = session.plan(choices, active);
  expect(plan.additions).toHaveLength(1);
  expect(plan.replacements).toEqual([]);
  expect(plan.activeName).toBe('Brielle');
  expect(storage.writes).toEqual([]);
  expect((await session.apply(choices, active)).persisted).toBe(true);
  expect(storage.writes).toEqual([CHARACTER_STORAGE_KEY]);
  expect(characters.snapshot().collection.characters[0]!.build).toEqual(build);
  expect(characters.snapshot().collection.activeId).toBe('brielle');
  expect(characters.snapshot().preserved).toEqual(parseCharacterExport(file).preserved);
  expect(() => session.plan(choices, active)).toThrow('closed');
  const exported = parseCharacterExport(exportCharacters(characters.snapshot()));
  expect(exported.preserved).toEqual(parseCharacterExport(file).preserved);
});

test('all characters and tab-only edits export/import with denied storage, missing locks or quota failure', async () => {
  for (const mode of ['denied', 'no-locks', 'normal'] as const) {
    const source = await destination(mode);
    await source.characters.newCharacter('Brielle', build);
    if (mode === 'normal') source.storage.quota = true;
    await source.characters.replaceBuild(source.characters.capture(), { ...build, level: 40 });
    const backup = exportCharacters(source.characters.snapshot());
    expect(parseCharacterExport(backup).collection.characters[0]!.build.level).toBe(40);
    expect(source.characters.snapshot().persistence.kind).toBe('not-saved');
    const target = await destination();
    const session = createCharacterImport(backup, target.characters);
    expect((await session.apply([{ id: 'brielle', action: 'add' }], { kind: 'incoming', id: 'brielle' })).persisted).toBe(true);
    expect(target.characters.snapshot().collection.characters[0]!.build.level).toBe(40);
    const tabTarget = await destination('no-locks');
    const tabImport = createCharacterImport(backup, tabTarget.characters);
    expect((await tabImport.apply([{ id: 'brielle', action: 'add' }], { kind: 'incoming', id: 'brielle' })).persisted).toBe(false);
    expect(tabTarget.storage.writes).toEqual([]);
    expect(tabTarget.characters.snapshot().collection.characters[0]!.build.level).toBe(40);
  }
});

test('strict validation rejects unknown fields and unsupported versions at every level, including a malformed later preserved draft', async () => {
  const cases = [
    { ...fixture, extra: true }, { ...fixture, version: 2 }, { ...fixture, format: 'save-game' },
    { ...fixture, collection: { ...fixture.collection, version: 2 } },
    { ...fixture, collection: { ...fixture.collection, extra: true } },
    { ...fixture, collection: { ...fixture.collection, activeId: 'absent' } },
    { ...fixture, collection: { ...fixture.collection, characters: [...fixture.collection.characters, { ...fixture.collection.characters[0], id: 'bad', build: { ...build, level: Number.MAX_SAFE_INTEGER + 1 } }] } },
    { ...fixture, collection: { ...fixture.collection, characters: [{ ...fixture.collection.characters[0], extra: true }] } },
    { ...fixture, collection: { ...fixture.collection, characters: [{ ...fixture.collection.characters[0], build: { ...build, unexpected: true } }] } },
    { ...fixture, collection: { ...fixture.collection, characters: [{ ...fixture.collection.characters[0], build: { ...build, party: { ...build.party, unexpected: true } } }] } },
    { ...fixture, preserved: [...fixture.preserved, { ...fixture.preserved[0], version: 2 }] },
    { ...fixture, preserved: [...fixture.preserved, { ...fixture.preserved[0], characters: [{ ...fixture.preserved[0]!.characters[0], build: { ...build, heroic: [{ tree: 'talentTrees:32', node: 0, rank: 0 }] } }] }] },
    { ...fixture, preserved: null },
  ];
  const { characters, storage } = await destination();
  const before = characters.snapshot();
  for (const invalid of cases) {
    expect(() => createCharacterImport(JSON.stringify(invalid), characters)).toThrow();
    expect(characters.snapshot()).toEqual(before);
  }
  for (const invalid of ['{', file + '{}', 'null', '[]']) expect(() => createCharacterImport(invalid, characters)).toThrow();
  expect(storage.writes).toEqual([]);
});

test('collisions show names/builds, replacement is explicit and reversible, and selected local active is preserved', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', { ...build, level: 20 });
  const before = characters.snapshot().collection;
  storage.writes.length = 0;
  const session = createCharacterImport(file, characters);
  expect(session.preview.rows[0]!.kind).toBe('collision');
  expect(session.preview.rows[0]!.local!.name).toBe('Local Brielle');
  expect(session.preview.rows[0]!.incoming.name).toBe('Brielle');
  expect(() => session.plan([{ id: 'brielle', action: 'add' }], { kind: 'local', id: 'brielle' })).toThrow();
  const choices: ImportChoice[] = [{ id: 'brielle', action: 'replace' }];
  const plan = session.plan(choices, { kind: 'local', id: 'brielle' });
  expect(plan.replacements[0]!.previous.build.level).toBe(20);
  expect(plan.replacements[0]!.incoming.build.level).toBe(30);
  expect(plan.additions).toEqual([]);
  expect(storage.writes).toEqual([]);
  expect((await session.apply(choices, { kind: 'local', id: 'brielle' })).ok).toBe(true);
  expect(storage.writes).toHaveLength(1);
  expect(characters.snapshot().collection.characters[0]!.name).toBe('Brielle');
  expect(characters.snapshot().collection.characters[0]!.build).toEqual(build);
  expect((await characters.undo()).ok).toBe(true);
  expect(characters.snapshot().collection.characters[0]!.build).toEqual(before.characters[0]!.build);
});

test('duplicate collision assigns stable new local identity and active choice can explicitly select incoming copy', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', { ...build, level: 20 });
  storage.writes.length = 0;
  let ids = 0;
  const session = createCharacterImport(file, characters, () => `copy-${++ids}`);
  const choices: ImportChoice[] = [{ id: 'brielle', action: 'duplicate' }];
  const active = { kind: 'incoming', id: 'brielle' } as const;
  expect(session.plan(choices, active).activeId).toBe('copy-1');
  expect(session.plan(choices, active).activeId).toBe('copy-1');
  expect(ids).toBe(1);
  expect((await session.apply(choices, active)).ok).toBe(true);
  expect(characters.snapshot().collection.characters.map(entry => [entry.id, entry.build.level])).toEqual([['brielle', 20], ['copy-1', 30]]);
  expect(characters.snapshot().collection.activeId).toBe('copy-1');
  expect(storage.writes).toHaveLength(1);
});

test('diff includes additions and skipped collisions and applies them in one write', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', { ...build, level: 20 });
  const incoming = { ...fixture, collection: { ...fixture.collection, characters: [...fixture.collection.characters, { ...fixture.collection.characters[0]!, id: 'arden', name: 'Arden', build: { ...build, level: 60 } }] } };
  const session = createCharacterImport(JSON.stringify(incoming), characters);
  expect(session.preview.rows.map(row => row.kind)).toEqual(['collision', 'addition']);
  const choices: ImportChoice[] = [{ id: 'brielle', action: 'skip' }, { id: 'arden', action: 'add' }];
  const plan = session.plan(choices, { kind: 'incoming', id: 'arden' });
  expect(plan.skipped).toHaveLength(1);
  expect(plan.additions.map(entry => entry.name)).toEqual(['Arden']);
  expect(plan.replacements).toEqual([]);
  storage.writes.length = 0;
  await session.apply(choices, { kind: 'incoming', id: 'arden' });
  expect(characters.snapshot().collection.characters.map(entry => entry.build.level)).toEqual([20, 60]);
  expect(storage.writes).toHaveLength(1);
});

test('a combined addition and replacement is validated and committed transactionally with explicit active choice', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', { ...build, level: 20 });
  const incoming = { ...fixture, collection: { ...fixture.collection, characters: [...fixture.collection.characters, { ...fixture.collection.characters[0]!, id: 'arden', name: 'Arden', build: { ...build, level: 60 } }] } };
  const session = createCharacterImport(JSON.stringify(incoming), characters);
  const choices: ImportChoice[] = [{ id: 'brielle', action: 'replace' }, { id: 'arden', action: 'add' }];
  const plan = session.plan(choices, { kind: 'incoming', id: 'arden' });
  expect(plan.replacements).toHaveLength(1);
  expect(plan.additions).toHaveLength(1);
  storage.writes.length = 0;
  await session.apply(choices, { kind: 'incoming', id: 'arden' });
  expect(characters.snapshot().collection.characters.map(character => character.build.level)).toEqual([30, 60]);
  expect(characters.snapshot().collection.activeId).toBe('arden');
  expect(storage.writes).toHaveLength(1);
});

test('cancelled import and invalid/incomplete collision or active choices never write or partially apply', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', build);
  storage.writes.length = 0;
  const before = characters.snapshot();
  const session = createCharacterImport(file, characters);
  for (const choices of [[], [{ id: 'missing', action: 'skip' }], [{ id: 'brielle', action: 'replace' }, { id: 'brielle', action: 'skip' }]] as ImportChoice[][]) expect(() => session.plan(choices, { kind: 'local', id: 'brielle' })).toThrow();
  expect(() => session.plan([{ id: 'brielle', action: 'skip' }], { kind: 'incoming', id: 'brielle' })).toThrow();
  expect(() => session.plan([{ id: 'brielle', action: 'skip' }], { kind: 'none' })).toThrow();
  expect(() => session.plan([{ id: 'brielle', action: 'replace' }], { kind: 'local', id: 'missing' })).toThrow();
  session.plan([{ id: 'brielle', action: 'replace' }], { kind: 'local', id: 'brielle' });
  session.cancel();
  await expect(session.apply([{ id: 'brielle', action: 'replace' }], { kind: 'local', id: 'brielle' })).rejects.toThrow('closed');
  expect(characters.snapshot()).toEqual(before);
  expect(storage.writes).toEqual([]);
});

test('a later collection change rejects the whole captured import without retargeting or partial writes', async () => {
  const { characters, storage } = await destination();
  await characters.newCharacter('Local Brielle', { ...build, level: 20 });
  const session = createCharacterImport(file, characters);
  await characters.rename(characters.capture(), 'Later Name');
  storage.writes.length = 0;
  const before = characters.snapshot().collection;
  const result = await session.apply([{ id: 'brielle', action: 'replace' }], { kind: 'incoming', id: 'brielle' });
  expect(result.ok).toBe(false);
  expect(characters.snapshot().collection).toEqual(before);
  expect(storage.writes).toEqual([]);
});
