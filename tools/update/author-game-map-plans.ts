// Operator tool: derives one calibrated game-map illustration plan per swept interior map zone. The sweep records
// each map-zone texture with its four world corners and centre. The map-space profile binds each interior scene
// with an identity frame, so map coordinates are the world X and Z of those corners.
// usage: bun tools/update/author-game-map-plans.ts SWEEP_JSON PROFILE_JSON OUTPUT_DIRECTORY
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";

const [sweepPath, profilePath, outputDirectory] = Bun.argv.slice(2);
if (!sweepPath || !profilePath || !outputDirectory) throw new Error("usage: author-game-map-plans SWEEP PROFILE OUTPUT_DIRECTORY");

type Corner = { u: number; v: number; world: { x: number; z: number } };
type Zone = { zoneId: number; texture: { width: number; height: number; path: string }; center: { x: number; z: number }; rotation: number; corners: Corner[] };
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const sweepBytes = await Bun.file(sweepPath).bytes();
const sweep = JSON.parse(new TextDecoder().decode(sweepBytes)) as { buildId: string; scenes: Array<{ mapSpaceId: string; sceneNativeId: number; zones: Zone[] }> };
const profileBytes = await Bun.file(profilePath).bytes();
const profile = JSON.parse(new TextDecoder().decode(profileBytes)) as { buildId: string; bindings: Array<{ mapSpaceId: string; sceneNativeId: number; frame: { origin: { x: number; z: number }; xAxis: { x: number; z: number }; yAxis: { x: number; z: number } } }> };
if (sweep.buildId !== profile.buildId) throw new Error(`The sweep belongs to build ${sweep.buildId} and the profile to build ${profile.buildId}.`);
await mkdir(outputDirectory, { recursive: true });
// Plan paths are relative to the plan file, as the registered plans record them.
const fromPlan = (path: string) => relative(resolve(outputDirectory), resolve(path));
const written: string[] = [];
for (const [sceneIndex, scene] of sweep.scenes.entries()) {
  if (scene.zones.length !== 1) throw new Error(`${scene.mapSpaceId} has ${scene.zones.length} map zones; a plan needs exactly one.`);
  const binding = profile.bindings.find((row) => row.mapSpaceId === scene.mapSpaceId && row.sceneNativeId === scene.sceneNativeId);
  const identity = binding && binding.frame.origin.x === 0 && binding.frame.origin.z === 0 && binding.frame.xAxis.x === 1 && binding.frame.xAxis.z === 0 && binding.frame.yAxis.x === 0 && binding.frame.yAxis.z === 1;
  if (!identity) throw new Error(`${scene.mapSpaceId} has no identity-frame binding for scene ${scene.sceneNativeId}.`);
  const zone = scene.zones[0]!;
  // A rotated zone maps pixel edges through its rotated corners. The delivery extent is the corners' bounding box.
  const corner = (u: number, v: number) => { const found = zone.corners.find((row) => row.u === u && row.v === v); if (!found) throw new Error(`${scene.mapSpaceId} lacks corner ${u},${v}.`); return { x: found.world.x, y: found.world.z }; };
  const northWest = corner(-1, 1), northEast = corner(1, 1), southWest = corner(-1, -1), southEast = corner(1, -1);
  const { width, height } = zone.texture;
  const imagePath = join(dirname(sweepPath), basename(zone.texture.path.replaceAll("\\", "/")));
  const plan = {
    buildId: sweep.buildId,
    deliveryExtent: [Math.min(northWest.x, northEast.x, southWest.x, southEast.x), Math.min(northWest.y, northEast.y, southWest.y, southEast.y), Math.max(northWest.x, northEast.x, southWest.x, southEast.x), Math.max(northWest.y, northEast.y, southWest.y, southEast.y)],
    image: { path: fromPlan(imagePath), sha256: sha256(await Bun.file(imagePath).bytes()) },
    label: "Game map",
    layerId: `${scene.mapSpaceId}-game-map`,
    mapSpaceId: scene.mapSpaceId,
    mapSpaceProfile: { path: fromPlan(profilePath), sha256: sha256(profileBytes) },
    registration: {
      kind: "calibrated",
      landmarks: [
        { id: "texture-north-west", map: northWest, pixel: { x: 0, y: 0 }, reviewed: true },
        { id: "texture-north-east", map: northEast, pixel: { x: width, y: 0 }, reviewed: true },
        { id: "texture-south-west", map: southWest, pixel: { x: 0, y: height }, reviewed: true },
        { id: "texture-south-east", map: southEast, pixel: { x: width, y: height }, reviewed: true },
        { id: "texture-centre", map: { x: zone.center.x, y: zone.center.z }, pixel: { x: width / 2, y: height / 2 }, reviewed: true },
      ],
      mapFromPixelEdge: { origin: northWest, xAxis: { x: (northEast.x - northWest.x) / width, y: (northEast.y - northWest.y) / width }, yAxis: { x: (southWest.x - northWest.x) / height, y: (southWest.y - northWest.y) / height } },
      maximumResidualPixels: 0.05,
      reviewEvidence: [{ path: fromPlan(sweepPath), pointer: `/scenes/${sceneIndex}/zones/0`, sha256: sha256(sweepBytes) }],
    },
    role: "illustration",
    schemaVersion: "compendium.illustration-plan.v3",
  };
  const output = join(outputDirectory, `game-map-${scene.mapSpaceId}.json`);
  await Bun.write(output, `${JSON.stringify(plan, null, 2)}\n`);
  written.push(output);
}
console.log(JSON.stringify({ buildId: sweep.buildId, plans: written.length }, null, 2));
