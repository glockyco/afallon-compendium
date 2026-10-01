import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogItemFacts, CatalogNpcFacts, CatalogRelations } from "@afallon/contracts/catalog";
import { buildEntityReferences } from "./references";

const entity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({
  entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [],
});

const emptyFacts: CatalogFacts = { entities: [], items: [], npcs: [], quests: [], tasks: [], places: [], properties: [], abilities: [], recipes: [], gearSets: [], progression: { facts: [], links: [], talentNodes: [], spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] }, gatheringNodes: [] };
const emptyRelations: CatalogRelations = { drops: [], vendors: [], gathers: [], containers: [], interactions: [], quests: [], recipes: [], placements: [], transitions: [], conditions: [], gatedSources: [] };

function npcFact(entityKey: string, health = 100): CatalogNpcFacts {
  return { entityKey, minLevel: 100, maxLevel: 100, scalesWithPlayer: false, npcType: null, creatureType: null, family: null,
    faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, lowerLevelExperienceModifier: null, higherLevelExperienceModifier: null, experienceBonusPerLevel: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [{ stat: { entityKey: "stats:1", label: "Health" }, amount: health, isPercent: false }], abilityPhases: [],
    factionRewards: [], linkedNpc: null, lootSpecialization: null };
}

function itemFact(entityKey: string, armorType: string): CatalogItemFacts {
  return { entityKey, rarity: "COMMON", itemType: "ARMOR", armorSlot: "CHEST", weaponSlot: null, weaponType: null, armorType, attackSpeed: null,
    minDamage: null, maxDamage: null, stats: [], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: null,
    sellPrice: null, sellCurrency: null, buyPrice: null, buyCurrency: null, currency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    equipmentRequirements: [], useConditions: [], actionAbilities: [], gameActions: [], useLines: [], conditionIds: [], gearSet: null };
}

const placement = (placementId: string, npcEntityKey: string, area: string) => ({ placementId, sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: null, area, roles: [{ role: "npc", npcEntityKey, scope: "authored" }], families: [], randomChoices: [] });

test("groups the records of one creature name into one page whose variants need no label when their facts match", () => {
  const entities = [entity("npcs", 206, "Fenric Doryn"), entity("npcs", 225, "fenric doryn"), entity("npcs", 234, "Fenric Doryn")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: entities.map((row) => npcFact(row.entityKey)) };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect([...pages.keys()]).toEqual(["npcs:206"]);
  expect(pages.get("npcs:206")).toMatchObject({ ref: { name: "Fenric Doryn", slug: "fenric-doryn" }, variantFields: [] });
  expect(refs.get("npcs:225")).toMatchObject({ key: "npcs:206", name: "Fenric Doryn", slug: "fenric-doryn", variant: "n225" });
  expect(() => (refs as Map<string, unknown>).clear()).toThrow("frozen");
});

test("names the variant in a record reference when the variants differ in facts that the page shows", () => {
  const entities = [entity("scenes", 10, "World"), entity("npcs", 1, "Cragborn Alpha"), entity("npcs", 2, "Cragborn Alpha")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:1", 800), npcFact("npcs:2", 300)] };
  const relations: CatalogRelations = { ...emptyRelations, placements: [placement("p1", "npcs:1", "Skittershade mine"), placement("p2", "npcs:2", "Glacier cave")] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations });
  expect(pages.get("npcs:1")?.variantFields).toEqual(["stats"]);
  expect(refs.get("npcs:2")).toMatchObject({ key: "npcs:1", name: "Cragborn Alpha (Glacier Cave)", variant: "glacier-cave" });
});

test("does not treat stats in another order or a stat of zero as a difference between variants", () => {
  const entities = [entity("npcs", 76, "Outlaw Rogue"), entity("npcs", 77, "Outlaw Rogue")];
  const stat = (entityKey: string, label: string, amount: number) => ({ stat: { entityKey, label }, amount, isPercent: false });
  const first = { ...npcFact("npcs:76"), stats: [stat("stats:1", "Health", 687.2), stat("stats:2", "Strength", 9)] };
  const second = { ...npcFact("npcs:77"), stats: [stat("stats:2", "Strength", 9), stat("stats:1", "Health", 687.2), stat("stats:3", "Spirit", 0)] };
  const { pages } = buildEntityReferences(entities, { facts: { ...emptyFacts, entities, npcs: [first, second] }, relations: emptyRelations });
  expect(pages.get("npcs:76")?.variantFields).toEqual([]);
});

test("publishes one ability page whose versions group the records that share their rank texts", () => {
  const ranks = (text: string) => [{ rankIndex: 0, lines: [{ spans: [{ text, tone: null, italic: false }] }] }];
  const entities = [entity("abilities", 0, "Cleave"), entity("abilities", 72, "Cleave"), entity("abilities", 95, "Cleave")];
  const facts: CatalogFacts = { ...emptyFacts, entities, abilities: [
    { entityKey: "abilities:0", ranks: ranks("Cooldown: 4 sec") }, { entityKey: "abilities:72", ranks: ranks("Cooldown: 1 sec") }, { entityKey: "abilities:95", ranks: ranks("Cooldown: 1 sec") },
  ] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(pages.get("abilities:0")?.versions.map((version) => [version.anchor, version.members.map((member) => member.entityKey)])).toEqual([["n0", ["abilities:0"]], ["n72", ["abilities:72", "abilities:95"]]]);
  expect(refs.get("abilities:95")).toMatchObject({ key: "abilities:0", name: "Cleave", slug: "cleave", variant: "n72" });
});

test("qualifies separate items of one name by the fact that differs, and compares names without case", () => {
  const entities = [entity("items", 0, "Peasant Chest"), entity("items", 4, "Peasant chest"), entity("stats", 3, "Power")];
  const facts: CatalogFacts = { ...emptyFacts, entities, items: [itemFact("items:0", "CLOTH"), itemFact("items:4", "LEATHER")] };
  const { refs } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(refs.get("items:0")).toMatchObject({ name: "Peasant Chest (Cloth)", slug: "peasant-chest-cloth" });
  expect(refs.get("items:4")).toMatchObject({ name: "Peasant Chest (Leather)", slug: "peasant-chest-leather" });
  expect(refs.get("stats:3")).toEqual({ key: "stats:3", kind: "stats", name: "Power" });
});

test("qualifies places of one name by the area of their entrance and numbers places that share it", () => {
  const entities = [entity("scenes", 47, "Afallon"), entity("scenes", 31, "Cave"), entity("scenes", 32, "Cave"), entity("scenes", 34, "Cave"), entity("scenes", 43, "Glacier Cave"), entity("scenes", 44, "Glacier Cave")];
  const place = (entityKey: string, levelRange: { min: number; max: number } | null) => ({ entityKey, placeType: "zone" as const, guideIncluded: false, guideDescription: null, levelRange, mapSpaceIds: [], bosses: [], parentSceneKey: null });
  const facts: CatalogFacts = { ...emptyFacts, entities, places: [place("scenes:31", { min: 15, max: 30 }), place("scenes:32", { min: 15, max: 30 }), place("scenes:34", { min: 15, max: 30 }), place("scenes:43", null), place("scenes:44", { min: 20, max: 30 })] };
  const door = (placementId: string, area: string) => ({ placementId, sceneNativeId: 47, sceneKey: "scenes:47", mapSpaceId: "world", label: null, area, roles: [], families: [], randomChoices: [] });
  const relations: CatalogRelations = { ...emptyRelations, placements: [door("d31", "Coalway woods"), door("d32", "Coalway woods"), door("d34", "Oakenvale")], transitions: [
    { transitionId: "t31", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:31", transitionKind: "effect-teleport", placementIds: ["d31"], start: null },
    { transitionId: "t32", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:32", transitionKind: "effect-teleport", placementIds: ["d32"], start: null },
    { transitionId: "t34", sourceSceneKey: "scenes:47", destinationSceneKey: "scenes:34", transitionKind: "effect-teleport", placementIds: ["d34"], start: null },
  ] };
  const { refs } = buildEntityReferences(entities, { facts, relations });
  expect(["scenes:31", "scenes:32", "scenes:34", "scenes:43", "scenes:44"].map((key) => refs.get(key)?.name)).toEqual(["Cave (Coalway Woods 1)", "Cave (Coalway Woods 2)", "Cave (Oakenvale)", "Glacier Cave (1)", "Glacier Cave (Level 20–30)"]);
});

test("labels variants that no fact tells apart by their position and keeps native id anchors for them", () => {
  const entities = [entity("npcs", 76, "Outlaw Rogue"), entity("npcs", 77, "Outlaw Rogue"), entity("npcs", 90, "Outlaw Rogue")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:76", 100), npcFact("npcs:77", 200), npcFact("npcs:90", 300)] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect(pages.get("npcs:76")?.members.map((member) => [member.label, member.anchor])).toEqual([["Variant 1", "n76"], ["Variant 2", "n77"], ["Variant 3", "n90"]]);
  expect(refs.get("npcs:77")).toMatchObject({ name: "Outlaw Rogue (Variant 2)", variant: "n77" });
});

test("gives each unnamed record its own page and a name without its native id", () => {
  const entities = [entity("npcs", 125, ""), entity("npcs", 130, "  "), entity("scenes", 1, "")];
  const facts: CatalogFacts = { ...emptyFacts, entities, npcs: [npcFact("npcs:125"), npcFact("npcs:130")] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations: emptyRelations });
  expect([...pages.keys()]).toEqual(["npcs:125", "npcs:130", "scenes:1"]);
  expect(["npcs:125", "npcs:130", "scenes:1"].map((key) => refs.get(key)?.name)).toEqual(["Unnamed NPC (1)", "Unnamed NPC (2)", "Unnamed Place"]);
});

test("drops apostrophes instead of splitting a slug", () => {
  const { refs } = buildEntityReferences([entity("items", 1040, "Oathbreaker's Edge"), entity("abilities", 8, "Nature’s Grasp")]);
  expect(refs.get("items:1040")?.slug).toBe("oathbreakers-edge");
  expect(refs.get("abilities:8")?.slug).toBe("natures-grasp");
});

test("adds the native id when distinct names produce the same slug", () => {
  const { refs } = buildEntityReferences([entity("items", 11, "A B"), entity("items", 12, "A-B")]);
  expect(refs.get("items:11")?.slug).toBe("a-b");
  expect(refs.get("items:12")?.slug).toBe("a-b-12");
});

test("a record that shares its name only with an excluded record loses its qualifier", () => {
  const catacombs = [entity("scenes", 29, "Coalway catacombs"), entity("scenes", 37, "Coalway catacombs")];
  expect(buildEntityReferences(catacombs).refs.get("scenes:37")).toMatchObject({ name: "Coalway Catacombs (2)", slug: "coalway-catacombs-2" });
  const { refs, pages } = buildEntityReferences(catacombs, { excluded: new Set(["scenes:29"]) });
  expect(refs.get("scenes:37")).toMatchObject({ name: "Coalway Catacombs", slug: "coalway-catacombs" });
  // The excluded record keeps its formatted name for text, but it has no page and no link.
  expect(refs.get("scenes:29")).toEqual({ key: "scenes:29", kind: "places", name: "Coalway Catacombs" });
  expect([...pages.keys()]).toEqual(["scenes:37"]);
});

test("recipes link the product Crafting section, a skill row, or plain text", () => {
  const entities = [entity("recipes", 1, "Runeweave Regalia"), entity("items", 1, "Runeweave Regalia"),
    entity("recipes", 2, "Ring of Bleed Damage"), entity("items", 2, "Bloodthrall Signet"),
    entity("recipes", 3, "Demonic Bulwark Looted"), entity("skills", 1, "Smithing"), entity("recipes", 4, "Unmapped Craft")];
  const facts: CatalogFacts = { ...emptyFacts, entities, recipes: [
    { entityKey: "recipes:1", skill: null, station: null, learnedByDefault: true, ranks: [] },
    { entityKey: "recipes:2", skill: null, station: null, learnedByDefault: false, ranks: [] },
    { entityKey: "recipes:3", skill: { entityKey: "skills:1", label: "Smithing" }, station: null, learnedByDefault: false, ranks: [] },
    { entityKey: "recipes:4", skill: null, station: null, learnedByDefault: false, ranks: [] },
  ] };
  const relations: CatalogRelations = { ...emptyRelations, recipes: [
    { recipe: { entityKey: "recipes:1", label: "Runeweave Regalia" }, item: { entityKey: "items:1", label: "Runeweave Regalia" }, role: "product", count: 1, rank: 0, chance: 100 },
    { recipe: { entityKey: "recipes:2", label: "Ring of Bleed Damage" }, item: { entityKey: "items:2", label: "Bloodthrall Signet" }, role: "product", count: 1, rank: 0, chance: 100 },
  ] };
  const { refs, pages } = buildEntityReferences(entities, { facts, relations });
  expect(pages.has("recipes:1")).toBe(false);
  expect(refs.get("recipes:1")).toEqual({ key: "items:1", kind: "items", name: "Runeweave Regalia", slug: "runeweave-regalia", variant: "crafting" });
  expect(refs.get("recipes:2")).toEqual({ key: "items:2", kind: "items", name: "Ring of Bleed Damage", slug: "bloodthrall-signet", variant: "crafting" });
  expect(refs.get("recipes:3")).toEqual({ key: "skills:1", kind: "skills", name: "Demonic Bulwark Looted", slug: "smithing", variant: "recipe-demonic-bulwark-looted" });
  expect(refs.get("recipes:4")).toEqual({ key: "recipes:4", kind: "recipes", name: "Unmapped Craft" });
});
