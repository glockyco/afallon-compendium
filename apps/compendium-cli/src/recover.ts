import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { Assert } from "typebox/value";
import {
  Cpp2ilSnapshotReceiptSchema,
  canonicalJson,
  type CompendiumConfig,
  type Cpp2ilSnapshotReceipt,
} from "@afallon/contracts";
import { buildIdentity } from "./build";
import {
  AFALLON_APP_ID,
  STEAM_FULLY_INSTALLED_STATE,
  readSteamManifest,
  type SteamAppManifest,
} from "./steam";
import { defaultProcessRunner, deriveSteamEnvironment, type ProcessRunner } from "./update";

export const CPP2IL_VERSION = "2022.1.0-development.1736+5fb2030.5fb20304df698ffd3d0e664b2a698cd911dc9d57";
const CPP2IL_OUTPUT_ARGUMENTS = ["--output-as", "diffable-cs"] as const;
const REPOSITORY_ROOT = resolve(import.meta.dir, "../../..");
const DEFAULT_RECOVERY_ROOT = join(REPOSITORY_ROOT, ".recovered");

interface InstallationObservation {
  readonly manifest: SteamAppManifest;
  readonly inputHashes: Readonly<Record<string, string>>;
}

export interface RecoveryDependencies {
  readonly processRunner?: ProcessRunner;
  readonly observeInstallation?: (config: CompendiumConfig) => Promise<InstallationObservation>;
  readonly assertIgnored?: (root: string) => Promise<void>;
  readonly recoveryRoot?: string;
  readonly now?: () => Date;
}

export interface RecoveryResult {
  readonly snapshotPath: string;
  readonly receipt: Cpp2ilSnapshotReceipt;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function observeInstallation(config: CompendiumConfig): Promise<InstallationObservation> {
  const identity = await buildIdentity(config);
  const environment = deriveSteamEnvironment(config.gamePath);
  const manifest = await readSteamManifest(environment.manifestPath);
  if (manifest.appId !== AFALLON_APP_ID) throw new Error(`Steam manifest identifies app ${manifest.appId}, not Afallon ${AFALLON_APP_ID}.`);
  if (manifest.stateFlags !== STEAM_FULLY_INSTALLED_STATE) {
    throw new Error(`Afallon must be fully installed before recovery; StateFlags is ${manifest.stateFlags}.`);
  }
  if (manifest.buildId !== identity.buildId) throw new Error("Steam manifest changed while computing the recovery input identity.");
  return { manifest, inputHashes: identity.inputHashes };
}

async function assertIgnored(root: string): Promise<void> {
  const probe = join(root, ".ignore-probe");
  const child = Bun.spawn(["git", "check-ignore", "--quiet", "--no-index", probe], {
    cwd: REPOSITORY_ROOT,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
  if (exitCode !== 0) throw new Error(`Recovery root is not ignored by Git: ${root}.${stderr ? ` ${stderr.trim()}` : ""}`);
}

async function readReceipt(path: string): Promise<Cpp2ilSnapshotReceipt> {
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  Assert(Cpp2ilSnapshotReceiptSchema, value);
  return value;
}

async function updateCurrentPointer(root: string, snapshotPath: string, receipt: Cpp2ilSnapshotReceipt): Promise<void> {
  const temporary = join(root, `.current-${randomUUID()}.json`);
  await writeFile(temporary, `${canonicalJson({
    schemaVersion: "compendium.cpp2il-snapshot-pointer.v1",
    snapshot: basename(snapshotPath),
    buildId: receipt.input.manifest.buildId,
    metadataSha256: receipt.input.inputHashes.metadata,
  })}\n`);
  await rename(temporary, join(root, "current.json"));
}

async function pruneSnapshots(root: string, currentPath: string): Promise<void> {
  const snapshots: Array<{ path: string; recordedAt: string }> = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("steam-") || join(root, entry.name) === currentPath) continue;
    try {
      const receipt = await readReceipt(join(root, entry.name, "snapshot.json"));
      snapshots.push({ path: join(root, entry.name), recordedAt: receipt.recordedAt });
    } catch {
      // Unknown directories are not owned by this retention policy.
    }
  }
  snapshots.sort((left, right) => right.recordedAt.localeCompare(left.recordedAt) || right.path.localeCompare(left.path));
  await Promise.all(snapshots.slice(1).map(snapshot => rm(snapshot.path, { recursive: true, force: true })));
}

export async function runCpp2ilSnapshot(
  config: CompendiumConfig,
  cpp2ilPath: string,
  dependencies: RecoveryDependencies = {},
): Promise<RecoveryResult> {
  const root = resolve(dependencies.recoveryRoot ?? DEFAULT_RECOVERY_ROOT);
  await (dependencies.assertIgnored ?? assertIgnored)(root);
  const installation = await (dependencies.observeInstallation ?? observeInstallation)(config);
  const metadataSha256 = installation.inputHashes.metadata;
  if (!metadataSha256) throw new Error("Recovery input identity has no metadata hash.");

  const processRunner = dependencies.processRunner ?? defaultProcessRunner();
  const executable = resolve(cpp2ilPath);
  const version = await processRunner.run({ program: executable, args: ["--version"] });
  const versionOutput = `${version.stdout}\n${version.stderr}`;
  if (version.exitCode !== 0 || !versionOutput.includes(CPP2IL_VERSION)) {
    throw new Error(`Cpp2IL must be ${CPP2IL_VERSION}; observed exit ${version.exitCode}: ${versionOutput.trim()}`);
  }

  await mkdir(root, { recursive: true });
  const directoryName = `steam-${installation.manifest.buildId}-${metadataSha256.slice(0, 12)}`;
  const destination = join(root, directoryName);
  if (await pathExists(destination)) {
    const receipt = await readReceipt(join(destination, "snapshot.json"));
    if (canonicalJson(receipt.input) !== canonicalJson(installation)) {
      throw new Error(`Existing recovery snapshot ${directoryName} has a different input identity.`);
    }
    await updateCurrentPointer(root, destination, receipt);
    await pruneSnapshots(root, destination);
    return { snapshotPath: destination, receipt };
  }

  const staging = join(root, `.staging-${randomUUID()}`);
  await mkdir(staging);
  const argumentsUsed = ["--game-path", resolve(config.gamePath), "--output-to", staging, ...CPP2IL_OUTPUT_ARGUMENTS];
  try {
    const outcome = await processRunner.run({ program: executable, args: argumentsUsed });
    if (outcome.exitCode !== 0) {
      throw new Error(`Cpp2IL failed with exit ${outcome.exitCode}: ${(outcome.stderr || outcome.stdout).trim()}`);
    }
    const declarations = join(staging, "DiffableCs", "Assembly-CSharp");
    const declarationEntries = await readdir(declarations);
    if (!declarationEntries.some(entry => entry.endsWith(".cs"))) {
      throw new Error("Cpp2IL produced no top-level Assembly-CSharp declarations.");
    }
    const receipt: Cpp2ilSnapshotReceipt = {
      schemaVersion: "compendium.cpp2il-snapshot-receipt.v1",
      recordedAt: (dependencies.now ?? (() => new Date()))().toISOString(),
      toolVersion: CPP2IL_VERSION,
      arguments: argumentsUsed.slice(1),
      input: { manifest: installation.manifest, inputHashes: { ...installation.inputHashes } },
    };
    Assert(Cpp2ilSnapshotReceiptSchema, receipt);
    await writeFile(join(staging, "snapshot.json"), `${canonicalJson(receipt)}\n`);
    await rename(staging, destination);
    await updateCurrentPointer(root, destination, receipt);
    await pruneSnapshots(root, destination);
    return { snapshotPath: destination, receipt };
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    throw error;
  }
}
