import { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import { PlacementIdentityResultSchema, type PlacementIdentityResult } from "@afallon/contracts"

export function openIdentityDatabase(path: string): Database {
  const db = new Database(path, { create: true, strict: true });
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS identity_scenes (
        build_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL CHECK(scene_native_id >= 0),
        scene_path TEXT NOT NULL,
        PRIMARY KEY(build_id, scene_native_id),
        UNIQUE(build_id, scene_path)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS placement_identities (
        placement_id TEXT PRIMARY KEY NOT NULL,
        build_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL,
        scene_source_sha256 TEXT NOT NULL,
        source_sha256 TEXT NOT NULL,
        serialized_file TEXT NOT NULL,
        game_object_path_id TEXT NOT NULL,
        origin TEXT NOT NULL CHECK(origin IN ('scene', 'streamed-prefab')),
        loader_source_id TEXT,
        CHECK((origin = 'scene' AND loader_source_id IS NULL) OR
              (origin = 'streamed-prefab' AND loader_source_id IS NOT NULL)),
        UNIQUE(placement_id, build_id, scene_native_id),
        FOREIGN KEY(build_id, scene_native_id) REFERENCES identity_scenes,
        FOREIGN KEY(loader_source_id, build_id, scene_native_id)
          REFERENCES source_identities(source_id, build_id, scene_native_id)
          DEFERRABLE INITIALLY DEFERRED
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS placement_authored_key ON placement_identities (
        build_id, scene_native_id, scene_source_sha256, source_sha256,
        serialized_file, game_object_path_id, COALESCE(loader_source_id, '')
      );
      CREATE TABLE IF NOT EXISTS source_identities (
        source_id TEXT PRIMARY KEY NOT NULL,
        placement_id TEXT NOT NULL,
        build_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL,
        component_path_id TEXT NOT NULL,
        type_name TEXT NOT NULL,
        assembly TEXT NOT NULL,
        UNIQUE(placement_id, component_path_id),
        UNIQUE(source_id, build_id, scene_native_id),
        FOREIGN KEY(placement_id, build_id, scene_native_id)
          REFERENCES placement_identities(placement_id, build_id, scene_native_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS identity_runs (
        snapshot_id TEXT PRIMARY KEY NOT NULL,
        run_id TEXT NOT NULL,
        snapshot_prefix TEXT NOT NULL,
        build_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL,
        snapshot_sha256 TEXT NOT NULL,
        snapshot_frame INTEGER NOT NULL CHECK(snapshot_frame >= 0),
        character TEXT NOT NULL,
        scene_handle INTEGER NOT NULL,
        UNIQUE(snapshot_id, build_id, scene_native_id),
        UNIQUE(run_id, snapshot_prefix),
        FOREIGN KEY(build_id, scene_native_id) REFERENCES identity_scenes
      ) STRICT;
      CREATE TABLE IF NOT EXISTS source_observations (
        snapshot_id TEXT NOT NULL,
        build_id TEXT NOT NULL,
        scene_native_id INTEGER NOT NULL,
        component_instance_id INTEGER NOT NULL,
        game_object_instance_id INTEGER NOT NULL,
        source_id TEXT,
        x REAL,
        y REAL,
        z REAL,
        unresolved_reason TEXT,
        unresolved_detail TEXT,
        candidates_json TEXT,
        PRIMARY KEY(snapshot_id, component_instance_id),
        UNIQUE(snapshot_id, source_id),
        CHECK((source_id IS NOT NULL AND x IS NOT NULL AND y IS NOT NULL AND z IS NOT NULL
               AND unresolved_reason IS NULL AND unresolved_detail IS NULL AND candidates_json IS NULL)
           OR (source_id IS NULL AND x IS NULL AND y IS NULL AND z IS NULL
               AND unresolved_reason IS NOT NULL AND unresolved_detail IS NOT NULL AND candidates_json IS NOT NULL)),
        FOREIGN KEY(snapshot_id, build_id, scene_native_id)
          REFERENCES identity_runs(snapshot_id, build_id, scene_native_id),
        FOREIGN KEY(source_id, build_id, scene_native_id)
          REFERENCES source_identities(source_id, build_id, scene_native_id)
      ) STRICT;
    `);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export function identitySnapshotId(runId: string, snapshotPrefix: string): string { return `${runId}:${snapshotPrefix}`; }

export interface IdentityObservationContext {
  runId: string;
  snapshotId: string;
  snapshotPrefix: string;
  snapshotSha256: string;
  character: string;
  sceneHandle: number;
}

export function recordPlacementIdentities(db: Database, context: IdentityObservationContext, result: PlacementIdentityResult): void {
  Assert(PlacementIdentityResultSchema, result);
  if (!context.runId || !context.snapshotId || context.snapshotPrefix === undefined || context.snapshotId !== identitySnapshotId(context.runId, context.snapshotPrefix) || !context.character || !/^[a-f0-9]{64}$/.test(context.snapshotSha256) || !Number.isSafeInteger(context.sceneHandle)) {
    throw new TypeError("Supply a run ID, snapshot identity, step prefix, snapshot SHA-256, character, and integer scene handle.");
  }
  if (db.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get()?.foreign_keys !== 1) {
    throw new Error("Identity storage requires SQLite foreign keys.");
  }
  const scene = db.query(`INSERT INTO identity_scenes VALUES (?, ?, ?)
    ON CONFLICT(build_id, scene_native_id) DO UPDATE SET scene_path =
      CASE WHEN scene_path = excluded.scene_path THEN scene_path ELSE NULL END`);
  const placement = db.query(`INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(placement_id) DO UPDATE SET game_object_path_id = CASE WHEN
      build_id = excluded.build_id AND scene_native_id = excluded.scene_native_id AND
      scene_source_sha256 = excluded.scene_source_sha256 AND source_sha256 = excluded.source_sha256 AND
      serialized_file = excluded.serialized_file AND game_object_path_id = excluded.game_object_path_id AND
      origin = excluded.origin AND loader_source_id IS excluded.loader_source_id
      THEN game_object_path_id ELSE NULL END`);
  const source = db.query(`INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_id) DO UPDATE SET component_path_id = CASE WHEN
      placement_id = excluded.placement_id AND build_id = excluded.build_id AND
      scene_native_id = excluded.scene_native_id AND component_path_id = excluded.component_path_id AND
      type_name = excluded.type_name AND assembly = excluded.assembly
      THEN component_path_id ELSE NULL END`);
  const run = db.query("INSERT INTO identity_runs (snapshot_id, run_id, snapshot_prefix, build_id, scene_native_id, snapshot_sha256, snapshot_frame, character, scene_handle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const observation = db.query("INSERT INTO source_observations (snapshot_id, build_id, scene_native_id, component_instance_id, game_object_instance_id, source_id, x, y, z, unresolved_reason, unresolved_detail, candidates_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  db.transaction(() => {
    scene.run(result.buildId, result.sceneNativeId, result.scenePath);
    run.run(context.snapshotId, context.runId, context.snapshotPrefix, result.buildId, result.sceneNativeId, context.snapshotSha256, result.snapshotFrame, context.character, context.sceneHandle);
    for (const row of result.identities) {
      placement.run(row.placementId, result.buildId, result.sceneNativeId, row.sceneSourceSha256, row.sourceSha256, row.serializedFile, row.gameObjectPathId, row.origin, row.loaderSourceId);
      source.run(row.sourceId, row.placementId, result.buildId, result.sceneNativeId, row.componentPathId, row.typeName, row.assembly);
      observation.run(context.snapshotId, result.buildId, result.sceneNativeId, row.componentInstanceId, row.gameObjectInstanceId, row.sourceId, row.position.x, row.position.y, row.position.z, null, null, null);
    }
    for (const row of result.unresolved) {
      observation.run(context.snapshotId, result.buildId, result.sceneNativeId, row.componentInstanceId, row.gameObjectInstanceId, null, null, null, null, row.reason, row.detail, JSON.stringify(row.candidates));
    }
  })();
}
