import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import {
  ArtifactLatestSuccessSchema,
  ArtifactRunManifestSchema,
  type ArtifactLatestSuccess,
  type ArtifactRunManifest,
  type ContentIdentity,
} from "@afallon/contracts";
import { isErrno, replaceFileAtomically, safeSegment } from "./artifact-filesystem";
import { ArtifactStore } from "./store";

export function assertArtifactRunManifest(value: unknown): asserts value is ArtifactRunManifest {
  Assert(ArtifactRunManifestSchema, value);
  const schemaIds = new Set<string>();
  for (const schema of value.input.schemas) {
    if (schemaIds.has(schema.id)) throw new Error(`Run ${value.runId} repeats schema identity ${schema.id}.`);
    schemaIds.add(schema.id);
  }
  const names = new Set<string>();
  for (const output of value.outputs) {
    if (names.has(output.name)) throw new Error(`Run ${value.runId} repeats artifact ${output.name}.`);
    names.add(output.name);
    if (output.buildId !== value.input.buildId) throw new Error(`Run ${value.runId} artifact ${output.name} has a different build.`);
  }
  for (const name of value.input.inputManifests ?? []) {
    if (!Object.hasOwn(value.input.inputs, name)) throw new Error(`Run ${value.runId} has no manifest input named ${name}.`);
  }
  const running = value.status === "running";
  if ((running && value.timestamps.completedAt !== null)
    || (!running && value.timestamps.completedAt === null)
    || (value.status === "failed" ? value.failure === null : value.failure !== null)) {
    throw new Error(`Run ${value.runId} has inconsistent terminal fields.`);
  }
}

export interface ArtifactRunScope {
  readonly buildId: string;
  readonly operation: string;
}

export async function resolveArtifactRun(store: ArtifactStore, identity: ContentIdentity, scope: ArtifactRunScope): Promise<ArtifactRunManifest> {
  await store.verify(identity);
  const manifest = await readManifestObject(store, identity);
  if (manifest.status !== "succeeded" || manifest.input.buildId !== scope.buildId || manifest.input.operation !== scope.operation) {
    throw new Error(`Manifest ${identity.sha256} is not a successful ${scope.buildId}/${scope.operation} run.`);
  }
  await verifyArtifactRunClosure(store, manifest);
  return manifest;
}

export async function verifyArtifactRunClosure(
  store: ArtifactStore,
  manifest: ArtifactRunManifest,
  visit: (identity: ContentIdentity, attribution: string) => void | Promise<void> = () => {},
): Promise<void> {
  assertArtifactRunManifest(manifest);
  const verified = new Map<string, number>();
  const expanded = new Set<string>();
  const active = new Set<string>();
  const object = async (identity: ContentIdentity, attribution: string): Promise<void> => {
    const size = verified.get(identity.sha256);
    if (size !== undefined && size !== identity.bytes) throw new Error(`Reference sizes disagree at ${attribution}: ${identity.sha256}.`);
    if (size === undefined) {
      try { await store.verify(identity); }
      catch (error) { throw new Error(`Broken artifact reference at ${attribution}: ${identity.sha256}.`, { cause: error }); }
      verified.set(identity.sha256, identity.bytes);
    }
    await visit(identity, attribution);
  };
  const dependency = async (identity: ContentIdentity, attribution: string, expectedRunId?: string): Promise<void> => {
    await object(identity, attribution);
    if (active.has(identity.sha256)) throw new Error(`Manifest dependency cycle at ${attribution}.`);
    if (expanded.has(identity.sha256) && expectedRunId === undefined) return;
    const source = await readManifestObject(store, identity);
    if (expectedRunId !== undefined && source.runId !== expectedRunId) throw new Error(`Reuse source identity disagrees at ${attribution}.`);
    if (expanded.has(identity.sha256)) return;
    if (source.status !== "succeeded" || source.input.buildId !== manifest.input.buildId) {
      throw new Error(`Manifest dependency at ${attribution} is not successful evidence for build ${manifest.input.buildId}.`);
    }
    active.add(identity.sha256);
    await walk(source, `${attribution}/run:${source.runId}`);
    active.delete(identity.sha256);
    expanded.add(identity.sha256);
  };
  const walk = async (current: ArtifactRunManifest, prefix: string): Promise<void> => {
    if (current.reuse !== null) await dependency(current.reuse.sourceManifest, `${prefix}/reuse:${current.reuse.sourceRunId}`, current.reuse.sourceRunId);
    const manifests = new Set(current.input.inputManifests ?? []);
    for (const [name, identity] of Object.entries(current.input.inputs)) {
      const attribution = `${prefix}/input:${name}`;
      await (manifests.has(name) ? dependency(identity, attribution) : object(identity, attribution));
    }
    for (const output of current.outputs) {
      const attribution = `${prefix}/output:${output.name}`;
      await object(output.content, attribution);
      for (const [index, reference] of output.references.entries()) {
        const edge = `${attribution}/reference:${index}`;
        await (reference.kind === "run-manifest" ? dependency(reference.content, edge) : object(reference.content, edge));
      }
    }
  };
  await walk(manifest, `run:${manifest.runId}`);
}

async function readManifestObject(store: ArtifactStore, identity: ContentIdentity): Promise<ArtifactRunManifest> {
  try {
    const value: unknown = JSON.parse(await readFile(store.objectPath(identity.sha256), "utf8"));
    assertArtifactRunManifest(value);
    return value;
  } catch (error) {
    throw new Error(`Invalid artifact-run manifest object ${identity.sha256}.`, { cause: error });
  }
}

export async function selectLatestSuccess(store: ArtifactStore, manifestPath: string): Promise<ArtifactLatestSuccess> {
  const manifestBytes = await readFile(manifestPath);
  const manifestValue: unknown = JSON.parse(manifestBytes.toString("utf8"));
  assertArtifactRunManifest(manifestValue);
  if (manifestValue.status !== "succeeded") throw new Error(`Run ${manifestValue.runId} is not successful and cannot be selected.`);
  const runId = safeSegment(manifestValue.runId, "runId");
  const expectedManifestPath = path.join(store.root, "runs", runId, "manifest.json");
  if (path.resolve(manifestPath) !== expectedManifestPath) throw new Error(`Run manifest is outside its immutable run location: ${manifestPath}.`);
  const identity = { sha256: createHash("sha256").update(manifestBytes).digest("hex"), bytes: manifestBytes.byteLength };
  await resolveArtifactRun(store, identity, { buildId: manifestValue.input.buildId, operation: manifestValue.input.operation });
  const buildId = safeSegment(manifestValue.input.buildId, "buildId");
  const operation = safeSegment(manifestValue.input.operation, "operation");
  const referenceDirectory = path.join(store.root, "refs", buildId, operation);
  await mkdir(referenceDirectory, { recursive: true });
  const pointer: ArtifactLatestSuccess = {
    schemaVersion: "compendium.artifact-latest-success.v1",
    buildId,
    operation,
    runId,
    manifest: { path: ["runs", runId, "manifest.json"].join("/"), ...identity },
    selectedAt: new Date().toISOString(),
  };
  await replaceFileAtomically(path.join(referenceDirectory, "latest-success.json"), `${JSON.stringify(pointer)}\n`);
  return pointer;
}

export interface SelectedArtifactRun {
  readonly pointer: ArtifactLatestSuccess;
  readonly manifest: ArtifactRunManifest;
}

export async function readLatestSuccess(store: ArtifactStore, buildId: string, operation: string): Promise<SelectedArtifactRun | null> {
  const pointerPath = path.join(store.root, "refs", safeSegment(buildId, "buildId"), safeSegment(operation, "operation"), "latest-success.json");
  let value: unknown;
  try { value = JSON.parse(await readFile(pointerPath, "utf8")); }
  catch (error) { if (isErrno(error, "ENOENT")) return null; throw error; }
  Assert(ArtifactLatestSuccessSchema, value);
  if (value.buildId !== buildId || value.operation !== operation) throw new Error(`Latest-success reference has the wrong scope: ${pointerPath}.`);
  const runId = safeSegment(value.runId, "runId");
  if (value.manifest.path !== ["runs", runId, "manifest.json"].join("/")) throw new Error(`Latest-success reference has an invalid manifest path: ${pointerPath}.`);
  const manifest = await resolveArtifactRun(store, value.manifest, { buildId, operation });
  if (manifest.runId !== runId) throw new Error(`Latest-success manifest does not match its reference: ${pointerPath}.`);
  return { pointer: value, manifest };
}
