import { derived } from 'svelte/store';
import { characterLevel, type LevelTarget } from './characters';
import { characters, initializeCharacters } from './characters-store';

export { initializeCharacters };
export { displayedCharacterLevel } from './characters';
export const CHARACTER_LEVEL = 'character';
export const readerCharacterLevel = derived(characters, (state) => state.ready ? characterLevel(state.collection) : undefined);

/**
 * Character comparisons have one source: the active complete build, otherwise a classless setup draft.
 * The legacy `character` level is initially a read-only draft. The first explicit character change
 * persists the one-time migration marker before cleanup; navigation and hydration never write storage.
 * `skill:*` values remain independently remembered by reader-levels.ts. Pages clamp only their displayed
 * value; reading/mounting never edits a stored level. Capture a target before asynchronous work so an active
 * switch cannot redirect its result into another character. Status lives on `characters.persistence`.
 */
export function setCharacterLevel(level: number | undefined, target?: LevelTarget) {
  return characters.setLevel(target ?? characters.captureLevel(), level ?? null, target === undefined);
}
