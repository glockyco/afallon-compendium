import { readFile } from "node:fs/promises";
import { ArtifactStore, beginArtifactRun, fingerprintStep } from "@afallon/artifacts";
import {
  GameUpdateReceiptSchema,
  canonicalJson,
  schemaRegistry,
  type CompendiumConfig,
  type GameUpdateReceipt,
} from "@afallon/contracts";
import { Assert } from "typebox/value";
import { buildIdentity, toolRevision } from "./build";
import { runSteamUpdate, type SteamUpdateResult } from "./update";

interface InstallationIdentity {
  readonly buildId: string;
  readonly inputHashes: Readonly<Record<string, string>>;
}

async function logBytes(path: string, offset: number, endOffset: number): Promise<Uint8Array> {
  if (endOffset < offset) throw new Error("Steam log evidence has an inverted byte range.");
  const bytes = await readFile(path);
  if (bytes.byteLength < endOffset) throw new Error(`Steam log became shorter before receipt registration: ${path}.`);
  return bytes.subarray(offset, endOffset);
}

export async function runGameUpdate(input: {
  readonly config: CompendiumConfig;
  readonly releaseVersion: string;
  readonly update?: () => Promise<SteamUpdateResult>;
  readonly identify?: () => Promise<InstallationIdentity>;
  readonly revision?: () => Promise<string>;
  readonly recordedAt?: () => string;
}) {
  const identify = input.identify ?? (() => buildIdentity(input.config));
  const previousIdentity = await identify();
  const result = await (input.update ?? (() => runSteamUpdate({ config: input.config, releaseVersion: input.releaseVersion })))();
  if (result.releaseVersion !== input.releaseVersion) throw new Error("Steam update result has another release version.");
  if (result.previous.buildId !== previousIdentity.buildId) throw new Error("Initial installation identity changed before Steam update admission.");
  const currentIdentity = await identify();
  if (result.current.buildId !== currentIdentity.buildId) throw new Error("Final installation identity does not match the Steam update result.");

  const store = new ArtifactStore(input.config.outputRoot);
  const registeredSchema = schemaRegistry.identify(GameUpdateReceiptSchema);
  const schema = { id: registeredSchema.id, sha256: registeredSchema.sha256 };
  const settings = {
    releaseVersion: input.releaseVersion,
    previousBuildId: previousIdentity.buildId,
    currentBuildId: currentIdentity.buildId,
  };
  const fingerprint = await fingerprintStep({ entrypoint: import.meta.path, buildId: currentIdentity.buildId, settings, schemas: [schema], inputs: {} });
  const run = await beginArtifactRun(store, {
    buildId: currentIdentity.buildId,
    operation: "update",
    settings,
    schemas: [schema],
    inputs: {},
    diagnosticRevision: await (input.revision ?? toolRevision)(),
    implementationFingerprint: fingerprint.implementation,
    cacheKey: fingerprint.cacheKey,
    probeHashes: fingerprint.probeHashes,
  });
  try {
    const connectionLog = await run.putBytes(await logBytes(
      result.evidence.connectionLog.path,
      result.evidence.connectionLog.offset,
      result.evidence.connectionLog.endOffset,
    ));
    await run.addArtifact("connection-log", connectionLog, { mediaType: "text/plain" });
    const contentLog = await run.putBytes(await logBytes(
      result.evidence.contentLog.path,
      result.evidence.contentLog.offset,
      result.evidence.contentLog.endOffset,
    ));
    await run.addArtifact("content-log", contentLog, { mediaType: "text/plain" });

    const receipt: GameUpdateReceipt = {
      schemaVersion: "compendium.game-update-receipt.v1",
      releaseVersion: input.releaseVersion,
      recordedAt: (input.recordedAt ?? (() => new Date().toISOString()))(),
      updated: result.updated,
      previous: { manifest: result.previous, inputHashes: { ...previousIdentity.inputHashes } },
      current: { manifest: result.current, inputHashes: { ...currentIdentity.inputHashes } },
      evidence: {
        connectionLog: {
          content: { sha256: connectionLog.sha256, bytes: connectionLog.bytes },
          offset: result.evidence.connectionLog.offset,
          endOffset: result.evidence.connectionLog.endOffset,
        },
        contentLog: {
          content: { sha256: contentLog.sha256, bytes: contentLog.bytes },
          offset: result.evidence.contentLog.offset,
          endOffset: result.evidence.contentLog.endOffset,
          result: result.evidence.contentLog.result,
        },
      },
    };
    Assert(GameUpdateReceiptSchema, receipt);
    const object = await run.putBytes(new TextEncoder().encode(`${canonicalJson(receipt)}\n`));
    await run.addArtifact("update-receipt", object, {
      mediaType: "application/json",
      schemaId: schema.id,
      references: [connectionLog, contentLog].map(content => ({ kind: "object" as const, content })),
    });
    const manifest = await run.succeed();
    return {
      ...result,
      receipt,
      object: { sha256: object.sha256, bytes: object.bytes },
      manifest: run.manifestIdentity!,
      manifestPath: run.manifestPath,
      run: manifest,
    };
  } catch (error) {
    if (run.status === "running") await run.fail(error);
    throw error;
  } finally {
    await run.release();
  }
}
