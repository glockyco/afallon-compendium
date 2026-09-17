import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore } from "@afallon/artifacts";
import { openNormalizedDatabase } from "../../catalog/src/database";
import { generateImageryResources } from "./imagery";

test("verifies imagery registration and publishes hashed tile URLs with game imagery default", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-imagery-"));
  const db = openNormalizedDatabase(":memory:");
  try {
    const store = new ArtifactStore(join(root, "objects"));
    const tile = await store.putBytes(new TextEncoder().encode("tile"));
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run("build", "catalog.v1", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), "build", "catalog.v1", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run("build", 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?)").run("build", "world", "World");
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("placement", "build", 1, "scene", "world", 0, 0, 0, 5, 5, null, "null", "[]");
    for (const [id, kind] of [["captured", "captured"], ["game", "game-map"]] as const) {
      const layer = { id, mapSpaceId: "world", label: id, kind, tileSize: 256 as const, minZoom: 0, maxZoom: 0, extent: [0, 0, 10, 10] as [number, number, number, number], tiles: [{ z: 0, x: 0, y: 0, url: "old/tile.webp", sha256: tile.sha256, bytes: tile.bytes, width: 256, height: 256, state: "captured" as const }] };
      const manifest = await store.putBytes(new TextEncoder().encode(JSON.stringify({ schemaVersion: "compendium.catalog-imagery.v1", buildId: "build", layer, inputs: [{ sha256: tile.sha256, bytes: tile.bytes }] })));
      db.query("INSERT INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(`world:${id}`, "build", "world", kind, manifest.sha256, manifest.bytes, JSON.stringify(layer), "[]");
    }
    const generated = await generateImageryResources(db, store);
    expect(generated).toHaveLength(1);
    expect(generated[0]!.resource.value.defaultLayerId).toBe("game");
    expect(generated[0]!.resource.value.layers.map((layer) => layer.kind)).toEqual(["captured", "game-map"]);
    expect(generated[0]!.resource.value.layers[0]!.tiles[0]!.url).toBe(`assets/${tile.sha256}.webp`);
  } finally {
    db.close();
    await rm(root, { recursive: true, force: true });
  }
});
