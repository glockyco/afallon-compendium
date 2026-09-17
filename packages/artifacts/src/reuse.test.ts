import { expect, test } from "bun:test";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactRunInput } from "@afallon/contracts";
import { findReusableStep } from "./reuse";
import { selectLatestSuccess } from "./references";
import { beginArtifactRun, type ArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

function input(): ArtifactRunInput {
  return {
    buildId: "25153357",
    operation: "scan",
    settings: { target: "current-scene" },
    schemas: [{ id: "compendium.world-sources.v7", sha256: "a".repeat(64) }],
    implementationFingerprint: "b".repeat(64),
    cacheKey: "c".repeat(64),
    probeHashes: { "world.csx": "d".repeat(64) },
    diagnosticRevision: "test",
    inputs: { inventory: { sha256: "e".repeat(64), bytes: 10 } },
  };
}

test("reuse requires the complete cache identity and intact outputs", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-reuse-"));
  const runs: ArtifactRun[] = [];
  try {
    const store = new ArtifactStore(root);
    const runInput = input();
    const inputObject = await store.putBytes(new TextEncoder().encode("0123456789"));
    runInput.inputs.inventory = { sha256: inputObject.sha256, bytes: inputObject.bytes };
    const source = await beginArtifactRun(store, runInput);
    runs.push(source);
    const output = await store.putBytes(new TextEncoder().encode("reusable output"));
    await source.addArtifact("result.bin", output, { mediaType: "application/octet-stream" });
    await source.succeed();
    const sourceManifest = source.manifestIdentity;
    if (sourceManifest === null) throw new Error("Successful run has no manifest identity.");
    await selectLatestSuccess(store, source.manifestPath);
    await source.release();

    const hit = await findReusableStep(store, runInput);
    expect(hit?.runId).toBe(source.runId);
    expect(await findReusableStep(store, { ...runInput, settings: { target: "build-scenes" } })).toBeNull();
    expect(await findReusableStep(store, { ...runInput, implementationFingerprint: "f".repeat(64) })).toBeNull();
    expect(await findReusableStep(store, { ...runInput, schemas: [{ id: "compendium.world-sources.v7", sha256: "1".repeat(64) }] })).toBeNull();
    expect(await findReusableStep(store, { ...runInput, probeHashes: { "world.csx": "2".repeat(64) } })).toBeNull();
    expect(await findReusableStep(store, { ...runInput, inputs: { inventory: { sha256: "3".repeat(64), bytes: 10 } } })).toBeNull();
    expect(await findReusableStep(store, { ...runInput, cacheKey: "4".repeat(64) })).toBeNull();

    const consumer = await beginArtifactRun(store, runInput);
    runs.push(consumer);
    const reusedOutputs = await consumer.reuseFrom(hit!);
    const consumed = await consumer.succeed();
    expect(reusedOutputs[0]?.content).toEqual({ sha256: output.sha256, bytes: output.bytes });
    expect(consumed.reuse).toEqual({ sourceRunId: source.runId, sourceManifest, outputNames: ["result.bin"] });
    await consumer.release();

    await chmod(store.objectPath(output.sha256), 0o644);
    await writeFile(store.objectPath(output.sha256), "damaged");
    expect(await findReusableStep(store, runInput)).toBeNull();
  } finally {
    try { await Promise.all(runs.map(run => run.release())); }
    finally { await rm(root, { recursive: true, force: true }); }
  }
});
