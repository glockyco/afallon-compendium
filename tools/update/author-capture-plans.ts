// Operator tool: re-authors the reviewed world-surface capture plans for one build. Each reviewed plan keeps its
// tiles, frames, and readiness. The survey becomes the build's scene-47 navigation geometry from a scan run, and each
// tile id carries the build so that captures of different builds never share a tile identity.
// usage: bun tools/update/author-capture-plans.ts SCAN_MANIFEST OUTPUT_DIRECTORY REVIEWED_PLAN...
import { basename, join, relative, resolve } from "node:path";

const [scanManifestPath, outputDirectory, ...reviewedPlans] = Bun.argv.slice(2);
if (!scanManifestPath || !outputDirectory || reviewedPlans.length === 0) throw new Error("usage: author-capture-plans SCAN_MANIFEST OUTPUT_DIRECTORY REVIEWED_PLAN...");
type Output = { name: string; content: { sha256: string } };
const manifest = await Bun.file(scanManifestPath).json() as { status: string; input: { buildId: string }; outputs: Output[] };
if (manifest.status !== "succeeded") throw new Error("The scan run did not succeed.");
const buildId = manifest.input.buildId;
const surveys: Output[] = [];
for (const output of manifest.outputs) {
  if (!output.name.endsWith("/navigation-geometry.json")) continue;
  const object = resolve("artifacts/objects/sha256", output.content.sha256.slice(0, 2), output.content.sha256.slice(2));
  const survey = await Bun.file(object).json() as { scene: { nativeId: number } };
  if (survey.scene.nativeId === 47) surveys.push(output);
}
if (surveys.length !== 1) throw new Error(`The scan run holds ${surveys.length} scene-47 navigation surveys; exactly one is required.`);
const surveyHash = surveys[0]!.content.sha256;

const reviewed = [...reviewedPlans].sort();
const plans: string[] = [];
for (const path of reviewed) {
  const plan = await Bun.file(path).json() as Record<string, unknown> & { tiles: Array<{ id: string }> };
  const tiles = plan.tiles.map((tile) => {
    if (!/-\d{8}$/.test(tile.id)) throw new Error(`Reviewed tile ${tile.id} in ${path} carries no build suffix.`);
    return { ...tile, id: `${tile.id.replace(/-\d{8}$/, "")}-${buildId}` };
  });
  const output = join(outputDirectory, basename(path).replace("-current-", `-${buildId}-`));
  const survey = relative(resolve(outputDirectory), resolve("artifacts/objects/sha256", surveyHash.slice(0, 2), surveyHash.slice(2)));
  // One readiness holds every source under a plan's tiles. A four-tile plan holds 585 sources at about 3 frames
  // per second. That took almost 300000 ms on build 25419293 and more on 25434619, so the budget is 900000 ms.
  await Bun.write(output, `${JSON.stringify({ ...plan, readiness: { ...(plan.readiness as object), timeoutMs: 900000 }, survey: { path: survey, sha256: surveyHash }, tiles }, null, 2)}\n`);
  plans.push(output);
}
console.log(JSON.stringify({ buildId, survey: surveyHash, plans }, null, 2));
