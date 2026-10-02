import { expect, test } from "bun:test";
import type { CatalogRequirement, CatalogRequirementGroup } from "@afallon/contracts/catalog";
import { projectRequirementGroups } from "./projection";

const level = (name: string, amount: number, rule = 0) => ({ type: { value: 13, name: "Level" }, rule: { value: rule, name: "Mandatory" }, label: `level ${amount}`,
  spans: [{ text: `level ${amount}` }], value: { value: 0, name }, amounts: { primary: amount } }) as unknown as CatalogRequirement;
const labels = (group: CatalogRequirementGroup) => projectRequirementGroups([group], () => { throw new Error("no references"); })[0]!.requirements.map((row) => row.label);

test("a lowest and a highest level of an all group read as one range", () => {
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10)] })).toEqual(["levels 1–10"]);
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 7), level("EqualOrBelow", 7)] })).toEqual(["level 7"]);
  // Alternatives and limits under different rules stay separate.
  expect(labels({ mode: "any", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10)] })).toHaveLength(2);
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10, 1)] })).toHaveLength(2);
});
