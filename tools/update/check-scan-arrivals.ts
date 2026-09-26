// Operator tool: checks each scene visit of the scans against the doorways of the catalog built from them. A doorway
// arrival must match a gameScene transition into its scene; a start-position arrival is reported when the scene now has
// a doorway, because the next plans should use it. Exits with code 1 on any finding.
// usage: bun tools/update/check-scan-arrivals.ts CATALOG_SQLITE SCAN_MANIFEST...
import { Database } from "bun:sqlite";
import { resolve } from "node:path";

const [catalogPath, ...manifestPaths] = Bun.argv.slice(2);
if (!catalogPath || manifestPaths.length === 0) throw new Error("usage: check-scan-arrivals CATALOG_SQLITE SCAN_MANIFEST...");
const db = new Database(catalogPath, { readonly: true, strict: true });
const doorways = db.query<{ scene: number; x: number; y: number; z: number }, []>(`
  SELECT json_extract(payload_json, '$.destinationSceneNativeId') AS scene, json_extract(payload_json, '$.destinationPosition.x') AS x,
    json_extract(payload_json, '$.destinationPosition.y') AS y, json_extract(payload_json, '$.destinationPosition.z') AS z
  FROM transitions WHERE lower(json_extract(payload_json, '$.payload.destination.type.name')) = 'gamescene' AND source_scene_native_id IS NOT json_extract(payload_json, '$.destinationSceneNativeId')`).all();
db.close();
type Arrival = { source: "doorway" | "start-position"; position: { x: number; y: number; z: number } };
const findings: string[] = [];
let visits = 0;
for (const manifestPath of manifestPaths) {
  const manifest = await Bun.file(manifestPath).json() as { outputs: Array<{ name: string; content: { sha256: string } }> };
  for (const output of manifest.outputs) {
    if (!/^targets\/\d+\/scene-000-start\.json$/.test(output.name)) continue;
    const hash = output.content.sha256;
    const visit = await Bun.file(resolve("artifacts/objects/sha256", hash.slice(0, 2), hash.slice(2))).json() as { targetSceneNativeId: number; sourceSceneNativeId: number; targetArrival: Arrival };
    if (visit.targetSceneNativeId === visit.sourceSceneNativeId) continue;
    visits++;
    const { position, source } = visit.targetArrival;
    const into = doorways.filter((row) => row.scene === visit.targetSceneNativeId);
    const matched = into.some((row) => Math.hypot(row.x - position.x, row.y - position.y, row.z - position.z) < 0.01);
    if (source === "doorway" && !matched) findings.push(`scene ${visit.targetSceneNativeId}: the planned doorway is not an observed doorway of this catalog`);
    if (source === "start-position" && into.length > 0) findings.push(`scene ${visit.targetSceneNativeId}: entered at its start position, but the catalog has ${into.length} doorways into it`);
  }
}
console.log(JSON.stringify({ visits, findings }, null, 2));
if (findings.length > 0) process.exitCode = 1;
