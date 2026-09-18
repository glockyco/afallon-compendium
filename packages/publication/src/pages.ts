import type { DocumentReference, PublicDocument, PublicPageKind, StaticDocument, StaticPages } from "@afallon/contracts/public";
import type { GeneratedStaticResource } from "./resources";

export function buildStaticPages(
  identity: { buildId: string; catalogId: string },
  documents: ReadonlyMap<string, PublicDocument>,
  resources: ReadonlyMap<string, GeneratedStaticResource<StaticDocument>>,
): StaticPages {
  const entries = [...documents].map(([key, document]) => {
    const resource = resources.get(key);
    if (!resource) throw new Error(`Published page has no document resource: ${key}.`);
    if (!document.ref.slug) throw new Error(`Published page has no slug: ${key}.`);
    return { kind: document.ref.kind as PublicPageKind, slug: document.ref.slug, key, document: resource.reference as DocumentReference };
  }).sort((left, right) => left.kind.localeCompare(right.kind) || left.slug.localeCompare(right.slug));
  return { schemaVersion: "compendium.static-pages.v1", ...identity, entries };
}
