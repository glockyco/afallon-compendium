import { expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { compactTerminalRunRevisions } from "./maintenance";
import { beginArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

const input: ArtifactRunInput = {
  buildId: "build",
  operation: "scan",
  settings: {},
  schemas: [],
  implementationFingerprint: "a".repeat(64),
  cacheKey: "b".repeat(64),
  probeHashes: {},
  diagnosticRevision: "test",
  inputs: {},
};

test("terminal run compaction previews bytes before it removes old journals", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-maintenance-"));
  const store = new ArtifactStore(root);
  try {
    const run = await beginArtifactRun(store, input);
    await run.succeed();
    await run.release();
    const manifestPath = join(root, "runs", run.runId, "manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.schemaVersion = "compendium.artifact-run.v1";
    await chmod(manifestPath, 0o644);
    await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`);
    const revisions = join(root, "runs", run.runId, "revisions");
    await mkdir(revisions);
    const contents = ["first revision\n", "second revision\n"] as const;
    await Promise.all(contents.map((content, index) => writeFile(join(revisions, `${index.toString().padStart(8, "0")}.json`), content)));

    const preview = await compactTerminalRunRevisions(store);
    expect(preview).toEqual({
      dryRun: true,
      runs: [{ runId: run.runId, revisions: 2, bytes: contents.reduce((sum, content) => sum + Buffer.byteLength(content), 0) }],
      summary: { runs: 1, revisions: 2, bytes: contents.reduce((sum, content) => sum + Buffer.byteLength(content), 0) },
    });
    expect(await readFile(join(revisions, "00000000.json"), "utf8")).toBe(contents[0]);

    const applied = await compactTerminalRunRevisions(store, { apply: true });
    expect(applied).toEqual({ ...preview, dryRun: false });
    await expect(readFile(join(revisions, "00000000.json"))).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
