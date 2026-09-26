// Operator tool: gives every build-scene target of the scan plans an arrival at an observed doorway into its scene, taken
// from a catalog's gameScene transitions. The doorway with the lowest transition ID is chosen, so the choice is stable
// for one catalog. A scene without an observed doorway keeps no arrival and is entered at its start position.
// usage: bun tools/update/author-scan-arrivals.ts CATALOG_SQLITE SCAN_PLAN...
import { Database } from "bun:sqlite";

const [catalogPath, ...planPaths] = Bun.argv.slice(2);
if (!catalogPath || planPaths.length === 0) throw new Error("usage: author-scan-arrivals CATALOG_SQLITE SCAN_PLAN...");
const db = new Database(catalogPath, { readonly: true, strict: true });
type Doorway = { transition_id: string; x: number; y: number; z: number };
const doorway = db.query<Doorway, [number]>(`
  SELECT transition_id, json_extract(payload_json, '$.destinationPosition.x') AS x, json_extract(payload_json, '$.destinationPosition.y') AS y,
    json_extract(payload_json, '$.destinationPosition.z') AS z
  FROM transitions
  WHERE json_extract(payload_json, '$.destinationSceneNativeId') = ?1 AND source_scene_native_id IS NOT ?1
    AND lower(json_extract(payload_json, '$.payload.destination.type.name')) = 'gamescene' AND json_extract(payload_json, '$.destinationPosition') IS NOT NULL
  ORDER BY transition_id LIMIT 1`);
for (const path of planPaths) {
  const plan = await Bun.file(path).json() as { targets: Array<{ kind: string; sceneNativeId: number; arrival?: unknown }> };
  for (const target of plan.targets) {
    if (target.kind !== "build-scene") continue;
    const row = doorway.get(target.sceneNativeId);
    delete target.arrival;
    if (row) target.arrival = { transitionId: row.transition_id, position: { x: row.x, y: row.y, z: row.z } };
    console.log(`${path}: scene ${target.sceneNativeId} ${row ? `doorway ${row.transition_id.slice(0, 12)}` : "start position"}`);
  }
  await Bun.write(path, `${JSON.stringify(plan, null, 2)}\n`);
}
db.close();
