import { base } from '$app/paths';
import { AtlasDataLoader } from './atlas-data';
import type { PublicAdventureGuide, PublicAdventureGuideSummary, PublicGuideBoss, PublicGuideBossSummary, PublicGuideDungeon, PublicGuideDungeonSummary, StaticGuideDocument } from '@afallon/contracts/public';

export type GuideCounts = { dungeons: number; bosses: number; regions: number; properties: number };
export type GuideBoss = PublicGuideBoss | PublicGuideBossSummary;
export type GuideDungeon = PublicGuideDungeon | PublicGuideDungeonSummary;
export type GuideData = PublicAdventureGuide | PublicAdventureGuideSummary | {
  dungeons: GuideDungeon[];
  bosses: GuideBoss[];
  regions: PublicAdventureGuide['regions'];
  properties: PublicAdventureGuide['properties'];
};
export type GuideDocument = StaticGuideDocument;

export function guideSlug(key: string): string { return key.replaceAll(/[^A-Za-z0-9]+/g, '-'); }

export async function loadGuide(fetch: typeof globalThis.fetch, section: string) {
  const loader = new AtlasDataLoader((input, init) => fetch(new URL(input instanceof Request ? input.url : input).pathname, init), new URL(`${base}/data/`, 'http://atlas.invalid'));
  const document = await loader.loadGuide(section);
  return { guide: document.guide, entities: document.entities, counts: document.counts };
}
