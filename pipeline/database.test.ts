import { expect, test } from "bun:test";
import type { Database } from "bun:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openNormalizedDatabase, populateNormalizedDatabase } from "./database";
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
      resourceYields: [], questAssociations: [], transitions: [], itemSources: [], blockers: [], inputCoverage: null,
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
      questAssociations: [], transitions: [], itemSources: [], blockers: [], inputCoverage: null,
      provenance: { plan: reference, profile: reference, sources: [] },
    };

    populateNormalizedDatabase(db, input, []);
    expect(db.query("SELECT map_space_id, map_geometry_json FROM regions WHERE region_id = 'region-1'").get()).toEqual({ map_space_id: null, map_geometry_json: null });
  } finally {
    db?.close();
    await rm(root, { recursive: true, force: true });
  }
});
