import { ArtifactStore } from "@afallon/artifacts";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import type { StaticResourceReference } from "@afallon/contracts/public";

export interface GeneratedStaticResource<T> {
  value: T;
  identity: ContentIdentity;
  reference: StaticResourceReference;
}

export async function writeStaticJson<T>(store: ArtifactStore, schemaId: string, value: T): Promise<GeneratedStaticResource<T>> {
  const bytes = new TextEncoder().encode(`${canonicalJson(value)}\n`);
  const stored = await store.putBytes(bytes);
  return {
    value,
    identity: { sha256: stored.sha256, bytes: stored.bytes },
    reference: { path: `resources/${stored.sha256}.json`, sha256: stored.sha256, bytes: stored.bytes, schemaId },
  };
}
