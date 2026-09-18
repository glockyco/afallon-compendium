import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations } from "@afallon/contracts/catalog";
import { buildEntityReferences } from "./references";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({
  entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [],
});

const emptyFacts: CatalogFacts = { entities: [], items: [], npcs: [], quests: [], tasks: [], places: [], properties: [], abilities: [], recipes: [] };
const emptyRelations: CatalogRelations = { drops: [], vendors: [], gathers: [], containers: [], quests: [], recipes: [], placements: [], transitions: [], conditions: [] };

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

test("uses native ids for equal item names and omits slugs for page-less kinds", () => {
  const entities = [entity("items", 7, "Iron Ring"), entity("items", 9, "Iron Ring"), entity("stats", 3, "Power")];
  const refs = buildEntityReferences(entities, { facts: { ...emptyFacts, entities }, relations: emptyRelations });
  expect(refs.get("items:7")).toMatchObject({ name: "Iron Ring (#7)", slug: "iron-ring-7" });
  expect(refs.get("items:9")).toMatchObject({ name: "Iron Ring (#9)", slug: "iron-ring-9" });
  expect(refs.get("stats:3")).toEqual({ key: "stats:3", kind: "stats", name: "Power" });
});

test("adds the native id when distinct names produce the same slug", () => {
  const entities = [entity("items", 11, "A B"), entity("items", 12, "A-B")];
  const refs = buildEntityReferences(entities);
  expect(refs.get("items:11")?.slug).toBe("a-b");
  expect(refs.get("items:12")?.slug).toBe("a-b-12");
});
