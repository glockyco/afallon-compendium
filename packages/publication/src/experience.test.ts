import { expect, test } from "bun:test";
import { killRoll } from "./experience";

test("a kill roll leaves out the authored maximum unless both bounds are equal", () => {
  expect(killRoll(70, 120)).toEqual({ min: 70, max: 119 });
  expect(killRoll(1, 2)).toEqual({ min: 1, max: 1 });
  expect(killRoll(7, 7)).toEqual({ min: 7, max: 7 });
  expect(killRoll(0, 0)).toEqual({ min: 0, max: 0 });
  expect([killRoll(8, 7), killRoll(-1, 4), killRoll(null, 4)]).toEqual([null, null, null]);
});
