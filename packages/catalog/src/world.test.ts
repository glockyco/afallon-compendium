import { expect, test } from "bun:test";
import type { SceneContext, SourceIdentityRow } from "./context";
import type { Blocker } from "./context";
import type { ItemSourceAccumulator } from "./relations";
import { worldRelations } from "./world";

const reference = { path: "world.json", sha256: "e".repeat(64) };
const source = (componentInstanceId: number) => ({ componentInstanceId, source: { hierarchyPath: `Root[0]/Object[${componentInstanceId}]` } });
const worldQuest = (nativeId: number, questId: number) => ({ nativeId, quest: { nativeId: questId }, availableDuration: 600, cooldownAfterCompletion: 900, cooldownAfterExpiry: 300, cooldownRandomJitter: 60, initialRollWindow: 30 });
const action = (fields: Record<string, unknown>) => ({ activationType: { name: "Click" }, chance: 100, gameActions: { inline: { actions: [] } }, ...fields });

test("zones offer their pool or else their fixed quest, and placed objects start quests, complete tasks, and give loot", () => {
  const identities = [1, 2, 3].map((componentInstanceId) => ({ sourceId: `source-${componentInstanceId}`, componentInstanceId, identityIndex: componentInstanceId }) as SourceIdentityRow);
  const world = {
    resourceProducers: [], containers: [], transitions: [],
    questZones: [
      { source: source(1), worldQuest: worldQuest(12, 103), possibleQuests: [{ worldQuest: worldQuest(10, 100) }, { worldQuest: worldQuest(11, 101) }], zoneRespawnCooldown: 15 },
      { source: source(3), worldQuest: worldQuest(13, 104), possibleQuests: [], zoneRespawnCooldown: 15 },
    ],
    interactions: [
      { source: source(2), interactableName: "<color=red>Golden</color> purse", actions: [
        action({ type: { name: "Quest" }, quest: { nativeId: 102 }, sourceFieldPath: "actions/0" }),
        action({ type: { name: "CompleteTask" }, task: { nativeId: 200 }, sourceFieldPath: "actions/1" }),
        action({ type: { name: "Chest" }, lootTable: { nativeId: 30 }, chance: 75, sourceFieldPath: "actions/2" }),
        action({ type: { name: "GameActions" }, chance: 90, sourceFieldPath: "actions/3",
          gameActions: { template: null, inline: { actions: [{
            sourceIndex: 0, sourceFieldPath: "actions/3/GameActions[0]", type: { name: "LootTable" }, nodeAction: { name: "RankUp" }, alterAction: "Gain",
            lootTableID: 30, targets: { lootTableId: 30 }, chance: 25,
          }] } } }),
      ] },
      // An object without a verified source identity still teleports, but it cannot start a quest.
      { source: source(9), interactableName: "Portal", actions: [
        action({ type: { name: "Quest" }, quest: { nativeId: 105 }, sourceFieldPath: "actions/0", effectTeleport: { sceneNativeId: 4, position: { x: 1, y: 2, z: 3 } } }),
      ] },
    ],
  };
  const context = { snapshotId: "snapshot", sceneNativeId: 1, sourceByComponent: new Map(identities.map((row) => [row.componentInstanceId, row])), world, worldReference: reference, identityReference: reference } as unknown as SceneContext;
  const index = new Map<number, Map<string, ItemSourceAccumulator>>(), blockers: Blocker[] = [];
  const result = worldRelations([context], new Map([["source-1", "zone"], ["source-2", "purse"], ["source-3", "camp"]]), [{ lootTableID: 30, itemID: 99, entryIndex: 0, min: 2, max: 3, dropRate: 40, provenance: [reference] }] as never, [], index, blockers);
  expect(result.questAssociations.map(({ associationKind, questID, taskID }: Record<string, unknown>) => [associationKind, questID ?? taskID]).sort()).toEqual([
    ["world-quest-offer", 100], ["world-quest-offer", 101], ["world-quest-offer", 104], ["interaction-quest", 102], ["interaction-task", 200],
  ].sort());
  expect(result.worldQuestFacts.map((row) => [row.entityKey, row.availableSeconds, row.initialRollSeconds])).toEqual([["quests:100", 600, 30], ["quests:101", 600, 30], ["quests:104", 600, 30]]);
  expect(result.questAssociations.find((row) => row.associationKind === "interaction-quest")?.payload).toEqual({ objectName: "<color=red>Golden</color> purse", activationType: "Click", chance: 100 });
  expect([...index.get(99)!.values()].map((row) => ({
    sourceKind: row.sourceKind, placementIds: row.placementIds,
    sourceId: row.context.sourceId, rawRate: row.context.rawRate,
    actionChance: row.context.authoredActionChance, gameActionChance: row.context.gameActionChance ?? null,
  })).sort((left, right) => Number(left.actionChance) - Number(right.actionChance))).toEqual([
    { sourceKind: "interaction", placementIds: ["purse"], sourceId: "source-2", rawRate: 40, actionChance: 75, gameActionChance: null },
    { sourceKind: "interaction", placementIds: ["purse"], sourceId: "source-2", rawRate: 40, actionChance: 90, gameActionChance: 25 },
  ]);
  expect(result.transitions).toMatchObject([{ sourceId: null, transitionKind: "effect-teleport", destinationSceneNativeId: 4 }]);
  expect(blockers).toEqual([]);
});

test("a completed altar effect contributes rows only from the chest prefab selected among its two alternatives", () => {
  const identity = { sourceId: "altar-source", componentInstanceId: 12, identityIndex: 0 } as SourceIdentityRow;
  const chest = (itemID: number, chance: number) => ({
    maxDrops: 1,
    lootInstances: [{ itemID, minCount: 1, maxCount: 2, dropChance: chance, itemReferenceStatus: "resolved" }],
  });
  const world = {
    resourceProducers: [], containers: [], transitions: [], questZones: [],
    interactions: [{ family: "interactableObject", source: source(12), interactableName: "Sacrificial altar", actions: [],
      visualEffects: [{ activationType: { name: "Completed" }, prefabCount: 2, prefabs: [
        { key: "altar/chest-a", prefabAvailable: true, chests: [chest(91, 100)], childInteractables: [] },
        { key: "altar/chest-b", prefabAvailable: true, chests: [chest(92, 35)], childInteractables: [] },
      ] }] }],
  };
  const context = { snapshotId: "altar-snapshot", sceneNativeId: 42, sourceByComponent: new Map([[12, identity]]), world, worldReference: reference, identityReference: reference } as unknown as SceneContext;
  const index = new Map<number, Map<string, ItemSourceAccumulator>>(), blockers: Blocker[] = [];
  const relations = worldRelations([context], new Map([["altar-source", "altar-placement"]]), [], [], index, blockers);
  for (const [id, chance] of [[91, 100], [92, 35]] as const) {
    expect([...index.get(id)!.values()]).toMatchObject([{ sourceKind: "interaction", placementIds: ["altar-placement"],
      context: { objectName: "Sacrificial altar", prefabChoices: 2, rawRate: chance, min: 1, max: 2 } }]);
  }
  expect(relations.visualEffectRoles).toEqual([{ sourceId: "altar-source", placementId: "altar-placement",
    evidence: [{ ...reference, pointer: "/interactions/0/visualEffects/0" }] }]);
  expect(blockers).toEqual([]);
});

test("an altar currency branch rolls one reward set, then lets the player choose one item", () => {
  const identity = { sourceId: "altar-source", componentInstanceId: 12, identityIndex: 0 } as SourceIdentityRow;
  const itemChoice = (name: string, itemID: number) => ({
    name, activeSelf: false, playerChoice: true, requirements: [], visualEffects: [],
    chestActions: [{ activationType: { name: "Completed" }, chance: 100, lootTableId: itemID,
      lootRows: [{ itemID, min: 1, max: 1, dropRate: 100 }] }],
  });
  const rewardSet = (key: string, first: number, second: number) => ({
    key, prefabAvailable: true, chests: [],
    childInteractables: [itemChoice("Left reward", first), itemChoice("Right reward", second)],
  });
  const paidBranch = {
    name: "Emeralds loot", activeSelf: false, playerChoice: true, chestActions: [],
    requirements: [{ checkCount: false, requiredCount: 1, rows: [
      { type: { name: "Currency" }, condition: { name: "Mandatory" }, ownership: { name: "Owned" },
        value: { name: "EqualOrAbove" }, currencyID: 1, itemID: 163, amount1: 15, consume: true },
    ] }],
    visualEffects: [{ activationType: { name: "Completed" }, prefabCount: 2, prefabs: [
      rewardSet("altar/set-0", 276, 211), rewardSet("altar/set-1", 209, 217),
    ] }],
  };
  const goldBranch = {
    name: "150 gold loot", activeSelf: false, playerChoice: true, chestActions: [],
    requirements: [{ checkCount: false, requiredCount: 1, rows: [
      { type: { name: "Currency" }, condition: { name: "Mandatory" }, ownership: { name: "Owned" },
        value: { name: "EqualOrAbove" }, currencyID: 0, itemID: 30, amount1: 150, consume: true },
    ] }],
    visualEffects: [{ activationType: { name: "Completed" }, prefabCount: 2, prefabs: [
      { key: "altar/gold-0", prefabAvailable: true, chests: [{ maxDrops: 1,
        lootInstances: [{ itemID: 163, minCount: 1, maxCount: 2, dropChance: 100 }] }], childInteractables: [] },
      { key: "altar/gold-1", prefabAvailable: true, chests: [{ maxDrops: 1,
        lootInstances: [{ itemID: 164, minCount: 1, maxCount: 1, dropChance: 100 }] }], childInteractables: [] },
    ] }],
  };
  const world = {
    resourceProducers: [], containers: [], transitions: [], questZones: [],
    interactions: [{ family: "interactableObject", source: source(12), interactableName: "Sacrificial altar", actions: [],
      visualEffects: [{ activationType: { name: "Completed" }, prefabCount: 1, prefabs: [
        { key: "altar/choices", prefabAvailable: true, chests: [], childInteractables: [goldBranch, paidBranch] },
      ] }] }],
  };
  const context = { snapshotId: "altar-snapshot", sceneNativeId: 42, sourceByComponent: new Map([[12, identity]]), world, worldReference: reference, identityReference: reference } as unknown as SceneContext;
  const index = new Map<number, Map<string, ItemSourceAccumulator>>(), blockers: Blocker[] = [];
  const relations = worldRelations([context], new Map([["altar-source", "altar-placement"]]), [], [], index, blockers);
  for (const itemID of [276, 211, 209, 217]) {
    expect([...index.get(itemID)!.values()]).toMatchObject([{ sourceKind: "interaction", placementIds: ["altar-placement"],
      context: { objectName: "Sacrificial altar", prefabChoices: 2, pickOne: 2, choiceLabel: "Emeralds loot",
        costCurrencyId: 1, costAmount: 15, rawRate: 100, min: 1, max: 1 } }]);
  }
  const gold = [...index.get(163)!.values()][0]!;
  expect(gold).toMatchObject({ sourceKind: "interaction", context: { choiceLabel: "150 gold loot",
    costCurrencyId: 0, costAmount: 150, prefabChoices: 2 } });
  expect(gold.context.pickOne).toBeUndefined();
  expect(relations.visualEffectRoles).toEqual([{ sourceId: "altar-source", placementId: "altar-placement",
    evidence: [{ ...reference, pointer: "/interactions/0/visualEffects/0" }] }]);
  expect(blockers).toEqual([]);
});
