import { expect, test } from "bun:test";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { queryCatalogCoverage, queryCatalogEntity, queryCatalogImagery, queryCatalogItemSources, queryCatalogMaps, queryCatalogSearch } from "./queries";

test("returns stable ordered catalog records with exact identity", () => {
  const db = openNormalizedDatabase(":memory:");
  try {
    const catalogId = "c".repeat(64);
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run(catalogId, "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?), (?, ?, ?)").run("build", "z-map", "Z", "build", "a-map", "A");
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      "build", "npcs", 2, "npcs:2", "Zulu", null, null, null, "{}", "[]",
      "build", "items", 1, "items:1", "Alpha", null, "Item", null, "{}", "[{\"path\":\"canonical\"}]",
    );
    db.query("INSERT INTO item_sources VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)").run(
      "items:1", "world", "z", "[]", "[]", "{}", "null",
      "items:1", "merchant", "a", "[]", "[]", "{}", "null",
    );
    db.query("INSERT INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)").run(
      "z", "build", "a-map", "captured", "d".repeat(64), 2, "{}", "[]",
      "a", "build", "a-map", "game-map", "b".repeat(64), 1, "{}", "[]",
    );
    const issue = { buildId: "build", kind: "gap", subjectKey: "subject", semanticDiscriminator: "", state: "unresolved" as const, runId: "run", artifactHash: "e".repeat(64), sourceKey: "canonical" };
    recordCoverageIssue(db, { ...issue, recordPath: "records/2", evidence: {} });
    recordCoverageIssue(db, { ...issue, recordPath: "records/1", evidence: {} });

    const queries = [
      () => queryCatalogMaps(db),
      () => queryCatalogSearch(db),
      () => queryCatalogEntity(db, "items:1"),
      () => queryCatalogItemSources(db, "items:1"),
      () => queryCatalogImagery(db, "a-map"),
      () => queryCatalogCoverage(db),
    ];
    for (const query of queries) {
      const first = query();
      expect(query()).toEqual(first);
      expect(first).toMatchObject({ buildId: "build", catalogId });
    }
    expect(queryCatalogMaps(db).records.map((row) => row.mapSpaceId)).toEqual(["a-map", "z-map"]);
    expect(queryCatalogSearch(db).records.map((row) => row.entityKey)).toEqual(["items:1", "npcs:2"]);
    expect(queryCatalogItemSources(db, "items:1").records.map((row) => row.sourceKind)).toEqual(["merchant", "world"]);
    expect(queryCatalogImagery(db, "a-map").records.map((row) => row.kind)).toEqual(["captured", "game-map"]);
    expect(queryCatalogCoverage(db).records).toMatchObject({ occurrenceCount: 2, unresolvedIssues: [{ occurrenceCount: 2 }] });
  } finally { db.close(); }
});
