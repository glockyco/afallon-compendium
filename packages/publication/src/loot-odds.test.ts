import { expect, test } from "bun:test";
import { lootItemProbability, type LootOddsTable } from "./loot-odds";

const npc = (entries: LootOddsTable["entries"], minimum = 0, limit?: number): LootOddsTable =>
  ({ mode: "npc", gateRate: 100, minimum, limit, entries });

const boss = npc([15, 15, 15, 10, 10, 15, 15, 15, 12].map((rate, index) => ({ itemKey: String(index === 0 ? 410 : index), rate })), 1, 2);
const earlierWorld: LootOddsTable = {
  mode: "world", gateRate: 30, minimum: 0, limit: 2,
  entries: [0.79999995, 0.5, 0.01, 0.79999995, 0.5, 1, 1, 1, 0.01, 0.01, 0.01, 0.01, 0.59999996]
    .map((rate, index) => ({ itemKey: `prior:${index}`, rate })),
};
// Accepted catalog table 142 at level 10 has 49 eligible rows. Items 46–48 have nonpositive level requirements
// and must remain eligible, as confirmed by native code and live RollTableLoot picks.
const levelTenRates = "0:4,5:4,6:4,8:2.5,9:2.5,10:4,11:4,12:4,13:4,14:4,15:4,16:4,17:4,18:4,19:4,20:4,21:4,24:2.5,25:4,26:4,27:4,28:4,29:4,30:4,31:4,32:4,33:2.5,35:3,37:3,39:3,41:3,43:3,45:3,46:3,47:3,48:2,49:4,52:4,54:4,55:4,56:4,57:2,58:1.25,59:1.25,60:1.25,63:1.25,64:1.25,65:1.25,66:1.25";
const shieldEntries = levelTenRates.split(",").map((part) => {
  const [index, rate] = part.split(":").map(Number);
  return { itemKey: index === 41 ? "815" : `world:${index}`, rate: rate! };
});
const shieldWorld: LootOddsTable = { mode: "world", gateRate: 5, minimum: 1, limit: 2, entries: shieldEntries };
const shieldObject: LootOddsTable = { ...shieldWorld, mode: "object", gateRate: 100 };

test("boss independently rolls nine entries before weighted minimum and cap", () => {
  expect(lootItemProbability([boss], "410")).toBeCloseTo(0.1830531362382172, 12);
  expect(lootItemProbability([boss], "410", { lootChance: 50 })).toBeCloseTo(0.15236581481967215, 12);
  // A late entry is prevented by two earlier successes, rather than weighted against them.
  expect(lootItemProbability([npc([{ itemKey: "a", rate: 100 }, { itemKey: "b", rate: 100 }, { itemKey: "target", rate: 100 }], 0, 2)], "target")).toBe(0);
});

test("creature gates truncate the random draw, world and object gates do not", () => {
  expect(lootItemProbability([{ ...npc([{ itemKey: "x", rate: 100 }]), gateRate: 5 }], "x")).toBeCloseTo(0.06, 12);
  expect(lootItemProbability([{ ...npc([{ itemKey: "x", rate: 100 }]), gateRate: 5.5 }], "x")).toBeCloseTo(0.06, 12);
  expect(lootItemProbability([{ mode: "object", gateRate: 5, minimum: 0, entries: [{ itemKey: "x", rate: 100 }] }], "x", { lootChance: 50 })).toBeCloseTo(0.05, 12);
  expect(lootItemProbability([{ ...shieldObject, gateRate: 12.5 }], "815")).toBeCloseTo(0.125 * 0.02459213239254054, 12);
});

test("level-ten shield respects earlier world occupancy and the shared cap", () => {
  expect(lootItemProbability([earlierWorld, shieldWorld], "815", { worldLimit: 2 })).toBeCloseTo(0.001219089739240664, 12);
  expect(lootItemProbability([earlierWorld, shieldWorld], "815", { worldLimit: 2, lootChance: 50 })).toBeCloseTo(0.0011505591598822977, 12);
  expect(lootItemProbability([shieldObject], "815")).toBeCloseTo(0.02459213239254054, 12);
  expect(lootItemProbability([shieldObject], "815", { lootChance: 50, worldLimit: 0 })).toBeCloseTo(0.02459213239254054, 12);
  expect(lootItemProbability([earlierWorld, shieldObject], "815", { worldLimit: 0 })).toBeCloseTo(0.02459213239254054, 12);
  expect(() => lootItemProbability([shieldWorld], "815")).toThrow("worldLimit");
  expect(lootItemProbability([earlierWorld, shieldWorld], "815", { worldLimit: 0 })).toBe(0);
});

test("a large authored table remains exact without enumerating entry subsets", () => {
  const entries = Array.from({ length: 74 }, (_, index) =>
    ({ itemKey: index === 73 ? "target" : `other:${index}`, rate: index === 0 ? 100 : index === 73 ? 3 : 1 }));
  expect(lootItemProbability([npc(entries, 0, 2)], "target")).toBeCloseTo(0.03 * 0.99 ** 72, 12);
});

test("two minimum picks remove selected indices and respect weighted remaining rows", () => {
  const rows = npc([{ itemKey: "other", rate: 100 }, { itemKey: "target", rate: 0 }, { itemKey: "other2", rate: 0 }], 2, 2);
  expect(lootItemProbability([rows], "target")).toBeCloseTo(0.5, 12);
  const noOrdinary = npc([{ itemKey: "target", rate: 0 }, { itemKey: "other", rate: 0 }, { itemKey: "another", rate: 0 }], 2, 2);
  expect(lootItemProbability([noOrdinary], "target")).toBeCloseTo(2 / 3, 12);
  expect(lootItemProbability([{ ...noOrdinary, limit: 1 }], "target")).toBeCloseTo(1 / 3, 12);
  const catalogMinTwo = npc([100, 5, 5, 5, 5, 5, 5, 5, 5, 5, 2, 3, 5, 3, 3, 3, 1, 1, 1]
    .map((rate, index) => ({ itemKey: index === 18 ? "target" : String(index), rate })), 2, 2);
  // Table 40: its guaranteed first success leaves one slot. The last row
  // succeeds ordinarily only if all preceding non-guaranteed rows fail.
  const noEarlierSuccess = 0.95 ** 10 * 0.98 * 0.97 ** 4 * 0.99 ** 2;
  expect(lootItemProbability([catalogMinTwo], "target")).toBeCloseTo(noEarlierSuccess * (0.01 + 0.99 / 67), 12);
});

test("duplicate rows and tables return a union, not a sum of marginals", () => {
  const duplicates = npc([{ itemKey: "x", rate: 50 }, { itemKey: "x", rate: 50 }]);
  expect(lootItemProbability([duplicates], "x")).toBeCloseTo(0.75, 12);
  expect(lootItemProbability([duplicates, duplicates], "x")).toBeCloseTo(0.9375, 12);
  const capped = npc([{ itemKey: "x", rate: 50 }, { itemKey: "other", rate: 100 }, { itemKey: "x", rate: 100 }], 0, 1);
  expect(lootItemProbability([capped], "x")).toBeCloseTo(0.5, 12);
});

test("ineligible and zero-rate rows never roll ordinarily but zero rate remains in minimum weights", () => {
  const rows = npc([{ itemKey: "x", rate: 0 }, { itemKey: "other", rate: 0 }, { itemKey: "x", rate: 100, eligible: false }], 1, 1);
  expect(lootItemProbability([rows], "x")).toBeCloseTo(0.5, 12);
  expect(lootItemProbability([{ ...rows, minimum: 0 }], "x")).toBe(0);
  expect(lootItemProbability([npc([{ itemKey: "x", rate: 100, eligible: false }], 1)], "x")).toBe(0);
  expect(() => lootItemProbability([npc([{ itemKey: "x", rate: 100 }], 3)], "x")).toThrow("minimums from 0 to 2");
});
