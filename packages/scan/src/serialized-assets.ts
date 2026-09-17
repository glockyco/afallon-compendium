import { resolve } from "node:path";
import { Assert, AssertError } from "typebox/value";
import { SerializedAssetIndexSchema, type SerializedAssetIndex } from "@afallon/contracts";

import readerSource from "./serialized-assets.py" with { type: "text" };
import pythonProject from "../../../pyproject.toml" with { type: "text" };
import pythonLock from "../../../uv.lock" with { type: "text" };

const REPOSITORY_ROOT = resolve(import.meta.dir, "../../..");
const READER_ENVIRONMENT = new Bun.CryptoHasher("sha256").update(pythonProject).update("\0").update(pythonLock).digest("hex");

export interface SerializedAssetIndexOptions {
  gameRoot: string;
  sourcePath: string;
  serializedFile?: string;
  assetName?: string;
}

function invocation(options: SerializedAssetIndexOptions): string[] {
  const args = [
    "uv",
    "run",
    "--locked",
    "--project",
    REPOSITORY_ROOT,
    "python",
    "-c",
    readerSource,
    "--game-root",
    options.gameRoot,
    "--source-path",
    options.sourcePath,
  ];
  if (options.serializedFile !== undefined) args.push("--serialized-file", options.serializedFile);
  if (options.assetName !== undefined) args.push("--asset-name", options.assetName);
  return args;
}

function validateOptions(options: SerializedAssetIndexOptions): void {
  if (!options || typeof options !== "object") throw new TypeError("serialized asset options are required.");
  for (const [name, value] of Object.entries(options)) {
    if (value !== undefined && typeof value !== "string") throw new TypeError(`${name} must be a string.`);
    if (value === "") throw new TypeError(`${name} must not be empty.`);
  }
  if (typeof options.gameRoot !== "string" || options.gameRoot.length === 0) throw new TypeError("gameRoot must be a non-empty string.");
  if (typeof options.sourcePath !== "string" || options.sourcePath.length === 0) throw new TypeError("sourcePath must be a non-empty string.");
}

function spawnReader(args: string[], invocationText: string) {
  try {
    return Bun.spawn(args, {
      cwd: REPOSITORY_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`could not start serialized asset reader (${invocationText}): ${detail}`);
  }
}

function validateOutput(value: unknown, invocationText: string): SerializedAssetIndex {
  try {
    Assert(SerializedAssetIndexSchema, value);
  } catch (error) {
    const detail = error instanceof AssertError ? error.message : String(error);
    throw new TypeError(`serialized asset reader returned invalid output (${invocationText}): ${detail}`);
  }
  return value as SerializedAssetIndex;
}

/** Index Unity hierarchy records by invoking the pinned offline Python reader. */
export async function indexSerializedAsset(options: SerializedAssetIndexOptions): Promise<SerializedAssetIndex> {
  validateOptions(options);
  const args = invocation(options);
  const invocationText = `UnityPy serialized asset reader ${READER_ENVIRONMENT} for ${options.sourcePath}`;
  const child = spawnReader(args, invocationText);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (exitCode !== 0) {
    const detail = stderr.trim() || stdout.trim() || `exit code ${exitCode}`;
    throw new Error(`serialized asset reader failed (${invocationText}): ${detail}`);
  }
  let value: unknown;
  try {
    value = JSON.parse(stdout);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`serialized asset reader emitted invalid JSON (${invocationText}): ${detail}`);
  }
  return validateOutput(value, invocationText);
}
