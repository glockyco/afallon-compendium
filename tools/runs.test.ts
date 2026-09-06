import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beginRun } from "./runs";

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
