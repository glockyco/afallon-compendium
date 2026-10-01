import { expect, test } from "bun:test";
import { killExperience } from "./experience";

const record = (minExperience: number | null, maxExperience: number | null, experienceBonusPerLevel: number | null = 1) => ({ minExperience, maxExperience, experienceBonusPerLevel });

test("a kill roll leaves out the authored maximum unless both bounds are equal, and keeps the level bonus", () => {
  expect(killExperience(record(70, 120))).toEqual({ min: 70, max: 119, perLevel: 1 });
  expect(killExperience(record(1, 2))).toEqual({ min: 1, max: 1, perLevel: 1 });
  expect(killExperience(record(7, 7, 0))).toEqual({ min: 7, max: 7, perLevel: 0 });
  expect(killExperience(record(0, 0, 2))).toEqual({ min: 0, max: 0, perLevel: 2 });
});

test("an unknown or invalid bound or level bonus gives no kill experience", () => {
  expect([killExperience(record(8, 7)), killExperience(record(-1, 4)), killExperience(record(null, 4)), killExperience(record(1, 2, null)), killExperience(record(1, 2, -1))])
    .toEqual([null, null, null, null, null]);
});
