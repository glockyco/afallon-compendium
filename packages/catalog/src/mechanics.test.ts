import { expect, test } from "bun:test";
import type { MechanicsRules } from "@afallon/contracts/catalog";
import type { Blocker } from "./context";
import { normalizeMechanicsRules } from "./mechanics";

const reference = { path: "objects/rules.json", sha256: "a".repeat(64) };
const object = { sha256: "b".repeat(64), bytes: 10 };
const rules = (rule: Partial<MechanicsRules["rules"][number]>): MechanicsRules => ({
  schemaVersion: "compendium.mechanics-rules.v1", buildId: "build", binary: { file: "GameAssembly.dll", sha256: "c".repeat(64) },
  evidence: [{ id: "decompilation", description: "Bounded decompilation", object }],
  rules: [{ id: "hit-award", topic: "character-progression", section: "skill-experience", status: "verified", phrase: "Each hit gives {hitExperience} experience.", operands: { hitExperience: 2 }, links: [], sources: [{ evidence: "decompilation", method: "SkillSystem.OnPlayerAutoAttackHit" }], ...rule }],
});

test("a rule keeps its operands and the evidence object of each cited method", () => {
  const [row] = normalizeMechanicsRules(rules({}), reference, new Map(), []);
  expect([row?.operands, row?.sources]).toEqual([{ hitExperience: 2 }, [{ method: "SkillSystem.OnPlayerAutoAttackHit", description: "Bounded decompilation", object }]]);
});

test("a phrase operand without a value and an unknown evidence id stop the build", () => {
  expect(() => normalizeMechanicsRules(rules({ operands: {} }), reference, new Map(), [])).toThrow("names operands [hitExperience] without values");
  expect(() => normalizeMechanicsRules(rules({ sources: [{ evidence: "missing", method: "M" }] }), reference, new Map(), [])).toThrow("cites unknown evidence missing");
});

test("a link to a missing record is a coverage issue and keeps its key as the label", () => {
  const blockers: Blocker[] = [];
  const [row] = normalizeMechanicsRules(rules({ links: ["stats:33", "stats:99"] }), reference, new Map([["stats:33", "Experience Bonus"]]), blockers);
  expect(row?.links).toEqual([{ entityKey: "stats:33", label: "Experience Bonus" }, { entityKey: null, label: "stats:99" }]);
  expect(blockers.map((blocker) => blocker.key)).toEqual(["mechanics:hit-award:stats:99"]);
});
