import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { hostname } from "node:os";
import * as path from "node:path";
import { Assert } from "typebox/value";
import {
  ArtifactRunInputSchema, ArtifactRunPhaseSchema, canonicalJson,
  type ArtifactDependency, type ArtifactRunInput, type ArtifactRunManifest, type ArtifactRunPhase,
  type ContentIdentity, type FailureRecord, type LogicalArtifact,
} from "@afallon/contracts";
import { createImmutableFile, isErrno, isSafeSegment, safeSegment } from "./artifact-filesystem";
import { createArtifactLease, readArtifactLeases } from "./leases";
import { assertArtifactRunManifest, resolveArtifactRun, verifyArtifactRunClosure } from "./references";
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
  readonly references?: readonly ArtifactDependency[];
}

export interface ArtifactRun {
  readonly runId: string;
  readonly manifestPath: string;
  readonly status: ArtifactRunManifest["status"];
  readonly manifestIdentity: ContentIdentity | null;
  putBytes(bytes: Uint8Array): Promise<StoredObject>;
  putFile(sourcePath: string): Promise<StoredObject>;
  putStream(source: AsyncIterable<Uint8Array>): Promise<StoredObject>;
  setPhase(phase: ArtifactRunPhase): Promise<void>;
  addArtifact(name: string, object: ContentIdentity, metadata: ArtifactMetadata): Promise<LogicalArtifact>;
  reuseFrom(source: ArtifactRunManifest): Promise<readonly LogicalArtifact[]>;
  succeed(): Promise<ArtifactRunManifest>;
  fail(error: unknown): Promise<ArtifactRunManifest>;
  /** Release GC protection after selection or candidate handoff. Repeated calls are safe. */
  release(): Promise<void>;
}

export async function beginArtifactRun(store: ArtifactStore, input: ArtifactRunInput): Promise<ArtifactRun> {
  Assert(ArtifactRunInputSchema, input);
  const normalizedInput = JSON.parse(canonicalJson(input)) as ArtifactRunInput;
  safeSegment(normalizedInput.buildId, "buildId");
  safeSegment(normalizedInput.operation, "operation");
  const schemaIds = new Set<string>();
  for (const schema of normalizedInput.schemas) {
    if (schemaIds.has(schema.id)) throw new TypeError(`The run input repeats schema identity ${schema.id}.`);
    schemaIds.add(schema.id);
  }
  for (const name of normalizedInput.inputManifests ?? []) {
    if (!Object.hasOwn(normalizedInput.inputs, name)) throw new TypeError(`The run has no manifest input named ${name}.`);
  }
  const runId = randomUUID();
  const directory = path.join(store.root, "runs", runId);
  const revisionsDirectory = path.join(directory, "revisions");
  const manifestPath = path.join(directory, "manifest.json");
  await mkdir(path.join(store.root, "runs"), { recursive: true });
  await mkdir(directory);
  await mkdir(revisionsDirectory);
  const createdAt = new Date().toISOString();
  const execution = { host: hostname(), pid: process.pid };
  const outputs: LogicalArtifact[] = [];
  let reuse: ArtifactRunManifest["reuse"] = null;
  let revision = 0;
  let phase: ArtifactRunPhase = "preparation";
  let state: ArtifactRunManifest["status"] = "running";
  let manifestIdentity: ContentIdentity | null = null;
  const snapshot = (status: ArtifactRunManifest["status"], failure: FailureRecord | null): ArtifactRunManifest => {
    const updatedAt = new Date().toISOString();
    return {
      schemaVersion: "compendium.artifact-run.v2", revision, runId, phase, execution,
      input: normalizedInput, outputs: structuredClone(outputs), reuse: structuredClone(reuse),
      timestamps: { createdAt, updatedAt, completedAt: status === "running" ? null : updatedAt },
      status, failure,
    };
  };
  await writeImmutableJson(path.join(revisionsDirectory, revisionName(revision)), snapshot("running", null));
  const lease = await createArtifactLease(store, { runId, buildId: normalizedInput.buildId, operation: normalizedInput.operation, objects: [] });
  let released = false;
  let queue: Promise<void> = Promise.resolve();
  const enqueue = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = queue.then(operation);
    queue = result.then(() => {}, () => {});
    return result;
  };
  const requireRunning = (): void => {
    if (released) throw new RunStateError(`Run ${runId} is released.`);
    if (state !== "running") throw new RunStateError(`Run ${runId} is already ${state}.`);
  };
  const appendRevision = async (): Promise<void> => {
    revision += 1;
    try { await writeImmutableJson(path.join(revisionsDirectory, revisionName(revision)), snapshot("running", null)); }
    catch (error) { revision -= 1; throw error; }
  };
  const terminal = async (status: "succeeded" | "failed", failure: FailureRecord | null): Promise<ArtifactRunManifest> => {
    revision += 1;
    const manifest = snapshot(status, failure);
    assertArtifactRunManifest(manifest);
    const bytes = new TextEncoder().encode(`${canonicalJson(manifest)}\n`);
    let object: StoredObject;
    try { object = await store.putBytes(bytes, lease); }
    catch (error) { revision -= 1; throw error; }
    try { await writeImmutableJson(manifestPath, manifest); }
    catch (error) { revision -= 1; throw error; }
    state = status;
    manifestIdentity = { sha256: object.sha256, bytes: object.bytes };
    return structuredClone(manifest);
  };
  const run: ArtifactRun = {
    runId, manifestPath,
    get status() { return state; },
    get manifestIdentity() { return manifestIdentity === null ? null : { ...manifestIdentity }; },
    putBytes(bytes) { return enqueue(async () => { requireRunning(); return store.putBytes(bytes, lease); }); },
    putFile(sourcePath) { return enqueue(async () => { requireRunning(); return store.putFile(sourcePath, lease); }); },
    putStream(source) { return enqueue(async () => { requireRunning(); return store.putStream(source, lease); }); },
    setPhase(next) {
      return enqueue(async () => {
        requireRunning();
        Assert(ArtifactRunPhaseSchema, next);
        const phases = ["preparation", "execution", "finalization"];
        if (phases.indexOf(next) < phases.indexOf(phase)) throw new RunStateError(`Run ${runId} cannot return to phase ${next}.`);
        if (next === phase) return;
        const previous = phase;
        phase = next;
        try { await appendRevision(); } catch (error) { phase = previous; throw error; }
      });
    },
    addArtifact(name, object, metadata) {
      return enqueue(async () => {
        requireRunning();
        const logicalName = requireLogicalName(name);
        if (outputs.some(output => output.name === logicalName)) throw new RunStateError(`Artifact name is already registered: ${logicalName}.`);
        if (typeof metadata.mediaType !== "string" || metadata.mediaType.length === 0) throw new TypeError("Artifact mediaType must be a non-empty string.");
        const buildId = metadata.buildId ?? normalizedInput.buildId;
        if (buildId !== normalizedInput.buildId) throw new TypeError(`Artifact ${logicalName} belongs to build ${buildId}, not ${normalizedInput.buildId}.`);
        const references = (metadata.references ?? []).map(reference => ({
          kind: reference.kind,
          content: { sha256: reference.content.sha256, bytes: reference.content.bytes },
        }));
        const artifact: LogicalArtifact = {
          name: logicalName, content: { sha256: object.sha256, bytes: object.bytes },
          mediaType: metadata.mediaType, schemaId: metadata.schemaId ?? null, buildId, references,
        };
        const candidate = snapshot("running", null);
        candidate.input = { ...normalizedInput, inputs: {}, inputManifests: [] };
        candidate.outputs = [artifact];
        assertArtifactRunManifest(candidate);
        await lease.protect(object);
        for (const reference of references) {
          if (reference.kind === "run-manifest") await lease.protectManifest(reference.content);
          else await lease.protect(reference.content);
        }
        await verifyArtifactRunClosure(store, candidate);
        outputs.push(artifact);
        try { await appendRevision(); } catch (error) { outputs.pop(); throw error; }
        return structuredClone(artifact);
      });
    },
    reuseFrom(source) {
      return enqueue(async () => {
        requireRunning();
        if (outputs.length > 0 || reuse !== null) throw new RunStateError("A run can reuse outputs only before it registers outputs.");
        if (source.status !== "succeeded" || !sameCacheInput(source.input, normalizedInput)) throw new RunStateError(`Run ${source.runId} is not a matching reusable result.`);
        const sourceBytes = new TextEncoder().encode(`${canonicalJson(source)}\n`);
        const sourceObject = { sha256: createHash("sha256").update(sourceBytes).digest("hex"), bytes: sourceBytes.byteLength };
        await lease.protectManifest(sourceObject);
        const verified = await resolveArtifactRun(store, sourceObject, { buildId: input.buildId, operation: input.operation });
        outputs.push(...structuredClone(verified.outputs));
        reuse = { sourceRunId: verified.runId, sourceManifest: sourceObject, outputNames: outputs.map(output => output.name).sort() };
        try { await appendRevision(); } catch (error) { outputs.length = 0; reuse = null; throw error; }
        return structuredClone(outputs);
      });
    },
    succeed() {
      return enqueue(async () => {
        requireRunning();
        await verifyArtifactRunClosure(store, snapshot("running", null));
        phase = "finalization";
        return terminal("succeeded", null);
      });
    },
    fail(error) {
      return enqueue(async () => {
        requireRunning();
        return terminal("failed", serializeFailure(error));
      });
    },
    release() {
      return enqueue(async () => {
        if (released) return;
        await lease.release();
        released = true;
      });
    },
  };
  try {
    const manifests = new Set(normalizedInput.inputManifests ?? []);
    for (const [name, identity] of Object.entries(normalizedInput.inputs)) {
      if (manifests.has(name)) await lease.protectManifest(identity);
      else await lease.protect(identity);
    }
    await verifyArtifactRunClosure(store, snapshot("running", null));
  } catch (error) {
    try { await run.fail(error); }
    catch (failure) { throw new AggregateError([error, failure], `Run ${runId} failed during preparation. Evidence: ${manifestPath}.`); }
    finally { await run.release().catch(() => {}); }
    throw new Error(`Run ${runId} failed during preparation. Evidence: ${manifestPath}.`, { cause: error });
  }
  return run;
}

export async function readArtifactRunManifest(manifestPath: string): Promise<ArtifactRunManifest> {
  const value: unknown = JSON.parse(await readFile(manifestPath, "utf8"));
  assertArtifactRunManifest(value);
  if (value.status === "running") throw new Error(`Run ${value.runId} has no terminal manifest: ${manifestPath}.`);
  return value;
}

export interface ArtifactRunInspection {
  readonly manifest: ArtifactRunManifest;
  readonly state: "terminal" | "running" | "interrupted" | "unknown";
}

export async function inspectArtifactRun(store: ArtifactStore, runId: string): Promise<ArtifactRunInspection> {
  safeSegment(runId, "runId");
  const directory = path.join(store.root, "runs", runId);
  try { return { manifest: await readArtifactRunManifest(path.join(directory, "manifest.json")), state: "terminal" }; }
  catch (error) {
    if (!isErrno(error, "ENOENT")) throw error;
  }
  const revisions = (await readdir(path.join(directory, "revisions"))).filter(name => /^\d{8}\.json$/.test(name)).sort();
  const latest = revisions.at(-1);
  if (latest === undefined) throw new Error(`Run ${runId} has no admitted revision.`);
  const manifest: unknown = JSON.parse(await readFile(path.join(directory, "revisions", latest), "utf8"));
  assertArtifactRunManifest(manifest);
  if (manifest.runId !== runId || manifest.status !== "running") throw new Error(`Run ${runId} has an invalid running revision.`);
  const lease = (await readArtifactLeases(store)).find(candidate => candidate.runId === runId);
  if (lease === undefined) return { manifest, state: "interrupted" };
  if (manifest.execution.host !== hostname()) return { manifest, state: "unknown" };
  try { process.kill(manifest.execution.pid, 0); return { manifest, state: "running" }; }
  catch (error) {
    if (isErrno(error, "ESRCH")) return { manifest, state: "interrupted" };
    return { manifest, state: "unknown" };
  }
}

function requireLogicalName(value: string): string {
  if (typeof value !== "string" || value.length === 0 || value.startsWith("/") || value.startsWith("\\") || CONTROL_CHARACTERS.test(value)) throw new TypeError("Artifact name must be a non-empty relative path.");
  const parts = value.split(/[/\\]/);
  if (parts.some(part => !isSafeSegment(part))) throw new TypeError("Artifact name contains an invalid path segment.");
  return parts.join("/");
}

function revisionName(revision: number): string {
  return `${revision.toString().padStart(8, "0")}.json`;
}

async function writeImmutableJson(destination: string, value: unknown): Promise<void> {
  await createImmutableFile(destination, `${canonicalJson(value)}\n`, { finalMode: 0o444, cleanup: "best-effort" });
}

function serializeFailure(error: unknown): FailureRecord {
  if (error instanceof Error) {
    return {
      name: error.name || "Error", message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
      ...(error.cause === undefined && !(error instanceof AggregateError) ? {} : {
        details: {
          ...(error.cause === undefined ? {} : { cause: failureDetail(error.cause) }),
          ...(error instanceof AggregateError ? { errors: error.errors.map(cause => failureDetail(cause)) } : {}),
        },
      }),
    };
  }
  return { name: "Failure", message: typeof error === "string" ? error : "The operation failed.", details: failureDetail(error) };
}

function failureDetail(value: unknown, seen = new Set<Error>()): unknown {
  if (value instanceof Error) {
    if (seen.has(value)) return { name: value.name, message: value.message, circular: true };
    seen.add(value);
    return {
      name: value.name, message: value.message, ...(value.stack ? { stack: value.stack } : {}),
      ...(value.cause === undefined ? {} : { cause: failureDetail(value.cause, seen) }),
      ...(value instanceof AggregateError ? { errors: value.errors.map(error => failureDetail(error, seen)) } : {}),
    };
  }
  try { return JSON.parse(JSON.stringify(value)); } catch { return String(value); }
}
