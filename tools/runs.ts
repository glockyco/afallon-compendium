import { createHash, randomUUID } from "node:crypto";
import { open, mkdir, realpath, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import * as path from "node:path";
import {
  LatestSuccessPointerSchema,
  RunManifestSchema,
  type ArtifactRecord,
  type FailureRecord,
  type LatestSuccessPointer,
  type RunInput,
  type RunManifest,
} from "@afallon/contracts";
import { Assert } from "typebox/value";

export interface Run {
  readonly runId: string;
  readonly directory: string;
  readonly manifestPath: string;
  addArtifact(relativePath: string): Promise<ArtifactRecord>;
  succeed(): Promise<void>;
  fail(error: unknown): Promise<void>;
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

class RunLifecycleError extends Error {
  override name = "RunLifecycleError";
}

class ArtifactIntegrityError extends Error {
  override name = "ArtifactIntegrityError";
}

function requireSafeSegment(value: string, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${field} must be a non-empty path component`);
  }
  if (
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes(":") ||
    CONTROL_CHARACTER_PATTERN.test(value)
  ) {
    throw new TypeError(`${field} contains an invalid path component`);
  }
  return value;
}

function requireInput(input: RunInput): RunInput {
  if (input === null || typeof input !== "object") {
    throw new TypeError("run input must be an object");
  }

  const buildId = requireSafeSegment(input.buildId, "buildId");
  const command = requireSafeSegment(input.command, "command");
  if (typeof input.toolRevision !== "string" || input.toolRevision.length === 0) {
    throw new TypeError("toolRevision must be a non-empty string");
  }
  if (
    input.settings === null ||
    typeof input.settings !== "object" ||
    Array.isArray(input.settings)
  ) {
    throw new TypeError("settings must be an object");
  }
  if (
    input.inputHashes === null ||
    typeof input.inputHashes !== "object" ||
    Array.isArray(input.inputHashes)
  ) {
    throw new TypeError("inputHashes must be an object");
  }
  for (const [name, hash] of Object.entries(input.inputHashes)) {
    if (!SHA256_PATTERN.test(hash)) {
      throw new TypeError(`inputHashes[${JSON.stringify(name)}] must be a lowercase SHA-256 hash`);
    }
  }

  let serialized: string;
  try {
    serialized = JSON.stringify({
      buildId,
      toolRevision: input.toolRevision,
      command,
      settings: input.settings,
      inputHashes: input.inputHashes,
    });
  } catch (error) {
    throw new TypeError(`run input must be JSON serializable: ${errorMessage(error)}`);
  }
  if (serialized === undefined) {
    throw new TypeError("run input must be JSON serializable");
  }

  return JSON.parse(serialized) as RunInput;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

function serializeFailure(error: unknown): FailureRecord {
  if (error instanceof Error) {
    const failure: FailureRecord = {
      name: error.name || "Error",
      message: error.message || String(error),
    };
    if (error.stack) failure.stack = error.stack;
    if (error instanceof AggregateError) {
      failure.details = { errors: Array.from(error.errors, nested => serializeFailure(nested)) };
    }
    if ("cause" in error && error.cause !== undefined) {
      failure.details = {
        ...(failure.details as Record<string, unknown> | undefined),
        cause: error.cause instanceof Error ? serializeFailure(error.cause) : jsonSafe(error.cause),
      };
    }
    const own = Object.fromEntries(
      Object.entries(error).filter(([key]) => key !== "name" && key !== "message" && key !== "stack"),
    );
    if (Object.keys(own).length > 0) {
      const ownDetails = jsonSafe(own);
      failure.details = {
        ...(failure.details as Record<string, unknown> | undefined),
        ...(ownDetails as Record<string, unknown>),
      };
    }
    return failure;
  }

  if (typeof error === "string") {
    return { name: "Error", message: error };
  }

  const details = jsonSafe(error);
  return {
    name: "Failure",
    message: errorMessage(error),
    details,
  };
}

function jsonSafe(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "undefined") return null;
  if (typeof value === "function" || typeof value === "symbol") return String(value);
  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => jsonSafe(item, seen));

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = jsonSafe(item, seen);
  }
  return result;
}

function requireArtifactPath(relativePath: string): string {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    throw new TypeError("artifact path must be a non-empty relative path");
  }
  if (
    relativePath.startsWith("/") ||
    relativePath.startsWith("\\") ||
    /^[A-Za-z]:[/\\]/.test(relativePath) ||
    CONTROL_CHARACTER_PATTERN.test(relativePath)
  ) {
    throw new TypeError("artifact path must be relative");
  }

  const components = relativePath.split(/[\\/]/);
  if (
    components.some(
      (component) => component.length === 0 || component === "." || component === "..",
    )
  ) {
    throw new TypeError("artifact path contains an invalid path component");
  }
  const finalComponent = components[components.length - 1]!;
  if (finalComponent === "manifest.json" || finalComponent.startsWith(".manifest.")) {
    throw new TypeError("artifact path is reserved for the run manifest");
  }

  return components.join(path.sep);
}

function isInsideDirectory(directory: string, candidate: string): boolean {
  const relative = path.relative(directory, candidate);
  return relative.length > 0 && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function assertArtifactLocation(directory: string, relativePath: string): Promise<string> {
  const runRoot = await realpath(directory);
  const candidate = path.resolve(directory, relativePath);
  const canonical = await realpath(candidate);
  if (!isInsideDirectory(runRoot, canonical)) {
    throw new ArtifactIntegrityError(`artifact path resolves outside the run directory: ${relativePath}`);
  }
  return candidate;
}

async function hashArtifact(directory: string, relativePath: string): Promise<ArtifactRecord> {
  const candidate = await assertArtifactLocation(directory, relativePath);
  const handle = await open(candidate, "r");
  try {
    const initialStat = await handle.stat();
    if (!initialStat.isFile()) {
      throw new ArtifactIntegrityError(`artifact path is not a regular file: ${relativePath}`);
    }

    const digest = createHash("sha256");
    let bytes = 0;
    const stream = handle.createReadStream({ autoClose: false });
    for await (const chunk of stream) {
      const buffer = chunk as Uint8Array;
      digest.update(buffer);
      bytes += buffer.byteLength;
    }

    const finalStat = await handle.stat();
    if (!finalStat.isFile() || finalStat.size !== initialStat.size || finalStat.mtimeMs !== initialStat.mtimeMs) {
      throw new ArtifactIntegrityError(`artifact changed while it was being hashed: ${relativePath}`);
    }

    const canonicalAfterHash = await realpath(candidate);
    const runRoot = await realpath(directory);
    if (!isInsideDirectory(runRoot, canonicalAfterHash)) {
      throw new ArtifactIntegrityError(`artifact path resolves outside the run directory: ${relativePath}`);
    }

    return {
      path: relativePath.split(path.sep).join("/"),
      bytes,
      sha256: digest.digest("hex"),
    };
  } finally {
    await handle.close();
  }
}

async function atomicWrite(pathname: string, contents: string): Promise<void> {
  const temporaryPath = `${pathname}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporaryPath, contents, { encoding: "utf8", flag: "wx" });
    await rename(temporaryPath, pathname);
  } catch (error) {
    try {
      await unlink(temporaryPath);
    } catch {
      // Preserve the original write or rename error.
    }
    throw error;
  }
}

async function atomicWriteJson(pathname: string, value: unknown): Promise<void> {
  await atomicWrite(pathname, `${JSON.stringify(value, null, 2)}\n`);
}

function now(): string {
  return new Date().toISOString();
}

function parseRunManifest(value: unknown, source: string): RunManifest {
  try {
    Assert(RunManifestSchema, value);
  } catch {
    throw new Error(`Run manifest is invalid: ${source}`);
  }
  const artifactPaths = new Set<string>();
  const artifacts = value.artifacts.map((artifact) => {
    let normalizedPath: string;
    try {
      normalizedPath = requireArtifactPath(artifact.path).split(path.sep).join("/");
    } catch {
      throw new Error(`Run manifest artifact is invalid: ${source}`);
    }
    if (artifactPaths.has(normalizedPath)) throw new Error(`Run manifest contains duplicate artifacts: ${source}`);
    artifactPaths.add(normalizedPath);
    return { ...artifact, path: normalizedPath };
  });
  return { ...value, artifacts };
}

export async function readRunManifest(manifestPath: string): Promise<RunManifest> {
  const value = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
  return parseRunManifest(value, manifestPath);
}

export interface VerifiedRun {
  directory: string;
  manifest: RunManifest;
  readArtifact(relativePath: string): Promise<{ reference: ArtifactRecord; bytes: Uint8Array }>;
}

export async function loadVerifiedRun(manifestPath: string, sha256: string, buildId: string, command: string): Promise<VerifiedRun> {
  const manifestBytes = await readFile(manifestPath);
  if (!SHA256_PATTERN.test(sha256) || createHash("sha256").update(manifestBytes).digest("hex") !== sha256) {
    throw new ArtifactIntegrityError(`Run manifest hash mismatch: ${manifestPath}`);
  }
  const manifest = parseRunManifest(JSON.parse(manifestBytes.toString("utf8")), manifestPath);
  if (manifest.status !== "succeeded" || manifest.input.buildId !== buildId || manifest.input.command !== command) {
    throw new ArtifactIntegrityError(`Run manifest does not match successful ${command} output for build ${buildId}: ${manifestPath}`);
  }
  const directory = await realpath(path.dirname(path.resolve(manifestPath)));
  const records = new Map(manifest.artifacts.map(reference => [reference.path, reference]));
  return {
    directory,
    manifest,
    async readArtifact(relativePath) {
      const normalized = requireArtifactPath(relativePath).split(path.sep).join("/");
      const reference = records.get(normalized);
      if (reference === undefined) throw new ArtifactIntegrityError(`Run does not register artifact: ${relativePath}`);
      const absolute = await realpath(path.resolve(directory, normalized));
      const suffix = path.relative(directory, absolute);
      if (!suffix || path.isAbsolute(suffix) || suffix === ".." || suffix.startsWith(`..${path.sep}`)) {
        throw new ArtifactIntegrityError(`Run artifact escapes its directory: ${relativePath}`);
      }
      const bytes = await readFile(absolute);
      if (bytes.byteLength !== reference.bytes || createHash("sha256").update(bytes).digest("hex") !== reference.sha256) {
        throw new ArtifactIntegrityError(`Run artifact hash or size mismatch: ${relativePath}`);
      }
      return { reference, bytes };
    },
  };
}

export async function readLatestSuccess(outputRoot: string, buildId: string, command: string): Promise<LatestSuccessPointer | null> {
  const buildRoot = path.join(path.resolve(outputRoot), requireSafeSegment(buildId, "buildId"));
  const pointerPath = path.join(buildRoot, `${requireSafeSegment(command, "command")}-latest-success.json`);
  try {
    const value = JSON.parse(await readFile(pointerPath, "utf8")) as unknown;
    try {
      Assert(LatestSuccessPointerSchema, value);
    } catch {
      throw new Error(`Latest success pointer is invalid: ${pointerPath}`);
    }
    if (value.buildId !== buildId || value.command !== command) {
      throw new Error(`Latest success pointer is invalid: ${pointerPath}`);
    }
    return value;
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function listRunManifests(outputRoot: string, buildId: string, command: string): Promise<Array<{ manifestPath: string; directory: string; manifest: RunManifest }>> {
  const buildRoot = path.join(path.resolve(outputRoot), requireSafeSegment(buildId, "buildId"));
  let entries: Dirent[];
  try {
    entries = await readdir(buildRoot, { withFileTypes: true });
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  const result: Array<{ manifestPath: string; directory: string; manifest: RunManifest }> = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === ".runtime") continue;
    const directory = path.join(buildRoot, entry.name);
    const manifestPath = path.join(directory, "manifest.json");
    try {
      const manifest = await readRunManifest(manifestPath);
      if (manifest.input.buildId !== buildId || manifest.input.command !== command || manifest.runId !== entry.name) continue;
      result.push({ manifestPath, directory, manifest });
    } catch (error) {
      if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") continue;
      if (error instanceof SyntaxError || (error instanceof Error && error.message.startsWith("Run manifest"))) continue;
      throw error;
    }
  }
  result.sort((left, right) => right.manifest.timestamps.updatedAt.localeCompare(left.manifest.timestamps.updatedAt));
  return result;
}

export async function beginRun(outputRoot: string, input: RunInput): Promise<Run> {
  if (typeof outputRoot !== "string" || outputRoot.length === 0) {
    throw new TypeError("outputRoot must be a non-empty path");
  }
  const normalizedInput = requireInput(input);
  const root = path.resolve(outputRoot);
  const buildRoot = path.join(root, normalizedInput.buildId);
  await mkdir(buildRoot, { recursive: true });

  let runId: string;
  let directory: string;
  while (true) {
    runId = randomUUID();
    directory = path.join(buildRoot, runId);
    try {
      await mkdir(directory);
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }

  const manifestPath = path.join(directory, "manifest.json");
  const startedAt = now();
  const manifest: RunManifest = {
    schemaVersion: 1,
    runId,
    input: normalizedInput,
    timestamps: {
      createdAt: startedAt,
      startedAt,
      updatedAt: startedAt,
      completedAt: null,
    },
    status: "running",
    artifacts: [],
    failure: null,
  };
  await atomicWriteJson(manifestPath, manifest);

  let queue: Promise<void> = Promise.resolve();
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const persist = async (): Promise<void> => {
    manifest.timestamps.updatedAt = now();
    await atomicWriteJson(manifestPath, manifest);
  };

  const ensureRunning = (): void => {
    if (manifest.status !== "running") {
      throw new RunLifecycleError(`run ${runId} is already ${manifest.status}`);
    }
  };

  const addArtifact = (relativePath: string): Promise<ArtifactRecord> =>
    enqueue(async () => {
      ensureRunning();
      const normalizedPath = requireArtifactPath(relativePath);
      const manifestPathValue = path.relative(directory, manifestPath).split(path.sep).join("/");
      if (normalizedPath.split(path.sep).join("/") === manifestPathValue) {
        throw new TypeError("artifact path is reserved for the run manifest");
      }
      if (manifest.artifacts.some((artifact) => artifact.path === normalizedPath.split(path.sep).join("/"))) {
        throw new RunLifecycleError(`artifact is already registered: ${relativePath}`);
      }

      const artifact = await hashArtifact(directory, normalizedPath);
      manifest.artifacts.push(artifact);
      try {
        await persist();
      } catch (error) {
        manifest.artifacts.pop();
        throw error;
      }
      return { ...artifact };
    });

  const succeed = (): Promise<void> =>
    enqueue(async () => {
      ensureRunning();
      for (const expected of manifest.artifacts) {
        const actual = await hashArtifact(directory, expected.path);
        if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
          throw new ArtifactIntegrityError(
            `registered artifact changed: ${expected.path} (expected ${expected.bytes} bytes/${expected.sha256}, got ${actual.bytes} bytes/${actual.sha256})`,
          );
        }
      }

      const previousStatus = manifest.status;
      const previousFailure = manifest.failure;
      const previousCompletedAt = manifest.timestamps.completedAt;
      manifest.status = "succeeded";
      manifest.failure = null;
      manifest.timestamps.completedAt = now();
      try {
        await persist();
      } catch (error) {
        manifest.status = previousStatus;
        manifest.failure = previousFailure;
        manifest.timestamps.completedAt = previousCompletedAt;
        throw error;
      }

      const selectedAt = now();
      const pointer: LatestSuccessPointer = {
        schemaVersion: 1,
        buildId: normalizedInput.buildId,
        command: normalizedInput.command,
        runId,
        status: "succeeded",
        manifestPath: path.relative(buildRoot, manifestPath).split(path.sep).join("/"),
        directory: path.relative(buildRoot, directory).split(path.sep).join("/"),
        selectedAt,
      };
      try {
        await atomicWriteJson(
          path.join(buildRoot, `${normalizedInput.command}-latest-success.json`),
          pointer,
        );
      } catch (error) {
        manifest.status = previousStatus;
        manifest.failure = previousFailure;
        manifest.timestamps.completedAt = previousCompletedAt;
        await persist();
        throw error;
      }
    });

  const fail = (error: unknown): Promise<void> =>
    enqueue(async () => {
      ensureRunning();
      const previousStatus = manifest.status;
      const previousFailure = manifest.failure;
      const previousCompletedAt = manifest.timestamps.completedAt;
      manifest.status = "failed";
      manifest.failure = serializeFailure(error);
      manifest.timestamps.completedAt = now();
      try {
        await persist();
      } catch (persistError) {
        manifest.status = previousStatus;
        manifest.failure = previousFailure;
        manifest.timestamps.completedAt = previousCompletedAt;
        throw persistError;
      }
    });

  return {
    runId,
    directory,
    manifestPath,
    addArtifact,
    succeed,
    fail,
  };
}
