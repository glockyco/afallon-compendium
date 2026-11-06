import { browser } from '$app/environment';
import { writable } from 'svelte/store';

// Skill and calculator-local values remain independent of the character collection. The legacy character
// property is read/removed only by the collection's locked migration; ordinary skill edits retain it until then.
const STORAGE_KEY = 'compendium.reader-levels.v1';
export type ReaderLevels = Readonly<Record<string, number>>;
export const skillLevelId = (skill: { key: string | null; name?: string; label?: string }): string => `skill:${skill.key ?? skill.name ?? skill.label ?? ''}`;
export function parseReaderLevels(value: string | null): ReaderLevels {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, number] => entry[0] !== 'character' && Number.isSafeInteger(entry[1]) && entry[1] >= 1));
  } catch { return {}; }
}
export const readerLevels = writable<ReaderLevels>({});
let initialized = false;
export function initializeReaderLevels(): void {
  if (!browser || initialized) return;
  initialized = true;
  try { readerLevels.set(parseReaderLevels(window.localStorage.getItem(STORAGE_KEY))); } catch { /* Tab memory remains usable when storage access is denied. */ }
  // Remote updates are read-only, including localStorage.clear(). There is deliberately no write subscription.
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) readerLevels.set(parseReaderLevels(event.newValue));
  });
}
function persistLevel(id: string, level: number | undefined): void {
  if (!browser) return;
  try {
    const storage = window.localStorage;
    const raw: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}');
    const stored = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    // Retain all other values, especially the old character level until migration has committed its marker.
    const next = { ...stored };
    if (level === undefined) delete next[id]; else next[id] = level;
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* Independent values remain usable in tab memory without a saving claim. */ }
}
export function setReaderLevel(id: string, level: number): void {
  if (id === 'character') throw new Error('Use the character-level adapter for character controls.');
  if (!Number.isSafeInteger(level) || level < 1) return;
  readerLevels.update((levels) => ({ ...levels, [id]: level }));
  persistLevel(id, level);
}
export function clearReaderLevel(id: string): void {
  if (id === 'character') throw new Error('Use the character-level adapter for character controls.');
  readerLevels.update((levels) => Object.fromEntries(Object.entries(levels).filter(([key]) => key !== id)));
  persistLevel(id, undefined);
}
