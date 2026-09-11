import { expect, test } from "bun:test";
import { openIdentityDatabase, recordPlacementIdentities } from "./identity-store";
import type { PlacementIdentityResult } from "./placement-contracts";

function fixture(): PlacementIdentityResult {
  const identities: PlacementIdentityResult["identities"] = [];
  for (let i = 0; i < 4; i++) {
    identities.push({
      sourceId: `source-${i}`, placementId: `placement-${i}`,
      componentInstanceId: i + 10, gameObjectInstanceId: i + 100,
      origin: i < 2 ? "scene" : "streamed-prefab",
      sceneSourceSha256: "a".repeat(64), sourceSha256: (i < 2 ? "a" : "b").repeat(64),
      serializedFile: i < 2 ? "level1" : "CAB-prefab",
      gameObjectPathId: i < 2 ? String(i + 1) : "-9223372036854775807",
      componentPathId: i < 2 ? String(i + 20) : "9223372036854775806",
      loaderSourceId: i < 2 ? null : `source-${i - 2}`,
      typeName: i < 2 ? "AddressableLoader" : "NPCSpawner", assembly: "Assembly-CSharp",
      position: { x: i, y: 0, z: 0 },
    });
  }
  return { schemaVersion: "compendium.placement-identities.v1", buildId: "build", sceneNativeId: 1, scenePath: "Assets/World.unity", snapshotFrame: 1, identities, unresolved: [] };
}
const context = { runId: "first", snapshotId: "first:", snapshotPrefix: "", snapshotSha256: "c".repeat(64), character: "Research", sceneHandle: 1 };

test("SQLite preserves shared prefab instances and separates repeat observations", () => {
  const db = openIdentityDatabase(":memory:");
  try {
    const first = fixture();
    recordPlacementIdentities(db, context, first);
    const next = structuredClone(first);
    for (const row of next.identities) { row.componentInstanceId += 1000; row.gameObjectInstanceId += 1000; row.position.x += 1; }
    recordPlacementIdentities(db, { ...context, runId: "second", snapshotId: "second:", sceneHandle: 2 }, next);
    expect(db.query("SELECT count(*) AS n FROM placement_identities").get()).toEqual({ n: 4 });
    expect(db.query("SELECT count(*) AS n FROM source_observations").get()).toEqual({ n: 8 });
    expect(db.query("SELECT game_object_path_id FROM placement_identities WHERE placement_id = 'placement-2'").get()).toEqual({ game_object_path_id: "-9223372036854775807" });
    const duplicate = fixture();
    duplicate.identities[0]!.placementId = "different-id-same-authored-object";
    expect(() => recordPlacementIdentities(db, { ...context, runId: "duplicate", snapshotId: "duplicate:" }, duplicate)).toThrow();
    expect(db.query("SELECT count(*) AS n FROM identity_runs").get()).toEqual({ n: 2 });
  } finally { db.close(); }
});

test("one traversal run can record multiple scene steps", () => {
  const db = openIdentityDatabase(":memory:");
  try {
    const first = fixture();
    const second = structuredClone(first);
    recordPlacementIdentities(db, { ...context, snapshotId: "first:steps/0", snapshotPrefix: "steps/0" }, first);
    recordPlacementIdentities(db, { ...context, snapshotId: "first:steps/1", snapshotPrefix: "steps/1", snapshotSha256: "d".repeat(64), sceneHandle: 2 }, second);
    expect(db.query("SELECT run_id, snapshot_prefix FROM identity_runs ORDER BY snapshot_id").all()).toEqual([
      { run_id: "first", snapshot_prefix: "steps/0" },
      { run_id: "first", snapshot_prefix: "steps/1" },
    ]);
    expect(db.query("SELECT count(*) AS n FROM source_observations").get()).toEqual({ n: 8 });
  } finally { db.close(); }
});

test("a missing deferred loader rolls back identities and observations together", () => {
  const db = openIdentityDatabase(":memory:");
  try {
    const invalid = fixture();
    invalid.identities[3]!.loaderSourceId = "missing-loader";
    expect(() => recordPlacementIdentities(db, context, invalid)).toThrow();
    for (const table of ["identity_scenes", "placement_identities", "source_identities", "identity_runs", "source_observations"]) {
      expect(db.query(`SELECT count(*) AS n FROM ${table}`).get()).toEqual({ n: 0 });
    }
    recordPlacementIdentities(db, context, fixture());
    expect(db.query("SELECT count(*) AS n FROM source_identities").get()).toEqual({ n: 4 });
    expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
  } finally { db.close(); }
});
