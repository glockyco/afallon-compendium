import type { PublicKindEntry } from '@afallon/contracts/public';
import type { serverMapLoader } from './publication';

/**
 * The highest character level, from the Character Progression guide. A reader's level can reach it even where no
 * place or creature records such a level. Without that guide the caller chooses its own bound.
 */
export async function loadCharacterLevelCap(loader: ReturnType<typeof serverMapLoader>, registry: readonly PublicKindEntry[]): Promise<number | undefined> {
  if (!registry.some((entry) => entry.kind === 'mechanics' && entry.pages)) return undefined;
  const page = await loader.loadDocument('mechanics', 'character-progression');
  return page.kind === 'mechanics' && page.document.topic === 'character-progression' ? page.document.curve.cap : undefined;
}
