import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { entityPageEntries } from '$lib/server/page-entries';
import { serverMapLoader } from '$lib/server/publication';
import { pageTitle } from '$lib/server/page-title';
import { isEntityRef, isPublicPageKind, type StaticDocument } from '@afallon/contracts/public';
import { heroicItemOption, sortHeroicItemOptions, type ItemPickerOption } from '$lib/detail/item-picker-options';
import { lootAtLevel, type LevelLoot } from '$lib/detail/level-loot';

export const entries: EntryGenerator = entityPageEntries;

type InlineItem = Extract<StaticDocument, { kind: 'items' }>['document'];

/** Resolve the item whose sources also explain how a currency can be obtained. */
export async function _loadGuideInlineItem(
  page: StaticDocument,
  loader: Pick<ReturnType<typeof serverMapLoader>, 'loadPageForRef'>,
): Promise<InlineItem | undefined> {
  const ref = page.kind === 'currencies' ? page.document.item
    : page.kind === 'mechanics' && page.document.topic === 'corruption' ? page.document.tryIt.defaultItem : undefined;
  if (!ref || !isEntityRef(ref) || !ref.slug) return undefined;
  const item = await loader.loadPageForRef(ref);
  if (item.kind !== 'items' || item.document.ref.key !== ref.key) {
    throw new Error(`Inline item ${ref.key} does not resolve to its published item page.`);
  }
  return item.document;
}

/** What World Loot and cloth give at a creature page's lowest level, from the Loot guide, when the page shows them. */
export async function _loadLevelLoot(page: StaticDocument, loader: Pick<ReturnType<typeof serverMapLoader>, 'loadDocument'>): Promise<LevelLoot | undefined> {
  if (page.kind !== 'npcs' || !page.document.sharedDrops.length || !page.document.facts.level) return undefined;
  const guide = await loader.loadDocument('mechanics', 'loot');
  if (guide.kind !== 'mechanics' || guide.document.topic !== 'loot') throw new Error('The Loot guide does not resolve to its published page.');
  return lootAtLevel(guide.document, page.document.facts.level.min);
}

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverMapLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind || !isPublicPageKind(kind.kind)) error(404, 'This compendium section is unavailable.');
  const entry = indexes.entries.find((candidate) => candidate.ref.kind === kind.kind && candidate.ref.slug === params.slug && candidate.document);
  if (!entry?.document) error(404, 'This compendium page is unavailable.');
  const page = await loader.loadDocument(kind.kind, params.slug);
  const [inlineItem, titleData, levelLoot] = await Promise.all([_loadGuideInlineItem(page, loader), pageTitle(page, registry, indexes, loader), _loadLevelLoot(page, loader)]);
  const heroicItems = page.kind === 'mechanics' && page.document.topic === 'heroic-tier'
    ? await (async () => {
      const rows = (await loader.loadList('items')).rows.filter((row) =>
        row.facets.itemType?.some((type) => type === 'ARMOR' || type === 'WEAPON' || type === 'Trinket') && row.ref.slug);
      const choices = [];
      for (let start = 0; start < rows.length; start += 48) {
        const batch = await Promise.all(rows.slice(start, start + 48).map((row) => loader.loadDocument('items', row.ref.slug!)));
        for (const item of batch) {
          if (item.kind !== 'items') continue;
          const option = heroicItemOption(item.document);
          if (option) choices.push(option);
        }
      }
      return sortHeroicItemOptions(choices);
    })()
    : undefined;
  const corruptionGuide = page.kind === 'mechanics' && page.document.topic === 'corruption' ? page.document : undefined;
  const corruptionItems = corruptionGuide
    ? await (async () => {
      const byKey = new Map<string, ItemPickerOption>();
      for (const group of corruptionGuide.tryIt.groups) {
        const documents = await Promise.all(group.items.map((entry) => loader.loadPageForRef(entry.item)));
        for (const document of documents) {
          if (document.kind !== 'items') continue;
          const existing = byKey.get(document.document.ref.key);
          if (existing) {
            if (existing.slot !== group.place.name) existing.slot = 'Multiple dungeons';
          } else byKey.set(document.document.ref.key, {
            ref: document.document.ref, slot: group.place.name, rarity: document.document.facts.rarity,
          });
        }
      }
      return [...byKey.values()].sort((a, b) => a.slot.localeCompare(b.slot, 'en') || a.ref.name.localeCompare(b.ref.name, 'en'));
    })()
    : undefined;
  return { kind, page, inlineItem, heroicItems, corruptionItems, levelLoot, documentPath: entry.document.path, ...titleData };
};
