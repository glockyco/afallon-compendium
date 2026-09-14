import { canonicalJson, type ArtifactRunInput, type ArtifactRunManifest } from "@afallon/contracts";
import { readLatestSuccess, type SelectedArtifactRun } from "./references";
import { ObjectIntegrityError, type ArtifactStore } from "./store";

export async function findReusableStep(store: ArtifactStore, input: ArtifactRunInput): Promise<ArtifactRunManifest | null> {
  let selected: SelectedArtifactRun | null;
  try {
    selected = await readLatestSuccess(store, input.buildId, input.operation);
  } catch (error) {
    if (error instanceof ObjectIntegrityError) return null;
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
    && canonicalJson(left.inputs) === canonicalJson(right.inputs);
}
