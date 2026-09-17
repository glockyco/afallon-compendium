import { ArtifactStore, type ObjectWriteProtection } from "@afallon/artifacts";
import { canonicalJson, type ContentIdentity } from "@afallon/contracts";
import type { StaticResourceReference } from "@afallon/contracts/public";

export interface GeneratedStaticResource<T> {
  value: T;
  identity: ContentIdentity;
  reference: StaticResourceReference;
}

export const PUBLICATION_ROOT_BUDGET = 65_536;
export const PUBLICATION_PART_BUDGET = 524_288;
export const PUBLICATION_ESSENTIAL_BUDGET = 3_300_000;

export function partitionStaticRecords<T, R>(records: readonly T[], makeValue: (records: T[], part: number) => R): R[] {
  const result: R[] = [];
  let part: T[] = [];
  let bytes = Buffer.byteLength(canonicalJson(makeValue([], 0))) + 1;
  for (const record of records) {
    const recordBytes = Buffer.byteLength(canonicalJson(record)) + 1;
    if (bytes + recordBytes > PUBLICATION_PART_BUDGET && part.length > 0) {
      result.push(makeValue(part, result.length));
      part = [];
      bytes = Buffer.byteLength(canonicalJson(makeValue([], result.length))) + 1;
    }
    if (bytes + recordBytes > PUBLICATION_PART_BUDGET) throw new Error("A public record exceeds the 512 KiB part budget.");
    part.push(record);
    bytes += recordBytes;
  }
  if (part.length > 0 || result.length === 0) result.push(makeValue(part, result.length));
  for (const value of result) if (Buffer.byteLength(canonicalJson(value)) + 1 > PUBLICATION_PART_BUDGET) throw new Error("Public resource exceeds the 512 KiB part budget.");
  return result;
}

export async function writeStaticJson<T>(store: ArtifactStore, schemaId: string, value: T, protection?: ObjectWriteProtection): Promise<GeneratedStaticResource<T>> {
  const bytes = new TextEncoder().encode(`${canonicalJson(value)}\n`);
  const stored = await store.putBytes(bytes, protection);
  return {
    value,
    identity: { sha256: stored.sha256, bytes: stored.bytes },
    reference: { path: `resources/${stored.sha256}.json`, sha256: stored.sha256, bytes: stored.bytes, schemaId },
  };
}
