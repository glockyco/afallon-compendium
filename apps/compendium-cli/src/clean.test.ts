import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore, beginArtifactRun, createArtifactLease } from "@afallon/artifacts";
import { currentBuildPredicate } from "./clean";

const CLI = join(import.meta.dir, "cli.ts");

test("current builds are the accepted build, newer builds, pending selections, and non-numeric identifiers", () => {
  const current = currentBuildPredicate("25653798", ["25419293"]);
  expect(current("25653798")).toBe(true);
  expect(current("25700000")).toBe(true);
  expect(current("25419293")).toBe(true);
  expect(current("fixture")).toBe(true);
  expect(current("25434619")).toBe(false);
  expect(current("25153357")).toBe(false);
  const unaccepted = currentBuildPredicate(null, []);
  expect(unaccepted("25153357")).toBe(true);
});

async function cli(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const child = Bun.spawn([process.execPath, CLI, ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  return { exitCode, stdout, stderr };
}

async function succeededRun(store: ArtifactStore, content: string) {
  const run = await beginArtifactRun(store, { buildId: "25653798", operation: "scan", settings: {}, schemas: [], implementationFingerprint: "a".repeat(64), cacheKey: "b".repeat(64), probeHashes: {}, diagnosticRevision: "test", inputs: {} });
  try {
    const object = await run.putBytes(new TextEncoder().encode(content));
    await run.addArtifact("result.bin", object, { mediaType: "application/octet-stream" });
    await run.succeed();
    return object;
  } finally { await run.release(); }
}

test("clean reports through the command line and exits non-zero on a busy store, a broken record, or a bad option", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-clean-cli-"));
  try {
    const store = new ArtifactStore(root);
    const object = await succeededRun(store, "scan evidence");

    const report = await cli(["clean", "--store", root]);
    expect(report.exitCode).toBe(0);
    expect(Object.keys(JSON.parse(report.stdout)).sort()).toEqual(["currentBuilds", "dryRun", "leases", "objects", "ok", "references", "revisions", "roots", "runs", "scratch", "unmanaged", "warnings"]);

    expect((await cli(["clean", "--store", root, "--retain-hours", "24"])).exitCode).not.toBe(0);

    const lease = await createArtifactLease(store, { runId: "active", buildId: "25653798", operation: "scan", objects: [] });
    try {
      const busy = await cli(["clean", "--store", root, "--apply"]);
      expect(busy.exitCode).not.toBe(0);
      expect(busy.stderr).toContain("active.json");
    } finally { await lease.release(); }

    await rm(store.objectPath(object.sha256));
    const broken = await cli(["clean", "--store", root, "--apply"]);
    expect(broken.exitCode).not.toBe(0);
    expect(broken.stderr).toContain(object.sha256);
  } finally { await rm(root, { recursive: true, force: true }); }
});
