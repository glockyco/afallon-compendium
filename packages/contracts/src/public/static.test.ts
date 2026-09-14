import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import {
  StaticCoverageSchema,
  StaticRootManifestSchema,
  assertStaticResourceIdentity,
  type StaticCoverage,
  type StaticRootManifest,
} from "./index";

const reference = { path: "resources/value.json", sha256: "a".repeat(64), bytes: 10, schemaId: "compendium.static-coverage.v1" };
const root: StaticRootManifest = {
  schemaVersion: "compendium.static-root.v1",
  buildId: "build",
  catalogId: "b".repeat(64),
  mode: "preview",
  complete: false,
  maps: [],
  entitySearch: { ...reference, schemaId: "compendium.static-entity-search.v1" },
  itemSearch: { ...reference, schemaId: "compendium.static-item-search.v1" },
  coverage: reference,
};
const coverage: StaticCoverage = {
  schemaVersion: "compendium.static-coverage.v1",
  buildId: root.buildId,
  catalogId: root.catalogId,
  complete: false,
  unresolvedIssueCount: 1,
  occurrenceCount: 2,
  exclusionCount: 0,
  messages: ["Incomplete preview."],
};

test("accepts matching sharded publication identities", () => {
  Assert(StaticRootManifestSchema, root);
  Assert(StaticCoverageSchema, coverage);
  expect(() => assertStaticResourceIdentity(root, coverage)).not.toThrow();
});

test("rejects mismatched build, catalog, schema, and resource identities", () => {
  expect(() => assertStaticResourceIdentity(root, { ...coverage, buildId: "other" })).toThrow("build mismatch");
  expect(() => assertStaticResourceIdentity(root, { ...coverage, catalogId: "c".repeat(64) })).toThrow("catalog mismatch");
  expect(() => Assert(StaticCoverageSchema, { ...coverage, schemaVersion: "compendium.static-coverage.v2" })).toThrow();
  expect(() => Assert(StaticRootManifestSchema, { ...root, coverage: { ...root.coverage, sha256: "not-a-hash" } })).toThrow();
});
