import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { serverAtlasLoader } from '$lib/server/publication';
import type { PublicPageKind } from '@afallon/contracts/public';

export const entries: EntryGenerator = async () => {
  const registry = await serverAtlasLoader().loadRegistry();
  return registry.filter((entry) => entry.pages).map((entry) => ({ kind: entry.route }));
};

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverAtlasLoader();
  const registry = await loader.loadRegistry();
  const kind = registry.find((entry) => entry.pages && entry.route === params.kind);
  if (!kind) error(404, 'This compendium kind is not published.');
  const list = await loader.loadList(kind.kind as PublicPageKind);
  return { kind, list, registry };
};
