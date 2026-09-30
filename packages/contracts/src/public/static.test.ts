import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import { CatalogPlanSchema } from "../catalog/plans";
import {
  StaticCoverageSchema,
  PublicationPlanSchema,
  StaticRootManifestSchema,
  assertPublicationPresentation,
  assertStaticResourceIdentity,
  type StaticCoverage,
  type StaticRootManifest,
} from "./index";

const reference = { path: "resources/value.json", sha256: "a".repeat(64), bytes: 10, schemaId: "compendium.static-coverage.v3" };
const release = { version: "0.16.2.1", dataDate: "2026-09-28", patchNotes: { title: "Afallon 0.16.2.1", url: "https://store.steampowered.com/news/app/2597810/view/1844115010501029", date: "2026-09-21" } };
const root: StaticRootManifest = {
  schemaVersion: "compendium.static-root.v8",
  buildId: "build",
  catalogId: "b".repeat(64),
  mode: "preview",
  complete: false,
  release,
  world: { mapSpaceId: "world", label: "Afallon", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, offsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], unplacedMapSpaceIds: [] },
  maps: [],
  kinds: [{ kind: "items", label: "Item", plural: "Items", route: "items", icon: "item", pages: true, list: true, searchable: true, columns: [], facets: [] }],
  lists: { items: [{ ...reference, schemaId: "compendium.static-kind-list.v5" }] },
  search: [{ ...reference, schemaId: "compendium.static-search.v6" }],
  coverage: reference,
  exclusions: { ...reference, schemaId: "compendium.static-exclusions.v1" },
};
const coverage: StaticCoverage = {
  schemaVersion: "compendium.static-coverage.v3",
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
  // The root links only the store article of a Steam news item, never another site.
  expect(() => Assert(StaticRootManifestSchema, { ...root, release: { ...release, patchNotes: { ...release.patchNotes, url: "https://example.com/news/app/2597810/view/1" } } })).toThrow();
});

test("publication plans accept only immutable inputs and one reviewed captured map space", () => {
  const content = { sha256: "a".repeat(64), bytes: 10 };
  const catalogPlan = { schemaVersion: "compendium.catalog-plan.v2", buildId: "build", scans: [content], canonicalTarget: { manifest: content, targetIdentity: "current-scene" }, spatialProfile: content, imagery: [content], coverageReview: content, mechanicsRules: content };
  Assert(CatalogPlanSchema, catalogPlan);
  expect(() => Assert(CatalogPlanSchema, { ...catalogPlan, catalogPath: "normalized.sqlite" })).toThrow();
  const ambiguousCatalogPlan: Partial<typeof catalogPlan> = { ...catalogPlan };
  delete ambiguousCatalogPlan.canonicalTarget;
  expect(() => Assert(CatalogPlanSchema, ambiguousCatalogPlan)).toThrow();
  const plan = { schemaVersion: "compendium.publish-plan.v3", buildId: "build", catalog: { manifest: content, object: content, catalogId: "b".repeat(64) }, mode: "preview", presentation: content, release: { version: "0.16.2.1", dataDate: "2026-09-28", releaseNotes: content } };
  Assert(PublicationPlanSchema, plan);
  expect(() => Assert(PublicationPlanSchema, { ...plan, catalogPath: "catalog.sqlite" })).toThrow();
  expect(() => Assert(PublicationPlanSchema, { ...plan, release: { ...plan.release, dataDate: "28 September 2026" } })).toThrow();
  const presentation = { schemaVersion: "compendium.publication-presentation.v2", buildId: "build", catalogId: "b".repeat(64), worldOffsets: [{ mapSpaceId: "world-surface", worldX: 0, worldY: 0, source: "native", status: "placed" }], spatialBounds: [{ mapSpaceId: "world-surface", minX: 0, minY: 0, maxX: 1, maxY: 1 }], capturedMapSpaceIds: ["world-surface"], exclusions: [] };
  assertPublicationPresentation(presentation);
  expect(() => assertPublicationPresentation({ ...presentation, capturedMapSpaceIds: ["world-surface", "interior"] })).toThrow();
});

test("each reviewed exclusion names a key, a known reason, and its evidence once", () => {
  const presentation = { schemaVersion: "compendium.publication-presentation.v2", buildId: "build", catalogId: "b".repeat(64), worldOffsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }], spatialBounds: [{ mapSpaceId: "world", minX: 0, minY: 0, maxX: 1, maxY: 1 }], capturedMapSpaceIds: [] };
  const scytheTest = { key: "items:220", reason: "test-record", evidence: "The internal name Scythe test marks a test record." };
  assertPublicationPresentation({ ...presentation, exclusions: [scytheTest] });
  expect(() => assertPublicationPresentation({ ...presentation, exclusions: [{ key: scytheTest.key, reason: scytheTest.reason }] })).toThrow();
  expect(() => assertPublicationPresentation({ ...presentation, exclusions: [{ ...scytheTest, evidence: "" }] })).toThrow();
  expect(() => assertPublicationPresentation({ ...presentation, exclusions: [{ ...scytheTest, reason: "missing-source" }] })).toThrow();
  expect(() => assertPublicationPresentation({ ...presentation, exclusions: [scytheTest, { ...scytheTest, reason: "appearance-option" }] })).toThrow("Publication exclusions repeat a key: items:220.");
  expect(() => assertPublicationPresentation({ ...presentation, exclusions: [scytheTest], schemaVersion: "compendium.publication-presentation.v1" })).toThrow();
});
