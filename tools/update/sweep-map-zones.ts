// Operator tool: visits every interior scene that the profile binds and dumps its map-zone textures and corners.
// usage: bun tools/update/sweep-map-zones.ts CONFIG PROFILE
import { resolve } from "node:path";
import { mkdir } from "node:fs/promises";
import { loadConfig } from "../../apps/compendium-cli/src/config";
import { withRuntime } from "@afallon/runtime";
import { createSceneVisitBundle } from "../../packages/scan/src/visit-probes";
import { buildIdentity } from "../../apps/compendium-cli/src/build";

const [configPath, profilePath] = Bun.argv.slice(2);
if (!configPath || !profilePath) throw new Error("usage: sweep-map-zones CONFIG PROFILE");
const config = await loadConfig(configPath);
const { buildId } = await buildIdentity(config);
const profile = await Bun.file(profilePath).json() as { bindings: Array<{ mapSpaceId: string; sceneNativeId: number; domain: { kind: string } }> };
const outputDirectory = resolve(`artifacts/mapzones-${buildId}`);
await mkdir(outputDirectory, { recursive: true });
const windowsOutput = "Z:" + outputDirectory.replaceAll("/", "\\");
const scenes = [...new Map(profile.bindings.filter(binding => binding.mapSpaceId !== "world-surface" && binding.domain.kind === "scene").map(binding => [binding.mapSpaceId, { mapSpaceId: binding.mapSpaceId, sceneNativeId: binding.sceneNativeId }])).values()];
const visitBundle = await createSceneVisitBundle();
const dumpSource = await Bun.file(resolve(import.meta.dir, "map-zone-dump.csx")).text();
console.log(`visiting ${scenes.length} interior scenes`);

await withRuntime(config, async runtime => {
  let key: string | undefined, ordinal = 0, lastTarget: number | undefined;
  const visit = async (action: "start" | "retarget" | "restore", target: number): Promise<void> => {
    const deadline = Date.now() + 300000;
    let next: "start" | "retarget" | "poll" | "restore" = action;
    while (Date.now() < deadline) {
      const parameters: Record<string, unknown> = { researchCharacter: config.character, action: next, key, targetSceneNativeId: action === "restore" ? lastTarget : target, capturePosition: null };
      if (next === "start") { parameters.finalSceneNativeId = config.finalSceneNativeId; parameters.finalScenePath = config.finalScenePath; }
      const reply = await runtime.runProbe(visitBundle, resolve(outputDirectory, `visit-${ordinal++}.json`), { parameters, timeoutMs: 300000 });
      const state = reply.value;
      if (state.phase === "returned") throw new Error(`Scene ${target} returned to its source scene before it was ready.`);
      key = state.key;
      if (action !== "restore") lastTarget = target;
      if (state.phase === (action === "restore" ? "restored" : "ready")) {
        if (action !== "restore" && (!state.sceneReady || state.sceneNativeId !== target)) throw new Error(`Scene ${target} did not become ready.`);
        return;
      }
      next = action === "restore" ? "restore" : "poll";
      await Bun.sleep(500);
    }
    throw new Error(`Scene ${action} to ${target} timed out.`);
  };
  const dumps: unknown[] = [];
  try {
    for (const [index, scene] of scenes.entries()) {
      await visit(index === 0 ? "start" : "retarget", scene.sceneNativeId);
      const reply = await runtime.probe(dumpSource, resolve(outputDirectory, `dump-${scene.sceneNativeId}.json`), { parameters: { outputDirectory: windowsOutput }, timeoutMs: 120000 });
      const value = reply.value as { zones: Array<{ zoneId: number; texture: { name: string; width: number; height: number } }> };
      dumps.push({ ...scene, zones: value.zones });
      console.log(`${scene.mapSpaceId}: ${value.zones.map(zone => `${zone.texture.name} ${zone.texture.width}x${zone.texture.height}`).join(", ") || "no map zone"}`);
    }
  } finally {
    if (lastTarget !== undefined) await visit("restore", lastTarget);
    await Bun.write(resolve(outputDirectory, "sweep.json"), `${JSON.stringify({ schemaVersion: "compendium.map-zone-sweep.v1", buildId, scenes: dumps }, null, 2)}\n`);
  }
});
