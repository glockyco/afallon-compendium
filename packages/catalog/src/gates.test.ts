import { expect, test } from "bun:test";
import { canonicalJsonSha256, type ContentIdentity } from "@afallon/contracts";
import {
  REQUIRED_GAMEPLAY_COVERAGE_FAMILIES,
  type CoverageAccountingInput, type CoverageDispositionState, type CoverageFamily,
  type CoveragePolicy, type CoverageReview, type VerifiedCoverageInventory,
} from "@afallon/contracts/catalog";
import type { WorldInventory } from "@afallon/contracts";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { computeCoverageAccounting, coverageInventorySubjects, insertCoverageAccounting } from "./coverage-accounting";
import { evaluateCatalogGate } from "./gates";

function identity(document: unknown): ContentIdentity {
  return { sha256: canonicalJsonSha256(document), bytes: Buffer.byteLength(JSON.stringify(document)) };
}

function inventory(): WorldInventory {
  const scene = { name: "scene", path: "scene", buildIndex: 1, handle: 1, isLoaded: true as const, rootCount: 1, currentGameSceneNativeId: 1, nativeIdMatchBasis: "native-id" };
  const totals = { buildScenes: 0, databaseScenes: 0, worldPositions: 0, gameSceneStartPositionReferences: 0, taskSceneReferences: 0, loadedScenes: 1, addressableSources: 0, loadedTransitions: 0, referencedDestinations: 0, componentFamilies: 0, behaviourTypes: 0, behaviourComponents: 0 };
  return {
    schemaVersion: "compendium.world-inventory.v2",
    coverage: {
      dispositionValues: ["currently-loaded"], fullGameCoverage: false, label: "Fixture", scope: "fixture",
      includesInactiveComponents: true, includesLoadedAddressableLoaderComponents: true,
      traversalPerformed: false, capturePerformed: false, publicationPerformed: false, activeScene: scene,
      currentGameScene: null, currentGameSceneError: null, noDisplayNameSceneMapping: true, noNameBasedUnreachableClaims: true,
    },
    runtime: { game: "Afallon", version: "fixture", unityVersion: "fixture", activeScene: "scene", activeScenePath: "scene", buildSceneCount: 0, loadedSceneCount: 1, databaseAvailable: true, databaseError: null },
    buildScenes: [], databaseScenes: [], referencedDestinations: [], transitions: [],
    loadedScenes: [{ sourceFieldPath: "loadedScenes[0]", owner: { nativeType: "SceneManager", collection: "scenes", index: 0 }, disposition: "currently-loaded", scene }],
    addressableSources: [], componentFamilies: [], behaviourTypes: [], sourceTotals: totals, exportedTotals: totals, unresolved: [],
  };
}

function accountingInput(options: { captureRequired?: boolean; source?: WorldInventory } = {}): CoverageAccountingInput {
  const document = options.source ?? inventory();
  const source: VerifiedCoverageInventory = { reference: identity(document), manifest: identity("scan-run-1"), runId: "scan-run-1", targetIdentity: "target-1", inventory: document };
  const policy: CoveragePolicy = {
    schemaVersion: "compendium.coverage-policy.v1", buildId: "build",
    requiredFamilies: [...REQUIRED_GAMEPLAY_COVERAGE_FAMILIES, ...(options.captureRequired ? ["capture" as const] : [])],
    requireCaptures: options.captureRequired ?? false,
    acceptedDispositions: ["verified", "not-applicable", "reviewed-excluded"],
  };
  const evidence = REQUIRED_GAMEPLAY_COVERAGE_FAMILIES.filter((family) => family !== "inventory").map((family) => {
    const document = { schemaVersion: `fixture.${family}.v1`, records: [{ subject: "scene", fact: family }] };
    return { family, subjectKeys: coverageInventorySubjects(source.inventory).map((subject) => subject.subjectKey), reference: identity(document), manifest: source.manifest, runId: source.runId, targetIdentity: source.targetIdentity, document };
  });
  const subjects = coverageInventorySubjects(document);
  const pointer = { artifact: source.reference, runId: source.runId, targetIdentity: source.targetIdentity, recordPath: "/loadedScenes/0" };
  const review: CoverageReview = {
    schemaVersion: "compendium.coverage-review.v1", buildId: "build", reviewer: "fixture-reviewer", policy: identity(policy), inventories: [source.reference],
    closure: { state: "closed", inventories: [source.reference], subjectKeys: [...new Set(subjects.map((subject) => subject.subjectKey))], evidence: [pointer], reason: "Synthetic fixture universe is fully enumerated." },
    decisions: subjects.flatMap((subject) => subject.families.filter((family) => family !== "capture").map((family) => ({
      subjectKey: subject.subjectKey, family, discriminator: "family", state: "verified" as const, reason: "Synthetic fixture family evidence is verified.", outsideRequiredUniverse: false,
      evidence: family === "inventory" ? [{ ...pointer, recordPath: subject.recordPath }] : [{ ...pointer, artifact: evidence.find((item) => item.family === family)!.reference, recordPath: "/records/0" }],
    }))),
  };
  return { buildId: "build", inventories: [source], policy: { reference: identity(policy), document: policy }, review: { reference: identity(review), document: review }, evidence };
}

function catalog(input?: CoverageAccountingInput, empty = false) {
  const db = openNormalizedDatabase(":memory:");
  db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
  db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
  db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
  db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
  if (!empty) {
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("build", "items", 7, "items:7", "Item", null, null, 7, "{}", "[]");
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "placement", "build", 1, "scene", "world", 0, 0, 0, 5, 5, "null", "[]",
    );
  }
  if (input) {
    for (const source of new Map(input.inventories.map((item) => [item.reference.sha256, item])).values()) {
      db.query("INSERT INTO source_manifests VALUES (?, ?, ?, ?, ?)").run(`inventory:${source.reference.sha256}`, "inventory", source.reference.sha256, source.reference.sha256, "build");
    }
    const accounting = computeCoverageAccounting(input);
    db.transaction(() => insertCoverageAccounting(db, accounting))();
  }
  return db;
}

const gate = {
  expectedBuildId: "build", expectedCatalogId: "c".repeat(64), referenceIntegrity: { verified: true, failures: [] },
  spatialBounds: [{ mapSpaceId: "world", minX: 0, minY: 0, maxX: 10, maxY: 10 }],
} as const;

function changeDecision(input: CoverageAccountingInput, family: CoverageFamily, state: CoverageDispositionState, outside = false): void {
  const decision = input.review.document.decisions.find((decision) => decision.family === family)!;
  decision.state = state;
  decision.outsideRequiredUniverse = outside;
  input.review.reference = identity(input.review.document);
}

test("accepts positive fixture closure without requiring optional capture", () => {
  const db = catalog(accountingInput());
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({
      accepted: true, complete: true, closureValid: true, obligationCount: 10,
      requiredObligationCount: 9, unsatisfiedObligationCount: 0, optionalUnsatisfiedObligationCount: 1,
      dispositionCounts: { verified: 9, "not-attempted": 1 },
    });
  } finally { db.close(); }
});

test("keeps required captures independent from verified game-map coverage", () => {
  const db = catalog(accountingInput({ captureRequired: true }));
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, complete: false, closureValid: true, unsatisfiedObligationCount: 1, optionalUnsatisfiedObligationCount: 0 });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" }).accepted).toBe(true);
  } finally { db.close(); }
});

test("rejects empty catalogs and refuses to infer closure from zero issues", () => {
  const empty = catalog(undefined, true);
  const unreviewed = catalog();
  try {
    expect(evaluateCatalogGate(empty, { ...gate, mode: "preview" })).toMatchObject({ accepted: false, nonempty: false, hasCoverageBasis: false });
    expect(evaluateCatalogGate(unreviewed, { ...gate, mode: "release" })).toMatchObject({ accepted: false, complete: false, unresolvedIssueCount: 0, hasCoverageBasis: false });
    expect(evaluateCatalogGate(unreviewed, { ...gate, mode: "preview" }).accepted).toBe(true);
  } finally { empty.close(); unreviewed.close(); }
});

test("an empty reviewed source list cannot establish positive closure", () => {
  const input = accountingInput();
  input.inventories = [];
  input.review.document.inventories = [];
  input.review.document.closure = { state: "closed", inventories: [], subjectKeys: [], evidence: [], reason: "Empty fixture" };
  input.review.document.decisions = [];
  input.review.reference = identity(input.review.document);
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, hasCoverageBasis: false, closureValid: false, obligationCount: 0 });
  } finally { db.close(); }
});

test("enumeration gaps remain blocking even when exported rows receive decisions", () => {
  const source = inventory();
  source.sourceTotals.addressableSources = 2;
  const input = accountingInput({ source });
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, closureValid: false, unsatisfiedObligationCount: 0 });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" }).accepted).toBe(true);
  } finally { db.close(); }
});

test("new registered discovery invalidates a previously closed review", () => {
  const db = catalog(accountingInput());
  try {
    db.query("INSERT INTO source_manifests VALUES (?, ?, ?, ?, ?)").run("inventory:new", "compendium.world-inventory.v2", "new-object", "f".repeat(64), "build");
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, closureValid: false });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" }).accepted).toBe(true);
  } finally { db.close(); }
});

test("derives new source obligations rather than reusing stale subject closure", () => {
  const input = accountingInput();
  const extra = inventory();
  extra.loadedScenes[0]!.scene.path = "new-scene";
  input.inventories = [...input.inventories, { ...input.inventories[0]!, reference: identity(extra), runId: "scan-run-2", manifest: identity("scan-run-2"), inventory: extra }];
  const accounting = computeCoverageAccounting(input);
  expect(accounting.obligations.length).toBe(20);
  expect(accounting.closureValid).toBe(false);
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, closureValid: false, unsatisfiedObligationCount: 9 });
  } finally { db.close(); }
});

test("cannot exclude required reachable gameplay to pass release", () => {
  const input = accountingInput();
  changeDecision(input, "roles", "reviewed-excluded", true);
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unsatisfiedObligationCount: 1, reviewedExclusionCount: 1 });
  } finally { db.close(); }
});

test("accepts attributable outside-gameplay exclusions without erasing their totals", () => {
  const source = inventory();
  source.componentFamilies.push({ sourceFieldPath: "components.Menu", owner: { nativeType: "Menu", query: "all" }, family: "menu", runtimeType: "Menu", disposition: "extracted", activeCount: 1, includeInactiveCount: 1, activeQueryError: null, includeInactiveQueryError: null, includesInactive: true });
  source.sourceTotals.componentFamilies = 1;
  source.exportedTotals.componentFamilies = 1;
  const input = accountingInput({ source });
  const decision = input.review.document.decisions.find((item) => item.subjectKey === "component-family:menu:Menu")!;
  decision.state = "reviewed-excluded";
  decision.outsideRequiredUniverse = true;
  input.review.reference = identity(input.review.document);
  const db = catalog(input);
  try {
    db.query("INSERT INTO coverage_exclusions VALUES (?, ?, ?, ?, ?, ?, ?)").run("e".repeat(64), "build", "outside-reviewed-domain", decision.subjectKey, "Non-gameplay menu component", "[]", "[]");
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: true, reviewedExclusionCount: 1, exclusionCount: 1, unreviewedExclusionCount: 0 });
  } finally { db.close(); }
});

test("requires evidence for not-applicable and retains it as a distinct disposition", () => {
  const input = accountingInput();
  changeDecision(input, "roles", "not-applicable");
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: true, dispositionCounts: { verified: 8, "not-applicable": 1 } });
  } finally { db.close(); }
  input.review.document.decisions.find((decision) => decision.family === "roles")!.evidence = [];
  expect(() => computeCoverageAccounting(input)).toThrow();
});

for (const state of ["unsupported", "unreachable", "failed", "not-attempted"] as const) {
  test(`retains ${state} without treating it as positive evidence`, () => {
    const input = accountingInput();
    changeDecision(input, "roles", state);
    const db = catalog(input);
    try {
      expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unsatisfiedObligationCount: 1, dispositionCounts: { [state]: state === "not-attempted" ? 2 : 1 } });
    } finally { db.close(); }
  });
}

test("repeated observations retain run lineage without multiplying obligations", () => {
  const input = accountingInput();
  input.inventories = [...input.inventories, { ...input.inventories[0]!, runId: "scan-run-2", manifest: identity("scan-run-2") }];
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: true, obligationCount: 10 });
    expect(db.query("SELECT DISTINCT run_id FROM coverage_obligation_origins ORDER BY run_id").all()).toEqual([{ run_id: "scan-run-1" }, { run_id: "scan-run-2" }]);
    const issue = { buildId: "build", kind: "gap", subjectKey: "items:7", semanticDiscriminator: "owner", state: "unresolved" as const, artifactHash: "d".repeat(64), sourceKey: "canonical" };
    recordCoverageIssue(db, { ...issue, runId: "scan-run-1", recordPath: "/records/0", evidence: { detail: "one" } });
    recordCoverageIssue(db, { ...issue, runId: "scan-run-2", recordPath: "/records/1", evidence: { detail: "two" } });
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unresolvedIssueCount: 1, occurrenceCount: 2, obligationCount: 10, unsatisfiedObligationCount: 0 });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" }).accepted).toBe(true);
    expect(db.query("SELECT first_seen_run, last_seen_run FROM coverage_issues").get()).toEqual({ first_seen_run: "scan-run-1", last_seen_run: "scan-run-2" });
  } finally { db.close(); }
});

test("checks effective final rows rather than cached satisfaction", () => {
  const db = catalog(accountingInput());
  try {
    db.query("DELETE FROM coverage_disposition_evidence WHERE disposition_id IN (SELECT d.disposition_id FROM coverage_dispositions d JOIN coverage_obligations o USING (obligation_id) WHERE o.family = 'roles' AND d.effective = 1)").run();
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unsatisfiedObligationCount: 1 });
  } finally { db.close(); }
});

test("does not use unrelated family records or invented lineage as verification", () => {
  const input = accountingInput();
  const role = input.review.document.decisions.find((decision) => decision.family === "roles")!;
  role.evidence = [...input.review.document.closure.evidence];
  expect(() => computeCoverageAccounting(input)).toThrow();
  role.state = "not-applicable";
  role.evidence = [{ ...role.evidence[0]!, runId: "unregistered-run" }];
  expect(() => computeCoverageAccounting(input)).toThrow();
  role.evidence = [{ ...input.review.document.closure.evidence[0]!, recordPath: "/loadedScenes/999" }];
  expect(() => computeCoverageAccounting(input)).toThrow();
});

test("unrelated target evidence cannot satisfy a verified subject", () => {
  const input = accountingInput();
  input.evidence = input.evidence.map((item) => item.family === "roles" ? { ...item, subjectKeys: ["loaded-scene:another-scene"] } : item);
  const db = catalog(input);
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" })).toMatchObject({ accepted: true, complete: false, unsatisfiedObligationCount: 1 });
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unsatisfiedObligationCount: 1 });
  } finally { db.close(); }
});

test("excluded placements allow preview and require an explicit placement review", () => {
  const input = accountingInput();
  const origin = input.review.document.closure.evidence[0]!;
  input.discoveredSubjects = [{ subjectKey: "placement", family: "spatial", gameplay: false, reachable: true, inventoryReferences: [origin.artifact], origins: [origin] }];
  input.review.document.closure.subjectKeys.push("placement");
  input.review.document.decisions.push({ subjectKey: "placement", family: "spatial", discriminator: "family", state: "reviewed-excluded", reason: "Reviewed identity-only placement is outside the gameplay domain.", evidence: [origin], outsideRequiredUniverse: true });
  input.review.reference = identity(input.review.document);
  const db = catalog(input);
  try {
    db.query("UPDATE placements SET map_space_id = NULL, map_x = NULL, map_y = NULL").run();
    db.query("INSERT INTO coverage_exclusions VALUES (?, ?, ?, ?, ?, ?, ?)").run("e".repeat(64), "build", "outside-reviewed-domain", "placement", "Outside the reviewed map domain", "[]", "[]");
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" })).toMatchObject({ accepted: true, outOfBoundsPlacementIds: [] });
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: true, unreviewedExclusionCount: 0 });
    db.query("DELETE FROM coverage_disposition_evidence WHERE disposition_id IN (SELECT disposition_id FROM coverage_dispositions WHERE state = 'reviewed-excluded')").run();
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" })).toMatchObject({ accepted: true, complete: false });
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, unreviewedExclusionCount: 1 });
  } finally { db.close(); }
});

test("preview still requires catalog identity, evidence integrity, and spatial registration", () => {
  const db = catalog(accountingInput());
  try {
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview", expectedCatalogId: "f".repeat(64) })).toMatchObject({ accepted: false, catalogMatches: false });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview", referenceIntegrity: { verified: false, failures: ["Damaged evidence object"] } })).toMatchObject({ accepted: false, referenceIntegrity: false });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview", spatialBounds: [{ ...gate.spatialBounds[0], maxX: 4 }] })).toMatchObject({ accepted: false, outOfBoundsPlacementIds: ["placement"] });
    db.exec("PRAGMA foreign_keys = OFF");
    db.query("UPDATE placements SET scene_native_id = 999").run();
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview" })).toMatchObject({ accepted: false, databaseIntegrity: false });
  } finally { db.close(); }
});
