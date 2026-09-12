import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openNormalizedDatabase, populateNormalizedDatabase } from "./database";
import type { NormalizedDatabaseInput } from "./normalized-contracts";

test("rejects unset table identities without partially adding definitions", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-normalized-"));
  let db: ReturnType<typeof openNormalizedDatabase> | undefined;
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
