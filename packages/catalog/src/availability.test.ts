import { expect, test } from "bun:test";
import type { NormalizedCondition, NormalizedSourceGate } from "@afallon/contracts/catalog";
import type { Blocker, SceneContext, SourceIdentityRow } from "./context";
import { collectSourceGates } from "./availability";

const reference = { path: "world.json", sha256: "f".repeat(64) };
const source = (componentInstanceId: number | null, hierarchyPath: string) => ({ componentInstanceId, source: { hierarchyPath } });
const identity = (componentInstanceId: number): SourceIdentityRow => ({ sourceId: `source-${componentInstanceId}`, componentInstanceId }) as SourceIdentityRow;
const condition = (ownerKey: string, semantics: string, requirement = "Quest") => ({
  conditionId: `${ownerKey}:${semantics}`, ownerKey, semantics, payload: { groups: [{ requirements: [{ requirementType: requirement }] }] }, provenance: [reference],
}) as NormalizedCondition;

// Two chests under sibling roots whose names share a prefix, a spawner beside the first chest, and toggles that
// target the first root, the first chest, and the spawner.
function context(snapshotId: string) {
  const world = {
    interactions: [
      { source: source(1, "A[1]/Chest[0]"), family: "interactableObject" },
      { source: source(2, "A[10]/Chest[0]"), family: "interactableObject" },
    ],
    conditionSources: [
      { source: source(3, "Toggle[0]"), family: "activeRequirement", requirementSource: { value: 0, name: "Template" }, targetSource: source(null, "A[1]") },
      { source: source(4, "Toggle[1]"), family: "disableRequirement", targetSource: source(null, "A[1]/Chest[0]") },
      { source: source(5, "Toggle[2]"), family: "timedActiveRequirement", activationDurationSeconds: 12, targetSource: source(null, "A[1]") },
      { source: source(6, "Toggle[3]"), family: "enhancedInteractableObject", targetSource: source(null, "A[1]/Spawner[1]") },
      { source: source(null, "Toggle[4]"), family: "activeRequirement", requirementSource: { value: 1, name: "RequirementGroup" }, targetSource: source(null, "A[1]/Spawner[1]") },
    ],
    resourceProducers: [], containers: [], questZones: [], transitions: [], services: [], mapZones: [], regions: [], mapIcons: [], unsupportedSources: [],
  };
  const producers = [
    { componentInstanceId: 7, source: { hierarchyPath: "A[1]/Spawner[1]" }, conditions: { selectedConditionSource: "inline-requirement-groups" } },
    { componentInstanceId: 8, source: { hierarchyPath: "B[0]/Spawner[0]" }, conditions: { selectedConditionSource: "none" } },
  ];
  return { snapshotId, sourceByComponent: new Map([1, 2, 3, 4, 5, 6, 7, 8].map((id) => [id, identity(id)])), world, npc: { producers, adventurerProducers: [], adventurerPopulationManagers: [] } } as unknown as SceneContext;
}

const conditions = (snapshotId: string) => [
  condition("source:source-1", "requirements-template"),
  condition("source:source-3", "activation-requirement"), condition("source:source-3", "requirements", "Level"),
  condition("source:source-4", "activation-requirement"), condition("source:source-5", "activation-requirement"),
  condition("source:source-6", "activation-requirements"), condition("source:source-6", "deactivation-requirements", "Effect"),
  condition(`${snapshotId}:conditionSources:4`, "requirements", "Class"), condition(`${snapshotId}:conditionSources:4`, "activation-requirement", "Stat"),
  condition("source:source-7", "inline-requirements"), condition("source:source-7", "requirements-template", "Item"),
  condition("source:source-8", "requirements-template", "Item"),
];

const rules = (gates: readonly NormalizedSourceGate[], sourceId: string) =>
  gates.filter((gate) => gate.sourceId === sourceId).map((gate) => [gate.effect, gate.viaSourceId, gate.durationSeconds, gate.conditionId]).sort();

test("applies own requirements and every toggle above a source, reading only the requirement set each component selects", () => {
  const blockers: Blocker[] = [];
  const gates = collectSourceGates([context("s1")], conditions("s1"), blockers);
  expect(rules(gates, "source-1")).toEqual([
    ["excludes", "source-4", null, "source:source-4:activation-requirement"],
    ["requires", "source-1", null, "source:source-1:requirements-template"],
    ["requires", "source-3", null, "source:source-3:activation-requirement"],
    ["temporary", "source-5", 12, "source:source-5:activation-requirement"],
  ]);
  expect(rules(gates, "source-7")).toEqual([
    ["excludes", "source-6", null, "source:source-6:deactivation-requirements"],
    ["requires", null, null, "s1:conditionSources:4:requirements"],
    ["requires", "source-3", null, "source:source-3:activation-requirement"],
    ["requires", "source-6", null, "source:source-6:activation-requirements"],
    ["requires", "source-7", null, "source:source-7:inline-requirements"],
    ["temporary", "source-5", 12, "source:source-5:activation-requirement"],
  ]);
  expect(rules(gates, "source-2")).toEqual([]);
  expect(rules(gates, "source-8")).toEqual([]);
  expect(blockers).toEqual([]);
});

test("merges a toggle observed in two contexts into one rule per source", () => {
  const gates = collectSourceGates([context("s1"), context("s2")], [...conditions("s1"), ...conditions("s2")], []);
  expect(gates.filter((gate) => gate.sourceId === "source-7" && gate.viaSourceId === null)).toHaveLength(1);
  expect(gates).toHaveLength(collectSourceGates([context("s1")], conditions("s1"), []).length);
});

test("ignores conditions without requirements", () => {
  expect(collectSourceGates([context("s1")], [{ ...condition("source:source-1", "requirements-template"), payload: { groups: [] } }], [])).toEqual([]);
});

test("records an unknown spawner condition source instead of guessing its requirement set", () => {
  const unknown = context("s1");
  unknown.npc.producers = [{ ...unknown.npc.producers[0]!, conditions: { selectedConditionSource: "scripted" } }] as typeof unknown.npc.producers;
  const blockers: Blocker[] = [];
  const gates = collectSourceGates([unknown], conditions("s1"), blockers);
  expect(rules(gates, "source-7").some((rule) => rule[1] === "source-7")).toBe(false);
  expect(blockers).toMatchObject([{ kind: "unsupported-enum", key: "source:source-7:selectedConditionSource" }]);
});
