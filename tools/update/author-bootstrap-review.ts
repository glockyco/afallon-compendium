// Operator tool: writes the open coverage review that admits a build's scans for the first candidate catalog. The
// complete review is generated from that catalog with author-coverage-review.ts.
// usage: bun tools/update/author-bootstrap-review.ts POLICY OUTPUT SCAN_MANIFEST...
import { createHash } from "node:crypto";

const [policyPath, outputPath, ...manifests] = Bun.argv.slice(2);
if (!policyPath || !outputPath || manifests.length === 0) throw new Error("usage: author-bootstrap-review POLICY OUTPUT SCAN_MANIFEST...");
const policyBytes = await Bun.file(policyPath).bytes();
const policy = JSON.parse(new TextDecoder().decode(policyBytes)) as { buildId: string };
const inventories: Array<{ bytes: number; sha256: string }> = [];
for (const manifestPath of manifests) {
  const manifest = await Bun.file(manifestPath).json() as { input: { buildId: string }; outputs: Array<{ name: string; content: { sha256: string; bytes: number } }> };
  if (manifest.input.buildId !== policy.buildId) throw new Error(`${manifestPath} belongs to build ${manifest.input.buildId}, not ${policy.buildId}.`);
  const planning = manifest.outputs.filter((output) => output.name === "planning/inventory.json");
  if (planning.length !== 1) throw new Error(`${manifestPath} has ${planning.length} planning inventories.`);
  inventories.push({ bytes: planning[0]!.content.bytes, sha256: planning[0]!.content.sha256 });
}
const review = {
  schemaVersion: "compendium.coverage-review.v1",
  buildId: policy.buildId,
  reviewer: `update-game-${policy.buildId}-spatial-review`,
  policy: { sha256: createHash("sha256").update(policyBytes).digest("hex"), bytes: policyBytes.byteLength },
  inventories,
  closure: {
    state: "open",
    inventories,
    subjectKeys: [],
    evidence: [],
    reason: "Current-build scene and streamed-source evidence is admitted to verify spatial connections before complete candidate coverage review.",
  },
  decisions: [],
};
await Bun.write(outputPath, `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify({ buildId: review.buildId, inventories: inventories.length }));
