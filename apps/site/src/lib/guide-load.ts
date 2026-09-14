import { base } from '$app/paths';
import type { PublicAdventureGuide, PublicAdventureGuideSummary, PublicEntity, PublicGuideBoss, PublicGuideBossSummary, PublicGuideDungeon, PublicGuideDungeonSummary } from '../../../../pipeline/public-contracts';

export type GuideCounts = { dungeons: number; bosses: number; regions: number; properties: number };
export type GuideBoss = PublicGuideBoss | PublicGuideBossSummary;
export type GuideDungeon = PublicGuideDungeon | PublicGuideDungeonSummary;
export type GuideData = PublicAdventureGuide | PublicAdventureGuideSummary | {
  dungeons: GuideDungeon[];
  bosses: GuideBoss[];
  regions: PublicAdventureGuide['regions'];
  properties: PublicAdventureGuide['properties'];
};
export type GuideDocument = { schemaVersion: 'compendium.adventure-guide.v1'; buildId: string; counts: GuideCounts; guide: GuideData; entities: PublicEntity[] };

export function guideSlug(key: string): string { return key.replaceAll(/[^A-Za-z0-9]+/g, '-'); }

export async function loadGuide(fetch: typeof globalThis.fetch, section: string) {
  const response = await fetch(`${base}/data/guide-${section}.json`);
  if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
  const document = (await response.json()) as GuideDocument;
  if (document.schemaVersion !== 'compendium.adventure-guide.v1') throw new Error('Unsupported guide schema.');
  if (!document.counts) throw new Error('Guide document is missing group counts.');
  return { guide: document.guide, entities: document.entities, counts: document.counts };
}
