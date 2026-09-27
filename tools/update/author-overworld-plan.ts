// Operator tool: derives the calibrated overworld game-map plan from a scan's scene-47 map geometry. The overworld
// MapZone calibration gives the texture's world corners and centre. The player's normalized map position gives a
// sixth landmark that the scan observed independently of the corners.
// usage: bun tools/update/author-overworld-plan.ts SCAN_MANIFEST IMAGE PROFILE OUTPUT
import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";

const [manifestPath, imagePath, profilePath, outputPath] = Bun.argv.slice(2);
if (!manifestPath || !imagePath || !profilePath || !outputPath) throw new Error("usage: author-overworld-plan SCAN_MANIFEST IMAGE PROFILE OUTPUT");
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
// The reviewed overworld texture "Newest map" and the delivered part of the world surface.
const texture = { width: 7540, height: 8192 };
const deliveryExtent = [-1152, -2688, 2176, 128];

type Vector = { x: number; y: number; z: number };
type Zone = { texture?: { name: string; width: number; height: number }; source?: { activeInHierarchy: boolean }; calibration?: { center: Vector; size: { x: number; y: number }; rotation: number; samples: Array<{ map: { x: number; y: number }; world: Vector }>; playerNormalized: { x: number; y: number } } };
const manifest = await Bun.file(manifestPath).json() as { input: { buildId: string }; outputs: Array<{ name: string; content: { sha256: string } }> };
const geometries: Array<{ hash: string; bytes: Uint8Array; value: { scene: { nativeId: number }; landmarks: Array<{ kind: string; position: Vector }>; mapZones: Zone[] } }> = [];
for (const output of manifest.outputs) {
  if (!/^targets\/\d+\/map-geometry\.json$/.test(output.name)) continue;
  const path = resolve("artifacts/objects/sha256", output.content.sha256.slice(0, 2), output.content.sha256.slice(2));
  const bytes = await Bun.file(path).bytes();
  const value = JSON.parse(new TextDecoder().decode(bytes));
  if (value.scene.nativeId === 47) geometries.push({ hash: output.content.sha256, bytes, value });
}
if (geometries.length !== 1) throw new Error(`The scan holds ${geometries.length} scene-47 map geometries; exactly one is required.`);
const geometry = geometries[0]!;
// Scene 47 holds one MapZone per region, and each shows the overworld texture. The active one is the game's map.
const zones = geometry.value.mapZones.flatMap((zone, index) => zone.calibration && zone.texture?.name === "Newest map" && zone.source?.activeInHierarchy === true ? [{ index, calibration: zone.calibration, zone }] : []);
if (zones.length !== 1) throw new Error(`Scene 47 has ${zones.length} active map zones that show "Newest map"; exactly one is required.`);
if (zones[0]!.zone.texture!.width !== texture.width || zones[0]!.zone.texture!.height !== texture.height) throw new Error("The overworld texture size changed.");
const { index, calibration } = zones[0]!;
if (calibration.rotation !== 0) throw new Error("The overworld map zone is rotated.");
const sample = (x: number, y: number) => { const found = calibration.samples.find((row) => row.map.x === x && row.map.y === y); if (!found) throw new Error(`The calibration lacks sample ${x},${y}.`); return found.world; };
const [southWest, northEast] = [sample(-1, -1), sample(1, 1)];
const west = southWest.x, south = southWest.z, east = northEast.x, north = northEast.z;
const players = geometry.value.landmarks.filter((landmark) => landmark.kind === "player");
if (players.length !== 1) throw new Error(`Scene 47 has ${players.length} player landmarks; exactly one is required.`);
const player = players[0]!.position;
const imageBytes = await Bun.file(imagePath).bytes();
const profileBytes = await Bun.file(profilePath).bytes();
const fromPlan = (path: string) => relative(dirname(resolve(outputPath)), resolve(path));
const plan = {
  buildId: manifest.input.buildId,
  deliveryExtent,
  image: { path: fromPlan(imagePath), sha256: sha256(imageBytes) },
  label: "Game map",
  layerId: "overworld-artwork",
  mapSpaceId: "world-surface",
  mapSpaceProfile: { path: fromPlan(profilePath), sha256: sha256(profileBytes) },
  registration: {
    kind: "calibrated",
    landmarks: [
      { id: "texture-north-west", map: { x: west, y: north }, pixel: { x: 0, y: 0 }, reviewed: true },
      { id: "texture-north-east", map: { x: east, y: north }, pixel: { x: texture.width, y: 0 }, reviewed: true },
      { id: "texture-south-west", map: { x: west, y: south }, pixel: { x: 0, y: texture.height }, reviewed: true },
      { id: "texture-south-east", map: { x: east, y: south }, pixel: { x: texture.width, y: texture.height }, reviewed: true },
      { id: "texture-centre", map: { x: calibration.center.x, y: calibration.center.z }, pixel: { x: texture.width / 2, y: texture.height / 2 }, reviewed: true },
      { id: "player-coalway-outdoors", map: { x: player.x, y: player.z }, pixel: { x: (calibration.playerNormalized.x + 1) / 2 * texture.width, y: (1 - calibration.playerNormalized.y) / 2 * texture.height }, reviewed: true },
    ],
    mapFromPixelEdge: { origin: { x: west, y: north }, xAxis: { x: (east - west) / texture.width, y: 0 }, yAxis: { x: 0, y: (south - north) / texture.height } },
    maximumResidualPixels: 0.05,
    reviewEvidence: [{ path: fromPlan(resolve("artifacts/objects/sha256", geometry.hash.slice(0, 2), geometry.hash.slice(2))), pointer: `/mapZones/${index}/calibration`, sha256: geometry.hash }],
  },
  role: "illustration",
  schemaVersion: "compendium.illustration-plan.v3",
};
await Bun.write(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ buildId: plan.buildId, zone: index, player: plan.registration.landmarks[5] }));
