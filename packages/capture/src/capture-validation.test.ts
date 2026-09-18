import { expect, test } from "bun:test";
import { CapturePlanSchema } from "@afallon/contracts";
import { assertFiniteScalars, assertSchema, captureNumbersMatch, readinessNumbersMatch } from "./capture-validation";

test("readiness accepts a relative difference that capture rejects", () => {
  expect(captureNumbersMatch(1, 1.000005)).toBe(false);
  expect(readinessNumbersMatch(1, 1.000005)).toBe(true);
  expect(captureNumbersMatch(1, 1.0000005)).toBe(true);
  expect(readinessNumbersMatch(1, 1.00002)).toBe(false);
});

test("relative comparisons retain the unit floor and scale by either absolute operand", () => {
  expect(captureNumbersMatch(0, 0.0000005)).toBe(true);
  expect(captureNumbersMatch(0, 0.000002)).toBe(false);
  expect(captureNumbersMatch(-1_000_000, -1_000_001.0000005)).toBe(true);
  expect(captureNumbersMatch(-1_000_001.0000005, -1_000_000)).toBe(true);
  expect(readinessNumbersMatch(-1_000_000, -1_000_005)).toBe(true);
  expect(readinessNumbersMatch(-1_000_000, -1_000_020)).toBe(false);
});

test("finite-scalar errors retain nested object and array context without rejecting shared values", () => {
  const shared = { finite: 3 };
  expect(() => assertFiniteScalars({ first: shared, second: shared, rows: [{ value: Infinity }] }, "Capture geometry observation 2"))
    .toThrow(/Capture geometry observation 2\.rows\[0\]\.value/);
  expect(() => assertFiniteScalars({ rows: [NaN] }, "Capture plan"))
    .toThrow(/Capture plan\.rows\[0\]/);
});

test("finite-scalar checks reject cycles with their traversal context", () => {
  const cyclic: { rows: unknown[] } = { rows: [] };
  cyclic.rows.push(cyclic);
  expect(() => assertFiniteScalars(cyclic, "Capture plan")).toThrow(/Capture plan\.rows\[0\]/);
});

test("schema failures retain caller context and structured cause", () => {
  let failure: unknown;
  try { assertSchema(CapturePlanSchema, {}, "Capture checkpoint"); }
  catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(TypeError);
  expect((failure as TypeError).message).toContain("Capture checkpoint");
  expect((failure as TypeError).cause).toBeDefined();
});
