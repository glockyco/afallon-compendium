import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTaskFacts, CatalogRequirement, CatalogQuestRow } from "@afallon/contracts/catalog";
import { STATIC_DOCUMENT_SCHEMA_IDS, type PublicAbility, type PublicDocument, type PublicItem, type PublicNpc, type PublicPlace, type PublicQuest } from "@afallon/contracts/public";
import { projectPublicDocuments, projectQuestObjective, type DocumentProjectionInput } from "./documents";
import { assertCompleteTooltipCoverage, auditPublicTooltipCoverage } from "./tooltip-coverage";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";

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
  items: [{ entityKey: "items:1", rarity: "Rare", itemType: "WEAPON", armorSlot: "BELT", weaponSlot: "MAIN HAND", weaponType: "One handed sword", armorType: "CLOTH",
    attackSpeed: 1.8, minDamage: 75, maxDamage: 124, stats: [
      { stat: { entityKey: "stats:53", label: "Item power" }, amount: 99, isPercent: false },
      { stat: { entityKey: "stats:27", label: "Strength" }, amount: 42, isPercent: false },
    ], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: { entityKey: null, label: "Enchantment -1" }, sellPrice: null,
    sellCurrency: null, buyPrice: 0, buyCurrency: { entityKey: null, label: "Currency -1" }, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    equipmentRequirements, useConditions: [], actionAbilities: [], useLines: [{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }], conditionIds: ["oathbreaker"], gearSet: { entityKey: "gearSets:17", label: "Adept Leather" } }],
  npcs: [{ entityKey: "npcs:2", minLevel: 5, maxLevel: 5, scalesWithPlayer: false, npcType: "Enemy", creatureType: null, family: null,
    faction: null, species: { entityKey: null, label: "Species -1" }, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null,
    minExperience: null, maxExperience: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [],
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
    { producerLabel: "Iron node", sourceId: "source-1", sceneNativeId: 10, resource: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p1"] },
    { producerLabel: "Iron node", sourceId: "source-2", sceneNativeId: 10, resource: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p2"] },
  ],
  containers: [
    { containerType: "Chest", sourceId: "container-1", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, availability: [], placementIds: ["p1"] },
    { containerType: "Chest", sourceId: "container-2", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, availability: [], placementIds: ["p2"] },
  ], interactions: [], quests: [], recipes: [],
  placements: [{ placementId: "p1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Guardian", area: null, roles: [{ role: "boss", npcEntityKey: "npcs:2", scope: "authored" }], families: [], randomChoices: [] }],
  transitions: [{ transitionId: "transition-1", sourceSceneKey: "scenes:10", destinationSceneKey: null, transitionKind: "entrance", placementIds: ["p2"] }],
  conditions: [{ conditionId: "oathbreaker", semantics: "equipment", scope: "equipment", label: "Requirements", requirements: equipmentRequirements }], gatedSources: [],
};

function project(projectEntities: CatalogEntityRow[], projectFacts: CatalogFacts, projectRelations: CatalogRelations, placements: DocumentProjectionInput["placements"] = new Map(), regionIdsByMapSpace: DocumentProjectionInput["regionIdsByMapSpace"] = new Map(), npcLevels: DocumentProjectionInput["npcLevels"] = new Map()) {
  const references = buildEntityReferences(projectEntities, { facts: projectFacts, relations: projectRelations });
  const documents = projectPublicDocuments({ entities: projectEntities, facts: projectFacts, relations: projectRelations, references, resolve: createReferenceResolver(references.refs), artByEntity: new Map(), placements, regionIdsByMapSpace, npcLevels, placementIdsByKey: new Map() });
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
  expect(item.facts.equipmentRequirements).toEqual([
    { mode: "any", checkCount: true, requiredCount: 1, requirements: [
      { type: { value: 0, name: "Class" }, rule: { value: 1, name: "Optional" }, label: "Shieldmaster", spans: [{ ref: { key: "classes:0", kind: "classes", name: "Shieldmaster" } }] },
      { type: { value: 0, name: "Class" }, rule: { value: 1, name: "Optional" }, label: "Assassin", spans: [{ ref: { key: "classes:5", kind: "classes", name: "Assassin" } }] },
    ] },
    { mode: "all", checkCount: false, requirements: [{ type: { value: 13, name: "Level" }, rule: { value: 0, name: "Mandatory" }, label: "Level 27", spans: [{ text: "Level 27" }] }] },
  ]);
  expect(item.facts.useLines).toEqual([{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }]);
  const itemList = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("items")?.[0];
  const itemRow = itemList?.rows.find((row) => row.ref.key === "items:1");
  expect(itemRow).toMatchObject({ values: { slot: "MAIN HAND", itemPower: 99, levelRequirement: 27 }, facets: { slot: ["MAIN HAND"] } });
  expect(itemRow?.values.damagePerSecond as number).toBeCloseTo(55.27777777777778);
  expect(PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "items")?.columns).toEqual(expect.arrayContaining([
    { id: "itemPower", label: "Item power", sortable: true, numeric: true },
    { id: "damagePerSecond", label: "Damage per second", sortable: true, numeric: true },
  ]));
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
  expect(item.gatheredFrom).toEqual([{ label: "Iron Node", min: 1, max: 2, chance: 25, placementCount: 2 }]);
  expect(item.inContainers).toEqual([{ counterpart: { key: "scenes:10", kind: "places", name: "Crypt", slug: "crypt" },
    label: "Chest", min: 1, max: 1, availability: [], placementCount: 2 }]);
  expect(item).not.toHaveProperty("locations");
  expect(npc.locations).toEqual([{ label: "World", placements: [{ placementId: "p1", mapSpaceId: "world", label: "World" }], availability: [], variants: ["n2"], roles: ["boss"], quests: [] }]);
  expect(place).not.toHaveProperty("locations");
  expect(place.space).toEqual({ mapSpaceId: "world", regionIds: ["region-1"] });
  expect(place.creatures).toMatchObject([{ counterpart: { key: "npcs:2" }, placementCount: 1 }]);
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
      { ...baseItem, entityKey: "items:101", stats: [], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: line("Restores 120 health."), actionAbilities: [{ ability: { entityKey: "abilities:202", label: "Healing potion" }, rankIndex: 3 }] },
      { ...baseItem, entityKey: "items:102", stats: [], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: line("Increases weapon damage."), actionAbilities: [] },
      { ...baseItem, entityKey: "items:103", stats: [{ stat: { entityKey: "stats:104", label: "Lifesteal" }, amount: 2, isPercent: true }], equipmentRequirements: [], conditionIds: [], gearSet: null, useLines: [], actionAbilities: [] },
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
  expect((documents.get("items:102") as PublicItem).facts.useLines).toEqual(line("Increases weapon damage."));
  expect((documents.get("items:103") as PublicItem).facts.stats).toEqual([{ stat: { key: "stats:104", kind: "stats", name: "Lifesteal" }, amount: 2, isPercent: true }]);
  expect((documents.get("npcs:2") as PublicNpc).abilityPhases[0]?.abilities).toEqual([{ ability: { key: "abilities:201", kind: "abilities", name: "Cleave", slug: "cleave" }, rankIndex: 0 }]);
  const cleave = documents.get("abilities:201") as PublicAbility;
  const healingPotion = documents.get("abilities:202") as PublicAbility;
  expect(cleave.versions).toEqual([{ keys: ["abilities:201"], anchor: "n201", ranks: [{ rankIndex: 0, lines: line("Cleave rank zero") }], usedBy: [{ key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }], taughtBy: [] }]);
  expect(healingPotion.versions[0]!.ranks.map((rank) => rank.rankIndex)).toEqual([0, 1, 2, 3]);
  expect(healingPotion.versions[0]!.usedBy).toEqual([]);
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
  expect(mixedSchemaIssues).toContain("Document items:101 uses schema compendium.static-item.v1; expected compendium.static-item.v4.");
  expect(() => assertCompleteTooltipCoverage(true, mixedSchemaIssues)).toThrow("Document items:101 uses schema compendium.static-item.v1; expected compendium.static-item.v4.");
  expect(() => assertCompleteTooltipCoverage(false, mixedSchemaIssues)).not.toThrow();

  const changedUseText = new Map(documents);
  const minorPotion = changedUseText.get("items:101") as PublicItem;
  changedUseText.set("items:101", { ...minorPotion, facts: { ...minorPotion.facts, useLines: [] } });
  expect(auditPublicTooltipCoverage(tooltipFacts, relations, changedUseText, schemaIds)).toContain("Item items:101 changed its native use-text block.");
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
    values: { slot: "GLOVES", itemPower: 99, damagePerSecond: null }, facets: { slot: ["GLOVES"] },
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
  expect(item.inContainers).toMatchObject([{ availability: [{ effect: "requires" }], placementCount: 1 }]);
  expect(item.collectedFrom).toMatchObject([{ label: "Egg Cluster", counterpart: { key: "scenes:10" }, min: 2, max: 3, chance: 30,
    availability: [{ effect: "requires" }], placementCount: 1 }]);
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
  const placements = new Map(["day-a", "day-b", "night"].map((placementId) => [placementId, { placementId, mapSpaceId: "world", label: "Lake Thaldrin", categories: ["townsfolk" as const] }] as const));
  const level = { min: 15, max: 30, scales: true };
  const { documents } = project(scenarioEntities, scenarioFacts, scenarioRelations, placements, new Map([["world", []]]),
    new Map([["day-a", new Map([["npcs:206", level]])], ["day-b", new Map([["npcs:234", level]])], ["night", new Map([["npcs:225", level]])]]));
  const npc = documents.get("npcs:206") as PublicNpc;
  expect(documents.has("npcs:225")).toBe(false);
  expect(npc.ref).toMatchObject({ name: "Fenric Doryn", slug: "fenric-doryn" });
  expect(npc.variantFields).toEqual([]);
  expect(npc.locations.map(({ placements: spots, variants, availability, alternative }) => ({ placements: spots.map((row) => row.placementId), variants, rules: availability.length, alternative })))
    .toEqual([
      { placements: ["day-a", "day-b"], variants: ["n206", "n234"], rules: 0, alternative: { chance: 66.7, options: 2 } },
      { placements: ["night"], variants: ["n225"], rules: 1, alternative: undefined },
    ]);
  expect(npc.facts.level).toEqual(level);
  expect(npc.drops.map((row) => [row.counterpart.key, row.variants])).toEqual([["items:1", undefined], ["items:7", ["n234"]]]);
  expect((documents.get("items:1") as PublicItem).droppedBy.map((row) => row.counterpart)).toContainEqual(expect.objectContaining({ key: "npcs:206", name: "Fenric Doryn", slug: "fenric-doryn" }));
  expect((documents.get("items:1") as PublicItem).droppedBy.some((row) => "variant" in row.counterpart)).toBe(false);
});
