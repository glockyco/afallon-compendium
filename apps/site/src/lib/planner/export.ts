import { buildObject, type PlannerBuild } from './build';
import { parseCharacterCollection, type Character, type CharacterCollection, type CharacterState, type CharacterStore, type MutationResult } from './characters';

export const CHARACTER_EXPORT_FORMAT = 'afallon-compendium.characters';
export const CHARACTER_EXPORT_FILENAME = 'afallon-compendium-characters.json';
export type CharacterExport = {
  readonly format: typeof CHARACTER_EXPORT_FORMAT;
  readonly version: 1;
  readonly collection: CharacterCollection;
  /** Conflict/removal drafts are backups, not silently adopted into the live roster. */
  readonly preserved: readonly CharacterCollection[];
};
export type ImportChoice = { readonly id: string; readonly action: 'add' | 'duplicate' | 'replace' | 'skip' };
export type ImportActiveChoice = { readonly kind: 'local' | 'incoming'; readonly id: string } | { readonly kind: 'none' };
export type ImportRow = { readonly incoming: Character; readonly local: Character | null; readonly kind: 'addition' | 'collision' };
export type ImportPreview = {
  readonly rows: readonly ImportRow[];
  readonly localActiveId: string | null;
  readonly incomingActiveId: string | null;
  readonly preserved: readonly CharacterCollection[];
};
export type ImportCharacter = { readonly id: string; readonly name: string; readonly build: PlannerBuild };
export type ImportPlan = {
  readonly characters: readonly ImportCharacter[];
  readonly additions: readonly ImportCharacter[];
  readonly replacements: readonly { readonly previous: Character; readonly incoming: ImportCharacter }[];
  readonly skipped: readonly Character[];
  readonly activeId: string | null;
  readonly activeName: string | null;
};
export interface CharacterImport {
  readonly preview: ImportPreview;
  plan(choices: readonly ImportChoice[], active: ImportActiveChoice): ImportPlan;
  apply(choices: readonly ImportChoice[], active: ImportActiveChoice): Promise<MutationResult>;
  cancel(): void;
}

/** Portable backup of the entire snapshot, including tab-only work and preserved conflicting drafts.
 * This is not a game save or the active character's share link. No storage/clipboard/file I/O occurs here.
 */
export function exportCharacters(snapshot: CharacterState): string {
  const envelope: CharacterExport = { format: CHARACTER_EXPORT_FORMAT, version: 1,
    collection: parseCharacterCollection(snapshot.collection), preserved: snapshot.preserved.map(parseCharacterCollection) };
  return JSON.stringify(envelope, null, 2);
}

/** Validate every build in every collection before exposing an import preview. Unknown fields/versions,
 * invalid selections and malformed later entries reject the whole file; content is never executed.
 */
export function parseCharacterExport(text: string): CharacterExport {
  const envelope = buildObject(JSON.parse(text), ['format', 'version', 'collection', 'preserved']);
  if (envelope.format !== CHARACTER_EXPORT_FORMAT || envelope.version !== 1) throw new Error('Unsupported character export format or version.');
  if (!Array.isArray(envelope.preserved)) throw new Error('Invalid preserved character drafts.');
  return { format: CHARACTER_EXPORT_FORMAT, version: 1, collection: parseCharacterCollection(envelope.collection), preserved: envelope.preserved.map(parseCharacterCollection) };
}

/** Import is a read-only session until apply. Choose every incoming row (including collisions) and the
 * resulting active character explicitly. A collision may replace, duplicate under a new local ID or skip;
 * an addition may add or skip. The captured local revision prevents a later tab change being overwritten.
 * Preserved file drafts remain preserved, available for another export; they do not become active entries.
 */
export function createCharacterImport(text: string, characters: CharacterStore, localId: () => string = () => crypto.randomUUID()): CharacterImport {
  const imported = parseCharacterExport(text);
  const local = characters.snapshot().collection;
  const rows: ImportRow[] = imported.collection.characters.map(incoming => {
    const existing = local.characters.find(character => character.id === incoming.id) ?? null;
    return { incoming, local: existing, kind: existing ? 'collision' : 'addition' };
  });
  const preview: ImportPreview = { rows, localActiveId: local.activeId, incomingActiveId: imported.collection.activeId, preserved: imported.preserved };
  let closed = false;
  const duplicateIds = new Map<string, string>();
  function plan(choices: readonly ImportChoice[], active: ImportActiveChoice): ImportPlan {
    if (closed) throw new Error('This character import is closed. Open the file again to import it.');
    if (choices.length !== rows.length || new Set(choices.map(choice => choice.id)).size !== choices.length || choices.some(choice => !rows.some(row => row.incoming.id === choice.id))) throw new Error('Choose an action for every incoming character.');
    const result: ImportCharacter[] = local.characters.map(({ id, name, build }) => ({ id, name, build }));
    const additions: ImportCharacter[] = [];
    const replacements: { previous: Character; incoming: ImportCharacter }[] = [];
    const skipped: Character[] = [];
    const adopted = new Map<string, string>();
    for (const row of rows) {
      const action = choices.find(choice => choice.id === row.incoming.id)!.action;
      if (action === 'skip') { skipped.push(row.incoming); continue; }
      if ((row.local && action !== 'replace' && action !== 'duplicate') || (!row.local && action !== 'add')) throw new Error('Choose Add for a new character, or Replace, Duplicate or Skip for a collision.');
      let id = row.incoming.id;
      if (action === 'duplicate') {
        id = duplicateIds.get(id) ?? localId();
        duplicateIds.set(row.incoming.id, id);
      }
      const incoming: ImportCharacter = { id, name: row.incoming.name, build: row.incoming.build };
      if (action === 'replace') {
        result[result.findIndex(character => character.id === id)] = incoming;
        replacements.push({ previous: row.local!, incoming });
      } else {
        if (result.some(character => character.id === id) || rows.some(other => other !== row && other.incoming.id === id)) throw new Error('The new local character identity collides. Open the import again to choose a different identity.');
        result.push(incoming);
        additions.push(incoming);
      }
      adopted.set(row.incoming.id, id);
    }
    let activeId: string | null;
    if (active.kind === 'none') activeId = null;
    else if (active.kind === 'local') {
      if (!local.characters.some(character => character.id === active.id)) throw new Error('Choose an existing local character for the active selection.');
      activeId = active.id;
    } else if (active.kind === 'incoming') {
      activeId = adopted.get(active.id) ?? null;
      if (activeId === null) throw new Error('The incoming active selection must be added, duplicated or replaced.');
    } else throw new Error('Choose the resulting active character.');
    // Reuse collection validation for the final roster, count, IDs, names, builds and active invariant.
    const revision = local.revision + 1;
    const validated = parseCharacterCollection({ ...local, revision, characters: result.map(character => ({ ...character, revision })), activeId });
    return structuredClone({ characters: validated.characters.map(({ id, name, build }) => ({ id, name, build })), additions, replacements, skipped, activeId, activeName: validated.characters.find(character => character.id === activeId)?.name ?? null });
  }
  return {
    get preview() { return structuredClone(preview); },
    plan,
    async apply(choices, active) {
      const confirmed = plan(choices, active);
      // Close at invocation, not completion, so a double click cannot apply twice.
      closed = true;
      return characters.applyImport(local.revision, confirmed.characters, confirmed.activeId, {
        draft: local.draft ?? imported.collection.draft,
        preserved: imported.preserved,
      });
    },
    cancel() { closed = true; },
  };
}
