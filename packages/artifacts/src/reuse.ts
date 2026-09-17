import { canonicalJson, type ArtifactRunInput, type ArtifactRunManifest } from "@afallon/contracts";
import { readLatestSuccess, type SelectedArtifactRun } from "./references";
import { ObjectIntegrityError, type ArtifactStore } from "./store";

export async function findReusableStep(store: ArtifactStore, input: ArtifactRunInput): Promise<ArtifactRunManifest | null> {
  let selected: SelectedArtifactRun | null;
  try {
    selected = await readLatestSuccess(store, input.buildId, input.operation);
  } catch (error) {
    let cause: unknown = error;
    const seen = new Set<unknown>();
    while (cause instanceof Error && !seen.has(cause)) {
      if (cause instanceof ObjectIntegrityError) return null;
      seen.add(cause);
      cause = cause.cause;
    }
    throw error;
  }
  if (selected === null || !sameCacheInput(selected.manifest.input, input)) return null;
  return selected.manifest;
}

export function sameCacheInput(left: ArtifactRunInput, right: ArtifactRunInput): boolean {
  return left.buildId === right.buildId
    && left.operation === right.operation
    && left.implementationFingerprint === right.implementationFingerprint
    && left.cacheKey === right.cacheKey
    && canonicalJson(left.settings) === canonicalJson(right.settings)
    && canonicalJson(left.schemas) === canonicalJson(right.schemas)
    && canonicalJson(left.probeHashes) === canonicalJson(right.probeHashes)
    && canonicalJson(left.inputs) === canonicalJson(right.inputs)
    && canonicalJson([...(left.inputManifests ?? [])].sort()) === canonicalJson([...(right.inputManifests ?? [])].sort());
}
