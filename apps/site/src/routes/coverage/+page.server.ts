import type { PageServerLoad } from './$types';
import { serverMapLoader } from '$lib/server/publication';

export const load: PageServerLoad = async () => {
  const loader = serverMapLoader();
  const [coverage, registry] = await Promise.all([loader.loadCoverage(), loader.loadRegistry()]);
  return { coverage, registry };
};
