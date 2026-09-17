import { resolve } from "node:path";
import {
  CaptureGeometrySchema,
  CaptureCleanupSchema,
  CaptureChunkOutcomesSchema,
  CaptureSweepCleanupSchema,
  CaptureTileCheckpointSchema,
  CapturePlanSchema,
  CaptureRasterSchema,
  CaptureReadinessSchema,
  CaptureRestorationSchema,
  CaptureSessionSchema,
  CaptureSetSchema,
  CaptureSweepSchema,
  schemaRegistry,
  type ArtifactRunInput,
  type ContentIdentity,
} from "@afallon/contracts";
import { fingerprintStep } from "@afallon/artifacts";

export interface CaptureFingerprintInput {
  readonly buildId: string;
  readonly diagnosticRevision: string;
  readonly character: string;
  readonly policy: string;
  readonly plan: ContentIdentity;
  readonly profile: ContentIdentity;
  readonly survey: ContentIdentity | null;
  readonly evidence?: Readonly<Record<string, ContentIdentity>>;
  readonly settings?: Readonly<Record<string, unknown>>;
}

export async function captureRunInput(input: CaptureFingerprintInput): Promise<ArtifactRunInput> {
  const schemas = [
    CaptureGeometrySchema,
  CaptureCleanupSchema,
  CaptureChunkOutcomesSchema,
  CaptureSweepCleanupSchema,
  CaptureTileCheckpointSchema,
    CapturePlanSchema,
    CaptureRasterSchema,
    CaptureReadinessSchema,
    CaptureRestorationSchema,
    CaptureSessionSchema,
    CaptureSetSchema,
    CaptureSweepSchema,
  ].map(schema => schemaRegistry.identify(schema)).map(schema => ({ id: schema.id, sha256: schema.sha256 })).sort((left, right) => left.id.localeCompare(right.id));
  const settings = { character: input.character, policy: input.policy, ...input.settings };
  const inputs: Record<string, ContentIdentity> = { ...input.evidence, plan: input.plan, profile: input.profile };
  if (input.survey !== null) inputs.survey = input.survey;
  const fingerprint = await fingerprintStep({
    entrypoint: resolve(import.meta.dir, "capture-step.ts"),
    buildId: input.buildId,
    settings,
    schemas,
    inputs,
  });
  return {
    buildId: input.buildId,
    operation: "capture",
    settings,
    schemas,
    implementationFingerprint: fingerprint.implementation,
    cacheKey: fingerprint.cacheKey,
    probeHashes: fingerprint.probeHashes,
    diagnosticRevision: input.diagnosticRevision,
    inputs,
  };
}
