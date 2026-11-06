import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';

// The static shell carries only publication identity; browser-local builds and talent facts load after mount.
export const load: PageServerLoad = async () => {
  const root = await serverMapLoader().loadRoot();
  return { identity: { catalogId: root.catalogId, buildId: root.buildId } };
};
