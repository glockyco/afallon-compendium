import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// The levels that the reader set on any page: their character level and their level in each skill. Every page that
// computes a value from one of these levels starts at the saved level, and every such page shows the control that
// changes it, so a saved level is never applied out of sight. The browser keeps them across pages and visits.
const STORAGE_KEY = 'compendium.reader-levels.v1';

/** The saved level of a reader value, such as `character` or `skill:skills:7`. */
export type ReaderLevels = Readonly<Record<string, number>>;

export const CHARACTER_LEVEL = 'character';
/** The id of the reader's level in a skill. A skill without a page falls back to its name. */
export const skillLevelId = (skill: { key: string | null; name?: string; label?: string }): string => `skill:${skill.key ?? skill.name ?? skill.label ?? ''}`;

/** The saved levels in a stored value. Anything that is not a positive whole level is left out. */
export function parseReaderLevels(value: string | null): ReaderLevels {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => Number.isInteger(entry[1]) && entry[1] >= 1));
  } catch {
    return {};
  }
}

export const readerLevels = writable<ReaderLevels>({});

if (browser) {
  readerLevels.set(parseReaderLevels(localStorage.getItem(STORAGE_KEY)));
  readerLevels.subscribe((levels) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(levels)); } catch { /* A browser without storage keeps the levels for this page only. */ }
  });
  // Another tab that changes a level changes it here too.
  window.addEventListener('storage', (event) => { if (event.key === STORAGE_KEY) readerLevels.set(parseReaderLevels(event.newValue)); });
}

export function setReaderLevel(id: string, level: number): void {
  readerLevels.update((levels) => ({ ...levels, [id]: level }));
}

/** Forgets the saved level of a reader value, so pages fall back to their own starting level. */
export function clearReaderLevel(id: string): void {
  readerLevels.update((levels) => Object.fromEntries(Object.entries(levels).filter(([key]) => key !== id)));
}
