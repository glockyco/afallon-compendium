import sharp from "sharp";
import { join } from "node:path";
import { ArtifactStore, beginArtifactRun } from "@afallon/artifacts";
import type { PublicationPlan, PublicationPresentation } from "@afallon/contracts/public";
import { openNormalizedDatabase } from "../../catalog/src/database";

export async function publicationFixture(root: string, buildId = "build", includeTravel = false) {
  const store = new ArtifactStore(join(root, "store"));
  const tile = await store.putBytes(await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 1 } } }).webp().toBuffer());
  const layer = { id: "game", mapSpaceId: "world", label: "World", kind: "game-map", tileSize: 256, minZoom: 0, maxZoom: 0, extent: [0, 0, 10, 10], tiles: [{ z: 0, x: 0, y: 0, url: "tile.webp", sha256: tile.sha256, bytes: tile.bytes, width: 256, height: 256, state: "captured" }] };
  const emptyLayer = { ...layer, id: "empty-game", mapSpaceId: "empty", label: "Empty", extent: [10, 20, 30, 40] };
  const imagery = await store.putBytes(new TextEncoder().encode(JSON.stringify({ schemaVersion: "compendium.catalog-imagery.v1", buildId, layer, inputs: [{ sha256: tile.sha256, bytes: tile.bytes }] })));
  const emptyImagery = await store.putBytes(new TextEncoder().encode(JSON.stringify({ schemaVersion: "compendium.catalog-imagery.v1", buildId, layer: emptyLayer, inputs: [{ sha256: tile.sha256, bytes: tile.bytes }] })));
  const databasePath = join(root, "catalog.sqlite");
  const db = openNormalizedDatabase(databasePath);
  try {
    db.query("INSERT INTO normalized_builds VALUES (?, ?, ?)").run(buildId, "compendium.catalog.v2", "{}");
    db.query("INSERT INTO catalog_metadata VALUES (?, ?, ?, ?, ?)").run("c".repeat(64), buildId, "compendium.catalog.v2", "{}", "a".repeat(64));
    db.query("INSERT INTO identity_scenes VALUES (?, ?, ?)").run(buildId, 1, "scene");
    db.query("INSERT INTO map_spaces VALUES (?, ?, ?), (?, ?, ?)").run(buildId, "world", "World", buildId, "empty", "Empty");
    db.query("INSERT INTO canonical_entities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(buildId, "items", 1, "items:1", "Item", null, null, 1, "{}", "[]");
    db.query("INSERT INTO entity_details VALUES (?, ?)").run("items:1", JSON.stringify({ entityKey: "items:1", kind: "items", nativeId: 1, name: "Item", internalName: null, description: null, publicData: { localization: null, gameplay: null, icon: null }, roles: [], placementIds: [], sources: [], relationships: { merchantStock: [], lootBindings: [], lootEntries: [], resourceYields: [], questAssociations: [], transitions: [], conditions: [] }, provenance: [] }));
    db.query("INSERT INTO placements (placement_id, build_id, scene_native_id, scene_path, map_space_id, world_x, world_y, world_z, map_x, map_y, label, shape_json, provenance_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("placement", buildId, 1, "scene", "world", 0, 0, 0, 5, 5, null, "null", "[]");
    db.query("INSERT INTO imagery_assets VALUES (?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?)").run("game", buildId, "world", "game-map", imagery.sha256, imagery.bytes, JSON.stringify(layer), "[]", "empty-game", buildId, "empty", "game-map", emptyImagery.sha256, emptyImagery.bytes, JSON.stringify(emptyLayer), "[]");
    if (includeTravel) {
      db.query("INSERT INTO placement_identities VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("placement", buildId, 1, "d".repeat(64), "e".repeat(64), "scene", "1", "scene", null);
      db.query("INSERT INTO source_identities VALUES (?, ?, ?, ?, ?, ?, ?)").run("source", "placement", buildId, 1, "1", "Transition", "Assembly-CSharp");
      db.query("INSERT INTO placement_roles VALUES (?, ?, ?, ?, ?, ?)").run("placement", "source", "transition", null, "authored", "{}");
    }
  } finally { db.close(); }
  const catalog = await store.putFile(databasePath);
  const catalogRun = await beginArtifactRun(store, { buildId, operation: "catalog", inputs: {}, settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test" });
  try {
    await catalogRun.addArtifact("catalog.sqlite", catalog, { mediaType: "application/vnd.sqlite3", schemaId: "compendium.catalog.v2", references: [imagery, emptyImagery, tile].map(({ sha256, bytes }) => ({ kind: "object" as const, content: { sha256, bytes } })) });
    await catalogRun.succeed();
  } finally { await catalogRun.release(); }
  const presentation: PublicationPresentation = { schemaVersion: "compendium.publication-presentation.v1", buildId, catalogId: "c".repeat(64), worldOffsets: [{ mapSpaceId: "world", worldX: 0, worldY: 0, source: "native", status: "placed" }, { mapSpaceId: "empty", worldX: 100, worldY: 200, source: "reviewed", status: "placed" }], spatialBounds: [{ mapSpaceId: "world", minX: 0, minY: 0, maxX: 10, maxY: 10 }, { mapSpaceId: "empty", minX: 10, minY: 20, maxX: 30, maxY: 40 }], capturedMapSpaceIds: [] };
  const presentationObject = await store.putBytes(new TextEncoder().encode(JSON.stringify(presentation)));
  const plan: PublicationPlan = { schemaVersion: "compendium.publish-plan.v2", buildId, mode: "preview", catalog: { manifest: catalogRun.manifestIdentity!, object: { sha256: catalog.sha256, bytes: catalog.bytes }, catalogId: "c".repeat(64) }, presentation: { sha256: presentationObject.sha256, bytes: presentationObject.bytes } };
  return { store, plan, options: { publicationRoot: join(root, "publication"), diagnosticRevision: "test", select: true }, referencePath: join(store.root, "refs", buildId, "publish", "latest-success.json") };
}
