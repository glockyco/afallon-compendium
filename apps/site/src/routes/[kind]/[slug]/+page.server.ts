import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { serverAtlasLoader } from '$lib/server/publication';
import type { PublicPageKind } from '@afallon/contracts/public';

export const entries: EntryGenerator = async () => {
  const loader = serverAtlasLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const routeByKind = new Map(registry.filter((entry) => entry.pages).map((entry) => [entry.kind, entry.route]));
  return indexes.entries.filter((entry) => entry.document && entry.ref.slug && routeByKind.has(entry.ref.kind))
    .map((entry) => ({ kind: routeByKind.get(entry.ref.kind)!, slug: entry.ref.slug! }));
};

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverAtlasLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind) error(404, 'This compendium kind is not published.');
  const page = indexes.entries.find((entry) => entry.ref.kind === kind.kind && entry.ref.slug === params.slug && entry.document);
  if (!page?.document) error(404, 'This compendium page is not published.');
  const resource = await loader.loadDocument(kind.kind as PublicPageKind, params.slug);
  return { kind, document: resource.document, documentPath: page.document.path, buildId: resource.buildId, catalogId: resource.catalogId, registry };
};
