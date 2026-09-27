import { createHash } from "node:crypto";
import { resolve } from "node:path";

// usage: bun tools/update/author-map-profile.ts OUTPUT SCAN_MANIFEST... Every manifest must name the same build.
const [outputPath, ...manifests] = process.argv.slice(2);
if (!outputPath) throw new Error("usage: author-map-profile OUTPUT SCAN_MANIFEST...");
if (manifests.length === 0) throw new Error("Pass scan manifests.");
const builds = new Set(await Promise.all(manifests.map(async (path) => (await Bun.file(path).json()).input.buildId as string)));
if (builds.size !== 1) throw new Error(`Scan manifests name several builds: ${[...builds].join(", ")}.`);
const buildId = [...builds][0]!;
const observations: Array<{ nativeId: number; scenePath: string; sceneName: string; size: { x: number; y: number }; evidence: { path: string; sha256: string; pointer: string } }> = [];
for (const manifestPath of manifests) {
  const manifest = await Bun.file(manifestPath).json();
  if (manifest.input.buildId !== buildId) throw new Error(`Unexpected build in ${manifestPath}.`);
  for (const output of manifest.outputs) {
    if (!/^targets\/\d+\/map-geometry\.json$/.test(output.name)) continue;
    const sha256 = output.content.sha256 as string;
    const objectPath = resolve("artifacts/objects/sha256", sha256.slice(0, 2), sha256.slice(2));
    const document = await Bun.file(objectPath).json();
    const zones = (document.mapZones ?? []) as Array<{ calibration?: { size: { x: number; y: number } }; source?: { activeInHierarchy?: boolean } }>;
    let zoneIndex = zones.findIndex(candidate => candidate.calibration && candidate.source?.activeInHierarchy);
    if (zoneIndex < 0) zoneIndex = zones.findIndex(candidate => candidate.calibration);
    if (zoneIndex < 0) continue;
    const zone = zones[zoneIndex]!;
    observations.push({
      nativeId: document.scene.nativeId,
      scenePath: document.scene.path,
      sceneName: document.scene.name,
      size: zone.calibration!.size,
      evidence: { path: `../artifacts/objects/sha256/${sha256.slice(0, 2)}/${sha256.slice(2)}`, sha256, pointer: `/mapZones/${zoneIndex}/calibration` },
    });
  }
}
const unique = new Map(observations.map(row => [row.nativeId, row]));
const slug = (value: string) => value.toLowerCase().replace(/\(dungeon\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const groups = new Map<string, typeof observations>();
for (const observation of [...unique.values()].sort((left, right) => left.nativeId - right.nativeId)) {
  const key = observation.size.x >= 5000 ? "world-surface" : String(observation.nativeId);
  const group = groups.get(key) ?? [];
  group.push(observation);
  groups.set(key, group);
}
const mapSpaces: Array<{ id: string; label: string }> = [];
const bindings: unknown[] = [];
for (const [key, group] of groups) {
  const primary = group[0]!;
  const mapSpaceId = key === "world-surface" ? key : slug(primary.sceneName);
  mapSpaces.push({ id: mapSpaceId, label: key === "world-surface" ? "Afallon surface" : primary.sceneName.replace(/\s*\(Dungeon\)/, "") });
  for (const row of group) bindings.push({ id: slug(row.sceneName), mapSpaceId, sceneNativeId: row.nativeId, scenePath: row.scenePath, frame: { origin: { x: 0, z: 0 }, xAxis: { x: 1, z: 0 }, yAxis: { x: 0, z: 1 } }, domain: { kind: "scene" }, evidence: [row.evidence] });
}
const profile = { schemaVersion: "compendium.map-space-profile.v2", buildId, mapSpaces, bindings };
const encoded = `${JSON.stringify(profile, null, 2)}\n`;
await Bun.write(outputPath, encoded);
console.log(JSON.stringify({ sha256: createHash("sha256").update(encoded).digest("hex"), observations: observations.length, uniqueScenes: unique.size, mapSpaces: mapSpaces.length, bindings: bindings.length, worldBindings: bindings.filter((row: any) => row.mapSpaceId === "world-surface").map((row: any) => ({ id: row.id, sceneNativeId: row.sceneNativeId, scenePath: row.scenePath })) }, null, 2));
