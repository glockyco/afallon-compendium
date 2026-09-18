import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogItemFacts, CatalogNpcFacts, CatalogRelations } from "@afallon/contracts/catalog";
import { buildEntityReferences } from "./references";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({
  entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [],
});

const emptyFacts: CatalogFacts = { entities: [], items: [], npcs: [], quests: [], tasks: [], places: [], properties: [], abilities: [], recipes: [], gearSets: [] };
const emptyRelations: CatalogRelations = { drops: [], vendors: [], gathers: [], containers: [], quests: [], recipes: [], placements: [], transitions: [], conditions: [] };

function npcFact(entityKey: string, level: number, abilities: CatalogNpcFacts["abilityPhases"] = []): CatalogNpcFacts {
  return { entityKey, minLevel: level, maxLevel: level, scalesWithPlayer: false, npcType: null, creatureType: null, family: null,
    faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: abilities,
    factionRewards: [], linkedNpc: null, lootSpecialization: null };
}

function itemFact(entityKey: string, rarity: string, armorSlot: string): CatalogItemFacts {
  return { entityKey, rarity, itemType: "ARMOR", armorSlot, weaponSlot: null, weaponType: null, armorType: "LEATHER", attackSpeed: null,
    minDamage: null, maxDamage: null, stats: [], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: null,
    sellPrice: null, sellCurrency: null, buyPrice: null, buyCurrency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    levelRequirement: null, actionAbilities: [], conditionIds: [], gearSet: null };
}

test("disambiguates equal NPC names by level and freezes the reference map", () => {
  const entities = [entity("npcs", 1, "Warden"), entity("npcs", 2, "Warden")];
  const facts: CatalogFacts = { ...emptyFacts, entities,
    npcs: entities.map((row, index) => ({ entityKey: row.entityKey, minLevel: 21 + index, maxLevel: 21 + index, scalesWithPlayer: false,
      npcType: null, creatureType: null, family: null, faction: null, species: null, isMerchant: false, isQuestGiver: false,
      isCombatEnabled: true, minRespawn: null, maxRespawn: null, minExperience: null, maxExperience: null, immuneToStun: false,
      immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [], factionRewards: [], linkedNpc: null, lootSpecialization: null })),
  };
  const refs = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("npcs:1")).toMatchObject({ name: "Warden (lvl. 21)", slug: "warden-lvl-21" });
  expect(refs.get("npcs:2")).toMatchObject({ name: "Warden (lvl. 22)", slug: "warden-lvl-22" });
  expect(() => (refs as Map<string, unknown>).clear()).toThrow("frozen");
});

test("uses item facts for names while preserving stable slugs and page-less references", () => {
  const entities = [entity("items", 7, "Iron Ring"), entity("items", 9, "Iron Ring"), entity("stats", 3, "Power")];
  const facts: CatalogFacts = { ...emptyFacts, entities, items: [itemFact("items:7", "Rare", "FINGER"), itemFact("items:9", "Epic", "FINGER")] };
  const refs = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("items:7")).toMatchObject({ name: "Iron Ring (Rare, Finger)", slug: "iron-ring-7" });
  expect(refs.get("items:9")).toMatchObject({ name: "Iron Ring (Epic, Finger)", slug: "iron-ring-9" });
  expect(refs.get("stats:3")).toEqual({ key: "stats:3", kind: "stats", name: "Power" });
});

test("uses ability users for duplicate ability names without changing their slugs", () => {
  const entities = [entity("abilities", 5, "Cleave"), entity("abilities", 6, "Cleave"),
    entity("npcs", 10, "Skeleton Warrior"), entity("npcs", 11, "Crypt Warden")];
  const facts: CatalogFacts = { ...emptyFacts, entities,
    npcs: [
      npcFact("npcs:10", 10, [{ phaseIndex: 0, name: null, requirement: null, abilities: [{ entityKey: "abilities:5", label: "Cleave" }] }]),
      npcFact("npcs:11", 11, [{ phaseIndex: 0, name: null, requirement: null, abilities: [{ entityKey: "abilities:6", label: "Cleave" }] }]),
    ],
    abilities: [{ entityKey: "abilities:5" }, { entityKey: "abilities:6" }],
  };
  const refs = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("abilities:5")).toMatchObject({ name: "Cleave (Skeleton Warrior)", slug: "cleave-5" });
  expect(refs.get("abilities:6")).toMatchObject({ name: "Cleave (Crypt Warden)", slug: "cleave-6" });
});

test("uses a place parent when duplicate place types do not distinguish names", () => {
  const entities = [entity("scenes", 1, "North Reach"), entity("scenes", 2, "South Reach"), entity("scenes", 3, "Cave"), entity("scenes", 4, "Cave")];
  const facts: CatalogFacts = { ...emptyFacts, entities, places: [
    { entityKey: "scenes:3", placeType: "interior", guideIncluded: false, guideDescription: null, levelRange: null, mapSpaceIds: [], bosses: [], parentSceneKey: "scenes:1" },
    { entityKey: "scenes:4", placeType: "interior", guideIncluded: false, guideDescription: null, levelRange: null, mapSpaceIds: [], bosses: [], parentSceneKey: "scenes:2" },
  ] };
  const refs = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("scenes:3")).toMatchObject({ name: "Cave (North Reach)", slug: "cave-3" });
  expect(refs.get("scenes:4")).toMatchObject({ name: "Cave (South Reach)", slug: "cave-4" });
});

test("uses level ranges and map labels before place ids", () => {
  const entities = [entity("scenes", 20, "Abandoned quarry"), entity("scenes", 21, "Abandoned quarry"), entity("scenes", 30, "Cave"), entity("scenes", 31, "Cave")];
  const facts: CatalogFacts = { ...emptyFacts, entities, places: [
    { entityKey: "scenes:20", placeType: "dungeon", guideIncluded: false, guideDescription: null, levelRange: { min: 1, max: 5 }, mapSpaceIds: [], bosses: [], parentSceneKey: null },
    { entityKey: "scenes:21", placeType: "dungeon", guideIncluded: false, guideDescription: null, levelRange: { min: 1, max: 20 }, mapSpaceIds: [], bosses: [], parentSceneKey: null },
    { entityKey: "scenes:30", placeType: "interior", guideIncluded: false, guideDescription: null, levelRange: null, mapSpaceIds: ["cave-a"], bosses: [], parentSceneKey: null },
    { entityKey: "scenes:31", placeType: "interior", guideIncluded: false, guideDescription: null, levelRange: null, mapSpaceIds: ["cave-b"], bosses: [], parentSceneKey: null },
  ] };
  const refs = buildEntityReferences(entities, { facts, relations: emptyRelations, mapSpaceLabels: new Map([["cave-a", "North cave"], ["cave-b", "South cave"]]) });
  expect(refs.get("scenes:20")?.name).toBe("Abandoned quarry (lvl. 1–5)");
  expect(refs.get("scenes:21")?.name).toBe("Abandoned quarry (lvl. 1–20)");
  expect(refs.get("scenes:30")?.name).toBe("Cave (North cave)");
  expect(refs.get("scenes:31")?.name).toBe("Cave (South cave)");
});

test("drops apostrophes instead of splitting a slug", () => {
  const refs = buildEntityReferences([entity("items", 1040, "Oathbreaker's Edge"), entity("abilities", 8, "Nature’s Grasp")]);
  expect(refs.get("items:1040")?.slug).toBe("oathbreakers-edge");
  expect(refs.get("abilities:8")?.slug).toBe("natures-grasp");
});

test("adds the native id when distinct names produce the same slug", () => {
  const entities = [entity("items", 11, "A B"), entity("items", 12, "A-B")];
  const refs = buildEntityReferences(entities);
  expect(refs.get("items:11")?.slug).toBe("a-b");
  expect(refs.get("items:12")?.slug).toBe("a-b-12");
});
