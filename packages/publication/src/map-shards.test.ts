import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { generateMapShards } from "./map-shards";

test("keeps map records isolated and stable across equivalent compilations", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-map-shards-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?), (?, ?, ?)").run("build", "a", "Map A", "build", "b", "Map B");
    for (const [id, map, x] of [["placement-a", "a", 1], ["placement-b", "b", 2]] as const) {
      db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", map, x, 0, 0, x, x, id, "null", "[]");
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "d".repeat(64), "e".repeat(64), "scene", String(x), "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(`source-${map}`, id, "build", 1, String(x), "Container", "Assembly-CSharp");
      db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run(id, `source-${map}`, "container", null, "authored", "{}");
    }
    for (const [id, component] of [["icon-a", "10"], ["icon-b", "11"]] as const) {
      db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", "a", 5, 0, 5, 5, 5, null, "null", "[]");
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "d".repeat(64), id.padEnd(64, "0"), "scene", component, "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run(`source-${id}`, id, "build", 1, component, "MapIcon", "Assembly-CSharp");
      db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run(id, `source-${id}`, "mapIcon", null, "town", "{}");
    }
    for (const [id, x] of [["region-a", 0], ["region-b", 0.01]] as const) {
      db.query("INSERT INTO regions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, "build", 1, "scene", "Shared Region", null, "box", JSON.stringify({ corners: [[x, x], [x + 2, x], [x + 2, x + 2], [x, x + 2]] }), "a", JSON.stringify({ corners: [[x, x], [x + 2, x], [x + 2, x + 2], [x, x + 2]] }), "[]");
    }
    const store = new ArtifactStore(join(root, "objects"));
    const first = await generateMapShards(db, store);
    const second = await generateMapShards(db, store);
    expect(first.map((map) => map.resources.map((part) => part.identity.sha256))).toEqual(second.map((map) => map.resources.map((part) => part.identity.sha256)));
    expect(first.map((map) => map.summary.mapSpaceId)).toEqual(["a", "b"]);
    expect(first[0]!.resources.flatMap((part) => part.value.placements.map((placement) => placement[0]))).toEqual(["icon-a", "placement-a"]);
    expect(first[0]!.resources.flatMap((part) => part.value.regions.map((region) => region.id))).toEqual(["region-a"]);
    expect(first[0]!.resources[0]!.value.mapSpaceId).toBe("a");
    expect(first[0]!.resources[0]!.value).not.toEqual(expect.objectContaining({ mapSpaceId: "b" }));
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
