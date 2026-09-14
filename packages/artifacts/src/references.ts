import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import {
  ArtifactLatestSuccessSchema,
  ArtifactRunManifestSchema,
  type ArtifactLatestSuccess,
  type ArtifactRunManifest,
} from "@afallon/contracts";
import { ArtifactStore } from "./store";

export async function selectLatestSuccess(store: ArtifactStore, manifestPath: string): Promise<ArtifactLatestSuccess> {
  const manifestBytes = await readFile(manifestPath);
  const manifestValue: unknown = JSON.parse(manifestBytes.toString("utf8"));
  Assert(ArtifactRunManifestSchema, manifestValue);
  if (manifestValue.status !== "succeeded") throw new Error(`Run ${manifestValue.runId} is not successful and cannot be selected.`);
  const expectedManifestPath = path.join(store.root, "runs", manifestValue.runId, "manifest.json");
  if (path.resolve(manifestPath) !== expectedManifestPath) throw new Error(`Run manifest is outside its immutable run location: ${manifestPath}.`);
  for (const output of manifestValue.outputs) await store.verify(output.content);

  const buildId = safeSegment(manifestValue.input.buildId, "buildId");
  const operation = safeSegment(manifestValue.input.operation, "operation");
  const referenceDirectory = path.join(store.root, "refs", buildId, operation);
  await mkdir(referenceDirectory, { recursive: true });
  const pointer: ArtifactLatestSuccess = {
    schemaVersion: "compendium.artifact-latest-success.v1",
    buildId,
    operation,
    runId: manifestValue.runId,
    manifest: {
      path: ["runs", manifestValue.runId, "manifest.json"].join("/"),
      sha256: createHash("sha256").update(manifestBytes).digest("hex"),
      bytes: manifestBytes.byteLength,
    },
    selectedAt: new Date().toISOString(),
  };
  await atomicReplaceJson(path.join(referenceDirectory, "latest-success.json"), pointer);
  return pointer;
}

export interface SelectedArtifactRun {
  readonly pointer: ArtifactLatestSuccess;
  readonly manifest: ArtifactRunManifest;
}

export async function readLatestSuccess(store: ArtifactStore, buildId: string, operation: string): Promise<SelectedArtifactRun | null> {
  const pointerPath = path.join(store.root, "refs", safeSegment(buildId, "buildId"), safeSegment(operation, "operation"), "latest-success.json");
  let value: unknown;
  try {
    value = JSON.parse(await readFile(pointerPath, "utf8"));
  } catch (error) {
    if (isErrno(error, "ENOENT")) return null;
    throw error;
  }
  Assert(ArtifactLatestSuccessSchema, value);
  if (value.buildId !== buildId || value.operation !== operation) throw new Error(`Latest-success reference has the wrong scope: ${pointerPath}.`);
  const expectedRelativePath = ["runs", value.runId, "manifest.json"].join("/");
  if (value.manifest.path !== expectedRelativePath) throw new Error(`Latest-success reference has an invalid manifest path: ${pointerPath}.`);
  const manifestPath = path.join(store.root, ...value.manifest.path.split("/"));
  const bytes = await readFile(manifestPath);
  const observedSha256 = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== value.manifest.bytes || observedSha256 !== value.manifest.sha256) {
    throw new Error(`Latest-success manifest integrity failed: expected ${value.manifest.bytes} bytes/${value.manifest.sha256}, observed ${bytes.byteLength} bytes/${observedSha256}.`);
  }
  const manifestValue: unknown = JSON.parse(bytes.toString("utf8"));
  Assert(ArtifactRunManifestSchema, manifestValue);
  if (manifestValue.status !== "succeeded" || manifestValue.runId !== value.runId || manifestValue.input.buildId !== buildId || manifestValue.input.operation !== operation) {
    throw new Error(`Latest-success manifest does not match its reference: ${pointerPath}.`);
  }
  for (const output of manifestValue.outputs) await store.verify(output.content);
  return { pointer: value, manifest: manifestValue };
}

async function atomicReplaceJson(destination: string, value: unknown): Promise<void> {
  const temporary = `${destination}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    const file = await open(temporary, "r");
    try {
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, destination);
    const directory = await open(path.dirname(destination), "r");
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function safeSegment(value: string, field: string): string {
  if (value.length === 0 || value === "." || value === ".." || value.includes("/") || value.includes("\\") || value.includes(":")) throw new TypeError(`${field} must be one safe path segment.`);
  return value;
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error !== null && typeof error === "object" && "code" in error && error.code === code;
}
