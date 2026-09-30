import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTaskFacts, CatalogRequirement, CatalogQuestRow } from "@afallon/contracts/catalog";
import { STATIC_DOCUMENT_SCHEMA_IDS, type PublicAbility, type PublicDocument, type PublicItem, type PublicNpc, type PublicPlace, type PublicProperty, type PublicQuest, type PublicSkill } from "@afallon/contracts/public";
import type { CatalogGatheringNode, CatalogMechanicsRule } from "@afallon/contracts/catalog";
import { readerCoverage } from "./coverage";
import { projectGatheringNodeDocuments, spawnerGroups, spawnerShares } from "./gathering";
import { conditionsById, projectPublicDocuments, projectQuestObjective, requirementsFor, type DocumentProjectionInput } from "./documents";
import { assertCompleteTooltipCoverage, auditPublicTooltipCoverage } from "./tooltip-coverage";
import { searchAliases } from "./index-resources";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";
import { placeSpots } from "./place-spots";

const entities: CatalogEntityRow[] = [
  { entityKey: "items:1", kind: "items", nativeId: 1, name: "<color=red>Oathbreaker's Edge</color>", description: "<b>Sharp</b><br>Steel", iconAssetName: null, artwork: [] },
  { entityKey: "npcs:2", kind: "npcs", nativeId: 2, name: "Guardian", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "quests:3", kind: "quests", nativeId: 3, name: "Trial", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "stats:5", kind: "stats", nativeId: 5, name: "Loot stat", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "stats:27", kind: "stats", nativeId: 27, name: "Strength", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "stats:53", kind: "stats", nativeId: 53, name: "Item power", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "classes:0", kind: "classes", nativeId: 0, name: "Shieldmaster", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "classes:5", kind: "classes", nativeId: 5, name: "Assassin", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "scenes:10", kind: "scenes", nativeId: 10, name: "Crypt", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "stats:12", kind: "stats", nativeId: 12, name: "Poison Damage", description: null, iconAssetName: null, artwork: [] },
  { entityKey: "gearSets:17", kind: "gearSets", nativeId: 17, name: "Adept Leather", description: null, iconAssetName: null, artwork: [] },
];

const emptyRequirementReferences: CatalogRequirement["references"] = {
  ability: null, bonus: null, recipe: null, resource: null, effect: null, npc: null, stat: null, faction: null, combo: null, race: null, levels: null, class: null, species: null, item: null, currency: null, point: null, talentTree: null, skill: null, spellbook: null, weaponTemplate: null, enchantment: null, gearSet: null, gameScene: null, quest: null, dialogue: null,
};
const emptyRequirementSubtypes: CatalogRequirement["subtypes"] = { effectTag: null, factionStance: null, itemType: null, weaponType: null, weaponSlot: null, armorType: null, armorSlot: null, gender: null, npcFamily: null, region: null };
function requirement(type: string, label: string, overrides: Partial<CatalogRequirement> = {}): CatalogRequirement {
  return { type: { value: 0, name: type }, rule: { value: 0, name: "Mandatory" }, label, spans: [{ text: label }], references: { ...emptyRequirementReferences }, knowledge: null, state: null, comparison: null, value: null, ownership: null, itemCondition: null, progression: null, entity: null, pointType: null, dialogueNodeState: null, effectCondition: null, amountType: null, timeType: null, timeValue: null, effectType: null, questState: null, amounts: { primary: 0, secondary: 0, float: 0, isPercent: false }, flags: { consume: false, first: false, second: false, third: false }, subtypes: { ...emptyRequirementSubtypes }, dialogueNode: null, times: [null, null], ...overrides };
}
const equipmentRequirements = [
  { mode: "any" as const, checkCount: true, requiredCount: 1, requirements: [
    requirement("Class", "Shieldmaster", { rule: { value: 1, name: "Optional" }, references: { ...emptyRequirementReferences, class: { entityKey: "classes:0", label: "Shieldmaster" } }, spans: [{ endpoint: { entityKey: "classes:0", label: "Shieldmaster" } }] }),
    requirement("Class", "Assassin", { rule: { value: 1, name: "Optional" }, references: { ...emptyRequirementReferences, class: { entityKey: "classes:5", label: "Assassin" } }, spans: [{ endpoint: { entityKey: "classes:5", label: "Assassin" } }] }),
  ] },
  { mode: "all" as const, checkCount: false, requiredCount: null, requirements: [requirement("Level", "Level 27", { type: { value: 13, name: "Level" }, amounts: { primary: 27, secondary: 0, float: 0, isPercent: false } })] },
];

const facts: CatalogFacts = {
  entities,
  progression: { facts: [], links: [], talentNodes: [], spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] }, gatheringNodes: [],
  items: [{ entityKey: "items:1", rarity: "Rare", itemType: "WEAPON", armorSlot: "BELT", weaponSlot: "MAIN HAND", weaponType: "One handed sword", armorType: "CLOTH",
    attackSpeed: 1.8, minDamage: 75, maxDamage: 124, stats: [
      { stat: { entityKey: "stats:53", label: "Item power" }, amount: 99, isPercent: false },
      { stat: { entityKey: "stats:27", label: "Strength" }, amount: 42, isPercent: false },
    ], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: { entityKey: null, label: "Enchantment -1" }, sellPrice: null,
    sellCurrency: null, buyPrice: 0, buyCurrency: { entityKey: null, label: "Currency -1" }, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    equipmentRequirements, useConditions: [], actionAbilities: [], gameActions: [], useLines: [{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }], conditionIds: ["oathbreaker"], gearSet: { entityKey: "gearSets:17", label: "Adept Leather" } }],
  npcs: [{ entityKey: "npcs:2", minLevel: 5, maxLevel: 5, scalesWithPlayer: false, npcType: "Enemy", creatureType: null, family: null,
    faction: null, species: { entityKey: null, label: "Species -1" }, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, lowerLevelExperienceModifier: null, higherLevelExperienceModifier: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [],
    factionRewards: [], linkedNpc: null, lootSpecialization: { armorType: "PLATE", weaponTypes: ["AXE", "Shield"], stat: { entityKey: "stats:5", label: "Item power" } } }],
  quests: [{ entityKey: "quests:3", chainName: null, chainOrder: null, repeatable: false, turnInWithoutNpc: false, completedDescription: null,
    objectiveText: null, levelRequirement: null, levelRange: null, dungeon: null, experience: null, conditionIds: [], worldQuest: null }],
  tasks: [], places: [{ entityKey: "scenes:10", placeType: "dungeon", guideIncluded: true, guideDescription: null, levelRange: null,
    mapSpaceIds: ["world"], bosses: [], parentSceneKey: null }], properties: [], abilities: [], recipes: [],
  gearSets: [{ entityKey: "gearSets:17", members: [{ entityKey: "items:1", label: "Blade" }, { entityKey: null, label: "Item 999" }], tiers: [
    { equipped: 3, stats: [{ stat: { entityKey: "stats:12", label: "Poison Damage" }, amount: 10, isPercent: true }] },
    { equipped: 7, stats: [{ stat: { entityKey: "stats:27", label: "Strength" }, amount: 40, isPercent: false }] },
  ] }],
};

const relations: CatalogRelations = {
  drops: [{ context: "npc", owner: { entityKey: "npcs:2", label: "Guardian" }, item: { entityKey: "items:1", label: "Blade" },
    lootTableId: 4, entryIndex: 0, min: 1, max: 2, rawRate: 0.125, displayedChance: 12.5, tableRate: 100, tableMinimum: null, tableLimit: null, creatureLevel: null, conditionIds: [], placementIds: ["p1"] }],
  vendors: [],
  gathers: [
    { producerLabel: "Iron node", sourceId: "source-1", sceneNativeId: 10, resource: null, gatheringNode: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p1"] },
    { producerLabel: "Iron node", sourceId: "source-2", sceneNativeId: 10, resource: null, gatheringNode: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p2"] },
  ],
  containers: [
    { containerType: "Chest", sourceId: "container-1", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, availability: [], placementIds: ["p1"] },
    { containerType: "Chest", sourceId: "container-2", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, availability: [], placementIds: ["p2"] },
  ], interactions: [], quests: [], recipes: [],
  placements: [{ placementId: "p1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Guardian", area: null, roles: [{ role: "boss", npcEntityKey: "npcs:2", scope: "authored" }], families: [], randomChoices: [] }],
  transitions: [{ transitionId: "transition-1", sourceSceneKey: "scenes:10", destinationSceneKey: null, transitionKind: "effect-teleport", placementIds: ["p2"], start: null }],
  conditions: [{ conditionId: "oathbreaker", semantics: "equipment", scope: "equipment", label: "Requirements", requirements: equipmentRequirements }], gatedSources: [],
};

function project(projectEntities: CatalogEntityRow[], projectFacts: CatalogFacts, projectRelations: CatalogRelations, placements: DocumentProjectionInput["placements"] = new Map(), regionIdsByMapSpace: DocumentProjectionInput["regionIdsByMapSpace"] = new Map(), npcLevels: DocumentProjectionInput["npcLevels"] = new Map(), placementIdsByKey: DocumentProjectionInput["placementIdsByKey"] = new Map()) {
  const references = buildEntityReferences(projectEntities, { facts: projectFacts, relations: projectRelations });
  const documents = projectPublicDocuments({ entities: projectEntities, facts: projectFacts, relations: projectRelations, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements, regionIdsByMapSpace, npcLevels, placementIdsByKey });
  return { refs: references.refs, documents };
}

test("projects one symmetric boss drop row and strips native rich text", () => {
  const { documents } = project(entities, facts, relations, new Map([
    ["p1", { placementId: "p1", mapSpaceId: "world", label: "World", categories: ["boss"] }],
    ["p2", { placementId: "p2", mapSpaceId: "world", label: "World", categories: ["container"] }],
  ]), new Map([["world", ["region-1"]]]));
  const item = documents.get("items:1") as PublicItem, npc = documents.get("npcs:2") as PublicNpc, place = documents.get("scenes:10") as PublicPlace;
  expect(item.ref.name).toBe("Oathbreaker's Edge");
  expect(item.description).toBe("Sharp\nSteel");
  expect(item.facts).toMatchObject({ weaponSlot: "MAIN HAND", weaponType: "One handed sword", attackSpeed: 1.8, minDamage: 75, maxDamage: 124,
    itemPower: 99 });
  expect(item.facts.damagePerSecond).toBeCloseTo(55.27777777777778);
  expect(item.facts.stats).toEqual([{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amount: 42, isPercent: false }]);
  expect(item.facts).not.toHaveProperty("slot");
  expect(item.facts).not.toHaveProperty("armorType");
  expect(item.facts).not.toHaveProperty("enchantment");
  expect(item.facts).not.toHaveProperty("buyPrice");
  // Neither class is offered in this fixture, so neither has a page, and a requirement names each as text.
  expect(item.facts.equipmentRequirements).toEqual([
    { mode: "any", checkCount: true, requiredCount: 1, requirements: [
      { type: { value: 0, name: "Class" }, rule: { value: 1, name: "Optional" }, label: "Shieldmaster", spans: [{ text: "Shieldmaster" }] },
      { type: { value: 0, name: "Class" }, rule: { value: 1, name: "Optional" }, label: "Assassin", spans: [{ text: "Assassin" }] },
    ] },
    { mode: "all", checkCount: false, requirements: [{ type: { value: 13, name: "Level" }, rule: { value: 0, name: "Mandatory" }, label: "Level 27", spans: [{ text: "Level 27" }] }] },
  ]);
  expect(item.facts.useLines).toEqual([{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }]);
  const itemList = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("items")?.[0];
  const itemRow = itemList?.rows.find((row) => row.ref.key === "items:1");
  expect(itemRow).toMatchObject({ values: { slot: "MAIN HAND", itemPower: 99, levelRequirement: 27 }, facets: { slot: ["MAIN HAND"] } });
  expect(npc.facts).not.toHaveProperty("species");
  expect(npc.facts.lootSpecialization).toEqual({ armorType: "PLATE", weaponTypes: ["AXE", "Shield"], stat: { key: "stats:5", kind: "stats", name: "Loot Stat" } });
  expect(item.droppedBy).toHaveLength(1);
  expect(npc.drops).toHaveLength(1);
  const { counterpart: itemCounterpart, ...itemValues } = item.droppedBy[0]!;
  const { counterpart: npcCounterpart, ...npcValues } = npc.drops[0]!;
  expect(itemCounterpart).toMatchObject({ key: "npcs:2" });
  expect(npcCounterpart).toMatchObject({ key: "items:1" });
  expect(itemValues).toEqual(npcValues);
  expect(itemValues).toMatchObject({ min: 1, max: 2, chance: 12.5 });
  expect(itemValues).not.toHaveProperty("placements");
  expect(item.sourceSpotCount).toBe(2);
  expect(item.gatheredFrom).toEqual([{ label: "Iron Node", min: 1, max: 2, chance: 25, requirements: [], availability: [], placementCount: 2,
    places: [{ label: "World", mapSpaceId: "world", spotCount: 2, placementIds: ["p1", "p2"] }] }]);
  expect(item.inContainers).toEqual([{ counterpart: { key: "scenes:10", kind: "places", name: "Crypt", slug: "crypt" },
    label: "Chest", min: 1, max: 1, availabilityIndex: 0, placementCount: 2,
    places: [{ label: "World", mapSpaceId: "world", spotCount: 2, placementIds: ["p1", "p2"] }] }]);
  expect(item.sourceAvailabilities).toEqual([[]]);
  expect(item).not.toHaveProperty("locations");
  expect(npc.locations).toEqual([{ label: "World", placements: [{ placementId: "p1", mapSpaceId: "world", label: "World" }], spotCount: 1, availability: [], variants: ["n2"], roles: ["boss"], quests: [] }]);
  expect(place).not.toHaveProperty("locations");
  expect(place.space).toEqual({ mapSpaceId: "world", regionIds: ["region-1"] });
  expect(place.creatures).toMatchObject([{ counterpart: { key: "npcs:2" }, placementCount: 1 }]);
});

test("condition-bearing gathering sources keep separate map spots", () => {
  const conditional = { ...relations, gathers: relations.gathers.map((row, index) =>
    index === 0 ? row : { ...row, conditionIds: ["oathbreaker"] }) };
  const published = new Map([
    ["p1", { placementId: "p1", mapSpaceId: "world", label: "Crypt", categories: [] }],
    ["p2", { placementId: "p2", mapSpaceId: "world", label: "Crypt", categories: [] }],
  ]);
  const { documents } = project(entities, facts, conditional, published);
  const item = documents.get("items:1") as PublicItem;
  expect(item.gatheredFrom).toHaveLength(2);
  expect(item.gatheredFrom.map((row) => row.places[0]?.placementIds[0])).toEqual(["p1", "p2"]);
  expect(item.gatheredFrom[0]?.requirements).toEqual([]);
  expect(item.gatheredFrom[1]?.requirements[0]?.requirements[0]?.label).toBe("Shieldmaster");
  expect(item.sourceSpotCount).toBe(2);
});

test("container rows share a condition without losing distinct source spots", () => {
  const conditioned = { ...relations, containers: relations.containers.map((row, index) => ({
    ...row, containerType: index === 0 ? "Chest" : "Cabinet",
    availability: [{ effect: "requires" as const, conditionId: "oathbreaker", durationSeconds: null }],
  })) };
  const published = new Map([
    ["p1", { placementId: "p1", mapSpaceId: "world", label: "Crypt", categories: [] }],
    ["p2", { placementId: "p2", mapSpaceId: "world", label: "Crypt", categories: [] }],
  ]);
  const { documents } = project(entities, facts, conditioned, published);
  const item = documents.get("items:1") as PublicItem;
  expect(item.inContainers.map((row) => [row.label, row.places[0]?.placementIds[0]])).toEqual([["Chest", "p1"], ["Cabinet", "p2"]]);
  expect(item.sourceAvailabilities).toHaveLength(1);
  expect(item.inContainers.map((row) => item.sourceAvailabilities[row.availabilityIndex]?.[0]?.requirements[0]?.requirements[0]?.label)).toEqual(["Shieldmaster", "Shieldmaster"]);
});

test("equally named places on different map spaces do not share a spot group", () => {
  const mapped = placeSpots([
    { placementId: "west", mapSpaceId: "west-mine", label: "Abandoned Mine" },
    { placementId: "east", mapSpaceId: "east-mine", label: "Abandoned Mine" },
    { placementId: "west", mapSpaceId: "west-mine", label: "Abandoned Mine" },
  ]);
  expect(mapped.map((place) => [place.label, place.spotCount, place.mapSpaceId, place.placementIds[0]])).toEqual([
    ["Abandoned Mine", 1, "east-mine", "east"], ["Abandoned Mine", 1, "west-mine", "west"],
  ]);
});

test("a recipe without a product or skill stays text, and an excluded recipe is not published", () => {
  const tavern: CatalogEntityRow = { entityKey: "recipes:40", kind: "recipes", nativeId: 40, name: "Oakenvale tavern level 2", description: null, iconAssetName: null, artwork: [] };
  const withTavern = [...entities, tavern];
  const tavernRequirement = requirement("Recipe", "Oakenvale tavern level 2", { spans: [{ endpoint: { entityKey: "recipes:40", label: "Oakenvale tavern level 2" } }] });
  const gatedFacts: CatalogFacts = { ...facts, entities: withTavern, recipes: [{ entityKey: "recipes:40", skill: null, station: null, learnedByDefault: false, ranks: [] }],
    items: [{ ...facts.items[0]!, useConditions: [{ mode: "all", checkCount: false, requiredCount: null, requirements: [tavernRequirement] }] }] };
  const projectExcluding = (excluded: ReadonlySet<string>) => {
    const references = buildEntityReferences(withTavern, { facts: gatedFacts, relations, excluded });
    return projectPublicDocuments({ entities: withTavern, facts: gatedFacts, relations, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map(), npcLevels: new Map(), placementIdsByKey: new Map() });
  };
  const spans = (documents: ReadonlyMap<string, PublicDocument>) => (documents.get("items:1") as PublicItem).facts.useConditions[0]?.requirements[0]?.spans;
  const linked = projectExcluding(new Set());
  expect(spans(linked)).toEqual([{ text: "Oakenvale Tavern Level 2" }]);
  expect(linked.has("recipes:40")).toBe(false);
  const excluded = projectExcluding(new Set(["recipes:40"]));
  expect(spans(excluded)).toEqual([{ text: "Oakenvale Tavern Level 2" }]);
  expect(excluded.has("recipes:40")).toBe(false);
});

test("place service groups use the published station types", () => {
  const stationRelations: CatalogRelations = { ...relations, placements: [
    { placementId: "p1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Cooking", area: null, roles: [{ role: "craftingService", npcEntityKey: null, scope: "authored" }], families: ["craftingStation"], randomChoices: [] },
    { placementId: "p2", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Unknown station", area: null, roles: [{ role: "craftingService", npcEntityKey: null, scope: "authored" }], families: ["craftingStation"], randomChoices: [] },
  ] };
  const { documents } = project(entities, facts, stationRelations, new Map([
    ["p1", { placementId: "p1", mapSpaceId: "world", label: "World", categories: ["cookingStation" as const] }],
    ["p2", { placementId: "p2", mapSpaceId: "world", label: "World", categories: ["craftingStation" as const] }],
  ]), new Map([["world", []]]));
  expect((documents.get("scenes:10") as PublicPlace).services).toEqual([
    { category: "cookingStation", placementCount: 1 },
    { category: "craftingStation", placementCount: 1 },
  ]);
});

test("stops when two loot lists of one creature share a limited rule, because its Drops section would merge them", () => {
  const drop = relations.drops[0]!;
  const limited = (lootTableId: number, tableLimit: number) => ({ ...drop, lootTableId, tableLimit });
  expect(() => project(entities, facts, { ...relations, drops: [limited(4, 3), limited(9, 3)] })).toThrow("the same drop rule");
  expect(() => project(entities, facts, { ...relations, drops: [limited(4, 3), limited(9, 2)] })).not.toThrow();
});

test("a place lists the properties whose for-sale signs stand in it", () => {
  const property = (entityKey: string): CatalogFacts["properties"][number] => ({ entityKey, income: 10, incomeInterval: 300, purchasePrice: 100, sellPrice: 50, currency: null, propertyType: "House" });
  const propertyEntities: CatalogEntityRow[] = [...entities,
    { entityKey: "properties:30", kind: "properties", nativeId: 30, name: "Crypt Cottage", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "properties:31", kind: "properties", nativeId: 31, name: "Unsold Shed", description: null, iconAssetName: null, artwork: [] },
  ];
  const propertyFacts: CatalogFacts = { ...facts, entities: propertyEntities, properties: [property("properties:30"), property("properties:31")] };
  const signRelations: CatalogRelations = { ...relations, placements: [...relations.placements,
    { placementId: "sign-1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Crypt", area: null, roles: [], families: [], randomChoices: [] }] };
  const { documents } = project(propertyEntities, propertyFacts, signRelations, new Map([
    ["sign-1", { placementId: "sign-1", mapSpaceId: "world", label: "Crypt", categories: ["property" as const] }],
  ]), new Map([["world", []]]), new Map(), new Map([["properties:30", ["sign-1"]]]));
  const place = documents.get("scenes:10") as PublicPlace;
  expect(place.properties.map((ref) => "name" in ref ? ref.name : ref.label)).toEqual(["Crypt Cottage"]);
  expect((documents.get("properties:30") as PublicProperty).place).toMatchObject({ key: "scenes:10", name: "Crypt" });
});

test("a place lists each teleport with its direction and the spots where it starts", () => {
  const placeEntities: CatalogEntityRow[] = [...entities, { entityKey: "scenes:47", kind: "scenes", nativeId: 47, name: "Afallon", description: null, iconAssetName: null, artwork: [] }];
  const teleport = (transitionId: string, sourceSceneKey: string, destinationSceneKey: string, placementIds: string[]) => ({ transitionId, sourceSceneKey, destinationSceneKey, transitionKind: "effect-teleport", placementIds, start: null });
  const { documents } = project(placeEntities, facts, { ...relations, transitions: [
    teleport("into-crypt", "scenes:47", "scenes:10", ["door"]), teleport("out-of-crypt", "scenes:10", "scenes:47", ["exit"]), teleport("inside-crypt", "scenes:10", "scenes:10", []),
  ] }, new Map([
    ["door", { placementId: "door", mapSpaceId: "world", label: "Afallon", categories: ["travelPoint"] }],
    ["exit", { placementId: "exit", mapSpaceId: "crypt", label: "Crypt", categories: ["travelPoint"] }],
  ]), new Map([["world", []]]));
  const rows = (key: string) => (documents.get(key) as PublicPlace).connections.map((row) => [row.direction, row.counterpart.key, row.placements.map((placement) => placement.placementId)]);
  expect(rows("scenes:10")).toEqual([["from", "scenes:47", ["door"]], ["to", "scenes:47", ["exit"]], ["within", "scenes:10", []]]);
  expect(rows("scenes:47")).toEqual([["to", "scenes:10", ["door"]], ["from", "scenes:10", ["exit"]]]);
});

test("projects representative item use text, effective stats and contextual ability ranks", () => {
  const additions: CatalogEntityRow[] = [
    { entityKey: "items:101", kind: "items", nativeId: 101, name: "Minor health potion", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "items:102", kind: "items", nativeId: 102, name: "Rough Sharpening Stone", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "items:103", kind: "items", nativeId: 103, name: "Red gem of lifesteal", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "abilities:201", kind: "abilities", nativeId: 201, name: "Cleave", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "abilities:202", kind: "abilities", nativeId: 202, name: "Healing potion", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "stats:104", kind: "stats", nativeId: 104, name: "Lifesteal", description: null, iconAssetName: null, artwork: [] },
  ];
  const line = (text: string) => [{ spans: [{ text, tone: null, italic: false }] }];
  const baseItem = facts.items[0]!;
  const tooltipFacts: CatalogFacts = {
    ...facts,
    entities: [...entities, ...additions],
    items: [baseItem,
      { ...baseItem, entityKey: "items:101", stats: [], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: line("Restores 120 health."), actionAbilities: [{ ability: { entityKey: "abilities:202", label: "Healing potion" }, rankIndex: 3 }], gameActions: [{ template: null, type: "Ability", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "Position", amount: 0, target: { entityKey: "abilities:202", label: "Healing potion" } }] },
      { ...baseItem, entityKey: "items:102", stats: [], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: line("Increases weapon damage."), actionAbilities: [] },
      { ...baseItem, entityKey: "items:103", stats: [{ stat: { entityKey: "stats:104", label: "Lifesteal" }, amount: 2, isPercent: true }], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: [], actionAbilities: [], gameActions: [{ template: null, type: "Ability", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "Position", amount: 0, target: { entityKey: "abilities:201", label: "Cleave" } }] },
    ],
    npcs: [{ ...facts.npcs[0]!, abilityPhases: [{ phaseIndex: 0, name: "Opening", requirement: null, abilities: [{ ability: { entityKey: "abilities:201", label: "Cleave" }, rankIndex: 0 }] }] }],
    abilities: [
      { entityKey: "abilities:201", ranks: [{ rankIndex: 0, lines: line("Cleave rank zero") }] },
      { entityKey: "abilities:202", ranks: [0, 1, 2, 3].map((rankIndex) => ({ rankIndex, lines: line(`Healing potion rank ${rankIndex}`) })) },
    ],
    gearSets: [{ ...facts.gearSets[0]!, members: [facts.gearSets[0]!.members[0]!] }],
  };
  const { documents } = project(tooltipFacts.entities, tooltipFacts, relations);

  expect((documents.get("items:101") as PublicItem).facts).toMatchObject({
    useLines: line("Restores 120 health."), actionAbilities: [{ ability: { key: "abilities:202", name: "Healing Potion" }, rankIndex: 3 }],
  });
  expect((documents.get("items:103") as PublicItem).facts.actionAbilities).toEqual([{ ability: { key: "abilities:201", kind: "abilities", name: "Cleave", slug: "cleave" } }]);
  expect((documents.get("items:102") as PublicItem).facts.useLines).toEqual(line("Increases weapon damage."));
  expect((documents.get("items:103") as PublicItem).facts.stats).toEqual([{ stat: { key: "stats:104", kind: "stats", name: "Lifesteal" }, amount: 2, isPercent: true }]);
  expect((documents.get("npcs:2") as PublicNpc).abilityPhases[0]?.abilities).toEqual([{ ability: { key: "abilities:201", kind: "abilities", name: "Cleave", slug: "cleave" }, rankIndex: 0 }]);
  const cleave = documents.get("abilities:201") as PublicAbility;
  const healingPotion = documents.get("abilities:202") as PublicAbility;
  expect(cleave.versions).toEqual([{ keys: ["abilities:201"], anchor: "n201", ranks: [{ rankIndex: 0, lines: line("Cleave rank zero") }], useRequirements: [], learnedBy: [], usedBy: [{ key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }], usedByItems: [{ key: "items:103", kind: "items", name: "Red Gem of Lifesteal", slug: "red-gem-of-lifesteal" }], taughtBy: [] }]);
  expect(healingPotion.versions[0]!.ranks.map((rank) => rank.rankIndex)).toEqual([0, 1, 2, 3]);
  expect(healingPotion.versions[0]!.usedBy).toEqual([]);
  expect(healingPotion.versions[0]!.usedByItems).toEqual([{ key: "items:101", kind: "items", name: "Minor Health Potion", slug: "minor-health-potion" }]);
  expect(healingPotion.versions[0]!.taughtBy).toEqual([{ key: "items:101", kind: "items", name: "Minor Health Potion", slug: "minor-health-potion" }]);

  const schemaIds = new Map<string, string>([...documents].map(([key, document]) => [key, STATIC_DOCUMENT_SCHEMA_IDS[document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS]]));
  expect(auditPublicTooltipCoverage(tooltipFacts, relations, documents, schemaIds)).toEqual([]);
  const unrelatedRelations: CatalogRelations = { ...relations, conditions: [...relations.conditions, { ...relations.conditions[0]!, conditionId: 'unrelated', scope: null }] };
  expect(auditPublicTooltipCoverage(tooltipFacts, unrelatedRelations, documents, schemaIds)).toEqual([]);

  const missingRank = new Map(documents);
  missingRank.set("abilities:202", { ...healingPotion, versions: [{ ...healingPotion.versions[0]!, ranks: healingPotion.versions[0]!.ranks.slice(0, -1) }] } as PublicDocument);
  const missingRankIssues = auditPublicTooltipCoverage(tooltipFacts, relations, missingRank, schemaIds);
  expect(missingRankIssues).toContain("Ability abilities:202 is missing public rank 3.");
  expect(() => assertCompleteTooltipCoverage(true, missingRankIssues)).toThrow("Ability abilities:202 is missing public rank 3.");

  const unclassifiedRelations: CatalogRelations = { ...relations, conditions: [{ ...relations.conditions[0]!, scope: null }] };
  const unclassifiedIssues = auditPublicTooltipCoverage(tooltipFacts, unclassifiedRelations, documents, schemaIds);
  expect(unclassifiedIssues).toContain("Condition oathbreaker has unclassified or mixed requirement predicates.");
  expect(() => assertCompleteTooltipCoverage(true, unclassifiedIssues)).toThrow("Condition oathbreaker has unclassified or mixed requirement predicates.");

  const mixedSchemaIds = new Map(schemaIds);
  mixedSchemaIds.set("items:101", "compendium.static-item.v1");
  const mixedSchemaIssues = auditPublicTooltipCoverage(tooltipFacts, relations, documents, mixedSchemaIds);
  expect(mixedSchemaIssues).toContain(`Document items:101 uses schema compendium.static-item.v1; expected ${STATIC_DOCUMENT_SCHEMA_IDS.items}.`);
  expect(() => assertCompleteTooltipCoverage(true, mixedSchemaIssues)).toThrow(`Document items:101 uses schema compendium.static-item.v1; expected ${STATIC_DOCUMENT_SCHEMA_IDS.items}.`);
  expect(() => assertCompleteTooltipCoverage(false, mixedSchemaIssues)).not.toThrow();

  const changedUseText = new Map(documents);
  const minorPotion = changedUseText.get("items:101") as PublicItem;
  changedUseText.set("items:101", { ...minorPotion, facts: { ...minorPotion.facts, useLines: [] } });
  expect(auditPublicTooltipCoverage(tooltipFacts, relations, changedUseText, schemaIds)).toContain("Item items:101 changed its native use-text block.");
});

test("ability list sources prefer classes, summarize many creatures, and retain item use and unknown rows", () => {
  const classRef = { key: "classes:5", kind: "classes" as const, name: "Assassin", slug: "assassin" };
  const npcRef = (name: string) => ({ key: `npcs:${name}`, kind: "npcs" as const, name, slug: name.toLowerCase() });
  const itemRef = { key: "items:101", kind: "items" as const, name: "Brown Horse", slug: "brown-horse" };
  const base = { ref: { key: "abilities:1", kind: "abilities" as const, name: "Ambush", slug: "ambush" }, art: {}, description: "Strikes from the shadows." };
  const version = { keys: ["abilities:1"], anchor: "n1", ranks: [{ rankIndex: 0, lines: [{ spans: [{ text: "Hit", tone: null, italic: false }] }] }], useRequirements: [], learnedBy: [], usedBy: [], usedByItems: [], taughtBy: [] } satisfies PublicAbility["versions"][number];
  const documents = new Map<string, PublicDocument>([
    ["class", { ...base, versions: [{ ...version, learnedBy: [{ class: classRef, via: "talentTree", tree: "Shadowcraft", requirements: [] }], usedBy: [npcRef("Goblin")], usedByItems: [itemRef] }] }],
    ["creature", { ...base, ref: { ...base.ref, key: "abilities:2", name: "Basic Strike", slug: "basic-strike" }, versions: [{ ...version, usedBy: [npcRef("Goblin"), npcRef("Bandit"), npcRef("Spider")] }] }],
    ["item", { ...base, ref: { ...base.ref, key: "abilities:3", name: "Brown Horse Mount", slug: "brown-horse-mount" }, versions: [{ ...version, usedByItems: [itemRef] }] }],
    ["unknown", { ...base, ref: { ...base.ref, key: "abilities:4", name: "Spider Stun", slug: "spider-stun" }, description: null, versions: [version] }],
  ]);
  const rows = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("abilities")![0]!.rows;
  expect(rows.map((row) => [row.values.description, row.values.source, row.facets.sourceKind, row.facets.class])).toEqual([
    ["Strikes from the shadows.", "Assassin · Shadowcraft", ["Class"], ["Assassin"]],
    ["Strikes from the shadows.", "3 creatures", ["Creature"], []],
    ["Strikes from the shadows.", "Brown Horse", ["Item"], []],
    [null, "No Known Use", ["No Known Use"], []],
  ]);
});

test("shows a gear set in full on its member item and publishes no gear set page", () => {
  const { documents } = project(entities, facts, relations);
  const item = documents.get("items:1") as PublicItem;
  expect(documents.has("gearSets:17")).toBe(false);
  expect(item.facts.gearSet).toEqual({
    key: "gearSets:17", name: "Adept Leather",
    members: [{ key: "items:1", kind: "items", name: "Oathbreaker's Edge", slug: "oathbreakers-edge" }, { key: null, label: "Item 999" }],
    tiers: [
      { equipped: 3, stats: [{ stat: { key: "stats:12", kind: "stats", name: "Poison Damage" }, amount: 10, isPercent: true }] },
      { equipped: 7, stats: [{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amount: 40, isPercent: false }] },
    ],
  });
});

test("projects only the armor branch when native weapon defaults remain", () => {
  const armorFacts: CatalogFacts = { ...facts, items: [{ ...facts.items[0]!, itemType: "ARMOR", armorSlot: "GLOVES", armorType: "LEATHER" }] };
  const { documents } = project(entities, armorFacts, relations);
  const item = documents.get("items:1") as PublicItem;
  expect(item.facts).toMatchObject({ slot: "GLOVES", armorType: "LEATHER" });
  expect(item.facts).not.toHaveProperty("weaponSlot");
  expect(item.facts).not.toHaveProperty("weaponType");
  expect(item.facts).not.toHaveProperty("attackSpeed");
  expect(item.facts).not.toHaveProperty("minDamage");
  expect(item.facts).not.toHaveProperty("maxDamage");
  expect(item.facts).not.toHaveProperty("damagePerSecond");
  expect(item.facts.itemPower).toBe(99);
  const itemList = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("items")?.[0];
  expect(itemList?.rows.find((row) => row.ref.key === "items:1")).toMatchObject({
    values: { slot: "GLOVES", itemPower: 99 }, facets: { slot: ["GLOVES"] },
  });
});

test("maps every supported native task type and preserves unsupported types", () => {
  const resolve = createReferenceResolver(buildEntityReferences(entities).refs);
  const tasks: CatalogTaskFacts[] = [
    { entityKey: "tasks:1", taskType: "killNPC", target: { entityKey: "npcs:2", label: "Guardian" }, count: 2, keepItems: null, sceneName: null },
    { entityKey: "tasks:2", taskType: "getItem", target: { entityKey: "items:1", label: "Blade" }, count: 1, keepItems: true, sceneName: null },
    { entityKey: "tasks:3", taskType: "talkToNPC", target: { entityKey: "npcs:2", label: "Guardian" }, count: null, keepItems: null, sceneName: null },
    { entityKey: "tasks:4", taskType: "enterScene", target: { entityKey: null, label: "Cavern" }, count: null, keepItems: null, sceneName: "Cavern" },
    { entityKey: "tasks:5", taskType: "enterRegion", target: { entityKey: null, label: "Marsh" }, count: null, keepItems: null, sceneName: "Marsh" },
    { entityKey: "tasks:6", taskType: "useItem", target: { entityKey: "items:1", label: "Blade" }, count: 1, keepItems: null, sceneName: null },
    { entityKey: "tasks:7", taskType: "learnAbility", target: { entityKey: null, label: "Parry" }, count: null, keepItems: null, sceneName: null },
    { entityKey: "tasks:8", taskType: "dance", target: null, count: null, keepItems: null, sceneName: null },
  ];
  expect(tasks.map((task, index) => projectQuestObjective(task, resolve, index, "", []).type)).toEqual([
    "killNpc", "getItem", "talkToNpc", "enterScene", "enterRegion", "useItem", "learnAbility", "unsupported",
  ]);
  expect(projectQuestObjective(tasks.at(-1)!, resolve, 7, "", [])).toMatchObject({ type: "unsupported", rawType: "dance", text: "dance" });
});

test("projects quest starts, world effects, and related item, NPC, and place pages", () => {
  const endpoint = (entityKey: string, label: string) => ({ entityKey, label });
  const quest = endpoint("quests:3", "Trial"), later = endpoint("quests:4", "The Return");
  const night = { effect: "requires" as const, conditionId: "night", durationSeconds: null };
  const afterQuest = { effect: "excludes" as const, conditionId: "after-quest", durationSeconds: null };
  const temporary = { effect: "temporary" as const, conditionId: "after-quest", durationSeconds: 30 };
  const questPredicate = requirement("Quest", "Trial turned in", {
    references: { ...emptyRequirementReferences, quest }, spans: [{ endpoint: quest }, { text: " turned in" }],
    questState: { value: 4, name: "turnedIn" },
  });
  const scenarioEntities: CatalogEntityRow[] = [...entities,
    { entityKey: "quests:1", kind: "quests", nativeId: 1, name: "Beginning", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "quests:4", kind: "quests", nativeId: 4, name: "The Return", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "currencies:0", kind: "currencies", nativeId: 0, name: "Gold Coin", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "tasks:8", kind: "tasks", nativeId: 8, name: "Enter grove", description: "<b>Find the old grove</b>", iconAssetName: null, artwork: [] },
    { entityKey: "tasks:9", kind: "tasks", nativeId: 9, name: "Defeat Guardian", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "tasks:10", kind: "tasks", nativeId: 10, name: "Enter Crypt", description: null, iconAssetName: null, artwork: [] },
  ];
  const questFact = facts.quests[0]!;
  const scenarioFacts: CatalogFacts = { ...facts, entities: scenarioEntities,
    npcs: [{ ...facts.npcs[0]!, isQuestGiver: true }],
    quests: [
      { ...questFact, entityKey: "quests:1", chainName: "Pilgrimage", chainOrder: 1 },
      { ...questFact, chainName: " Pilgrimage ", chainOrder: 2, levelRequirement: 16, experience: 500,
        objectiveText: "<b>Meet the trial</b>", completedDescription: "<b>Done</b>",
        worldQuest: { availableSeconds: 120, cooldownAfterCompletionSeconds: 300, cooldownAfterExpirySeconds: 600, cooldownJitterSeconds: 60, initialRollSeconds: 20 } },
      { ...questFact, entityKey: "quests:4", chainName: "Pilgrimage", chainOrder: 3, conditionIds: ["after-quest"] },
    ] };
  const row = (associationId: string, kind: CatalogQuestRow["kind"], overrides: Partial<CatalogQuestRow> = {}): CatalogQuestRow => ({
    associationId, quest, kind, index: 0, counterpart: null, task: null, count: null, rewardType: null,
    sourceId: null, label: null, availability: [], completions: [], worldOffer: null, placementIds: [], ...overrides,
  });
  const scenarioRelations: CatalogRelations = { ...relations,
    placements: [
      { ...relations.placements[0]!, area: "Raven Camp" },
      ...(["p2", "p3", "p4"] as const).map((placementId) => ({ ...relations.placements[0]!, placementId, roles: [], area: placementId === "p3" ? "Coalway Woods" : "Raven Camp" })),
    ],
    conditions: [...relations.conditions,
      { conditionId: "night", semantics: "world", scope: null, label: "Night", requirements: [
        { mode: "all", checkCount: false, requiredCount: null, requirements: [requirement("Time", "At night")] },
      ] },
      { conditionId: "after-quest", semantics: "world", scope: null, label: "Quest complete", requirements: [
        { mode: "all", checkCount: false, requiredCount: null, requirements: [questPredicate] },
      ] },
      { conditionId: "empty", semantics: "world", scope: null, label: "Empty", requirements: [] },
    ],
    quests: [
      row("giver", "giver", { counterpart: endpoint("npcs:2", "Guardian") }),
      row("offer-1", "worldOffer", { sourceId: "zone-1", availability: [night], worldOffer: { zoneDelaySeconds: 45, pool: [quest, later] }, placementIds: ["p2"] }),
      row("offer-2", "worldOffer", { sourceId: "zone-2", availability: [night], worldOffer: { zoneDelaySeconds: 45, pool: [quest, later] }, placementIds: ["p3", "p2"] }),
      row("other-offer", "worldOffer", { quest: endpoint("quests:1", "Beginning"), sourceId: "zone-3", worldOffer: { zoneDelaySeconds: 45, pool: [quest] }, placementIds: ["p3"] }),
      row("object", "objectStart", { label: "<b>Old altar</b>", availability: [temporary], placementIds: ["p4"] }),
      row("later-object", "objectStart", { quest: later, label: "Passage", placementIds: ["p4"] }),
      row("objective", "objective", { task: { entityKey: "tasks:8", taskType: "enterRegion", target: null, count: null, keepItems: null, sceneName: "Old grove" },
        completions: [
          { sourceId: "object-1", label: "Ancient stone", availability: [night], placementIds: ["p2"] },
          { sourceId: "object-2", label: "Ancient stone", availability: [night], placementIds: ["p4"] },
        ] }),
      row("reward", "reward", { counterpart: endpoint("currencies:0", "Gold Coin"), rewardType: "Currency", count: 40 }),
      row("turn-in", "turnIn", { counterpart: endpoint("npcs:2", "Guardian") }),
      row("objective-later", "objective", { quest: later, counterpart: endpoint("npcs:2", "Guardian"), task: { entityKey: "tasks:9", taskType: "killNPC", target: endpoint("npcs:2", "Guardian"), count: 2, keepItems: null, sceneName: null } }),
      row("objective-first", "objective", { quest: endpoint("quests:1", "Beginning"), counterpart: endpoint("scenes:10", "Crypt"),
        task: { entityKey: "tasks:10", taskType: "enterScene", target: endpoint("scenes:10", "Crypt"), count: null, keepItems: null, sceneName: "Crypt" } }),
    ],
    containers: [{ ...relations.containers[0]!, availability: [night], placementIds: ["p2"] }],
    interactions: [{ objectName: "Egg cluster", sourceId: "chest-action", place: endpoint("scenes:10", "Crypt"),
      item: endpoint("items:1", "Blade"), min: 2, max: 3, rawRate: 30, availability: [night, { effect: "requires", conditionId: "empty", durationSeconds: null }], placementIds: ["p4"] }],
    gatedSources: [
      { sourceId: "spawn-1", family: "npcProducer", label: null, subjects: [endpoint("npcs:2", "Guardian")], placementIds: ["p1"], availability: [afterQuest] },
      { sourceId: "spawn-2", family: "npcProducer", label: null, subjects: [endpoint("npcs:2", "Guardian")], placementIds: ["p2", "unpublished"], availability: [afterQuest] },
      { sourceId: "object-change", family: "interaction", label: "Locked altar", subjects: [], placementIds: ["p4"], availability: [afterQuest, night] },
      { sourceId: "missing-change", family: "resource", label: "Unmapped", subjects: [], placementIds: ["unpublished"], availability: [afterQuest] },
    ],
  };
  const placements = new Map(["p1", "p2", "p3", "p4"].map((placementId) => [placementId,
    { placementId, mapSpaceId: "world", label: placementId === "p3" ? "Coalway Woods" : "Raven Camp", categories: [] }] as const));
  const { refs, documents } = project(scenarioEntities, scenarioFacts, scenarioRelations, placements, new Map([["world", []]]));
  const publicQuest = documents.get("quests:3") as PublicQuest;
  expect(publicQuest.facts).toMatchObject({ levelRequirement: 16, experience: 500, chain: { name: "Pilgrimage", order: 2 },
    objectiveText: "Meet the trial", completedDescription: "Done",
    worldQuest: { availableSeconds: 120, cooldownAfterCompletionSeconds: 300, cooldownAfterExpirySeconds: 600, cooldownJitterSeconds: 60, initialRollSeconds: 20 } });
  expect(publicQuest.starts).toEqual([
    { kind: "npc", npc: refs.get("npcs:2")!, areas: ["Raven Camp"] },
    { kind: "worldZone", placements: [placements.get("p2")!, placements.get("p3")!].map(({ categories, ...location }) => location),
      availability: [{ effect: "requires", requirements: [{ mode: "all", checkCount: false, requirements: [expect.objectContaining({ label: "At night" })] }] }],
      zoneDelaySeconds: 45, pool: [refs.get("quests:4")!] },
    { kind: "object", label: "Old Altar", placements: [placements.get("p4")!].map(({ categories, ...location }) => location),
      availability: [{ effect: "temporary", durationSeconds: 30, requirements: [expect.objectContaining({ mode: "all" })] }] },
  ]);
  expect(publicQuest.objectives).toEqual([{ index: 0, type: "enterRegion", text: "Find the old grove",
    completions: [{ label: "Ancient Stone", availability: [expect.objectContaining({ effect: "requires" })],
      placements: [placements.get("p2")!, placements.get("p4")!].map(({ categories, ...location }) => location) }] }]);
  expect(publicQuest.rewards).toEqual([{ counterpart: refs.get("currencies:0")!, count: 40, choice: false }]);
  expect(publicQuest.chainQuests.map((ref) => ref.key)).toEqual(["quests:1", "quests:3", "quests:4"]);
  expect(publicQuest.unlocks.map((ref) => ref.key)).toEqual(["quests:4"]);
  expect(publicQuest.worldChanges).toMatchObject([
    { sourceKind: "creature", subjects: [{ key: "npcs:2" }], availability: [{ effect: "excludes", requirements: [{ requirements: [{
      spans: [{ ref: { key: "quests:3" } }, { text: " turned in" }],
    }] }] }], placements: [{ placementId: "p1" }, { placementId: "p2" }] },
    { sourceKind: "object", label: "Locked Altar", availability: [{ effect: "excludes" }, { effect: "requires" }], placements: [{ placementId: "p4" }] },
  ]);
  const item = documents.get("items:1") as PublicItem;
  expect(item.inContainers).toMatchObject([{ placementCount: 1 }]);
  expect(item.collectedFrom).toMatchObject([{ label: "Egg Cluster", counterpart: { key: "scenes:10" }, min: 2, max: 3, chance: 30,
    placementCount: 1 }]);
  expect(item.sourceAvailabilities[item.inContainers[0]!.availabilityIndex]).toMatchObject([{ effect: "requires" }]);
  expect(item.sourceAvailabilities[item.collectedFrom[0]!.availabilityIndex]).toMatchObject([{ effect: "requires" }]);
  const npc = documents.get("npcs:2") as PublicNpc;
  expect(npc.locations).toMatchObject([{ label: "Raven Camp", availability: [{ effect: "excludes" }], placements: [{ placementId: "p1" }] }]);
  expect(npc.usedInQuests).toMatchObject([{ counterpart: { key: "quests:4" }, objective: { type: "killNpc", target: { key: "npcs:2" }, count: 2 } }]);
  const place = documents.get("scenes:10") as PublicPlace;
  expect(place.quests.map((ref) => ref.key)).toEqual(["quests:3", "quests:1", "quests:4"]);
  expect(place.questObjectives.map((ref) => ref.key)).toEqual(["quests:3", "quests:4", "quests:1"]);
});

test("projects one creature page with random options, story entries, and rows that name the variants they apply to", () => {
  const scenarioEntities: CatalogEntityRow[] = [...entities,
    { entityKey: "npcs:206", kind: "npcs", nativeId: 206, name: "Fenric Doryn", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "npcs:225", kind: "npcs", nativeId: 225, name: "Fenric Doryn", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "npcs:234", kind: "npcs", nativeId: 234, name: "Fenric Doryn", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "items:7", kind: "items", nativeId: 7, name: "Frostscale Pike", description: null, iconAssetName: null, artwork: [] },
  ];
  const fenric = (entityKey: string) => ({ ...facts.npcs[0]!, entityKey, lootSpecialization: null });
  const scenarioFacts: CatalogFacts = { ...facts, entities: scenarioEntities, npcs: [...facts.npcs, fenric("npcs:206"), fenric("npcs:225"), fenric("npcs:234")],
    items: [...facts.items, { ...facts.items[0]!, entityKey: "items:7", gearSet: null, conditionIds: [], equipmentRequirements: [] }] };
  const choice = (entryIndex: number) => [{ choiceId: "fisher", entries: 3, options: 3, enabled: 1, entryIndexes: [entryIndex] }];
  const spot = (placementId: string, npcEntityKey: string, randomChoices: CatalogRelations["placements"][number]["randomChoices"] = []) =>
    ({ placementId, sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: null, area: "Lake Thaldrin", roles: [{ role: "friendly", npcEntityKey, scope: "player-state" }], families: [], randomChoices });
  const drop = (owner: string, item: string) => ({ ...relations.drops[0]!, owner: { entityKey: owner, label: owner }, item: { entityKey: item, label: item } });
  const scenarioRelations: CatalogRelations = { ...relations,
    placements: [spot("day-a", "npcs:206", choice(0)), spot("day-b", "npcs:234", choice(1)), spot("night", "npcs:225")],
    drops: [drop("npcs:206", "items:1"), drop("npcs:234", "items:1"), drop("npcs:234", "items:7")],
    conditions: [...relations.conditions, { conditionId: "night", semantics: "world", scope: null, label: "Night", requirements: [{ mode: "all", checkCount: false, requiredCount: null, requirements: [requirement("Effect", "Night active is active")] }] }],
    gatedSources: [{ sourceId: "sleeping", family: "npcProducer", label: null, subjects: [{ entityKey: "npcs:225", label: "Fenric Doryn" }], placementIds: ["night"], availability: [{ effect: "requires", conditionId: "night", durationSeconds: null }] }],
  };
  const placements = new Map(["day-a", "day-b", "night"].map((placementId) => [placementId, { placementId, mapSpaceId: "world", label: placementId === "night" ? "Coalway Woods" : "Lake Thaldrin", categories: ["townsfolk" as const] }] as const));
  const level = { min: 15, max: 30, scales: true };
  const { documents } = project(scenarioEntities, scenarioFacts, scenarioRelations, placements, new Map([["world", []]]),
    new Map([["day-a", new Map([["npcs:206", level]])], ["day-b", new Map([["npcs:234", level]])], ["night", new Map([["npcs:225", level]])]]));
  const npc = documents.get("npcs:206") as PublicNpc;
  expect(documents.has("npcs:225")).toBe(false);
  expect(npc.ref).toMatchObject({ name: "Fenric Doryn", slug: "fenric-doryn" });
  expect(npc.variantFields).toEqual([]);
  expect(npc.locations.map(({ placements: spots, variants, availability, alternative }) => ({ placements: spots.map((row) => row.placementId), variants, rules: availability.length, alternative })))
    .toEqual([
      { placements: ["night"], variants: ["n225"], rules: 1, alternative: undefined },
      { placements: ["day-a", "day-b"], variants: ["n206", "n234"], rules: 0, alternative: { chance: 66.7, options: 2 } },
    ]);
  expect(npc.places.map((place) => [place.label, place.spotCount, place.placementIds]))
    .toEqual([["Lake Thaldrin", 2, ["day-a", "day-b"]], ["Coalway Woods", 1, ["night"]]]);
  expect(npc.spotCount).toBe(3);
  expect(npc.locations.find((location) => location.label === "Coalway Woods")?.availability).toHaveLength(1);
  expect(npc.facts.level).toEqual(level);
  expect(npc.drops.map((row) => [row.counterpart.key, row.variants])).toEqual([["items:1", undefined], ["items:7", ["n234"]]]);
  expect((documents.get("items:1") as PublicItem).droppedBy.map((row) => row.counterpart)).toContainEqual(expect.objectContaining({ key: "npcs:206", name: "Fenric Doryn", slug: "fenric-doryn" }));
  expect((documents.get("items:1") as PublicItem).droppedBy.some((row) => "variant" in row.counterpart)).toBe(false);
});

// A recipe item, its recipe and product, a recipe that no item teaches, and a gathering node that spawners and a scene
// both place. A second gather row has no node of its own.
const craftEntity = (kind: string, nativeId: number, name: string): CatalogEntityRow => ({ entityKey: `${kind}:${nativeId}`, kind, nativeId, name, description: null, iconAssetName: null, artwork: [] });
const craftEntities = [...entities, craftEntity("items", 20, "Recipe Molten Loop"), craftEntity("items", 21, "Molten Loop"), craftEntity("items", 22, "Iron Ore"),
  craftEntity("items", 23, "Secret Stew"), craftEntity("items", 24, "Lost Tonic"),
  craftEntity("recipes", 7, "Molten Loop"), craftEntity("recipes", 8, "Secret Stew"), craftEntity("recipes", 9, "Lost Tonic"),
  craftEntity("skills", 0, "Alchemy"), craftEntity("skills", 7, "Mining"), craftEntity("skills", 11, "Axes")];
const skillFact = (entityKey: string, name: string) => ({ entityKey, name, kind: "skills" as const, details: { automaticallyAdded: true, maxLevel: 300, levelTemplate: null, stats: [], customStats: [], statListTemplate: null, startItems: [], actionAbilities: [] } });
const ruleRow = (ruleId: string, section: string, operands: Record<string, number>, links: Array<{ entityKey: string; label: string }> = [], placements: CatalogMechanicsRule["placements"] = []): CatalogMechanicsRule => ({
  ruleId, topic: "crafting-and-gathering", section, ordinal: 0, status: "verified", phrase: "Rule.", operands, links, placements,
  sources: [{ method: "Method", description: "Evidence", object: { sha256: "a".repeat(64), bytes: 1 } }] });
const vein: CatalogGatheringNode = { entityKey: "gatheringNodes:iron-vein", name: "Iron vein", levelHint: "Mining 5", variant: false, skill: { entityKey: "skills:7", label: "Mining" }, skillExperience: 15, characterExperience: 4,
  lootTable: { entityKey: null, label: "Iron vein" }, conditionId: "vein-gate", sources: [
    { nodeKey: "gatheringNodes:iron-vein", sourceId: "spawner-1", sourceKind: "spawner-option", optionIndex: 0, cooldown: null, placementId: "p1",
      spawner: { skill: { entityKey: "skills:7", label: "Mining" }, respawnTime: 120, respawnJitter: 30, despawnDelay: 60, playerRange: 40, skillCap: 150, weightAtLowSkill: 70, weightAtHighSkill: 24, teaserWeight: 0 } },
    { nodeKey: "gatheringNodes:iron-vein", sourceId: "object-1", sourceKind: "placed-object", optionIndex: null, cooldown: 300, placementId: null, spawner: null },
  ] };
const recipeAction = (target: string | null) => ({ template: null, type: "Recipe", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "GameScene", amount: 0, target: target === null ? null : { entityKey: target, label: target } });
const craftFacts: CatalogFacts = { ...facts, entities: craftEntities,
  items: [...facts.items, { ...facts.items[0]!, entityKey: "items:20", gearSet: null, conditionIds: [], equipmentRequirements: [], gameActions: [{ ...recipeAction(null), type: "TriggerSound" }, recipeAction("recipes:7"), recipeAction("recipes:8")] }],
  recipes: [
    { entityKey: "recipes:7", skill: { entityKey: "skills:0", label: "Alchemy" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 40, experience: 7, craftTime: 1, products: [], materials: [] }] },
    { entityKey: "recipes:8", skill: { entityKey: "skills:0", label: "Alchemy" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 0, experience: 0, craftTime: 1, products: [], materials: [] }] },
    { entityKey: "recipes:9", skill: { entityKey: null, label: "Skill 99" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 5, experience: 3, craftTime: 1, products: [], materials: [] }] },
  ],
  progression: { ...facts.progression, facts: [skillFact("skills:0", "Alchemy"), skillFact("skills:7", "Mining"), skillFact("skills:11", "Axes")] as never, mechanicsRules: [
    ruleRow("recipe-rank-gate", "crafting", { minimumRequiredLevel: 1 }, [], [{ page: "items", target: "crafting", scope: "all" }]),
    ruleRow("recipe-experience-bands", "crafting-experience", { secondFullFromLevels: 10, halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 }),
    ruleRow("recipe-experience-rounding", "crafting-experience", {}), ruleRow("weapon-skill-hit", "skill-experience", { hitExperience: 2 }), ruleRow("weapon-skills", "skill-experience", {}, [{ entityKey: "skills:11", label: "Axes" }]),
    ruleRow("recipe-item-tooltip", "crafting", {}, [], [{ page: "items", target: "teaches", scope: "all" }]),
    ruleRow("spawner-respawn", "node-availability", { minimumRespawnSeconds: 5 }, [], [{ page: "gatheringNodes", target: "how-it-works", scope: "spawned" }]),
    ruleRow("placed-node-cooldown", "node-availability", {}, [], [{ page: "gatheringNodes", target: "how-it-works", scope: "placed" }]),
    ruleRow("attunement-98", "attunement", { boostWeight: 10 }, [{ entityKey: "gatheringNodes:iron-vein", label: "Iron vein" }], [{ page: "gatheringNodes", target: "how-it-works", scope: "linked" }]),
    ruleRow("attunement-642", "attunement", { boostWeight: 10 }, [{ entityKey: "gatheringNodes:silver-vein", label: "Silver vein" }], [{ page: "gatheringNodes", target: "how-it-works", scope: "linked" }]),
  ] },
  gatheringNodes: [vein] };
const gate = requirement("Skill", "Mining 5", { type: { value: 26, name: "Skill" }, references: { ...emptyRequirementReferences, skill: { entityKey: "skills:7", label: "Mining" } }, amounts: { primary: 5, secondary: 0, float: 0, isPercent: false } });
const oreRow = (sourceId: string, node: boolean, placementIds: string[]) => ({ producerLabel: node ? "Iron vein" : "Old node", sourceId, sceneNativeId: 10, resource: null, gatheringNode: node ? { entityKey: vein.entityKey, label: "Iron vein" } : null,
  item: { entityKey: "items:22", label: "Iron Ore" }, skill: { entityKey: "skills:7", label: "Mining" }, rank: null, min: 1, max: 2, rawRate: 100, conditionIds: [], placementIds });
const craftRelations: CatalogRelations = { ...relations,
  gathers: [oreRow("spawner-1", true, ["p1"]), oreRow("spawner-9", false, [])],
  interactions: [{ objectName: "Iron vein <color=red>Pickaxe</color>", sourceId: "object-1", place: null, item: { entityKey: "items:22", label: "Iron Ore" }, min: 1, max: 2, rawRate: 100, availability: [], placementIds: [] }],
  recipes: [
    { recipe: { entityKey: "recipes:7", label: "Molten Loop" }, item: { entityKey: "items:21", label: "Molten Loop" }, role: "product", rank: 1, count: 1, chance: 100 },
    { recipe: { entityKey: "recipes:7", label: "Molten Loop" }, item: { entityKey: "items:22", label: "Iron Ore" }, role: "material", rank: 1, count: 2, chance: 100 },
    { recipe: { entityKey: "recipes:8", label: "Secret Stew" }, item: { entityKey: "items:23", label: "Secret Stew" }, role: "product", rank: 1, count: 1, chance: 100 },
    { recipe: { entityKey: "recipes:9", label: "Lost Tonic" }, item: { entityKey: "items:24", label: "Lost Tonic" }, role: "product", rank: 1, count: 1, chance: 100 },
  ],
  conditions: [...relations.conditions, { conditionId: "vein-gate", semantics: "requirements-template", scope: null, label: "Requirements", requirements: [{ mode: "all", checkCount: false, requiredCount: null, requirements: [gate] }] }] };
const p1 = { placementId: "p1", mapSpaceId: "world", label: "Crypt", categories: [] };

test("recipe items teach one craft, and product pages show the full recipe", () => {
  const { documents } = project(craftEntities, craftFacts, craftRelations);
  const item = documents.get("items:20") as PublicItem, product = documents.get("items:21") as PublicItem;
  expect(documents.has("recipes:7")).toBe(false);
  expect(item.teaches).toEqual(product.crafting);
  expect(product.crafting).toMatchObject({
    recipe: { key: "recipes:7", name: "Molten Loop" },
    product: { counterpart: expect.objectContaining({ key: "items:21" }), count: 1 },
    materials: [{ counterpart: expect.objectContaining({ key: "items:22" }), count: 2 }],
    taughtBy: [expect.objectContaining({ key: "items:20" })],
  });
  expect(product.placedRules).toEqual([{ target: "crafting", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), stepId: "check-the-crafting-level" }]);
  expect(item.placedRules).toEqual([{ target: "teaches", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), stepId: "provide-materials-and-space" }]);
  expect((documents.get("items:22") as PublicItem).placedRules).toEqual([]);
  expect((documents.get("items:22") as PublicItem).usedInRecipes[0]?.counterpart).toMatchObject({ key: "items:21", variant: "crafting" });
  const moreProduct = { ...craftRelations, recipes: craftRelations.recipes.map((row) =>
    row.recipe.entityKey === "recipes:7" && row.role === "product" ? { ...row, count: 3 } : row) };
  const material = project(craftEntities, craftFacts, moreProduct).documents.get("items:22") as PublicItem;
  expect(material.usedInRecipes).toEqual([{
    counterpart: expect.objectContaining({ key: "items:21", variant: "crafting" }), count: 2,
    product: { counterpart: expect.objectContaining({ key: "items:21" }), count: 3 },
    skill: expect.objectContaining({ key: "skills:0", name: "Alchemy" }), requiredLevel: 40,
  }]);
  expect((documents.get("items:23") as PublicItem).crafting?.taughtBy).toEqual([]);
  expect(readerCoverage(documents.values(), craftFacts).gaps.find((gap) => gap.gap === "recipeWithoutTeacher")?.pages.map((page) => page.key)).toEqual(["items:24", "items:23"]);
  expect(searchAliases(product)).toEqual([]);
  expect(searchAliases({ ...product, ref: { ...product.ref, name: "Bloodthrall Signet" },
    crafting: { ...product.crafting!, recipe: { key: "recipes:7", name: "Ring of Bleed Damage" } } })).toEqual(["Ring of Bleed Damage"]);
});

test("recipe ranks show the recorded gate and bands only when the skill resolves", () => {
  const { documents } = project(craftEntities, craftFacts, craftRelations);
  expect((documents.get("items:21") as PublicItem).crafting?.ranks).toEqual([{ rank: 1, requiredLevel: 40, baseExperience: 7, bands: [
    { band: "firstFull", from: 40, to: 49, experience: 7 }, { band: "secondFull", from: 50, to: 59, experience: 7 }, { band: "half", from: 60, to: 74, experience: 4 }, { band: "none", from: 75, experience: 0 },
  ] }]);
  expect((documents.get("items:23") as PublicItem).crafting?.ranks).toEqual([{ rank: 1, requiredLevel: 1, baseExperience: 0, bands: [] }]);
  expect((documents.get("items:24") as PublicItem).crafting?.ranks).toEqual([]);
  expect(() => project(craftEntities, { ...craftFacts, progression: { ...craftFacts.progression, mechanicsRules: [] } }, craftRelations)).toThrow("recipe-rank-gate");
});

test("coverage links a productless recipe to its skill row", () => {
  const productless = craftEntity("recipes", 10, "Demonic Bulwark Looted");
  const scenarioEntities = [...craftEntities, productless], scenarioFacts: CatalogFacts = { ...craftFacts,
    entities: scenarioEntities, recipes: [...craftFacts.recipes,
      { entityKey: productless.entityKey, skill: { entityKey: "skills:0", label: "Alchemy" }, station: null, learnedByDefault: false, ranks: [] }] };
  const { documents } = project(scenarioEntities, scenarioFacts, craftRelations);
  const gaps = readerCoverage(documents.values(), scenarioFacts).gaps;
  expect(gaps.find((gap) => gap.gap === "recipeWithoutProduct")?.pages).toContainEqual(
    expect.objectContaining({ key: "skills:0", slug: "alchemy", variant: "recipe-demonic-bulwark-looted" }));
  expect(gaps.find((gap) => gap.gap === "recipeWithoutTeacher")?.pages).toContainEqual(
    expect.objectContaining({ key: "skills:0", slug: "alchemy", variant: "recipe-demonic-bulwark-looted" }));
  expect((documents.get("skills:0") as PublicSkill).recipes).toContainEqual(
    expect.objectContaining({ recipe: { key: productless.entityKey, name: "Demonic Bulwark Looted" }, anchor: "recipe-demonic-bulwark-looted" }));
  expect(searchAliases(documents.get("skills:0") as PublicSkill)).toContain("Demonic Bulwark Looted");
});

test("skills list only their verified experience sources", () => {
  const { documents } = project(craftEntities, craftFacts, craftRelations);
  const skill = (key: string) => documents.get(key) as PublicSkill;
  expect(skill("skills:11").experience).toEqual({ autoAttack: { perHit: 2 }, crafting: false, gathering: false });
  expect(skill("skills:0").experience).toEqual({ crafting: true, gathering: false });
  expect(skill("skills:7").experience).toEqual({ crafting: false, gathering: true });
  expect(skill("skills:7").gatheringNodes).toEqual([{ node: expect.objectContaining({ key: vein.entityKey, name: "Iron Vein", slug: "iron-vein" }), requirements: [expect.objectContaining({ requirements: [expect.objectContaining({ label: "Mining 5" })] })], experience: 15 }]);
});

test("a node yield links the node from the item and the item from the node, and a yield without a node keeps its source", () => {
  const { refs, documents } = project(craftEntities, craftFacts, craftRelations, new Map([["p1", p1]]));
  const ore = documents.get("items:22") as PublicItem;
  expect(ore.gatheredFrom).toEqual([
    { counterpart: expect.objectContaining({ key: vein.entityKey }), label: "Iron Vein", skill: expect.objectContaining({ key: "skills:7" }), min: 1, max: 2, chance: 100, requirements: [], availability: [], placementCount: 1, places: [{ label: "Crypt", mapSpaceId: "world", spotCount: 1, placementIds: ["p1"] }] },
    { label: "Old Node", skill: expect.objectContaining({ key: "skills:7" }), min: 1, max: 2, chance: 100, requirements: [], availability: [], placementCount: 0, places: [] },
  ]);
  // The row of the object that a scene places merges into the node row instead of reading as collected.
  expect(ore.collectedFrom).toEqual([]);
  const resolve = createReferenceResolver(refs), conditions = conditionsById(craftRelations.conditions);
  const node = projectGatheringNodeDocuments(craftFacts, craftRelations, { resolve, conditions, placements: new Map([["p1", p1]]), requirements: (ids) => requirementsFor(ids, conditions, resolve) }).get(vein.entityKey)!;
  expect(node.yields).toEqual([{ counterpart: expect.objectContaining({ key: "items:22" }), min: 1, max: 2, chance: 100 }]);
  expect([node.facts.requiredLevel, node.spawners.map((group) => [group.spawners, group.placementCount, group.unplaced, group.options.length]), node.placed]).toEqual([5, [[1, 1, 0, 1]], [{ cooldownSeconds: 300, objects: 1, placementCount: 0, unplaced: 1 }]]);
  expect(node.places).toEqual([{ label: "Crypt", mapSpaceId: "world", spotCount: 1, placementIds: ["p1"] }]);
  expect(node.spotCount).toBe(1);
  expect(ore.sourceSpotCount).toBe(1);
  // Only the attunement that names this node applies to it.
  expect(node.placedRules.map((rule) => rule.stepId)).toEqual(["wait-for-the-node", "wait-for-the-node", "pick-a-node"]);
});

test("placed rules select linked nodes and source scopes and compute yield chances", () => {
  const silver: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:silver-vein", name: "Silver vein", conditionId: null,
    sources: [{ ...vein.sources[0]!, nodeKey: "gatheringNodes:silver-vein", sourceId: "silver-spawner" }] };
  const direct: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:direct-vein", name: "Direct vein", conditionId: null,
    sources: [{ ...vein.sources[1]!, nodeKey: "gatheringNodes:direct-vein", sourceId: "direct-object" }] };
  const scoped: CatalogFacts = { ...craftFacts, gatheringNodes: [vein, silver, direct],
    progression: { ...craftFacts.progression, mechanicsRules: [
      ruleRow("attunement-642", "attunement", {}, [{ entityKey: silver.entityKey, label: silver.name }],
        [{ page: "gatheringNodes", target: "how-it-works", scope: "linked" }]),
      ruleRow("spawner-weighted-pick", "node-selection", {}, [],
        [{ page: "gatheringNodes", target: "how-it-works", scope: "spawned" }]),
      ruleRow("placed-node-cooldown", "node-availability", {}, [],
        [{ page: "gatheringNodes", target: "how-it-works", scope: "placed" }]),
      ruleRow("node-yield-bonus", "node-rewards", { chancePerLevel: 0.1 }, [],
        [{ page: "gatheringNodes", target: "how-it-works", scope: "all" }]),
    ] } };
  const references = buildEntityReferences(craftEntities, { facts: scoped, relations: craftRelations });
  const resolve = createReferenceResolver(references.refs), conditions = conditionsById(craftRelations.conditions);
  const nodes = projectGatheringNodeDocuments(scoped, craftRelations, { resolve, conditions, placements: new Map(),
    requirements: (ids) => requirementsFor(ids, conditions, resolve) });
  expect(nodes.get(vein.entityKey)?.placedRules.map((row) => row.stepId)).toEqual(["pick-a-node", "wait-for-the-node", "gather-the-items"]);
  expect(nodes.get(silver.entityKey)?.placedRules.map((row) => row.stepId)).toEqual(["pick-a-node", "pick-a-node", "gather-the-items"]);
  expect(nodes.get(direct.entityKey)?.placedRules.map((row) => row.stepId)).toEqual(["wait-for-the-node", "gather-the-items"]);
  expect(nodes.get(silver.entityKey)?.placedRules.find((row) => row.stepId === "gather-the-items")?.levelChances)
    .toEqual([{ level: 1, chance: 0.1 }, { level: 300, chance: 30 }]);
  expect(nodes.get(vein.entityKey)?.placedRules.find((row) => row.stepId === "gather-the-items")?.levelChances)
    .toEqual([{ level: 5, chance: 0.5 }, { level: 300, chance: 30 }]);
});

test("weighted spawner shares use effective endpoint weights per group without inventing an aggregate", () => {
  const source = vein.sources[0]!;
  const candidate = (optionIndex: number, nodeKey: string, low: number, high: number, minimum: number) => ({
    ...source, nodeKey, optionIndex, spawner: { ...source.spawner!, weightAtLowSkill: low, weightAtHighSkill: high, teaserWeight: minimum },
  });
  const first = candidate(0, vein.entityKey, 70, 10, 20);
  const second = candidate(1, "gatheringNodes:silver-vein", 30, 90, 0);
  const shares = spawnerShares([first, second], 151);
  expect(shares.get(0)?.map((share) => [share.skillLevel, share.percent])).toEqual([[1, 70], [151, 20 / 110 * 100]]);
  expect(shares.get(1)?.map((share) => [share.skillLevel, share.percent])).toEqual([[1, 30], [151, 90 / 110 * 100]]);
  expect(spawnerShares([first, candidate(2, vein.entityKey, 30, 90, 0)], 151).size).toBe(0);
  expect(spawnerShares([candidate(0, vein.entityKey, 0, 0, 0)], 151).size).toBe(0);
  const resolve = createReferenceResolver(buildEntityReferences(craftEntities, { facts: craftFacts, relations: craftRelations }).refs);
  const other: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:silver-vein", name: "Silver vein", sources: [{ ...second, sourceId: "spawner-1" }] };
  const original: CatalogGatheringNode = { ...vein, sources: [first, ...vein.sources.slice(1)] };
  const groups = [...spawnerGroups([original, other], resolve, new Map(), true).values()];
  expect(groups).toHaveLength(1);
  expect(groups[0]?.options[0]?.shares?.[1]?.percent).toBeCloseTo(20 / 110 * 100);
  expect(groups[0]?.options[1]?.shares?.[1]?.percent).toBeCloseTo(90 / 110 * 100);
  const alternative: CatalogGatheringNode = { ...vein, sources: [{ ...candidate(0, vein.entityKey, 1, 1, 0), sourceId: "spawner-2" }] };
  const separate = [...spawnerGroups([original, other, alternative], resolve, new Map(), true).values()];
  expect(separate).toHaveLength(2);
  expect(separate.map((group) => group.options.map((option) => option.shares?.[0]?.percent))).toEqual([[70, 30], [100]]);
});

test("an inverted authored loot quantity cannot become a displayed range", () => {
  const invalid: CatalogRelations = { ...relations, drops: [{ ...relations.drops[0]!, min: 15, max: 3 }] };
  const { documents } = project(entities, facts, invalid);
  const fromNpc = (documents.get("npcs:2") as PublicNpc).drops[0]!;
  const fromItem = (documents.get("items:1") as PublicItem).droppedBy[0]!;
  for (const row of [fromNpc, fromItem]) {
    expect(row).not.toHaveProperty("min");
    expect(row).not.toHaveProperty("max");
    expect(row.chance).toBe(12.5);
  }
});

test("a node with an unsupported yield operand has a guide link but no invented chance", () => {
  const uncertain: CatalogFacts = { ...craftFacts, progression: { ...craftFacts.progression, mechanicsRules: [
    ...craftFacts.progression.mechanicsRules,
    { ...ruleRow("node-yield-bonus", "node-rewards", {}), status: "unknown", placements: [{ page: "gatheringNodes", target: "how-it-works", scope: "all" }] },
  ] } };
  const { refs } = project(craftEntities, uncertain, craftRelations);
  const resolve = createReferenceResolver(refs), conditions = conditionsById(craftRelations.conditions);
  const node = projectGatheringNodeDocuments(uncertain, craftRelations, { resolve, conditions, placements: new Map(),
    requirements: (ids) => requirementsFor(ids, conditions, resolve) }).get(vein.entityKey)!;
  expect(node.placedRules.find((row) => row.stepId === "gather-the-items")).toEqual({
    target: "how-it-works", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), stepId: "gather-the-items",
  });
});

test("placed and spawned node spots count distinct identities across places", () => {
  const extra = { placementId: "p2", mapSpaceId: "world", label: "Coalway Woods", categories: [] };
  const multi: CatalogGatheringNode = { ...vein, sources: [
    vein.sources[0]!,
    { ...vein.sources[1]!, sourceId: "direct-a", placementId: "p1" },
    { ...vein.sources[1]!, sourceId: "direct-b", placementId: "p2" },
  ] };
  const scenario: CatalogFacts = { ...craftFacts, gatheringNodes: [multi] };
  const { refs } = project(craftEntities, scenario, craftRelations);
  const resolve = createReferenceResolver(refs), conditions = conditionsById(craftRelations.conditions);
  const node = projectGatheringNodeDocuments(scenario, craftRelations, { resolve, conditions, placements: new Map([["p1", p1], ["p2", extra]]),
    requirements: (ids) => requirementsFor(ids, conditions, resolve) }).get(vein.entityKey)!;
  expect(node.spotCount).toBe(2);
  expect(node.places.map(({ label, spotCount, placementIds }) => [label, spotCount, placementIds]))
    .toEqual([["Coalway Woods", 1, ["p2"]], ["Crypt", 1, ["p1"]]]);
});
