import { browser } from '$app/environment';
import { createCharacterStore } from './characters';

// No storage getter is touched during import or prerender/hydration. Public controls call this after mount.
export const characters = createCharacterStore({
  storage: () => window.localStorage,
  locks: browser && typeof navigator !== 'undefined' && navigator.locks
    ? { request: async <T>(name: string, callback: () => Promise<T>): Promise<T> => await navigator.locks.request(name, callback) }
    : undefined,
});
let listening = false;
export function initializeCharacters(): Promise<void> {
  if (!browser) return Promise.resolve();
  if (!listening) {
    listening = true;
    window.addEventListener('storage', (event) => {
      // sessionStorage events must not clear the browser character context.
      try { if (event.storageArea && event.storageArea !== window.localStorage) return; } catch { return; }
      characters.receiveStorage(event.key, event.newValue);
    });
  }
  return characters.initialize();
}
