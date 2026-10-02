import { expect, test } from "bun:test";
import type { MechanicsRules } from "@afallon/contracts/catalog";
import type { Blocker } from "./context";
import { normalizeMechanicsRules } from "./mechanics";

const reference = { path: "objects/rules.json", sha256: "a".repeat(64) };
const object = { sha256: "b".repeat(64), bytes: 10 };
const rules = (rule: Partial<MechanicsRules["rules"][number]>): MechanicsRules => ({
  schemaVersion: "compendium.mechanics-rules.v2", buildId: "build", binary: { file: "GameAssembly.dll", sha256: "c".repeat(64) },
  evidence: [{ id: "decompilation", description: "Bounded decompilation", object }],
  rules: [{ id: "hit-award", topic: "character-progression", section: "skill-experience", status: "verified", phrase: "Each hit gives {hitExperience} experience.", operands: { hitExperience: 2 }, links: [], sources: [{ evidence: "decompilation", method: "SkillSystem.OnPlayerAutoAttackHit" }], placements: [], ...rule }],
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

test("a placed rule needs a mechanics guide topic, even when its target is valid", () => {
  expect(() => normalizeMechanicsRules(rules({ topic: undefined, placements: [{ page: "items", target: "crafting", scope: "all" }] }), reference, new Map(), []))
    .toThrow("needs a mechanics guide topic");
  expect(() => normalizeMechanicsRules(rules({ topic: undefined }), reference, new Map(), [])).toThrow("needs a mechanics guide topic");
});

test("a placement that its page lacks stops the build", () => {
  expect(() => normalizeMechanicsRules(rules({ placements: [{ page: "npcs", target: "crafting", scope: "all" }] }), reference, new Map(), [])).toThrow("which npcs pages lack");
  expect(() => normalizeMechanicsRules(rules({ placements: [{ page: "items", target: "crafting", scope: "placed" }] }), reference, new Map(), [])).toThrow("scope placed");
  expect(() => normalizeMechanicsRules(rules({ placements: [{ page: "gatheringNodes", target: "how-it-works", scope: "linked" }] }), reference, new Map(), [])).toThrow("linked scope without links");
});

test("link tokens name every link once, or the phrase names none and closes with its links", () => {
  const links = ["items:142", "items:377"], labels = new Map([["items:142", "Slime Covered Sack"], ["items:377", "Soaked Bag"]]);
  const phrased = (phrase: string) => () => normalizeMechanicsRules(rules({ phrase, operands: {}, links }), reference, labels, []);
  expect(phrased("Using a {#1} or a {#0} opens a chest.")()[0]?.links.map((link) => link.label)).toEqual(["Slime Covered Sack", "Soaked Bag"]);
  expect(phrased("These bags open a chest:")()[0]?.phrase).toBe("These bags open a chest:");
  expect(phrased("Using a {#2} opens a chest.")).toThrow("names links [2] that the rule lacks");
  expect(phrased("Using a {#0} opens a chest.")).toThrow("leaves links [1] out of its sentence");
  expect(phrased("Using a {#0} or a {#0} or a {#1} opens a chest.")).toThrow("names links [0] more than once");
});
