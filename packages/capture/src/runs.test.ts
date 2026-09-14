import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beginRun, loadVerifiedRun } from "./runs";

const input = { buildId: "25144591", toolRevision: "test", command: "inspect", settings: {}, inputHashes: {} };

test("failed selection retains a reportable failed run", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-runs-"));
  try {
    const run = await beginRun(root, input);
    await writeFile(join(run.directory, "data.json"), "{}");
    await run.addArtifact("data.json");
    await mkdir(join(root, input.buildId, "inspect-latest-success.json"));
    await expect(run.succeed()).rejects.toThrow();
    await run.fail(new Error("Cannot select the completed artifact set"));
    const manifest = await Bun.file(run.manifestPath).json();
    expect(manifest.status).toBe("failed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("verified consumers reject changed or unregistered evidence and retain verified bytes", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-runs-"));
  try {
    const run = await beginRun(root, input);
    const artifact = join(run.directory, "data.json");
    await writeFile(artifact, '{"value":1}');
    await run.addArtifact("data.json");
    await run.succeed();
    const hash = createHash("sha256").update(await Bun.file(run.manifestPath).bytes()).digest("hex");
    const verified = await loadVerifiedRun(run.manifestPath, hash, input.buildId, input.command);
    const snapshot = await verified.readArtifact("data.json");
    await writeFile(artifact, '{"value":2}');
    expect(JSON.parse(new TextDecoder().decode(snapshot.bytes))).toEqual({ value: 1 });
    await expect(verified.readArtifact("data.json")).rejects.toThrow();
    await writeFile(join(run.directory, "unregistered.json"), '{}');
    await expect(verified.readArtifact("unregistered.json")).rejects.toThrow();
    await expect(loadVerifiedRun(run.manifestPath, hash, "another-build", input.command)).rejects.toThrow();
    const outside = join(root, "outside.json");
    await writeFile(outside, '{"value":1}');
    await rm(artifact);
    await symlink(outside, artifact);
    await expect(verified.readArtifact("data.json")).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("changed artifacts cannot replace the last valid run", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-runs-"));
  try {
    const first = await beginRun(root, input);
    await writeFile(join(first.directory, "data.json"), "{\"value\":1}");
    await first.addArtifact("data.json");
    await first.succeed();
    const pointerPath = join(root, input.buildId, "inspect-latest-success.json");
    const selected = await Bun.file(pointerPath).text();
    const next = await beginRun(root, input);
    await writeFile(join(next.directory, "data.json"), "{\"value\":2}");
    await next.addArtifact("data.json");
    await writeFile(join(next.directory, "data.json"), "{\"value\":3}");
    await expect(next.succeed()).rejects.toThrow();
    await next.fail(new Error("Artifact changed"));
    expect(await Bun.file(pointerPath).text()).toBe(selected);
    expect((await Bun.file(next.manifestPath).json()).status).toBe("failed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
