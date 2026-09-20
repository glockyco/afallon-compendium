import { expect, test } from "bun:test";
import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { CompendiumConfig } from "@afallon/contracts";
import { AFALLON_APP_ID } from "./steam";
import { deriveSteamEnvironment, runSteamUpdate, type ProcessRequest, type ProcessRunner, type UpdateTiming } from "./update";

class FakeTiming implements UpdateTiming {
  value = 0;
  onWait: (() => void | Promise<void>) | undefined;
  readonly now = () => this.value;
  readonly wait = async (milliseconds: number) => {
    this.value += milliseconds;
    await this.onWait?.();
  };
}

class FakeBottle {
  readonly root: string;
  readonly gamePath: string;
  readonly launcherPath: string;
  readonly environment: ReturnType<typeof deriveSteamEnvironment>;
  readonly config: CompendiumConfig;
  readonly requests: ProcessRequest[] = [];
  readonly timing = new FakeTiming();
  onValidate: (() => void | Promise<void>) | undefined;
  validateOutcome = { exitCode: 0, stdout: "", stderr: "" };

  private constructor(root: string) {
    this.root = root;
    const bottleRoot = join(root, "Bottles", "Steam");
    this.gamePath = join(bottleRoot, "drive_c", "Program Files (x86)", "Steam", "steamapps", "common", "Afallon");
    this.launcherPath = join(root, "CrossOver", "bin", "cxstart");
    this.environment = deriveSteamEnvironment(this.gamePath, this.launcherPath);
    this.config = {
      gamePath: this.gamePath,
      outputRoot: join(root, "store"),
      runtimeOutputRoot: "Z:/store",
      hotreplUrl: "ws://127.0.0.1:1/",
      character: "Research",
      finalSceneNativeId: 1,
      finalScenePath: "Assets/World.unity",
      timeoutMs: 1000,
    };
  }

  static async create(buildId = "25153357", stateFlags = 4): Promise<FakeBottle> {
    const bottle = new FakeBottle(await mkdtemp(join(tmpdir(), "afallon-update-")));
    await mkdir(bottle.gamePath, { recursive: true });
    await mkdir(dirname(bottle.launcherPath), { recursive: true });
    await mkdir(dirname(bottle.environment.connectionLogPath), { recursive: true });
    await writeFile(bottle.launcherPath, "launcher");
    await bottle.writeManifest(buildId, stateFlags);
    await writeFile(bottle.environment.connectionLogPath, "old connection\n");
    await writeFile(bottle.environment.contentLogPath, "old content\n");
    return bottle;
  }

  async writeManifest(buildId: string, stateFlags: number): Promise<void> {
    await writeFile(this.environment.manifestPath, `"AppState"\n{\n\t"appid" "${AFALLON_APP_ID}"\n\t"StateFlags" "${stateFlags}"\n\t"installdir" "Afallon"\n\t"buildid" "${buildId}"\n}\n`);
  }

  async finish(result = "No Error"): Promise<void> {
    await appendFile(this.environment.contentLogPath, `AppID ${AFALLON_APP_ID} scheduler finished : removed from schedule (result ${result}, state 0xc)\n`);
  }

  runner(): ProcessRunner {
    return {
      run: async request => {
        this.requests.push(request);
        if (request.args.some(argument => argument.startsWith("steam://"))) {
          await this.onValidate?.();
          return this.validateOutcome;
        }
        await appendFile(this.environment.connectionLogPath, "RecvMsgClientLogOnResponse() : 'OK'\n");
        return { exitCode: 0, stdout: "", stderr: "" };
      },
    };
  }

  async update(timeouts: Partial<Parameters<typeof runSteamUpdate>[0]["timeouts"]> = {}) {
    return runSteamUpdate({
      config: this.config,
      releaseVersion: "0.16.2",
      launcherPath: this.launcherPath,
      runner: this.runner(),
      timing: this.timing,
      timeouts: { clientReadyMs: 100, completionMs: 100, manifestFlushMs: 100, pollMs: 5, ...timeouts },
    });
  }

  async dispose(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }
}

test("requests Steam validation and reports an updated pending installation", async () => {
  const bottle = await FakeBottle.create("25153357", 6);
  try {
    bottle.onValidate = async () => { await bottle.writeManifest("25200000", 4); await bottle.finish(); };
    const result = await bottle.update();
    expect(result.updated).toBeTrue();
    expect(result.previous).toMatchObject({ buildId: "25153357", stateFlags: 6 });
    expect(result.current).toMatchObject({ buildId: "25200000", stateFlags: 4 });
    expect(bottle.requests).toHaveLength(2);
    expect(bottle.requests[1]?.args).toContain(`steam://validate/${AFALLON_APP_ID}`);
    expect(bottle.requests.flatMap(request => request.args).some(argument => argument.startsWith("steam://install/"))).toBeFalse();
  } finally { await bottle.dispose(); }
});

test("reports an already-current validated installation without waiting for manifest movement", async () => {
  const bottle = await FakeBottle.create();
  try {
    bottle.onValidate = () => bottle.finish();
    const result = await bottle.update({ completionMs: 500 });
    expect(result.updated).toBeFalse();
    expect(result.current.buildId).toBe("25153357");
  } finally { await bottle.dispose(); }
});

test("fails when Steam never records terminal work", async () => {
  const bottle = await FakeBottle.create();
  try {
    await expect(bottle.update({ completionMs: 20 })).rejects.toThrow("did not finish with Afallon");
  } finally { await bottle.dispose(); }
});

test("fails when Steam records a non-success result", async () => {
  const bottle = await FakeBottle.create();
  try {
    bottle.onValidate = () => bottle.finish("Disk Write Failure");
    await expect(bottle.update()).rejects.toThrow("Disk Write Failure");
  } finally { await bottle.dispose(); }
});

test("waits for the manifest to settle after scheduler success", async () => {
  const bottle = await FakeBottle.create("25153357", 6);
  try {
    bottle.onValidate = () => bottle.finish();
    bottle.timing.onWait = async () => {
      bottle.timing.onWait = undefined;
      await bottle.writeManifest("25200000", 4);
    };
    const result = await bottle.update({ manifestFlushMs: 200 });
    expect(result.current).toMatchObject({ buildId: "25200000", stateFlags: 4 });
  } finally { await bottle.dispose(); }
});

test("rejects successful scheduler work that never reaches fully installed", async () => {
  const bottle = await FakeBottle.create("25153357", 6);
  try {
    bottle.onValidate = () => bottle.finish();
    await expect(bottle.update({ manifestFlushMs: 20 })).rejects.toThrow("not fully installed");
  } finally { await bottle.dispose(); }
});
