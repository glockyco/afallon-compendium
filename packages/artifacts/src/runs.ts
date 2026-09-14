import { randomUUID } from "node:crypto";
import { chmod, link, mkdir, open, readFile, unlink } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import {
  ArtifactRunInputSchema,
  ArtifactRunManifestSchema,
  canonicalJson,
  type ArtifactRunInput,
  type ArtifactRunManifest,
  type FailureRecord,
  type LogicalArtifact,
} from "@afallon/contracts";
import { createArtifactLease } from "./leases";
import { selectLatestSuccess } from "./references";
import { sameCacheInput } from "./reuse";
import { ArtifactStore, type StoredObject } from "./store";

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export class RunStateError extends Error {
  override name = "RunStateError";
}

export interface ArtifactMetadata {
  readonly mediaType: string;
  readonly schemaId?: string | null;
  readonly buildId?: string;
}

export interface ArtifactRun {
  readonly runId: string;
  readonly manifestPath: string;
  addArtifact(name: string, object: StoredObject, metadata: ArtifactMetadata): Promise<LogicalArtifact>;
  reuseFrom(source: ArtifactRunManifest): Promise<readonly LogicalArtifact[]>;
  succeed(): Promise<ArtifactRunManifest>;
  fail(error: unknown): Promise<ArtifactRunManifest>;
}

export async function beginArtifactRun(store: ArtifactStore, input: ArtifactRunInput): Promise<ArtifactRun> {
  Assert(ArtifactRunInputSchema, input);
  const normalizedInput = JSON.parse(canonicalJson(input)) as ArtifactRunInput;
  requireSegment(normalizedInput.buildId, "buildId");
  requireSegment(normalizedInput.operation, "operation");
  const schemaIds = new Set<string>();
  for (const schema of normalizedInput.schemas) {
    if (schemaIds.has(schema.id)) throw new TypeError(`The run input repeats schema identity ${schema.id}.`);
    schemaIds.add(schema.id);
  }

  const runId = randomUUID();
  const directory = path.join(store.root, "runs", runId);
  const revisionsDirectory = path.join(directory, "revisions");
  const manifestPath = path.join(directory, "manifest.json");
  await mkdir(path.join(store.root, "runs"), { recursive: true });
  await mkdir(directory);
  await mkdir(revisionsDirectory);
  const createdAt = new Date().toISOString();
  const outputs: LogicalArtifact[] = [];
  let reuse: ArtifactRunManifest["reuse"] = null;
  let revision = 0;
  let state: ArtifactRunManifest["status"] = "running";

  const snapshot = (status: ArtifactRunManifest["status"], failure: FailureRecord | null): ArtifactRunManifest => {
    const updatedAt = new Date().toISOString();
    return {
      schemaVersion: "compendium.artifact-run.v1",
      revision,
      runId,
      input: normalizedInput,
      outputs: outputs.map((output) => structuredClone(output)),
      reuse: reuse === null ? null : structuredClone(reuse),
      timestamps: { createdAt, updatedAt, completedAt: status === "running" ? null : updatedAt },
      status,
      failure,
    };
  };

  await writeImmutableJson(path.join(revisionsDirectory, revisionName(revision)), snapshot("running", null));
  const lease = await createArtifactLease(store, {
    runId,
    buildId: normalizedInput.buildId,
    operation: normalizedInput.operation,
    objects: Object.values(normalizedInput.inputs),
  });

  let queue: Promise<void> = Promise.resolve();
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation, operation);
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
  const requireRunning = (): void => {
    if (state !== "running") throw new RunStateError(`Run ${runId} is already ${state}.`);
  };

  return {
    runId,
    manifestPath,
    addArtifact(name, object, metadata) {
      return enqueue(async () => {
        requireRunning();
        const logicalName = requireLogicalName(name);
        if (outputs.some((output) => output.name === logicalName)) throw new RunStateError(`Artifact name is already registered: ${logicalName}.`);
        if (typeof metadata.mediaType !== "string" || metadata.mediaType.length === 0) throw new TypeError("Artifact mediaType must be a non-empty string.");
        const buildId = metadata.buildId ?? normalizedInput.buildId;
        if (buildId !== normalizedInput.buildId) throw new TypeError(`Artifact ${logicalName} belongs to build ${buildId}, not ${normalizedInput.buildId}.`);
        await lease.protect(object);
        const artifact: LogicalArtifact = {
          name: logicalName,
          content: { sha256: object.sha256, bytes: object.bytes },
          mediaType: metadata.mediaType,
          schemaId: metadata.schemaId ?? null,
          buildId,
        };
        outputs.push(artifact);
        revision += 1;
        try {
          await writeImmutableJson(path.join(revisionsDirectory, revisionName(revision)), snapshot("running", null));
        } catch (error) {
          outputs.pop();
          revision -= 1;
          throw error;
        }
        return structuredClone(artifact);
      });
    },
    reuseFrom(source) {
      return enqueue(async () => {
        requireRunning();
        if (outputs.length > 0 || reuse !== null) throw new RunStateError("A run can reuse outputs only before it registers outputs.");
        if (source.status !== "succeeded" || !sameCacheInput(source.input, normalizedInput)) throw new RunStateError(`Run ${source.runId} is not a matching reusable result.`);
        for (const output of source.outputs) {
          await store.verify(output.content);
          await lease.protect(output.content);
        }
        outputs.push(...source.outputs.map((output) => structuredClone(output)));
        reuse = { sourceRunId: source.runId, outputNames: outputs.map((output) => output.name).sort() };
        revision += 1;
        try {
          await writeImmutableJson(path.join(revisionsDirectory, revisionName(revision)), snapshot("running", null));
        } catch (error) {
          outputs.length = 0;
          reuse = null;
          revision -= 1;
          throw error;
        }
        return outputs.map((output) => structuredClone(output));
      });
    },
    succeed() {
      return enqueue(async () => {
        requireRunning();
        for (const output of outputs) await store.verify(output.content);
        revision += 1;
        const manifest = snapshot("succeeded", null);
        await writeImmutableJson(manifestPath, manifest);
        state = "succeeded";
        try {
          await selectLatestSuccess(store, manifestPath);
        } finally {
          await lease.release();
        }
        return structuredClone(manifest);
      });
    },
    fail(error) {
      return enqueue(async () => {
        requireRunning();
        revision += 1;
        const manifest = snapshot("failed", serializeFailure(error));
        await writeImmutableJson(manifestPath, manifest);
        state = "failed";
        await lease.release();
        return structuredClone(manifest);
      });
    },
  };
}

export async function readArtifactRunManifest(manifestPath: string): Promise<ArtifactRunManifest> {
  const value: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  Assert(ArtifactRunManifestSchema, value);
  const names = new Set<string>();
  for (const output of value.outputs) {
    if (names.has(output.name)) throw new Error(`Run manifest contains duplicate artifact name ${output.name}.`);
    names.add(output.name);
  }
  if (value.status === "running" || (value.status === "succeeded" && value.failure !== null) || (value.status === "failed" && value.failure === null)) {
    throw new Error(`Run manifest has inconsistent status and failure fields: ${manifestPath}.`);
  }
  return value;
}

function requireSegment(value: string, field: string): string {
  if (value.length === 0 || value === "." || value === ".." || value.includes("/") || value.includes("\\") || value.includes(":") || CONTROL_CHARACTERS.test(value)) {
    throw new TypeError(`${field} must be one safe path segment.`);
  }
  return value;
}

function requireLogicalName(value: string): string {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/") || value.startsWith("\\") || CONTROL_CHARACTERS.test(value)) {
    throw new TypeError("Artifact name must be a non-empty relative path.");
  }
  const parts = value.split(/[\\/]/);
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new TypeError("Artifact name contains an invalid path segment.");
  return parts.join("/");
}

function revisionName(revision: number): string {
  return `${revision.toString().padStart(8, "0")}.json`;
}

async function writeImmutableJson(destination: string, value: unknown): Promise<void> {
  const temporary = `${destination}.tmp-${randomUUID()}`;
  const contents = new TextEncoder().encode(`${canonicalJson(value)}\n`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(contents);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(temporary, 0o444);
  try {
    await link(temporary, destination);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
  const directory = await open(path.dirname(destination), "r");
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

function serializeFailure(error: unknown): FailureRecord {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.cause === undefined ? {} : { details: { cause: failureDetail(error.cause) } }),
    };
  }
  return { name: "Failure", message: typeof error === "string" ? error : "The operation failed.", details: failureDetail(error) };
}

function failureDetail(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
}
