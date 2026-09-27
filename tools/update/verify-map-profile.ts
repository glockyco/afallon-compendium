// Operator tool: resolves every map-geometry landmark of the given scans through the reviewed map-space profile.
// usage: bun tools/update/verify-map-profile.ts PROFILE SCAN_MANIFEST...
import { compileMapSpaces } from "@afallon/contracts";
import { resolve } from "node:path";

const [profilePath, ...manifests] = process.argv.slice(2);
if (!profilePath || manifests.length === 0) throw new Error("usage: verify-map-profile PROFILE SCAN_MANIFEST...");
const profile = await Bun.file(profilePath).json();
const objectPath = (hash: string) => resolve("artifacts/objects/sha256", hash.slice(0, 2), hash.slice(2));
// Every target of every scan records the same native scene catalog. The profile compiles against it.
const catalogHashes = new Set<string>();
for (const manifestPath of manifests) {
  const manifest = await Bun.file(manifestPath).json() as { input: { buildId: string }; outputs: Array<{ name: string; content: { sha256: string } }> };
  if (manifest.input.buildId !== profile.buildId) throw new Error(`${manifestPath} belongs to build ${manifest.input.buildId}, not ${profile.buildId}.`);
  for (const output of manifest.outputs) if (/^targets\/\d+\/scene-catalog\.json$/.test(output.name)) catalogHashes.add(output.content.sha256);
}
if (catalogHashes.size !== 1) throw new Error(`The scans record ${catalogHashes.size} different scene catalogs; exactly one is required.`);
const catalog = await Bun.file(objectPath([...catalogHashes][0]!)).json();
const compiled = compileMapSpaces(profile, catalog);
const failures: unknown[] = [];
let positions = 0;
let worldPositions = 0;
for (const manifestPath of manifests) {
  const manifest = await Bun.file(manifestPath).json();
  for (const output of manifest.outputs) {
    if (!/^targets\/\d+\/map-geometry\.json$/.test(output.name)) continue;
    const hash = output.content.sha256 as string;
    const geometry = await Bun.file(resolve("artifacts/objects/sha256", hash.slice(0, 2), hash.slice(2))).json();
    for (const landmark of geometry.landmarks ?? []) {
      positions += 1;
      const result = compiled.resolve(geometry.scene.nativeId, geometry.scene.path, landmark.position);
      if (result.state !== "resolved") failures.push({ scene: geometry.scene.nativeId, position: landmark.position, result });
      const candidate = result.state === "resolved" ? result.candidates[0] : undefined;
      if (candidate?.mapSpaceId === "world-surface") {
        worldPositions += 1;
        if (candidate.bindingIds.length !== 1) failures.push({ scene: geometry.scene.nativeId, position: landmark.position, bindings: candidate.bindingIds });
      }
    }
  }
}
const retiredBindings = profile.bindings.filter((binding: { sceneNativeId: number }) => [3, 9, 11].includes(binding.sceneNativeId));
const worldBindings = profile.bindings.filter((binding: { mapSpaceId: string }) => binding.mapSpaceId === "world-surface");
if (retiredBindings.length > 0) failures.push({ retiredBindings });
if (!worldBindings.some((binding: { sceneNativeId: number }) => binding.sceneNativeId === 47)) failures.push({ missingMergedScene: 47 });
console.log(JSON.stringify({ buildId: profile.buildId, mapSpaces: profile.mapSpaces.length, bindings: profile.bindings.length, worldBindings: worldBindings.map((binding: { id: string; sceneNativeId: number }) => ({ id: binding.id, sceneNativeId: binding.sceneNativeId })), positions, worldPositions, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;
