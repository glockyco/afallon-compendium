import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';
import type { ArtRef, EntityRef } from '@afallon/contracts/public';

export interface HubWorld { ref: EntityRef; range: { min: number; max: number } | null; artwork: ArtRef | null }
export interface HubDungeon { ref: EntityRef; min: number; max: number; artwork: ArtRef | null; bosses: Array<{ ref: EntityRef; portrait: ArtRef | null }> }
export interface HubBand { min: number; max: number; places: EntityRef[] }

// The hub reads the published pages when the site is built, so every place, boss, class, and skill that it names has a
// page. It shows a level range only when a place page records one.
export const load: PageServerLoad = async ({ parent }) => {
  const { registry } = await parent();
  const loader = serverMapLoader();
  const published = new Set<string>(registry.filter((entry) => entry.pages).map((entry) => entry.kind));
  const [root, coverage] = await Promise.all([loader.loadRoot(), loader.loadCoverage()]);

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

  return {
    world,
    dungeons,
    bands,
    // The level bars share one scale, from level 1 to the highest recorded level.
    levelScale: Math.max(1, ...ranged.map(({ max }) => max), world?.range?.max ?? 1),
    classes: classRows.map((row) => ({ ref: row.ref, talentTrees: count(row.values.talentTrees), abilities: count(row.values.abilities) })),
    // A crafting skill is a skill with recipes. The skill list records the number of recipes of each skill.
    craftingSkills: skillRows.flatMap((row) => { const recipes = count(row.values.recipes); return recipes ? [{ ref: row.ref, recipes }] : []; }),
    pageCounts: coverage.pages,
  };
};
