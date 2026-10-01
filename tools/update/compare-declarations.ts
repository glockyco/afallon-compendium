// Operator tool: compares two recovered Cpp2IL declaration snapshots of Assembly-CSharp and writes the build
// comparison that the update report references. Domain classifications are reviewed text passed in a JSON file.
// usage: bun tools/update/compare-declarations.ts PREVIOUS_SNAPSHOT CURRENT_SNAPSHOT DOMAINS_JSON OUTPUT
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const [previousRoot, currentRoot, domainsPath, output] = Bun.argv.slice(2);
if (!previousRoot || !currentRoot || !domainsPath || !output) throw new Error("usage: compare-declarations PREVIOUS CURRENT DOMAINS OUTPUT");

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");

async function snapshot(root: string) {
  const receipt = await Bun.file(join(root, "snapshot.json")).json() as { toolVersion: string; input: { manifest: { buildId: string }; inputHashes: { metadata: string } } };
  const tree = join(root, "DiffableCs", "Assembly-CSharp");
  const files = new Map<string, { sha256: string; lines: string[] }>();
  for (const path of (await Array.fromAsync(new Bun.Glob("**/*.cs").scan({ cwd: tree }))).sort()) {
    const text = await readFile(join(tree, path), "utf8");
    files.set(path, { sha256: sha256(text), lines: text.split("\n") });
  }
  // The tree digest is the SHA-256 of `<file sha256>  <relative path>` lines in byte order of the path, the format of `shasum -a 256`.
  const treeSha256 = sha256([...files].map(([path, file]) => `${file.sha256}  ${path}\n`).join(""));
  return { buildId: receipt.input.manifest.buildId, metadataSha256: receipt.input.inputHashes.metadata, toolVersion: receipt.toolVersion, treeSha256, files };
}

// A declaration line that names a compiler-generated member, or only moves a field offset, is not a shape change.
const declaration = (line: string) => line.trim().replace(/\s*\/\/Field offset: 0x[0-9A-F]+$/, "").replace(/\s*\/\/Length: \d+$/, "");
const generated = (line: string) => /<>|<[A-Za-z0-9_]*>[a-zA-Z0-9]*__/.test(line);

const previous = await snapshot(previousRoot), current = await snapshot(currentRoot);
if (previous.toolVersion !== current.toolVersion) throw new Error("The snapshots use different Cpp2IL versions.");
const added = [...current.files.keys()].filter((path) => !previous.files.has(path));
const removed = [...previous.files.keys()].filter((path) => !current.files.has(path));
const modified = [...current.files.keys()].filter((path) => previous.files.has(path) && previous.files.get(path)!.sha256 !== current.files.get(path)!.sha256);
const memberChanges: Record<string, { added: string[]; removed: string[] }> = {};
for (const path of modified) {
  const before = new Set(previous.files.get(path)!.lines.map(declaration).filter((line) => line && !generated(line)));
  const after = new Set(current.files.get(path)!.lines.map(declaration).filter((line) => line && !generated(line)));
  const change = { added: [...after].filter((line) => !before.has(line)).sort(), removed: [...before].filter((line) => !after.has(line)).sort() };
  if (change.added.length || change.removed.length) memberChanges[path] = change;
}
const domains = await Bun.file(domainsPath).json();
const comparison = {
  schemaVersion: "compendium.cpp2il-build-comparison.v1",
  recordedAt: new Date().toISOString(),
  toolVersion: current.toolVersion,
  previous: { buildId: previous.buildId, metadataSha256: previous.metadataSha256, treeSha256: previous.treeSha256, fileCount: previous.files.size },
  current: { buildId: current.buildId, metadataSha256: current.metadataSha256, treeSha256: current.treeSha256, fileCount: current.files.size },
  summary: { addedTypes: added.length, removedTypes: removed.length, modifiedTypes: modified.length, unchangedTypes: current.files.size - added.length - modified.length },
  types: { added, removed, modified },
  memberChanges,
  domains,
  limitations: [
    "Cpp2IL declarations establish type and member shape only. Empty generated method bodies do not establish behavior.",
    "Member changes omit compiler-generated members and field offset moves.",
  ],
};
await Bun.write(output, `${JSON.stringify(comparison, null, 2)}\n`);
console.log(JSON.stringify({ summary: comparison.summary, memberChanges: Object.fromEntries(Object.entries(memberChanges).map(([path, change]) => [path, change])) }, null, 2));
