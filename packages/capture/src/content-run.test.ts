import { expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { ArtifactStore, readLatestSuccess } from "@afallon/artifacts";
import { beginCaptureRun } from "./content-run";

const input: ArtifactRunInput = {
  buildId: "25153357",
  operation: "capture",
  settings: { policy: "test" },
  schemas: [],
  implementationFingerprint: "a".repeat(64),
  cacheKey: "b".repeat(64),
  probeHashes: {},
  diagnosticRevision: "test",
  inputs: {},
};

test("an interrupted capture preserves selection and removes partial working files", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-capture-objects-"));
  try {
    const store = new ArtifactStore(root);
    const successful = await beginCaptureRun(store, input);
    await writeFile(join(successful.directory, "tile.png"), "complete tile");
    const selectedArtifact = await successful.addArtifact("tile.png");
    await successful.succeed();
    const selected = await readLatestSuccess(store, input.buildId, input.operation);

    const interrupted = await beginCaptureRun(store, { ...input, cacheKey: "c".repeat(64) });
    await writeFile(join(interrupted.directory, "tile.png"), "partial tile");
    const partialArtifact = await interrupted.addArtifact("tile.png");
    await interrupted.fail(new Error("interrupted"));

    expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(selected?.pointer.runId);
    expect(await store.verify({ sha256: selectedArtifact.sha256, bytes: selectedArtifact.bytes })).toBeTruthy();
    expect(await store.verify({ sha256: partialArtifact.sha256, bytes: partialArtifact.bytes })).toBeTruthy();
    await expect(stat(interrupted.directory)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
