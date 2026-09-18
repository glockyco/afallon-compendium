import type { PageServerLoad } from './$types';
import { serverAtlasLoader } from '$lib/server/publication';

export const load: PageServerLoad = async () => {
  const loader = serverAtlasLoader();
  const [root, coverage, registry] = await Promise.all([loader.loadRoot(), loader.loadCoverage(), loader.loadRegistry()]);
  return { mode: root.mode, coverage, registry };
};
