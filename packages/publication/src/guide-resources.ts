import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { ArtifactStore } from "@afallon/artifacts";
import { queryCatalogGuide } from "@afallon/catalog";
import {
  StaticGuideDocumentSchema,
  type PublicEntity,
  type PublicGuideBoss,
  type PublicGuideBossSummary,
  type PublicGuideDungeon,
  type PublicGuideDungeonSummary,
  type StaticGuideDocument,
} from "@afallon/contracts/public";
import { projectAdventureGuide } from "./guide-projection";
import { writeStaticJson, type GeneratedStaticResource } from "./resources";

export async function generateGuideResources(
  db: Database,
  store: ArtifactStore,
  publicEntities: readonly PublicEntity[],
): Promise<ReadonlyMap<string, GeneratedStaticResource<StaticGuideDocument>>> {
  const facts = queryCatalogGuide(db);
  const guide = projectAdventureGuide({ entities: facts.records.entities, placements: facts.records.placements });
  const dungeonSummaries = guide.dungeons.map(summarizeDungeon);
  const bossSummaries = guide.bosses.map(summarizeBoss);
  const counts = { dungeons: guide.dungeons.length, bosses: guide.bosses.length, regions: guide.regions.length, properties: guide.properties.length };
  const documents = new Map<string, StaticGuideDocument>();
  const document = (value: StaticGuideDocument["guide"], entities: PublicEntity[] = []): StaticGuideDocument => ({
    schemaVersion: "compendium.static-guide.v1",
    buildId: facts.buildId,
    catalogId: facts.catalogId,
    counts,
    guide: value,
    entities,
  });
  documents.set("overview", document({ dungeons: dungeonSummaries, bosses: bossSummaries, regions: guide.regions, properties: guide.properties }));
  documents.set("dungeons", document({ dungeons: dungeonSummaries, bosses: [], regions: [], properties: [] }));
  documents.set("bosses", document({ dungeons: dungeonSummaries, bosses: bossSummaries, regions: [], properties: [] }));
  documents.set("regions", document({ dungeons: [], bosses: [], regions: guide.regions, properties: [] }));
  documents.set("properties", document({ dungeons: [], bosses: [], regions: [], properties: guide.properties }));
  for (const dungeon of guide.dungeons) {
    const itemKeys = new Set(dungeon.bosses.flatMap((boss) => boss.loot.map((loot) => loot.itemKey)));
    documents.set(`dungeon-${slug(dungeon.dungeonKey)}`, document({ dungeons: [dungeon], bosses: [], regions: [], properties: [] }, publicEntities.filter((entity) => itemKeys.has(entity.entityKey))));
  }
  for (const boss of guide.bosses) {
    const dungeonKeys = new Set(boss.dungeonKeys ?? []);
    documents.set(`boss-${slug(boss.bossKey)}`, document({ dungeons: dungeonSummaries.filter((dungeon) => dungeonKeys.has(dungeon.dungeonKey)), bosses: [boss], regions: [], properties: [] }, publicEntities.filter((entity) => boss.loot.some((loot) => loot.itemKey === entity.entityKey))));
  }
  const resources = new Map<string, GeneratedStaticResource<StaticGuideDocument>>();
  for (const [section, value] of [...documents].sort(([left], [right]) => left.localeCompare(right))) {
    Assert(StaticGuideDocumentSchema, value);
    resources.set(section, await writeStaticJson(store, value.schemaVersion, value));
  }
  return resources;
}

function summarizeBoss(boss: PublicGuideBoss): PublicGuideBossSummary {
  return { bossKey: boss.bossKey, label: boss.label, ...(boss.level === undefined ? {} : { level: boss.level }), ...(boss.levelRange ? { levelRange: boss.levelRange } : {}), placementIds: boss.placementIds, ...(boss.dungeonKeys ? { dungeonKeys: boss.dungeonKeys } : {}), lootCount: boss.loot.length };
}

function summarizeDungeon(dungeon: PublicGuideDungeon): PublicGuideDungeonSummary {
  return { dungeonKey: dungeon.dungeonKey, label: dungeon.label, ...(dungeon.description ? { description: dungeon.description } : {}), ...(dungeon.levelRange ? { levelRange: dungeon.levelRange } : {}), placementIds: dungeon.placementIds, bosses: dungeon.bosses.map(summarizeBoss) };
}

function slug(key: string): string {
  return key.replaceAll(/[^A-Za-z0-9]+/g, "-");
}
