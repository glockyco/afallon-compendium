import { expect, test } from "bun:test";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { ArtifactStore, readLatestSuccess, selectLatestSuccess } from "@afallon/artifacts";
import { beginCaptureWorkspace, type CaptureWorkspace } from "./content-run";

const input: ArtifactRunInput = {
  buildId: "25153357", operation: "capture", settings: { policy: "test" }, schemas: [],
  implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test", inputs: {},
};

test("an interrupted capture retains available evidence after scratch removal without replacing selection", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-capture-objects-"));
  const workspaces: CaptureWorkspace[] = [];
  try {
    const store = new ArtifactStore(root);
    const successful = await beginCaptureWorkspace(store, input);
    workspaces.push(successful);
    await writeFile(join(successful.directory, "tile.png"), "complete tile");
    const selectedArtifact = await successful.registerFile("tile.png");
    await successful.run.succeed();
    await selectLatestSuccess(store, successful.run.manifestPath);
    await successful.dispose();
    const selected = await readLatestSuccess(store, input.buildId, input.operation);

    const interrupted = await beginCaptureWorkspace(store, { ...input, cacheKey: "c".repeat(64) });
    workspaces.push(interrupted);
    await writeFile(join(interrupted.directory, "tile.png"), "partial tile");
    await writeFile(join(interrupted.directory, "cleanup.json"), '{"state":"uncertain"}');
    await interrupted.preserveFailureEvidence();
    const partialArtifact = interrupted.artifacts.get("tile.png")!;
    const cleanupArtifact = interrupted.artifacts.get("cleanup.json")!;
    await interrupted.run.fail(new Error("interrupted"));
    await interrupted.dispose();

    expect((await readLatestSuccess(store, input.buildId, input.operation))?.pointer.runId).toBe(selected?.pointer.runId);
    await store.verify(selectedArtifact.content);
    await store.verify(partialArtifact.content);
    await store.verify(cleanupArtifact.content);
    expect(await Bun.file(store.objectPath(partialArtifact.content.sha256)).text()).toBe("partial tile");
    expect(await Bun.file(store.objectPath(cleanupArtifact.content.sha256)).json()).toEqual({ state: "uncertain" });
    await expect(stat(interrupted.directory)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    try { await Promise.all(workspaces.map(workspace => workspace.dispose())); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});
