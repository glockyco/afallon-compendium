import { expect, test } from "bun:test";
import type { CatalogEntityRow, CatalogFacts, CatalogRelations, CatalogTaskFacts } from "@afallon/contracts/catalog";
import type { PublicGearSet, PublicItem, PublicNpc, PublicPlace } from "@afallon/contracts/public";
import { projectPublicDocuments, projectQuestObjective } from "./documents";
import { PUBLIC_KIND_REGISTRY } from "./kind-registry";
import { buildKindLists } from "./lists";
import { buildEntityReferences, createReferenceResolver } from "./references";

const entities: CatalogEntityRow[] = [
  { entityKey: "items:1", kind: "items", nativeId: 1, name: "<color=red>Blade</color>", description: "<b>Sharp</b><br>Steel", iconAssetName: null, artwork: [] },
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

const facts: CatalogFacts = {
  entities,
  items: [{ entityKey: "items:1", rarity: "Rare", itemType: "WEAPON", armorSlot: "BELT", weaponSlot: "MAIN HAND", weaponType: "One handed sword", armorType: "CLOTH",
    attackSpeed: 1.8, minDamage: 75, maxDamage: 124, stats: [
      { stat: { entityKey: "stats:53", label: "Item power" }, amount: 99, isPercent: false },
      { stat: { entityKey: "stats:27", label: "Strength" }, amount: 42, isPercent: false },
    ], randomStatsMax: 0, randomStats: [], sockets: [], gem: null, enchantment: { entityKey: null, label: "Enchantment -1" }, sellPrice: null,
    sellCurrency: null, buyPrice: 0, buyCurrency: { entityKey: null, label: "Currency -1" }, stackLimit: 1, questDropOnly: false, corruptionToken: false,
    levelRequirement: 2, actionAbilities: [], conditionIds: ["oathbreaker"], gearSet: { entityKey: "gearSets:17", label: "Adept Leather" } }],
  npcs: [{ entityKey: "npcs:2", minLevel: 5, maxLevel: 5, scalesWithPlayer: false, npcType: "Enemy", creatureType: null, family: null,
    faction: null, species: { entityKey: null, label: "Species -1" }, isMerchant: false, isQuestGiver: false, isCombatEnabled: true, minRespawn: null, maxRespawn: null,
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
    { containerLabel: "Chest", sourceId: "container-1", sceneNativeId: 10, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, conditionIds: [], placementIds: ["p1"] },
    { containerLabel: "Chest", sourceId: "container-2", sceneNativeId: 10, item: { entityKey: "items:1", label: "Blade" }, min: 1, max: 1, rawRate: null, conditionIds: [], placementIds: ["p2"] },
  ], quests: [], recipes: [],
  placements: [{ placementId: "p1", sceneNativeId: 10, sceneKey: "scenes:10", mapSpaceId: "world", label: "Guardian", roles: [{ role: "boss", npcEntityKey: "npcs:2", scope: "authored" }], families: [] }],
  transitions: [{ transitionId: "transition-1", sourceSceneKey: "scenes:10", destinationSceneKey: null, transitionKind: "entrance", placementIds: ["p2"] }],
  conditions: [{ conditionId: "oathbreaker", semantics: "equipment", label: "Requirements", requirements: [
    { mode: "any", requiredCount: 1, requirements: [
      { type: "class", label: "Shieldmaster", target: { entityKey: "classes:0", label: "Shieldmaster" }, amount: null, secondaryAmount: null },
      { type: "class", label: "Assassin", target: { entityKey: "classes:5", label: "Assassin" }, amount: null, secondaryAmount: null },
    ] },
    { mode: "all", requiredCount: null, requirements: [
      { type: "level", label: "Level 27", target: null, amount: 27, secondaryAmount: null },
    ] },
  ] }],
};

test("projects one symmetric boss drop row and strips native rich text", () => {
  const refs = buildEntityReferences(entities, { facts, relations });
  const documents = projectPublicDocuments({ entities, facts, relations, refs, resolve: createReferenceResolver(refs), artByEntity: new Map(),
    placements: new Map([
      ["p1", { placementId: "p1", mapSpaceId: "world", label: "World" }],
      ["p2", { placementId: "p2", mapSpaceId: "world", label: "World" }],
    ]), regionIdsByMapSpace: new Map([["world", ["region-1"]]]) });
  const item = documents.get("items:1") as PublicItem, npc = documents.get("npcs:2") as PublicNpc, place = documents.get("scenes:10") as PublicPlace;
  expect(item.ref.name).toBe("Blade");
  expect(item.description).toBe("Sharp\nSteel");
  expect(item.facts).toMatchObject({ weaponSlot: "MAIN HAND", weaponType: "One handed sword", attackSpeed: 1.8, minDamage: 75, maxDamage: 124,
    itemPower: 99 });
  expect(item.facts.damagePerSecond).toBeCloseTo(55.27777777777778);
  expect(item.facts.stats).toEqual([{ stat: { key: "stats:27", kind: "stats", name: "Strength" }, amount: 42, isPercent: false }]);
  expect(item.facts).not.toHaveProperty("slot");
  expect(item.facts).not.toHaveProperty("armorType");
  expect(item.facts).not.toHaveProperty("enchantment");
  expect(item.facts).not.toHaveProperty("buyPrice");
  expect(item.facts.requirements).toEqual([
    { mode: "any", requiredCount: 1, requirements: [
      { type: "class", label: "Shieldmaster", target: { key: "classes:0", kind: "classes", name: "Shieldmaster" } },
      { type: "class", label: "Assassin", target: { key: "classes:5", kind: "classes", name: "Assassin" } },
    ] },
    { mode: "all", requirements: [{ type: "level", label: "Level 27", amount: 27 }] },
  ]);
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
  expect(item.inContainers).toEqual([{ label: "Chest", min: 1, max: 1, requirements: [], placementCount: 2 }]);
  expect(item).not.toHaveProperty("locations");
  expect(npc.locations).toEqual([{ placementId: "p1", mapSpaceId: "world", label: "World" }]);
  expect(place).not.toHaveProperty("locations");
  expect(place.space).toEqual({ mapSpaceId: "world", regionIds: ["region-1"] });
  expect(place.creatures).toMatchObject([{ counterpart: { key: "npcs:2" }, placementCount: 1 }]);
});

test("publishes a gear set's members and tiers and names the set on its member item", () => {
  const refs = buildEntityReferences(entities, { facts, relations });
  const documents = projectPublicDocuments({ entities, facts, relations, refs, resolve: createReferenceResolver(refs), artByEntity: new Map(), placements: new Map(), regionIdsByMapSpace: new Map() });
  const set = documents.get("gearSets:17") as PublicGearSet, item = documents.get("items:1") as PublicItem;
  expect(set.ref).toMatchObject({ kind: "gearSets", name: "Adept Leather", slug: "adept-leather" });
  expect(set.facts.memberCount).toBe(2);
  expect(set.members).toEqual([{ key: "items:1", kind: "items", name: "Blade", slug: "blade" }, { key: null, label: "Item 999" }]);
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
