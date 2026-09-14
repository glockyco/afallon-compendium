import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunManifest } from "@afallon/contracts";
import { importLegacyRun } from "./legacy";
import { ArtifactStore } from "./store";

const sha256 = (value: Uint8Array): string => createHash("sha256").update(value).digest("hex");

test("legacy import preserves verified source bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-legacy-"));
  try {
    const legacyRoot = join(root, "legacy");
    await mkdir(join(legacyRoot, "nested"), { recursive: true });
    const artifactBytes = new TextEncoder().encode('{"schemaVersion":"example.v1","value":7}\n');
    const artifactPath = join(legacyRoot, "nested", "result.json");
    await writeFile(artifactPath, artifactBytes);
    const manifest: RunManifest = {
      schemaVersion: 1,
      runId: "legacy-run",
      input: { buildId: "25153357", toolRevision: "abc123", command: "scan", settings: { mode: "frozen" }, inputHashes: {} },
      timestamps: { createdAt: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:01.000Z", completedAt: "2026-01-01T00:00:01.000Z" },
      status: "succeeded",
      artifacts: [{ path: "nested/result.json", bytes: artifactBytes.byteLength, sha256: sha256(artifactBytes) }],
      failure: null,
    };
    const manifestPath = join(legacyRoot, "manifest.json");
    const manifestBytes = new TextEncoder().encode(`${JSON.stringify(manifest)}\n`);
    await writeFile(manifestPath, manifestBytes);
    const sourceBefore = await stat(artifactPath);
    const store = new ArtifactStore(join(root, "store"));

    await expect(importLegacyRun(store, { manifestPath, manifestSha256: "0".repeat(64) })).rejects.toThrow("Legacy manifest hash mismatch");
    const imported = await importLegacyRun(store, {
      manifestPath,
      manifestSha256: sha256(manifestBytes),
      schemaIds: { "nested/result.json": "example.v1" },
    });

    expect(imported.manifest.status).toBe("succeeded");
    expect(imported.manifest.outputs).toEqual([{
      name: "nested/result.json",
      content: { sha256: sha256(artifactBytes), bytes: artifactBytes.byteLength },
      mediaType: "application/json",
      schemaId: "example.v1",
      buildId: "25153357",
    }]);
    expect(await readFile(store.objectPath(sha256(artifactBytes)))).toEqual(Buffer.from(artifactBytes));
    expect(await readFile(artifactPath)).toEqual(Buffer.from(artifactBytes));
    const sourceAfter = await stat(artifactPath);
    expect(sourceAfter.ino).toBe(sourceBefore.ino);
    expect(sourceAfter.mtimeMs).toBe(sourceBefore.mtimeMs);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("legacy import rejects an artifact hash mismatch before registration", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-legacy-mismatch-"));
  try {
    const artifactBytes = new TextEncoder().encode("actual");
    await writeFile(join(root, "result.bin"), artifactBytes);
    const manifest: RunManifest = {
      schemaVersion: 1,
      runId: "legacy-run",
      input: { buildId: "25153357", toolRevision: "abc123", command: "scan", settings: {}, inputHashes: {} },
      timestamps: { createdAt: "now", startedAt: "now", updatedAt: "now", completedAt: "now" },
      status: "succeeded",
      artifacts: [{ path: "result.bin", bytes: artifactBytes.byteLength, sha256: "f".repeat(64) }],
      failure: null,
    };
    const manifestPath = join(root, "manifest.json");
    const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
    await writeFile(manifestPath, manifestBytes);
    const store = new ArtifactStore(join(root, "store"));
    await expect(importLegacyRun(store, { manifestPath, manifestSha256: sha256(manifestBytes) })).rejects.toThrow("Legacy artifact hash mismatch");
    await expect(stat(join(root, "store", "objects"))).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
