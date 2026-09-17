import { expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { coverageIssueId, openNormalizedDatabase, populateNormalizedDatabase, recordCoverageIssue } from "./database";
import type { NormalizedDatabaseInput } from "@afallon/contracts/catalog"

test("rejects unset table identities without partially adding definitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: Database | undefined;
  try {
    db = openNormalizedDatabase(join(root, "normalized.sqlite"));
    const reference = { path: "input.json", sha256: "0".repeat(64) };
    const input: NormalizedDatabaseInput = {
      buildId: "test", identityResults: [], entities: [], scenes: [], mapSpaces: [], bindings: [],
      placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [],
      merchantTables: [{ nativeId: 7, name: "Existing stock" }], merchantBindings: [], merchantStock: [],
      lootTables: [{ nativeId: 11, levelBandGear: false }], lootBindings: [], lootEntries: [], linkedNpcRules: [],
      resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [] },
    };
    populateNormalizedDatabase(db, input, []);
    let failure: unknown;
    try {
      populateNormalizedDatabase(db, { ...input, merchantTables: [{ nativeId: 8, name: "Uncommitted stock" }, { nativeId: -1, name: "Unset" }] }, []);
    } catch (error) { failure = error; }
    expect(failure).toMatchObject({ code: "SQLITE_CONSTRAINT_CHECK" });
    expect(db.query("SELECT merchant_table_id FROM merchant_tables ORDER BY merchant_table_id").all()).toEqual([{ merchant_table_id: 7 }]);
    expect(db.query("SELECT loot_table_id FROM loot_tables ORDER BY loot_table_id").all()).toEqual([{ loot_table_id: 11 }]);
  } finally {
    db?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("rolls back authored identities when a later domain constraint fails", () => {
  const db = openNormalizedDatabase(":memory:");
  const reference = { path: "objects/input", sha256: "a".repeat(64) };
  const input: NormalizedDatabaseInput = {
    buildId: "test", identityResults: [{ runId: "run-1", snapshotId: "run-1:target", snapshotPrefix: "target", snapshotSha256: reference.sha256, character: "Research", sceneHandle: 7, result: {
      schemaVersion: "compendium.placement-identities.v1", buildId: "test", sceneNativeId: 3, scenePath: "scene.unity", snapshotFrame: 1,
      identities: [{ sourceId: "source-1", placementId: "placement-1", componentInstanceId: 11, gameObjectInstanceId: 12, origin: "scene", sceneSourceSha256: "b".repeat(64), sourceSha256: "b".repeat(64), serializedFile: "scene", gameObjectPathId: "-12", componentPathId: "-11", loaderSourceId: null, typeName: "NPCSpawner", assembly: "Game", position: { x: 1, y: 2, z: 3 } }], unresolved: [],
    } }], entities: [], scenes: [], mapSpaces: [], bindings: [], placements: [], sources: [], roles: [], regions: [], conditions: [], spawnCandidates: [],
    merchantTables: [{ nativeId: -1, name: "Invalid table" }], merchantBindings: [], merchantStock: [], lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [], questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null, provenance: { plan: reference, profile: reference, sources: [] },
  };
  try {
    expect(() => populateNormalizedDatabase(db, input, [])).toThrow();
    expect(db.query("SELECT count(*) AS count FROM identity_runs").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM source_identities").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM placement_identities").get()).toEqual({ count: 0 });
    expect(db.query("SELECT count(*) AS count FROM normalized_builds").get()).toEqual({ count: 0 });
  } finally { db.close(); }
});

test("stores SQL NULL for a region without a map space", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: Database | undefined;
  try {
    db = openNormalizedDatabase(join(root, "normalized.sqlite"));
    const reference = { path: "input.json", sha256: "0".repeat(64) };
    const input: NormalizedDatabaseInput = {
      buildId: "test", identityResults: [], entities: [],
      scenes: [{ nativeId: 3, path: "scene.unity", name: null }], mapSpaces: [], bindings: [],
      placements: [], sources: [], roles: [],
      regions: [{
        regionId: "region-1", buildId: "test", sceneNativeId: 3, scenePath: "scene.unity",
        name: "Unmapped region", internalName: null, shape: "box",
        worldGeometry: { kind: "box", corners: [[0, 0], [1, 0], [1, 1], [0, 1]] },
        mapSpaceId: null, mapGeometry: null, provenance: [reference],
      }],
      conditions: [], spawnCandidates: [], merchantTables: [], merchantBindings: [], merchantStock: [],
      lootTables: [], lootBindings: [], lootEntries: [], linkedNpcRules: [], resourceYields: [],
      questAssociations: [], transitions: [], itemSources: [], entityDetails: [], sourceDetails: [], patrolPaths: [], sceneSpawns: [], blockers: [], coverageOccurrences: [], exclusions: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [] },
    };

    populateNormalizedDatabase(db, input, []);
    expect(db.query("SELECT map_space_id, map_geometry_json FROM regions WHERE region_id = 'region-1'").get()).toEqual({ map_space_id: null, map_geometry_json: null });
  } finally {
    db?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("creates a strict catalog schema with enforced coverage references", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    expect(db.query<{ strict: number }, []>("SELECT strict FROM pragma_table_list WHERE name = 'coverage_issues'").get()).toEqual({ strict: 1 });
    expect(db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(() => db.query("INSERT INTO coverage_occurrences VALUES (?, ?, ?, ?, ?, ?)").run(
      "a".repeat(64), "b".repeat(64), "c".repeat(64), "source", "records/0", "{}",
    )).toThrow();
  } finally { db.close(); }
});

test("deduplicates semantic issues without using diagnostic wording", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "schema", "{}");
    const base = {
      buildId: "build", kind: "missing-reference", subjectKey: "items:7", semanticDiscriminator: "owner",
      state: "unresolved" as const, runId: "run-1", artifactHash: "a".repeat(64), sourceKey: "items",
    };
    const first = recordCoverageIssue(db, { ...base, recordPath: "records/1", evidence: { detail: "first wording" } });
    const second = recordCoverageIssue(db, { ...base, recordPath: "records/2", evidence: { detail: "different wording" } });
    const duplicate = recordCoverageIssue(db, { ...base, recordPath: "records/1", evidence: { detail: "changed wording" } });
    const distinct = recordCoverageIssue(db, { ...base, subjectKey: "items:8", recordPath: "records/3", evidence: { detail: "first wording" } });

    expect(first.issueId).toBe(second.issueId);
    expect(first.occurrenceId).toBe(duplicate.occurrenceId);
    expect(distinct.issueId).not.toBe(first.issueId);
    expect(coverageIssueId(base)).toBe(first.issueId);
    expect(db.query("SELECT count(*) AS count FROM coverage_issues").get()).toEqual({ count: 2 });
    expect(db.query("SELECT count(*) AS count FROM coverage_occurrences").get()).toEqual({ count: 3 });
  } finally { db.close(); }
});
