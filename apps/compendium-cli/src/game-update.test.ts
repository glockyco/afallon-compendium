import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore, readLatestSuccess } from "@afallon/artifacts";
import type { CompendiumConfig } from "@afallon/contracts";
import { runGameUpdate } from "./game-update";
import type { SteamUpdateResult } from "./update";

function identity(buildId: string, fill: string) {
  return { buildId, inputHashes: { gameAssembly: fill.repeat(64) } };
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "afallon-update-receipt-"));
  const store = join(root, "store");
  const connection = join(root, "connection.log");
  const content = join(root, "content.log");
  await mkdir(store, { recursive: true });
  await writeFile(connection, "old\nlogon\nnewer\n");
  await writeFile(content, "old\nfinished\nnewer\n");
  const config: CompendiumConfig = {
    gamePath: join(root, "game"), outputRoot: store, runtimeOutputRoot: "Z:/store",
    hotreplUrl: "ws://127.0.0.1:1/", character: "Research", finalSceneNativeId: 1,
    finalScenePath: "Assets/World.unity", timeoutMs: 1000,
  };
  const update: SteamUpdateResult = {
    appId: "2597810", releaseVersion: "0.16.2", updated: true,
    previous: { appId: "2597810", installDir: "Afallon", buildId: "old", stateFlags: 6 },
    current: { appId: "2597810", installDir: "Afallon", buildId: "new", stateFlags: 4 },
    evidence: {
      connectionLog: { path: connection, offset: 4, endOffset: 10 },
      contentLog: { path: content, offset: 4, endOffset: 13, result: "No Error" },
    },
  };
  return { root, store, config, update };
}

test("registers exact update evidence and receipt without selecting a latest success", async () => {
  const value = await fixture();
  try {
    const identities = [identity("old", "a"), identity("new", "b")];
    const result = await runGameUpdate({
      config: value.config,
      releaseVersion: "0.16.2",
      update: async () => value.update,
      identify: async () => identities.shift()!,
      revision: async () => "c".repeat(40),
      recordedAt: () => "2026-09-20T12:00:00.000Z",
    });
    expect(result.receipt.previous).toMatchObject({ manifest: { buildId: "old", stateFlags: 6 } });
    expect(result.receipt.current).toMatchObject({ manifest: { buildId: "new", stateFlags: 4 } });
    const store = new ArtifactStore(value.store);
    expect(await readFile(store.objectPath(result.receipt.evidence.connectionLog.content.sha256), "utf8")).toBe("logon\n");
    expect(await readFile(store.objectPath(result.receipt.evidence.contentLog.content.sha256), "utf8")).toBe("finished\n");
    expect(JSON.parse(await readFile(store.objectPath(result.object.sha256), "utf8"))).toEqual(result.receipt);
    expect(await readLatestSuccess(store, "new", "update")).toBeNull();
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("a failed Steam update creates no run or selected reference", async () => {
  const value = await fixture();
  try {
    await expect(runGameUpdate({
      config: value.config,
      releaseVersion: "0.16.2",
      update: async () => { throw new Error("Steam failed"); },
      identify: async () => identity("old", "a"),
    })).rejects.toThrow("Steam failed");
    expect(await readdir(value.store)).toEqual([]);
    expect(await readLatestSuccess(new ArtifactStore(value.store), "old", "update")).toBeNull();
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("rejects final installation identity disagreement before receipt registration", async () => {
  const value = await fixture();
  try {
    const identities = [identity("old", "a"), identity("other", "b")];
    await expect(runGameUpdate({
      config: value.config,
      releaseVersion: "0.16.2",
      update: async () => value.update,
      identify: async () => identities.shift()!,
    })).rejects.toThrow("does not match");
    expect(await readdir(value.store)).toEqual([]);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});
