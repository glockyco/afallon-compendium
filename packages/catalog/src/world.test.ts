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
  expect(index.get(99)?.values().next().value).toMatchObject({ sourceKind: "interaction", placementIds: ["purse"], context: { sourceId: "source-2", objectName: "<color=red>Golden</color> purse", min: 2, max: 3, rawRate: 40, authoredActionChance: 75 } });
  expect(result.transitions).toMatchObject([{ sourceId: null, transitionKind: "effect-teleport", destinationSceneNativeId: 4 }]);
  expect(blockers).toEqual([]);
});
