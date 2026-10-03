import { serverMapLoader } from './publication';

/** The list pages that the publication registers, one per kind with a list. */
export async function listPageEntries(): Promise<Array<{ kind: string }>> {
  const registry = await serverMapLoader().loadRegistry();
  return registry.filter((entry) => entry.list).map((entry) => ({ kind: entry.route }));
}

/** The entity pages that the publication registers: every indexed entry with a document and a slug of a kind with pages. */
export async function entityPageEntries(): Promise<Array<{ kind: string; slug: string }>> {
  const loader = serverMapLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const routeByKind = new Map(registry.filter((entry) => entry.pages).map((entry) => [entry.kind, entry.route]));
  return indexes.entries.filter((entry) => entry.document && entry.ref.slug && routeByKind.has(entry.ref.kind))
    .map((entry) => ({ kind: routeByKind.get(entry.ref.kind)!, slug: entry.ref.slug! }));
}
