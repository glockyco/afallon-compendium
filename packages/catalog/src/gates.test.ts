import { expect, test } from "bun:test";
import { openNormalizedDatabase, recordCoverageIssue } from "./database";
import { evaluateCatalogGate } from "./gates";

function catalog() {
  const db = openNormalizedDatabase(":memory:");
  db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
  db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
  db.query("INSERT INTO source_manifests VALUES (?, ?, ?, ?, ?)").run("canonical", "canonical", "object", "b".repeat(64), "build");
  db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
  db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
  db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
    "placement", "build", 1, "scene", "world", 0, 0, 0, 5, 5, "null", "[]",
  );
  return db;
}

const gate = {
  expectedBuildId: "build",
  expectedCatalogId: "c".repeat(64),
  requiredSourceKeys: ["canonical"],
  spatialBounds: [{ mapSpaceId: "world", minX: 0, minY: 0, maxX: 10, maxY: 10 }],
} as const;

test("counts distinct unresolved issues and never treats preview as release", () => {
  const db = catalog();
  try {
    const issue = {
      buildId: "build", kind: "gap", subjectKey: "items:1", semanticDiscriminator: "owner",
      state: "unresolved" as const, runId: "run", artifactHash: "d".repeat(64), sourceKey: "canonical",
    };
    recordCoverageIssue(db, { ...issue, recordPath: "records/1", evidence: { detail: "one" } });
    recordCoverageIssue(db, { ...issue, recordPath: "records/2", evidence: { detail: "two" } });

    const preview = evaluateCatalogGate(db, { ...gate, mode: "preview" });
    const release = evaluateCatalogGate(db, { ...gate, mode: "release" });
    expect(preview).toMatchObject({ accepted: true, complete: false, unresolvedIssueCount: 1, occurrenceCount: 2 });
    expect(release.accepted).toBe(false);
  } finally { db.close(); }
});

test("checks catalog identity, references, exclusions, and spatial bounds", () => {
  const db = catalog();
  try {
    db.query("INSERT INTO coverage_exclusions VALUES (?, ?, ?, ?, ?, ?, ?)").run("e".repeat(64), "build", "outside-reviewed-domain", "placement", "outside", "[]", "[]");
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: false, exclusionCount: 1 });
    db.query("DELETE FROM coverage_exclusions").run();
    expect(evaluateCatalogGate(db, { ...gate, mode: "release" })).toMatchObject({ accepted: true, complete: true });
    expect(evaluateCatalogGate(db, { ...gate, mode: "preview", expectedCatalogId: "f".repeat(64), requiredSourceKeys: ["missing"], spatialBounds: [{ ...gate.spatialBounds[0], maxX: 4 }] })).toMatchObject({
      accepted: false,
      catalogMatches: false,
      missingSourceKeys: ["missing"],
      outOfBoundsPlacementIds: ["placement"],
    });
  } finally { db.close(); }
});
