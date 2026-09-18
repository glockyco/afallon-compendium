import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { serverAtlasLoader } from '$lib/server/publication';

export const entries: EntryGenerator = async () => {
  const loader = serverAtlasLoader();
  const [registry, pages] = await Promise.all([loader.loadRegistry(), loader.loadPages()]);
  const routeByKind = new Map(registry.filter((entry) => entry.pages).map((entry) => [entry.kind, entry.route]));
  return pages.entries.map((entry) => ({ kind: routeByKind.get(entry.kind) ?? entry.kind, slug: entry.slug }));
};

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverAtlasLoader();
  const [registry, pages] = await Promise.all([loader.loadRegistry(), loader.loadPages()]);
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind) error(404, 'This compendium kind is not published.');
  const page = pages.entries.find((entry) => entry.kind === kind.kind && entry.slug === params.slug);
  if (!page) error(404, 'This compendium page is not published.');
  const resource = await loader.loadDocument(page.kind, page.slug);
  return { kind, document: resource.document, documentPath: page.document.path, buildId: resource.buildId, catalogId: resource.catalogId, registry };
};
