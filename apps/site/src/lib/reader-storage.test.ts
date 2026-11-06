import { afterAll, expect, mock, test } from 'bun:test';
import { get } from 'svelte/store';

// Exercise the actual module initialization path, including a throwing localStorage getter before import.
mock.module('$app/environment', () => ({ browser: true, building: false, dev: false, version: 'test' }));
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const values = new Map<string, string>();
const listeners: ((event: { key: string | null; newValue: string | null }) => void)[] = [];
let denied = true;
let full = false;
let writes = 0;
const storage = {
  getItem(key: string): string | null { return values.get(key) ?? null; },
  setItem(key: string, value: string): void { if (full) throw new Error('QuotaExceededError'); writes++; values.set(key, value); },
};
Object.defineProperty(globalThis, 'window', { configurable: true, value: {
  get localStorage() { if (denied) throw new Error('SecurityError'); return storage; },
  addEventListener(_type: string, listener: typeof listeners[number]) { listeners.push(listener); },
} });
const levels = await import('./reader-levels');
const score = await import('./reader-gear-score');
levels.initializeReaderLevels();
afterAll(() => {
  if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('denied initial level and gear-score getters do not prevent module initialization or tab editing', () => {
  expect(get(levels.readerLevels)).toEqual({});
  expect(get(score.readerGearScore)).toBe(0);
  levels.setReaderLevel('skill:a', 9);
  score.setReaderGearScore(350);
  expect(get(levels.readerLevels)).toEqual({ 'skill:a': 9 });
  expect(get(score.readerGearScore)).toBe(350);
  expect(writes).toBe(0);
});

test('foreign levels and score events never echo writes and clear-all resets both independent stores', () => {
  denied = false;
  const before = writes;
  for (const listener of listeners) listener({ key: 'compendium.reader-levels.v1', newValue: JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 }) });
  expect(get(levels.readerLevels)).toEqual({ 'skill:a': 9, 'skill:b': 17 });
  for (const listener of listeners) listener({ key: 'compendium.reader-gear-score.v1', newValue: '500' });
  expect(get(score.readerGearScore)).toBe(500);
  for (const listener of listeners) listener({ key: null, newValue: null });
  expect(get(levels.readerLevels)).toEqual({});
  expect(get(score.readerGearScore)).toBe(0);
  expect(writes).toBe(before);
});

test('a skill edit preserves legacy character data until migration and retains the other skill', () => {
  denied = false;
  values.set('compendium.reader-levels.v1', JSON.stringify({ character: 42, 'skill:a': 9, 'skill:b': 17 }));
  levels.setReaderLevel('skill:a', 10);
  expect(JSON.parse(values.get('compendium.reader-levels.v1')!)).toEqual({ character: 42, 'skill:a': 10, 'skill:b': 17 });
  levels.clearReaderLevel('skill:a');
  expect(JSON.parse(values.get('compendium.reader-levels.v1')!)).toEqual({ character: 42, 'skill:b': 17 });
  expect(() => levels.setReaderLevel('character', 30)).toThrow();
});

test('failed independent writes leave controls editable and level parsing excludes unsafe numbers', () => {
  full = true;
  levels.setReaderLevel('skill:b', 18);
  score.setReaderGearScore(700);
  expect(get(levels.readerLevels)['skill:b']).toBe(18);
  expect(get(score.readerGearScore)).toBe(700);
  expect(levels.parseReaderLevels(JSON.stringify({ character: 42, 'skill:a': Number.MAX_SAFE_INTEGER + 1, 'skill:b': 18 }))).toEqual({ 'skill:b': 18 });
  expect(levels.parseReaderLevels('broken')).toEqual({});
  expect(score.parseGearScore('1251')).toBeNull();
  full = false;
});
