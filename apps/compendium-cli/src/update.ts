import { stat } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import type { CompendiumConfig } from "@afallon/contracts";
import {
  AFALLON_APP_ID,
  STEAM_FULLY_INSTALLED_STATE,
  STEAM_SUCCESS_RESULT,
  findSteamSchedulerResult,
  logLength,
  readAppendedLog,
  readSteamManifest,
  steamLogShowsLogon,
  type SteamAppManifest,
} from "./steam";

const STEAM_WINDOWS_PATH = String.raw`C:\Program Files (x86)\Steam\steam.exe`;
export const DEFAULT_CROSSOVER_LAUNCHER = "/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/bin/cxstart";

export interface ProcessRequest {
  readonly program: string;
  readonly args: readonly string[];
}

export interface ProcessOutcome {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface ProcessRunner {
  run(request: ProcessRequest): Promise<ProcessOutcome>;
}

export interface SteamUpdateTimeouts {
  readonly clientReadyMs: number;
  readonly completionMs: number;
  readonly manifestFlushMs: number;
  readonly pollMs: number;
}

export interface SteamEnvironment {
  readonly launcherPath: string;
  readonly bottleRoot: string;
  readonly bottleName: string;
  readonly manifestPath: string;
  readonly connectionLogPath: string;
  readonly contentLogPath: string;
}

export interface SteamUpdateEvidence {
  readonly connectionLog: { readonly path: string; readonly offset: number; readonly endOffset: number };
  readonly contentLog: { readonly path: string; readonly offset: number; readonly endOffset: number; readonly result: string };
}

export interface SteamUpdateResult {
  readonly appId: string;
  readonly releaseVersion: string;
  readonly previous: SteamAppManifest;
  readonly current: SteamAppManifest;
  readonly updated: boolean;
  readonly evidence: SteamUpdateEvidence;
}

const DEFAULT_TIMEOUTS: SteamUpdateTimeouts = {
  clientReadyMs: 3 * 60_000,
  completionMs: 60 * 60_000,
  manifestFlushMs: 30_000,
  pollMs: 2_000,
};

export function deriveSteamEnvironment(gamePath: string, launcherPath = DEFAULT_CROSSOVER_LAUNCHER): SteamEnvironment {
  const marker = `${sep}drive_c${sep}`;
  const markerIndex = gamePath.indexOf(marker);
  if (markerIndex <= 0) throw new Error("gamePath is not inside a CrossOver bottle drive_c directory.");
  const bottleRoot = gamePath.slice(0, markerIndex);
  const bottleName = basename(bottleRoot);
  if (bottleName === "" || bottleName === ".") throw new Error("Cannot derive the CrossOver bottle name from gamePath.");
  const steamRoot = join(bottleRoot, "drive_c", "Program Files (x86)", "Steam");
  return {
    launcherPath: resolve(launcherPath),
    bottleRoot,
    bottleName,
    manifestPath: resolve(dirname(dirname(gamePath)), `appmanifest_${AFALLON_APP_ID}.acf`),
    connectionLogPath: join(steamRoot, "logs", "connection_log.txt"),
    contentLogPath: join(steamRoot, "logs", "content_log.txt"),
  };
}

export function defaultProcessRunner(): ProcessRunner {
  return {
    async run(request) {
      const child = Bun.spawn([request.program, ...request.args], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
      child.unref();
      const [exitCode, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ]);
      return { exitCode, stdout, stderr };
    },
  };
}

function startClientRequest(environment: SteamEnvironment): ProcessRequest {
  return { program: environment.launcherPath, args: ["--bottle", environment.bottleName, STEAM_WINDOWS_PATH] };
}

function validateRequest(environment: SteamEnvironment): ProcessRequest {
  return { program: environment.launcherPath, args: ["--bottle", environment.bottleName, "--no-wait", `steam://validate/${AFALLON_APP_ID}`] };
}

export interface UpdateTiming {
  readonly now: () => number;
  readonly wait: (milliseconds: number) => Promise<void>;
}

function delay(milliseconds: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(resolve, milliseconds);
  return promise;
}

const SYSTEM_TIMING: UpdateTiming = { now: Date.now, wait: delay };

async function waitForClient(
  client: Promise<ProcessOutcome>,
  environment: SteamEnvironment,
  logOffset: number,
  timeouts: SteamUpdateTimeouts,
  timing: UpdateTiming,
): Promise<number> {
  const deadline = timing.now() + timeouts.clientReadyMs;
  while (true) {
    const appended = await readAppendedLog(environment.connectionLogPath, logOffset);
    if (steamLogShowsLogon(appended.text)) return appended.endOffset;
    const state = await Promise.race([
      client.then(outcome => ({ outcome })),
      timing.wait(timeouts.pollMs).then(() => null),
    ]);
    if (state !== null) {
      if (state.outcome.exitCode !== 0) throw new Error(`CrossOver could not start Steam: ${state.outcome.stderr.trim() || `exit ${state.outcome.exitCode}`}.`);
      return appended.endOffset;
    }
    if (timing.now() >= deadline) throw new Error(`Steam did not become ready within ${timeouts.clientReadyMs} ms.`);
  }
}

async function waitForScheduler(
  environment: SteamEnvironment,
  logOffset: number,
  timeouts: SteamUpdateTimeouts,
  timing: UpdateTiming,
): Promise<{ result: string; endOffset: number }> {
  const deadline = timing.now() + timeouts.completionMs;
  while (true) {
    const appended = await readAppendedLog(environment.contentLogPath, logOffset);
    const result = findSteamSchedulerResult(appended.text);
    if (result !== null) return { result, endOffset: appended.endOffset };
    if (timing.now() >= deadline) throw new Error(`Steam did not finish with Afallon within ${timeouts.completionMs} ms.`);
    await timing.wait(timeouts.pollMs);
  }
}

async function waitForInstalledManifest(
  environment: SteamEnvironment,
  timeouts: SteamUpdateTimeouts,
  timing: UpdateTiming,
): Promise<SteamAppManifest> {
  const deadline = timing.now() + timeouts.manifestFlushMs;
  let last: SteamAppManifest | null = null;
  while (true) {
    try {
      last = await readSteamManifest(environment.manifestPath);
      if (last.stateFlags === STEAM_FULLY_INSTALLED_STATE) return last;
    } catch {
      // Steam can replace the manifest while this bounded poll is reading it.
    }
    if (timing.now() >= deadline) {
      const detail = last === null ? "manifest unreadable" : `StateFlags ${last.stateFlags}, build ${last.buildId}`;
      throw new Error(`Steam reported completion, but Afallon is not fully installed: ${detail}.`);
    }
    await timing.wait(timeouts.pollMs);
  }
}

export async function runSteamUpdate(input: {
  readonly config: CompendiumConfig;
  readonly releaseVersion: string;
  readonly runner?: ProcessRunner;
  readonly launcherPath?: string;
  readonly timeouts?: Partial<SteamUpdateTimeouts>;
  readonly timing?: UpdateTiming;
}): Promise<SteamUpdateResult> {
  if (input.releaseVersion.trim() === "" || input.releaseVersion.includes("\0")) throw new Error("Release version must be a nonempty string.");
  const environment = deriveSteamEnvironment(input.config.gamePath, input.launcherPath);
  try {
    if (!(await stat(environment.launcherPath)).isFile()) throw new Error("not a file");
  } catch {
    throw new Error(`CrossOver launcher not found: ${environment.launcherPath}.`);
  }
  const previous = await readSteamManifest(environment.manifestPath);
  const runner = input.runner ?? defaultProcessRunner();
  const timeouts = { ...DEFAULT_TIMEOUTS, ...input.timeouts };
  const timing = input.timing ?? SYSTEM_TIMING;
  const connectionOffset = await logLength(environment.connectionLogPath);
  const client = runner.run(startClientRequest(environment));
  const connectionEndOffset = await waitForClient(client, environment, connectionOffset, timeouts, timing);
  const contentOffset = await logLength(environment.contentLogPath);
  const validation = await runner.run(validateRequest(environment));
  if (validation.exitCode !== 0) throw new Error(`CrossOver rejected the Steam validation request: ${validation.stderr.trim() || `exit ${validation.exitCode}`}.`);
  const scheduler = await waitForScheduler(environment, contentOffset, timeouts, timing);
  if (scheduler.result !== STEAM_SUCCESS_RESULT) throw new Error(`Steam finished with Afallon reporting ${scheduler.result}.`);
  const current = await waitForInstalledManifest(environment, timeouts, timing);
  return {
    appId: AFALLON_APP_ID,
    releaseVersion: input.releaseVersion,
    previous,
    current,
    updated: current.buildId !== previous.buildId,
    evidence: {
      connectionLog: { path: environment.connectionLogPath, offset: connectionOffset, endOffset: connectionEndOffset },
      contentLog: { path: environment.contentLogPath, offset: contentOffset, endOffset: scheduler.endOffset, result: scheduler.result },
    },
  };
}
