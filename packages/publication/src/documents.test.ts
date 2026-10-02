import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogNpcFacts, CatalogRelations, CatalogTaskFacts, CatalogRequirement, CatalogQuestRow } from "@afallon/contracts/catalog";
import { STATIC_DOCUMENT_SCHEMA_IDS, type PublicAbility, type EntityRef, type GearSetTier, type PublicDocument, type PublicGearSet, type PublicItem, type PublicNpc, type PublicPlace, type PublicProperty, type PublicQuest, type PublicSkill } from "@afallon/contracts/public";
import type { CatalogGatheringNode, CatalogMechanicsRule } from "@afallon/contracts/catalog";
import { corruptionRewards, type CorruptionRewards } from "./corruption-rewards";
import { readerCoverage } from "./coverage";
import { projectGatheringNodeDocuments, spawnerGroups } from "./gathering";
import { projectPublicDocuments } from "./documents";
import { conditionsById, type DocumentProjectionInput, requirementsFor } from "./documents/projection";
import { projectQuestObjective } from "./documents/quests";
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
  progression: { facts: [], links: [], talentNodes: [], spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] }, gatheringNodes: [], adventurerItems: [], adventurerWorld: null, dungeonFinderTank: null, adventurerInviteEffects: [], itemLootTables: [],
  items: [{ entityKey: "items:1", rarity: "Rare", itemType: "WEAPON", armorSlot: "BELT", weaponSlot: "MAIN HAND", weaponType: "One handed sword", armorType: "CLOTH",
    attackSpeed: 1.8, minDamage: 75, maxDamage: 124, stats: [
      { stat: { entityKey: "stats:53", label: "Item power" }, amount: 99, isPercent: false },
      { stat: { entityKey: "stats:27", label: "Strength" }, amount: 42, isPercent: false },
    ], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: { entityKey: null, label: "Enchantment -1" }, sellPrice: null,
    sellCurrency: null, buyPrice: 0, buyCurrency: { entityKey: null, label: "Currency -1" }, currency: null, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    equipmentRequirements, useConditions: [], actionAbilities: [], gameActions: [], useLines: [{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }], conditionIds: ["oathbreaker"], gearSet: { entityKey: "gearSets:17", label: "Adept Leather" } }],
  npcs: [{ entityKey: "npcs:2", minLevel: 5, maxLevel: 5, scalesWithPlayer: false, npcType: "Enemy", creatureType: null, family: null,
    faction: null, species: { entityKey: null, label: "Species -1" }, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, lowerLevelExperienceModifier: null, higherLevelExperienceModifier: null, experienceBonusPerLevel: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [],
    factionRewards: [], linkedNpc: null, lootSpecialization: { armorType: "PLATE", weaponTypes: ["AXE", "Shield"], stat: { entityKey: "stats:5", label: "Item power" } } }],
  quests: [{ entityKey: "quests:3", chainName: null, chainOrder: null, repeatable: false, turnInWithoutNpc: false, completedDescription: null,
    objectiveText: null, levelRequirement: null, levelRange: null, dungeon: null, experience: null, conditionIds: [], worldQuest: null }],
  tasks: [], places: [{ entityKey: "scenes:10", placeType: "dungeon", guideIncluded: true, guideDescription: null, levelRange: null,
    mapSpaceIds: ["world"], bosses: [], parentSceneKey: null }], raceStarts: [], properties: [], abilities: [], recipes: [],
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

function project(projectEntities: CatalogEntityRow[], projectFacts: CatalogFacts, projectRelations: CatalogRelations, placements: DocumentProjectionInput["placements"] = new Map(), regionIdsByMapSpace: DocumentProjectionInput["regionIdsByMapSpace"] = new Map(), npcLevels: DocumentProjectionInput["npcLevels"] = new Map(), placementIdsByKey: DocumentProjectionInput["placementIdsByKey"] = new Map(), placeVariants: NonNullable<DocumentProjectionInput["placeVariants"]> = new Map(), rewards?: CorruptionRewards) {
  const references = buildEntityReferences(projectEntities, { facts: projectFacts, relations: projectRelations });
  const documents = projectPublicDocuments({ entities: projectEntities, facts: projectFacts, relations: projectRelations, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements, regionIdsByMapSpace, npcLevels, placementIdsByKey, placeVariants, corruptionRewards: rewards });
  return { refs: references.refs, documents };
}

test("a timed dungeon names its thresholds, token bonuses, and altar, and a Dungeon Finder dungeon names the supply pack", () => {
  const dungeon = (firstRemainingSeconds: number | null): NonNullable<CatalogFacts["corruption"]>["dungeons"][number] => ({ scene: { entityKey: "scenes:10", label: "Crypt" },
    totalSeconds: 860, firstRemainingSeconds, secondRemainingSeconds: 300, maxLootItems: 3, bosses: null, lootTables: null, token: null, provenance: [] });
  const corruption = (row: ReturnType<typeof dungeon>): NonNullable<CatalogFacts["corruption"]> => ({ maxLevel: null, gearAllStatsPercentPerLevel: null, gearStatBonuses: null,
    mobStatBonuses: null, affixesPerToken: null, affixes: null, token: null, heart: null, dungeons: [row], heartRequirements: null, provenance: [] });
  const altarRelations: CatalogRelations = { ...relations, placements: [...relations.placements,
    { placementId: "altar", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Altar of Corruption", area: null, roles: [], families: [], randomChoices: [] }] };
  const placements = new Map([["altar", { placementId: "altar", mapSpaceId: "world", label: "Crypt", categories: ["corruptionAltar" as const] }]]);
  const place = (corruptionFacts: NonNullable<CatalogFacts["corruption"]>, finder: CatalogFacts["dungeonFinder"]) =>
    project(entities, { ...facts, corruption: corruptionFacts, dungeonFinder: finder }, altarRelations, placements, new Map([["world", []]])).documents.get("scenes:10") as PublicPlace;
  const timed = place(corruption(dungeon(500)), { supplyPack: { entityKey: "items:1", label: "Blade" }, dungeons: [{ entityKey: "scenes:10", label: "Crypt" }] });
  expect(timed.timedDungeon).toEqual({ totalSeconds: 860, thresholds: [{ remainingSeconds: 500, tokenLevels: 2 }, { remainingSeconds: 300, tokenLevels: 1 }], maxLootItems: 3,
    altars: [{ placementId: "altar", mapSpaceId: "world", label: "Crypt" }], guide: expect.objectContaining({ key: "mechanics:corruption" }) });
  expect(timed.dungeonFinder).toEqual({ supplyPack: expect.objectContaining({ key: "items:1" }) });
  const partial = place(corruption(dungeon(null)), { supplyPack: null, dungeons: [] });
  expect(partial.timedDungeon?.thresholds).toEqual([{ remainingSeconds: 300, tokenLevels: 1 }]);
  expect(partial.dungeonFinder).toBeUndefined();
});

test("only eligible gear publishes captured corruption settings and the guide-section placement", () => {
  const consumable: CatalogEntityRow = { entityKey: "items:6", kind: "items", nativeId: 6, name: "Corruption Token", description: null, iconAssetName: null, artwork: [] };
  const source = { path: "targets/0/corruption.json", sha256: "a".repeat(64) };
  const captured: NonNullable<CatalogFacts["corruption"]> = {
    maxLevel: 30, gearAllStatsPercentPerLevel: 5,
    gearStatBonuses: [{ stat: { entityKey: "stats:53", label: "Item power" }, amountPerLevel: 5, isPercent: false, sourceFieldPath: "GameDatabase.CombatSettings.CorruptionGearStatBonuses[0]" }],
    mobStatBonuses: [{ stat: { entityKey: "stats:27", label: "Strength" }, amountPerLevel: 10, isPercent: true, sourceFieldPath: "GameDatabase.CombatSettings.CorruptionStatBonuses[0]" }],
    affixesPerToken: 3, affixes: [], token: { entityKey: "items:6", label: "Corruption Token" },
    heart: null, dungeons: [{ scene: { entityKey: "scenes:10", label: "Crypt" }, totalSeconds: null, firstRemainingSeconds: null, secondRemainingSeconds: null, maxLootItems: null,
      bosses: [{ entityKey: "npcs:2", label: "Guardian" }], lootTables: [{ entityKey: "lootTables:4", label: "Guardian" }], token: { entityKey: "items:6", label: "Corruption Token" }, provenance: [] }], heartRequirements: [], provenance: [source],
  };
  const trinket: CatalogEntityRow = { entityKey: "items:7", kind: "items", nativeId: 7, name: "Tide Charm", description: null, iconAssetName: null, artwork: [] };
  const ordinary: CatalogEntityRow = { entityKey: "items:8", kind: "items", nativeId: 8, name: "Plain Gloves", description: null, iconAssetName: null, artwork: [] };
  const sourceEntities = [...entities, consumable, trinket, ordinary];
  const sourceFacts: CatalogFacts = { ...facts, entities: sourceEntities, corruption: captured,
    items: [...facts.items, { ...facts.items[0]!, entityKey: consumable.entityKey, itemType: "CONSUMABLE", corruptionToken: true },
      { ...facts.items[0]!, entityKey: trinket.entityKey, itemType: "Trinket", armorSlot: "Trinket", armorType: "JEWELRY" },
      { ...facts.items[0]!, entityKey: ordinary.entityKey, itemType: "ARMOR", armorSlot: "GLOVES" }] };
  const references = buildEntityReferences(sourceEntities, { facts: sourceFacts, relations });
  const rewards = corruptionRewards(captured, sourceFacts, [{ lootTableId: 4, itemKey: "items:1" }, { lootTableId: 4, itemKey: "items:6" }, { lootTableId: 4, itemKey: "items:7" }],
    new Map([["npcs:2", new Set([4])]]), new Set(references.refs.keys()), createReferenceResolver(references.refs));
  const projected = project(sourceEntities, sourceFacts, relations, undefined, undefined, undefined, undefined, undefined, rewards).documents;
  const gear = projected.get("items:1") as PublicItem;
  const token = projected.get(consumable.entityKey) as PublicItem;
  const trinketPage = projected.get(trinket.entityKey) as PublicItem;
  const ordinaryPage = projected.get(ordinary.entityKey) as PublicItem;
  expect(gear.facts.corruption).toEqual({ maxLevel: 30, allStatsPercentPerLevel: 5,
    statBonuses: [{ stat: { key: "stats:53", kind: "stats", name: "Item Power" }, amountPerLevel: 5, isPercent: false }] });
  expect(gear.facts.dungeonRewards).toEqual([{ place: expect.objectContaining({ key: "scenes:10" }), bosses: [expect.objectContaining({ key: "npcs:2" })], guaranteed: false }]);
  expect(gear.facts.stats[0]?.amount).toBe(42);
  expect(gear.facts.itemPower).toBe(99);
  expect(gear.placedRules).toContainEqual({ target: "corruption", guide: expect.objectContaining({ key: "mechanics:corruption" }), section: "gear" });
  expect(token.placedRules).toContainEqual({ target: "dungeon-rewards", guide: expect.objectContaining({ key: "mechanics:corruption" }), section: "timed-dungeons" });
  expect(token.facts.corruption).toBeUndefined();
  expect(token.facts.dungeonRewards).toEqual([{ place: expect.objectContaining({ key: "scenes:10" }), bosses: [expect.objectContaining({ key: "npcs:2" })], guaranteed: true }]);
  expect(trinketPage.facts).toMatchObject({ itemType: "Trinket", slot: "Trinket", armorType: "JEWELRY", corruption: gear.facts.corruption,
    dungeonRewards: gear.facts.dungeonRewards });
  expect(ordinaryPage.facts.corruption).toBeUndefined();
  expect(ordinaryPage.facts.dungeonRewards).toBeUndefined();
  expect(token.facts.tokenInfo).toEqual({ mobStatBonuses: [{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amountPerLevel: 10, isPercent: true }], affixesPerToken: 3 });
  expect(token.placedRules).toContainEqual({ target: "corruption-token", guide: expect.objectContaining({ key: "mechanics:corruption" }), section: "tokens" });
  expect(token.placedRules.some((entry) => entry.target === "corruption")).toBe(false);
  const heart: CatalogEntityRow = { entityKey: "items:162", kind: "items", nativeId: 162, name: "Heart of Corruption", description: null, iconAssetName: null, artwork: [] };
  const withHeart = [...sourceEntities, heart];
  const heartPage = project(withHeart, { ...sourceFacts, entities: withHeart,
    corruption: { ...captured, heart: { entityKey: heart.entityKey, label: heart.name } },
    items: [...sourceFacts.items, { ...facts.items[0]!, entityKey: heart.entityKey, itemType: "CONSUMABLE" }] },
  relations).documents.get(heart.entityKey) as PublicItem;
  expect(heartPage.placedRules.some((rule) => rule.target === "corruption-heart")).toBe(false);
  const unavailable = project(sourceEntities, { ...sourceFacts, corruption: { ...captured, gearStatBonuses: null } }, relations, undefined, undefined, undefined, undefined, undefined, rewards).documents.get("items:1") as PublicItem;
  expect(unavailable.facts.corruption).toBeUndefined();
  expect(unavailable.facts.dungeonRewards).toEqual(gear.facts.dungeonRewards);
});

test("currency purchases merge identical prices across merchants but preserve different costs", () => {
  const currency = { entityKey: "currencies:1", label: "Corrupted Emerald" };
  const product = { entityKey: "items:7", label: "Robe of the Arcanist" };
  const currencyEntities: CatalogEntityRow[] = [
    ...entities,
    { entityKey: "items:7", kind: "items", nativeId: 7, name: "Robe of the Arcanist", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "npcs:8", kind: "npcs", nativeId: 8, name: "Cloth Merchant", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "currencies:1", kind: "currencies", nativeId: 1, name: "Corrupted Emerald", description: null, iconAssetName: null, artwork: [] },
  ];
  const offer = (npc: number, cost: number, stockIndex: number): CatalogRelations["vendors"][number] => ({
    npc: { entityKey: `npcs:${npc}`, label: npc === 8 ? "Cloth Merchant" : "Guardian" }, item: product,
    currency, cost, merchantTableId: 4, stockIndex, conditionIds: [], placementIds: [],
  });
  const { documents } = project(currencyEntities, { ...facts, entities: currencyEntities, items: [
    { ...facts.items[0]!, currency },
    { ...facts.items[0]!, entityKey: "items:7", currency: null },
  ] }, { ...relations, vendors: [
    offer(2, 20, 0), offer(8, 20, 0), offer(8, 20, 0), offer(8, 25, 1),
    { ...offer(2, 100, 2), item: { entityKey: "items:86", label: "Ogre mercenary contract" } },
  ] });
  const item = documents.get("items:1") as PublicItem;
  const currencyRef = item.facts.currency;
  if (!currencyRef) throw new Error("The currency item has no currency.");
  expect(currencyRef).toMatchObject({ key: "currencies:1" });
  expect(item.buys.filter((row) => row.item.key !== null).map((row) => [row.item.key, row.price.amount, row.price.currency.key, row.soldBy.map((seller) => seller.key)])).toEqual([
    ["items:7", 20, "currencies:1", ["npcs:8", "npcs:2"]],
    ["items:7", 25, "currencies:1", ["npcs:8"]],
  ]);
  expect(item.buys).toContainEqual({ item: { key: null, label: "Ogre Mercenary Contract" }, price: { amount: 100, currency: currencyRef }, soldBy: [expect.objectContaining({ key: "npcs:2" })] });
  expect((documents.get("items:7") as PublicItem).buys).toEqual([]);
});

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
  expect(itemRow).toMatchObject({ values: { type: "One Handed Sword", itemPower: 99, levelRequirement: 27 }, facets: { slot: ["MAIN HAND"] } });
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

test("a place names where it is entered, and the overworld lists the places to enter", () => {
  const scene = (nativeId: number, name: string): CatalogEntityRow => ({ entityKey: `scenes:${nativeId}`, kind: "scenes", nativeId, name, description: null, iconAssetName: null, artwork: [] });
  const placeEntities = [...entities, scene(47, "Afallon"), scene(31, "Cave"), scene(26, "Vault"), scene(15, "Challenge Stone Blood")];
  const place = (entityKey: string, placeType: "dungeon" | "zone", mapSpaceId: string, levelRange: { min: number; max: number } | null = null) =>
    ({ entityKey, placeType, guideIncluded: false, guideDescription: null, levelRange, mapSpaceIds: [mapSpaceId], bosses: [], parentSceneKey: null });
  const placeFacts: CatalogFacts = { ...facts, entities: placeEntities, places: [place("scenes:10", "dungeon", "crypt", { min: 18, max: 20 }),
    place("scenes:47", "zone", "world"), place("scenes:31", "zone", "cave"), place("scenes:26", "zone", "vault"), place("scenes:15", "zone", "world")] };
  const teleport = (transitionId: string, sourceSceneKey: string, destinationSceneKey: string, placementIds: string[]) => ({ transitionId, sourceSceneKey, destinationSceneKey, transitionKind: "effect-teleport", placementIds, start: null });
  const placeRelations = { ...relations, transitions: [
    teleport("into-crypt", "scenes:47", "scenes:10", ["door"]), teleport("out-of-crypt", "scenes:10", "scenes:47", ["exit"]),
    teleport("into-cave", "scenes:47", "scenes:31", ["cave-door"]), teleport("copy-into-cave", "scenes:15", "scenes:31", ["stone-copy"]),
    teleport("into-stone", "scenes:47", "scenes:15", ["stone"]), teleport("into-vault", "scenes:31", "scenes:26", ["vault-door"]), teleport("out-of-vault", "scenes:26", "scenes:31", ["vault-exit"]),
  ] };
  const spot = (placementId: string, mapSpaceId: string) => [placementId, { placementId, mapSpaceId, label: "Afallon", categories: ["travelPoint" as const] }] as const;
  const placements = new Map([spot("door", "world"), spot("exit", "crypt"), spot("cave-door", "world"), spot("stone-copy", "world"), spot("stone", "world"), spot("vault-door", "cave"), spot("vault-exit", "vault")]);
  const references = buildEntityReferences(placeEntities, { facts: placeFacts, relations: placeRelations });
  const documents = projectPublicDocuments({ entities: placeEntities, facts: placeFacts, relations: placeRelations, references, resolve: createReferenceResolver(references.refs),
    artByEntity: new Map(), placements, regionIdsByMapSpace: new Map([["world", []], ["crypt", []], ["cave", []], ["vault", []]]), npcLevels: new Map(), placementIdsByKey: new Map(),
    overworldMapSpaceIds: new Set(["world"]), challengeStones: new Map([["scenes:15", placements.get("stone")!]]) });
  const entrances = (key: string) => (documents.get(key) as PublicPlace).entrances.map((row) => [row.place.key, row.placements.map((placement) => placement.placementId)]);
  expect(entrances("scenes:10")).toEqual([["scenes:47", ["door"]]]);
  expect(entrances("scenes:31")).toEqual([["scenes:47", ["cave-door"]]]);
  expect(entrances("scenes:26")).toEqual([["scenes:31", ["vault-door"]]]);
  expect(entrances("scenes:47")).toEqual([]);
  expect(entrances("scenes:15")).toEqual([]);
  expect((documents.get("scenes:47") as PublicPlace).placesToEnter.map((row) => [row.group, row.place.key, row.levelRange ?? null, row.placements.map((placement) => placement.placementId)])).toEqual([
    ["dungeon", "scenes:10", { min: 18, max: 20 }, ["door"]], ["challengeStone", "scenes:15", null, ["stone"]], ["other", "scenes:31", null, ["cave-door"]],
  ]);
  expect((documents.get("scenes:10") as PublicPlace).placesToEnter).toEqual([]);
});

test("only playable races with resolved scenes appear on their starting places", () => {
  const scene: CatalogEntityRow = { entityKey: "scenes:11", kind: "scenes", nativeId: 11, name: "Other Place", description: null, iconAssetName: null, artwork: [] };
  const races = ["Human", "Orc", "Unplayable"].map((name, index): CatalogEntityRow => ({
    entityKey: `races:${index}`, kind: "races", nativeId: index, name, description: null, iconAssetName: null, artwork: [],
  }));
  const allEntities = [...entities, scene, ...races];
  const endpoint = (key: string, label: string) => ({ entityKey: key, label });
  const start = (race: CatalogEntityRow, sceneKey: string | null) => ({
    race: endpoint(race.entityKey, race.name ?? race.entityKey), scene: sceneKey ? endpoint(sceneKey, sceneKey) : null,
    startingSceneId: 10, startingPositionId: 1, position: { x: 1, y: 2, z: 3 },
  });
  const progression: CatalogFacts["progression"] = { ...facts.progression,
    facts: races.map((race) => ({
      entityKey: race.entityKey, name: race.name, kind: "races" as const, artwork: [],
      details: { offeredClasses: race.name === "Unplayable" ? [] : [endpoint("classes:0", "Shieldmaster")] },
    })) };
  const allFacts: CatalogFacts = { ...facts, entities: allEntities, progression,
    places: [...facts.places, { ...facts.places[0]!, entityKey: scene.entityKey }],
    raceStarts: [start(races[0]!, "scenes:10"), start(races[1]!, "scenes:10"), start(races[2]!, scene.entityKey)] };
  const place = (key: string, raceStarts: CatalogFacts["raceStarts"]) =>
    project(allEntities, { ...allFacts, raceStarts }, relations).documents.get(key) as PublicPlace;
  const shared = place("scenes:10", allFacts.raceStarts);
  expect(shared.startingRaces).toEqual([{ entityKey: "races:0", name: "Human" }, { entityKey: "races:1", name: "Orc" }]);
  expect(shared.allPlayableRacesStartHere).toBe(true);
  expect(shared.entrances).toEqual([]);
  expect(place(scene.entityKey, allFacts.raceStarts).startingRaces).toEqual([]);

  const separated = [start(races[0]!, "scenes:10"), start(races[1]!, scene.entityKey), start(races[2]!, "scenes:10")];
  expect(place(scene.entityKey, separated)).toMatchObject({ startingRaces: [{ entityKey: "races:1", name: "Orc" }], allPlayableRacesStartHere: false });
  expect(place("scenes:10", separated)).toMatchObject({ startingRaces: [{ entityKey: "races:0", name: "Human" }], allPlayableRacesStartHere: false });
  expect(place("scenes:10", [start(races[0]!, "scenes:10"), start(races[1]!, null)])).toMatchObject({ allPlayableRacesStartHere: false });
});

test("variant places keep unique objects and quests without inheriting copied host content", () => {
  const host: CatalogEntityRow = { entityKey: "scenes:47", kind: "scenes", nativeId: 47, name: "Afallon", description: null, iconAssetName: null, artwork: [] };
  const uniqueQuest: CatalogEntityRow = { entityKey: "quests:4", kind: "quests", nativeId: 4, name: "Challenge", description: null, iconAssetName: null, artwork: [] };
  const allEntities = [...entities, host, uniqueQuest];
  const allFacts: CatalogFacts = { ...facts, entities: allEntities, places: [...facts.places, { ...facts.places[0]!, entityKey: host.entityKey }],
    quests: [...facts.quests, { ...facts.quests[0]!, entityKey: uniqueQuest.entityKey }] };
  const spot = (placementId: string, sceneNativeId: number, roles: CatalogRelations["placements"][number]["roles"]) =>
    ({ placementId, sceneNativeId, sceneKey: `scenes:${sceneNativeId}`, mapSpaceId: "world", label: null, area: null, roles, families: [], randomChoices: [] });
  const copiedNpc = [{ role: "merchant", npcEntityKey: "npcs:2", scope: "authored" }];
  const quest = (associationId: string, questKey: string, placementId: string): CatalogQuestRow => ({
    associationId, quest: { entityKey: questKey, label: questKey }, kind: "objectStart", index: 0, counterpart: null,
    task: null, count: null, rewardType: null, sourceId: null, label: null, availability: [], completions: [], worldOffer: null, placementIds: [placementId],
  });
  const placed: CatalogRelations = { ...relations, placements: [
    spot("host-copy", 47, copiedNpc), spot("variant-copy", 10, copiedNpc), spot("challenge-chest", 10, []), spot("challenge-object", 10, []),
  ], quests: [quest("copied", "quests:3", "variant-copy"), quest("unique", "quests:4", "challenge-chest")],
    transitions: [
      { ...relations.transitions[0]!, placementIds: ["variant-copy"] },
      { ...relations.transitions[0]!, transitionId: "challenge-exit", placementIds: ["challenge-chest"] },
    ] };
  const published = new Map([
    ["host-copy", { placementId: "host-copy", mapSpaceId: "world", label: "World", categories: ["merchant" as const] }],
    ["challenge-chest", { placementId: "challenge-chest", mapSpaceId: "world", label: "World", categories: ["container" as const] }],
    ["challenge-object", { placementId: "challenge-object", mapSpaceId: "world", label: "World", categories: ["interactiveObject" as const] }],
  ]);
  const variants = new Map([["scenes:10", { hostKey: "scenes:47", copiedPlacementIds: new Set(["variant-copy"]) }]]);
  const { documents } = project(allEntities, allFacts, placed, published, new Map([["world", ["entire-world"]]]), new Map(), new Map(), variants);
  const challenge = documents.get("scenes:10") as PublicPlace, overworld = documents.get("scenes:47") as PublicPlace;
  expect(challenge.variantOf).toMatchObject({ key: "scenes:47" });
  expect(challenge.space).toEqual({ mapSpaceId: "world", regionIds: [], placementIds: ["challenge-chest", "challenge-object"] });
  expect(challenge.npcs).toEqual([]);
  expect(challenge.services).toEqual([]);
  expect(challenge.containers).toEqual([{ category: "container", placementCount: 1 }]);
  expect(challenge.resources).toEqual([{ category: "interactiveObject", placementCount: 1 }]);
  expect(challenge.quests.map((ref) => ref.key)).toEqual(["quests:4"]);
  expect(overworld.npcs.map((row) => row.counterpart.key)).toEqual(["npcs:2"]);
  expect(overworld.space?.regionIds).toEqual(["entire-world"]);
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
  expect(rows.map((row) => [row.values.source, row.facets.sourceKind, row.facets.class])).toEqual([
    ["Assassin · Shadowcraft", ["Class"], ["Assassin"]],
    ["3 creatures", ["Creature"], []],
    ["Brown Horse", ["Item"], []],
    ["No Known Use", ["No Known Use"], []],
  ]);
});

test("shows a gear set in full on its member item and on the set's own page", () => {
  const { documents } = project(entities, facts, relations);
  const item = documents.get("items:1") as PublicItem;
  const setRef: EntityRef = { key: "gearSets:17", kind: "gearSets", name: "Adept Leather", slug: "adept-leather" };
  const tiers: GearSetTier[] = [
    { equipped: 3, stats: [{ stat: { key: "stats:12", kind: "stats", name: "Poison Damage" }, amount: 10, isPercent: true }] },
    { equipped: 7, stats: [{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amount: 40, isPercent: false }] },
  ];
  expect(item.facts.gearSet).toEqual({
    set: setRef, members: [{ key: "items:1", kind: "items", name: "Oathbreaker's Edge", slug: "oathbreakers-edge" }, { key: null, label: "Item 999" }], tiers,
  });
  const set = documents.get("gearSets:17") as PublicGearSet;
  expect(set.pieces).toEqual([{ item: { key: "items:1", kind: "items", name: "Oathbreaker's Edge", slug: "oathbreakers-edge" }, type: "One Handed Sword" }, { item: { key: null, label: "Item 999" } }]);
  expect(set.tiers).toEqual(tiers);
  // A set with a piece of unknown kind names no type, so the list offers no type for it.
  expect(set.type).toBeUndefined();
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
    values: { type: "Leather Gloves", itemPower: 99 }, facets: { slot: ["GLOVES"] },
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
      item: endpoint("items:1", "Blade"), min: 2, max: 3, rawRate: 30, availability: [night, { effect: "requires", conditionId: "empty", durationSeconds: null }], placementIds: ["p4"] },
      // The same object with its conditions in the other order.
      { objectName: "Egg cluster", sourceId: "chest-action-2", place: endpoint("scenes:10", "Crypt"),
      item: endpoint("items:1", "Blade"), min: 2, max: 3, rawRate: 30, availability: [{ effect: "requires", conditionId: "empty", durationSeconds: null }, night], placementIds: ["p4"] }],
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
  // The place lists the object that gives the item, with its spot and its conditions.
  expect((documents.get("scenes:10") as PublicPlace).lootObjects).toEqual([expect.objectContaining({ label: "Egg Cluster", items: [refs.get("items:1")!],
    placements: [expect.objectContaining({ placementId: "p4" })], availability: [expect.objectContaining({ effect: "requires" })] })]);
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

test("Hunter tameability distinguishes flagged Elite variants and retains placement scaling", () => {
  const candidates: CatalogEntityRow[] = [
    { entityKey: "npcs:350", kind: "npcs", nativeId: 350, name: "Iceclaw Bear", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "npcs:351", kind: "npcs", nativeId: 351, name: "Iceclaw Bear", description: null, iconAssetName: null, artwork: [] },
    { entityKey: "classes:6", kind: "classes", nativeId: 6, name: "Hunter", description: null, iconAssetName: null, artwork: [] },
  ];
  const scenarioEntities = [...entities, ...candidates];
  const normal = { ...facts.npcs[0]!, entityKey: "npcs:350", npcType: "MOB", creatureType: "BEAST", hunterTamable: true };
  const elite = { ...normal, entityKey: "npcs:351", npcType: "ELITE" };
  const scenarioFacts: CatalogFacts = { ...facts, entities: scenarioEntities, npcs: [normal, elite] };
  const spot = (placementId: string, npcEntityKey: string) => ({
    placementId, sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: null, area: null,
    roles: [{ role: "enemy" as const, npcEntityKey, scope: "authored" as const }], families: [], randomChoices: [],
  });
  const scenarioRelations: CatalogRelations = { ...relations, placements: [spot("bear", normal.entityKey), spot("elite", elite.entityKey)], drops: [] };
  const placements = new Map(["bear", "elite"].map((placementId) => [placementId, { placementId, mapSpaceId: "world", label: "Coalway Woods", categories: ["enemy" as const] }] as const));
  const levels = new Map([["bear", new Map([[normal.entityKey, { min: 15, max: 30, scales: true }]])], ["elite", new Map([[elite.entityKey, { min: 10, max: 10, scales: false }]])]]);
  const { documents } = project(scenarioEntities, scenarioFacts, scenarioRelations, placements, new Map([["world", []]]), levels);
  const bear = documents.get(normal.entityKey) as PublicNpc;
  expect(bear.variantFields).toContain("tameable");
  expect(bear.facts.tameable).toBeUndefined();
  expect(bear.variants.map((variant) => [variant.key, variant.facts.tameable, variant.level?.scales]))
    .toEqual([["npcs:350", true, true], ["npcs:351", false, false]]);
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
// An attunement rule links the item that gives the effect and then the node that it favours.
const attunementRow = (ruleId: string, itemKey: string, effect: string, node: { entityKey: string; label: string }): CatalogMechanicsRule => ({
  ...ruleRow(ruleId, "attunement", { boostWeight: 10 }, [{ entityKey: itemKey, label: effect }, node], [{ page: "gatheringNodes", target: "how-it-works", scope: "linked" }]),
  phrase: `Using {#0} gives ${effect}, which adds {boostWeight} to the weight of {#1}.`,
});
const attunementItem = (itemKey: string, effectKey: string, effect: string) => ({ ...facts.items[0]!, entityKey: itemKey, gearSet: null, conditionIds: [], equipmentRequirements: [],
  gameActions: [{ ...recipeAction(null), type: "Effect", target: { entityKey: effectKey, label: effect } }] });
const vein: CatalogGatheringNode = { entityKey: "gatheringNodes:iron-vein", name: "Iron vein", levelHint: "Mining 5", variant: false, skill: { entityKey: "skills:7", label: "Mining" }, skillExperience: 15, characterExperience: 4,
  lootTable: { entityKey: null, label: "Iron vein" }, conditionId: "vein-gate", sources: [
    { nodeKey: "gatheringNodes:iron-vein", sourceId: "spawner-1", sourceKind: "spawner-option", optionIndex: 0, cooldown: null, placementId: "p1",
      spawner: { skill: { entityKey: "skills:7", label: "Mining" }, respawnTime: 120, respawnJitter: 30, despawnDelay: 60, playerRange: 40, skillCap: 150, weightAtLowSkill: 70, weightAtHighSkill: 24, teaserWeight: 0 } },
    { nodeKey: "gatheringNodes:iron-vein", sourceId: "object-1", sourceKind: "placed-object", optionIndex: null, cooldown: 300, placementId: null, spawner: null },
  ] };
const recipeAction = (target: string | null) => ({ template: null, type: "Recipe", chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "GameScene", amount: 0, target: target === null ? null : { entityKey: target, label: target } });
const craftFacts: CatalogFacts = { ...facts, entities: craftEntities,
  items: [...facts.items, { ...facts.items[0]!, entityKey: "items:20", gearSet: null, conditionIds: [], equipmentRequirements: [], gameActions: [{ ...recipeAction(null), type: "TriggerSound" }, recipeAction("recipes:7"), recipeAction("recipes:8")] },
    attunementItem("items:30", "effects:98", "Prospecting"), attunementItem("items:31", "effects:642", "Silver Attunement")],
  recipes: [
    { entityKey: "recipes:7", skill: { entityKey: "skills:0", label: "Alchemy" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 40, experience: 7, craftTime: 1, products: [], materials: [] }] },
    { entityKey: "recipes:8", skill: { entityKey: "skills:0", label: "Alchemy" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 0, experience: 0, craftTime: 1, products: [], materials: [] }] },
    { entityKey: "recipes:9", skill: { entityKey: null, label: "Skill 99" }, station: null, learnedByDefault: false, ranks: [{ rank: 1, unlockCost: 5, experience: 3, craftTime: 1, products: [], materials: [] }] },
  ],
  progression: { ...facts.progression, facts: [skillFact("skills:0", "Alchemy"), skillFact("skills:7", "Mining"), skillFact("skills:11", "Axes"),
    { entityKey: "effects:98", name: "Prospecting", kind: "effects", details: { duration: 900, endless: false } }, { entityKey: "effects:642", name: "Silver Attunement", kind: "effects", details: { duration: 900, endless: false } }] as never, mechanicsRules: [
    ruleRow("recipe-rank-gate", "crafting", { minimumRequiredLevel: 1 }, [], [{ page: "items", target: "crafting", scope: "all" }]),
    ruleRow("recipe-experience-bands", "crafting-experience", { halfFromLevels: 20, noneFromLevels: 35, halfMultiplier: 0.5 }),
    ruleRow("recipe-experience-rounding", "crafting-experience", {}), ruleRow("weapon-skill-hit", "skill-experience", { hitExperience: 2 }), ruleRow("weapon-skills", "skill-experience", {}, [{ entityKey: "skills:11", label: "Axes" }]),
    ruleRow("recipe-item-tooltip", "crafting", {}, [], [{ page: "items", target: "teaches", scope: "all" }]),
    ruleRow("spawner-respawn", "node-availability", { minimumRespawnSeconds: 5 }, [], [{ page: "gatheringNodes", target: "how-it-works", scope: "spawned" }]),
    ruleRow("placed-node-cooldown", "node-availability", {}, [], [{ page: "gatheringNodes", target: "how-it-works", scope: "placed" }]),
    attunementRow("attunement-98", "items:30", "Prospecting", { entityKey: "gatheringNodes:iron-vein", label: "Iron vein" }),
    attunementRow("attunement-642", "items:31", "Silver Attunement", { entityKey: "gatheringNodes:silver-vein", label: "Silver vein" }),
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

test("only an item that adventurers can take links the adventurer gear guide", () => {
  const gearRule = { ...ruleRow("adventurer-gear-list", "gear-upgrades", {}, [], [{ page: "items", target: "adventurers", scope: "all" }]), topic: "adventurers" as const };
  const source = { ...craftFacts, progression: { ...craftFacts.progression, mechanicsRules: [...craftFacts.progression.mechanicsRules, gearRule] },
    adventurerItems: [{ itemKey: "items:22", kind: "equipmentReward" as const, adventurer: null, minimumContentLevel: null, rewardChance: 0.4 }] };
  const { documents } = project(craftEntities, source, craftRelations);
  expect((documents.get("items:22") as PublicItem).placedRules).toEqual([{ target: "adventurers", guide: expect.objectContaining({ key: "mechanics:adventurers" }), section: "gear-upgrades" }]);
  expect((documents.get("items:21") as PublicItem).placedRules.map((rule) => rule.target)).toEqual(["crafting"]);
});

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
  expect(product.placedRules).toEqual([{ target: "crafting", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), section: "crafting" }]);
  expect(item.placedRules).toEqual([{ target: "teaches", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), section: "crafting" }]);
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
  expect((documents.get("items:21") as PublicItem).crafting?.ranks).toEqual([{ rank: 1, requiredLevel: 40, highestLevel: 300, baseExperience: 7, bands: [
    { band: "full", from: 40, to: 59, experience: 7 }, { band: "half", from: 60, to: 74, experience: 4 }, { band: "none", from: 75, experience: 0 },
  ] }]);
  expect((documents.get("items:23") as PublicItem).crafting?.ranks).toEqual([{ rank: 1, requiredLevel: 1, highestLevel: 300, baseExperience: 0, bands: [] }]);
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
  expect(node.placedRules.map((rule) => rule.section)).toEqual(["node-availability", "attunement"]);
});

test("placed rules select linked nodes and source scopes and compute yield chances", () => {
  const silver: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:silver-vein", name: "Silver vein", conditionId: null,
    sources: [{ ...vein.sources[0]!, nodeKey: "gatheringNodes:silver-vein", sourceId: "silver-spawner" }] };
  const direct: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:direct-vein", name: "Direct vein", conditionId: null,
    sources: [{ ...vein.sources[1]!, nodeKey: "gatheringNodes:direct-vein", sourceId: "direct-object" }] };
  const scoped: CatalogFacts = { ...craftFacts, gatheringNodes: [vein, silver, direct],
    progression: { ...craftFacts.progression, mechanicsRules: [
      attunementRow("attunement-642", "items:31", "Silver Attunement", { entityKey: silver.entityKey, label: silver.name }),
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
  expect(nodes.get(vein.entityKey)?.placedRules.map((row) => row.section)).toEqual(["node-selection", "node-availability", "node-rewards"]);
  expect(nodes.get(silver.entityKey)?.placedRules.map((row) => row.section)).toEqual(["attunement", "node-selection", "node-rewards"]);
  expect(nodes.get(direct.entityKey)?.placedRules.map((row) => row.section)).toEqual(["node-availability", "node-rewards"]);
  expect(nodes.get(silver.entityKey)?.placedRules.find((row) => row.section === "node-rewards")?.levelChances)
    .toEqual([{ level: 1, chance: 0.1 }, { level: 300, chance: 30 }]);
  expect(nodes.get(vein.entityKey)?.placedRules.find((row) => row.section === "node-rewards")?.levelChances)
    .toEqual([{ level: 5, chance: 0.5 }, { level: 300, chance: 30 }]);
});

test("spawners with the same options form one group, and only a complete option list has verified odds", () => {
  const source = vein.sources[0]!;
  const candidate = (optionIndex: number, nodeKey: string, low: number, high: number, minimum: number) => ({
    ...source, nodeKey, optionIndex, spawner: { ...source.spawner!, weightAtLowSkill: low, weightAtHighSkill: high, teaserWeight: minimum },
  });
  const first = candidate(0, vein.entityKey, 70, 10, 20);
  const second = candidate(1, "gatheringNodes:silver-vein", 30, 90, 0);
  const resolve = createReferenceResolver(buildEntityReferences(craftEntities, { facts: craftFacts, relations: craftRelations }).refs);
  const other: CatalogGatheringNode = { ...vein, entityKey: "gatheringNodes:silver-vein", name: "Silver vein", sources: [{ ...second, sourceId: "spawner-1" }] };
  const original: CatalogGatheringNode = { ...vein, sources: [first, ...vein.sources.slice(1)] };
  const groups = [...spawnerGroups([original, other], resolve, new Map(), true).values()];
  expect(groups.map((group) => [group.options.map((option) => option.lowSkillWeight), group.oddsVerified])).toEqual([[[70, 30], true]]);
  const alternative: CatalogGatheringNode = { ...vein, sources: [{ ...candidate(0, vein.entityKey, 1, 1, 0), sourceId: "spawner-2" }] };
  expect([...spawnerGroups([original, other, alternative], resolve, new Map(), true).values()]).toHaveLength(2);
  // A spawner whose option 1 is missing cannot give chances, and unverified rules give no chances to any spawner.
  const gap: CatalogGatheringNode = { ...vein, sources: [{ ...candidate(0, vein.entityKey, 1, 1, 0), sourceId: "spawner-3" }, { ...candidate(2, vein.entityKey, 5, 5, 0), sourceId: "spawner-3" }] };
  expect([...spawnerGroups([gap], resolve, new Map(), true).values()].map((group) => group.oddsVerified)).toEqual([false]);
  expect([...spawnerGroups([original, other], resolve, new Map(), false).values()].map((group) => group.oddsVerified)).toEqual([false]);
});

test("an NPC's kill experience carries its level difference only when both modifiers are known", () => {
  const withRoll = (lower: number | null, higher: number | null): CatalogFacts => ({ ...facts, npcs: facts.npcs.map((npc) => ({ ...npc, minExperience: 10, maxExperience: 15, experienceBonusPerLevel: 2,
    lowerLevelExperienceModifier: lower, higherLevelExperienceModifier: higher })) });
  const experienceOf = (source: CatalogFacts) => (project(entities, source, relations).documents.get("npcs:2") as PublicNpc).facts.experience;
  // The fixture offers no class, so no level template gives a cap.
  expect(experienceOf(withRoll(-20, 20))).toEqual({ min: 10, max: 14, perLevel: 2, levelDifference: { higher: 20, lower: -20 } });
  expect(experienceOf(withRoll(null, 20))).toEqual({ min: 10, max: 14, perLevel: 2 });
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
  expect(node.placedRules.find((row) => row.section === "node-rewards")).toEqual({
    target: "how-it-works", guide: expect.objectContaining({ key: "mechanics:crafting-and-gathering" }), section: "node-rewards",
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

test("only adventurers on the world roster link their NPC page to the invitation guide", () => {
  const visitor: CatalogEntityRow = { ...entities[1]!, entityKey: "npcs:99", nativeId: 99, name: "Visitor" };
  const invite = { adventurer: { entityKey: "npcs:2", label: "Guardian" }, effect: { entityKey: "effects:21", label: "Invite Guardian" },
    effectType: { value: 14, name: "Pet" }, duration: 3600, endless: true, firstRank: null,
    inviteEffectSourceFieldPath: "NPC.InviteEffectID", sourceFieldPath: "Effect", firstRankSourceFieldPath: null,
    sourceFieldPaths: { effectType: "Effect.type", duration: "Effect.duration", endless: "Effect.endless" }, provenance: [] };
  const rule: CatalogMechanicsRule = { ruleId: "adventurer-friends-panel", topic: "adventurers", section: "meeting-and-inviting",
    ordinal: 0, status: "verified", phrase: "Add a friend before inviting them.", operands: {}, links: [], sources: [],
    placements: [{ page: "npcs", target: "adventurers", scope: "all" }] };
  const source = { ...facts, entities: [...entities, visitor], npcs: [...facts.npcs, { ...facts.npcs[0]!, entityKey: visitor.entityKey }],
    adventurerInviteEffects: [invite], progression: { ...facts.progression, mechanicsRules: [rule] } };
  const projected = project(source.entities, source, relations).documents;
  expect((projected.get("npcs:2") as PublicNpc).placedRules).toContainEqual({
    target: "adventurers", guide: expect.objectContaining({ key: "mechanics:adventurers" }), section: "meeting-and-inviting",
  });
  expect((projected.get(visitor.entityKey) as PublicNpc).placedRules.some((entry) => entry.target === "adventurers")).toBe(false);
});

test("adventurer-only kits have their own coverage group, while player sources remain independent", () => {
  const kit: CatalogEntityRow = { ...entities[0]!, entityKey: "items:901", nativeId: 901, name: "Guardian's tank kit" };
  const band: CatalogEntityRow = { ...entities[0]!, entityKey: "items:902", nativeId: 902, name: "Adventurer's cloak" };
  const all = [...entities, kit, band];
  const withGear: CatalogFacts = { ...facts, entities: all, items: [...facts.items,
    { ...facts.items[0]!, entityKey: kit.entityKey }, { ...facts.items[0]!, entityKey: band.entityKey }],
    adventurerItems: [
      { itemKey: kit.entityKey, kind: "kitUpgradeItem", adventurer: { entityKey: "npcs:2", label: "Guardian" }, minimumContentLevel: null, rewardChance: null },
      { itemKey: band.entityKey, kind: "equipmentBand", adventurer: null, minimumContentLevel: 9, rewardChance: null },
      { itemKey: band.entityKey, kind: "equipmentReward", adventurer: null, minimumContentLevel: null, rewardChance: 0.4 },
    ] };
  const vendor = { npc: { entityKey: "npcs:2", label: "Guardian" }, item: { entityKey: band.entityKey, label: band.name! },
    currency: null, cost: 15, merchantTableId: 4, stockIndex: 0, conditionIds: [], placementIds: [] };
  const projected = project(all, withGear, { ...relations, vendors: [vendor] }).documents;
  const kitPage = projected.get(kit.entityKey) as PublicItem, bandPage = projected.get(band.entityKey) as PublicItem;
  expect(kitPage.adventurers).toEqual([{ kind: "kitUpgradeItem", adventurer: expect.objectContaining({ key: "npcs:2" }) }]);
  expect(bandPage.adventurers).toEqual([{ kind: "equipmentBand", minimumContentLevel: 9 }, { kind: "equipmentReward", chance: 40 }]);
  expect(bandPage.soldBy).toHaveLength(1);
  const gaps = readerCoverage(projected.values()).gaps;
  expect(gaps.find((gap) => gap.gap === "itemAdventurerOnly")?.pages.map((row) => row.key)).toContain(kit.entityKey);
  expect(gaps.find((gap) => gap.gap === "itemWithoutSource")?.pages.map((row) => row.key) ?? []).not.toContain(kit.entityKey);
  expect(gaps.find((gap) => gap.gap === "itemAdventurerOnly")?.pages.map((row) => row.key) ?? []).not.toContain(band.entityKey);
});

test("used bags publish independent chest rows and supply packs keep their gated tables for playable classes", () => {
  const bag: CatalogEntityRow = { ...entities[0]!, entityKey: "items:377", nativeId: 377, name: "Soaked Bag" };
  const gold: CatalogEntityRow = { ...entities[0]!, entityKey: "items:30", nativeId: 30, name: "Gold" };
  const coin: CatalogEntityRow = { ...entities[0]!, entityKey: "currencies:0", kind: "currencies", nativeId: 0, name: "Gold Coin" };
  const pack: CatalogEntityRow = { ...entities[0]!, entityKey: "items:418", nativeId: 418, name: "Adventurer's Supply Pack" };
  const all = [...entities, bag, gold, coin, pack];
  const action = { template: null, chance: 100, nodeAction: "RankUp", progressionType: "Unlock", teleportType: "Position", amount: 1, target: null };
  const withUses: CatalogFacts = { ...facts, entities: all, items: [...facts.items,
    { ...facts.items[0]!, entityKey: gold.entityKey, itemType: "CURRENCY", currency: { entityKey: coin.entityKey, label: coin.name! } },
    { ...facts.items[0]!, entityKey: bag.entityKey, itemType: "CONSUMABLE", gameActions: [
      { ...action, type: "Item", alterAction: "Remove", target: { entityKey: bag.entityKey, label: bag.name! } },
      { ...action, type: "TriggerVisualEffect", visualEffect: { name: "Soaked bag loot", prefabs: [
        { key: "VFX/Soaked bag loot_VISUAL_EFFECT_0", loaded: true, prefabAvailable: true, chests: [
          { name: "Loot soaked bag", maxDrops: 2, rows: [
            { sourceIndex: 0, itemId: 30, min: 10, max: 20, chance: 100 },
            { sourceIndex: 1, itemId: 1, min: 1, max: 2, chance: 15 },
          ] },
        ] },
      ] } },
    ] },
    { ...facts.items[0]!, entityKey: pack.entityKey, itemType: "CONSUMABLE", gameActions: [
      { ...action, type: "LootTable", target: { entityKey: "lootTables:147", label: "Supply Pack Plate lvl 1-5" },
        requirements: [{ checkCount: false, requiredCount: 0, checks: [
          { type: "Level", rule: "Mandatory", classId: -1, level: 1, levelMax: 0, comparison: "EqualOrAbove" },
          { type: "Level", rule: "Mandatory", classId: -1, level: 5, levelMax: 0, comparison: "EqualOrBelow" },
          { type: "Class", rule: "Optional", classId: 0, level: 0, levelMax: 0, comparison: "Equal" },
          { type: "Class", rule: "Optional", classId: 4, level: 0, levelMax: 0, comparison: "Equal" },
        ] }],
      },
      { ...action, type: "LootTable", target: { entityKey: "lootTables:147", label: "Supply Pack Plate lvl 1-5" },
        requirements: [{ checkCount: false, requiredCount: 0, checks: [
          { type: "Class", rule: "Optional", classId: 4, level: 0, levelMax: 0, comparison: "Equal" },
        ] }],
      },
    ] },
  ], itemLootTables: [{ id: 147, name: "Supply Pack Plate lvl 1-5", includeWorldLoot: true,
    worldLootShare: 50, bonusDropChance: 20, hasMinimumDrops: true, minDroppedItems: 1, limitDroppedItems: true,
    maxDroppedItems: 2, worldLootStats: [27], worldLootArmorType: { nativeId: -1, name: "PLATE" },
    entries: [{ item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rate: 0 }] }],
    progression: { ...facts.progression, offeredClasses: ["classes:0"] } };
  const projected = project(all, withUses, { ...relations, drops: [], gathers: [], containers: [] }).documents;
  const bagUse = (projected.get(bag.entityKey) as PublicItem).whenUsed;
  expect(bagUse.itemChanges).toEqual([{ action: "Remove", item: expect.objectContaining({ key: bag.entityKey }), count: 1 }]);
  expect(bagUse.chests[0]).toEqual({ chance: 100, maxDrops: 2, rows: [
    { item: expect.objectContaining({ key: coin.entityKey }), min: 10, max: 20, chance: 100 },
    { item: expect.objectContaining({ key: "items:1" }), min: 1, max: 2, chance: 15 },
  ] });
  expect((projected.get(pack.entityKey) as PublicItem).whenUsed.packs).toEqual([
    { classes: [expect.objectContaining({ key: "classes:0" })], minLevel: 1, maxLevel: 5,
      entries: [{ item: expect.objectContaining({ key: "items:1" }), min: 1, max: 1 }],
      bonusChance: 20, worldShare: 50, minimumPicks: 1, maximumPicks: 2,
      armorType: "PLATE", stats: [expect.objectContaining({ key: "stats:27" })], worldLoot: [] },
  ]);
  // The item of a chest row and of a playable band names the item that gives it. The currency row and the band of an
  // unplayable class give no row.
  const blade = projected.get("items:1") as PublicItem;
  expect(blade.fromItems).toEqual([
    { kind: "chest", source: expect.objectContaining({ key: bag.entityKey }), min: 1, max: 2, chance: 15 },
    { kind: "pack", source: expect.objectContaining({ key: pack.entityKey }), classes: [expect.objectContaining({ key: "classes:0" })], minLevel: 1, maxLevel: 5, min: 1, max: 1 },
  ]);
  // Coverage counts a From items row and a dungeon reward as a known source.
  const withoutSource = (document: PublicItem) => readerCoverage([document]).gaps.some((gap) => gap.gap === "itemWithoutSource");
  const { crafting: _crafting, ...rest } = blade;
  const bare: PublicItem = { ...rest, droppedBy: [], soldBy: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], startingGearOf: [] };
  const reward = { ...bare, fromItems: [], facts: { ...bare.facts, dungeonRewards: [{ place: blade.ref, bosses: [], guaranteed: true }] } };
  expect([withoutSource(bare), withoutSource({ ...bare, fromItems: [] }), withoutSource(reward)]).toEqual([false, true, false]);
});

test("a linked When used rule appears on its item and not on unrelated items", () => {
  const other: CatalogEntityRow = { ...entities[0]!, entityKey: "items:2", nativeId: 2, name: "Other item" };
  const linked = ruleRow("chest-row-rolls", "chests", {}, [{ entityKey: "items:1", label: "Blade" }],
    [{ page: "items", target: "when-used", scope: "linked" }]);
  const withRule: CatalogFacts = { ...facts, entities: [...entities, other], items: [...facts.items, { ...facts.items[0]!, entityKey: other.entityKey }],
    progression: { ...facts.progression, mechanicsRules: [{ ...linked, topic: "loot" }] } };
  const { documents } = project([...entities, other], withRule, relations);
  expect((documents.get("items:1") as PublicItem).placedRules).toContainEqual(expect.objectContaining({
    target: "when-used", guide: expect.objectContaining({ key: "mechanics:loot" }), section: "chests",
  }));
  expect((documents.get(other.entityKey) as PublicItem).placedRules.some((rule) => rule.target === "when-used")).toBe(false);
});

test("a cloth item gives its chance per kill by creature level and counts as sourced", () => {
  const other: CatalogEntityRow = { ...entities[0]!, entityKey: "items:2", nativeId: 2, name: "Other cloth" };
  const tier = (key: string, startLevel: number, rampEnd: number, lowWeight: number, highWeight: number, teaserWeight: number) =>
    ({ item: { entityKey: key, label: key }, startLevel, rampEnd, lowWeight, highWeight, teaserWeight });
  // Blade weighs 3 at level 1 and moves to 1 at level 3. Other cloth weighs 1 below level 2, then moves from 1 to 4 by level 5.
  const clothFacts: CatalogFacts = { ...facts, entities: [...entities, other], items: [...facts.items, { ...facts.items[0]!, entityKey: other.entityKey }],
    clothDrops: { creatureTypes: ["HUMANOID", "UNDEAD"], dropChance: 80, minCount: 1, maxCount: 3, tiers: [tier("items:1", 1, 3, 3, 1, 3), tier(other.entityKey, 2, 5, 1, 4, 1)] } };
  const { documents } = project([...entities, other], clothFacts, relations);
  const blade = documents.get("items:1") as PublicItem;
  // Blade's share: 3 of 4 at level 1, 2 of 3 at level 2, 1 of 3 at level 3, 1 of 4 at level 4, and 1 of 5 from level 5.
  // A range ends before the next level where a weight starts or stops a change, and the last range has no upper level.
  expect(blade.clothDrop).toEqual({ creatureTypes: ["HUMANOID", "UNDEAD"], chance: 80, min: 1, max: 3, levels: [
    { minLevel: 1, maxLevel: 1, startChance: 60 }, { minLevel: 2, maxLevel: 2, startChance: 53.3 },
    { minLevel: 3, maxLevel: 4, startChance: 26.7, endChance: 20 }, { minLevel: 5, startChance: 16 },
  ] });
  expect((documents.get(other.entityKey) as PublicItem).clothDrop?.levels.at(-1)).toEqual({ minLevel: 5, startChance: 64 });
  const bare: PublicItem = { ...blade, droppedBy: [], soldBy: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], startingGearOf: [], fromItems: [] };
  delete bare.crafting;
  expect(readerCoverage([bare]).gaps.some((gap) => gap.gap === "itemWithoutSource")).toBe(false);
});

test("quest pickups and the Dungeon Finder supply pack count as item sources", () => {
  const pickup = { item: { entityKey: "items:1", label: "Blade" }, amount: 2, quest: { entityKey: "quests:3", label: "Quest" }, task: null, prerequisiteTask: null, requiredItemCount: 0, singleUse: true };
  const pickupFacts: CatalogFacts = { ...facts,
    questPickups: [
      { ...pickup, origin: { kind: "creature", npc: { entityKey: "npcs:2", label: "Guardian" }, sceneNativeId: 10 } },
      { ...pickup, origin: { kind: "creature", npc: { entityKey: "npcs:2", label: "Guardian" }, sceneNativeId: 10 } },
      { ...pickup, origin: { kind: "placed", placementId: "p1", sceneNativeId: 10 } },
      { ...pickup, origin: { kind: "placed", placementId: "p2", sceneNativeId: 10 } },
    ],
    dungeonFinder: { supplyPack: { entityKey: "items:1", label: "Blade" }, dungeons: [{ entityKey: "scenes:10", label: "Place" }] } };
  const { documents } = project(entities, pickupFacts, relations, new Map([
    ["p1", { placementId: "p1", mapSpaceId: "world", label: "World", categories: [] }],
    ["p2", { placementId: "p2", mapSpaceId: "world", label: "World", categories: [] }],
  ]));
  const blade = documents.get("items:1") as PublicItem;
  // Two pickups of one creature and quest give one row. Placed pickups with equal facts share one row with both spots.
  expect(blade.questPickups).toEqual([
    { kind: "creature", counterpart: expect.objectContaining({ key: "npcs:2" }), quest: expect.objectContaining({ key: "quests:3" }), amount: 2 },
    { kind: "placed", quest: expect.objectContaining({ key: "quests:3" }), amount: 2, singleUse: true, placementCount: 2,
      places: [{ label: "World", mapSpaceId: "world", spotCount: 2, placementIds: ["p1", "p2"] }] },
  ]);
  expect(blade.dungeonFinder).toEqual({ dungeons: [expect.objectContaining({ key: "scenes:10" })] });
  const withoutSource = (document: PublicItem) => readerCoverage([document]).gaps.some((gap) => gap.gap === "itemWithoutSource");
  const { crafting: _crafting, ...rest } = blade;
  const bare: PublicItem = { ...rest, droppedBy: [], soldBy: [], gatheredFrom: [], inContainers: [], collectedFrom: [], rewardedBy: [], givenBy: [], startingGearOf: [], fromItems: [] };
  const { dungeonFinder: _finder, ...pickupsOnly } = bare;
  expect([withoutSource(pickupsOnly), withoutSource({ ...bare, questPickups: [] }), withoutSource({ ...pickupsOnly, questPickups: [] })]).toEqual([false, false, true]);
});

test("a roster adventurer fights with its class abilities and stats and shows its class, party role, preferred tree, and arrival", () => {
  const npc = (entityKey: string, name: string): CatalogEntityRow => ({ ...entities[1]!, entityKey, nativeId: Number(entityKey.slice(5)), name });
  const cleave: CatalogEntityRow = { entityKey: "abilities:201", kind: "abilities", nativeId: 201, name: "Cleave", description: null, iconAssetName: null, artwork: [] };
  const all = [...entities, npc("npcs:7", "Wanderer"), npc("npcs:8", "Hermit"), cleave];
  const phases = [{ phaseIndex: 0, name: "Opening", requirement: null, abilities: [{ ability: { entityKey: "abilities:201", label: "Cleave" }, rankIndex: 0 }] }];
  const tree = (id: number, name: string) => ({ owner: "classes:0", linkIndex: id, linkKind: "talentTree" as const, target: { entityKey: `talentTrees:${id}`, label: name } });
  const adventurer = (specialization: NonNullable<CatalogNpcFacts["adventurer"]>["specialization"], keepPhaseAbilities = false, withClass = true): CatalogNpcFacts["adventurer"] => ({
    class: withClass ? { entityKey: "classes:0", label: "Shieldmaster" } : null, race: withClass ? { entityKey: "races:1", label: "Dwarf" } : null, preferredTree: { entityKey: "talentTrees:18", label: "Aegis Mastery" },
    keepPhaseAbilities, aiLogicTemplateKey: null, specialization });
  const specialization = (classKey: string, role: string) => ({ class: { entityKey: classKey, label: classKey }, role, preferredTree: { entityKey: "talentTrees:19", label: "Templar" },
    behaviorName: "", priorityAbilities: [{ entityKey: "abilities:201", label: "Cleave" }], blockedAbilities: [], blockedBonuses: [], allowedForms: [] });
  const strength = [{ stat: { entityKey: "stats:1", label: "Strength" }, amount: 370, isPercent: false }];
  const source: CatalogFacts = { ...facts, entities: all,
    npcs: [
      { ...facts.npcs[0]!, abilityPhases: phases, stats: strength, adventurer: adventurer(specialization("classes:0", "Tank")) },
      // A specialization for another class does not count, so the Dungeon Finder places this adventurer as Damage.
      { ...facts.npcs[0]!, entityKey: "npcs:7", abilityPhases: phases, adventurer: adventurer(specialization("classes:5", "Healer")) },
      // Without a class, an adventurer fights with the phase abilities of its record.
      { ...facts.npcs[0]!, entityKey: "npcs:8", abilityPhases: phases, stats: strength, adventurer: adventurer(null, false, false) },
    ],
    abilities: [{ entityKey: "abilities:201", ranks: [{ rankIndex: 0, lines: [{ spans: [{ text: "Cleave", tone: null, italic: false }] }] }] }],
    progression: { ...facts.progression, offeredClasses: ["classes:0"], links: [tree(18, "Aegis Mastery"), tree(19, "Templar")] },
    adventurerWorld: { arrivals: [
      { adventurer: { entityKey: "npcs:2", label: "Guardian" }, startingLevel: 10, joinAfterHours: 2 },
      { adventurer: { entityKey: "npcs:7", label: "Wanderer" }, startingLevel: 1, joinAfterHours: 0 },
    ] } as unknown as CatalogFacts["adventurerWorld"] };
  const { documents } = project(all, source, relations);
  const shieldmaster = { key: "classes:0", kind: "classes" as const, name: "Shieldmaster", slug: "shieldmaster" };
  const guardian = documents.get("npcs:2") as PublicNpc, wanderer = documents.get("npcs:7") as PublicNpc, hermit = documents.get("npcs:8") as PublicNpc;
  expect(guardian.abilityPhases).toEqual([]);
  // A roster adventurer's stats come from its race and class at its level, so its record's Strength is not shown.
  expect(guardian.facts.stats).toEqual([]);
  expect(hermit.facts.stats.map((row) => row.amount)).toEqual([370]);
  expect(guardian.adventurer).toEqual({ class: shieldmaster, race: { key: null, label: "Dwarf" }, role: "Tank", preferredTree: { ...shieldmaster, name: "Templar", variant: "tree-19" },
    startingLevel: 10, joinAfterHours: 2, priorityAbilities: [{ key: "abilities:201", kind: "abilities", name: "Cleave", slug: "cleave" }] });
  expect(guardian.placedRules).toContainEqual({ target: "adventurer", guide: expect.objectContaining({ key: "mechanics:adventurers" }), section: "roster" });
  expect(wanderer.adventurer).toEqual({ class: shieldmaster, race: { key: null, label: "Dwarf" }, role: "Damage", defaultRole: true, preferredTree: { ...shieldmaster, name: "Aegis Mastery", variant: "tree-18" },
    startingLevel: 1, joinAfterHours: 0, priorityAbilities: [] });
  expect(hermit.adventurer).toBeUndefined();
  expect(hermit.abilityPhases[0]?.abilities[0]?.ability).toMatchObject({ key: "abilities:201" });
  expect((documents.get("abilities:201") as PublicAbility).versions[0]?.usedBy).toEqual([{ key: "npcs:8", kind: "npcs", name: "Hermit", slug: "hermit" }]);
  const registry = PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "npcs")!;
  const rows = buildKindLists({ buildId: "build", catalogId: "catalog" }, [registry], new Map([guardian, wanderer, hermit].map((document) => [document.ref.key, document]))).get("npcs")![0]!.rows;
  expect(rows.map((row) => [row.ref.key, row.facets.class, row.facets.partyRole])).toEqual([["npcs:2", ["Shieldmaster"], ["Tank"]], ["npcs:7", ["Shieldmaster"], ["Damage"]], ["npcs:8", [], []]]);
});
