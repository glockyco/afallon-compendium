import { expect, test } from "bun:test";
import type { EntityDetail } from "@afallon/contracts/catalog"
import { projectAdventureGuide } from "./guide-projection";

const placement = (placementId: string, sceneNativeId: number) => ({ placementId, sceneNativeId });

const entity = (value: Partial<EntityDetail> & Pick<EntityDetail, "entityKey" | "kind" | "nativeId" | "name">): EntityDetail => {
  const { entityKey, kind, nativeId, name, ...overrides } = value;
  return {
    entityKey,
    kind,
    nativeId,
    name,
    internalName: null,
    description: null,
    publicData: { localization: null, gameplay: null, icon: null },
    roles: [],
    placementIds: [],
    sources: [],
    relationships: {
      merchantStock: [],
      lootBindings: [],
      lootEntries: [],
      resourceYields: [],
      questAssociations: [],
      transitions: [],
      conditions: [],
    },
    provenance: [],
    ...overrides,
  };
};

test("projects only scenes included in the native guide", () => {
  const included = entity({
    entityKey: "scenes:10",
    kind: "scenes",
    nativeId: 10,
    name: "Duskfall Depths",
    publicData: {
      localization: { adventureGuideDescription: "The depths." },
      gameplay: {
        includedInAdventureGuide: true,
        dungeonLevelMin: 18,
        dungeonLevelMax: 20,
        adventureGuideBosses: [{ sourceIndex: 0, npcId: 7 }],
      },
      icon: null,
    },
  });
  const excluded = entity({
    entityKey: "scenes:11",
    kind: "scenes",
    nativeId: 11,
    name: "Hidden Scene",
    publicData: { localization: null, gameplay: { includedInAdventureGuide: false }, icon: null },
  });
  const boss = entity({
    entityKey: "npcs:7",
    kind: "npcs",
    nativeId: 7,
    name: "A Guide Boss",
    placementIds: ["boss-location"],
    publicData: { localization: null, gameplay: { minLevel: 22, maxLevel: 22 }, icon: null },
  });
  const guide = projectAdventureGuide({
    entities: [included, excluded, boss],
    placements: [placement("boss-location", 10)],
  });
  expect(guide.dungeons.map((row) => row.dungeonKey)).toEqual(["scenes:10"]);
  expect(guide.dungeons[0]?.description).toBe("The depths.");
  expect(guide.dungeons[0]?.levelRange).toEqual({ min: 18, max: 20 });
  expect(guide.dungeons[0]?.bosses[0]?.level).toBe(22);
  expect(guide.dungeons[0]?.bosses[0]?.placementIds).toEqual(["boss-location"]);
  expect(guide.bosses.map((row) => row.bossKey)).toEqual(["npcs:7"]);
});

test("preserves authored loot rate without inventing effective probability", () => {
  const item = entity({ entityKey: "items:116", kind: "items", nativeId: 116, name: "Ent bark Shield" });
  const boss = entity({
    entityKey: "npcs:87",
    kind: "npcs",
    nativeId: 87,
    name: "Thornmaw",
    publicData: { localization: null, gameplay: { minLevel: 22, maxLevel: 22 }, icon: null },
    relationships: {
      merchantStock: [],
      lootBindings: [],
      lootEntries: [{ lootTableId: 36, entryIndex: 0, itemId: 116, min: 1, max: 3, rawRate: 15.53 }],
      resourceYields: [],
      questAssociations: [],
      transitions: [],
      conditions: [],
    },
  });
  const scene = entity({
    entityKey: "scenes:10",
    kind: "scenes",
    nativeId: 10,
    name: "Duskfall Depths",
    publicData: { localization: null, gameplay: { includedInAdventureGuide: true, adventureGuideBosses: [{ sourceIndex: 0, npcId: 87 }] }, icon: null },
  });
  const bossGuide = projectAdventureGuide({ entities: [scene, boss, item], placements: [] }).bosses[0]!;
  expect(bossGuide.loot).toEqual([{ itemKey: "items:116", label: "Ent bark Shield", minimum: 1, maximum: 3, rawRate: 15.53 }]);
  expect(bossGuide.abilities).toBeUndefined();
  expect(bossGuide.stats).toBeUndefined();
});

test("projects optional phases, stats, regions, properties, and published locations", () => {
  const scene = entity({
    entityKey: "scenes:9",
    kind: "scenes",
    nativeId: 9,
    name: "Guide Dungeon",
    publicData: { localization: null, gameplay: { includedInAdventureGuide: true, adventureGuideBosses: [{ npcId: 7 }] }, icon: null },
  });
  const boss = entity({
    entityKey: "npcs:7",
    kind: "npcs",
    nativeId: 7,
    name: "A Guide Boss",
    publicData: {
      localization: null,
      gameplay: {
        minLevel: 1,
        maxLevel: 2,
        aiPhases: [{ phaseIndex: 0, name: "Opening", requirement: "Below half health", abilityIds: [3, 4] }],
        guideStats: [{ statId: 12, value: 99.5 }],
      },
      icon: null,
    },
  });
  const stat = entity({ entityKey: "stats:12", kind: "stats", nativeId: 12, name: null, internalName: "HealthStat", publicData: { localization: null, gameplay: {}, icon: null } });
  const region = entity({
    entityKey: "regions:3",
    kind: "regions",
    nativeId: 3,
    name: "Coalway Woods",
    placementIds: ["region-location", "unpublished-location"],
    publicData: { localization: null, gameplay: { includedInAdventureGuide: true, levelRangeMin: 1, levelRangeMax: 20, adventureGuideDescription: "The woods." }, icon: null },
  });
  const property = entity({
    entityKey: "properties:2",
    kind: "properties",
    nativeId: 2,
    name: "Oakenvale Inn",
    placementIds: ["property-location"],
    publicData: { localization: null, gameplay: { income: 42, adventureGuideDescription: "A warm inn." }, icon: null },
  });
  const guide = projectAdventureGuide({
    entities: [scene, boss, stat, region, property],
    placements: [placement("region-location", 3), placement("property-location", 3)],
    publishedPlacementIds: new Set(["region-location", "property-location"]),
  });
  expect(guide.bosses[0]?.levelRange).toEqual({ min: 1, max: 2 });
  expect(guide.bosses[0]?.abilities).toEqual([{ phaseIndex: 0, label: "Opening", requirement: "Below half health", abilityIds: [3, 4] }]);
  expect(guide.bosses[0]?.stats).toEqual([{ statId: 12, label: "HealthStat", value: 99.5 }]);
  expect(guide.regions[0]?.placementIds).toEqual(["region-location"]);
  expect(guide.properties[0]?.income).toBe(42);
  expect(guide.properties[0]?.placementIds).toEqual(["property-location"]);
});

test("uses localized names and omits null text values", () => {
  const scene = entity({
    entityKey: "scenes:12",
    kind: "scenes",
    nativeId: 12,
    name: null,
    publicData: {
      localization: { displayName: "Localized Depths", adventureGuideDescription: "null" },
      gameplay: { includedInAdventureGuide: true, adventureGuideBosses: [{ npcId: 8 }] },
      icon: null,
    },
  });
  const boss = entity({
    entityKey: "npcs:8",
    kind: "npcs",
    nativeId: 8,
    name: null,
    publicData: { localization: { displayName: "Localized Boss" }, gameplay: null, icon: null },
  });
  const item = entity({
    entityKey: "items:8",
    kind: "items",
    nativeId: 8,
    name: null,
    publicData: { localization: { displayName: "Localized Item" }, gameplay: null, icon: null },
  });
  boss.relationships.lootEntries.push({ lootTableId: 1, entryIndex: 0, itemId: 8, min: 1, max: 1, rawRate: 10 });
  const guide = projectAdventureGuide({ entities: [scene, boss, item], placements: [] });
  expect(guide.dungeons[0]?.label).toBe("Localized Depths");
  expect(guide.dungeons[0]?.description).toBeUndefined();
  expect(guide.bosses[0]?.label).toBe("Localized Boss");
  expect(guide.bosses[0]?.loot[0]?.label).toBe("Localized Item");
});
