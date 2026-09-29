import { expect, test } from "bun:test";
import type { Blocker, SceneContext, SourceIdentityRow } from "./context";
import { gatheringNodeName, gatheringNodes, linkGatheringYields } from "./gathering";

const reference = { path: "world.json", sha256: "e".repeat(64) };
const source = (componentInstanceId: number) => ({ componentInstanceId, source: { hierarchyPath: `Root[0]/Object[${componentInstanceId}]` } });
const template = (path: string, level: number) => ({ fileName: `Pickaxe mining Mining ${level}_REQUIREMENTS`, sourceFieldPath: path, groups: [{ groupIndex: 0, requirements: [{ requirementType: { name: "SkillLevel" }, amount1: level, sourceFieldPath: `${path}.Requirements[0]` }] }] });
const actions = (lootTable: number, skill: number, experience: number) => [
  { type: { name: "Chest" }, lootTable: { nativeId: lootTable } },
  { type: { name: "GiveSkillExperience" }, skill: { nativeId: skill }, amount: experience },
  { type: { name: "GiveCharacterExperience" }, amount: 4 },
];
const vein = (name: string, path: string, level: number, lootTable = 24, experience = 15) => ({ interactableName: name, actions: actions(lootTable, 7, experience), requirementsTemplate: template(path, level), cooldown: 300 });
const option = (optionIndex: number, interactable: ReturnType<typeof vein>) => ({ optionIndex, weightAtLowSkill: 70, weightAtHighSkill: 24, teaserWeight: 0, authoredInteractables: [interactable] });
const spawner = (componentInstanceId: number, options: ReturnType<typeof option>[]) => ({ source: source(componentInstanceId), gatheringSkillID: 7, respawnTime: 120, respawnJitter: 30, despawnDelay: 60, playerRange: 40, skillCap: 150, options });

function run(world: Record<string, unknown>) {
  const identities = [1, 2, 3, 4, 5].map((componentInstanceId) => ({ sourceId: `source-${componentInstanceId}`, componentInstanceId, identityIndex: componentInstanceId }) as SourceIdentityRow);
  const context = { snapshotId: "snapshot", sceneNativeId: 1, sourceByComponent: new Map(identities.map((row) => [row.componentInstanceId, row])), world: { interactions: [], ...world }, worldReference: reference } as unknown as SceneContext;
  const blockers: Blocker[] = [];
  const labels = new Map([["skills:7", "Mining"], ["lootTables:24", "Small iron vein"], ["lootTables:25", "Small iron vein cave"]]);
  return { ...gatheringNodes([context], labels, blockers), blockers };
}

test("the node name drops the colored tool and level hints and keeps the level hint apart", () => {
  expect(gatheringNodeName("Gold vein <color=red>Pickaxe</color> <color=#ffd100>[Mining 35]</color>")).toEqual({ name: "Gold vein", levelHint: "Mining 35" });
  expect(gatheringNodeName("Small iron vein <color=red>Pickaxe</color>")).toEqual({ name: "Small iron vein", levelHint: null });
});

test("spawner options and placed objects with one name and one content form one node", () => {
  const name = "Small iron vein <color=red>Pickaxe</color> <color=#ffd100>[Mining 5]</color>";
  const result = run({
    resourceProducers: [spawner(1, [option(0, vein(name, "OreSpawner[0]", 5))]), spawner(2, [option(3, vein(name, "OreSpawner[1]", 5))])],
    interactions: [
      { source: source(3), ...vein(name, "Interactable[0]", 5) },
      // Loot and experience in a skill that no spawner gathers: not a gathering node.
      { source: source(4), interactableName: "Pumpkin", actions: actions(24, 9, 5), requirementsTemplate: null, cooldown: 60 },
      // Experience without loot: not a gathering node.
      { source: source(5), interactableName: "Berry", actions: actions(24, 7, 5).slice(1), requirementsTemplate: null, cooldown: 60 },
    ],
  });
  expect(result.gatheringNodes.map((row) => [row.entityKey, row.name, row.levelHint, row.variant, row.skill?.label, row.skillExperience, row.characterExperience, row.lootTable?.label])).toEqual([
    ["gatheringNodes:small-iron-vein", "Small iron vein", "Mining 5", false, "Mining", 15, 4, "Small iron vein"],
  ]);
  expect(result.gatheringNodeSources.map((row) => [row.sourceId, row.sourceKind, row.optionIndex, row.cooldown])).toEqual([
    ["source-1", "spawner-option", 0, null], ["source-2", "spawner-option", 3, null], ["source-3", "placed-object", null, 300],
  ]);
  expect([...result.nodeBySpawnerOutput]).toEqual([["source-1|0|24", "gatheringNodes:small-iron-vein"], ["source-2|3|24", "gatheringNodes:small-iron-vein"]]);
  expect(result.conditions.map((row) => [row.ownerType, row.ownerKey])).toEqual([["gathering-node", "gatheringNodes:small-iron-vein"]]);
  expect(result.blockers).toEqual([]);
});

test("sources that share a name but disagree on content become variants with one coverage issue", () => {
  const result = run({ resourceProducers: [spawner(1, [
    option(0, vein("Small iron vein <color=red>Pickaxe</color>", "OreSpawner[0]", 1)),
    option(1, vein("Small iron vein <color=red>Pickaxe</color> <color=#ffd100>[Mining 10]</color>", "OreSpawner[0]", 10, 25, 25)),
  ])] });
  expect(result.gatheringNodes.map((row) => [row.entityKey, row.variant, row.skillExperience])).toEqual([
    ["gatheringNodes:small-iron-vein--small-iron-vein", true, 15], ["gatheringNodes:small-iron-vein--small-iron-vein-cave", true, 25],
  ]);
  expect([...result.nodeBySpawnerOutput.values()]).toEqual(["gatheringNodes:small-iron-vein--small-iron-vein", "gatheringNodes:small-iron-vein--small-iron-vein-cave"]);
  expect(result.blockers.map((row) => [row.kind, row.key])).toEqual([["gathering-node-variants", "gathering-node:small-iron-vein"]]);
});

test("a yield links only through its own spawner option and loot table, and an unlinked yield keeps its source", () => {
  const nodes = new Map([["source-1|0|24", "gatheringNodes:small-iron-vein"]]);
  const yields = [
    { yieldId: "own-option", sourceId: "source-1", optionIndex: 0, lootTableID: 24, provenance: [reference] },
    // The same spawner, but another option: it does not borrow the node of option 0.
    { yieldId: "other-option", sourceId: "source-1", optionIndex: 1, lootTableID: 24, provenance: [reference] },
    { yieldId: "no-option", sourceId: "source-1", lootTableID: 24, provenance: [reference] },
  ];
  const blockers: Blocker[] = [];
  expect(linkGatheringYields(yields, nodes, blockers).map((row) => [row.yieldId, row.sourceId, row.gatheringNodeKey])).toEqual([
    ["own-option", "source-1", "gatheringNodes:small-iron-vein"], ["other-option", "source-1", null], ["no-option", "source-1", null],
  ]);
  expect(blockers.map((row) => [row.kind, row.key])).toEqual([["unlinked-gathering-yield", "other-option"], ["unlinked-gathering-yield", "no-option"]]);
});
