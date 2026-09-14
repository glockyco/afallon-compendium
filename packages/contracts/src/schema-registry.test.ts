import { expect, test } from "bun:test";
import { Type } from "typebox";
import { CanonicalJsonError, canonicalJson, canonicalJsonSha256 } from "./canonical-json";
import { ContractDecodeError, decodeContract } from "./decode";
import { SchemaRegistry, schemaRegistry } from "./schema-registry";

test("canonical JSON is independent of object key order", () => {
  const left = { z: [3, { b: true, a: null }], a: "value" };
  const right = { a: "value", z: [3, { a: null, b: true }] };
  expect(canonicalJson(left)).toBe(canonicalJson(right));
  expect(canonicalJsonSha256(left)).toBe(canonicalJsonSha256(right));
  expect(canonicalJsonSha256(null)).toBe("74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b");
});

test("canonical JSON rejects values that JSON would lose or coerce", () => {
  expect(() => canonicalJson({ missing: undefined })).toThrow(CanonicalJsonError);
  expect(() => canonicalJson({ value: Number.NaN })).toThrow(CanonicalJsonError);
  expect(() => canonicalJson(new Date())).toThrow(CanonicalJsonError);
  const cycle: { self?: unknown } = {};
  cycle.self = cycle;
  expect(() => canonicalJson(cycle)).toThrow(CanonicalJsonError);
});

test("schema registry produces stable immutable identities", () => {
  const firstRegistry = new SchemaRegistry();
  const secondRegistry = new SchemaRegistry();
  const first = firstRegistry.register("compendium.example.v1", Type.Object({ name: Type.String(), count: Type.Integer() }));
  const second = secondRegistry.register("compendium.example.v1", Type.Object({ count: Type.Integer(), name: Type.String() }));

  expect(first.sha256).toBe(second.sha256);
  expect(Object.isFrozen(first.schema)).toBe(true);
  expect(firstRegistry.require(first.id)).toBe(first);
  expect(() => firstRegistry.register(first.id, first.schema)).toThrow("already registered");
  expect(() => firstRegistry.register("invalid", Type.Null())).toThrow("Invalid schema identity");
});

test("contract decoding identifies the artifact, schema, target, and JSON path", () => {
  const schema = Type.Object({ rows: Type.Array(Type.Object({ nativeId: Type.Integer() })) });
  schemaRegistry.register("compendium.decode-test.v1", schema);

  let observed: unknown;
  try {
    decodeContract(schema, { rows: [{ nativeId: "invalid" }] }, { objectId: "a".repeat(64), target: "sceneSnapshots[2].worldSources" });
  } catch (error) {
    observed = error;
  }

  expect(observed).toBeInstanceOf(ContractDecodeError);
  expect(observed).toMatchObject({
    objectId: "a".repeat(64),
    schemaId: "compendium.decode-test.v1",
    instancePath: "/rows/0/nativeId",
    target: "sceneSnapshots[2].worldSources",
  });
  expect((observed as Error).message).toContain("must be integer");
});
