import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';
import { isPublicPageKind } from '@afallon/contracts/public';

export const entries: EntryGenerator = async () => {
  const registry = await serverMapLoader().loadRegistry();
  return registry.filter((entry) => entry.list).map((entry) => ({ kind: entry.route }));
};

export const load: PageServerLoad = async ({ params }) => {
  const loader = serverMapLoader();
  const registry = await loader.loadRegistry();
  const kind = registry.find((entry) => entry.list && entry.route === params.kind);
  if (!kind || (!isPublicPageKind(kind.kind) && kind.kind !== 'recipes')) error(404, 'This compendium kind is not published.');
  const list = await loader.loadList(kind.kind);
  return { kind, list };
};
