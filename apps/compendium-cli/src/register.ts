import { stat } from "node:fs/promises";
import { Assert } from "typebox/value";
import { ArtifactStore, beginArtifactRun, fingerprintStep, selectLatestSuccess } from "@afallon/artifacts";
import { schemaRegistry, type ContentIdentity } from "@afallon/contracts";
import { hashFile, toolRevision } from "./build";

export async function registerInput(input: {
  storeRoot: string; file: string; buildId: string; schemaId?: string; select: boolean;
}) {
  const schema = input.schemaId === undefined ? undefined : schemaRegistry.require(input.schemaId);
  const before = await stat(input.file);
  if (!before.isFile()) throw new Error("Input registration requires a regular file.");
  const expected = { sha256: await hashFile(input.file), bytes: before.size };
  const settings = { source: expected, schemaId: input.schemaId ?? null };
  const schemas = schema === undefined ? [] : [{ id: schema.id, sha256: schema.sha256 }];
  const fingerprint = await fingerprintStep({ entrypoint: import.meta.path, buildId: input.buildId, settings, schemas, inputs: {} });
  const store = new ArtifactStore(input.storeRoot);
  const run = await beginArtifactRun(store, {
    buildId: input.buildId, operation: "register", settings, schemas, inputs: {},
    diagnosticRevision: await toolRevision(), implementationFingerprint: fingerprint.implementation,
    cacheKey: fingerprint.cacheKey, probeHashes: fingerprint.probeHashes,
  });
  let object: ContentIdentity;
  try {
    object = await run.putFile(input.file);
    await run.addArtifact("source", object, { mediaType: "application/octet-stream" });
    if (object.sha256 !== expected.sha256 || object.bytes !== expected.bytes) throw new Error("The input changed during registration.");
    if (schema !== undefined) {
      const value: unknown = await Bun.file(store.objectPath(object.sha256)).json();
      Assert(schema.schema, value);
      if (value !== null && typeof value === "object" && "buildId" in value && value.buildId !== input.buildId) {
        throw new Error("The registered input belongs to another build.");
      }
    }
    await run.addArtifact("input", object, {
      mediaType: schema === undefined ? "application/octet-stream" : "application/json",
      schemaId: input.schemaId ?? null,
    });
    await run.succeed();
    if (input.select) await selectLatestSuccess(store, run.manifestPath);
    return { object: { sha256: object.sha256, bytes: object.bytes }, manifest: run.manifestIdentity, manifestPath: run.manifestPath };
  } catch (error) {
    if (run.status === "running") await run.fail(error);
    throw error;
  } finally {
    await run.release();
  }
}
