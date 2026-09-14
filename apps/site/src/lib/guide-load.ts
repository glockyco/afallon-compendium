import { base } from '$app/paths';
import { Assert } from 'typebox/value';
import { StaticGuideDocumentSchema, StaticRootManifestSchema, assertStaticResourceIdentity, type PublicAdventureGuide, type PublicAdventureGuideSummary, type PublicEntity, type PublicGuideBoss, type PublicGuideBossSummary, type PublicGuideDungeon, type PublicGuideDungeonSummary, type StaticGuideDocument, type StaticRootManifest } from '@afallon/contracts/public';

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
  const rootResponse = await fetch(`${base}/data/publication.json`);
  if (!rootResponse.ok) throw new Error(`Publication request failed (${rootResponse.status})`);
  const root = (await rootResponse.json()) as StaticRootManifest;
  Assert(StaticRootManifestSchema, root);
  const reference = root.guides[section];
  if (!reference) throw new Error(`Publication has no guide section ${section}.`);
  const response = await fetch(`${base}/data/${reference.path}`);
  if (!response.ok) throw new Error(`Guide request failed (${response.status})`);
  const document = (await response.json()) as StaticGuideDocument;
  Assert(StaticGuideDocumentSchema, document);
  assertStaticResourceIdentity(root, document);
  return { guide: document.guide, entities: document.entities, counts: document.counts };
}
