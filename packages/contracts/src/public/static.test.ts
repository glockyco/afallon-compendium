import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import { CatalogPlanSchema } from "../catalog/plans";
import {
  StaticCoverageSchema,
  PublicationPlanSchema,
  PublicationPresentationSchema,
  StaticRootManifestSchema,
  assertStaticResourceIdentity,
  type StaticCoverage,
  type StaticRootManifest,
} from "./index";

const reference = { path: "resources/value.json", sha256: "a".repeat(64), bytes: 10, schemaId: "compendium.static-coverage.v2" };
const root: StaticRootManifest = {
  schemaVersion: "compendium.static-root.v4",
  buildId: "build",
  catalogId: "b".repeat(64),
  mode: "preview",
  complete: false,
  world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
  maps: [],
  kinds: [{ kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, searchable: true, columns: [], facets: [] }],
  lists: { items: [{ ...reference, schemaId: "compendium.static-kind-list.v2" }] },
  search: [{ ...reference, schemaId: "compendium.static-search.v4" }],
  coverage: reference,
};
const coverage: StaticCoverage = {
  schemaVersion: "compendium.static-coverage.v2",
  buildId: root.buildId,
  catalogId: root.catalogId,
  pages: [{ kind: "items", count: 1 }],
  mapCount: 1,
  placementCount: 1,
  gaps: [{ gap: "itemWithoutSource", pages: [{ key: "items:1", kind: "items", name: "Peasant Gloves", slug: "peasant-gloves" }] }],
};

test("rejects mismatched build, catalog, schema, and resource identities", () => {
  Assert(StaticRootManifestSchema, root);
  Assert(StaticCoverageSchema, coverage);
  expect(() => assertStaticResourceIdentity(root, { ...coverage, buildId: "other" })).toThrow("build mismatch");
  expect(() => assertStaticResourceIdentity(root, { ...coverage, catalogId: "c".repeat(64) })).toThrow("catalog mismatch");
  expect(() => Assert(StaticCoverageSchema, { ...coverage, schemaVersion: "compendium.static-coverage.v1" })).toThrow();
  expect(() => Assert(StaticRootManifestSchema, { ...root, coverage: { ...root.coverage, sha256: "not-a-hash" } })).toThrow();
});

test("publication plans accept only immutable inputs and one reviewed captured map space", () => {
  const content = { sha256: "a".repeat(64), bytes: 10 };
  const catalogPlan = { schemaVersion: "compendium.catalog-plan.v1", buildId: "build", scans: [content], canonicalTarget: { manifest: content, targetIdentity: "current-scene" }, spatialProfile: content, imagery: [content], coverageReview: content };
  Assert(CatalogPlanSchema, catalogPlan);
  expect(() => Assert(CatalogPlanSchema, { ...catalogPlan, catalogPath: "normalized.sqlite" })).toThrow();
  const ambiguousCatalogPlan: Partial<typeof catalogPlan> = { ...catalogPlan };
  delete ambiguousCatalogPlan.canonicalTarget;
  expect(() => Assert(CatalogPlanSchema, ambiguousCatalogPlan)).toThrow();
  const plan = { schemaVersion: "compendium.publish-plan.v2", buildId: "build", catalog: { manifest: content, object: content, catalogId: "b".repeat(64) }, mode: "preview", presentation: content };
  Assert(PublicationPlanSchema, plan);
  expect(() => Assert(PublicationPlanSchema, { ...plan, catalogPath: "catalog.sqlite" })).toThrow();
  const presentation = { schemaVersion: "compendium.publication-presentation.v1", buildId: "build", catalogId: "b".repeat(64), worldOffsets: [{ mapSpaceId: "world-surface", worldX: 0, worldY: 0, source: "native", status: "placed" }], spatialBounds: [{ mapSpaceId: "world-surface", minX: 0, minY: 0, maxX: 1, maxY: 1 }], capturedMapSpaceIds: ["world-surface"] };
  Assert(PublicationPresentationSchema, presentation);
  expect(() => Assert(PublicationPresentationSchema, { ...presentation, capturedMapSpaceIds: ["world-surface", "interior"] })).toThrow();
});
