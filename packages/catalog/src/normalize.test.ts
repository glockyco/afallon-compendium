import { expect, test } from "bun:test";
import type { NormalizedDatabaseInput, NormalizedEntity } from "@afallon/contracts/catalog";
import { collectTypedFacts, entityGameplay } from "./normalize";
import { classifyItemCondition } from "./conditions";
import type { AdmittedCatalog } from "./evidence";
import type { Blocker } from "./context";
import { questMinimumLevel } from "./decoders";

const reference = { path: "objects/support.json", sha256: "a".repeat(64) };
const emptyAdventurerWorld = { asset: "AdventurerWorld", instanceCount: 1, roster: [], arrivals: [], equipmentBands: [], equipmentRewardChance: 0, equipmentRewards: [], kitUpgrades: [] };

function entity(kind: string, nativeId: number, name: string): NormalizedEntity {
  return { entityKey: `${kind}:${nativeId}`, buildId: "build", kind, nativeId, name, internalName: null, description: null, sourceKey: nativeId, publicData: { localization: null, gameplay: null, icon: null }, provenance: [reference] };
}

// `collectTypedFacts` reads only these families for a gear set, so the fixture carries them and
// nothing else. The cast keeps the fixture to the fields the path under test consults.
function admitted(gearSetGameplay: unknown): AdmittedCatalog {
  return {
    canonical: { value: { items: [], npcs: [], quests: [], scenes: [], regions: [], properties: [], stats: [{ nativeId: 126, gameplay: { isPercentStat: true } }] }, reference },
    relationships: { value: { tasks: [], adventurerWorldSettings: emptyAdventurerWorld }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: { gearSets: [{ sourceKey: 17, entry: { nativeId: 17, name: "Adept Leather", internalName: "Adept Leather" }, gameplay: gearSetGameplay }] } }, reference },
    artwork: { value: { records: [] }, reference },
  } as unknown as AdmittedCatalog;
}

function admittedNpc(npcGameplay: unknown): AdmittedCatalog {
  return {
    canonical: { value: { items: [], npcs: [{ nativeId: 399, gameplay: npcGameplay }], quests: [], scenes: [], regions: [], properties: [], stats: [] }, reference },
    relationships: { value: { tasks: [], adventurerWorldSettings: emptyAdventurerWorld }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: {} }, reference },
    artwork: { value: { records: [] }, reference },
    sceneCatalog: { value: {
      schemaVersion: "compendium.scene-catalog.v1", buildId: "build",
      scenes: [{ sourceKey: 47, nativeId: 47, entryName: "Coalway outdoors", displayName: "Coalway outdoors", sourceFieldPath: "scenes[47]", state: "matched", buildMatches: [{ buildIndex: 0, path: "Assets/SCENES/Coalway outdoors.unity" }] }],
      buildScenes: [{ buildIndex: 0, path: "Assets/SCENES/Coalway outdoors.unity", pathError: null, nativeIds: [47] }],
      summary: { databaseScenes: 1, matchedScenes: 1, unmatchedScenes: 0, ambiguousScenes: 0, unavailableScenes: 0, buildScenes: 1, unclaimedBuildScenes: 0, sharedBuildScenes: 0 },
    }, reference },
    profile: {
      schemaVersion: "compendium.map-space-profile.v2", buildId: "build", mapSpaces: [{ id: "world-surface", label: "World surface" }],
      bindings: [{ id: "world-surface", mapSpaceId: "world-surface", sceneNativeId: 47, scenePath: "Assets/SCENES/Coalway outdoors.unity", frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } }, domain: { kind: "scene" }, evidence: [{ path: "review.json", sha256: "a".repeat(64), pointer: "" }] }],
    },
  } as unknown as AdmittedCatalog;
}

const itemGameplay = (value: Record<string, unknown>) => ({
  actionAbilities: [],
  gameActions: { useTemplateFlag: false, template: null, available: true, actions: [] },
  nativeUseTooltip: { generator: "ConsumableTooltip.Build(RPGItem, false)", includeHint: false, succeeded: true, text: null, error: null },
  ...value,
});

function admittedItems(items: Array<{ nativeId: number; gameplay: unknown }>, stats: Array<{ nativeId: number; gameplay: { isPercentStat: boolean } }> = []): AdmittedCatalog {
  return {
    canonical: { value: { items, npcs: [], quests: [], scenes: [], regions: [], properties: [], stats }, reference },
    relationships: { value: { tasks: [], adventurerWorldSettings: emptyAdventurerWorld }, reference },
    lootRules: { value: { itemLevels: [] }, reference },
    support: { value: { tables: {} }, reference },
    artwork: { value: { records: [] }, reference },
  } as unknown as AdmittedCatalog;
}

const gameplay = {
  itemsInSet: [{ sourceIndex: 0, itemId: 538 }, { sourceIndex: 1, itemId: 539 }],
  gearSetTiers: [
    { tierIndex: 0, equippedAmount: 3, stats: [{ sourceIndex: 0, statId: 12, amount: 10, isPercent: true }, { sourceIndex: 1, statId: 126, amount: 10, isPercent: false }] },
    { tierIndex: 1, equippedAmount: 7, stats: [{ sourceIndex: 0, statId: 0, amount: 200, isPercent: false }] },
  ],
};

test("resolves every gear set member and tier stat to its entity", () => {
  const entities = [entity("gearSets", 17, "Adept Leather"), entity("items", 538, "Adept Leather belt"), entity("items", 539, "Adept Leather boots"), entity("stats", 12, "Poison Damage"), entity("stats", 126, "Dodge chance"), entity("stats", 0, "Health")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admitted(gameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(blockers).toEqual([]);
  expect(rows.gearSetFacts).toEqual([{ entityKey: "gearSets:17", provenance: [{ ...reference, pointer: "/tables/gearSets/0" }] }]);
  expect(rows.gearSetMembers.map((row) => [row.memberIndex, row.item])).toEqual([
    [0, { entityKey: "items:538", label: "Adept Leather belt" }],
    [1, { entityKey: "items:539", label: "Adept Leather boots" }],
  ]);
  expect(rows.gearSetTiers.map((row) => [row.tierIndex, row.equipped])).toEqual([[0, 3], [1, 7]]);
  expect(rows.gearSetTierStats.map((row) => [row.tierIndex, row.stat.label, row.amount, row.isPercent])).toEqual([
    [0, "Poison Damage", 10, true],
    [0, "Dodge chance", 10, true],
    [1, "Health", 200, false],
  ]);
});

test("keeps only equipment fields that apply to each item type", () => {
  const available = (name: string) => ({ available: true, name });
  const items = [
    { nativeId: 1175, gameplay: itemGameplay({ itemType: available("WEAPON"), rarity: available("Rare"), armorSlot: available("BELT"), armorType: available("CLOTH"), weaponSlot: available("Ranged"), weaponType: available("Crossbow"), weaponDamageType: { available: true, nativeId: 7, name: "Fire" }, attackMode: "Ranged", physicalLabel: "Piercing" }) },
    { nativeId: 1177, gameplay: itemGameplay({ itemType: available("Trinket"), rarity: available("Rare"), armorSlot: available("Trinket"), armorType: available("JEWELRY"), weaponSlot: { available: false }, weaponType: { available: false }, weaponDamageType: { available: false }, attackMode: "Melee", physicalLabel: "Bludgeoning" }) },
  ];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admittedItems(items), [entity("items", 1175, "Fenfoot's Hivecleaver"), entity("items", 1177, "Knotted Rootguard")], [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(blockers).toEqual([]);
  expect(rows.itemFacts.map(({ itemType, armorSlot, armorType, weaponSlot, weaponType, weaponDamageType, attackMode, physicalLabel }) => ({ itemType, armorSlot, armorType, weaponSlot, weaponType, weaponDamageType, attackMode, physicalLabel }))).toEqual([
    { itemType: "WEAPON", armorSlot: null, armorType: null, weaponSlot: "Ranged", weaponType: "Crossbow", weaponDamageType: "Fire", attackMode: "Ranged", physicalLabel: "Piercing" },
    { itemType: "Trinket", armorSlot: "Trinket", armorType: "JEWELRY", weaponSlot: null, weaponType: null, weaponDamageType: null, attackMode: null, physicalLabel: null },
  ]);
});

test("resolves adventurer arrivals, equipment, and kit upgrades by their authored positions", () => {
  const evidence = admittedItems([]);
  evidence.relationships.value.adventurerWorldSettings = {
    asset: "AdventurerWorld", instanceCount: 1, roster: [3],
    arrivals: [{ npcId: 3, startingLevel: 7, joinAfterHours: 12 }],
    equipmentBands: [{ itemId: 1, minimumContentLevel: 9 }],
    equipmentRewardChance: 0.25, equipmentRewards: [2],
    kitUpgrades: [{ id: "tank", npcId: 3, itemIds: [1, 2] }],
  };
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(evidence, [entity("npcs", 3, "Shieldmaster"), entity("items", 1, "Helm"), entity("items", 2, "Shield")], [], [], blockers);
  expect(blockers).toEqual([]);
  expect(rows.adventurerWorld.links.map(({ kind, position, itemPosition, kitId, npc, item, startingLevel, joinAfterHours, minimumContentLevel }) => ({
    kind, position, itemPosition, kitId, npc: npc?.entityKey, item: item?.entityKey, startingLevel, joinAfterHours, minimumContentLevel,
  }))).toEqual([
    { kind: "roster", position: 0, itemPosition: 0, kitId: null, npc: "npcs:3", item: undefined, startingLevel: null, joinAfterHours: null, minimumContentLevel: null },
    { kind: "arrival", position: 0, itemPosition: 0, kitId: null, npc: "npcs:3", item: undefined, startingLevel: 7, joinAfterHours: 12, minimumContentLevel: null },
    { kind: "equipmentBand", position: 0, itemPosition: 0, kitId: null, npc: undefined, item: "items:1", startingLevel: null, joinAfterHours: null, minimumContentLevel: 9 },
    { kind: "equipmentReward", position: 0, itemPosition: 0, kitId: null, npc: undefined, item: "items:2", startingLevel: null, joinAfterHours: null, minimumContentLevel: null },
    { kind: "kitUpgrade", position: 0, itemPosition: 0, kitId: "tank", npc: "npcs:3", item: undefined, startingLevel: null, joinAfterHours: null, minimumContentLevel: null },
    { kind: "kitUpgradeItem", position: 0, itemPosition: 0, kitId: "tank", npc: "npcs:3", item: "items:1", startingLevel: null, joinAfterHours: null, minimumContentLevel: null },
    { kind: "kitUpgradeItem", position: 0, itemPosition: 1, kitId: "tank", npc: "npcs:3", item: "items:2", startingLevel: null, joinAfterHours: null, minimumContentLevel: null },
  ]);
});
test("resolves authored item currency conversion and leaves ordinary items without one", () => {
  const items = [
    { nativeId: 163, gameplay: itemGameplay({ convertToCurrencyId: 1 }) },
    { nativeId: 30, gameplay: itemGameplay({ convertToCurrencyId: 0 }) },
    { nativeId: 44, gameplay: itemGameplay({}) },
  ];
  const entities = [
    entity("items", 163, "Corrupted emerald"), entity("items", 30, "Gold"), entity("items", 44, "Plain item"),
    entity("currencies", 1, "Corrupted Emerald"), entity("currencies", 0, "Gold Coin"),
  ];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admittedItems(items), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);
  expect(blockers).toEqual([]);
  expect(rows.itemFacts.map((row) => [row.entityKey, row.currency])).toEqual([
    ["items:163", { entityKey: "currencies:1", label: "Corrupted Emerald" }],
    ["items:30", { entityKey: "currencies:0", label: "Gold Coin" }],
    ["items:44", null],
  ]);
});

const targets = { abilityId: -1, bonusId: -1, recipeId: -1, resourceId: -1, effectId: -1, npcId: -1, factionId: -1, itemId: -1, currencyId: -1, pointId: -1, talentTreeId: -1, skillId: -1, weaponTemplateId: -1, questId: -1, dialogueId: -1, gameSceneId: -1, lootTableId: -1 };
const gameAction = (sourceIndex: number, type: string, target: Record<string, number> = {}, teleportType = "Position") => ({
  sourceIndex, type: { value: 0, name: type }, chance: 100, alterAction: "Gain", requirements: [], visualEffect: null, nodeAction: { value: 0, name: "RankUp" }, progressionType: { value: 0, name: "Unlock" }, teleportType: { value: 0, name: teleportType }, amount: 0, targets: { ...targets, ...target },
});

test("keeps each item game action in order with its resolved target, and reports targets that do not resolve", () => {
  const items = [
    // The item's own list: a Recipe RankUp action, a sound without a target, and a recipe that the catalog lacks.
    { nativeId: 1, gameplay: itemGameplay({ gameActions: { useTemplateFlag: false, template: null, available: true, actions: [gameAction(0, "Recipe", { recipeId: 7 }), gameAction(1, "TriggerSound"), gameAction(2, "Recipe", { recipeId: 99 })] } }) },
    // A template list: the game reads the template's actions, and each action keeps the template identity.
    { nativeId: 2, gameplay: itemGameplay({ gameActions: { useTemplateFlag: true, template: { nativeId: 4, internalName: "Scroll actions", fileName: null }, available: true, actions: [gameAction(0, "Bonus", { bonusId: 5 }), gameAction(1, "Teleport", { gameSceneId: 12 }, "GameScene"), gameAction(2, "Dialogue", { dialogueId: 3 }), gameAction(3, "Recipe")] } }) },
    // A scan from before the capture has no list.
    { nativeId: 3, gameplay: { actionAbilities: [], nativeUseTooltip: itemGameplay({}).nativeUseTooltip } },
  ];
  const blockers: Blocker[] = [];
  const entities = [entity("items", 1, "Recipe Molten loop"), entity("items", 2, "Scroll"), entity("items", 3, "Old item"), entity("recipes", 7, "Molten loop"), entity("scenes", 12, "Coalway")];
  const rows = collectTypedFacts(admittedItems(items), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers, new Map([["bonuses:5", "Swift"]]));

  expect(rows.itemGameActions.map((row) => [row.entityKey, row.actionIndex, row.template?.name ?? null, row.type, row.nodeAction, row.target])).toEqual([
    ["items:1", 0, null, "Recipe", "RankUp", { entityKey: "recipes:7", label: "Molten loop" }],
    ["items:1", 1, null, "TriggerSound", "RankUp", null],
    ["items:1", 2, null, "Recipe", "RankUp", { entityKey: null, label: "Recipe 99" }],
    ["items:2", 0, "Scroll actions", "Bonus", "RankUp", { entityKey: "bonuses:5", label: "Swift" }],
    ["items:2", 1, "Scroll actions", "Teleport", "RankUp", { entityKey: "scenes:12", label: "Coalway" }],
    ["items:2", 2, "Scroll actions", "Dialogue", "RankUp", { entityKey: null, label: "Dialogue 3" }],
    ["items:2", 3, "Scroll actions", "Recipe", "RankUp", null],
  ]);
  expect(blockers.map((row) => [row.kind, row.key])).toEqual([
    ["missing-reference", "/items/0/gameplay/gameActions/actions/2/targets/recipeId:recipes:99"],
    ["uncaptured-game-action-target", "items:2:2"],
    ["unset-game-action-target", "items:2:3"],
    ["uncaptured-item-game-actions", "items"],
  ]);
});

test("combines row and canonical percentage semantics for item stats", () => {
  const gameplay = itemGameplay({
    stats: [
      { sourceIndex: 0, statId: 1, amount: 5, isPercent: false },
      { sourceIndex: 1, statId: 3, amount: 7, isPercent: true },
    ],
    randomStats: [{ sourceIndex: 0, statId: 2, minValue: 3, maxValue: 9, isPercent: false }],
    gemData: { stats: [{ sourceIndex: 0, statId: 4, amount: 4, isPercent: false }] },
  });
  const stats = [
    { nativeId: 1, name: "Lifesteal", isPercentStat: true },
    { nativeId: 2, name: "Frost Resistance", isPercentStat: true },
    { nativeId: 3, name: "Movement Speed", isPercentStat: false },
    { nativeId: 4, name: "Gem Haste", isPercentStat: true },
  ];
  const entities = [entity("items", 1, "Percentage item"), ...stats.map((stat) => entity("stats", stat.nativeId, stat.name))];
  const rows = collectTypedFacts(admittedItems([{ nativeId: 1, gameplay }], stats.map((stat) => ({ nativeId: stat.nativeId, gameplay: { isPercentStat: stat.isPercentStat } }))), entities, [] as NormalizedDatabaseInput["bindings"], [], []);

  expect(rows.itemStats.map((row) => [row.stat.label, row.isPercent])).toEqual([["Lifesteal", true], ["Movement Speed", true]]);
  expect(rows.itemRandomStats.map((row) => [row.stat.label, row.isPercent])).toEqual([["Frost Resistance", true]]);
  expect(rows.itemGemStats.map((row) => [row.stat.label, row.isPercent])).toEqual([["Gem Haste", true]]);
});

test("classifies every supported item predicate without a generic fallback", () => {
  const payload = (types: string[]) => ({ groups: [{ requirements: types.map((requirementType) => ({ requirementType })) }] });
  expect(classifyItemCondition(payload(["Level", "Class"]))).toEqual({ scope: "equipment", requirementTypes: ["Class", "Level"] });
  for (const type of ["Effect", "Item", "Region", "CombatState", "Stealth", "Mounted", "Grounded", "Time"]) expect(classifyItemCondition(payload([type]))).toEqual({ scope: "use", requirementTypes: [type] });
  expect(classifyItemCondition(payload(["Ability"]))).toEqual({ scope: null, requirementTypes: ["Ability"] });
  expect(classifyItemCondition(payload(["Level", "Effect"]))).toEqual({ scope: null, requirementTypes: ["Effect", "Level"] });
});

test("normalizes adventurer references and an authored flight network", () => {
  const npcGameplay = {
    npcType: { value: 9, name: "ADVENTURER" }, creatureType: { value: 2, name: "HUMANOID" }, isFlightMaster: true, flightNetworkResourcePath: "FlightPaths/Afallon Flight Network 1", flightStopId: "camp", flightInteractionDistance: 8,
    adventurer: { authored: true, classId: 1, preferredTreeId: 3, keepPhaseAbilities: true, raceId: 6, aiLogicTemplateKey: "Templates/Healer", specialization: { available: true, classId: 1, role: { value: 2, name: "Healer" }, preferredTreeId: 3, behaviorName: "Support", priorityAbilities: [10], blockedAbilities: [11], blockedBonuses: [2], allowedForms: [4] } },
    flightNetwork: { available: true, networkId: "Afallon", sceneName: "Coalway outdoors", mapWorldBounds: { x: 0, y: 0, width: 100, height: 100 }, minimumFlyoverHeight: 40, currencyId: 5, stops: [{ id: "camp", name: "Camp", landingPosition: { x: 1, y: 2, z: 3 }, landingYaw: 90, knownInitially: true }], routes: [{ from: "camp", to: "camp", bidirectional: true, fare: 5, speed: 20, departureCruiseWaypoint: 0, arrivalCruiseWaypoint: 0, waypoints: [] }] },
  };
  const entities = [entity("npcs", 399, "Skywarden"), entity("classes", 1, "Cleric"), entity("races", 6, "Human"), entity("talentTrees", 3, "Restoration"), entity("abilities", 10, "Heal"), entity("abilities", 11, "Strike"), entity("currencies", 5, "Silver")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admittedNpc(npcGameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(blockers).toEqual([]);
  expect(rows.npcFacts[0]?.adventurer).toMatchObject({ class: { entityKey: "classes:1", label: "Cleric" }, race: { entityKey: "races:6", label: "Human" }, preferredTree: { entityKey: "talentTrees:3", label: "Restoration" }, specialization: { role: "Healer", priorityAbilities: [{ entityKey: "abilities:10", label: "Heal" }] } });
  expect(rows.npcFacts[0]?.flightNetwork).toMatchObject({ networkId: "Afallon", stopId: "camp", currency: { entityKey: "currencies:5", label: "Silver" }, stops: [{ id: "camp", resolution: { state: "resolved", candidates: [{ mapSpaceId: "world-surface", mapPosition: { x: 1, y: 3 } }] } }] });
});

test("keeps an unplaced flight stop as an explicit coverage blocker", () => {
  const npcGameplay = {
    isFlightMaster: true,
    flightStopId: "training-camp",
    flightNetwork: { available: true, networkId: "Afallon", sceneName: "Test Area", mapWorldBounds: { x: 0, y: 0, width: 100, height: 100 }, minimumFlyoverHeight: 40, currencyId: null, stops: [{ id: "training-camp", name: "Training Camp", landingPosition: { x: 1, y: 2, z: 3 }, landingYaw: 90, knownInitially: true }], routes: [] },
  };
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admittedNpc(npcGameplay), [entity("npcs", 399, "Skywarden")], [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(rows.npcFacts[0]?.flightNetwork?.stops[0]?.resolution).toEqual({ state: "unresolved", candidates: [], issues: ["Flight network scene \"Test Area\" is absent from the current scene catalog."] });
  expect(blockers).toMatchObject([{ kind: "unresolved-flight-stop-space", key: "flight-stop:Afallon:Test Area:training-camp" }]);
});

test("keeps an unresolvable gear set member as an unresolved endpoint and a coverage issue", () => {
  const entities = [entity("gearSets", 17, "Adept Leather"), entity("items", 538, "Adept Leather belt"), entity("stats", 12, "Poison Damage"), entity("stats", 126, "Dodge chance"), entity("stats", 0, "Health")];
  const blockers: Blocker[] = [];
  const rows = collectTypedFacts(admitted(gameplay), entities, [] as NormalizedDatabaseInput["bindings"], [], blockers);

  expect(rows.gearSetMembers.map((row) => row.item)).toEqual([
    { entityKey: "items:538", label: "Adept Leather belt" },
    { entityKey: null, label: "Item 539" },
  ]);
  expect(blockers).toEqual([{
    kind: "missing-reference",
    key: "/tables/gearSets/0/gameplay/itemsInSet/1:items:539",
    detail: "Typed fact references missing items:539.",
    provenance: [{ ...reference, pointer: "/tables/gearSets/0" }],
  }]);
});

test("decodes quest localization and derives the largest mandatory minimum level", () => {
  const admittedQuest = {
    ...admittedItems([]),
    canonical: { value: { items: [], npcs: [], quests: [{ nativeId: 8, gameplay: { questChainOrder: 3, questChainName: "wrong gameplay value", objectiveText: "wrong", completedDescription: "wrong" }, localization: { questChainName: "  Wanderer  ", objectiveText: "  Find the camp  ", completedDescription: "   " } }], scenes: [], regions: [], properties: [], stats: [] }, reference },
  } as unknown as AdmittedCatalog;
  const condition = { conditionId: "level", ownerKey: "quests:8", semantics: "inline-requirements", payload: { groups: [{ requirements: [{ requirementType: "Level", conditionRule: "Mandatory", value: { name: "EqualOrAbove" }, amount1: 16 }] }] } } as NormalizedDatabaseInput["conditions"][number];
  const rows = collectTypedFacts(admittedQuest, [entity("quests", 8, "Camp search")], [], [condition], []);
  expect(rows.questFacts).toMatchObject([{ chainName: "Wanderer", chainOrder: 3, objectiveText: "Find the camp", completedDescription: null, levelRequirement: 16 }]);
});

test("takes the game's level range and dungeon from quest-levels evidence and only the selected requirement set", () => {
  const levels = { path: "quest-levels.json", sha256: "e".repeat(64) };
  const admittedQuest = {
    ...admittedItems([]),
    canonical: { value: { items: [], npcs: [], quests: [{ nativeId: 8, gameplay: { useRequirementsTemplate: true }, localization: {} }, { nativeId: 9, gameplay: {}, localization: {} }], scenes: [], regions: [], properties: [], stats: [] }, reference },
    questLevels: { value: { schemaVersion: "compendium.quest-levels.v1", sourceCount: 2, quests: [{ nativeId: 8, levelRange: { min: 18, max: 20 }, dungeonSceneId: 46 }, { nativeId: 9, levelRange: null, dungeonSceneId: null }] }, reference: levels },
  } as unknown as AdmittedCatalog;
  const level = (conditionId: string, semantics: string, amount1: number) => ({ conditionId, ownerKey: "quests:8", semantics, payload: { groups: [{ requirements: [{ requirementType: "Level", conditionRule: "Mandatory", value: { name: "EqualOrAbove" }, amount1 }] }] } }) as NormalizedDatabaseInput["conditions"][number];
  const rows = collectTypedFacts(admittedQuest, [entity("quests", 8, "Deep roots"), entity("quests", 9, "Brew"), entity("scenes", 46, "Duskfall Depths")], [], [level("inline", "inline-requirements", 30), level("template", "requirements-template", 16)], []);
  expect(rows.questFacts).toMatchObject([
    { entityKey: "quests:8", levelRequirement: 16, conditionIds: ["template"], levelRange: { min: 18, max: 20 }, dungeon: { entityKey: "scenes:46", label: "Duskfall Depths" } },
    { entityKey: "quests:9", levelRequirement: null, conditionIds: [], levelRange: null, dungeon: null },
  ]);
});

test("finds the maximum all-mode level threshold and ignores upper limits, optional limits, and null groups", () => {
  const requirement = (amount1: number, name: string, conditionRule = "Mandatory") => ({ requirementType: "Level", conditionRule, value: { name }, amount1 });
  expect(questMinimumLevel([
    null,
    { requirements: [requirement(16, "EqualOrAbove"), requirement(19, "Above")] },
    { requirements: [requirement(60, "EqualOrBelow")] },
    { checkCount: true, requiredCount: 1, requirements: [requirement(90, "EqualOrAbove"), requirement(80, "Above")] },
    { requirements: [requirement(90, "Above", "Optional")] },
  ])).toBe(20);
  expect(questMinimumLevel([{ requirements: [requirement(19, "Below"), requirement(30, "EqualOrBelow")] }])).toBeNull();
});

test("entity rows keep only the gameplay that v1 support evidence carried", () => {
  const ranks = [{ rankIndex: 0, text: "Deals damage" }];
  expect(entityGameplay("abilities", { ranks, rankMechanics: [{ rankIndex: 0, cooldown: 4 }], abilityType: { value: 0, name: "Normal" } })).toEqual({ ranks });
  expect(entityGameplay("classes", { allowedWeaponTypes: [], talentTreeIds: [{ sourceIndex: 0, talentTreeId: 0 }] })).toEqual({ allowedWeaponTypes: [] });
  expect(entityGameplay("effects", { effectType: { value: 5, name: "Stun" } })).toBeNull();
  expect(entityGameplay("recipes", { learnedByDefault: true })).toEqual({ learnedByDefault: true });
});
