import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';
import { GUIDE_TOPICS } from '$lib/site-navigation';
import type { ArtRef, EntityRef } from '@afallon/contracts/public';

export interface HubWorld { ref: EntityRef; range: { min: number; max: number } | null; artwork: ArtRef | null }
export interface HubDungeon { ref: EntityRef; min: number; max: number; artwork: ArtRef | null; bosses: Array<{ ref: EntityRef; portrait: ArtRef | null }> }
export interface HubBand { min: number; max: number; places: EntityRef[] }
export interface HubGuide { ref: EntityRef; description: string | null }
export interface HubItemGroup { type: string; label: string; count: number; icon: ArtRef | null; rarity: string | null }

// The item types that the hub offers, in reading order, with their plural labels. A type without items is left out.
const ITEM_GROUPS: ReadonlyArray<{ type: string; label: string }> = [
  { type: 'WEAPON', label: 'Weapons' }, { type: 'ARMOR', label: 'Armor' }, { type: 'Trinket', label: 'Trinkets' },
  { type: 'GEM', label: 'Gems' }, { type: 'ENCHANTMENT', label: 'Enchantments' }, { type: 'CONSUMABLE', label: 'Consumables' },
  { type: 'MATERIAL', label: 'Materials' }, { type: 'MOUNT', label: 'Mounts' },
];

// The hub reads the published pages when the site is built, so every place, boss, class, and skill that it names has a
// page. It shows a level range only when a place page records one.
export const load: PageServerLoad = async ({ parent }) => {
  const { registry } = await parent();
  const loader = serverMapLoader();
  const published = new Set<string>(registry.filter((entry) => entry.pages).map((entry) => entry.kind));
  const [root, coverage] = await Promise.all([loader.loadRoot(), loader.loadCoverage()]);
  const recipeRows = registry.some((entry) => entry.kind === 'recipes' && entry.list) ? (await loader.loadList('recipes')).rows : [];

  const placeRows = published.has('places') ? (await loader.loadList('places')).rows : [];
  const places = (await Promise.all(placeRows.flatMap((row) => row.ref.slug ? [loader.loadDocument('places', row.ref.slug)] : [])))
    .flatMap((page) => page.kind === 'places' ? [page.document] : []);

  // The place that carries the name of the world is the world itself. Its artwork opens the hub.
  const worldPlace = places.find((place) => place.ref.name === root.world.label);
  const world: HubWorld | null = worldPlace ? { ref: worldPlace.ref, range: worldPlace.facts.levelRange ?? null, artwork: worldPlace.art.artwork ?? null } : null;

  const ranged = places.flatMap((place) => place !== worldPlace && place.facts.levelRange ? [{ place, ...place.facts.levelRange }] : [])
    .sort((left, right) => left.min - right.min || left.max - right.max || left.place.ref.name.localeCompare(right.place.ref.name));

  const portrait = async (boss: EntityRef): Promise<ArtRef | null> => {
    if (!boss.slug || !published.has('npcs')) return null;
    const page = await loader.loadDocument('npcs', boss.slug);
    return page.kind === 'npcs' ? page.document.art.portrait ?? null : null;
  };
  const dungeons: HubDungeon[] = await Promise.all(ranged.filter(({ place }) => place.facts.placeType === 'dungeon').map(async ({ place, min, max }) => ({
    ref: place.ref, min, max, artwork: place.art.artwork ?? null,
    bosses: await Promise.all(place.bosses.flatMap((boss) => boss.key === null ? [] : [boss]).map(async (boss) => ({ ref: boss, portrait: await portrait(boss) }))),
  })));

  // Zones with the same recorded range form one band, in the order of their ranges.
  const bands: HubBand[] = [];
  for (const { place, min, max } of ranged) {
    if (place.facts.placeType === 'dungeon') continue;
    const band = bands.find((candidate) => candidate.min === min && candidate.max === max);
    if (band) band.places.push(place.ref);
    else bands.push({ min, max, places: [place.ref] });
  }

  const classRows = published.has('classes') ? (await loader.loadList('classes')).rows : [];
  const skillRows = published.has('skills') ? (await loader.loadList('skills')).rows : [];
  const count = (value: string | number | null | undefined) => typeof value === 'number' ? value : null;

  // Each item group opens the item list filtered to one type. Its icon comes from the most common slot of the group, so
  // armor shows a chest piece and not a ring, and within that slot from the rarest tier. The icon is a picture, not a
  // ranking.
  const itemRows = published.has('items') ? (await loader.loadList('items')).rows : [];
  const rarityOrder = ['legendary', 'epic', 'gold', 'rare', 'uncommon', 'common'];
  const rarityRank = (row: typeof itemRows[number]) => { const rank = rarityOrder.indexOf((row.facets.rarity?.[0] ?? '').toLocaleLowerCase()); return rank < 0 ? rarityOrder.length : rank; };
  const itemGroups: HubItemGroup[] = ITEM_GROUPS.flatMap(({ type, label }) => {
    const rows = itemRows.filter((row) => row.facets.itemType?.includes(type));
    const slots = new Map<string, number>();
    for (const row of rows) for (const slot of row.facets.slot ?? []) slots.set(slot, (slots.get(slot) ?? 0) + 1);
    const slot = [...slots].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0];
    const pick = rows.filter((row) => row.ref.icon && (!slot || row.facets.slot?.includes(slot))).sort((left, right) => rarityRank(left) - rarityRank(right) || (count(right.values.itemPower) ?? 0) - (count(left.values.itemPower) ?? 0) || left.ref.name.localeCompare(right.ref.name))[0];
    return rows.length ? [{ type, label, count: rows.length, icon: pick?.ref.icon ?? null, rarity: pick?.facets.rarity?.[0] ?? null }] : [];
  });

  // The featured mechanics pages of the Browse panel, each with the one sentence that says what it explains.
  const guides: HubGuide[] = published.has('mechanics') ? (await Promise.all(GUIDE_TOPICS.filter((topic) => topic.featured).map(async ({ slug }) => {
    const page = await loader.loadDocument('mechanics', slug);
    return page.kind === 'mechanics' ? [{ ref: page.document.ref, description: page.document.description }] : [];
  }))).flat() : [];

  return {
    itemGroups,
    guides,
    world,
    dungeons,
    bands,
    // The level bars share one scale, from level 1 to the highest recorded level.
    levelScale: Math.max(1, ...ranged.map(({ max }) => max), world?.range?.max ?? 1),
    classes: classRows.map((row) => ({ ref: row.ref, talentTrees: count(row.values.talentTrees), abilities: count(row.values.abilities) })),
    // A crafting skill has recipes.
    craftingSkills: skillRows.flatMap((row) => { const recipes = count(row.values.recipes); return recipes ? [{ ref: row.ref, recipes }] : []; }),
    recipeCount: recipeRows.length,
    pageCounts: coverage.pages,
  };
};
