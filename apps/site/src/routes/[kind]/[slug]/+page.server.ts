import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';
import { isPublicPageKind } from '@afallon/contracts/public';

export const entries: EntryGenerator = async () => {
  const loader = serverMapLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const routeByKind = new Map(registry.filter((entry) => entry.pages).map((entry) => [entry.kind, entry.route]));
  return indexes.entries.filter((entry) => entry.document && entry.ref.slug && routeByKind.has(entry.ref.kind))
    .map((entry) => ({ kind: routeByKind.get(entry.ref.kind)!, slug: entry.ref.slug! }));
};

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverMapLoader();
  const [registry, indexes] = await Promise.all([loader.loadRegistry(), loader.loadIndexes()]);
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind || !isPublicPageKind(kind.kind)) error(404, 'This compendium kind is not published.');
  const entry = indexes.entries.find((candidate) => candidate.ref.kind === kind.kind && candidate.ref.slug === params.slug && candidate.document);
  if (!entry?.document) error(404, 'This compendium page is not published.');
  const page = await loader.loadDocument(kind.kind, params.slug);
  return { kind, page, documentPath: entry.document.path };
};
