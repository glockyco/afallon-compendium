import { get, writable, type Readable } from 'svelte/store';
import { parsePlannerBuild, type PlannerBuild } from './build';

export const CHARACTER_STORAGE_KEY = 'compendium.characters.v1';
export const LEGACY_LEVEL_STORAGE_KEY = 'compendium.reader-levels.v1';
export const CHARACTER_LOCK = 'compendium.characters';
const MAX_CHARACTERS = 100;

export type Character = { readonly id: string; readonly name: string; readonly revision: number; readonly build: PlannerBuild };
export type SetupDraft = { readonly level: number; readonly revision: number };
export type CharacterCollection = {
  readonly version: 1;
  readonly revision: number;
  readonly characters: readonly Character[];
  readonly activeId: string | null;
  readonly draft: SetupDraft | null;
  readonly migratedCharacterLevel: boolean;
};
export type CharacterTarget = { readonly id: string; readonly revision: number; readonly active: boolean; readonly character: Character };
export type LevelTarget = CharacterTarget | { readonly id: null; readonly revision: number };
export type Persistence = { readonly kind: 'uninitialized' | 'loaded' | 'saved' | 'not-saved' | 'conflict'; readonly message: string; readonly revision: number | null };
export type CharacterState = { readonly ready: boolean; readonly collection: CharacterCollection; readonly persistence: Persistence; readonly preserved: readonly CharacterCollection[] };
export type CharacterStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type CharacterLocks = { request<T>(name: string, callback: () => Promise<T>): Promise<T> };
export type CharacterEnvironment = { storage: () => CharacterStorage; locks?: CharacterLocks; localId?: () => string };
export type MutationResult = { readonly ok: boolean; readonly persisted: boolean; readonly reason?: string };
export type CharacterImportEntry = Pick<Character, 'id' | 'name' | 'build'>;
export type CharacterImportOptions = { readonly draft?: SetupDraft | null; readonly preserved?: readonly CharacterCollection[] };
export interface CharacterStore extends Readable<CharacterState> {
  initialize(): Promise<void>;
  receiveStorage(key: string | null, newValue: string | null): void;
  snapshot(): CharacterState;
  capture(characterId?: string, requireActive?: boolean): CharacterTarget;
  captureLevel(): LevelTarget;
  newCharacter(readerName: string, build: PlannerBuild): Promise<MutationResult>;
  addCharacter(readerName: string, build: PlannerBuild): Promise<MutationResult>;
  duplicate(target: CharacterTarget, readerName: string): Promise<MutationResult>;
  rename(target: CharacterTarget, readerName: string): Promise<MutationResult>;
  replaceBuild(target: CharacterTarget, build: PlannerBuild): Promise<MutationResult>;
  switchActive(characterId: string): Promise<MutationResult>;
  deleteCharacter(target: CharacterTarget, survivor: string | null): Promise<MutationResult>;
  setLevel(target: LevelTarget, level: number | null, continuous?: boolean): Promise<MutationResult>;
  /**
   * Apply an already-reviewed resulting roster/active choice in one revision-checked transaction.
   * Invalid input throws before mutation; a stale review returns a conflict. Omitted draft retains
   * the current setup; null clears it. Imported revision counters are not adopted. Preserved conflict
   * collections remain tab-only export material; successful saving acknowledges the roster revision.
   * Undo restores the prior roster, setup and retained drafts while keeping unchanged character revisions.
   */
  applyImport(expectedCollectionRevision: number, characters: readonly CharacterImportEntry[], activeId: string | null, options?: CharacterImportOptions): Promise<MutationResult>;
  undo(): Promise<MutationResult>;
}

type Action =
  | { kind: 'add'; character: Character; activate: boolean }
  | { kind: 'switch'; id: string }
  | { kind: 'rename'; target: CharacterTarget; name: string }
  | { kind: 'replace'; target: CharacterTarget; build: PlannerBuild }
  | { kind: 'level'; target: LevelTarget; level: number | null; continuous: boolean }
  | { kind: 'delete'; target: CharacterTarget; survivor: string | null }
  | { kind: 'import'; expected: number; characters: readonly CharacterImportEntry[]; activeId: string | null; draft?: SetupDraft | null; preserved: readonly CharacterCollection[] }
  | { kind: 'restore'; expected: number; previous: CharacterCollection; preserved?: readonly CharacterCollection[] };

export const emptyCollection = (): CharacterCollection => ({ version: 1, revision: 0, characters: [], activeId: null, draft: null, migratedCharacterLevel: false });
const clone = <T>(value: T): T => structuredClone(value);
const whole = (value: unknown, minimum = 0): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum;
function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !keys.includes(key))) throw new Error('Invalid character data.');
  return value as Record<string, unknown>;
}
function name(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 120) throw new Error('Enter a character name of 1–120 characters.');
  return value.trim();
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new Error('Invalid local character identity.');
  return value;
}

/** Strictly validate the whole envelope before accepting any part. Local names/IDs never enter build links. */
export function parseCharacterCollection(value: unknown): CharacterCollection {
  const data = object(value, ['version', 'revision', 'characters', 'activeId', 'draft', 'migratedCharacterLevel']);
  if (data.version !== 1 || !whole(data.revision) || typeof data.migratedCharacterLevel !== 'boolean' || !Array.isArray(data.characters) || data.characters.length > MAX_CHARACTERS) throw new Error('Unsupported or invalid character collection.');
  const collectionRevision = data.revision;
  const characters = data.characters.map((value): Character => {
    const character = object(value, ['id', 'name', 'revision', 'build']);
    if (!whole(character.revision, 1) || character.revision > collectionRevision) throw new Error('Invalid character revision.');
    return { id: id(character.id), name: name(character.name), revision: character.revision, build: parsePlannerBuild(character.build) };
  });
  if (new Set(characters.map((character) => character.id)).size !== characters.length || (characters.length ? !characters.some((character) => character.id === data.activeId) : data.activeId !== null)) throw new Error('Choose exactly one active character from the collection.');
  let draft: SetupDraft | null = null;
  if (data.draft !== null) {
    const setup = object(data.draft, ['level', 'revision']);
    if (!whole(setup.level, 1) || !whole(setup.revision, 1) || setup.revision > data.revision) throw new Error('Invalid setup draft.');
    draft = { level: setup.level, revision: setup.revision };
  }
  return { version: 1, revision: data.revision, characters, activeId: data.activeId as string | null, draft, migratedCharacterLevel: data.migratedCharacterLevel };
}

export function activeCharacter(collection: CharacterCollection): Character | undefined {
  return collection.characters.find((character) => character.id === collection.activeId);
}
export function characterLevel(collection: CharacterCollection): number | undefined {
  return activeCharacter(collection)?.build.level ?? collection.draft?.level;
}
export function displayedCharacterLevel(level: number | undefined, min: number, max: number): number | undefined {
  return level === undefined ? undefined : Math.max(min, Math.min(max, level));
}
export function captureCharacter(collection: CharacterCollection, characterId = collection.activeId, requireActive = false): CharacterTarget {
  const character = collection.characters.find((entry) => entry.id === characterId);
  if (!character) throw new Error('That character is no longer available.');
  return { id: character.id, revision: character.revision, active: requireActive, character: clone(character) };
}
export function captureLevelTarget(collection: CharacterCollection): LevelTarget {
  return collection.activeId === null ? { id: null, revision: collection.revision } : captureCharacter(collection, collection.activeId, true);
}
function checkedTarget(collection: CharacterCollection, target: CharacterTarget): Character {
  const character = collection.characters.find((entry) => entry.id === target.id);
  if (!character || character.revision !== target.revision || (target.active && collection.activeId !== target.id)) throw new Error('The character changed before this action finished. Your draft was not saved.');
  return character;
}
function revisedCharacters(current: CharacterCollection, candidates: readonly CharacterImportEntry[], revision: number): readonly Character[] {
  const existing = new Map(current.characters.map((entry) => [entry.id, entry]));
  return candidates.map((entry) => {
    const previous = existing.get(entry.id);
    // Both builds are detached parser outputs with deterministic field order. Export preserves array order.
    return previous && previous.name === entry.name && JSON.stringify(previous.build) === JSON.stringify(entry.build)
      ? previous : { ...entry, revision };
  });
}
function reduce(collection: CharacterCollection, action: Action): CharacterCollection {
  const revision = collection.revision + 1;
  if (!whole(revision)) throw new Error('The collection revision cannot be increased.');
  let next = { ...collection, revision, migratedCharacterLevel: true };
  if (action.kind === 'add') {
    if (collection.characters.some((entry) => entry.id === action.character.id)) throw new Error('That local character identity already exists.');
    next = { ...next, characters: [...collection.characters, { ...clone(action.character), revision }], activeId: action.activate || !collection.characters.length ? action.character.id : collection.activeId, draft: null };
  } else if (action.kind === 'switch') {
    if (!collection.characters.some((entry) => entry.id === action.id)) throw new Error('That character is no longer available.');
    next = { ...next, activeId: action.id };
  } else if (action.kind === 'restore') {
    if (collection.revision !== action.expected) throw new Error('The collection changed. Undo was not saved.');
    next = { ...clone(action.previous), revision, migratedCharacterLevel: true, characters: revisedCharacters(collection, action.previous.characters, revision), draft: action.previous.draft ? { level: action.previous.draft.level, revision: collection.draft?.level === action.previous.draft.level ? collection.draft.revision : revision } : null };
  } else if (action.kind === 'import') {
    if (collection.revision !== action.expected) throw new Error('The collection changed after import was reviewed. Your import was not saved.');
    const draft = action.draft === undefined ? collection.draft : action.draft === null ? null
      : { level: action.draft.level, revision: collection.draft?.level === action.draft.level ? collection.draft.revision : revision };
    next = { ...next, characters: revisedCharacters(collection, action.characters, revision), activeId: action.activeId, draft };
  } else if (action.kind === 'level' && action.target.id === null) {
    if (collection.activeId !== null || collection.revision !== action.target.revision) throw new Error('The active context changed. Your level draft was not saved.');
    next = { ...next, draft: action.level === null ? null : { level: action.level, revision } };
  } else {
    const target = action.target as CharacterTarget;
    const character = checkedTarget(collection, target);
    if (action.kind === 'delete') {
      const remaining = collection.characters.filter((entry) => entry.id !== target.id);
      if (collection.activeId === target.id && remaining.length && !remaining.some((entry) => entry.id === action.survivor)) throw new Error('Choose the surviving active character before deleting this character.');
      next = { ...next, characters: remaining, activeId: !remaining.length ? null : collection.activeId === target.id ? action.survivor : collection.activeId };
    } else {
      if (action.kind === 'level' && action.level === null) throw new Error('An active character must have a level.');
      const edited: Character = action.kind === 'rename' ? { ...character, name: action.name, revision }
        : { ...character, revision, build: action.kind === 'replace' ? clone(action.build) : { ...character.build, level: (action as Extract<Action, { kind: 'level' }>).level! } };
      next = { ...next, characters: collection.characters.map((entry) => entry.id === target.id ? edited : entry) };
    }
  }
  return parseCharacterCollection(next);
}

/**
 * Characters live only in this browser, with no account/cloud copy. New Character selects the new entry;
 * preview adoption can add without switching. Duplicate copies every build field into a distinct local ID.
 * Delete requires an explicit survivor when deleting the active entry; Undo restores the complete prior
 * collection/selection only while its revision is current. Conflicts retain the attempted collection for export.
 *
 * Persistent mutations reread, validate, revision-check and merge under one same-origin Web Lock. Foreign
 * events are read-only and never echo writes. Without locks or working storage, edits remain usable in tab
 * memory, not saved in this browser; export must include `collection` and `preserved` drafts. A removed key
 * refreshes the saved context but preserves tab work. Only a successful write acknowledges its revision.
 */
export function createCharacterStore(environment: CharacterEnvironment): CharacterStore {
  const state = writable<CharacterState>({ ready: false, collection: emptyCollection(), persistence: { kind: 'uninitialized', message: 'Not saved in this browser', revision: null }, preserved: [] });
  let persistent = false;
  let initialized: Promise<void> | undefined;
  let undoAction: Action | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  // A held/typed control can queue successive edits of our own revision, never a foreign revision.
  const localLevels = new Map<string | null, { source: number; revision: number }>();
  const status = (kind: Persistence['kind'], message: string, revision: number | null = null): Persistence => ({ kind, message, revision });
  function publish(collection: CharacterCollection, persistence: Persistence, preserved = get(state).preserved): void {
    state.set({ ready: true, collection: clone(collection), persistence, preserved });
  }
  function readStored(): CharacterCollection {
    const raw = environment.storage().getItem(CHARACTER_STORAGE_KEY);
    return raw === null ? emptyCollection() : parseCharacterCollection(JSON.parse(raw));
  }
  function cleanupLegacy(): void {
    try {
      const storage = environment.storage();
      const raw = storage.getItem(LEGACY_LEVEL_STORAGE_KEY);
      if (!raw) return;
      const old: unknown = JSON.parse(raw);
      if (old && typeof old === 'object' && !Array.isArray(old) && Object.hasOwn(old, 'character')) {
        const { character: _character, ...skills } = old as Record<string, unknown>;
        storage.setItem(LEGACY_LEVEL_STORAGE_KEY, JSON.stringify(skills));
      }
    } catch { /* The persisted marker makes an interrupted cleanup idempotent on reload. */ }
  }
  async function initialize(): Promise<void> {
    if (initialized) return initialized;
    initialized = (async () => {
      try {
        let collection = readStored();
        persistent = !!environment.locks;
        if (!persistent) {
          // Read old comparison state for this tab without writing either key.
          let old: unknown;
          try { old = JSON.parse(environment.storage().getItem(LEGACY_LEVEL_STORAGE_KEY) ?? '{}'); } catch { old = null; }
          const level = old && typeof old === 'object' && !Array.isArray(old) ? (old as Record<string, unknown>).character : undefined;
          if (!collection.characters.length && !collection.draft && !collection.migratedCharacterLevel && whole(level, 1)) collection = { ...collection, revision: collection.revision + 1, draft: { level, revision: collection.revision + 1 } };
          publish(collection, status('not-saved', 'Not saved in this browser: safe cross-tab storage is unavailable. Export to keep your characters.'));
          return;
        }
        await environment.locks!.request(CHARACTER_LOCK, async () => {
          collection = readStored();
          if (!collection.migratedCharacterLevel && !collection.characters.length && !collection.draft) {
            let old: unknown;
            try { old = JSON.parse(environment.storage().getItem(LEGACY_LEVEL_STORAGE_KEY) ?? '{}'); } catch { old = null; }
            const level = old && typeof old === 'object' && !Array.isArray(old) ? (old as Record<string, unknown>).character : undefined;
            if (whole(level, 1)) {
              const migrated: CharacterCollection = { ...collection, revision: collection.revision + 1, draft: { level, revision: collection.revision + 1 }, migratedCharacterLevel: true };
              try {
                environment.storage().setItem(CHARACTER_STORAGE_KEY, JSON.stringify(migrated));
              } catch {
                persistent = false;
                publish(migrated, status('not-saved', 'Not saved in this browser. Export to keep your characters.'));
                return;
              }
              collection = migrated;
              cleanupLegacy();
              publish(collection, status('saved', 'Saved in this browser', collection.revision));
              return;
            }
          }
          if (collection.migratedCharacterLevel) cleanupLegacy();
          publish(collection, status('loaded', 'Loaded from this browser', collection.revision));
        });
      } catch {
        persistent = false;
        publish(get(state).collection, status('not-saved', 'Not saved in this browser: storage could not be read safely. Export to keep your characters.'));
      }
    })();
    return initialized;
  }
  async function transact(action: Action, remember = true): Promise<MutationResult> {
    // Retain the exact captured character and input even if a remote event arrives before the lock.
    let attempted = get(state).collection;
    if ('target' in action && action.target.id !== null) {
      const captured = action.target as CharacterTarget;
      attempted = { ...attempted, revision: Math.max(attempted.revision, captured.revision), characters: [captured.character], activeId: captured.id, draft: null };
    }
    let attemptedDraft: CharacterCollection | undefined;
    try { attemptedDraft = reduce(attempted, action); } catch { /* Invalid actions have no exportable draft. */ }
    await initialize();
    // Local actions run in their invocation order even when locks/storage fail partway through a queue.
    const result = queue.then(async (): Promise<MutationResult> => {
      const before = get(state).collection;
      function acceptedPreserved(): readonly CharacterCollection[] {
        const retained = get(state).preserved;
        if (action.kind === 'import') return [...retained, ...action.preserved];
        if (action.kind === 'restore' && action.preserved) return action.preserved;
        return retained;
      }
      const sourceRevision = action.kind === 'level' ? action.target.revision : null;
      if (action.kind === 'level' && action.continuous) {
        const accepted = localLevels.get(action.target.id);
        if (accepted?.source === action.target.revision) action = { ...action, target: { ...action.target, revision: accepted.revision } };
      }
      let proposed: CharacterCollection;
      try { proposed = reduce(before, action); } catch (error) {
        const reason = (error as Error).message;
        publish(before, status('conflict', reason), attemptedDraft ? [...get(state).preserved, attemptedDraft] : get(state).preserved);
        return { ok: false, persisted: false, reason };
      }
      const fallback = (collection = proposed, previous = before): MutationResult => {
        if (remember) undoAction = { kind: 'restore', expected: collection.revision, previous: clone(previous), ...(action.kind === 'import' ? { preserved: clone(get(state).preserved) } : {}) };
        if (action.kind === 'level' && action.continuous) localLevels.set(action.target.id, { source: sourceRevision!, revision: collection.revision });
        publish(collection, status('not-saved', 'Not saved in this browser. Export to keep your characters.'), acceptedPreserved());
        return { ok: true, persisted: false };
      };
      if (!persistent) return fallback();
      try {
        return await environment.locks!.request(CHARACTER_LOCK, async () => {
          let latest: CharacterCollection;
          try { latest = readStored(); } catch { persistent = false; return fallback(); }
          let merged: CharacterCollection;
          try { merged = reduce(latest, action); } catch (error) {
            const reason = (error as Error).message;
            publish(latest, status('conflict', reason), [...get(state).preserved, proposed]);
            return { ok: false, persisted: false, reason };
          }
          try { environment.storage().setItem(CHARACTER_STORAGE_KEY, JSON.stringify(merged)); }
          catch { persistent = false; return fallback(merged, latest); }
          if (remember) undoAction = { kind: 'restore', expected: merged.revision, previous: clone(latest), ...(action.kind === 'import' ? { preserved: clone(get(state).preserved) } : {}) };
          if (action.kind === 'level' && action.continuous) localLevels.set(action.target.id, { source: sourceRevision!, revision: merged.revision });
          publish(merged, status('saved', 'Saved in this browser', merged.revision), acceptedPreserved());
          return { ok: true, persisted: true };
        });
      } catch { persistent = false; return fallback(); }
    });
    queue = result;
    return result;
  }
  function receiveStorage(key: string | null, newValue: string | null): void {
    if (!get(state).ready || (key !== CHARACTER_STORAGE_KEY && key !== null)) return;
    const current = get(state);
    localLevels.clear();
    try {
      const collection = newValue === null || key === null ? emptyCollection() : parseCharacterCollection(JSON.parse(newValue));
      if (newValue !== null && key !== null && current.persistence.kind !== 'not-saved' && collection.revision < current.collection.revision) return;
      const unsaved = current.persistence.kind === 'not-saved' || current.persistence.kind === 'conflict';
      publish(collection, status(unsaved || newValue === null || key === null ? 'not-saved' : 'loaded', newValue === null || key === null ? 'Characters were removed from browser storage. Export retained tab drafts to keep them.' : unsaved ? 'Updated from another tab. Your retained draft is not saved in this browser.' : 'Updated from another tab', collection.revision), unsaved || newValue === null || key === null ? [...current.preserved, clone(current.collection)] : current.preserved);
    } catch {
      persistent = false;
      publish(current.collection, status('not-saved', 'Browser character data could not be read safely. Your tab copy is available to export.'));
    }
  }
  function addCharacter(readerName: string, build: PlannerBuild, activate: boolean): Promise<MutationResult> {
    const character: Character = { id: id(environment.localId?.() ?? crypto.randomUUID()), name: name(readerName), revision: 1, build: parsePlannerBuild(build) };
    return transact({ kind: 'add', character, activate });
  }
  return {
    subscribe: state.subscribe, initialize, receiveStorage,
    snapshot: () => clone(get(state)),
    capture: (characterId?: string, requireActive = false) => captureCharacter(get(state).collection, characterId, requireActive),
    captureLevel: () => captureLevelTarget(get(state).collection),
    newCharacter: (readerName: string, build: PlannerBuild) => addCharacter(readerName, build, true),
    addCharacter: (readerName: string, build: PlannerBuild) => addCharacter(readerName, build, false),
    duplicate: (target: CharacterTarget, readerName: string) => { const character = checkedTarget(get(state).collection, target); return addCharacter(readerName, clone(character.build), true); },
    rename: (target: CharacterTarget, readerName: string) => transact({ kind: 'rename', target, name: name(readerName) }),
    replaceBuild: (target: CharacterTarget, build: PlannerBuild) => transact({ kind: 'replace', target, build: parsePlannerBuild(build) }),
    switchActive: (characterId: string) => transact({ kind: 'switch', id: characterId }, false),
    deleteCharacter: (target: CharacterTarget, survivor: string | null) => transact({ kind: 'delete', target, survivor }),
    applyImport: (expectedCollectionRevision: number, entries: readonly CharacterImportEntry[], activeId: string | null, options: CharacterImportOptions = {}) => {
      if (!whole(expectedCollectionRevision) || !whole(expectedCollectionRevision + 1) || !Array.isArray(entries) || entries.length > MAX_CHARACTERS) throw new Error('Invalid import collection.');
      object(options, ['draft', 'preserved']);
      const revision = expectedCollectionRevision + 1;
      let draft = options.draft;
      if (draft !== undefined && draft !== null) {
        const input = object(draft, ['level', 'revision']);
        if (!whole(input.level, 1) || !whole(input.revision, 1)) throw new Error('Invalid imported setup draft.');
        draft = { level: input.level, revision };
      }
      const imported = parseCharacterCollection({
        ...emptyCollection(), revision, activeId, migratedCharacterLevel: true, draft: draft ?? null,
        characters: entries.map((entry) => {
          const input = object(entry, ['id', 'name', 'build']);
          return { id: input.id, name: input.name, build: input.build, revision };
        }),
      });
      if (options.preserved !== undefined && !Array.isArray(options.preserved)) throw new Error('Invalid retained import drafts.');
      const preserved = (options.preserved ?? []).map(parseCharacterCollection);
      // Validate and detach everything before queuing. Only the expected collection revision is checked
      // again inside the lock; confirmed imports replace the roster in one write and share normal Undo.
      return transact({ kind: 'import', expected: expectedCollectionRevision, characters: imported.characters.map(({ id, name, build }) => ({ id, name, build })), activeId, ...(draft !== undefined ? { draft } : {}), preserved });
    },
    setLevel: (target: LevelTarget, level: number | null, continuous = false) => {
      if (level !== null && !whole(level, 1)) throw new Error('Enter a positive whole level.');
      return transact({ kind: 'level', target, level, continuous });
    },
    undo: async (): Promise<MutationResult> => {
      if (!undoAction) return { ok: false, persisted: false, reason: 'There is no character edit to undo.' };
      const action = undoAction;
      const result = await transact(action, false);
      if (result.ok) undoAction = undefined;
      return result;
    },
  };
}
