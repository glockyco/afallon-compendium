import { createHash } from "node:crypto";
import { open, readFile, realpath } from "node:fs/promises";
import * as path from "node:path";
import { Assert } from "typebox/value";
import { RunManifestSchema, canonicalJson, type ArtifactRunManifest, type ContentIdentity, type RunManifest } from "@afallon/contracts";
import { beginArtifactRun } from "./runs";
import { ArtifactStore } from "./store";

const SHA256 = /^[a-f0-9]{64}$/;

export interface LegacyImportResult {
  readonly sourceManifest: ContentIdentity;
  readonly manifest: ArtifactRunManifest;
}

export async function importLegacyRun(
  store: ArtifactStore,
  input: { manifestPath: string; manifestSha256: string; schemaIds?: Readonly<Record<string, string>> },
): Promise<LegacyImportResult> {
  if (!SHA256.test(input.manifestSha256)) throw new TypeError("The legacy manifest identity must be a lowercase SHA-256 hash.");
  const manifestPath = await realpath(input.manifestPath);
  const manifestBytes = await readFile(manifestPath);
  const observedManifestSha256 = createHash("sha256").update(manifestBytes).digest("hex");
  if (observedManifestSha256 !== input.manifestSha256) {
    throw new Error(`Legacy manifest hash mismatch: expected ${input.manifestSha256}, observed ${observedManifestSha256}.`);
  }
  const value: unknown = JSON.parse(manifestBytes.toString("utf8"));
  Assert(RunManifestSchema, value);
  if (value.status !== "succeeded") throw new Error(`Legacy run ${value.runId} is not successful.`);
  const legacyRoot = path.dirname(manifestPath);
  const sources = await preflightArtifacts(legacyRoot, value);

  const sourceManifest = await store.putBytes(manifestBytes);
  const implementationFingerprint = createHash("sha256").update(canonicalJson({
    toolRevision: value.input.toolRevision,
    inputHashes: value.input.inputHashes,
  })).digest("hex");
  const cacheKey = createHash("sha256").update(canonicalJson({ legacyManifest: sourceManifest.sha256, input: value.input })).digest("hex");
  const run = await beginArtifactRun(store, {
    buildId: value.input.buildId,
    operation: value.input.command,
    settings: value.input.settings,
    schemas: [],
    implementationFingerprint,
    cacheKey,
    probeHashes: {},
    diagnosticRevision: `legacy:${value.input.toolRevision}`,
    inputs: { legacyManifest: { sha256: sourceManifest.sha256, bytes: sourceManifest.bytes } },
  });
  try {
    for (const source of sources) {
      const object = await store.putFile(source.absolutePath);
      if (object.sha256 !== source.reference.sha256 || object.bytes !== source.reference.bytes) {
        throw new Error(`Legacy artifact changed during import: ${source.reference.path}.`);
      }
      await run.addArtifact(source.reference.path, object, {
        mediaType: mediaType(source.reference.path),
        schemaId: input.schemaIds?.[source.reference.path] ?? null,
      });
    }
  } catch (error) {
    await run.fail(error);
    throw error;
  }
  return { sourceManifest: { sha256: sourceManifest.sha256, bytes: sourceManifest.bytes }, manifest: await run.succeed() };
}

async function preflightArtifacts(legacyRoot: string, manifest: RunManifest): Promise<Array<{ absolutePath: string; reference: RunManifest["artifacts"][number] }>> {
  const sources: Array<{ absolutePath: string; reference: RunManifest["artifacts"][number] }> = [];
  const names = new Set<string>();
  for (const reference of manifest.artifacts) {
    const logicalName = safeLogicalName(reference.path);
    if (names.has(logicalName)) throw new Error(`Legacy manifest repeats artifact path ${logicalName}.`);
    names.add(logicalName);
    const absolutePath = await realpath(path.resolve(legacyRoot, ...logicalName.split("/")));
    const relative = path.relative(legacyRoot, absolutePath);
    if (relative.length === 0 || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Legacy artifact escapes its run directory: ${logicalName}.`);
    const observed = await hashFile(absolutePath);
    if (observed.bytes !== reference.bytes || observed.sha256 !== reference.sha256) {
      throw new Error(`Legacy artifact hash mismatch for ${logicalName}: expected ${reference.bytes} bytes/${reference.sha256}, observed ${observed.bytes} bytes/${observed.sha256}.`);
    }
    sources.push({ absolutePath, reference: { ...reference, path: logicalName } });
  }
  return sources;
}

async function hashFile(filePath: string): Promise<ContentIdentity> {
  const handle = await open(filePath, "r");
  try {
    const hash = createHash("sha256");
    let bytes = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      const value = chunk as Uint8Array;
      hash.update(value);
      bytes += value.byteLength;
    }
    return { sha256: hash.digest("hex"), bytes };
  } finally {
    await handle.close();
  }
}

function safeLogicalName(value: string): string {
  if (value.startsWith("/") || value.startsWith("\\")) throw new Error(`Legacy artifact path must be relative: ${value}.`);
  const parts = value.split(/[\\/]/);
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new Error(`Legacy artifact path is invalid: ${value}.`);
  return parts.join("/");
}

function mediaType(filePath: string): string {
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".sqlite")) return "application/vnd.sqlite3";
  return "application/octet-stream";
}
