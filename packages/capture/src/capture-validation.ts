import { Assert, AssertError } from "typebox/value";
import type { Static, TSchema } from "typebox";

export function assertSchema<T extends TSchema>(schema: T, value: unknown, label: string): asserts value is Static<T> {
  try {
    Assert(schema, value);
  } catch (error) {
    if (error instanceof AssertError) {
      throw new TypeError(`${label} does not satisfy its contract: ${error.message}`, { cause: error.cause.errors });
    }
    throw error;
  }
}

export function assertFiniteScalars(value: unknown, label: string, seen = new Set<object>()): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
    return;
  }
  if (value === null || typeof value !== "object") return;
  if (seen.has(value)) throw new TypeError(`${label} must not contain a cycle.`);
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteScalars(item, `${label}[${index}]`, seen));
  } else {
    for (const [key, item] of Object.entries(value)) assertFiniteScalars(item, `${label}.${key}`, seen);
  }
  seen.delete(value);
}

function relativelyEqual(left: number, right: number, tolerance: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));
  return Math.abs(left - right) <= scale * tolerance;
}

export function captureNumbersMatch(left: number, right: number): boolean {
  return relativelyEqual(left, right, 1e-6);
}

export function readinessNumbersMatch(left: number, right: number): boolean {
  return relativelyEqual(left, right, 1e-5);
}
