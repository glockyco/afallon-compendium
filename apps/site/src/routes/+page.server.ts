import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';
import type { EntityRef, PlaceFacts } from '@afallon/contracts/public';

export interface HubPlace { ref: EntityRef; placeType: PlaceFacts['placeType']; min: number; max: number }
export interface HubSkill { ref: EntityRef; recipes: number }

// The hub reads the published pages when the site is built, so each place that it names has a page. A place shows a
// level range only when its page records one. Places without a range stay in the Places list.
export const load: PageServerLoad = async ({ parent }) => {
  const { registry } = await parent();
  const loader = serverMapLoader();
  const published = new Set<string>(registry.filter((entry) => entry.pages).map((entry) => entry.kind));
  const coverage = await loader.loadCoverage();

  const placeRows = published.has('places') ? (await loader.loadList('places')).rows : [];
  const placePages = await Promise.all(placeRows.flatMap((row) => row.ref.slug ? [loader.loadDocument('places', row.ref.slug)] : []));
  const places: HubPlace[] = placePages.flatMap((page) => page.kind === 'places' && page.document.facts.levelRange
    ? [{ ref: page.document.ref, placeType: page.document.facts.placeType, ...page.document.facts.levelRange }] : []);
  places.sort((left, right) => left.min - right.min || left.max - right.max || left.ref.name.localeCompare(right.ref.name));

  const classRows = published.has('classes') ? (await loader.loadList('classes')).rows : [];
  const skillRows = published.has('skills') ? (await loader.loadList('skills')).rows : [];
  // A crafting skill is a skill with recipes. The skill list records the number of recipes of each skill.
  const craftingSkills: HubSkill[] = skillRows.flatMap((row) => typeof row.values.recipes === 'number' && row.values.recipes > 0 ? [{ ref: row.ref, recipes: row.values.recipes }] : []);

  return {
    places,
    classes: classRows.map((row) => ({ ref: row.ref, talentTrees: typeof row.values.talentTrees === 'number' ? row.values.talentTrees : null })),
    craftingSkills,
    pageCounts: coverage.pages,
    placementCount: coverage.placementCount,
    mapCount: coverage.mapCount,
  };
};
