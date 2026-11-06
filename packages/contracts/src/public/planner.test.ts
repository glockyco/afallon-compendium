import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import { StaticPlannerSchema, type StaticPlanner } from "./planner";
import { staticResourceSchema } from "./resources";

const condition = { id: null, semantics: null, sourceFieldPath: null, groups: null, gaps: ["condition-not-recorded"] };
const value: StaticPlanner = {
  schemaVersion: "compendium.static-planner.v1", buildId: "25653798", catalogId: "a".repeat(64), races: [], classes: [], pointTypes: [], gaps: [],
  trees: [{ key: "talentTrees:0", name: "Tree", pointType: null, tiers: 2, slotsPerTier: 3, gaps: ["point-type-unresolved"], nodes: [{
    index: 0, kind: "bonus", target: { key: "bonuses:0", name: "Bonus" }, tier: 1, row: 1, rankLimit: 3, defaultRank: 1,
    ranks: [1, 25, 0].map((authoredCost, index) => ({ rank: index + 1, authoredCost, text: ["Authored text", "", "After a blank line"], rawData: { rank: index, unlockCost: authoredCost }, useEffectCondition: condition })),
    purchaseCondition: { ...condition, id: "optional", groups: [{ checkCount: true, requiredCount: 2, requirements: [{ requirementType: "Bonus", amount1: 4, boolBalue1: true }] }], gaps: [] }, gaps: [],
  }] }],
};

test("registers the independent planner resource and retains cost/default/unknown distinctions", () => {
  expect(staticResourceSchema(value.schemaVersion)).toBe(StaticPlannerSchema);
  Assert(StaticPlannerSchema, value);
  const partial = structuredClone(value);
  partial.trees[0]!.nodes[0]!.defaultRank = null;
  partial.trees[0]!.nodes[0]!.ranks[0]!.authoredCost = null;
  Assert(StaticPlannerSchema, partial);
  expect(partial.trees[0]?.nodes[0]?.ranks[2]?.authoredCost).toBe(0);
});

test("rejects invalid versions and invented contract fields while retaining raw future operands", () => {
  expect(() => Assert(StaticPlannerSchema, { ...value, schemaVersion: "compendium.static-planner.v2" })).toThrow();
  expect(() => Assert(StaticPlannerSchema, { ...value, guesses: [] })).toThrow();
  const partial = structuredClone(value);
  partial.trees[0]!.nodes[0]!.purchaseCondition.groups![0]!.requirements[0]!.futureOperand = "unverified";
  Assert(StaticPlannerSchema, partial);
});
