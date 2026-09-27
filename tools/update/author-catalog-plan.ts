// Operator tool: writes a catalog plan from run manifests. Scan manifests are admitted by their own identity. Each
// imagery run contributes its catalog-imagery.json output. The profile and review are registered objects.
// usage: bun tools/update/author-catalog-plan.ts OUTPUT --canonical-scan SCAN_MANIFEST --canonical-target TARGET --profile SHA256 --review SHA256
//          --scan SCAN_MANIFEST... --imagery RUN_MANIFEST...
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  "canonical-scan": { type: "string" }, "canonical-target": { type: "string" }, profile: { type: "string" }, review: { type: "string" },
  scan: { type: "string", multiple: true }, imagery: { type: "string", multiple: true },
} });
const [outputPath] = positionals;
if (!outputPath || !values["canonical-scan"] || !values["canonical-target"] || !values.profile || !values.review || !values.scan?.length) throw new Error("usage: author-catalog-plan OUTPUT --canonical-scan SCAN_MANIFEST --canonical-target TARGET --profile SHA256 --review SHA256 --scan ... --imagery ...");
type Manifest = { input: { buildId: string; operation: string }; status: string; outputs: Array<{ name: string; content: { sha256: string; bytes: number } }> };
const identity = async (path: string) => { const bytes = await Bun.file(path).bytes(); return { sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.byteLength }; };
const object = async (sha256: string) => ({ sha256, bytes: (await stat(resolve("artifacts/objects/sha256", sha256.slice(0, 2), sha256.slice(2)))).size });
const builds = new Set<string>();
const read = async (path: string, operation: string) => {
  const manifest = await Bun.file(path).json() as Manifest;
  if (manifest.input.operation !== operation || manifest.status !== "succeeded") throw new Error(`${path} is not a successful ${operation} run.`);
  builds.add(manifest.input.buildId);
  return manifest;
};
const scans = [];
for (const path of values.scan) { await read(path, "scan"); scans.push(await identity(path)); }
const imagery = [];
for (const path of values.imagery ?? []) {
  const manifest = await Bun.file(path).json() as Manifest;
  if (manifest.status !== "succeeded") throw new Error(`${path} did not succeed.`);
  builds.add(manifest.input.buildId);
  const documents = manifest.outputs.filter((output) => output.name.endsWith("catalog-imagery.json"));
  if (documents.length !== 1) throw new Error(`${path} has ${documents.length} imagery documents.`);
  imagery.push(documents[0]!.content);
}
const canonicalPath = values["canonical-scan"], targetIdentity = values["canonical-target"];
if (!values.scan.includes(canonicalPath)) throw new Error("The canonical scan must be one of the admitted scans.");
if (builds.size !== 1) throw new Error(`The runs name several builds: ${[...builds].join(", ")}.`);
const plan = {
  schemaVersion: "compendium.catalog-plan.v1",
  buildId: [...builds][0],
  canonicalTarget: { manifest: await identity(canonicalPath), targetIdentity },
  coverageReview: await object(values.review),
  imagery,
  scans,
  spatialProfile: await object(values.profile),
};
await Bun.write(outputPath, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ buildId: plan.buildId, scans: scans.length, imagery: imagery.length }));
