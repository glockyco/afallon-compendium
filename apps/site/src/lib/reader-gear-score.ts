import { browser } from '$app/environment';
import { writable } from 'svelte/store';

const STORAGE_KEY = 'compendium.reader-gear-score.v1';
export function parseGearScore(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const score = Number(value);
  return Number.isInteger(score) && score >= 0 && score <= 1250 ? score : null;
}

export const readerGearScore = writable<number>(0);
if (browser) {
  readerGearScore.set(parseGearScore(localStorage.getItem(STORAGE_KEY)) ?? 0);
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) readerGearScore.set(parseGearScore(event.newValue) ?? 0);
  });
}

export function setReaderGearScore(score: number): void {
  if (!Number.isFinite(score)) return;
  const bounded = Math.min(1250, Math.max(0, Math.trunc(score)));
  readerGearScore.set(bounded);
  if (browser) {
    try { localStorage.setItem(STORAGE_KEY, String(bounded)); } catch { /* In-memory score still works. */ }
  }
}
