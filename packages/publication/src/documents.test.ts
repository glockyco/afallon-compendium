import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTaskFacts, CatalogRequirement } from "@afallon/contracts/catalog";
import { STATIC_DOCUMENT_SCHEMA_IDS, type PublicAbility, type PublicDocument, type PublicGearSet, type PublicItem, type PublicNpc, type PublicPlace } from "@afallon/contracts/public";
import { projectPublicDocuments, projectQuestObjective } from "./documents";
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
  return { type: { value: 0, name: type }, rule: { value: 0, name: "Mandatory" }, label, references: { ...emptyRequirementReferences }, knowledge: null, state: null, comparison: null, value: null, ownership: null, itemCondition: null, progression: null, entity: null, pointType: null, dialogueNodeState: null, effectCondition: null, amountType: null, timeType: null, timeValue: null, effectType: null, questState: null, amounts: { primary: 0, secondary: 0, float: 0, isPercent: false }, flags: { consume: false, first: false, second: false, third: false }, subtypes: { ...emptyRequirementSubtypes }, dialogueNode: null, times: [null, null], ...overrides };
}
const equipmentRequirements = [
  { mode: "any" as const, checkCount: true, requiredCount: 1, requirements: [
    requirement("Class", "Shieldmaster", { rule: { value: 1, name: "Optional" }, references: { ...emptyRequirementReferences, class: { entityKey: "classes:0", label: "Shieldmaster" } } }),
    requirement("Class", "Assassin", { rule: { value: 1, name: "Optional" }, references: { ...emptyRequirementReferences, class: { entityKey: "classes:5", label: "Assassin" } } }),
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
    objectiveText: null, levelRequirement: null, experience: null, conditionIds: [] }],
  tasks: [], places: [{ entityKey: "scenes:10", placeType: "dungeon", guideIncluded: true, guideDescription: null, levelRange: null,
    mapSpaceIds: ["world"], bosses: [], parentSceneKey: null }], properties: [], abilities: [], recipes: [],
  gearSets: [{ entityKey: "gearSets:17", members: [{ entityKey: "items:1", label: "Blade" }, { entityKey: null, label: "Item 999" }], tiers: [
    { equipped: 3, stats: [{ stat: { entityKey: "stats:12", label: "Poison Damage" }, amount: 10, isPercent: true }] },
    { equipped: 7, stats: [{ stat: { entityKey: "stats:27", label: "Strength" }, amount: 40, isPercent: false }] },
  ] }],
};

const relations: CatalogRelations = {
  drops: [{ context: "npc", owner: { entityKey: "npcs:2", label: "Guardian" }, item: { entityKey: "items:1", label: "Blade" },
    lootTableId: 4, entryIndex: 0, min: 1, max: 2, rawRate: 0.125, displayedChance: 12.5, levelBand: null, conditionIds: [], placementIds: ["p1"] }],
  vendors: [],
  gathers: [
    { producerLabel: "Iron node", sourceId: "source-1", sceneNativeId: 10, resource: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p1"] },
    { producerLabel: "Iron node", sourceId: "source-2", sceneNativeId: 10, resource: null, item: { entityKey: "items:1", label: "Blade" }, skill: null, rank: null, min: 1, max: 2, rawRate: 25, conditionIds: [], placementIds: ["p2"] },
  ],
  containers: [
    { containerType: "Chest", sourceId: "container-1", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, conditionIds: [], placementIds: ["p1"] },
    { containerType: "Chest", sourceId: "container-2", place: { entityKey: "scenes:10", label: "Crypt" }, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, conditionIds: [], placementIds: ["p2"] },
  ], quests: [], recipes: [],
  placements: [{ placementId: "p1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Guardian", roles: [{ role: "boss", npcEntityKey: "npcs:2", scope: "authored" }], families: [] }],
  transitions: [{ transitionId: "transition-1", sourceSceneKey: "scenes:10", destinationSceneKey: null, transitionKind: "entrance", placementIds: ["p2"] }],
  conditions: [{ conditionId: "oathbreaker", semantics: "equipment", scope: "equipment", label: "Requirements", requirements: equipmentRequirements }],
};

test("projects one symmetric boss drop row and strips native rich text", () => {
  const refs = buildEntityReferences(entities, { facts, relations });
  const documents = projectPublicDocuments({ entities, facts, relations, refs, resolve: createReferenceResolver(refs), artByEntity: new Map(),
    placements: new Map([
      ["p1", { placementId: "p1", mapSpaceId: "world", label: "World" }],
      ["p2", { placementId: "p2", mapSpaceId: "world", label: "World" }],
    ]), regionIdsByMapSpace: new Map([["world", ["region-1"]]]) });
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
  expect(item.facts.equipmentRequirements).toMatchObject([
    { mode: "any", checkCount: true, requiredCount: 1, requirements: [
      { type: { name: "Class" }, label: "Shieldmaster", references: { class: { key: "classes:0", kind: "classes", name: "Shieldmaster" } } },
      { type: { name: "Class" }, label: "Assassin", references: { class: { key: "classes:5", kind: "classes", name: "Assassin" } } },
    ] },
    { mode: "all", checkCount: false, requirements: [{ type: { name: "Level" }, label: "Level 27", amounts: { primary: 27 } }] },
  ]);
  expect(item.facts.useLines).toEqual([{ spans: [{ text: "Use: Test", tone: "positive", italic: false }] }]);
  const itemList = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("items")?.[0];
  const itemRow = itemList?.rows.find((row) => row.ref.key === "items:1");
  expect(itemRow).toMatchObject({ values: { slot: "MAIN HAND", itemPower: 99 }, facets: { slot: ["MAIN HAND"] } });
  expect(itemRow?.values.damagePerSecond as number).toBeCloseTo(55.27777777777778);
  expect(PUBLIC_KIND_REGISTRY.find((entry) => entry.kind === "items")?.columns).toEqual(expect.arrayContaining([
    { id: "itemPower", label: "Item power", sortable: true, numeric: true },
    { id: "damagePerSecond", label: "Damage per second", sortable: true, numeric: true },
  ]));
  expect(npc.facts).not.toHaveProperty("species");
  expect(npc.facts.lootSpecialization).toEqual({ armorType: "PLATE", weaponTypes: ["AXE", "Shield"], stat: { key: "stats:5", kind: "stats", name: "Loot stat" } });
  expect(item.droppedBy).toHaveLength(1);
  expect(npc.drops).toHaveLength(1);
  const { counterpart: itemCounterpart, ...itemValues } = item.droppedBy[0]!;
  const { counterpart: npcCounterpart, ...npcValues } = npc.drops[0]!;
  expect(itemCounterpart).toMatchObject({ key: "npcs:2" });
  expect(npcCounterpart).toMatchObject({ key: "items:1" });
  expect(itemValues).toEqual(npcValues);
  expect(itemValues).toMatchObject({ min: 1, max: 2, chance: 12.5 });
  expect(itemValues).not.toHaveProperty("placements");
  expect(item.gatheredFrom).toEqual([{ label: "Iron node", min: 1, max: 2, chance: 25, placementCount: 2 }]);
  expect(item.inContainers).toEqual([{ counterpart: { key: "scenes:10", kind: "places", name: "Crypt", slug: "crypt" },
    label: "Chest", min: 1, max: 1, requirements: [], placementCount: 2 }]);
  expect(item).not.toHaveProperty("locations");
  expect(npc.locations).toEqual([{ placementId: "p1", mapSpaceId: "world", label: "World" }]);
  expect(place).not.toHaveProperty("locations");
  expect(place.space).toEqual({ mapSpaceId: "world", regionIds: ["region-1"] });
  expect(place.creatures).toMatchObject([{ counterpart: { key: "npcs:2" }, placementCount: 1 }]);
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
  const tooltipRefs = buildEntityReferences(tooltipFacts.entities, { facts: tooltipFacts, relations });
  const documents = projectPublicDocuments({ entities: tooltipFacts.entities, facts: tooltipFacts, relations, refs: tooltipRefs, resolve: createReferenceResolver(tooltipRefs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map() });

  expect((documents.get("items:101") as PublicItem).facts).toMatchObject({
    useLines: line("Restores 120 health."), actionAbilities: [{ ability: { key: "abilities:202", name: "Healing potion" }, rankIndex: 3 }],
  });
  expect((documents.get("items:102") as PublicItem).facts.useLines).toEqual(line("Increases weapon damage."));
  expect((documents.get("items:103") as PublicItem).facts.stats).toEqual([{ stat: { key: "stats:104", kind: "stats", name: "Lifesteal" }, amount: 2, isPercent: true }]);
  expect((documents.get("npcs:2") as PublicNpc).abilityPhases[0]?.abilities).toEqual([{ ability: { key: "abilities:201", kind: "abilities", name: "Cleave", slug: "cleave" }, rankIndex: 0 }]);
  const cleave = documents.get("abilities:201") as PublicAbility;
  const healingPotion = documents.get("abilities:202") as PublicAbility;
  expect(cleave.facts.ranks).toEqual([{ rankIndex: 0, lines: line("Cleave rank zero") }]);
  expect(cleave.usedBy).toEqual([{ key: "npcs:2", kind: "npcs", name: "Guardian", slug: "guardian" }]);
  expect(cleave.taughtBy).toEqual([]);
  expect(healingPotion.facts.ranks.map((rank) => rank.rankIndex)).toEqual([0, 1, 2, 3]);
  expect(healingPotion.usedBy).toEqual([]);
  expect(healingPotion.taughtBy).toEqual([{ key: "items:101", kind: "items", name: "Minor health potion", slug: "minor-health-potion" }]);

  const schemaIds = new Map<string, string>([...documents].map(([key, document]) => [key, STATIC_DOCUMENT_SCHEMA_IDS[document.ref.kind as keyof typeof STATIC_DOCUMENT_SCHEMA_IDS]]));
  expect(auditPublicTooltipCoverage(tooltipFacts, relations, documents, schemaIds)).toEqual([]);
  const unrelatedRelations: CatalogRelations = { ...relations, conditions: [...relations.conditions, { ...relations.conditions[0]!, conditionId: 'unrelated', scope: null }] };
  expect(auditPublicTooltipCoverage(tooltipFacts, unrelatedRelations, documents, schemaIds)).toEqual([]);

  const missingRank = new Map(documents);
  missingRank.set("abilities:202", { ...healingPotion, facts: { ranks: healingPotion.facts.ranks.slice(0, -1) } } as PublicDocument);
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
  expect(mixedSchemaIssues).toContain("Document items:101 uses schema compendium.static-item.v1; expected compendium.static-item.v2.");
  expect(() => assertCompleteTooltipCoverage(true, mixedSchemaIssues)).toThrow("Document items:101 uses schema compendium.static-item.v1; expected compendium.static-item.v2.");
  expect(() => assertCompleteTooltipCoverage(false, mixedSchemaIssues)).not.toThrow();

  const changedUseText = new Map(documents);
  const minorPotion = changedUseText.get("items:101") as PublicItem;
  changedUseText.set("items:101", { ...minorPotion, facts: { ...minorPotion.facts, useLines: [] } });
  expect(auditPublicTooltipCoverage(tooltipFacts, relations, changedUseText, schemaIds)).toContain("Item items:101 changed its native use-text block.");
});

test("publishes a gear set's members and tiers and names the set on its member item", () => {
  const refs = buildEntityReferences(entities, { facts, relations });
  const documents = projectPublicDocuments({ entities, facts, relations, refs, resolve: createReferenceResolver(refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map() });
  const set = documents.get("gearSets:17") as PublicGearSet, item = documents.get("items:1") as PublicItem;
  expect(set.ref).toMatchObject({ kind: "gearSets", name: "Adept Leather", slug: "adept-leather" });
  expect(set.facts.memberCount).toBe(2);
  expect(set.members).toEqual([{ key: "items:1", kind: "items", name: "Oathbreaker's Edge", slug: "oathbreakers-edge" }, { key: null, label: "Item 999" }]);
  expect(set.tiers).toEqual([
    { equipped: 3, stats: [{ stat: { key: "stats:12", kind: "stats", name: "Poison Damage" }, amount: 10, isPercent: true }] },
    { equipped: 7, stats: [{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amount: 40, isPercent: false }] },
  ]);
  expect(item.facts.gearSet).toEqual({ key: "gearSets:17", kind: "gearSets", name: "Adept Leather", slug: "adept-leather" });
  const setList = buildKindLists({ buildId: "build", catalogId: "catalog" }, PUBLIC_KIND_REGISTRY, documents).get("gearSets")?.[0];
  expect(setList?.rows).toEqual([{ ref: set.ref, values: { memberCount: 2, tierCount: 2 }, facets: { memberCount: ["2"], tierCount: ["2"] } }]);
});

test("projects only the armor branch when native weapon defaults remain", () => {
  const armorFacts: CatalogFacts = { ...facts, items: [{ ...facts.items[0]!, itemType: "ARMOR", armorSlot: "GLOVES", armorType: "LEATHER" }] };
  const refs = buildEntityReferences(entities, { facts: armorFacts, relations });
  const documents = projectPublicDocuments({ entities, facts: armorFacts, relations, refs, resolve: createReferenceResolver(refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map() });
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
  const refs = buildEntityReferences(entities), resolve = createReferenceResolver(refs);
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
  expect(tasks.map((task, index) => projectQuestObjective(task, resolve, index).type)).toEqual([
    "killNpc", "getItem", "talkToNpc", "enterScene", "enterRegion", "useItem", "learnAbility", "unsupported",
  ]);
  expect(projectQuestObjective(tasks.at(-1)!, resolve, 7)).toMatchObject({ type: "unsupported", rawType: "dance" });
});
