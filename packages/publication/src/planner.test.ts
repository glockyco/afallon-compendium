import { expect, test } from "bun:test";
import type { CatalogProgression } from "@afallon/contracts/catalog";
import { projectPlanner, type PlannerConditionRow } from "./planner";

function fixture() {
  const endpoint = (entityKey: string) => ({ entityKey, label: entityKey });
  const progression: CatalogProgression = { facts: [
    { entityKey: "races:0", name: "Race", kind: "races", details: { offeredClasses: [endpoint("classes:0")] } },
    { entityKey: "talentTrees:0", name: "Tree", kind: "talentTrees", details: { tiers: 2, slotsPerTier: 3, treePoint: endpoint("treePoints:0") } },
    { entityKey: "bonuses:0", name: "Bonus", kind: "bonuses", details: { learnedByDefault: true, ranks: [1, 25, 0, 215].map((unlockCost, rank) => ({ rank, unlockCost, isEmpty: true, emptyTooltip: `Rank ${rank + 1}`, conditionId: "use", statEffects: [], petStatEffects: [] })) } },
    { entityKey: "treePoints:0", name: "Talent Points", kind: "treePoints", details: { startAmount: 1, maxPoints: 180, gainRules: [{ trigger: { value: 0, name: "characterLevelUp" }, amount: 3, class: null, skill: null, item: null, itemCount: 0, npc: null, weaponTemplateId: null }] } },
    { entityKey: "treePoints:2", name: "Heroic Essence", kind: "treePoints", details: { startAmount: 0, maxPoints: 0, gainRules: [] } },
  ], links: [{ owner: "classes:0", linkKind: "talentTree", linkIndex: 0, target: endpoint("talentTrees:0") },
    { owner: "classes:2", linkKind: "talentTree", linkIndex: 0, target: endpoint("talentTrees:2") }],
  talentNodes: [{ tree: "talentTrees:0", nodeIndex: 4, nodeType: "bonus", target: endpoint("bonuses:0"), tier: 2, row: 3, conditionId: "purchase" }],
  spellbookNodes: [], learners: [], unlocks: [], appliers: [], offeredClasses: [], mechanicsRules: [] };
  const conditions: PlannerConditionRow[] = [
    { id: "purchase", semantics: "requirements-template", sourceFieldPath: "node.template", payload: { groups: [{ checkCount: true, requiredCount: 2, requirements: [{ requirementType: "Bonus", conditionRule: "Optional", bonusID: 0, amount1: 3, boolBalue1: true, value: { value: 2, name: "EqualOrAbove" }, futureOperand: 17 }] }] } },
    { id: "use", semantics: "inline-requirements", sourceFieldPath: "rank.requirements", payload: { groups: [{ checkCount: false, requiredCount: 0, requirements: [{ requirementType: "Effect", effectID: 1 }] }] } },
  ];
  const input = { facts: { progression, abilities: [] }, artByEntity: new Map() };
  const identity = { buildId: "25653798", catalogId: "a".repeat(64) };
  return { input, identity, conditions, project: () => projectPlanner(identity, input, conditions) };
}

test("publishes every authored cost, limit, default and raw optional threshold separately from rank use", () => {
  const value = fixture().project(), node = value.trees[0]!.nodes[0]!;
  expect(value.classes.map((row) => row.key)).toEqual(["classes:0"]);
  expect(value.trees.map((row) => row.key)).toEqual(["talentTrees:0"]);
  expect(node.index).toBe(4);
  expect(node.ranks.map((rank) => [rank.rank, rank.authoredCost])).toEqual([[1, 1], [2, 25], [3, 0], [4, 215]]);
  expect(node.defaultRank).toBe(1);
  expect(node.rankLimit).toBe(4);
  expect(node.purchaseCondition.groups?.[0]?.requiredCount).toBe(2);
  expect(node.purchaseCondition.groups?.[0]?.requirements[0]?.futureOperand).toBe(17);
  expect(node.ranks[1]?.useEffectCondition.groups?.[0]?.requirements[0]?.requirementType).toBe("Effect");
  expect(value.pointTypes[0]?.baseLevelGrant).toEqual({ start: 1, perLevel: 3, positiveCap: 180, rule: "build-25653798-base-talent-points" });
  expect(value.pointTypes[1]?.authoredMaxPoints).toBe(0);
  expect(value.pointTypes[1]?.baseLevelGrant).toBeNull();
});

test("preserves missing ranks, conditions, thresholds, point keys and unsupported predicates as named gaps", () => {
  const data = fixture();
  data.input.facts.progression.facts = data.input.facts.progression.facts.filter((fact) => fact.kind !== "talentTrees" && fact.kind !== "bonuses");
  data.conditions[0]!.payload = { groups: [{ checkCount: true, requirements: [{ requirementType: "Future", conditionRule: "Optional" }] }] };
  const value = data.project(), node = value.trees[0]!.nodes[0]!;
  expect(value.classes[0]?.levels).toBeNull();
  expect(value.classes[0]?.gaps).toContain("level-bounds-missing");
  expect(value.trees[0]?.pointType).toBeNull();
  expect(value.trees[0]?.gaps).toContain("point-type-unresolved");
  expect(node.rankLimit).toBeNull();
  expect(node.defaultRank).toBeNull();
  expect(node.gaps).toContain("node-ranks-missing");
  expect(node.purchaseCondition.gaps).toContain("optional-threshold-missing");
  expect(node.purchaseCondition.gaps).toContain("purchase-predicate-not-verified");
  data.conditions.splice(0);
  expect(data.project().trees[0]?.nodes[0]?.purchaseCondition.gaps).toEqual(["condition-record-missing"]);
});

test("keeps partially recorded ranks without guessing their default or cost", () => {
  const data = fixture();
  const bonus = data.input.facts.progression.facts.find((fact) => fact.kind === "bonuses")!;
  if (bonus.kind !== "bonuses") throw new Error("Missing bonus fixture");
  Reflect.deleteProperty(bonus.details, "learnedByDefault");
  Reflect.deleteProperty(bonus.details.ranks[1]!, "unlockCost");
  const node = data.project().trees[0]!.nodes[0]!;
  expect(node.defaultRank).toBeNull();
  expect(node.rankLimit).toBe(4);
  expect(node.ranks[1]?.authoredCost).toBeNull();
  expect(node.ranks[2]?.authoredCost).toBe(0);
  expect(node.gaps).toContain("default-knowledge-missing");
  expect(node.gaps).toContain("rank-cost-missing");
});

test("does not transfer build-specific base-grant verification to an unknown build", () => {
  const data = fixture();
  data.identity.buildId = "future";
  expect(data.project().pointTypes[0]?.baseLevelGrant).toBeNull();
});
