import type { PageServerLoad } from './$types';
import { serverAtlasLoader } from '$lib/server/publication';

export const load: PageServerLoad = async () => {
  const loader = serverAtlasLoader();
  const [coverage, registry] = await Promise.all([loader.loadCoverage(), loader.loadRegistry()]);
  return { coverage, registry };
};
