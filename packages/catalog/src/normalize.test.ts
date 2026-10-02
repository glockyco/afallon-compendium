import { expect, test } from "bun:test";
import type { Canonical } from "@afallon/contracts";
import type { NormalizedDatabaseInput, NormalizedEntity } from "@afallon/contracts/catalog";
import { collectQuestPickups, collectTypedFacts, collectRaceStarts } from "./normalize";
import { classifyItemCondition } from "./conditions";
import type { AdmittedCatalog } from "./evidence";
import type { Blocker, SceneContext } from "./context";
import { questMinimumLevel } from "./decoders";
import { ownerGameActions, worldOwnerGameActions } from "./owner-actions";
import { worldRelations } from "./world";
import type { ItemSourceAccumulator } from "./relations";

test("placed and hunt-creature pickups link matching get-item tasks and keep every placed source", () => {
  const fields = (kind: string, itemId: number) => ({
    kind: { name: kind }, item: { nativeId: itemId }, quest: { nativeId: 3 }, task: { nativeId: 4 },
    prerequisiteTask: { nativeId: 5 }, amount: 2, requiredItemCount: 1, singleUse: true,
  });
  const context = {
    sceneNativeId: 42, sourceByComponent: new Map([[19, { sourceId: "pickup-interaction" }], [21, { sourceId: "other-interaction" }]]),
    world: {
      questFieldInteractions: [
        { source: { componentInstanceId: 17, gameObjectInstanceId: 88 }, fields: fields("Pickup", 7) },
        { source: { componentInstanceId: 20, gameObjectInstanceId: 89 }, fields: fields("Pickup", 7) },
        { source: { componentInstanceId: 18, gameObjectInstanceId: 90 }, fields: fields("Workstation", 7) },
      ],
      interactions: [
        { family: "interactableObject", source: { componentInstanceId: 19, gameObjectInstanceId: 88 } },
        { family: "interactableObject", source: { componentInstanceId: 21, gameObjectInstanceId: 89 } },
      ],
      huntTanneryDirectors: [{ drops: [{ npcID: 9, prefab: fields("Pickup", 7) }, { npcID: 9, prefab: fields("Pickup", 8) }] }],
    },
  } as unknown as SceneContext;
  const tasks = [{ entityKey: "tasks:4", taskType: "getItem", target: { entityKey: "items:7", label: "Sealed satchel" } }] as NonNullable<NormalizedDatabaseInput["taskFacts"]>;
  const endpoint = (kind: string, id: number | null | undefined) => id == null ? null : { entityKey: `${kind}:${id}`, label: ({ "items:7": "Sealed satchel", "npcs:9": "Forest boar" } as Record<string, string>)[`${kind}:${id}`] ?? `${kind} ${id}` };
  const requiredEndpoint = (kind: string, id: number) => {
    const value = endpoint(kind, id);
    if (value === null) throw new Error(`Missing fixture endpoint ${kind}:${id}`);
    return value;
  };
  const placements = new Map([["pickup-interaction", "pickup-placement"], ["other-interaction", "other-placement"]]);
  const rows = collectQuestPickups([context], placements, tasks, endpoint);
  expect(rows).toEqual([
    { item: requiredEndpoint("items", 7), amount: 2, quest: endpoint("quests", 3), task: endpoint("tasks", 4),
      prerequisiteTask: endpoint("tasks", 5), requiredItemCount: 1, singleUse: true,
      origin: { kind: "placed", placementId: "pickup-placement", sceneNativeId: 42 } },
    { item: requiredEndpoint("items", 7), amount: 2, quest: endpoint("quests", 3), task: endpoint("tasks", 4),
      prerequisiteTask: endpoint("tasks", 5), requiredItemCount: 1, singleUse: true,
      origin: { kind: "placed", placementId: "other-placement", sceneNativeId: 42 } },
    { item: requiredEndpoint("items", 7), amount: 2, quest: endpoint("quests", 3), task: endpoint("tasks", 4),
      prerequisiteTask: endpoint("tasks", 5), requiredItemCount: 1, singleUse: true,
      origin: { kind: "creature", npc: requiredEndpoint("npcs", 9), sceneNativeId: 42 } },
  ]);
  expect(collectQuestPickups([context, context], placements, tasks, endpoint)).toEqual(rows);
});

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

test("retains non-item owners' inline and selected template actions and reports a newly granted item", () => {
  const owners = [
    { ownerKind: "effects", ownerId: "2", ownerPath: "effects/2/ranks/0", template: null,
      actions: [gameAction(0, "Item", { itemId: 7 }), gameAction(1, "Item", { itemId: 999 })] },
    { ownerKind: "stats", ownerId: "3", ownerPath: "stats/3/vitalityActions/0",
      template: { nativeId: -1, internalName: "StopSprint", fileName: "StopSprint" },
      actions: [gameAction(0, "ResetSprint")] },
  ] as Parameters<typeof ownerGameActions>[0];
  const blockers: Blocker[] = [];
  const rows = ownerGameActions(owners, [entity("effects", 2, "Enraged"), entity("items", 7, "Sealed satchel"), entity("stats", 3, "Stamina")], reference, blockers);
  expect(rows.map((row) => [row.ownerKind, row.ownerPath, row.template?.name, row.actionIndex, row.target, row.targets.itemId])).toEqual([
    ["effects", "effects/2/ranks/0", undefined, 0, { entityKey: "items:7", label: "Sealed satchel" }, 7],
    ["effects", "effects/2/ranks/0", undefined, 1, { entityKey: null, label: "Item 999" }, 999],
    ["stats", "stats/3/vitalityActions/0", "StopSprint", 0, null, -1],
  ]);
  expect(blockers.filter((row) => row.kind === "non-item-game-action-grant").map((row) => row.key)).toEqual([
    "effects:effects/2/ranks/0:0", "effects:effects/2/ranks/0:1",
  ]);
  expect(blockers.some((row) => row.kind === "unresolved-game-action-target" && row.detail.includes("items:999"))).toBe(true);
});

test("flags a placed object's template grant while retaining its removal actions", () => {
  const remove = { ...gameAction(1, "Item", { itemId: 7 }), alterAction: "Remove" };
  const rankDown = { ...gameAction(2, "Recipe", { recipeId: 43 }), nodeAction: { value: 1, name: "RankDown" } };
  const template = [{ ownerKind: "templates", ownerId: "Recipe unlock", ownerPath: "templates/Recipe unlock", template: null,
    actions: [gameAction(0, "Recipe", { recipeId: 43 }), remove, rankDown] }] as Parameters<typeof ownerGameActions>[0];
  const blockers: Blocker[] = [];
  const templateRows = ownerGameActions(template, [entity("recipes", 43, "Tavern"), entity("items", 7, "Sealed satchel")], reference, blockers);
  const context = { sceneNativeId: 44, worldReference: reference, sourceByComponent: new Map([[19, { sourceId: "object-19" }]]), world: { interactions: [{
    family: "interactableObject", interactableName: "Tavern Workbench",
    source: { componentInstanceId: 19, source: { hierarchyPath: "Workbench[0]", componentIndex: 0 } },
    actions: [{ type: { name: "GameActions" }, gameActions: {
      template: { nativeId: -1, name: "Recipe unlock", internalName: "Recipe unlock", available: true,
        actions: [gameAction(0, "Recipe", { recipeId: 43 }), remove, rankDown] },
      inline: { actions: [gameAction(0, "Item", { itemId: 7 })] },
    } }],
  }] } } as unknown as SceneContext;
  const ownerRows = worldOwnerGameActions([context], templateRows, [entity("recipes", 43, "Tavern"), entity("items", 7, "Sealed satchel")], new Map(), blockers);
  expect(ownerRows.map((row) => [row.ownerKind, row.ownerId, row.type, row.target?.entityKey, row.alterAction, row.nodeAction])).toEqual([
    ["interactableObjects", "object-19", "Recipe", "recipes:43", "Gain", "RankUp"],
    ["interactableObjects", "object-19", "Item", "items:7", "Remove", "RankUp"],
    ["interactableObjects", "object-19", "Recipe", "recipes:43", "Gain", "RankDown"],
    ["interactableObjects", "object-19", "Item", "items:7", "Gain", "RankUp"],
  ]);
  expect(blockers.filter((row) => row.kind === "non-item-game-action-grant").map((row) => row.key)).toEqual([
    "object-19/actions/0/0-template/Recipe unlock:0",
    "object-19/actions/0/1-inline:0",
  ]);
});

test("preserves item and interactable loot owners while publishing placed Item Gain counts", () => {
  const entities = [entity("items", 1, "Supply Sack"), entity("items", 2, "Healing balm"), entity("lootTables", 30, "Sack Rewards")];
  const item = collectTypedFacts(admittedItems([{ nativeId: 1, gameplay: itemGameplay({
    gameActions: { useTemplateFlag: false, template: null, available: true, actions: [gameAction(0, "LootTable", { lootTableId: 30 })] },
  }) }]), entities, [] as NormalizedDatabaseInput["bindings"], [], []);
  const context = {
    snapshotId: "snapshot", sceneNativeId: 44, worldReference: reference, identityReference: reference,
    sourceByComponent: new Map([[20, { sourceId: "sack-object", componentInstanceId: 20, identityIndex: 0 }]]),
    world: { resourceProducers: [], containers: [], transitions: [], questZones: [], interactions: [{
      family: "interactableObject", interactableName: "Reward Chest", visualEffects: [],
      source: { componentInstanceId: 20, source: { hierarchyPath: "Reward Chest[0]", componentIndex: 0 } },
      actions: [{ type: { name: "GameActions" }, activationType: { name: "Completed" }, chance: 75, sourceFieldPath: "actions/0", gameActions: {
        template: null, inline: { actions: [
          { ...gameAction(0, "LootTable", { lootTableId: 30 }), lootTableID: 30, chance: 25 },
          { ...gameAction(1, "Item", { itemId: 2 }), amount: 3, chance: 40 },
        ] },
      } }],
    }] },
  } as unknown as SceneContext;
  const sources = new Map<number, Map<string, ItemSourceAccumulator>>(), blockers: Blocker[] = [];
  worldRelations([context], new Map([["sack-object", "sack-placement"]]),
    [{ lootTableID: 30, itemID: 2, entryIndex: 0, min: 1, max: 2, dropRate: 55, provenance: [reference] }] as never,
    [], sources, blockers);
  const object = worldOwnerGameActions([context], [], entities, sources, blockers);
  expect(item.itemGameActions.map((row) => [row.entityKey, row.target])).toEqual([
    ["items:1", { entityKey: "lootTables:30", label: "Sack Rewards" }],
  ]);
  expect(object.map((row) => [row.ownerId, row.ownerName, row.target])).toEqual([
    ["sack-object", "Reward Chest", { entityKey: "lootTables:30", label: "Sack Rewards" }],
    ["sack-object", "Reward Chest", { entityKey: "items:2", label: "Healing balm" }],
  ]);
  expect([...sources.get(2)!.values()].map((row) => ({
    min: row.context.min, max: row.context.max, chance: row.context.rawRate,
    actionChance: row.context.authoredActionChance, gameActionChance: row.context.gameActionChance,
    placementIds: row.placementIds,
  }))).toEqual([
    { min: 1, max: 2, chance: 55, actionChance: 75, gameActionChance: 25, placementIds: ["sack-placement"] },
    { min: 3, max: 3, chance: null, actionChance: 75, gameActionChance: 40, placementIds: ["sack-placement"] },
  ]);
  expect(blockers).toEqual([]);
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

test("binds tree artwork to its entity and bonus artwork to its progression fact without dropping unavailable nodes", () => {
  const image = { path: "artwork/shared.png", sha256: "f".repeat(64), bytes: 12, width: 2, height: 2 };
  const records = [
    { family: "talentTrees", nativeId: 4, role: "icon", sourceName: "Tree", sourceFieldPath: "talentTrees[4].entryIcon", status: "extracted", image, reason: null },
    { family: "bonuses", nativeId: 7, role: "icon", sourceName: "Talent", sourceFieldPath: "Bonus.entryIcon", status: "extracted", image, reason: null },
    { family: "bonuses", nativeId: 8, role: "icon", sourceName: "Missing", sourceFieldPath: "Bonus.entryIcon", status: "missing", image: null, reason: "Sprite absent" },
    { family: "bonuses", nativeId: 9, role: "icon", sourceName: "Unreadable", sourceFieldPath: "Bonus.entryIcon", status: "unsupported", image: null, reason: "Unreadable sprite" },
    { family: "bonuses", nativeId: 99, role: "icon", sourceName: "Unrecognized", sourceFieldPath: "Bonus.entryIcon", status: "extracted", image, reason: null },
  ] as const;
  const candidate = { ...admittedItems([]), artwork: { value: { records }, reference } } as unknown as AdmittedCatalog;
  const blockers: Blocker[] = [];
  const result = collectTypedFacts(candidate, [entity("talentTrees", 4, "Guardian")], [], [], blockers, new Map([["bonuses:7", "Talent"], ["bonuses:8", "Missing"], ["bonuses:9", "Unreadable"]]));
  expect(result.artworkBindings).toMatchObject([{ entityKey: "talentTrees:4", role: "icon", assetId: image.sha256 }]);
  expect(result.bonusArtworkBindings).toMatchObject([{ factKey: "bonuses:7", role: "icon", assetId: image.sha256, provenance: [{ pointer: "/records/1" }] }]);
  expect(result.artworkAssets).toHaveLength(1);
  expect(blockers.map((row) => [row.kind, row.key])).toEqual([
    ["artwork-unavailable", "bonuses:8:icon"],
    ["artwork-unavailable", "bonuses:9:icon"],
    ["missing-reference", "artwork:bonuses:99:icon"],
  ]);
});

test("race starts resolve their own world positions and do not infer an absent scene from its arrival", () => {
  const races = [
    { sourceKey: 1, entry: { nativeId: 1, name: "Human", internalName: "Human" }, gameplay: { startingSceneId: 22, startingPositionId: 18 } },
    { sourceKey: 7, entry: { nativeId: 7, name: "Orc", internalName: "Orc" }, gameplay: { startingSceneId: 99, startingPositionId: 35 } },
  ];
  const positions = new Map<number, { row: Canonical["worldPositions"][number]; index: number }>([
    [18, { row: { position: { x: 1065.1, y: 32.97, z: -634.39 } } as Canonical["worldPositions"][number], index: 4 }],
  ]);
  const blockers: Blocker[] = [];
  const starts = collectRaceStarts(races, [entity("races", 1, "Human"), entity("races", 7, "Orc"), entity("scenes", 22, "Abandoned Quarry")], positions, reference, reference, blockers);
  expect(starts.map(({ raceKey, sceneKey, startingSceneId, startingPositionId, position }) => ({ raceKey, sceneKey, startingSceneId, startingPositionId, position }))).toEqual([
    { raceKey: "races:1", sceneKey: "scenes:22", startingSceneId: 22, startingPositionId: 18, position: { x: 1065.1, y: 32.97, z: -634.39 } },
    { raceKey: "races:7", sceneKey: null, startingSceneId: 99, startingPositionId: 35, position: null },
  ]);
  expect(starts[0]?.sceneSourceFieldPath).toBe("GameDatabase.Races[1].startingSceneID");
  expect(starts[0]?.positionSourceFieldPath).toBe("GameDatabase.Races[1].startingPositionID");
  expect(blockers.map(({ kind, key, provenance }) => [kind, key, provenance[0]?.pointer])).toEqual([
    ["missing-reference", "race-start:races:7:scenes:99", "/tables/races/1/gameplay/startingSceneId"],
    ["missing-reference", "race-start:races:7:worldPositions:35", "/tables/races/1/gameplay/startingPositionId"],
  ]);
});
